// @ts-nocheck
/**
 * apps/api/src/product/core/controller/Product.controller.ts
 *
 * Direct port of com.bloomscorp.loom.product.controller.ProductController's
 * business logic (see Product.dto.ts's own header note: "Controller wiring
 * ... is explicitly out of scope for this step ... RequestMapper.java is
 * still unavailable" — still true in this workspace). Route paths follow
 * the same "/verb/resource[/:id]" convention already source-established
 * in auth.controller.ts, cart.controller.ts, and category.controller.ts —
 * NOT SOURCE-VERIFIED against a live RequestMapper.class dump.
 *
 * No ProductMessages export exists in types/Product.types.ts (Product.dto.ts's
 * header explicitly notes no such source-derived constant list exists for
 * this domain) — response message strings below are inline literals,
 * flagged NOT source-verified, same caveat as tag.controller.ts.
 *
 * Route map (inferred — see note above):
 *   GET    /get/product/:id                                CODE_SU
 *   GET    /get/product/by-id/:id                           CODE_SU
 *   GET    /get/product/slug/:slug                          CODE_SU
 *   GET    /get/product/backward-compatible-link             CODE_SU
 *   GET    /get/product/sub-category/:subCategoryId          CODE_SU
 *   GET    /get/product/gist/list                            CODE_SU
 *   GET    /get/product/nav-menu/craft                       CODE_SU
 *   GET    /get/product/nav-menu/material                    CODE_SU
 *   GET    /get/product/nav-menu/pattern                     CODE_SU
 *   GET    /get/product/nav-menu/color                       CODE_SU
 *   GET    /get/product/nav-menu/finished/:categoryName       CODE_SU
 *   GET    /get/product/related                              CODE_SU
 *   POST   /add/product                                       CODE_SU
 *   PATCH  /update/product                                    CODE_SU
 *   DELETE /delete/product/:id                                CODE_SU
 *   GET    /get/table-explorer/data/product                    CODE_SU
 *   GET    /get/table-explorer/data/product/:id                 CODE_SU
 *
 * createProduct/updateProduct return ActionCode numbers, including the
 * source-specific ActionCode.INCORRECT_INFORMATION on failed validation
 * (distinct from the more common BadRequestException-throwing pattern in
 * Category/Segment/Tag/SpecialStatus) — surfaced as a 200 response with
 * success=false rather than a 400, preserving that behavioral difference
 * rather than normalizing it away.
 *
 * updateProduct: ProductService#updateProduct lets an uncaught
 * OptimisticLockError propagate (source's unmodeled
 * OptimisticLockException, same convention as SkuGroup/SubCategory/Cart)
 * — caught here and surfaced as 409 Conflict.
 *
 * KNOWN GAP (inherited from Product.service.ts): retrieveProductImageData
 * / retrieveEnabledProductImageData are not implemented in the service
 * (missing native-query SQL source), so no route for them exists here
 * either.
 */
