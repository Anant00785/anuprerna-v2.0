import { relations } from "drizzle-orm/relations";
import { customOrder, customOrderAdjustment, orders, orderReviewScheduledEmail, storyContent, storyContentSection, badgeProfile, subCategory, customSizeProfile, fabricProfile, finishProfile, madeToOrderProfile, segment, volumeDiscountProfile, productFabric, cartItem, productFinished, sizeProfileOption, loomTenant, inventoryAdjustmentReason, inventoryAdjustment, warehouse, workflow, element, artisan, artisanPaymentRecord, orderFulfillment, shipment, customOrderItem, customOrderItemReady, customOrderReady, address, blogContent, blogContentCategory, blogContentSection, badgeProfileItem, blogContentType, customSizeProfileItem, finishProfileItem, customer, orderItem, purchaseOrderFeedback, razorpayTransaction, category, sizeProfile, sizeProfileGuide, faq, storyContentCategory, faqQuestion, storyProductMapping, superUser, userRole, verificationToken, product, skuGroup, specialStatus, fabricProfileItem, inventoryRestockRequest, productImageGallerySeo, productSizeProfile, volumeDiscountProfileItem, productZohoRelation, review, inventoryAdjustmentItem, workflowTemplate, elementTemplate, subprocessElementTemplate, stepElementTemplate, elementFeedback, stepElement, subprocessElement, customProduct, workflowCustomOrderMapping, authenticationLog, whatsappNotificationHistory, emailNotificationHistory, loyaltyProgramConfig, loyaltyProgramConfigAuditLog, artisanSkillMapping, skill, catalog, catalogItem, workflowArtisanMapping, stepElementArtisanMapping, subprocessElementArtisanMapping, catalogItemMedia, catalogPdf, orderItemFulfillment, orderReady, orderItemReady, customOrderFulfillment, customOrderItemFulfillment, stripeTransaction, impactFactor } from "./schema";

export const customOrderAdjustmentRelations = relations(customOrderAdjustment, ({one}) => ({
	customOrder: one(customOrder, {
		fields: [customOrderAdjustment.customOrderId],
		references: [customOrder.id]
	}),
}));

export const customOrderRelations = relations(customOrder, ({one, many}) => ({
	customOrderAdjustments: many(customOrderAdjustment),
	loomTenant: one(loomTenant, {
		fields: [customOrder.tenantId],
		references: [loomTenant.id]
	}),
	customOrderItems: many(customOrderItem),
	customOrderFulfillments: many(customOrderFulfillment),
	customOrderItemFulfillments: many(customOrderItemFulfillment),
	customOrderReadies: many(customOrderReady),
}));

