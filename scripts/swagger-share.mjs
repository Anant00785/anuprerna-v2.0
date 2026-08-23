#!/usr/bin/env node

/**
 * Quick command to generate and copy Swagger share link to clipboard
 * Usage: npm run swagger:share [host]
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Handle arguments properly
let host = 'localhost:3000';
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--host=')) {
    host = arg.replace('--host=', '');
  } else if (arg.startsWith('--host')) {
    // Handle: --host localhost:3000
    const idx = process.argv.indexOf(arg);
    if (idx + 1 < process.argv.length) {
      host = process.argv[idx + 1];
    }
  }
}

const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
const apiUrl = `${protocol}://${host}`;

const swaggerLinks = {
  local: `${apiUrl}/docs`,
  json: `${apiUrl}/docs-json`,
  swaggerEditor: `https://editor.swagger.io/?url=${encodeURIComponent(apiUrl + '/docs-json')}`,
  redoc: `https://redoc.ly/?url=${encodeURIComponent(apiUrl + '/docs-json')}`,
};

async function generateShareLink() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         🚀 ANUPRERNA API - SWAGGER SHARE LINKS 🚀          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`📍 API Host: ${apiUrl}\n`);

  console.log('📖 SWAGGER UI (Direct Access):');
  console.log(`   🔗 ${swaggerLinks.local}\n`);

  console.log('📄 OPENAPI JSON SPEC:');
  console.log(`   🔗 ${swaggerLinks.json}\n`);

  console.log('🌐 ONLINE DOCUMENTATION VIEWERS:');
  console.log(`   1️⃣  Swagger Editor:\n      🔗 ${swaggerLinks.swaggerEditor}\n`);
  console.log(`   2️⃣  ReDoc:\n      🔗 ${swaggerLinks.redoc}\n`);

  console.log('📋 QUICK SHARE:');
  const shareText = `
✨ Anuprerna API v2.0 Documentation

📖 Access Swagger UI: ${swaggerLinks.local}
📄 OpenAPI Spec: ${swaggerLinks.json}

🔐 Authentication: Use /auth/login to get JWT token
📚 Full Docs: ${process.argv[3] || 'See team Slack for details'}
  `.trim();
  console.log(shareText);
  console.log('\n---\n');

  // Try to copy to clipboard if available
  try {
    if (process.platform === 'win32') {
      await execAsync(`echo ${JSON.stringify(swaggerLinks.local)} | clip`);
      console.log('✅ Primary link copied to clipboard!');
    } else if (process.platform === 'darwin') {
      await execAsync(`echo '${swaggerLinks.local}' | pbcopy`);
      console.log('✅ Primary link copied to clipboard!');
    }
  } catch {
    console.log('💡 Tip: Right-click any link above to copy to clipboard');
  }

  console.log('\n');
}

generateShareLink().catch(console.error);
