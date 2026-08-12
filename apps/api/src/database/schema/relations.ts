import { relations } from "drizzle-orm/relations";
import { loomTenant, authenticationLog, orders, razorpayTransaction, address, badgeProfile, badgeProfileItem, blogContent, blogContentCategory, blogContentType, blogContentSection, productFabric, cartItem, productFinished, sizeProfileOption, customSizeProfile, customSizeProfileItem, workflow, element, faq, storyContent, workflowTemplate, elementTemplate, product, fabricProfileItem, fabricProfile, inventoryAdjustmentReason, inventoryAdjustment, warehouse, finishProfile, finishProfileItem, faqQuestion, inventoryRestockRequest, orderReviewScheduledEmail, madeToOrderProfile, sizeProfile, skuGroup, specialStatus, subCategory, volumeDiscountProfile, productSizeProfile, orderItem, productImageGallerySeo, review, productZohoRelation, sizeProfileGuide, category, segment, purchaseOrderFeedback, stepElement, storyProductMapping, storyContentCategory, storyContentSection, stepElementTemplate, subprocessElement, userRole, superUser, verificationToken, inventoryAdjustmentItem, volumeDiscountProfileItem, subprocessElementTemplate, customOrder, customOrderAdjustment, workflowCustomOrderMapping, customProduct, customImpactFactor, customOrderItem, artisan, artisanPaymentRecord, customer, loyaltyProgramConfig, artisanSkillMapping, skill, catalog, loyaltyProgramConfigAuditLog, elementFeedback, catalogItem, stripeTransaction, catalogItemMedia, workflowArtisanMapping, orderItemFulfillment, orderFulfillment, shipment, customOrderItemFulfillment, customOrderFulfillment, catalogPdf, customOrderItemReady, customOrderReady, orderReady, orderItemReady, stepElementArtisanMapping, impactFactor, subprocessElementArtisanMapping, whatsappNotificationHistory, emailNotificationHistory } from "./schema";

export const authenticationLogRelations = relations(authenticationLog, ({one}) => ({
	loomTenant: one(loomTenant, {
		fields: [authenticationLog.userId],
		references: [loomTenant.id]
	}),
}));

export const loomTenantRelations = relations(loomTenant, ({many}) => ({
	authenticationLogs: many(authenticationLog),
	addresses: many(address),
	blogContents: many(blogContent),
	cartItems: many(cartItem),
	inventoryAdjustments: many(inventoryAdjustment),
	inventoryRestockRequests: many(inventoryRestockRequest),
	orders: many(orders),
	storyContents: many(storyContent),
	userRoles: many(userRole),
	superUsers: many(superUser),
	verificationTokens: many(verificationToken),
	workflowTemplates: many(workflowTemplate),
	customImpactFactors: many(customImpactFactor),
	customOrders: many(customOrder),
	artisans: many(artisan),
	workflows: many(workflow),
	customers: many(customer),
	catalogPdfs: many(catalogPdf),
	impactFactors: many(impactFactor),
	whatsappNotificationHistories: many(whatsappNotificationHistory),
	emailNotificationHistories: many(emailNotificationHistory),
}));

