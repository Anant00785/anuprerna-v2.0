import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import * as schema from "./src/database/schema/index.js";

const scrypt = promisify(scryptCb);

// Use the same password hashing algorithm as GatekeeperService
async function hashPassword(plainText) {
  const salt = randomBytes(16);
  const derived = await scrypt(plainText, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function checkDatabaseState(db) {
  console.log("🔍 Checking database state...");
  
  // Check if there are any users in loom_tenant
  const users = await db.select({
    id: schema.loomTenant.id,
    email: schema.loomTenant.email,
    userPassword: schema.loomTenant.userPassword,
    userName: schema.loomTenant.userName,
    active: schema.loomTenant.active,
    suspended: schema.loomTenant.suspended,
    banned: schema.loomTenant.banned,
    deleted: schema.loomTenant.deleted
  }).from(schema.loomTenant).limit(10);
  
  console.log(`Found ${users.length} users in loom_tenant table:`);
  users.forEach((user, index) => {
    console.log(`${index + 1}. Email: ${user.email}, Username: ${user.userName}`);
    console.log(`   Active: ${user.active}, Suspended: ${user.suspended}, Banned: ${user.banned}, Deleted: ${user.deleted}`);
    console.log(`   Password: ${user.userPassword ? 'NOT NULL' : 'NULL/empty'}`);
    if (user.userPassword) {
      console.log(`   Password length: ${user.userPassword.length}`);
      console.log(`   Password format valid: ${user.userPassword.includes(':') ? 'YES' : 'NO'}`);
    }
  });
  
  // Check if any user has a valid password format
  const usersWithValidPassword = users.filter(user => user.userPassword && user.userPassword.includes(':'));
  console.log(`\nUsers with valid password format (salt:hash): ${usersWithValidPassword.length}`);
  
  // Check for any active users with valid passwords
  const activeUsersWithValidPassword = users.filter(user => 
    user.userPassword && 
    user.userPassword.includes(':') && 
    user.active && 
    !user.suspended && 
    !user.banned && 
    !user.deleted
  );
  console.log(`Active users with valid passwords: ${activeUsersWithValidPassword.length}`);
  
  return activeUsersWithValidPassword.length > 0;
}

async function createUserRole(db, userId, role) {
  try {
    await db.insert(schema.userRole).values({
      userId: BigInt(userId),
      role: role
    });
    console.log(`✅ Added role ${role} to user ${userId}`);
  } catch (error) {
    console.log(`⚠️  Could not add role ${role} to user ${userId}: ${error.message}`);
  }
}

async function seedDevUser() {
  try {
    const databaseUrl = process.env.DATABASE_URL || "postgresql://loom@127.0.0.1:7777/loom";
    const client = postgres(databaseUrl, { max: 1 });
    const db = drizzle(client, { schema });
    
    console.log("🚀 Starting development seed process...");
    
    // First check if database already has valid users
    const hasValidUsers = await checkDatabaseState(db);
    
    if (hasValidUsers) {
      console.log("\n✅ Database already has valid users with passwords. No seeding needed.");
      await client.end();
      return {
        message: "Database already has valid users",
        action: "none"
      };
    }
    
    console.log("\n🛠️  No valid users found. Creating development test user...");
    
    // Test credentials
    const testEmail = "test@example.com";
    const testPassword = "password123";
    const hashedPassword = await hashPassword(testPassword);
    
    console.log("Test email:", testEmail);
    console.log("Test password:", testPassword);
    console.log("Hashed password:", hashedPassword);
    
    // Check if user already exists
    const existingUser = await db.select({
      id: schema.loomTenant.id,
      email: schema.loomTenant.email
    }).from(schema.loomTenant)
    .where(eq(schema.loomTenant.email, testEmail))
    .limit(1);
    
    if (existingUser.length > 0) {
      console.log("User already exists, updating with valid password...");
      
      // Update existing user's password and ensure they're active
      await db.update(schema.loomTenant)
        .set({
          userPassword: hashedPassword,
          emailVerified: true,
          active: true,
          suspended: false,
          banned: false,
          deleted: false,
          provider: 'BASIC',
          lastAccessTime: BigInt(Date.now())
        })
        .where(eq(schema.loomTenant.email, testEmail));
      
      console.log("✅ Updated existing user with valid password");
      
      // Ensure the user has a role
      await createUserRole(db, Number(existingUser[0].id), "ROLE_CUSTOMER");
      await createUserRole(db, Number(existingUser[0].id), "ROLE_SUPER_USER");
      
      await client.end();
      
      return {
        email: testEmail,
        password: testPassword,
        hashedPassword: hashedPassword,
        action: "updated",
        userId: existingUser[0].id
      };
    } else {
      console.log("Creating new test user...");
      
      // Get next sequence values - try to get them, fallback if sequences don't exist
      let newId, newVersion;
      try {
        const idResult = await client`SELECT nextval('loom_tenant_id_seq'::regclass) as id`;
        const versionResult = await client`SELECT nextval('loom_tenant_version_seq'::regclass) as version`;
        newId = idResult[0]?.id || 157423403;
        newVersion = versionResult[0]?.version || 1926;
      } catch (seqError) {
        console.log("⚠️  Could not get sequence values, using fallbacks:", seqError.message);
        // Try to find the max ID and version from the table
        try {
          const maxIdResult = await client`SELECT COALESCE(MAX(id), 0) + 1 as id FROM loom_tenant`;
          const maxVersionResult = await client`SELECT COALESCE(MAX(version), 0) + 1 as version FROM loom_tenant`;
          newId = maxIdResult[0]?.id || 157423403;
          newVersion = maxVersionResult[0]?.version || 1926;
        } catch (maxError) {
          console.log("⚠️  Could not query max values, using hardcoded fallbacks:", maxError.message);
          newId = 157423403;
          newVersion = 1926;
        }
      }
      
      // Insert new test user
      await db.insert(schema.loomTenant).values({
        id: BigInt(newId),
        version: BigInt(newVersion),
        loomId: `test_dev_${Date.now()}`,
        email: testEmail,
        emailVerified: true,
        contactNumber: "",
        contactNumberVerified: false,
        userPassword: hashedPassword,
        creationTime: BigInt(Date.now()),
        active: true,
        suspended: false,
        banned: false,
        banDate: BigInt(0),
        banUpliftDate: BigInt(0),
        deleted: false,
        userName: "Test Dev User",
        dob: BigInt(0),
        gender: "MALE",
        lastAccessTime: BigInt(Date.now()),
        profileImageUrl: "default-display-picture.svg",
        provider: "BASIC",
        userType: "registered"
      });
      
      console.log("✅ Created new test user with ID:", newId);
      
      // Add roles to the user
      await createUserRole(db, newId, "ROLE_CUSTOMER");
      await createUserRole(db, newId, "ROLE_SUPER_USER");
      
      await client.end();
      
      return {
        email: testEmail,
        password: testPassword,
        hashedPassword: hashedPassword,
        action: "created",
        userId: newId
      };
    }
    
  } catch (error) {
    console.error("❌ Error seeding development user:", error);
    throw error;
  }
}

// Run the seed process and output the results in a format that can be easily parsed
seedDevUser()
  .then(result => {
    console.log("\n🎯 Development seed completed successfully!");
    if (result.action !== "none") {
      console.log(`📧 Email: ${result.email}`);
      console.log(`🔑 Password: ${result.password}`);
      console.log(`🛡️  User ID: ${result.userId}`);
      console.log(`🔐 Action: ${result.action}`);
    }
  })
  .catch(error => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });