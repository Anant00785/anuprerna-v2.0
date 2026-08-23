#!/usr/bin/env node

/**
 * Generate shareable links for Cloudflare Tunnel
 * Usage: node scripts/cloudflare-share.mjs <tunnel-url>
 */

const tunnelUrl = process.argv[2] || 'https://corner-dome-movies-moment.trycloudflare.com';

const shareLinks = {
  swaggerUi: `${tunnelUrl}/docs`,
  swaggerUiAlt1: `${tunnelUrl}/swagger`,
  swaggerUiAlt2: `${tunnelUrl}/api-docs`,
  openApiJson: `${tunnelUrl}/docs-json`,
  swaggerEditor: `https://editor.swagger.io/?url=${encodeURIComponent(tunnelUrl + '/docs-json')}`,
  redoc: `https://redoc.ly/?url=${encodeURIComponent(tunnelUrl + '/docs-json')}`,
  swaggerHub: `https://app.swaggerhub.com/?url=${encodeURIComponent(tunnelUrl + '/docs-json')}`,
};

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║     🌐 ANUPRERNA API - CLOUDFLARE TUNNEL SHARE LINKS 🌐       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log(`📍 Public API URL (via Cloudflare Tunnel):`);
console.log(`   🔗 ${tunnelUrl}\n`);

console.log('📖 SWAGGER UI ENDPOINTS:');
console.log(`   🔵 Primary:     ${shareLinks.swaggerUi}`);
console.log(`   🔵 Alternative: ${shareLinks.swaggerUiAlt1}`);
console.log(`   🔵 Alternative: ${shareLinks.swaggerUiAlt2}\n`);

console.log('📄 OPENAPI SPECIFICATION:');
console.log(`   🔗 ${shareLinks.openApiJson}\n`);

console.log('🌐 ONLINE DOCUMENTATION VIEWERS:');
console.log(`   1️⃣  Swagger Editor (Interactive):`);
console.log(`       🔗 ${shareLinks.swaggerEditor}\n`);
console.log(`   2️⃣  ReDoc (Beautiful Docs):`);
console.log(`       🔗 ${shareLinks.redoc}\n`);
console.log(`   3️⃣  SwaggerHub (Collaborative):`);
console.log(`       🔗 ${shareLinks.swaggerHub}\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 QUICK SHARE TEXT:\n');
const shareText = `
✨ Anuprerna API v2.0 - Now Publicly Available!

📖 Access Swagger UI: ${shareLinks.swaggerUi}
📄 OpenAPI Spec: ${shareLinks.openApiJson}

🔐 Quick Start:
   1. Visit: ${shareLinks.swaggerUi}
   2. Try endpoints directly in browser
   3. Login endpoint: POST /auth/login or /auth/authenticate

🌐 Alternative Viewers:
   - Swagger Editor: ${shareLinks.swaggerEditor}
   - ReDoc: ${shareLinks.redoc}
   - SwaggerHub: ${shareLinks.swaggerHub}

📚 Documentation: See SWAGGER_QUICK_START.md for full guide
🚀 Status: Live on Cloudflare Tunnel
⏱️  Availability: Temporary (while tunnel is running)
`.trim();
console.log(shareText);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('🔗 COPY-PASTE LINKS BY USE CASE:\n');

console.log('🎯 For Team Slack:');
console.log(`  API Docs: ${shareLinks.swaggerUi}`);
console.log(`  OpenAPI: ${shareLinks.openApiJson}\n`);

console.log('🎯 For Email:');
console.log(`  Subject: Anuprerna API v2.0 Documentation`);
console.log(`  Body: ${shareLinks.swaggerUi}\n`);

console.log('🎯 For GitHub README:');
console.log(`  📖 [API Documentation](${shareLinks.swaggerUi})`);
console.log(`  📄 [OpenAPI Spec](${shareLinks.openApiJson})\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('💡 QUICK TIPS:\n');
console.log('✅ Authentication:');
console.log('   1. POST /auth/login with email & password');
console.log('   2. Get JWT token from response');
console.log('   3. Click "Authorize" in Swagger UI');
console.log('   4. Paste token to access protected endpoints\n');

console.log('✅ Available Endpoints (11 Tags):');
console.log('   • Health - Server status');
console.log('   • Authentication - Login & registration');
console.log('   • Cart - Shopping cart');
console.log('   • Product - Product catalog');
console.log('   • Inventory - Stock management');
console.log('   • Order - Order processing');
console.log('   • Payment - Payment gateway');
console.log('   • User - User profiles');
console.log('   • Content - Blog & stories');
console.log('   • Search - Search & filtering');
console.log('   • Admin - Administrative\n');

console.log('⚠️  IMPORTANT NOTES:\n');
console.log('   • This tunnel uses free Cloudflare tier');
console.log('   • No uptime guarantee (subject to terms)');
console.log('   • Link expires when tunnel is closed');
console.log('   • For production, use named Cloudflare tunnel');
console.log('   • See: https://developers.cloudflare.com/cloudflare-one/\n');

console.log('═════════════════════════════════════════════════════════════════\n');