export const razorpayTransactionRelations = relations(razorpayTransaction, ({one}) => ({
	order: one(orders, {
		fields: [razorpayTransaction.loomOrderId],
		references: [orders.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	razorpayTransactions: many(razorpayTransaction),
	orderReviewScheduledEmails: many(orderReviewScheduledEmail),
	orderItems: many(orderItem),
	loomTenant: one(loomTenant, {
		fields: [orders.tenantId],
		references: [loomTenant.id]
	}),
	purchaseOrderFeedbacks: many(purchaseOrderFeedback),
	stripeTransactions: many(stripeTransaction),
	orderItemFulfillments: many(orderItemFulfillment),
	orderFulfillments: many(orderFulfillment),
	orderReadies: many(orderReady),
	orderItemReadies: many(orderItemReady),
	impactFactors: many(impactFactor),
}));

export const addressRelations = relations(address, ({one}) => ({
	loomTenant: one(loomTenant, {
		fields: [address.tenantId],
		references: [loomTenant.id]
	}),
}));

export const badgeProfileItemRelations = relations(badgeProfileItem, ({one}) => ({
	badgeProfile: one(badgeProfile, {
		fields: [badgeProfileItem.profileId],
		references: [badgeProfile.id]
	}),
}));

export const badgeProfileRelations = relations(badgeProfile, ({many}) => ({
	badgeProfileItems: many(badgeProfileItem),
	products: many(product),
	subCategories: many(subCategory),
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

export const blogContentTypeRelations = relations(blogContentType, ({many}) => ({
	blogContentCategories: many(blogContentCategory),
}));

export const blogContentSectionRelations = relations(blogContentSection, ({one}) => ({
	blogContent: one(blogContent, {
		fields: [blogContentSection.blogContentId],
		references: [blogContent.id]
	}),
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
	inventoryRestockRequests: many(inventoryRestockRequest),
	productSizeProfiles: many(productSizeProfile),
	sizeProfileGuides: many(sizeProfileGuide),
	sizeProfile: one(sizeProfile, {
		fields: [sizeProfileOption.profileId],
		references: [sizeProfile.id]
	}),
}));

export const customSizeProfileItemRelations = relations(customSizeProfileItem, ({one}) => ({
	customSizeProfile: one(customSizeProfile, {
		fields: [customSizeProfileItem.profileId],
		references: [customSizeProfile.id]
	}),
}));

export const customSizeProfileRelations = relations(customSizeProfile, ({many}) => ({
	customSizeProfileItems: many(customSizeProfileItem),
	products: many(product),
	subCategories: many(subCategory),
}));

export const elementRelations = relations(element, ({one, many}) => ({
	workflow: one(workflow, {
		fields: [element.workflowId],
		references: [workflow.id]
	}),
	stepElements: many(stepElement),
	subprocessElements: many(subprocessElement),
	elementFeedbacks: many(elementFeedback),
}));

export const workflowRelations = relations(workflow, ({one, many}) => ({
	elements: many(element),
	stepElements: many(stepElement),
	subprocessElements: many(subprocessElement),
	workflowCustomOrderMappings: many(workflowCustomOrderMapping),
	customImpactFactors: many(customImpactFactor),
	artisanPaymentRecords: many(artisanPaymentRecord),
	workflowArtisanMappings: many(workflowArtisanMapping),
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
	impactFactors: many(impactFactor),
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

export const storyContentRelations = relations(storyContent, ({one, many}) => ({
	faqs: many(faq),
	storyProductMappings: many(storyProductMapping),
	loomTenant: one(loomTenant, {
		fields: [storyContent.authorId],
		references: [loomTenant.id]
	}),
	storyContentCategory: one(storyContentCategory, {
		fields: [storyContent.storyContentCategoryId],
		references: [storyContentCategory.id]
	}),
	storyContentSections: many(storyContentSection),
}));

export const elementTemplateRelations = relations(elementTemplate, ({one, many}) => ({
	workflowTemplate: one(workflowTemplate, {
		fields: [elementTemplate.workflowId],
		references: [workflowTemplate.id]
	}),
	stepElementTemplates: many(stepElementTemplate),
	subprocessElementTemplates: many(subprocessElementTemplate),
}));

export const workflowTemplateRelations = relations(workflowTemplate, ({one, many}) => ({
	elementTemplates: many(elementTemplate),
	stepElementTemplates: many(stepElementTemplate),
	loomTenant: one(loomTenant, {
		fields: [workflowTemplate.tenantId],
		references: [loomTenant.id]
	}),
	subprocessElementTemplates: many(subprocessElementTemplate),
	workflows: many(workflow),
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

export const productRelations = relations(product, ({one, many}) => ({
	fabricProfileItems: many(fabricProfileItem),
	inventoryRestockRequests_madeToOrderProductId: many(inventoryRestockRequest, {
		relationName: "inventoryRestockRequest_madeToOrderProductId_product_id"
	}),
	inventoryRestockRequests_productId: many(inventoryRestockRequest, {
		relationName: "inventoryRestockRequest_productId_product_id"
	}),
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
	productFinisheds: many(productFinished),
	productSizeProfiles: many(productSizeProfile),
	productImageGallerySeos: many(productImageGallerySeo),
	reviews: many(review),
	productZohoRelations: many(productZohoRelation),
	inventoryAdjustmentItems: many(inventoryAdjustmentItem),
	workflowCustomOrderMappings: many(workflowCustomOrderMapping),
	workflows: many(workflow),
}));

export const fabricProfileRelations = relations(fabricProfile, ({many}) => ({
	fabricProfileItems: many(fabricProfileItem),
	products: many(product),
	subCategories: many(subCategory),
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

export const finishProfileItemRelations = relations(finishProfileItem, ({one}) => ({
	finishProfile: one(finishProfile, {
		fields: [finishProfileItem.profileId],
		references: [finishProfile.id]
	}),
}));

export const finishProfileRelations = relations(finishProfile, ({many}) => ({
	finishProfileItems: many(finishProfileItem),
	products: many(product),
	subCategories: many(subCategory),
}));

export const faqQuestionRelations = relations(faqQuestion, ({one}) => ({
	faq: one(faq, {
		fields: [faqQuestion.faqId],
		references: [faq.id]
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

export const orderReviewScheduledEmailRelations = relations(orderReviewScheduledEmail, ({one}) => ({
	order: one(orders, {
		fields: [orderReviewScheduledEmail.orderId],
		references: [orders.id]
	}),
}));

export const madeToOrderProfileRelations = relations(madeToOrderProfile, ({many}) => ({
	products: many(product),
	subCategories: many(subCategory),
}));

export const sizeProfileRelations = relations(sizeProfile, ({many}) => ({
	products: many(product),
	sizeProfileGuides: many(sizeProfileGuide),
	sizeProfileOptions: many(sizeProfileOption),
}));

export const skuGroupRelations = relations(skuGroup, ({many}) => ({
	products: many(product),
}));

export const specialStatusRelations = relations(specialStatus, ({many}) => ({
	products: many(product),
}));

export const subCategoryRelations = relations(subCategory, ({one, many}) => ({
	products: many(product),
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
}));

export const volumeDiscountProfileRelations = relations(volumeDiscountProfile, ({many}) => ({
	products: many(product),
	subCategories: many(subCategory),
	volumeDiscountProfileItems: many(volumeDiscountProfileItem),
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

export const orderItemRelations = relations(orderItem, ({one, many}) => ({
	order: one(orders, {
		fields: [orderItem.orderId],
		references: [orders.id]
	}),
	orderItemReadies: many(orderItemReady),
	impactFactors: many(impactFactor),
}));

export const productImageGallerySeoRelations = relations(productImageGallerySeo, ({one}) => ({
	product: one(product, {
		fields: [productImageGallerySeo.productId],
		references: [product.id]
	}),
}));

export const reviewRelations = relations(review, ({one}) => ({
	product: one(product, {
		fields: [review.productId],
		references: [product.id]
	}),
}));

export const productZohoRelationRelations = relations(productZohoRelation, ({one}) => ({
	product: one(product, {
		fields: [productZohoRelation.productId],
		references: [product.id]
	}),
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

export const segmentRelations = relations(segment, ({one, many}) => ({
	category: one(category, {
		fields: [segment.categoryId],
		references: [category.id]
	}),
	subCategories: many(subCategory),
}));

export const categoryRelations = relations(category, ({many}) => ({
	segments: many(segment),
}));

export const purchaseOrderFeedbackRelations = relations(purchaseOrderFeedback, ({one}) => ({
	order: one(orders, {
		fields: [purchaseOrderFeedback.orderId],
		references: [orders.id]
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

export const storyProductMappingRelations = relations(storyProductMapping, ({one}) => ({
	storyContent: one(storyContent, {
		fields: [storyProductMapping.storyContentId],
		references: [storyContent.id]
	}),
}));

export const storyContentCategoryRelations = relations(storyContentCategory, ({many}) => ({
	storyContents: many(storyContent),
}));

export const storyContentSectionRelations = relations(storyContentSection, ({one}) => ({
	storyContent: one(storyContent, {
		fields: [storyContentSection.storyContentId],
		references: [storyContent.id]
	}),
}));

export const stepElementTemplateRelations = relations(stepElementTemplate, ({one, many}) => ({
	elementTemplate: one(elementTemplate, {
		fields: [stepElementTemplate.elementId],
		references: [elementTemplate.id]
	}),
	workflowTemplate: one(workflowTemplate, {
		fields: [stepElementTemplate.workflowId],
		references: [workflowTemplate.id]
	}),
	subprocessElementTemplates: many(subprocessElementTemplate),
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

export const userRoleRelations = relations(userRole, ({one}) => ({
	loomTenant: one(loomTenant, {
		fields: [userRole.userId],
		references: [loomTenant.id]
	}),
}));

export const superUserRelations = relations(superUser, ({one}) => ({
	loomTenant: one(loomTenant, {
		fields: [superUser.tenantId],
		references: [loomTenant.id]
	}),
}));

export const verificationTokenRelations = relations(verificationToken, ({one}) => ({
	loomTenant: one(loomTenant, {
		fields: [verificationToken.tenantId],
		references: [loomTenant.id]
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

export const volumeDiscountProfileItemRelations = relations(volumeDiscountProfileItem, ({one}) => ({
	volumeDiscountProfile: one(volumeDiscountProfile, {
		fields: [volumeDiscountProfileItem.profileId],
		references: [volumeDiscountProfile.id]
	}),
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

export const customOrderAdjustmentRelations = relations(customOrderAdjustment, ({one}) => ({
	customOrder: one(customOrder, {
		fields: [customOrderAdjustment.customOrderId],
		references: [customOrder.id]
	}),
}));

export const customOrderRelations = relations(customOrder, ({one, many}) => ({
	customOrderAdjustments: many(customOrderAdjustment),
	customImpactFactors: many(customImpactFactor),
	loomTenant: one(loomTenant, {
		fields: [customOrder.tenantId],
		references: [loomTenant.id]
	}),
	customOrderItems: many(customOrderItem),
	customOrderItemFulfillments: many(customOrderItemFulfillment),
	customOrderFulfillments: many(customOrderFulfillment),
	customOrderItemReadies: many(customOrderItemReady),
	customOrderReadies: many(customOrderReady),
}));

export const workflowCustomOrderMappingRelations = relations(workflowCustomOrderMapping, ({one}) => ({
	workflow: one(workflow, {
		fields: [workflowCustomOrderMapping.workflowId],
		references: [workflow.id]
	}),
	product: one(product, {
		fields: [workflowCustomOrderMapping.productId],
		references: [product.id]
	}),
	customProduct: one(customProduct, {
		fields: [workflowCustomOrderMapping.customProductId],
		references: [customProduct.id]
	}),
}));

export const customProductRelations = relations(customProduct, ({many}) => ({
	workflowCustomOrderMappings: many(workflowCustomOrderMapping),
}));

export const customImpactFactorRelations = relations(customImpactFactor, ({one}) => ({
	workflow: one(workflow, {
		fields: [customImpactFactor.workflowId],
		references: [workflow.id]
	}),
	customOrder: one(customOrder, {
		fields: [customImpactFactor.customOrderId],
		references: [customOrder.id]
	}),
	loomTenant: one(loomTenant, {
		fields: [customImpactFactor.tenantId],
		references: [loomTenant.id]
	}),
	customOrderItem: one(customOrderItem, {
		fields: [customImpactFactor.customOrderItemId],
		references: [customOrderItem.id]
	}),
}));

export const customOrderItemRelations = relations(customOrderItem, ({one, many}) => ({
	customImpactFactors: many(customImpactFactor),
	customOrder: one(customOrder, {
		fields: [customOrderItem.customOrderId],
		references: [customOrder.id]
	}),
	customOrderItemReadies: many(customOrderItemReady),
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
	artisanSkillMappings: many(artisanSkillMapping),
	artisan: one(artisan, {
		fields: [artisan.masterArtisanId],
		references: [artisan.id],
		relationName: "artisan_masterArtisanId_artisan_id"
	}),
	artisans: many(artisan, {
		relationName: "artisan_masterArtisanId_artisan_id"
	}),
	loomTenant: one(loomTenant, {
		fields: [artisan.tenantId],
		references: [loomTenant.id]
	}),
	catalogs: many(catalog),
	workflowArtisanMappings: many(workflowArtisanMapping),
	catalogPdfs: many(catalogPdf),
	stepElementArtisanMappings: many(stepElementArtisanMapping),
	subprocessElementArtisanMappings: many(subprocessElementArtisanMapping),
}));

export const loyaltyProgramConfigRelations = relations(loyaltyProgramConfig, ({one}) => ({
	customer: one(customer, {
		fields: [loyaltyProgramConfig.customerId],
		references: [customer.id]
	}),
}));

export const customerRelations = relations(customer, ({one, many}) => ({
	loyaltyProgramConfigs: many(loyaltyProgramConfig),
	loyaltyProgramConfigAuditLogs: many(loyaltyProgramConfigAuditLog),
	loomTenant: one(loomTenant, {
		fields: [customer.tenantId],
		references: [loomTenant.id]
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

export const catalogRelations = relations(catalog, ({one, many}) => ({
	artisan: one(artisan, {
		fields: [catalog.artisanId],
		references: [artisan.id]
	}),
	catalogItems: many(catalogItem),
}));

export const loyaltyProgramConfigAuditLogRelations = relations(loyaltyProgramConfigAuditLog, ({one}) => ({
	customer: one(customer, {
		fields: [loyaltyProgramConfigAuditLog.customerId],
		references: [customer.id]
	}),
}));

export const elementFeedbackRelations = relations(elementFeedback, ({one}) => ({
	element: one(element, {
		fields: [elementFeedback.elementId],
		references: [element.id]
	}),
}));

export const catalogItemRelations = relations(catalogItem, ({one, many}) => ({
	catalog: one(catalog, {
		fields: [catalogItem.catalogId],
		references: [catalog.id]
	}),
	catalogItemMedias: many(catalogItemMedia),
}));

export const stripeTransactionRelations = relations(stripeTransaction, ({one}) => ({
	order: one(orders, {
		fields: [stripeTransaction.loomOrderId],
		references: [orders.id]
	}),
}));

export const catalogItemMediaRelations = relations(catalogItemMedia, ({one}) => ({
	catalogItem: one(catalogItem, {
		fields: [catalogItemMedia.catalogItemId],
		references: [catalogItem.id]
	}),
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

export const orderItemFulfillmentRelations = relations(orderItemFulfillment, ({one}) => ({
	order: one(orders, {
		fields: [orderItemFulfillment.orderId],
		references: [orders.id]
	}),
}));

export const orderFulfillmentRelations = relations(orderFulfillment, ({one}) => ({
	order: one(orders, {
		fields: [orderFulfillment.orderId],
		references: [orders.id]
	}),
	shipment: one(shipment, {
		fields: [orderFulfillment.shipmentId],
		references: [shipment.id]
	}),
}));

export const shipmentRelations = relations(shipment, ({many}) => ({
	orderFulfillments: many(orderFulfillment),
	customOrderFulfillments: many(customOrderFulfillment),
}));

export const customOrderItemFulfillmentRelations = relations(customOrderItemFulfillment, ({one}) => ({
	customOrder: one(customOrder, {
		fields: [customOrderItemFulfillment.customOrderId],
		references: [customOrder.id]
	}),
}));

export const customOrderFulfillmentRelations = relations(customOrderFulfillment, ({one}) => ({
	customOrder: one(customOrder, {
		fields: [customOrderFulfillment.customOrderId],
		references: [customOrder.id]
	}),
	shipment: one(shipment, {
		fields: [customOrderFulfillment.shipmentId],
		references: [shipment.id]
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

export const customOrderItemReadyRelations = relations(customOrderItemReady, ({one}) => ({
	customOrder: one(customOrder, {
		fields: [customOrderItemReady.customOrderId],
		references: [customOrder.id]
	}),
	customOrderReady: one(customOrderReady, {
		fields: [customOrderItemReady.customOrderReadyId],
		references: [customOrderReady.id]
	}),
	customOrderItem: one(customOrderItem, {
		fields: [customOrderItemReady.customOrderItemId],
		references: [customOrderItem.id]
	}),
}));

export const customOrderReadyRelations = relations(customOrderReady, ({one, many}) => ({
	customOrderItemReadies: many(customOrderItemReady),
	customOrder: one(customOrder, {
		fields: [customOrderReady.customOrderId],
		references: [customOrder.id]
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
	order: one(orders, {
		fields: [orderItemReady.orderId],
		references: [orders.id]
	}),
	orderReady: one(orderReady, {
		fields: [orderItemReady.orderReadyId],
		references: [orderReady.id]
	}),
	orderItem: one(orderItem, {
		fields: [orderItemReady.orderItemId],
		references: [orderItem.id]
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

export const impactFactorRelations = relations(impactFactor, ({one}) => ({
	workflow: one(workflow, {
		fields: [impactFactor.workflowId],
		references: [workflow.id]
	}),
	order: one(orders, {
		fields: [impactFactor.orderId],
		references: [orders.id]
	}),
	orderItem: one(orderItem, {
		fields: [impactFactor.orderItemId],
		references: [orderItem.id]
	}),
	loomTenant: one(loomTenant, {
		fields: [impactFactor.tenantId],
		references: [loomTenant.id]
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