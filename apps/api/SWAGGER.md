# 📚 Anuprerna API - Swagger/OpenAPI Documentation Guide

## Quick Start

### 1️⃣ Start the API Server
```bash
cd apps/api
pnpm dev
```

The API runs on **http://localhost:3000** by default.

---

## 📖 Access Swagger UI

### Local Development Access
- **Primary:** http://localhost:3000/docs
- **Alternative 1:** http://localhost:3000/swagger  
- **Alternative 2:** http://localhost:3000/api-docs
- **Raw JSON:** http://localhost:3000/docs-json

### Features
✅ Fully interactive API documentation  
✅ Try out endpoints directly in the browser  
✅ Built-in JWT authentication (Bearer token)  
✅ Request/response examples  
✅ Full schema documentation  

---

## 🔗 Generate Shareable Links

### Export OpenAPI Spec
```bash
# From workspace root
node scripts/export-swagger.mjs --host=localhost:3000

# Or with custom host (production)
node scripts/export-swagger.mjs --host=api.anuprerna.com
```

This generates:
- ✅ OpenAPI JSON spec file
- ✅ Share links for various platforms
- ✅ Documentation in SHARE_LINKS.md

### Output Location
```
apps/api/swagger-export/
├── openapi.json        # Raw OpenAPI specification
└── SHARE_LINKS.md      # Share links and access instructions
```

---

## 🌐 Share API Documentation

### Option 1: SwaggerHub (Recommended)
1. Create a free account at https://app.swaggerhub.com
2. Click "Create" → "Import Swagger/OpenAPI"
3. Upload the `openapi.json` from `swagger-export/` folder
4. Share the public SwaggerHub link with team

**Advantages:**
- Professional UI and versioning
- Team collaboration features
- No need to expose API server

### Option 2: Direct URL Sharing (if API is accessible)
Simply share the Swagger UI URL:
```
http://your-api-domain/docs
```

### Option 3: Online Viewers
1. **Swagger Editor:** https://editor.swagger.io/
   - File → Import URL → Paste: `http://your-api.com/docs-json`
   
2. **ReDoc:** https://redoc.ly/
   - Import URL endpoint

3. **SwaggerUI Online:** https://swagger.io/tools/swagger-ui/
   - Point to your `/docs-json` endpoint

---

## 📋 API Tags & Endpoints

The API is organized into logical tags:

| Tag | Purpose |
|-----|---------|
| **Health** | Server health and status checks |
| **Authentication** | Login, registration, token management |
| **Cart** | Shopping cart operations |
| **Product** | Product catalog and details |
| **Inventory** | Stock and inventory management |
| **Order** | Order creation and management |
| **Payment** | Payment processing |
| **User** | User profiles and accounts |
| **Content** | Blog posts and stories |
| **Search** | Search and filtering |
| **Admin** | Administrative operations (protected) |

---

## 🔐 Authentication

### Using JWT Tokens
1. Call `/auth/login` endpoint with credentials
2. Get JWT token from response
3. Click "Authorize" button in Swagger UI
4. Paste token (without "Bearer " prefix)
5. All protected endpoints now accessible

**Example Bearer Token Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📄 API Contract Documentation

### Key Endpoints
- `GET /health` - Server health check
- `POST /auth/login` - User authentication
- `GET /products` - List products
- `POST /cart` - Add to cart
- `POST /orders` - Create order

### Environment Variables
```env
# .env file in apps/api/
DATABASE_URL=postgres://...        # PostgreSQL connection
AUTH_JWT_SECRET=your-secret-key    # JWT signing secret
PORT=3000                          # Server port
SWAGGER=true                       # Enable/disable Swagger
NODE_ENV=development               # Environment
```

---

## 🛠️ Development Workflow

### 1. Add New Endpoint
```typescript
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller('products')
@ApiTags('Product')
export class ProductController {
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  getProduct(@Param('id') id: string) {
    // implementation
  }
}
```

### 2. Export Updated Documentation
```bash
# After making changes and restarting server
node scripts/export-swagger.mjs --host=localhost:3000
```

### 3. Share with Team
- Upload new `openapi.json` to SwaggerHub
- Or regenerate share links if API moved

---

## 🐛 Troubleshooting

### Swagger UI Not Loading
- ✅ Check `SWAGGER=true` in `.env`
- ✅ Rebuild API: `pnpm build && pnpm start`
- ✅ Clear browser cache

### Missing Endpoints
- ✅ Ensure controller has `@ApiTags()` decorator
- ✅ Import controller in module
- ✅ Register module in AppModule

### Auth Not Working
- ✅ Verify JWT token is valid
- ✅ Check `AUTH_JWT_SECRET` is set
- ✅ Token shouldn't include "Bearer " prefix when authorizing

### Cannot Access Remote API
- ✅ Verify API is deployed and running
- ✅ Check CORS settings in main.ts
- ✅ Verify firewall allows traffic

---

## 📚 References

- [NestJS Swagger Docs](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI 3.0 Spec](https://spec.openapis.org/oas/v3.0.3)
- [Swagger UI Docs](https://swagger.io/tools/swagger-ui/)
- [JWT Authentication Guide](https://jwt.io/)

---

## 🚀 Production Deployment

### Before Going Live
1. ✅ Export final OpenAPI spec
2. ✅ Upload to SwaggerHub or host spec file
3. ✅ Remove sensitive examples from DTO docs
4. ✅ Set `SWAGGER=false` if not needed in production
5. ✅ Update share link documentation

### Share with API Consumers
```markdown
## API Documentation
- **Endpoint:** https://api.anuprerna.com
- **Documentation:** https://swaggerhub.com/apis/anuprerna/api/2.0
- **Support:** support@anuprerna.com
```

---

**Last Updated:** 2024
**Status:** ✅ Ready for Use