export const orderReviewScheduledEmailRelations = relations(orderReviewScheduledEmail, ({one}) => ({
	order: one(orders, {
		fields: [orderReviewScheduledEmail.orderId],
		references: [orders.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	orderReviewScheduledEmails: many(orderReviewScheduledEmail),
	orderFulfillments: many(orderFulfillment),
	loomTenant: one(loomTenant, {
		fields: [orders.tenantId],
		references: [loomTenant.id]
	}),
	orderItems: many(orderItem),
	purchaseOrderFeedbacks: many(purchaseOrderFeedback),
	razorpayTransactions: many(razorpayTransaction),
	orderItemFulfillments: many(orderItemFulfillment),
	orderReadies: many(orderReady),
	stripeTransactions: many(stripeTransaction),
}));

export const storyContentSectionRelations = relations(storyContentSection, ({one}) => ({
	storyContent: one(storyContent, {
		fields: [storyContentSection.storyContentId],
		references: [storyContent.id]
	}),
}));

export const storyContentRelations = relations(storyContent, ({one, many}) => ({
	storyContentSections: many(storyContentSection),
	faqs: many(faq),
	loomTenant: one(loomTenant, {
		fields: [storyContent.authorId],
		references: [loomTenant.id]
	}),
	storyContentCategory: one(storyContentCategory, {
		fields: [storyContent.storyContentCategoryId],
		references: [storyContentCategory.id]
	}),
	storyProductMappings: many(storyProductMapping),
}));

export const subCategoryRelations = relations(subCategory, ({one, many}) => ({
	badgeProfile: one(badgeProfile, {
		fields: [subCategory.badgeProfileId],
		references: [badgeProfile.id]
	}),
	customSizeProfile: one(customSizeProfile, {
		fields: [subCategory.customSizeProfileId],
		references: [customSizeProfile.id]
	}),
	fabricProfile: one(fabricProfile, {
		fields: [subCategory.fabricProfileId],
		references: [fabricProfile.id]
	}),
	finishProfile: one(finishProfile, {
		fields: [subCategory.finishProfileId],
		references: [finishProfile.id]
	}),
	madeToOrderProfile: one(madeToOrderProfile, {
		fields: [subCategory.madeToOrderProfileId],
		references: [madeToOrderProfile.id]
	}),
	segment: one(segment, {
		fields: [subCategory.segmentId],
		references: [segment.id]
	}),
	volumeDiscountProfile: one(volumeDiscountProfile, {
		fields: [subCategory.volumeDiscountProfileId],
		references: [volumeDiscountProfile.id]
	}),
	products: many(product),
}));

export const badgeProfileRelations = relations(badgeProfile, ({many}) => ({
	subCategories: many(subCategory),
	badgeProfileItems: many(badgeProfileItem),
	products: many(product),
}));

export const customSizeProfileRelations = relations(customSizeProfile, ({many}) => ({
	subCategories: many(subCategory),
	customSizeProfileItems: many(customSizeProfileItem),
	products: many(product),
}));

export const fabricProfileRelations = relations(fabricProfile, ({many}) => ({
	subCategories: many(subCategory),
	products: many(product),
	fabricProfileItems: many(fabricProfileItem),
}));

export const finishProfileRelations = relations(finishProfile, ({many}) => ({
	subCategories: many(subCategory),
	finishProfileItems: many(finishProfileItem),
	products: many(product),
}));

export const madeToOrderProfileRelations = relations(madeToOrderProfile, ({many}) => ({
	subCategories: many(subCategory),
	products: many(product),
}));

export const segmentRelations = relations(segment, ({one, many}) => ({
	subCategories: many(subCategory),
	category: one(category, {
		fields: [segment.categoryId],
		references: [category.id]
	}),
}));

export const volumeDiscountProfileRelations = relations(volumeDiscountProfile, ({many}) => ({
	subCategories: many(subCategory),
	products: many(product),
	volumeDiscountProfileItems: many(volumeDiscountProfileItem),
}));

export const cartItemRelations = relations(cartItem, ({one}) => ({
	productFabric_fabricProductId: one(productFabric, {
		fields: [cartItem.fabricProductId],
		references: [productFabric.id],
		relationName: "cartItem_fabricProductId_productFabric_id"
	}),
	productFinished: one(productFinished, {
		fields: [cartItem.finishedProductId],
		references: [productFinished.id]
	}),
	productFabric_selectedFabricId: one(productFabric, {
		fields: [cartItem.selectedFabricId],
		references: [productFabric.id],
		relationName: "cartItem_selectedFabricId_productFabric_id"
	}),
	sizeProfileOption: one(sizeProfileOption, {
		fields: [cartItem.selectedSizeOptionId],
		references: [sizeProfileOption.id]
	}),
	loomTenant: one(loomTenant, {
		fields: [cartItem.tenantId],
		references: [loomTenant.id]
	}),
}));

export const productFabricRelations = relations(productFabric, ({one, many}) => ({
	cartItems_fabricProductId: many(cartItem, {
		relationName: "cartItem_fabricProductId_productFabric_id"
	}),
	cartItems_selectedFabricId: many(cartItem, {
		relationName: "cartItem_selectedFabricId_productFabric_id"
	}),
	product: one(product, {
		fields: [productFabric.productId],
		references: [product.id]
	}),
}));

export const productFinishedRelations = relations(productFinished, ({one, many}) => ({
	cartItems: many(cartItem),
	product: one(product, {
		fields: [productFinished.productId],
		references: [product.id]
	}),
}));

export const sizeProfileOptionRelations = relations(sizeProfileOption, ({one, many}) => ({
	cartItems: many(cartItem),
	sizeProfile: one(sizeProfile, {
		fields: [sizeProfileOption.profileId],
		references: [sizeProfile.id]
	}),
	sizeProfileGuides: many(sizeProfileGuide),
	inventoryRestockRequests: many(inventoryRestockRequest),
	productSizeProfiles: many(productSizeProfile),
}));

export const loomTenantRelations = relations(loomTenant, ({many}) => ({
	cartItems: many(cartItem),
	inventoryAdjustments: many(inventoryAdjustment),
	addresses: many(address),
	blogContents: many(blogContent),
	customOrders: many(customOrder),
	customers: many(customer),
	orders: many(orders),
	storyContents: many(storyContent),
	superUsers: many(superUser),
	userRoles: many(userRole),
	verificationTokens: many(verificationToken),
	inventoryRestockRequests: many(inventoryRestockRequest),
	workflowTemplates: many(workflowTemplate),
	workflows: many(workflow),
	authenticationLogs: many(authenticationLog),
	whatsappNotificationHistories: many(whatsappNotificationHistory),
	emailNotificationHistories: many(emailNotificationHistory),
	artisans: many(artisan),
	catalogPdfs: many(catalogPdf),
	impactFactors: many(impactFactor),
}));

export const inventoryAdjustmentRelations = relations(inventoryAdjustment, ({one, many}) => ({
	inventoryAdjustmentReason: one(inventoryAdjustmentReason, {
		fields: [inventoryAdjustment.reasonId],
		references: [inventoryAdjustmentReason.id]
	}),
	loomTenant: one(loomTenant, {
		fields: [inventoryAdjustment.userId],
		references: [loomTenant.id]
	}),
	warehouse: one(warehouse, {
		fields: [inventoryAdjustment.warehouseId],
		references: [warehouse.id]
	}),
	inventoryAdjustmentItems: many(inventoryAdjustmentItem),
}));

export const inventoryAdjustmentReasonRelations = relations(inventoryAdjustmentReason, ({many}) => ({
	inventoryAdjustments: many(inventoryAdjustment),
}));

export const warehouseRelations = relations(warehouse, ({many}) => ({
	inventoryAdjustments: many(inventoryAdjustment),
}));

export const elementRelations = relations(element, ({one, many}) => ({
	workflow: one(workflow, {
		fields: [element.workflowId],
		references: [workflow.id]
	}),
	elementFeedbacks: many(elementFeedback),
	stepElements: many(stepElement),
	subprocessElements: many(subprocessElement),
}));

export const workflowRelations = relations(workflow, ({one, many}) => ({
	elements: many(element),
	artisanPaymentRecords: many(artisanPaymentRecord),
	product: one(product, {
		fields: [workflow.productId],
		references: [product.id]
	}),
	loomTenant: one(loomTenant, {
		fields: [workflow.tenantId],
		references: [loomTenant.id]
	}),
	workflowTemplate: one(workflowTemplate, {
		fields: [workflow.workflowTemplateId],
		references: [workflowTemplate.id]
	}),
	stepElements: many(stepElement),
	subprocessElements: many(subprocessElement),
	workflowCustomOrderMappings: many(workflowCustomOrderMapping),
	workflowArtisanMappings: many(workflowArtisanMapping),
	impactFactors: many(impactFactor),
}));

export const artisanPaymentRecordRelations = relations(artisanPaymentRecord, ({one}) => ({
	artisan: one(artisan, {
		fields: [artisanPaymentRecord.artisanId],
		references: [artisan.id]
	}),
	workflow: one(workflow, {
		fields: [artisanPaymentRecord.workflowId],
		references: [workflow.id]
	}),
}));

export const artisanRelations = relations(artisan, ({one, many}) => ({
	artisanPaymentRecords: many(artisanPaymentRecord),
	loomTenant: one(loomTenant, {
		fields: [artisan.tenantId],
		references: [loomTenant.id]
	}),
	artisan: one(artisan, {
		fields: [artisan.masterArtisanId],
		references: [artisan.id],
		relationName: "artisan_masterArtisanId_artisan_id"
	}),
	artisans: many(artisan, {
		relationName: "artisan_masterArtisanId_artisan_id"
	}),
	artisanSkillMappings: many(artisanSkillMapping),
	workflowArtisanMappings: many(workflowArtisanMapping),
	stepElementArtisanMappings: many(stepElementArtisanMapping),
	subprocessElementArtisanMappings: many(subprocessElementArtisanMapping),
	catalogPdfs: many(catalogPdf),
}));

export const orderFulfillmentRelations = relations(orderFulfillment, ({one, many}) => ({
	order: one(orders, {
		fields: [orderFulfillment.orderId],
		references: [orders.id]
	}),
	shipment: one(shipment, {
		fields: [orderFulfillment.shipmentId],
		references: [shipment.id]
	}),
	orderItemFulfillments: many(orderItemFulfillment),
}));

export const shipmentRelations = relations(shipment, ({many}) => ({
	orderFulfillments: many(orderFulfillment),
	customOrderFulfillments: many(customOrderFulfillment),
}));

export const customOrderItemReadyRelations = relations(customOrderItemReady, ({one}) => ({
	customOrderItem: one(customOrderItem, {
		fields: [customOrderItemReady.customOrderItemId],
		references: [customOrderItem.id]
	}),
	customOrderReady: one(customOrderReady, {
		fields: [customOrderItemReady.customOrderReadyId],
		references: [customOrderReady.id]
	}),
}));

export const customOrderItemRelations = relations(customOrderItem, ({one, many}) => ({
	customOrderItemReadies: many(customOrderItemReady),
	customOrder: one(customOrder, {
		fields: [customOrderItem.customOrderId],
		references: [customOrder.id]
	}),
	customOrderItemFulfillments: many(customOrderItemFulfillment),
}));

export const customOrderReadyRelations = relations(customOrderReady, ({one, many}) => ({
	customOrderItemReadies: many(customOrderItemReady),
	customOrder: one(customOrder, {
		fields: [customOrderReady.customOrderId],
		references: [customOrder.id]
	}),
}));

export const addressRelations = relations(address, ({one}) => ({
	loomTenant: one(loomTenant, {
		fields: [address.tenantId],
		references: [loomTenant.id]
	}),
}));

export const blogContentRelations = relations(blogContent, ({one, many}) => ({
	loomTenant: one(loomTenant, {
		fields: [blogContent.authorId],
		references: [loomTenant.id]
	}),
	blogContentCategory: one(blogContentCategory, {
		fields: [blogContent.blogContentCategoryId],
		references: [blogContentCategory.id]
	}),
	blogContentSections: many(blogContentSection),
	faqs: many(faq),
}));

export const blogContentCategoryRelations = relations(blogContentCategory, ({one, many}) => ({
	blogContents: many(blogContent),
	blogContentType: one(blogContentType, {
		fields: [blogContentCategory.blogContentTypeId],
		references: [blogContentType.id]
	}),
}));

export const blogContentSectionRelations = relations(blogContentSection, ({one}) => ({
	blogContent: one(blogContent, {
		fields: [blogContentSection.blogContentId],
		references: [blogContent.id]
	}),
}));

export const badgeProfileItemRelations = relations(badgeProfileItem, ({one}) => ({
	badgeProfile: one(badgeProfile, {
		fields: [badgeProfileItem.profileId],
		references: [badgeProfile.id]
	}),
}));

export const blogContentTypeRelations = relations(blogContentType, ({many}) => ({
	blogContentCategories: many(blogContentCategory),
}));

export const customSizeProfileItemRelations = relations(customSizeProfileItem, ({one}) => ({
	customSizeProfile: one(customSizeProfile, {
		fields: [customSizeProfileItem.profileId],
		references: [customSizeProfile.id]
	}),
}));

export const finishProfileItemRelations = relations(finishProfileItem, ({one}) => ({
	finishProfile: one(finishProfile, {
		fields: [finishProfileItem.profileId],
		references: [finishProfile.id]
	}),
}));

export const customerRelations = relations(customer, ({one, many}) => ({
	loomTenant: one(loomTenant, {
		fields: [customer.tenantId],
		references: [loomTenant.id]
	}),
	loyaltyProgramConfigs: many(loyaltyProgramConfig),
	loyaltyProgramConfigAuditLogs: many(loyaltyProgramConfigAuditLog),
}));

export const orderItemRelations = relations(orderItem, ({one, many}) => ({
	order: one(orders, {
		fields: [orderItem.orderId],
		references: [orders.id]
	}),
	orderItemFulfillments: many(orderItemFulfillment),
	orderItemReadies: many(orderItemReady),
}));

export const purchaseOrderFeedbackRelations = relations(purchaseOrderFeedback, ({one}) => ({
	order: one(orders, {
		fields: [purchaseOrderFeedback.orderId],
		references: [orders.id]
	}),
}));

export const razorpayTransactionRelations = relations(razorpayTransaction, ({one}) => ({
	order: one(orders, {
		fields: [razorpayTransaction.loomOrderId],
		references: [orders.id]
	}),
}));

export const categoryRelations = relations(category, ({many}) => ({
	segments: many(segment),
}));

export const sizeProfileRelations = relations(sizeProfile, ({many}) => ({
	sizeProfileOptions: many(sizeProfileOption),
	sizeProfileGuides: many(sizeProfileGuide),
	products: many(product),
}));

export const sizeProfileGuideRelations = relations(sizeProfileGuide, ({one}) => ({
	sizeProfileOption: one(sizeProfileOption, {
		fields: [sizeProfileGuide.optionId],
		references: [sizeProfileOption.id]
	}),
	sizeProfile: one(sizeProfile, {
		fields: [sizeProfileGuide.profileId],
		references: [sizeProfile.id]
	}),
}));

export const faqRelations = relations(faq, ({one, many}) => ({
	blogContent: one(blogContent, {
		fields: [faq.blogContentId],
		references: [blogContent.id]
	}),
	storyContent: one(storyContent, {
		fields: [faq.storyContentId],
		references: [storyContent.id]
	}),
	faqQuestions: many(faqQuestion),
}));

export const storyContentCategoryRelations = relations(storyContentCategory, ({many}) => ({
	storyContents: many(storyContent),
}));

export const faqQuestionRelations = relations(faqQuestion, ({one}) => ({
	faq: one(faq, {
		fields: [faqQuestion.faqId],
		references: [faq.id]
	}),
}));

export const storyProductMappingRelations = relations(storyProductMapping, ({one}) => ({
	storyContent: one(storyContent, {
		fields: [storyProductMapping.storyContentId],
		references: [storyContent.id]
	}),
}));

export const superUserRelations = relations(superUser, ({one}) => ({
	loomTenant: one(loomTenant, {
		fields: [superUser.tenantId],
		references: [loomTenant.id]
	}),
}));

export const userRoleRelations = relations(userRole, ({one}) => ({
	loomTenant: one(loomTenant, {
		fields: [userRole.userId],
		references: [loomTenant.id]
	}),
}));

export const verificationTokenRelations = relations(verificationToken, ({one}) => ({
	loomTenant: one(loomTenant, {
		fields: [verificationToken.tenantId],
		references: [loomTenant.id]
	}),
}));

export const productRelations = relations(product, ({one, many}) => ({
	productFabrics: many(productFabric),
	badgeProfile: one(badgeProfile, {
		fields: [product.badgeProfileId],
		references: [badgeProfile.id]
	}),
	customSizeProfile: one(customSizeProfile, {
		fields: [product.customSizeProfileId],
		references: [customSizeProfile.id]
	}),
	fabricProfile: one(fabricProfile, {
		fields: [product.fabricProfileId],
		references: [fabricProfile.id]
	}),
	finishProfile: one(finishProfile, {
		fields: [product.finishProfileId],
		references: [finishProfile.id]
	}),
	product_madeToOrderFabricId: one(product, {
		fields: [product.madeToOrderFabricId],
		references: [product.id],
		relationName: "product_madeToOrderFabricId_product_id"
	}),
	products_madeToOrderFabricId: many(product, {
		relationName: "product_madeToOrderFabricId_product_id"
	}),
	madeToOrderProfile: one(madeToOrderProfile, {
		fields: [product.madeToOrderProfileId],
		references: [madeToOrderProfile.id]
	}),
	product_mainProductId: one(product, {
		fields: [product.mainProductId],
		references: [product.id],
		relationName: "product_mainProductId_product_id"
	}),
	products_mainProductId: many(product, {
		relationName: "product_mainProductId_product_id"
	}),
	sizeProfile: one(sizeProfile, {
		fields: [product.sizeProfileId],
		references: [sizeProfile.id]
	}),
	skuGroup: one(skuGroup, {
		fields: [product.skuGroupId],
		references: [skuGroup.id]
	}),
	specialStatus: one(specialStatus, {
		fields: [product.specialStatusId],
		references: [specialStatus.id]
	}),
	subCategory: one(subCategory, {
		fields: [product.subCategoryId],
		references: [subCategory.id]
	}),
	volumeDiscountProfile: one(volumeDiscountProfile, {
		fields: [product.volumeDiscountProfileId],
		references: [volumeDiscountProfile.id]
	}),
	fabricProfileItems: many(fabricProfileItem),
	inventoryRestockRequests_madeToOrderProductId: many(inventoryRestockRequest, {
		relationName: "inventoryRestockRequest_madeToOrderProductId_product_id"
	}),
	inventoryRestockRequests_productId: many(inventoryRestockRequest, {
		relationName: "inventoryRestockRequest_productId_product_id"
	}),
	productFinisheds: many(productFinished),
	productImageGallerySeos: many(productImageGallerySeo),
	productSizeProfiles: many(productSizeProfile),
	productZohoRelations: many(productZohoRelation),
	reviews: many(review),
	inventoryAdjustmentItems: many(inventoryAdjustmentItem),
	workflows: many(workflow),
	workflowCustomOrderMappings: many(workflowCustomOrderMapping),
}));

export const skuGroupRelations = relations(skuGroup, ({many}) => ({
	products: many(product),
}));

export const specialStatusRelations = relations(specialStatus, ({many}) => ({
	products: many(product),
}));

export const fabricProfileItemRelations = relations(fabricProfileItem, ({one}) => ({
	product: one(product, {
		fields: [fabricProfileItem.productId],
		references: [product.id]
	}),
	fabricProfile: one(fabricProfile, {
		fields: [fabricProfileItem.profileId],
		references: [fabricProfile.id]
	}),
}));

export const inventoryRestockRequestRelations = relations(inventoryRestockRequest, ({one}) => ({
	product_madeToOrderProductId: one(product, {
		fields: [inventoryRestockRequest.madeToOrderProductId],
		references: [product.id],
		relationName: "inventoryRestockRequest_madeToOrderProductId_product_id"
	}),
	product_productId: one(product, {
		fields: [inventoryRestockRequest.productId],
		references: [product.id],
		relationName: "inventoryRestockRequest_productId_product_id"
	}),
	sizeProfileOption: one(sizeProfileOption, {
		fields: [inventoryRestockRequest.sizeOptionId],
		references: [sizeProfileOption.id]
	}),
	loomTenant: one(loomTenant, {
		fields: [inventoryRestockRequest.tenantId],
		references: [loomTenant.id]
	}),
}));

export const productImageGallerySeoRelations = relations(productImageGallerySeo, ({one}) => ({
	product: one(product, {
		fields: [productImageGallerySeo.productId],
		references: [product.id]
	}),
}));

export const productSizeProfileRelations = relations(productSizeProfile, ({one}) => ({
	product: one(product, {
		fields: [productSizeProfile.productId],
		references: [product.id]
	}),
	sizeProfileOption: one(sizeProfileOption, {
		fields: [productSizeProfile.sizeProfileOptionId],
		references: [sizeProfileOption.id]
	}),
}));

export const volumeDiscountProfileItemRelations = relations(volumeDiscountProfileItem, ({one}) => ({
	volumeDiscountProfile: one(volumeDiscountProfile, {
		fields: [volumeDiscountProfileItem.profileId],
		references: [volumeDiscountProfile.id]
	}),
}));

export const productZohoRelationRelations = relations(productZohoRelation, ({one}) => ({
	product: one(product, {
		fields: [productZohoRelation.productId],
		references: [product.id]
	}),
}));

export const reviewRelations = relations(review, ({one}) => ({
	product: one(product, {
		fields: [review.productId],
		references: [product.id]
	}),
}));

export const inventoryAdjustmentItemRelations = relations(inventoryAdjustmentItem, ({one}) => ({
	inventoryAdjustment: one(inventoryAdjustment, {
		fields: [inventoryAdjustmentItem.inventoryAdjustmentId],
		references: [inventoryAdjustment.id]
	}),
	product: one(product, {
		fields: [inventoryAdjustmentItem.productId],
		references: [product.id]
	}),
}));

export const workflowTemplateRelations = relations(workflowTemplate, ({one, many}) => ({
	loomTenant: one(loomTenant, {
		fields: [workflowTemplate.tenantId],
		references: [loomTenant.id]
	}),
	elementTemplates: many(elementTemplate),
	subprocessElementTemplates: many(subprocessElementTemplate),
	stepElementTemplates: many(stepElementTemplate),
	workflows: many(workflow),
}));

export const elementTemplateRelations = relations(elementTemplate, ({one, many}) => ({
	workflowTemplate: one(workflowTemplate, {
		fields: [elementTemplate.workflowId],
		references: [workflowTemplate.id]
	}),
	subprocessElementTemplates: many(subprocessElementTemplate),
	stepElementTemplates: many(stepElementTemplate),
}));

export const subprocessElementTemplateRelations = relations(subprocessElementTemplate, ({one}) => ({
	elementTemplate: one(elementTemplate, {
		fields: [subprocessElementTemplate.elementId],
		references: [elementTemplate.id]
	}),
	stepElementTemplate: one(stepElementTemplate, {
		fields: [subprocessElementTemplate.stepId],
		references: [stepElementTemplate.id]
	}),
	workflowTemplate: one(workflowTemplate, {
		fields: [subprocessElementTemplate.workflowId],
		references: [workflowTemplate.id]
	}),
}));

export const stepElementTemplateRelations = relations(stepElementTemplate, ({one, many}) => ({
	subprocessElementTemplates: many(subprocessElementTemplate),
	elementTemplate: one(elementTemplate, {
		fields: [stepElementTemplate.elementId],
		references: [elementTemplate.id]
	}),
	workflowTemplate: one(workflowTemplate, {
		fields: [stepElementTemplate.workflowId],
		references: [workflowTemplate.id]
	}),
}));

export const elementFeedbackRelations = relations(elementFeedback, ({one}) => ({
	element: one(element, {
		fields: [elementFeedback.elementId],
		references: [element.id]
	}),
}));

export const stepElementRelations = relations(stepElement, ({one, many}) => ({
	element: one(element, {
		fields: [stepElement.elementId],
		references: [element.id]
	}),
	workflow: one(workflow, {
		fields: [stepElement.workflowId],
		references: [workflow.id]
	}),
	subprocessElements: many(subprocessElement),
	stepElementArtisanMappings: many(stepElementArtisanMapping),
}));

export const subprocessElementRelations = relations(subprocessElement, ({one, many}) => ({
	element: one(element, {
		fields: [subprocessElement.elementId],
		references: [element.id]
	}),
	stepElement: one(stepElement, {
		fields: [subprocessElement.stepId],
		references: [stepElement.id]
	}),
	workflow: one(workflow, {
		fields: [subprocessElement.workflowId],
		references: [workflow.id]
	}),
	subprocessElementArtisanMappings: many(subprocessElementArtisanMapping),
}));

export const workflowCustomOrderMappingRelations = relations(workflowCustomOrderMapping, ({one}) => ({
	customProduct: one(customProduct, {
		fields: [workflowCustomOrderMapping.customProductId],
		references: [customProduct.id]
	}),
	product: one(product, {
		fields: [workflowCustomOrderMapping.productId],
		references: [product.id]
	}),
	workflow: one(workflow, {
		fields: [workflowCustomOrderMapping.workflowId],
		references: [workflow.id]
	}),
}));

export const customProductRelations = relations(customProduct, ({many}) => ({
	workflowCustomOrderMappings: many(workflowCustomOrderMapping),
}));

export const authenticationLogRelations = relations(authenticationLog, ({one}) => ({
	loomTenant: one(loomTenant, {
		fields: [authenticationLog.userId],
		references: [loomTenant.id]
	}),
}));

export const whatsappNotificationHistoryRelations = relations(whatsappNotificationHistory, ({one}) => ({
	loomTenant: one(loomTenant, {
		fields: [whatsappNotificationHistory.tenantId],
		references: [loomTenant.id]
	}),
}));

export const emailNotificationHistoryRelations = relations(emailNotificationHistory, ({one}) => ({
	loomTenant: one(loomTenant, {
		fields: [emailNotificationHistory.tenantId],
		references: [loomTenant.id]
	}),
}));

export const loyaltyProgramConfigRelations = relations(loyaltyProgramConfig, ({one}) => ({
	customer: one(customer, {
		fields: [loyaltyProgramConfig.customerId],
		references: [customer.id]
	}),
}));

export const loyaltyProgramConfigAuditLogRelations = relations(loyaltyProgramConfigAuditLog, ({one}) => ({
	customer: one(customer, {
		fields: [loyaltyProgramConfigAuditLog.customerId],
		references: [customer.id]
	}),
}));

export const artisanSkillMappingRelations = relations(artisanSkillMapping, ({one}) => ({
	artisan: one(artisan, {
		fields: [artisanSkillMapping.artisanId],
		references: [artisan.id]
	}),
	skill: one(skill, {
		fields: [artisanSkillMapping.skillId],
		references: [skill.id]
	}),
}));

export const skillRelations = relations(skill, ({many}) => ({
	artisanSkillMappings: many(artisanSkillMapping),
}));

export const catalogItemRelations = relations(catalogItem, ({one, many}) => ({
	catalog: one(catalog, {
		fields: [catalogItem.catalogId],
		references: [catalog.id]
	}),
	catalogItemMedias: many(catalogItemMedia),
}));

export const catalogRelations = relations(catalog, ({many}) => ({
	catalogItems: many(catalogItem),
}));

export const workflowArtisanMappingRelations = relations(workflowArtisanMapping, ({one}) => ({
	workflow: one(workflow, {
		fields: [workflowArtisanMapping.workflowId],
		references: [workflow.id]
	}),
	artisan: one(artisan, {
		fields: [workflowArtisanMapping.artisanId],
		references: [artisan.id]
	}),
}));

export const stepElementArtisanMappingRelations = relations(stepElementArtisanMapping, ({one}) => ({
	stepElement: one(stepElement, {
		fields: [stepElementArtisanMapping.stepElementId],
		references: [stepElement.id]
	}),
	artisan: one(artisan, {
		fields: [stepElementArtisanMapping.artisanId],
		references: [artisan.id]
	}),
}));

export const subprocessElementArtisanMappingRelations = relations(subprocessElementArtisanMapping, ({one}) => ({
	subprocessElement: one(subprocessElement, {
		fields: [subprocessElementArtisanMapping.subprocessElementId],
		references: [subprocessElement.id]
	}),
	artisan: one(artisan, {
		fields: [subprocessElementArtisanMapping.artisanId],
		references: [artisan.id]
	}),
}));

export const catalogItemMediaRelations = relations(catalogItemMedia, ({one}) => ({
	catalogItem: one(catalogItem, {
		fields: [catalogItemMedia.catalogItemId],
		references: [catalogItem.id]
	}),
}));

export const catalogPdfRelations = relations(catalogPdf, ({one}) => ({
	artisan: one(artisan, {
		fields: [catalogPdf.artisanId],
		references: [artisan.id]
	}),
	loomTenant: one(loomTenant, {
		fields: [catalogPdf.requestedById],
		references: [loomTenant.id]
	}),
}));

export const orderItemFulfillmentRelations = relations(orderItemFulfillment, ({one}) => ({
	order: one(orders, {
		fields: [orderItemFulfillment.orderId],
		references: [orders.id]
	}),
	orderFulfillment: one(orderFulfillment, {
		fields: [orderItemFulfillment.orderFulfillmentId],
		references: [orderFulfillment.id]
	}),
	orderItem: one(orderItem, {
		fields: [orderItemFulfillment.orderItemId],
		references: [orderItem.id]
	}),
}));

export const orderReadyRelations = relations(orderReady, ({one, many}) => ({
	order: one(orders, {
		fields: [orderReady.orderId],
		references: [orders.id]
	}),
	orderItemReadies: many(orderItemReady),
}));

export const orderItemReadyRelations = relations(orderItemReady, ({one}) => ({
	orderItem: one(orderItem, {
		fields: [orderItemReady.orderItemId],
		references: [orderItem.id]
	}),
	orderReady: one(orderReady, {
		fields: [orderItemReady.orderReadyId],
		references: [orderReady.id]
	}),
}));

export const customOrderFulfillmentRelations = relations(customOrderFulfillment, ({one, many}) => ({
	customOrder: one(customOrder, {
		fields: [customOrderFulfillment.customOrderId],
		references: [customOrder.id]
	}),
	shipment: one(shipment, {
		fields: [customOrderFulfillment.shipmentId],
		references: [shipment.id]
	}),
	customOrderItemFulfillments: many(customOrderItemFulfillment),
}));

export const customOrderItemFulfillmentRelations = relations(customOrderItemFulfillment, ({one}) => ({
	customOrder: one(customOrder, {
		fields: [customOrderItemFulfillment.customOrderId],
		references: [customOrder.id]
	}),
	customOrderFulfillment: one(customOrderFulfillment, {
		fields: [customOrderItemFulfillment.customOrderFulfillmentId],
		references: [customOrderFulfillment.id]
	}),
	customOrderItem: one(customOrderItem, {
		fields: [customOrderItemFulfillment.customOrderItemId],
		references: [customOrderItem.id]
	}),
}));

export const stripeTransactionRelations = relations(stripeTransaction, ({one}) => ({
	order: one(orders, {
		fields: [stripeTransaction.loomOrderId],
		references: [orders.id]
	}),
}));

export const impactFactorRelations = relations(impactFactor, ({one}) => ({
	loomTenant: one(loomTenant, {
		fields: [impactFactor.tenantId],
		references: [loomTenant.id]
	}),
	workflow: one(workflow, {
		fields: [impactFactor.workflowId],
		references: [workflow.id]
	}),
}));