import { Body, ConflictException, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProductService } from "../product/service/product.service.js";
import { OptimisticLockError } from "../product/repository/product.repository.js";
import { GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import {
  parseBackwardCompatibleLinkParam,
  parseCategoryNameParam,
  parseCreateProductRequest,
  parseCsvParam,
  parseIdParam,
  parsePageQuery,
  parseSlugParam,
  parseSubCategoryIdParam,
  parseUpdateProductRequest,
} from "../product/dto/product.dto.js";
import { ActionCode } from "../../../common/errors/action-code.js";

@ApiTags("Product")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /** ProductDAOController#retrieveProductById(Long id) — @Transactional(readOnly = true) alias of retrieveProduct. */
  @Get("/get/product/by-id/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve a single product by id (read-only alias)." })
  @ApiResponse({ status: 200, description: "Product or null." })
  async getProductById(@Param("id") id: string) {
    const parsedId = BigInt(parseIdParam(id));
    const product = await this.productService.retrieveProductById(parsedId);
    return keyedResponse("product", product);
  }

  /** ProductDAOController#findProductBySlug(String slug) */
  @Get("/get/product/slug/:slug")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve a single product by slug." })
  @ApiResponse({ status: 200, description: "Product or null." })
  async getProductBySlug(@Param("slug") slug: string) {
    const parsedSlug = parseSlugParam(slug);
    const product = await this.productService.findBySlug(parsedSlug);
    return keyedResponse("product", product);
  }

  /** ProductDAOController#findByBackwardCompatibleLink(String link) */
  @Get("/get/product/backward-compatible-link")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve a single product by its legacy backward-compatible link." })
  @ApiResponse({ status: 200, description: "Product or null." })
  async getProductByBackwardCompatibleLink(@Query("link") link: string) {
    const parsedLink = parseBackwardCompatibleLinkParam(link);
    const product = await this.productService.findByBackwardCompatibleLink(parsedLink);
    return keyedResponse("product", product);
  }

  /** ProductDAOController#findAllBySubCategoryId(Long subCategoryId) */
  @Get("/get/product/sub-category/:subCategoryId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "List every product under a sub-category." })
  @ApiResponse({ status: 200, description: "Matching products." })
  async getProductsBySubCategoryId(@Param("subCategoryId") subCategoryId: string) {
    const id = parseSubCategoryIdParam(subCategoryId);
    const products = await this.productService.findAllBySubCategoryId(id);
    return keyedResponse("productList", products);
  }

  /** ProductDAOController#retrieveProductGists() */
  @Get("/get/product/gist/list")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "List lightweight product gists (id/name/sku-style summary)." })
  @ApiResponse({ status: 200, description: "Full product gist list." })
  async getProductGists() {
    const gists = await this.productService.retrieveProductGists();
    return keyedResponse("productGistList", gists);
  }

  /** ProductDAOController#findNavMenuCraftMapping() */
  @Get("/get/product/nav-menu/craft")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Navigation-menu craft mapping." })
  @ApiResponse({ status: 200, description: "Craft mapping rows." })
  async getNavMenuCraftMapping() {
    const rows = await this.productService.findNavMenuCraftMapping();
    return keyedResponse("navMenuCraftList", rows);
  }

  /** ProductDAOController#findNavMenuMaterialMapping() */
  @Get("/get/product/nav-menu/material")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Navigation-menu material mapping." })
  @ApiResponse({ status: 200, description: "Material mapping rows." })
  async getNavMenuMaterialMapping() {
    const rows = await this.productService.findNavMenuMaterialMapping();
    return keyedResponse("navMenuMaterialList", rows);
  }

  /** ProductDAOController#findNavMenuPatternMapping() */
  @Get("/get/product/nav-menu/pattern")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Navigation-menu pattern mapping." })
  @ApiResponse({ status: 200, description: "Pattern mapping rows." })
  async getNavMenuPatternMapping() {
    const rows = await this.productService.findNavMenuPatternMapping();
    return keyedResponse("navMenuPatternList", rows);
  }

  /** ProductDAOController#findNavMenuColorMapping() */
  @Get("/get/product/nav-menu/color")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Navigation-menu color mapping." })
  @ApiResponse({ status: 200, description: "Color mapping rows." })
  async getNavMenuColorMapping() {
    const rows = await this.productService.findNavMenuColorMapping();
    return keyedResponse("navMenuColorList", rows);
  }

  /** ProductDAOController#findNavMenuFinishedMapping(String category) */
  @Get("/get/product/nav-menu/finished/:categoryName")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Navigation-menu finished-goods mapping for a category." })
  @ApiResponse({ status: 200, description: "Finished-goods mapping rows." })
  async getNavMenuFinishedMapping(@Param("categoryName") categoryName: string) {
    const category = parseCategoryNameParam(categoryName);
    const rows = await this.productService.findNavMenuFinishedMapping(category);
    return keyedResponse("navMenuFinishedList", rows);
  }

  /** ProductDAOController#resolveRelatedProductsByIdCSV(String csv) */
  @Get("/get/product/related")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Resolve related products for a comma-separated list of main product ids." })
  @ApiResponse({ status: 200, description: "Related products, grouped by main product id." })
  async getRelatedProducts(@Query("csv") csv: string) {
    const parsedCsv = parseCsvParam(csv);
    const related = await this.productService.resolveRelatedProductsByIdCSV(parsedCsv);
    return keyedResponse("relatedProductList", related);
  }

  /** ProductDAOController#retrieveProduct(Long id) */
  @Get("/get/product/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve a single product by id." })
  @ApiResponse({ status: 200, description: "Product or null." })
  async getProduct(@Param("id") id: string) {
    const parsedId = BigInt(parseIdParam(id));
    const product = await this.productService.retrieveProduct(parsedId);
    return keyedResponse("product", product);
  }


  /**
   * ProductDAOController#createProduct(Product entity) — validation
   * failure returns ActionCode.INCORRECT_INFORMATION as a 200/success=false
   * response rather than a thrown BadRequestException, preserving source's
   * behavior exactly.
   */
  @Post("/add/product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create a new product." })
  @ApiResponse({ status: 200, description: "Creation result (success flag reflects validation/insert outcome)." })
  async createProduct(@Body() body: unknown) {
    const input = parseCreateProductRequest(body);
    const result = await this.productService.createProduct(input);
    return simpleResponse(
      result === ActionCode.INSERT_SUCCESS,
      result === ActionCode.INSERT_SUCCESS ? "Product created successfully." : "Failed to create product.",
    );
  }

  /**
   * ProductDAOController#updateProduct(Product updatedProduct) —
   * OptimisticLockError caught here and surfaced as 409 Conflict.
   */
  @Patch("/update/product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update an existing product." })
  @ApiResponse({ status: 200, description: "Update result (success flag reflects validation/update outcome)." })
  @ApiResponse({ status: 409, description: "Product was modified by another request." })
  async updateProduct(@Body() body: unknown) {
    const input = parseUpdateProductRequest(body);
    let result: number;
    try {
      result = await this.productService.updateProduct(input);
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        throw new ConflictException("This product was modified by another request. Please retry.");
      }
      throw err;
    }
    return simpleResponse(
      result === ActionCode.UPDATE_SUCCESS,
      result === ActionCode.UPDATE_SUCCESS ? "Product updated successfully." : "Failed to update product.",
    );
  }

  /** Generic delete — see Product.service.ts#deleteProduct header note. */
  @Delete("/delete/product/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete a product." })
  @ApiResponse({ status: 200, description: "Deletion result." })
  async deleteProduct(@Param("id") id: string) {
    const parsedId = BigInt(parseIdParam(id));
    const deleted = await this.productService.deleteProduct(parsedId);
    return simpleResponse(deleted, deleted ? "Product deleted successfully." : "Failed to delete product.");
  }

  /** ProductDAOController#retrieveProductData(int page, int size) */
  @Get("/get/table-explorer/data/product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Paginated table-explorer projection of products." })
  @ApiResponse({ status: 200, description: "Page of product data." })
  async getProductData(@Query() query: unknown) {
    const { page, size } = parsePageQuery(query);
    const data = await this.productService.retrieveProductData(page, size);
    return keyedResponse("productDataList", data);
  }

  /** ProductDAOController#retrieveProductDataById(Long id) */
  @Get("/get/table-explorer/data/product/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table-explorer projection of a single product." })
  @ApiResponse({ status: 200, description: "Product data or null." })
  async getProductDataById(@Param("id") id: string) {
    const parsedId = BigInt(parseIdParam(id));
    const data = await this.productService.retrieveProductDataById(parsedId);
    return keyedResponse("productData", data);
  }
}
// @ts-nocheck
