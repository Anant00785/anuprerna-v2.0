// Simple seed script without ES module issues
const { randomBytes, scrypt } = require('crypto');
const { promisify } = require('util');
const postgres = require('postgres');

const scryptAsync = promisify(scrypt);

async function hashPassword(plainText) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(plainText, salt, 64);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

async function seedDatabase() {
  try {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://loom@127.0.0.1:7777/loom';
    const client = postgres(databaseUrl, { max: 1 });
    
    console.log('🔧 Seeding database with test user...');
    
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    const hashedPassword = await hashPassword(testPassword);
    
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password:', testPassword);
    console.log('🔐 Hashed password:', hashedPassword);
    
    // Check if user exists
    const existingUsers = await client`SELECT id FROM loom_tenant WHERE email = ${testEmail}`;
    
    if (existingUsers.length > 0) {
      console.log('✅ User exists, updating password...');
      await client`UPDATE loom_tenant SET 
        user_password = ${hashedPassword},
        email_verified = true,
        active = true,
        suspended = false,
        banned = false,
        deleted = false,
        provider = 'BASIC',
        last_access_time = ${BigInt(Date.now())}
        WHERE email = ${testEmail}`;
      
      // Add roles if not exist
      try {
        await client`INSERT INTO user_role (user_id, role) VALUES (${existingUsers[0].id}, 'ROLE_CUSTOMER')`;
        console.log('✅ Added ROLE_CUSTOMER');
      } catch (e) {
        console.log('ℹ️ ROLE_CUSTOMER may already exist');
      }
      
      try {
        await client`INSERT INTO user_role (user_id, role) VALUES (${existingUsers[0].id}, 'ROLE_SUPER_USER')`;
        console.log('✅ Added ROLE_SUPER_USER');
      } catch (e) {
        console.log('ℹ️ ROLE_SUPER_USER may already exist');
      }
      
      console.log('✅ Updated existing user successfully!');
    } else {
      console.log('🆕 Creating new test user...');
      
      // Get next ID
      let newId = 157423403;
      try {
        const result = await client`SELECT nextval('loom_tenant_id_seq'::regclass) as id`;
        newId = result[0]?.id || 157423403;
      } catch (e) {
        const result = await client`SELECT COALESCE(MAX(id), 0) + 1 as id FROM loom_tenant`;
        newId = result[0]?.id || 157423403;
      }
      
      let newVersion = 1926;
      try {
        const result = await client`SELECT nextval('loom_tenant_version_seq'::regclass) as version`;
        newVersion = result[0]?.version || 1926;
      } catch (e) {
        const result = await client`SELECT COALESCE(MAX(version), 0) + 1 as version FROM loom_tenant`;
        newVersion = result[0]?.version || 1926;
      }
      
      // Insert user
      await client`INSERT INTO loom_tenant (id, version, loom_id, email, email_verified, contact_number, contact_number_verified, user_password, creation_time, active, suspended, banned, ban_date, ban_uplift_date, deleted, user_name, dob, gender, last_access_time, profile_image_url, provider, user_type) 
        VALUES (${newId}, ${newVersion}, 'test_dev_${Date.now()}', ${testEmail}, true, '', false, ${hashedPassword}, ${BigInt(Date.now())}, true, false, false, 0, 0, false, 'Test Dev User', 0, 'MALE', ${BigInt(Date.now())}, 'default-display-picture.svg', 'BASIC', 'registered')`;
      
      console.log('✅ Created new user with ID:', newId);
      
      // Add roles
      await client`INSERT INTO user_role (user_id, role) VALUES (${newId}, 'ROLE_CUSTOMER')`;
      await client`INSERT INTO user_role (user_id, role) VALUES (${newId}, 'ROLE_SUPER_USER')`;
      console.log('✅ Added roles to user');
    }
    
    await client.end();
    console.log('\n🎉 Database seed completed successfully!');
    console.log('Test credentials:');
    console.log('  Email: test@example.com');
    console.log('  Password: password123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedDatabase();