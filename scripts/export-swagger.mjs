#!/usr/bin/env node

/**
 * Export OpenAPI spec from running API and generate shareable links
 * Usage: node scripts/export-swagger.mjs [--host localhost:3000]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const apiDir = path.join(rootDir, 'apps', 'api');

const host = process.argv[2]?.replace('--host=', '') || 'localhost:3000';
const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
const apiUrl = `${protocol}://${host}`;

console.log(`📚 Exporting Swagger from ${apiUrl}...`);

async function exportSwagger() {
  try {
    // Fetch the JSON spec
    const response = await fetch(`${apiUrl}/docs-json`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Swagger spec: ${response.status} ${response.statusText}`);
    }

    const spec = await response.json();

    // Create export directory
    const exportDir = path.join(apiDir, 'swagger-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Save the spec
    const specPath = path.join(exportDir, 'openapi.json');
    fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
    console.log(`✅ Saved OpenAPI spec to ${specPath}`);

    // Generate share links
    const shareLinks = generateShareLinks(apiUrl, spec);
    const linksPath = path.join(exportDir, 'SHARE_LINKS.md');
    fs.writeFileSync(linksPath, shareLinks);
    console.log(`✅ Generated share links at ${linksPath}\n`);

    console.log('📖 SWAGGER SHARE LINKS:\n');
    console.log(shareLinks);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function generateShareLinks(apiUrl, spec) {
  const specUrl = `${apiUrl}/docs-json`;
  const specUrlEncoded = encodeURIComponent(specUrl);
  
  const lines = [
    '# Swagger/OpenAPI Share Links',
    '',
    `**API Version:** ${spec.info?.version || 'unknown'}`,
    `**Title:** ${spec.info?.title || 'API'}`,
    `**Description:** ${spec.info?.description || 'No description'}`,
    '',
    '## Quick Access',
    '',
    `- **Swagger UI (Local):** ${apiUrl}/docs`,
    `- **Swagger UI (Alt):** ${apiUrl}/swagger`,
    `- **OpenAPI JSON:** ${specUrl}`,
    '',
    '## Online Viewers (Paste spec URL)',
    '',
    `- **SwaggerUI.com** https://swagger.io/tools/swagger-ui/`,
    `  Copy-paste this URL into "Explore": ${specUrl}`,
    '',
    `- **Redoc** https://redoc.ly/`,
    `  Import spec URL: ${specUrl}`,
    '',
    `- **Swagger Editor** https://editor.swagger.io/`,
    `  File → Import URL → ${specUrl}`,
    '',
    '## Direct Share Links',
    '',
    `- **SwaggerHub (requires account):**`,
    `  https://app.swaggerhub.com/?url=${specUrlEncoded}`,
    '',
    '## Export & Documentation',
    '',
    `- **OpenAPI JSON File:** ${specUrl}`,
    '',
    '## Available Endpoints by Tag',
    '',
  ];

  if (spec.tags && Array.isArray(spec.tags)) {
    spec.tags.forEach(tag => {
      lines.push(`- **${tag.name}:** ${tag.description || 'No description'}`);
    });
  }

  lines.push('');
  lines.push('## Setup Instructions for Sharing');
  lines.push('');
  lines.push('1. **Local Development:** Start the API server');
  lines.push('   ```bash');
  lines.push('   cd apps/api');
  lines.push('   pnpm dev');
  lines.push('   ```');
  lines.push('');
  lines.push('2. **Access Swagger UI:** Open http://localhost:3000/docs in browser');
  lines.push('');
  lines.push('3. **Share Remote URL:** Deploy API and replace `localhost:3000` with your domain');
  lines.push('');
  lines.push('---');
  lines.push(`Generated: ${new Date().toISOString()}`);

  return lines.join('\n');
}

// Run the export
exportSwagger();
