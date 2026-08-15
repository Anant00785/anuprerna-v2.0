import { pgTable, foreignKey, bigserial, bigint, smallint, text, index, varchar, numeric, integer, boolean, jsonb, unique, doublePrecision, vector, check, pgSequence, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const addressTypeEnum = pgEnum("address_type_enum", ['SHIPPING', 'BILLING'])
export const artisanRoleEnum = pgEnum("artisan_role_enum", ['MASTER', 'WORKER'])
export const authActionEnum = pgEnum("auth_action_enum", ['LOGIN', 'LOGOUT'])
export const authProviderEnum = pgEnum("auth_provider_enum", ['UNKNOWN', 'BASIC', 'GOOGLE', 'FACEBOOK'])
export const catalogItemMediaTypeEnum = pgEnum("catalog_item_media_type_enum", ['IMAGE', 'VIDEO', 'UNKNOWN'])
export const discountMethodEnum = pgEnum("discount_method_enum", ['AUTOMATIC', 'MANUAL'])
export const discountTypeEnum = pgEnum("discount_type_enum", ['FREE_SHIPPING', 'PERCENTAGE_OFF'])
export const elementFeedbackStatusEnum = pgEnum("element_feedback_status_enum", ['PENDING', 'APPROVED', 'REJECTED'])
export const elementFeedbackUploaderEnum = pgEnum("element_feedback_uploader_enum", ['ADMIN', 'ARTISAN'])
export const elementStatusEnum = pgEnum("element_status_enum", ['PENDING', 'IN_PROGRESS', 'HALTED', 'COMPLETED'])
export const elementTypeEnum = pgEnum("element_type_enum", ['STEP', 'SUBPROCESS'])
export const emailNotificationEntityTypeEnum = pgEnum("email_notification_entity_type_enum", ['ORDER', 'CUSTOM_ORDER', 'WORKFLOW'])
export const emailNotificationStatusEnum = pgEnum("email_notification_status_enum", ['PENDING_SEND', 'POST_SUCCESS', 'POST_FAILED', 'POST_ERROR'])
export const emailNotificationTriggerTypeEnum = pgEnum("email_notification_trigger_type_enum", ['ORDER_CONFIRMATION', 'ORDER_FULFILLMENT_DISPATCH', 'ORDER_PAYMENT_FAILED', 'ORDER_CANCELLED', 'ORDER_REVIEW_REQUEST', 'CUSTOM_ORDER_CONFIRMATION', 'CUSTOM_ORDER_DISPATCH', 'PRE_ORDER_CONFIRMATION', 'PRE_ORDER_READY_TO_SHIP', 'CONTACT_US', 'CUSTOMER_BTS_UPDATE', 'INTERNAL_BTS_UPDATE', 'WORKFLOW_STATUS_UPDATE'])
export const genderEnum = pgEnum("gender_enum", ['MALE', 'FEMALE', 'OTHER', 'UNDEFINED'])
export const imageFormatEnum = pgEnum("image_format_enum", ['JPEG', 'PNG', 'WEBP', 'GIF', 'SVG', 'TIFF', 'UNKNOWN'])
export const imageOptimizationPriorityEnum = pgEnum("image_optimization_priority_enum", ['INCOMING', 'BACKLOG'])
export const imageOptimizationRunStateEnum = pgEnum("image_optimization_run_state_enum", ['RUNNING', 'PAUSED'])
export const imageOptimizationStateEnum = pgEnum("image_optimization_state_enum", ['DISCOVERED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED', 'UNSUPPORTED'])
export const imageOptimizationWorkerStopReasonEnum = pgEnum("image_optimization_worker_stop_reason_enum", ['MANUAL', 'EXPIRED', 'SHUTDOWN'])
export const imagePositionEnum = pgEnum("image_position_enum", ['LT', 'RT', 'CT'])
export const locationTypeEnum = pgEnum("location_type_enum", ['DOMESTIC', 'INTERNATIONAL'])
export const logEnum = pgEnum("log_enum", ['EMERGENCY', 'ALERT', 'CRITICAL', 'ERROR', 'WARNING', 'NOTICE', 'INFO', 'DEBUG'])
export const loyaltyConfigAuditLogType = pgEnum("loyalty_config_audit_log_type", ['ONBOARDING', 'RENEWAL_AUTO', 'RENEWAL_MANUAL', 'ADJUSTMENT'])
export const orderStatusEnum = pgEnum("order_status_enum", ['INITIATED', 'PROCESSING', 'CANCELLED', 'IN_TRANSIT', 'PARTIALLY_DISPATCHED', 'DELIVERED', 'FAILED', 'DISPATCHED'])
export const orderTypeEnum = pgEnum("order_type_enum", ['IN_STOCK', 'MADE_TO_ORDER', 'PRE_ORDER'])
export const paymentModeEnum = pgEnum("payment_mode_enum", ['RAZORPAY', 'STRIPE', 'BANK', 'COD'])
export const paymentStatusEnum = pgEnum("payment_status_enum", ['PENDING', 'PREPAID', 'PAID', 'FAILED'])
export const restockRequestStatus = pgEnum("restock_request_status", ['PENDING', 'PARTIALLY_FULFUILLED', 'FULFILLED', 'CONVERTED'])
export const reviewStatusEnum = pgEnum("review_status_enum", ['PENDING', 'APPROVED', 'REMOVED'])
export const scheduledEmailStatus = pgEnum("scheduled_email_status", ['PENDING', 'COMPLETED'])
export const settingsAttributeEnum = pgEnum("settings_attribute_enum", ['CASH_ON_DELIVERY', 'SWATCH_PRICE_PERCENTAGE', 'FABRIC_SITE_NOTIFICATION', 'CRAFT_SITE_NOTIFICATION', 'IMPACT_ASSUMPTIONS'])
export const settingsAttributeTypeEnum = pgEnum("settings_attribute_type_enum", ['NUMBER', 'BOOLEAN', 'TEXT', 'OBJECT'])
export const storyContentTypeEnum = pgEnum("story_content_type_enum", ['ARTISTS', 'CRAFTS', 'CLUSTERS', 'COLLABORATIONS'])
export const transactionStatusEnum = pgEnum("transaction_status_enum", ['CREATED', 'PAID', 'FAILED'])
export const unitEnum = pgEnum("unit_enum", ['UNIT', 'METER'])
export const usageTypeEnum = pgEnum("usage_type_enum", ['SINGLE', 'MULTIPLE'])
export const userRoleEnum = pgEnum("user_role_enum", ['ROLE_GOD_MODE', 'ROLE_SUPER_USER', 'ROLE_ADMIN', 'ROLE_CUSTOMER', 'ROLE_ARTISAN'])
export const whatsappNotificationEntityTypeEnum = pgEnum("whatsapp_notification_entity_type_enum", ['ORDER', 'ORDER_FULFILLMENT', 'CUSTOM_ORDER', 'CUSTOM_ORDER_FULFILLMENT'])
export const whatsappNotificationStatusEnum = pgEnum("whatsapp_notification_status_enum", ['PENDING_SEND', 'POST_SUCCESS', 'POST_FAILED', 'POST_ERROR', 'SENT', 'DELIVERED', 'READ', 'FAILED_DELIVERY'])
export const whatsappNotificationTenantTypeEnum = pgEnum("whatsapp_notification_tenant_type_enum", ['CUSTOMER', 'ARTISAN'])
export const whatsappNotificationTriggerTypeEnum = pgEnum("whatsapp_notification_trigger_type_enum", ['ORDER_CONFIRMATION', 'ORDER_DISPATCH', 'ORDER_FULFILLMENT_DISPATCH', 'CUSTOM_ORDER_FULFILLMENT_DISPATCH', 'ORDER_CANCELLED', 'CUSTOMER_BTS_UPDATE', 'CUSTOM_ORDER_CONFIRMATION', 'PRE_ORDER_READY_TO_SHIP'])
export const whatsappOptInStatusEnum = pgEnum("whatsapp_opt_in_status_enum", ['OPTED_IN', 'OPTED_OUT', 'DISMISSED'])
export const workflowStatusEnum = pgEnum("workflow_status_enum", ['CREATED', 'INITIATED', 'COMPLETED', 'HALTED'])
export const workflowTypeEnum = pgEnum("workflow_type_enum", ['ORDER', 'CUSTOM_ORDER'])

export const behemothIdSequence = pgSequence("behemoth_id_sequence", {  startWith: "1", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })
export const logIdSequence = pgSequence("log_id_sequence", {  startWith: "1", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })

export const authenticationLog = pgTable("authentication_log", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	action: authActionEnum().default('LOGIN').notNull(),
	userId: bigserial("user_id", { mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	time: bigint({ mode: "number" }).notNull(),
	attempt: smallint().default(1).notNull(),
	information: text().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [loomTenant.id],
			name: "fk_user_id"
		}),
]);

export const razorpayTransaction = pgTable("razorpay_transaction", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	razorpayOrderId: varchar("razorpay_order_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	loomOrderId: bigint("loom_order_id", { mode: "number" }).notNull(),
	amount: numeric().notNull(),
	currency: varchar().notNull(),
	transactionId: varchar("transaction_id").default('').notNull(),
	transactionSignature: text("transaction_signature").default('').notNull(),
	status: transactionStatusEnum().notNull(),
	failedErrorCode: integer("failed_error_code").default(sql`'-1'`),
	failedErrorMessage: varchar("failed_error_message").default(''),
	dataDump: text("data_dump").default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	paymentType: varchar("payment_type").default('advance').notNull(),
	webhookReceived: boolean("webhook_received").default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	webhookReceivedAt: bigint("webhook_received_at", { mode: "number" }),
	webhookDataDump: jsonb("webhook_data_dump").default({}),
	webhookEventType: varchar("webhook_event_type").default('').notNull(),
	webhookEventId: varchar("webhook_event_id").default('').notNull(),
}, (table) => [
	index("idx_razorpay_transaction_razorpay_order_id").using("btree", table.razorpayOrderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.loomOrderId],
			foreignColumns: [orders.id],
			name: "fk_loom_order_id"
		}),
]);

export const address = pgTable("address", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	name: varchar().notNull(),
	addressLine1: varchar("address_line_1").notNull(),
	addressLine2: varchar("address_line_2").default('').notNull(),
	postalCode: varchar("postal_code", { length: 10 }).notNull(),
	city: varchar({ length: 100 }).notNull(),
	state: varchar({ length: 100 }).notNull(),
	country: varchar().notNull(),
	companyName: varchar("company_name").default('').notNull(),
	primaryPhone: varchar("primary_phone").notNull(),
	secondaryPhone: varchar("secondary_phone").default('').notNull(),
	contactEmail: varchar("contact_email").notNull(),
	vatGstNumber: varchar("vat_gst_number", { length: 100 }).default('').notNull(),
	eoriNumber: varchar("eori_number", { length: 100 }).default('').notNull(),
	addressType: addressTypeEnum("address_type").notNull(),
	primaryBillingAddress: boolean("primary_billing_address").default(false).notNull(),
	primaryShippingAddress: boolean("primary_shipping_address").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_tenant_id"
		}),
]);

export const badgeProfile = pgTable("badge_profile", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	profileName: varchar("profile_name", { length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_badge_profile_name").on(table.profileName),
]);

export const blogContentType = pgTable("blog_content_type", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
});

export const badgeProfileItem = pgTable("badge_profile_item", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	image: text().notNull(),
	caption: varchar({ length: 255 }).notNull(),
	link: text().default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	profileId: bigint("profile_id", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [badgeProfile.id],
			name: "fk_profile_id"
		}),
]);

export const blogContent = pgTable("blog_content", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	blogContentCategoryId: bigint("blog_content_category_id", { mode: "number" }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	readingTime: integer("reading_time").default(0).notNull(),
	bannerImageDesktop: text("banner_image_desktop").default('').notNull(),
	bannerImageMobile: text("banner_image_mobile").default('').notNull(),
	bannerImageParallax: text("banner_image_parallax").default(''),
	parallaxText: varchar("parallax_text", { length: 255 }).default(''),
	slug: varchar({ length: 255 }).default(''),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	previousBlog: bigint("previous_blog", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	nextBlog: bigint("next_blog", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	authorId: bigint("author_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	lastUpdateTime: bigint("last_update_time", { mode: "number" }).notNull(),
	metaTitle: varchar("meta_title", { length: 255 }).default('').notNull(),
	metaDescription: varchar("meta_description", { length: 255 }).default('').notNull(),
	bannerImageAlt: text("banner_image_alt").default('').notNull(),
	bannerImageParallaxAlt: text("banner_image_parallax_alt").default('').notNull(),
	backwardCompatibleLink: text("backward_compatible_link").default('').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [loomTenant.id],
			name: "fk_author_id"
		}),
	foreignKey({
			columns: [table.blogContentCategoryId],
			foreignColumns: [blogContentCategory.id],
			name: "fk_blog_content_category_id"
		}),
]);

export const blogContentCategory = pgTable("blog_content_category", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	blogContentTypeId: bigint("blog_content_type_id", { mode: "number" }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.blogContentTypeId],
			foreignColumns: [blogContentType.id],
			name: "fk_blog_content_type_id"
		}),
]);

export const blogContentSection = pgTable("blog_content_section", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	blogContentId: bigint("blog_content_id", { mode: "number" }).notNull(),
	templateType: integer("template_type").notNull(),
	templateColor: integer("template_color").notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	image1: text("image_1").default(''),
	image2: text("image_2").default(''),
	caption1: varchar("caption_1", { length: 255 }).default(''),
	caption2: varchar("caption_2", { length: 255 }).default(''),
	video1: text("video_1").default(''),
	video2: text("video_2").default(''),
	heading: varchar({ length: 255 }).default(''),
	title1: varchar("title_1", { length: 255 }).default(''),
	title2: varchar("title_2", { length: 255 }).default(''),
	paragraph1: text("paragraph_1").default(''),
	paragraph2: text("paragraph_2").default(''),
	ctaButtonName1: varchar("cta_button_name_1", { length: 255 }).default(''),
	ctaLink1: text("cta_link_1").default(''),
	ctaButtonName2: varchar("cta_button_name_2", { length: 255 }).default(''),
	ctaLink2: text("cta_link_2").default(''),
	topMotif: text("top_motif").default(''),
	bottomMotif: text("bottom_motif").default(''),
	image1Alt: text("image_1_alt").default('').notNull(),
	image2Alt: text("image_2_alt").default('').notNull(),
	video1Alt: text("video_1_alt").default('').notNull(),
	video2Alt: text("video_2_alt").default('').notNull(),
	image1Link: text("image_1_link").default(''),
	image2Link: text("image_2_link").default(''),
}, (table) => [
	foreignKey({
			columns: [table.blogContentId],
			foreignColumns: [blogContent.id],
			name: "fk_blog_content_id"
		}),
]);

export const cartItem = pgTable("cart_item", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fabricProductId: bigint("fabric_product_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	finishedProductId: bigint("finished_product_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	selectedFabricId: bigint("selected_fabric_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	selectedSizeOptionId: bigint("selected_size_option_id", { mode: "number" }),
	selectedFinishId: varchar("selected_finish_id").default(''),
	customSize: jsonb("custom_size").default({}).notNull(),
	productGroup: varchar("product_group").notNull(),
	orderType: orderTypeEnum("order_type").notNull(),
	quantity: numeric().notNull(),
	unit: unitEnum().default('METER').notNull(),
	makingCharge: numeric("making_charge", { precision: 8, scale:  2 }).default('0.00').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	lastUpdatedAt: bigint("last_updated_at", { mode: "number" }).default(sql`(EXTRACT(epoch FROM CURRENT_TIMESTAMP) * (1000)::numeric)`).notNull(),
	clickId: text("click_id"),
	clickIdType: text("click_id_type"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clickCapturedAt: bigint("click_captured_at", { mode: "number" }),
	utmSource: text("utm_source"),
	utmMedium: text("utm_medium"),
	utmCampaign: text("utm_campaign"),
}, (table) => [
	foreignKey({
			columns: [table.fabricProductId],
			foreignColumns: [productFabric.id],
			name: "fk_fabric_product_id"
		}),
	foreignKey({
			columns: [table.finishedProductId],
			foreignColumns: [productFinished.id],
			name: "fk_finished_product_id"
		}),
	foreignKey({
			columns: [table.selectedFabricId],
			foreignColumns: [productFabric.id],
			name: "fk_selected_fabric_id"
		}),
	foreignKey({
			columns: [table.selectedSizeOptionId],
			foreignColumns: [sizeProfileOption.id],
			name: "fk_selected_size_option_id"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_tenant_id"
		}),
]);

export const color = pgTable("color", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	hex: varchar({ length: 7 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_color_name").on(table.name),
]);

export const customSizeProfileItem = pgTable("custom_size_profile_item", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	profileId: bigint("profile_id", { mode: "number" }).notNull(),
	label: varchar({ length: 255 }).notNull(),
	fieldType: integer("field_type").notNull(),
	placeholder: varchar({ length: 255 }).notNull(),
	mandatory: boolean().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [customSizeProfile.id],
			name: "fk_profile_id"
		}),
]);

export const discount = pgTable("discount", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	discountType: discountTypeEnum("discount_type").notNull(),
	discountMethod: discountMethodEnum("discount_method").notNull(),
	discountPercentage: doublePrecision("discount_percentage").default(0).notNull(),
	minimumOrderValue: integer("minimum_order_value").notNull(),
	location: locationTypeEnum().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	startDate: bigint("start_date", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	endDate: bigint("end_date", { mode: "number" }).default(0).notNull(),
	couponCode: varchar("coupon_code").default('').notNull(),
	usageType: usageTypeEnum("usage_type").notNull(),
	active: boolean().default(true).notNull(),
});

export const fabricProfile = pgTable("fabric_profile", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	profileName: varchar("profile_name", { length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_fabric_profile_name").on(table.profileName),
]);

export const element = pgTable("element", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	workflowId: bigint("workflow_id", { mode: "number" }).notNull(),
	elementId: varchar("element_id").notNull(),
	type: elementTypeEnum().notNull(),
	posX: integer("pos_x").notNull(),
	posY: integer("pos_y").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflow.id],
			name: "fk_workflow_id"
		}),
]);

export const faq = pgTable("faq", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	storyContentId: bigint("story_content_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	blogContentId: bigint("blog_content_id", { mode: "number" }),
	heading: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.blogContentId],
			foreignColumns: [blogContent.id],
			name: "fk_blog_content_id"
		}),
	foreignKey({
			columns: [table.storyContentId],
			foreignColumns: [storyContent.id],
			name: "fk_story_content_id"
		}),
]);

export const elementTemplate = pgTable("element_template", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	workflowId: bigint("workflow_id", { mode: "number" }).notNull(),
	elementId: varchar("element_id").notNull(),
	type: elementTypeEnum().notNull(),
	posX: integer("pos_x").notNull(),
	posY: integer("pos_y").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflowTemplate.id],
			name: "fk_workflow_id"
		}),
]);

export const fabricProfileItem = pgTable("fabric_profile_item", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	profileId: bigint("profile_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	mockupImage: text("mockup_image").default('').notNull(),
	mockupText: text("mockup_text").default('').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "fk_product_id"
		}),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [fabricProfile.id],
			name: "fk_profile_id"
		}),
]);

export const inventoryAdjustment = pgTable("inventory_adjustment", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	adjustmentDate: bigint("adjustment_date", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	warehouseId: bigint("warehouse_id", { mode: "number" }).notNull(),
	referenceNo: varchar("reference_no").default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	reasonId: bigint("reason_id", { mode: "number" }).default(0).notNull(),
	description: text().default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.reasonId],
			foreignColumns: [inventoryAdjustmentReason.id],
			name: "fk_reason_id"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [loomTenant.id],
			name: "fk_user_id"
		}),
	foreignKey({
			columns: [table.warehouseId],
			foreignColumns: [warehouse.id],
			name: "fk_warehouse_id"
		}),
]);

export const forex = pgTable("forex", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	country: varchar().notNull(),
	currency: varchar().notNull(),
	rate: numeric().notNull(),
}, (table) => [
	unique("unique_country").on(table.country),
]);

export const forexExchangeRate = pgTable("forex_exchange_rate", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	recordDate: bigint("record_date", { mode: "number" }).notNull(),
	gbp: numeric({ precision: 8, scale:  4 }).notNull(),
	eur: numeric({ precision: 8, scale:  4 }).notNull(),
	usd: numeric({ precision: 8, scale:  4 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const finishProfileItem = pgTable("finish_profile_item", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	profileId: bigint("profile_id", { mode: "number" }).notNull(),
	label: varchar().notNull(),
	description: text().notNull(),
	image: text().notNull(),
	price: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [finishProfile.id],
			name: "fk_profile_id"
		}),
]);

export const faqQuestion = pgTable("faq_question", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	question: text().notNull(),
	answer: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	faqId: bigint("faq_id", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.faqId],
			foreignColumns: [faq.id],
			name: "fk_faq_id"
		}),
]);

export const finishProfile = pgTable("finish_profile", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	profileName: varchar("profile_name", { length: 255 }).notNull(),
	displayName: varchar("display_name", { length: 255 }).default('Finish').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_finish_profile_name").on(table.profileName),
]);

export const inventoryAdjustmentReason = pgTable("inventory_adjustment_reason", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	reason: varchar().notNull(),
	description: varchar().default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_inventory_adjustment_reason").on(table.reason),
]);

export const log = pgTable("log", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	logger: text().notNull(),
	logType: logEnum("log_type").notNull(),
	message: text().notNull(),
	dataDump: text("data_dump").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	time: bigint({ mode: "number" }).notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
});

export const inventoryRestockRequest = pgTable("inventory_restock_request", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	madeToOrderProductId: bigint("made_to_order_product_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sizeOptionId: bigint("size_option_id", { mode: "number" }),
	productGroup: varchar("product_group", { length: 20 }).notNull(),
	requestedQuantity: numeric("requested_quantity").default('0.0').notNull(),
	status: restockRequestStatus().default('PENDING').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	notifiedAt: bigint("notified_at", { mode: "number" }).default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.madeToOrderProductId],
			foreignColumns: [product.id],
			name: "fk_made_to_order_product_id"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "fk_product_id"
		}),
	foreignKey({
			columns: [table.sizeOptionId],
			foreignColumns: [sizeProfileOption.id],
			name: "fk_size_option_id"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_tenant_id"
		}),
]);

export const material = pgTable("material", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	index("trgm_index_material").using("gin", table.name.asc().nullsLast().op("gin_trgm_ops")),
	unique("unique_material_name").on(table.name),
]);

export const orderReviewScheduledEmail = pgTable("order_review_scheduled_email", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }).notNull(),
	products: jsonb().default({}).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	queuedDate: bigint("queued_date", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	scheduledDate: bigint("scheduled_date", { mode: "number" }).notNull(),
	status: scheduledEmailStatus().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "fk_order_id"
		}),
]);

export const madeToOrderProfile = pgTable("made_to_order_profile", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	profileName: varchar("profile_name", { length: 255 }).notNull(),
	minimumOrderQuantity: integer("minimum_order_quantity").notNull(),
	deliveryFromDays: integer("delivery_from_days").notNull(),
	deliveryToDays: integer("delivery_to_days").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
	consumedFabric: numeric("consumed_fabric", { precision: 8, scale:  2 }).default('0.0').notNull(),
}, (table) => [
	unique("unique_made_to_order_profile_name").on(table.profileName),
]);

export const pattern = pgTable("pattern", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_pattern_name").on(table.name),
]);

export const productFabric = pgTable("product_fabric", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	addToSwatch: boolean("add_to_swatch").default(true).notNull(),
	gsm: integer().notNull(),
	width: varchar({ length: 255 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "fk_product_id"
		}),
]);

export const product = pgTable("product", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subCategoryId: bigint("sub_category_id", { mode: "number" }).notNull(),
	name: text().notNull(),
	sku: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	skuGroupId: bigint("sku_group_id", { mode: "number" }).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	unit: unitEnum().default('METER').notNull(),
	mainProductCheck: boolean("main_product_check").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	mainProductId: bigint("main_product_id", { mode: "number" }),
	tagId: varchar("tag_id", { length: 255 }).default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	badgeProfileId: bigint("badge_profile_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	volumeDiscountProfileId: bigint("volume_discount_profile_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	madeToOrderProfileId: bigint("made_to_order_profile_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	madeToOrderFabricId: bigint("made_to_order_fabric_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sizeProfileId: bigint("size_profile_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customSizeProfileId: bigint("custom_size_profile_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	finishProfileId: bigint("finish_profile_id", { mode: "number" }),
	finishProfileItemId: varchar("finish_profile_item_id", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fabricProfileId: bigint("fabric_profile_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	specialStatusId: bigint("special_status_id", { mode: "number" }),
	productOverview: text("product_overview").notNull(),
	productCare: text("product_care").notNull(),
	materialId: varchar("material_id", { length: 255 }).notNull(),
	colorId: varchar("color_id", { length: 255 }).notNull(),
	patternId: varchar("pattern_id", { length: 255 }).default(''),
	sale: boolean().default(false),
	discount: numeric({ precision: 5, scale:  2 }).default('0.00'),
	heroImage: text("hero_image").default(''),
	hoverImage: text("hover_image").default(''),
	galleryImages: text("gallery_images").default(''),
	productGroup: varchar("product_group", { length: 255 }).notNull(),
	slug: text().notNull(),
	productVideo: varchar("product_video").default('').notNull(),
	disabled: boolean().default(false).notNull(),
	metaTitle: varchar("meta_title", { length: 70 }).default('').notNull(),
	metaDescription: varchar("meta_description", { length: 165 }).default('').notNull(),
	heroImageAlt: text("hero_image_alt").default('').notNull(),
	hoverImageAlt: text("hover_image_alt").default('').notNull(),
	productVideoAlt: text("product_video_alt").default('').notNull(),
	backwardCompatibleLink: text("backward_compatible_link").default('').notNull(),
	quantity: numeric({ precision: 8, scale:  2 }).default('0.00').notNull(),
	externalQuantity: numeric("external_quantity").default('0').notNull(),
	badgeProfileEnabled: boolean("badge_profile_enabled").default(false).notNull(),
	volumeDiscountProfileEnabled: boolean("volume_discount_profile_enabled").default(false).notNull(),
	madeToOrderProfileEnabled: boolean("made_to_order_profile_enabled").default(false).notNull(),
	sizeProfileEnabled: boolean("size_profile_enabled").default(false).notNull(),
	customSizeProfileEnabled: boolean("custom_size_profile_enabled").default(false).notNull(),
	finishProfileEnabled: boolean("finish_profile_enabled").default(false).notNull(),
	fabricProfileEnabled: boolean("fabric_profile_enabled").default(false).notNull(),
	productSpecificSizeProfileEnabled: boolean("product_specific_size_profile_enabled").default(false).notNull(),
	productSpecificSizeProfile: jsonb("product_specific_size_profile").default({}).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.badgeProfileId],
			foreignColumns: [badgeProfile.id],
			name: "fk_badge_profile_id"
		}),
	foreignKey({
			columns: [table.customSizeProfileId],
			foreignColumns: [customSizeProfile.id],
			name: "fk_custom_size_profile_id"
		}),
	foreignKey({
			columns: [table.fabricProfileId],
			foreignColumns: [fabricProfile.id],
			name: "fk_fabric_profile_id"
		}),
	foreignKey({
			columns: [table.finishProfileId],
			foreignColumns: [finishProfile.id],
			name: "fk_finish_profile_id"
		}),
	foreignKey({
			columns: [table.madeToOrderFabricId],
			foreignColumns: [table.id],
			name: "fk_made_to_order_fabric_id"
		}),
	foreignKey({
			columns: [table.madeToOrderProfileId],
			foreignColumns: [madeToOrderProfile.id],
			name: "fk_made_to_order_profile_id"
		}),
	foreignKey({
			columns: [table.mainProductId],
			foreignColumns: [table.id],
			name: "fk_main_product_id"
		}),
	foreignKey({
			columns: [table.sizeProfileId],
			foreignColumns: [sizeProfile.id],
			name: "fk_size_profile_id"
		}),
	foreignKey({
			columns: [table.skuGroupId],
			foreignColumns: [skuGroup.id],
			name: "fk_sku_group_id"
		}),
	foreignKey({
			columns: [table.specialStatusId],
			foreignColumns: [specialStatus.id],
			name: "fk_special_status_id"
		}),
	foreignKey({
			columns: [table.subCategoryId],
			foreignColumns: [subCategory.id],
			name: "fk_sub_category_id"
		}),
	foreignKey({
			columns: [table.volumeDiscountProfileId],
			foreignColumns: [volumeDiscountProfile.id],
			name: "fk_volume_discount_profile_id"
		}),
	unique("unique_name").on(table.name),
	unique("unique_sku").on(table.sku),
	unique("unique_slug").on(table.slug),
]);

export const productFinished = pgTable("product_finished", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "fk_product_id"
		}),
]);

export const productSizeProfile = pgTable("product_size_profile", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sizeProfileOptionId: bigint("size_profile_option_id", { mode: "number" }).notNull(),
	sizeProfileOptionSku: varchar("size_profile_option_sku", { length: 255 }).notNull(),
	quantity: integer().notNull(),
	disabled: boolean().default(false).notNull(),
	consumedFabric: numeric("consumed_fabric", { precision: 8, scale:  2 }),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "fk_product_id"
		}),
	foreignKey({
			columns: [table.sizeProfileOptionId],
			foreignColumns: [sizeProfileOption.id],
			name: "fk_size_profile_option_id"
		}),
	unique("unique_product_id_size_profile_option").on(table.productId, table.sizeProfileOptionSku),
]);

export const orderItem = pgTable("order_item", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }).notNull(),
	orderType: orderTypeEnum("order_type").notNull(),
	productGroup: varchar("product_group").notNull(),
	customization: jsonb().notNull(),
	volumeDiscount: jsonb("volume_discount").default({}).notNull(),
	saleDiscountPercentage: numeric("sale_discount_percentage").default('0').notNull(),
	madeToOrderProfile: jsonb("made_to_order_profile").default({}).notNull(),
	quantity: numeric().notNull(),
	unit: unitEnum().default('METER').notNull(),
	price: numeric().notNull(),
	currency: varchar().notNull(),
	shippingCode: varchar("shipping_code").default('').notNull(),
	trackingUrl: text("tracking_url").default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	dispatchedOn: bigint("dispatched_on", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedDeliveryFrom: bigint("estimated_delivery_from", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedDeliveryTo: bigint("estimated_delivery_to", { mode: "number" }).default(0).notNull(),
	orderStatus: orderStatusEnum("order_status").notNull(),
	paymentStatus: paymentStatusEnum("payment_status").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
	preorderReady: boolean("preorder_ready").default(false).notNull(),
	zohoPackageId: varchar("zoho_package_id").default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	reviewId: bigint("review_id", { mode: "number" }),
	loyaltyOrder: boolean("loyalty_order").default(false).notNull(),
	loyaltyDiscountAmount: numeric("loyalty_discount_amount", { precision: 10, scale:  2 }).default('0').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "fk_order_id"
		}),
]);

export const productImageGallerySeo = pgTable("product_image_gallery_seo", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	image: text().notNull(),
	altText: text("alt_text").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "fk_product_id"
		}),
	unique("unique_seo").on(table.productId, table.image),
]);

export const orders = pgTable("orders", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	subTotal: numeric("sub_total").notNull(),
	shippingMode: jsonb("shipping_mode").notNull(),
	shippingCost: numeric("shipping_cost").notNull(),
	total: numeric().notNull(),
	currency: varchar().notNull(),
	advancePay: numeric("advance_pay").notNull(),
	remainingPay: numeric("remaining_pay").notNull(),
	autoDiscount: numeric("auto_discount").notNull(),
	couponApplied: boolean("coupon_applied").notNull(),
	couponCode: varchar("coupon_code").default('').notNull(),
	couponDiscount: numeric("coupon_discount").notNull(),
	address: jsonb().notNull(),
	note: text().default('').notNull(),
	gift: boolean().default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }),
	failedErrorCode: integer("failed_error_code").default(sql`'-1'`),
	failedErrorMessage: varchar("failed_error_message").default(''),
	deleted: boolean().default(false).notNull(),
	zohoOrderId: varchar("zoho_order_id").default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cancelledAt: bigint("cancelled_at", { mode: "number" }),
	cancellationReason: text("cancellation_reason").default('').notNull(),
	couponDiscountAmount: numeric("coupon_discount_amount").default('0').notNull(),
	loyaltyOrder: boolean("loyalty_order").default(false),
	exchangeRate: numeric("exchange_rate"),
	loyaltyDiscount: numeric("loyalty_discount", { precision: 5, scale:  2 }).default('0'),
	loyaltyDiscountAmount: numeric("loyalty_discount_amount", { precision: 10, scale:  2 }).default('0').notNull(),
	paymentMode: paymentModeEnum("payment_mode").default('RAZORPAY').notNull(),
	stripeCheckoutUrl: text("stripe_checkout_url").default(''),
	globalNote: text("global_note").default('').notNull(),
	clickId: text("click_id"),
	clickIdType: text("click_id_type"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clickCapturedAt: bigint("click_captured_at", { mode: "number" }),
	utmSource: text("utm_source"),
	utmMedium: text("utm_medium"),
	utmCampaign: text("utm_campaign"),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_tenant_id"
		}),
]);

export const review = pgTable("review", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar().notNull(),
	city: varchar().default('').notNull(),
	country: varchar().notNull(),
	rating: integer().notNull(),
	description: text().default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }),
	productImages: text("product_images").default('').notNull(),
	status: reviewStatusEnum().notNull(),
	activeUrl: text("active_url").default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
	adminAdded: boolean("admin_added").default(false).notNull(),
	link: text().default('').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "fk_product_id"
		}),
]);

export const productZohoRelation = pgTable("product_zoho_relation", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	sku: varchar().notNull(),
	zohoItemId: varchar("zoho_item_id").default('').notNull(),
	hsnCode: varchar("hsn_code").default('').notNull(),
	purchasePrice: numeric("purchase_price", { precision: 8, scale:  4 }).default('0.001').notNull(),
	tax: numeric({ precision: 8, scale:  4 }).notNull(),
	disabled: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "fk_product_id"
		}),
	unique("unique_zoho_sku").on(table.sku),
	unique("unique_zoho_sku_item_id").on(table.sku, table.zohoItemId),
]);

export const sizeProfileGuide = pgTable("size_profile_guide", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	profileId: bigint("profile_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	optionId: bigint("option_id", { mode: "number" }).notNull(),
	guide: varchar({ length: 255 }).notNull(),
	value: integer().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.optionId],
			foreignColumns: [sizeProfileOption.id],
			name: "fk_option_id"
		}),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [sizeProfile.id],
			name: "fk_profile_id"
		}),
]);

export const sizeProfile = pgTable("size_profile", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	profileName: varchar("profile_name", { length: 255 }).notNull(),
	displayName: varchar("display_name", { length: 255 }).default('Size').notNull(),
	disclaimer: text().notNull(),
	image: text().default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_size_profile_name").on(table.profileName),
]);

export const settings = pgTable("settings", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	attributeName: settingsAttributeEnum("attribute_name").notNull(),
	attributeType: settingsAttributeTypeEnum("attribute_type").notNull(),
	attributeValue: jsonb("attribute_value").notNull(),
	attributeLink: text("attribute_link").default('').notNull(),
});

export const shipment = pgTable("shipment", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar().notNull(),
	baseAmount: integer("base_amount").notNull(),
	baseQuantity: integer("base_quantity").notNull(),
	additionalAmount: integer("additional_amount").notNull(),
	estimatedFromDay: integer("estimated_from_day").notNull(),
	estimatedToDay: integer("estimated_to_day").notNull(),
	locationType: locationTypeEnum("location_type").notNull(),
});

export const segment = pgTable("segment", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	categoryId: bigint("category_id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	icon: text().default(''),
	metaTitle: varchar("meta_title", { length: 255 }).default(''),
	metaDescription: text("meta_description").default(''),
	socialImage: text("social_image").default(''),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	index("trgm_index_segment").using("gin", table.name.asc().nullsLast().op("gin_trgm_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [category.id],
			name: "fk_category_id"
		}),
	unique("unique_segment_name").on(table.name),
]);

export const purchaseOrderFeedback = pgTable("purchase_order_feedback", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }).notNull(),
	question1: varchar("question_1").notNull(),
	question1Answer: numeric("question_1_answer").default('0').notNull(),
	question2: varchar("question_2").notNull(),
	question2Answer: boolean("question_2_answer").default(false).notNull(),
	question2Negative: varchar("question_2_negative").default(''),
	question2NegAnswer: varchar("question_2_neg_answer").default(''),
	question3: varchar("question_3").notNull(),
	question3Answer: varchar("question_3_answer").default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "fk_order_id"
		}),
	unique("unique_order_id").on(table.orderId),
]);

export const sizeProfileOption = pgTable("size_profile_option", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	profileId: bigint("profile_id", { mode: "number" }).notNull(),
	label: varchar({ length: 255 }).notNull(),
	keyFeature: varchar("key_feature", { length: 255 }).default('').notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	consumedFabric: numeric("consumed_fabric", { precision: 8, scale:  2 }).default('0.0').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [sizeProfile.id],
			name: "fk_profile_id"
		}),
]);

export const stepElement = pgTable("step_element", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	workflowId: bigint("workflow_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	elementId: bigint("element_id", { mode: "number" }).notNull(),
	parentStepId: varchar("parent_step_id").default('').notNull(),
	previousStepId: varchar("previous_step_id").default('').notNull(),
	nextStepId: varchar("next_step_id").default('').notNull(),
	primaryStep: boolean("primary_step").notNull(),
	estimatedDays: integer("estimated_days").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedStartDate: bigint("estimated_start_date", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedEndDate: bigint("estimated_end_date", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	actualStartDate: bigint("actual_start_date", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	actualEndDate: bigint("actual_end_date", { mode: "number" }).default(0).notNull(),
	name: varchar().notNull(),
	status: elementStatusEnum().default('PENDING').notNull(),
	properties: jsonb().default({}).notNull(),
	feedbackRequired: boolean("feedback_required").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.elementId],
			foreignColumns: [element.id],
			name: "fk_element_id"
		}),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflow.id],
			name: "fk_workflow_id"
		}),
]);

export const storyProductMapping = pgTable("story_product_mapping", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	storyContentId: bigint("story_content_id", { mode: "number" }).notNull(),
	productIdCsv: text("product_id_csv").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	finishProductIds: bigint("finish_product_ids", { mode: "number" }).array(),
}, (table) => [
	foreignKey({
			columns: [table.storyContentId],
			foreignColumns: [storyContent.id],
			name: "fk_story_content_id"
		}),
]);

export const storyContent = pgTable("story_content", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	storyContentCategoryId: bigint("story_content_category_id", { mode: "number" }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	readingTime: integer("reading_time").default(0).notNull(),
	bannerImageDesktop: text("banner_image_desktop").default('').notNull(),
	bannerImageMobile: text("banner_image_mobile").default('').notNull(),
	bannerImageParallax: text("banner_image_parallax").default(''),
	parallaxText: varchar("parallax_text", { length: 255 }).default(''),
	slug: varchar({ length: 255 }).default(''),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	previousStory: bigint("previous_story", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	nextStory: bigint("next_story", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	authorId: bigint("author_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	lastUpdateTime: bigint("last_update_time", { mode: "number" }).notNull(),
	metaTitle: varchar("meta_title", { length: 255 }).default('').notNull(),
	metaDescription: varchar("meta_description", { length: 255 }).default('').notNull(),
	bannerImageAlt: text("banner_image_alt").default('').notNull(),
	bannerImageParallaxAlt: text("banner_image_parallax_alt").default('').notNull(),
	backwardCompatibleLink: text("backward_compatible_link").default('').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [loomTenant.id],
			name: "fk_author_id"
		}),
	foreignKey({
			columns: [table.storyContentCategoryId],
			foreignColumns: [storyContentCategory.id],
			name: "fk_story_content_category_id"
		}),
]);

export const subCategory = pgTable("sub_category", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	segmentId: bigint("segment_id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	icon: text().default(''),
	metaTitle: varchar("meta_title", { length: 255 }).default(''),
	metaDescription: text("meta_description").default(''),
	socialImage: text("social_image").default(''),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	badgeProfileId: bigint("badge_profile_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	madeToOrderProfileId: bigint("made_to_order_profile_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	volumeDiscountProfileId: bigint("volume_discount_profile_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customSizeProfileId: bigint("custom_size_profile_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sizeProfileId: bigint("size_profile_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	finishProfileId: bigint("finish_profile_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fabricProfileId: bigint("fabric_profile_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
	featured: boolean().default(false).notNull(),
	featuredImage: text("featured_image").default('').notNull(),
	avgWorkHoursPerMeter: numeric("avg_work_hours_per_meter"),
	impactConfigVersion: integer("impact_config_version").default(1).notNull(),
}, (table) => [
	index("trgm_index_sub_category").using("gin", table.name.asc().nullsLast().op("gin_trgm_ops")),
	foreignKey({
			columns: [table.badgeProfileId],
			foreignColumns: [badgeProfile.id],
			name: "fk_badge_profile_id"
		}),
	foreignKey({
			columns: [table.customSizeProfileId],
			foreignColumns: [customSizeProfile.id],
			name: "fk_custom_size_profile_id"
		}),
	foreignKey({
			columns: [table.fabricProfileId],
			foreignColumns: [fabricProfile.id],
			name: "fk_fabric_profile_id"
		}),
	foreignKey({
			columns: [table.finishProfileId],
			foreignColumns: [finishProfile.id],
			name: "fk_finish_profile_id"
		}),
	foreignKey({
			columns: [table.madeToOrderProfileId],
			foreignColumns: [madeToOrderProfile.id],
			name: "fk_made_to_order_profile_id"
		}),
	foreignKey({
			columns: [table.segmentId],
			foreignColumns: [segment.id],
			name: "fk_segment_id"
		}),
	foreignKey({
			columns: [table.volumeDiscountProfileId],
			foreignColumns: [volumeDiscountProfile.id],
			name: "fk_volume_discount_profile_id"
		}),
	unique("unique_sub_category_name").on(table.name),
]);

export const skuGroup = pgTable("sku_group", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_sku_group_name").on(table.name),
]);

export const specialStatus = pgTable("special_status", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_special_status_name").on(table.name),
]);

export const storyContentCategory = pgTable("story_content_category", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	storyContentType: storyContentTypeEnum("story_content_type").notNull(),
	name: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
});

export const storyContentSection = pgTable("story_content_section", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	storyContentId: bigint("story_content_id", { mode: "number" }).notNull(),
	templateType: integer("template_type").notNull(),
	templateColor: integer("template_color").notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	image1: text("image_1").default(''),
	image2: text("image_2").default(''),
	caption1: varchar("caption_1", { length: 255 }).default(''),
	caption2: varchar("caption_2", { length: 255 }).default(''),
	video1: text("video_1").default(''),
	video2: text("video_2").default(''),
	heading: varchar({ length: 255 }).default(''),
	title1: varchar("title_1", { length: 255 }).default(''),
	title2: varchar("title_2", { length: 255 }).default(''),
	paragraph1: text("paragraph_1").default(''),
	paragraph2: text("paragraph_2").default(''),
	ctaButtonName1: varchar("cta_button_name_1", { length: 255 }).default(''),
	ctaLink1: text("cta_link_1").default(''),
	ctaButtonName2: varchar("cta_button_name_2", { length: 255 }).default(''),
	ctaLink2: text("cta_link_2").default(''),
	topMotif: text("top_motif").default(''),
	bottomMotif: text("bottom_motif").default(''),
	image1Alt: text("image_1_alt").default('').notNull(),
	image2Alt: text("image_2_alt").default('').notNull(),
	video1Alt: text("video_1_alt").default('').notNull(),
	video2Alt: text("video_2_alt").default('').notNull(),
	image1Link: text("image_1_link").default(''),
	image2Link: text("image_2_link").default(''),
}, (table) => [
	foreignKey({
			columns: [table.storyContentId],
			foreignColumns: [storyContent.id],
			name: "fk_story_content_id"
		}),
]);

export const stepElementTemplate = pgTable("step_element_template", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	workflowId: bigint("workflow_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	elementId: bigint("element_id", { mode: "number" }).notNull(),
	parentStepId: varchar("parent_step_id").default('').notNull(),
	previousStepId: varchar("previous_step_id").default('').notNull(),
	nextStepId: varchar("next_step_id").default('').notNull(),
	primaryStep: boolean("primary_step").notNull(),
	name: varchar().notNull(),
	deleted: boolean().default(false).notNull(),
	properties: jsonb().default({}).notNull(),
	feedbackRequired: boolean("feedback_required").default(false).notNull(),
	estimatedDays: integer("estimated_days").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.elementId],
			foreignColumns: [elementTemplate.id],
			name: "fk_element_id"
		}),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflowTemplate.id],
			name: "fk_workflow_id"
		}),
]);

export const subCategoryAudit = pgTable("sub_category_audit", {
	auditId: bigserial("audit_id", { mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subCategoryId: bigint("sub_category_id", { mode: "number" }),
	subCategoryName: text("sub_category_name"),
	operationType: varchar("operation_type", { length: 10 }),
	oldData: jsonb("old_data"),
	newData: jsonb("new_data"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	// drizzle-kit introspect mangles this default: it emits
	// `((EXTRACT(epoch FROM now()) * (1000)` with unbalanced parentheses, which is
	// invalid SQL and aborts any generated migration at this table. Re-applied by
	// hand after each introspect - see docs/KNOWN-GAPS.md.
	changedAt: bigint("changed_at", { mode: "number" }).default(sql`((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint`),
	status: varchar({ length: 10 }).default('PENDING'),
});

export const volumeDiscountProfile = pgTable("volume_discount_profile", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	profileName: varchar("profile_name", { length: 255 }).notNull(),
	disclaimer: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_volume_discount_profile_name").on(table.profileName),
]);

export const subprocessElement = pgTable("subprocess_element", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	workflowId: bigint("workflow_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	stepId: bigint("step_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	elementId: bigint("element_id", { mode: "number" }).notNull(),
	parentSubprocessId: varchar("parent_subprocess_id").default('').notNull(),
	previousSubprocessId: varchar("previous_subprocess_id").default('').notNull(),
	nextSubprocessId: varchar("next_subprocess_id").default('').notNull(),
	primarySubprocess: boolean("primary_subprocess").notNull(),
	estimatedDays: integer("estimated_days").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedStartDate: bigint("estimated_start_date", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedEndDate: bigint("estimated_end_date", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	actualStartDate: bigint("actual_start_date", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	actualEndDate: bigint("actual_end_date", { mode: "number" }).default(0).notNull(),
	name: varchar().notNull(),
	status: elementStatusEnum().default('PENDING').notNull(),
	properties: jsonb().default({}).notNull(),
	feedbackRequired: boolean("feedback_required").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.elementId],
			foreignColumns: [element.id],
			name: "fk_element_id"
		}),
	foreignKey({
			columns: [table.stepId],
			foreignColumns: [stepElement.id],
			name: "fk_step_id"
		}),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflow.id],
			name: "fk_workflow_id"
		}),
]);

export const tag = pgTable("tag", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_tag_name").on(table.name),
]);

export const userRole = pgTable("user_role", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	role: userRoleEnum().notNull(),
	userId: bigserial("user_id", { mode: "bigint" }).notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [loomTenant.id],
			name: "fk_user_id"
		}),
	unique("unique_user_role").on(table.role, table.userId),
]);

export const superUser = pgTable("super_user", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_tenant_id"
		}),
	unique("unique_super_user").on(table.tenantId),
]);

export const verificationToken = pgTable("verification_token", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	token: varchar().notNull(),
	createdAt: varchar("created_at").notNull(),
	expiresAt: varchar("expires_at"),
	verifiedAt: varchar("verified_at"),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_tenant_id"
		}),
]);

export const tempProductMeta = pgTable("temp_product_meta", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }),
	sku: varchar({ length: 255 }),
	metaTitle: varchar("meta_title", { length: 70 }),
	metaDescription: varchar("meta_description", { length: 165 }),
});

export const warehouse = pgTable("warehouse", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar().notNull(),
	description: varchar().default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_warehouse_name").on(table.name),
]);

export const workflowTemplate = pgTable("workflow_template", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar().notNull(),
	description: varchar({ length: 500 }).default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
	productAssociated: boolean("product_associated").default(false).notNull(),
	deleted: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_tenant_id"
		}),
]);

export const category = pgTable("category", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	icon: text().default(''),
	metaTitle: varchar("meta_title", { length: 255 }).default(''),
	metaDescription: text("meta_description").default(''),
	socialImage: text("social_image").default(''),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	index("trgm_index_category").using("gin", table.name.asc().nullsLast().op("gin_trgm_ops")),
	unique("unique_category_name").on(table.name),
]);

export const customSizeProfile = pgTable("custom_size_profile", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	profileName: varchar("profile_name", { length: 255 }).notNull(),
	disclaimer: text().notNull(),
	price: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_custom_size_profile_name").on(table.profileName),
]);

export const inventoryAdjustmentItem = pgTable("inventory_adjustment_item", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	inventoryAdjustmentId: bigint("inventory_adjustment_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	quantityAvailable: numeric("quantity_available").notNull(),
	quantityAdjusted: numeric("quantity_adjusted").notNull(),
	quantityAtHand: numeric("quantity_at_hand").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.inventoryAdjustmentId],
			foreignColumns: [inventoryAdjustment.id],
			name: "fk_inventory_adjustment_id"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "fk_product_id"
		}),
]);

export const volumeDiscountProfileItem = pgTable("volume_discount_profile_item", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	profileId: bigint("profile_id", { mode: "number" }).notNull(),
	minimumOrderQuantity: integer("minimum_order_quantity").notNull(),
	discount: numeric().notNull(),
	preOrder: boolean("pre_order").default(false).notNull(),
	advancePayment: numeric("advance_payment").default('0').notNull(),
	deliveryFromDays: integer("delivery_from_days").default(0).notNull(),
	deliveryToDays: integer("delivery_to_days").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [volumeDiscountProfile.id],
			name: "fk_profile_id"
		}),
]);

export const loomTenant = pgTable("loom_tenant", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	loomId: varchar("loom_id").notNull(),
	email: varchar().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	contactNumber: varchar("contact_number").default('').notNull(),
	contactNumberVerified: boolean("contact_number_verified").default(false).notNull(),
	userPassword: varchar("user_password").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	creationTime: bigint("creation_time", { mode: "number" }).notNull(),
	active: boolean().default(true).notNull(),
	suspended: boolean().default(false).notNull(),
	banned: boolean().default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	banDate: bigint("ban_date", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	banUpliftDate: bigint("ban_uplift_date", { mode: "number" }).default(0),
	deleted: boolean().default(false).notNull(),
	userName: varchar("user_name", { length: 150 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	dob: bigint({ mode: "number" }).default(0).notNull(),
	gender: genderEnum().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	lastAccessTime: bigint("last_access_time", { mode: "number" }).default(0),
	profileImageUrl: varchar("profile_image_url", { length: 255 }).default('default-display-picture.svg').notNull(),
	provider: authProviderEnum().default('UNKNOWN').notNull(),
	userType: varchar("user_type", { length: 20 }).default('registered').notNull(),
}, (table) => [
	unique("unique_loom_id").on(table.loomId),
	unique("unique_email").on(table.email),
]);

export const subprocessElementTemplate = pgTable("subprocess_element_template", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	workflowId: bigint("workflow_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	stepId: bigint("step_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	elementId: bigint("element_id", { mode: "number" }).notNull(),
	parentSubprocessId: varchar("parent_subprocess_id").default('').notNull(),
	previousSubprocessId: varchar("previous_subprocess_id").default('').notNull(),
	nextSubprocessId: varchar("next_subprocess_id").default('').notNull(),
	primarySubprocess: boolean("primary_subprocess").notNull(),
	name: varchar().notNull(),
	deleted: boolean().default(false).notNull(),
	properties: jsonb().default({}).notNull(),
	feedbackRequired: boolean("feedback_required").default(false).notNull(),
	estimatedDays: integer("estimated_days").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.elementId],
			foreignColumns: [elementTemplate.id],
			name: "fk_element_id"
		}),
	foreignKey({
			columns: [table.stepId],
			foreignColumns: [stepElementTemplate.id],
			name: "fk_step_id"
		}),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflowTemplate.id],
			name: "fk_workflow_id"
		}),
]);

export const customProduct = pgTable("custom_product", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	sku: varchar({ length: 50 }).notNull(),
	price: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	productGroup: varchar("product_group", { length: 20 }).notNull(),
	unit: unitEnum().default('METER').notNull(),
	remarks: text().default('').notNull(),
	heroImage: text("hero_image").default('').notNull(),
	additionalImages: text("additional_images").default('').notNull(),
	additionalDocs: text("additional_docs").default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const blogVector = pgTable("blog_vector", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	blogContentId: bigint("blog_content_id", { mode: "number" }).notNull(),
	embedding: vector({ dimensions: 1536 }).notNull(),
}, (table) => [
	unique("blog_vector_blog_content_id_key").on(table.blogContentId),
]);

export const customOrderAdjustment = pgTable("custom_order_adjustment", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customOrderId: bigint("custom_order_id", { mode: "number" }).notNull(),
	adjustmentType: integer("adjustment_type").default(1).notNull(),
	particular: varchar({ length: 255 }).notNull(),
	adjustmentAmount: numeric("adjustment_amount").notNull(),
	currency: varchar().notNull(),
	sortOrder: integer("sort_order").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.customOrderId],
			foreignColumns: [customOrder.id],
			name: "fk_custom_order_id"
		}),
]);

export const workflowCustomOrderMapping = pgTable("workflow_custom_order_mapping", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	workflowId: bigint("workflow_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customOrderId: bigint("custom_order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customOrderItemId: bigint("custom_order_item_id", { mode: "number" }).notNull(),
	custom: boolean().default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customProductId: bigint("custom_product_id", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflow.id],
			name: "fk_workflow_id"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "fk_product_id"
		}),
	foreignKey({
			columns: [table.customProductId],
			foreignColumns: [customProduct.id],
			name: "fk_custom_product_id"
		}),
]);

export const artisanIncentiveConfig = pgTable("artisan_incentive_config", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	key: varchar({ length: 64 }).notNull(),
	value: varchar({ length: 128 }).notNull(),
	description: text(),
	updatedBy: varchar("updated_by", { length: 128 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }),
}, (table) => [
	unique("artisan_incentive_config_key_key").on(table.key),
]);

export const customImpactFactor = pgTable("custom_impact_factor", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	workflowId: bigint("workflow_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customOrderId: bigint("custom_order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customOrderItemId: bigint("custom_order_item_id", { mode: "number" }).notNull(),
	productType: varchar("product_type", { length: 16 }).notNull(),
	calculationStatus: varchar("calculation_status", { length: 16 }).notNull(),
	pendingReason: varchar("pending_reason", { length: 128 }),
	fabricMeters: numeric("fabric_meters"),
	co2OffsetKg: numeric("co2_offset_kg"),
	waterSavedLitres: numeric("water_saved_litres"),
	artisanHours: numeric("artisan_hours"),
	womenArtisanHours: numeric("women_artisan_hours"),
	stitchingHours: numeric("stitching_hours"),
	womenStitchingHours: numeric("women_stitching_hours"),
	totalWorkHours: numeric("total_work_hours"),
	assumptionVersion: integer("assumption_version").default(1).notNull(),
	assumptionSnapshot: jsonb("assumption_snapshot").default({}).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflow.id],
			name: "fk_custom_impact_factor_workflow"
		}),
	foreignKey({
			columns: [table.customOrderId],
			foreignColumns: [customOrder.id],
			name: "fk_custom_impact_factor_order"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_custom_impact_factor_tenant"
		}),
	foreignKey({
			columns: [table.customOrderItemId],
			foreignColumns: [customOrderItem.id],
			name: "fk_custom_impact_factor_order_item"
		}).onDelete("cascade"),
	unique("unique_custom_impact_factor_workflow").on(table.workflowId),
	unique("unique_custom_impact_factor_order_item").on(table.customOrderItemId),
]);

export const customOrder = pgTable("custom_order", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	subTotal: numeric("sub_total").notNull(),
	shippingMode: jsonb("shipping_mode").default({}).notNull(),
	shippingCost: numeric("shipping_cost").default('0').notNull(),
	total: numeric().notNull(),
	currency: varchar().notNull(),
	advancePay: numeric("advance_pay").default('0').notNull(),
	remainingPay: numeric("remaining_pay").default('0').notNull(),
	autoDiscount: numeric("auto_discount").default('0').notNull(),
	couponApplied: boolean("coupon_applied").default(false).notNull(),
	couponCode: varchar("coupon_code").default('').notNull(),
	couponDiscount: numeric("coupon_discount").default('0').notNull(),
	couponDiscountAmount: numeric("coupon_discount_amount").default('0').notNull(),
	address: jsonb().default({}).notNull(),
	note: text().default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }),
	failedErrorCode: integer("failed_error_code").default(sql`'-1'`),
	failedErrorMessage: varchar("failed_error_message").default(''),
	deleted: boolean().default(false).notNull(),
	zohoOrderId: varchar("zoho_order_id").default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	cancelledAt: bigint("cancelled_at", { mode: "number" }),
	cancellationReason: text("cancellation_reason").default('').notNull(),
	adjustedTotal: numeric("adjusted_total").default('0').notNull(),
	ccEmails: varchar("cc_emails").array().default([""]),
	orderType: varchar("order_type", { length: 50 }).default('FABRIC'),
	loyaltyOrder: boolean("loyalty_order").default(false),
	globalNote: text("global_note").default('').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_tenant_id"
		}),
]);

export const artisanPaymentRecord = pgTable("artisan_payment_record", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	artisanId: bigint("artisan_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	workflowId: bigint("workflow_id", { mode: "number" }).notNull(),
	effectiveQuantity: numeric("effective_quantity", { precision: 10, scale:  3 }).notNull(),
	rate: numeric({ precision: 10, scale:  2 }).notNull(),
	basePayment: numeric("base_payment", { precision: 12, scale:  2 }).notNull(),
	totalIncentive: numeric("total_incentive", { precision: 12, scale:  2 }).default('0.00').notNull(),
	totalPayment: numeric("total_payment", { precision: 12, scale:  2 }).notNull(),
	status: varchar({ length: 16 }).default('PENDING').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	calculatedAt: bigint("calculated_at", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	approvedAt: bigint("approved_at", { mode: "number" }),
	approvedBy: varchar("approved_by", { length: 128 }),
	notes: text(),
	quantityType: unitEnum("quantity_type").default('METER').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.artisanId],
			foreignColumns: [artisan.id],
			name: "fk_artisan_payment_record_artisan"
		}),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflow.id],
			name: "fk_artisan_payment_record_workflow"
		}),
]);

export const customOrderItem = pgTable("custom_order_item", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customOrderId: bigint("custom_order_id", { mode: "number" }).notNull(),
	orderType: orderTypeEnum("order_type").default('MADE_TO_ORDER').notNull(),
	productGroup: varchar("product_group", { length: 20 }).notNull(),
	customization: jsonb().notNull(),
	quantity: numeric().notNull(),
	unit: unitEnum().default('METER').notNull(),
	price: numeric().notNull(),
	currency: varchar().notNull(),
	shippingCode: varchar("shipping_code").default('').notNull(),
	trackingUrl: text("tracking_url").default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	dispatchedOn: bigint("dispatched_on", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedDeliveryFrom: bigint("estimated_delivery_from", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedDeliveryTo: bigint("estimated_delivery_to", { mode: "number" }).default(0).notNull(),
	orderStatus: orderStatusEnum("order_status").notNull(),
	zohoPackageId: varchar("zoho_package_id").default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	reviewId: bigint("review_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).default(0).notNull(),
	description: text().default('').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.customOrderId],
			foreignColumns: [customOrder.id],
			name: "fk_custom_order_id"
		}),
]);

export const loyaltyProgramConfig = pgTable("loyalty_program_config", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customerId: bigint("customer_id", { mode: "number" }).notNull(),
	minOrderValueCurrency: varchar("min_order_value_currency", { length: 10 }).notNull(),
	minOrderValue: numeric("min_order_value", { precision: 10, scale:  2 }).notNull(),
	minOrderValueInr: numeric("min_order_value_inr", { precision: 10, scale:  2 }).notNull(),
	exchangeRate: numeric("exchange_rate", { precision: 8, scale:  4 }).notNull(),
	tenure: integer().notNull(),
	discountPercentage: numeric("discount_percentage", { precision: 10, scale:  2 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	startDate: bigint("start_date", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	endDate: bigint("end_date", { mode: "number" }).notNull(),
	active: boolean().default(true).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customer.id],
			name: "fk_loyalty_program_config_customer"
		}),
	unique("unique_loyalty_program_customer_id").on(table.customerId),
]);

export const artisanSkillMapping = pgTable("artisan_skill_mapping", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	artisanId: bigint("artisan_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	skillId: bigint("skill_id", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.artisanId],
			foreignColumns: [artisan.id],
			name: "fk_artisan_skill_mapping_artisan"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.skillId],
			foreignColumns: [skill.id],
			name: "fk_artisan_skill_mapping_skill"
		}).onDelete("cascade"),
	unique("uk_artisan_skill_mapping_unique").on(table.artisanId, table.skillId),
]);

export const skill = pgTable("skill", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar({ length: 150 }).notNull(),
	description: text(),
	deleted: boolean().default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	lastUpdateTime: bigint("last_update_time", { mode: "number" }).default(0).notNull(),
}, (table) => [
	unique("unique_skill_name").on(table.name),
]);

export const artisan = pgTable("artisan", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	artisanRole: artisanRoleEnum("artisan_role").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	masterArtisanId: bigint("master_artisan_id", { mode: "number" }),
	hasWhatsapp: boolean("has_whatsapp").default(false).notNull(),
	state: varchar({ length: 255 }),
	district: varchar({ length: 255 }),
	villageTown: varchar("village_town", { length: 255 }),
	postalCode: varchar("postal_code", { length: 50 }),
	expertise: varchar({ length: 255 }),
	experience: integer().default(0).notNull(),
	hasBankAccount: boolean("has_bank_account").default(false),
	bankName: varchar("bank_name", { length: 255 }),
	accountHolderName: varchar("account_holder_name", { length: 255 }),
	ifscCode: varchar("ifsc_code", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	lastUpdateTime: bigint("last_update_time", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.masterArtisanId],
			foreignColumns: [table.id],
			name: "fk_master_artisan_id"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_artisan_tenant_id"
		}),
	unique("unique_artisan_tenant_id").on(table.tenantId),
]);

export const catalog = pgTable("catalog", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	artisanId: bigint("artisan_id", { mode: "number" }).notNull(),
	defaultCatalog: boolean("default_catalog").default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.artisanId],
			foreignColumns: [artisan.id],
			name: "fk_artisan_id"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const loyaltyProgramConfigAuditLog = pgTable("loyalty_program_config_audit_log", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customerId: bigint("customer_id", { mode: "number" }).notNull(),
	minOrderValueCurrency: varchar("min_order_value_currency", { length: 10 }).notNull(),
	minOrderValue: numeric("min_order_value", { precision: 10, scale:  2 }).notNull(),
	minOrderValueInr: numeric("min_order_value_inr", { precision: 10, scale:  2 }).notNull(),
	exchangeRate: numeric("exchange_rate", { precision: 8, scale:  4 }).notNull(),
	tenure: integer().notNull(),
	discountPercentage: numeric("discount_percentage", { precision: 10, scale:  2 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	startDate: bigint("start_date", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	endDate: bigint("end_date", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }),
	type: loyaltyConfigAuditLogType().default('ONBOARDING').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customer.id],
			name: "fk_loyalty_program_config_customer"
		}),
]);

export const elementFeedback = pgTable("element_feedback", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	elementId: bigint("element_id", { mode: "number" }),
	text: text().default('').notNull(),
	image: text().default('').notNull(),
	video: text().default('').notNull(),
	status: elementFeedbackStatusEnum().default('PENDING').notNull(),
	remarks: text().default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).default(0).notNull(),
	uploader: elementFeedbackUploaderEnum(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	uploadedBy: bigint("uploaded_by", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	approvedBy: bigint("approved_by", { mode: "number" }),
	feedbackUploaded: boolean("feedback_uploaded"),
}, (table) => [
	foreignKey({
			columns: [table.elementId],
			foreignColumns: [element.id],
			name: "fk_element_id"
		}),
	unique("unique_element_id").on(table.elementId),
]);

export const catalogItem = pgTable("catalog_item", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 3 }).notNull(),
	quantity: integer().notNull(),
	unit: unitEnum().default('METER').notNull(),
	description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	catalogId: bigint("catalog_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.catalogId],
			foreignColumns: [catalog.id],
			name: "fk_catalog_id"
		}).onUpdate("cascade").onDelete("cascade"),
	check("chk_catalog_item_price", sql`price >= (0)::numeric`),
	check("chk_catalog_item_quantity", sql`quantity >= 0`),
]);

export const stripeTransaction = pgTable("stripe_transaction", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	stripeSessionId: varchar("stripe_session_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	loomOrderId: bigint("loom_order_id", { mode: "number" }).notNull(),
	stripePaymentIntentId: varchar("stripe_payment_intent_id"),
	amount: numeric().notNull(),
	currency: varchar().notNull(),
	checkoutUrl: text("checkout_url").default(''),
	status: transactionStatusEnum().notNull(),
	failedErrorCode: integer("failed_error_code").default(sql`'-1'`),
	failedErrorMessage: varchar("failed_error_message").default(''),
	dataDump: jsonb("data_dump").default({}).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	paymentType: varchar("payment_type").default('advance').notNull(),
	paymentMethod: varchar("payment_method").default('card').notNull(),
	webhookReceived: boolean("webhook_received").default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	webhookReceivedAt: bigint("webhook_received_at", { mode: "number" }),
	webhookDataDump: jsonb("webhook_data_dump").default({}),
	webhookEventType: varchar("webhook_event_type").default('').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.loomOrderId],
			foreignColumns: [orders.id],
			name: "fk_loom_order_id"
		}),
]);

export const cronJobLog = pgTable("cron_job_log", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	jobName: varchar("job_name", { length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	startTime: bigint("start_time", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	endTime: bigint("end_time", { mode: "number" }),
	status: varchar({ length: 20 }).notNull(),
	message: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const catalogItemMedia = pgTable("catalog_item_media", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	mediaUrl: text("media_url").default('').notNull(),
	altText: varchar("alt_text", { length: 75 }),
	hero: boolean().default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	catalogItemId: bigint("catalog_item_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
	mediaType: catalogItemMediaTypeEnum("media_type").default('UNKNOWN').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.catalogItemId],
			foreignColumns: [catalogItem.id],
			name: "fk_catalog_item_id"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const productVector = pgTable("product_vector", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	embedding: vector({ dimensions: 1536 }),
}, (table) => [
	index("idx_product_vector").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({lists: "100"}),
	unique("uk_product_vector_product_id").on(table.productId),
]);

export const workflowArtisanMapping = pgTable("workflow_artisan_mapping", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	workflowId: bigint("workflow_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	artisanId: bigint("artisan_id", { mode: "number" }).notNull(),
	quantityOfFabricInMeters: numeric("quantity_of_fabric_in_meters", { precision: 10, scale:  2 }),
	quantityOfProducts: numeric("quantity_of_products", { precision: 10, scale:  2 }),
	basePay: numeric("base_pay", { precision: 10, scale:  2 }),
}, (table) => [
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflow.id],
			name: "fk_workflow_artisan_mapping_workflow"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.artisanId],
			foreignColumns: [artisan.id],
			name: "fk_workflow_artisan_mapping_artisan"
		}).onDelete("cascade"),
	unique("uk_workflow_artisan_mapping_unique").on(table.workflowId, table.artisanId),
	check("chk_workflow_artisan_mapping_quantity_of_fabric_in_meters", sql`(quantity_of_fabric_in_meters IS NULL) OR (quantity_of_fabric_in_meters >= (0)::numeric)`),
	check("chk_workflow_artisan_mapping_quantity_of_products", sql`(quantity_of_products IS NULL) OR (quantity_of_products >= (0)::numeric)`),
	check("chk_workflow_artisan_mapping_single_quantity_mode", sql`NOT ((quantity_of_fabric_in_meters IS NOT NULL) AND (quantity_of_products IS NOT NULL))`),
]);

export const storyVector = pgTable("story_vector", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	storyContentId: bigint("story_content_id", { mode: "number" }).notNull(),
	embedding: vector({ dimensions: 1536 }).notNull(),
}, (table) => [
	unique("story_vector_story_content_id_key").on(table.storyContentId),
]);

export const orderItemFulfillment = pgTable("order_item_fulfillment", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderFulfillmentId: bigint("order_fulfillment_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderItemId: bigint("order_item_id", { mode: "number" }).notNull(),
	quantity: numeric().notNull(),
	unit: unitEnum().default('METER').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "fk_order_item_fulfillment_order_id"
		}),
	unique("uq_order_item_once_per_fulfillment").on(table.orderFulfillmentId, table.orderItemId),
	check("chk_order_item_fulfillment_quantity_positive", sql`quantity > (0)::numeric`),
]);

export const orderFulfillment = pgTable("order_fulfillment", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	shipmentId: bigint("shipment_id", { mode: "number" }),
	shippingMode: jsonb("shipping_mode").default({}).notNull(),
	shippingCode: varchar("shipping_code").default('').notNull(),
	trackingUrl: text("tracking_url").default('').notNull(),
	zohoPackageId: varchar("zoho_package_id").default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	dispatchedOn: bigint("dispatched_on", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedDeliveryFrom: bigint("estimated_delivery_from", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedDeliveryTo: bigint("estimated_delivery_to", { mode: "number" }).default(0).notNull(),
	note: text().default('').notNull(),
	deleted: boolean().default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "fk_order_fulfillment_order_id"
		}),
	foreignKey({
			columns: [table.shipmentId],
			foreignColumns: [shipment.id],
			name: "fk_order_fulfillment_shipment_id"
		}),
]);

export const workflow = pgTable("workflow", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	workflowTemplateId: bigint("workflow_template_id", { mode: "number" }).notNull(),
	name: varchar().notNull(),
	description: varchar({ length: 500 }).default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }),
	status: workflowStatusEnum().default('CREATED').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedStartDate: bigint("estimated_start_date", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedEndDate: bigint("estimated_end_date", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderItemId: bigint("order_item_id", { mode: "number" }),
	type: workflowTypeEnum().default('ORDER').notNull(),
	avgArtisanWorkHoursPerMeter: numeric("avg_artisan_work_hours_per_meter", { precision: 10, scale:  2 }),
	avgWorkHoursPerProduct: numeric("avg_work_hours_per_product", { precision: 10, scale:  2 }),
	fabricUsedPerProductInMeters: numeric("fabric_used_per_product_in_meters", { precision: 10, scale:  2 }),
	note: text(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "fk_product_id"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_tenant_id"
		}),
	foreignKey({
			columns: [table.workflowTemplateId],
			foreignColumns: [workflowTemplate.id],
			name: "fk_workflow_template_id"
		}),
]);

export const customOrderItemFulfillment = pgTable("custom_order_item_fulfillment", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customOrderId: bigint("custom_order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customOrderFulfillmentId: bigint("custom_order_fulfillment_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customOrderItemId: bigint("custom_order_item_id", { mode: "number" }).notNull(),
	quantity: numeric().notNull(),
	unit: unitEnum().default('METER').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.customOrderId],
			foreignColumns: [customOrder.id],
			name: "fk_custom_order_item_fulfillment_custom_order_id"
		}),
	unique("uq_custom_order_item_once_per_fulfillment").on(table.customOrderFulfillmentId, table.customOrderItemId),
	check("chk_custom_order_item_fulfillment_quantity_positive", sql`quantity > (0)::numeric`),
]);

export const customOrderFulfillment = pgTable("custom_order_fulfillment", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customOrderId: bigint("custom_order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	shipmentId: bigint("shipment_id", { mode: "number" }),
	shippingMode: jsonb("shipping_mode").default({}).notNull(),
	shippingCode: varchar("shipping_code").default('').notNull(),
	trackingUrl: text("tracking_url").default('').notNull(),
	zohoPackageId: varchar("zoho_package_id").default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	dispatchedOn: bigint("dispatched_on", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedDeliveryFrom: bigint("estimated_delivery_from", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedDeliveryTo: bigint("estimated_delivery_to", { mode: "number" }).default(0).notNull(),
	note: text().default('').notNull(),
	deleted: boolean().default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.customOrderId],
			foreignColumns: [customOrder.id],
			name: "fk_custom_order_fulfillment_custom_order_id"
		}),
	foreignKey({
			columns: [table.shipmentId],
			foreignColumns: [shipment.id],
			name: "fk_custom_order_fulfillment_shipment_id"
		}),
]);

export const customer = pgTable("customer", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	wishlist: text().default('').notNull(),
	defaultCurrency: varchar("default_currency").default('').notNull(),
	whatsappNumber: varchar("whatsapp_number", { length: 20 }),
	whatsappOptInStatus: whatsappOptInStatusEnum("whatsapp_opt_in_status"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	whatsappConsentExpiresAt: bigint("whatsapp_consent_expires_at", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	whatsappPromptAt: bigint("whatsapp_prompt_at", { mode: "number" }),
	whatsappDismissCount: integer("whatsapp_dismiss_count").default(0).notNull(),
	whatsappPreferences: jsonb("whatsapp_preferences"),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_tenant_id"
		}),
	unique("unique_customer").on(table.tenantId),
]);

export const catalogPdf = pgTable("catalog_pdf", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	version: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	artisanId: bigint("artisan_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	requestedById: bigint("requested_by_id", { mode: "number" }).notNull(),
	status: varchar().default('QUEUED').notNull(),
	downloadUrl: text("download_url").default('').notNull(),
	s3Key: text("s3_key").default('').notNull(),
	fileName: text("file_name").default('').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	requestedAt: bigint("requested_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	completedAt: bigint("completed_at", { mode: "number" }),
	failureMessage: text("failure_message").default('').notNull(),
	restartRecoveryRequired: boolean("restart_recovery_required").default(false).notNull(),
	compressedDownloadUrl: text("compressed_download_url").default('').notNull(),
	compressedS3Key: text("compressed_s3_key").default('').notNull(),
	compressedFileName: text("compressed_file_name").default('').notNull(),
	compressedFailureMessage: text("compressed_failure_message").default('').notNull(),
	compressedAttemptCount: integer("compressed_attempt_count").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.artisanId],
			foreignColumns: [artisan.id],
			name: "fk_catalog_pdf_request_artisan_id"
		}),
	foreignKey({
			columns: [table.requestedById],
			foreignColumns: [loomTenant.id],
			name: "fk_catalog_pdf_request_requested_by_id"
		}),
]);

export const customOrderItemReady = pgTable("custom_order_item_ready", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customOrderId: bigint("custom_order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customOrderReadyId: bigint("custom_order_ready_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customOrderItemId: bigint("custom_order_item_id", { mode: "number" }).notNull(),
	quantity: numeric().notNull(),
	unit: unitEnum().default('METER').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.customOrderId],
			foreignColumns: [customOrder.id],
			name: "fk_custom_order_item_ready_custom_order_id"
		}),
	foreignKey({
			columns: [table.customOrderReadyId],
			foreignColumns: [customOrderReady.id],
			name: "fk_custom_order_item_ready_ready_id"
		}),
	foreignKey({
			columns: [table.customOrderItemId],
			foreignColumns: [customOrderItem.id],
			name: "fk_custom_order_item_ready_custom_order_item_id"
		}),
	check("chk_custom_order_item_ready_quantity_positive", sql`quantity > (0)::numeric`),
]);

export const customOrderReady = pgTable("custom_order_ready", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customOrderId: bigint("custom_order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	receivedDate: bigint("received_date", { mode: "number" }).notNull(),
	note: text().default('').notNull(),
	deleted: boolean().default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.customOrderId],
			foreignColumns: [customOrder.id],
			name: "fk_custom_order_ready_custom_order_id"
		}),
]);

export const orderReady = pgTable("order_ready", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	receivedDate: bigint("received_date", { mode: "number" }).notNull(),
	note: text().default('').notNull(),
	deleted: boolean().default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "fk_order_ready_order_id"
		}),
]);

export const orderItemReady = pgTable("order_item_ready", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderReadyId: bigint("order_ready_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderItemId: bigint("order_item_id", { mode: "number" }).notNull(),
	quantity: numeric().notNull(),
	unit: unitEnum().default('METER').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "fk_order_item_ready_order_id"
		}),
	foreignKey({
			columns: [table.orderReadyId],
			foreignColumns: [orderReady.id],
			name: "fk_order_item_ready_ready_id"
		}),
	foreignKey({
			columns: [table.orderItemId],
			foreignColumns: [orderItem.id],
			name: "fk_order_item_ready_order_item_id"
		}),
	check("chk_order_item_ready_quantity_positive", sql`quantity > (0)::numeric`),
]);

export const stepElementArtisanMapping = pgTable("step_element_artisan_mapping", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	stepElementId: bigint("step_element_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	artisanId: bigint("artisan_id", { mode: "number" }).notNull(),
	quantityOfFabricInMeters: numeric("quantity_of_fabric_in_meters", { precision: 10, scale:  2 }),
	quantityOfProducts: numeric("quantity_of_products", { precision: 10, scale:  2 }),
	basePay: numeric("base_pay", { precision: 10, scale:  2 }),
}, (table) => [
	foreignKey({
			columns: [table.stepElementId],
			foreignColumns: [stepElement.id],
			name: "fk_step_element_artisan_mapping_step_element"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.artisanId],
			foreignColumns: [artisan.id],
			name: "fk_step_element_artisan_mapping_artisan"
		}).onDelete("cascade"),
	unique("uk_step_element_artisan_mapping_unique").on(table.stepElementId, table.artisanId),
	check("chk_step_element_artisan_mapping_quantity_of_fabric_in_meters", sql`(quantity_of_fabric_in_meters IS NULL) OR (quantity_of_fabric_in_meters >= (0)::numeric)`),
	check("chk_step_element_artisan_mapping_quantity_of_products", sql`(quantity_of_products IS NULL) OR (quantity_of_products >= (0)::numeric)`),
	check("chk_step_element_artisan_mapping_single_quantity_mode", sql`NOT ((quantity_of_fabric_in_meters IS NOT NULL) AND (quantity_of_products IS NOT NULL))`),
]);

export const impactFactor = pgTable("impact_factor", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	workflowId: bigint("workflow_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderItemId: bigint("order_item_id", { mode: "number" }).notNull(),
	productType: varchar("product_type", { length: 16 }).notNull(),
	calculationStatus: varchar("calculation_status", { length: 16 }).notNull(),
	pendingReason: varchar("pending_reason", { length: 128 }),
	fabricMeters: numeric("fabric_meters"),
	co2OffsetKg: numeric("co2_offset_kg"),
	waterSavedLitres: numeric("water_saved_litres"),
	artisanHours: numeric("artisan_hours"),
	womenArtisanHours: numeric("women_artisan_hours"),
	stitchingHours: numeric("stitching_hours"),
	womenStitchingHours: numeric("women_stitching_hours"),
	totalWorkHours: numeric("total_work_hours"),
	assumptionVersion: integer("assumption_version").default(1).notNull(),
	assumptionSnapshot: jsonb("assumption_snapshot").default({}).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
	instockSnapshot: jsonb("instock_snapshot").default({}).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflow.id],
			name: "fk_impact_factor_workflow"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "fk_impact_factor_order"
		}),
	foreignKey({
			columns: [table.orderItemId],
			foreignColumns: [orderItem.id],
			name: "fk_impact_factor_order_item"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_impact_factor_tenant"
		}),
	unique("unique_impact_factor_workflow").on(table.workflowId),
	unique("unique_impact_factor_order_item").on(table.orderItemId),
]);

export const subprocessElementArtisanMapping = pgTable("subprocess_element_artisan_mapping", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subprocessElementId: bigint("subprocess_element_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	artisanId: bigint("artisan_id", { mode: "number" }).notNull(),
	quantityOfFabricInMeters: numeric("quantity_of_fabric_in_meters", { precision: 10, scale:  2 }),
	quantityOfProducts: numeric("quantity_of_products", { precision: 10, scale:  2 }),
	basePay: numeric("base_pay", { precision: 10, scale:  2 }),
}, (table) => [
	foreignKey({
			columns: [table.subprocessElementId],
			foreignColumns: [subprocessElement.id],
			name: "fk_subprocess_element_artisan_mapping_subprocess"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.artisanId],
			foreignColumns: [artisan.id],
			name: "fk_subprocess_element_artisan_mapping_artisan"
		}).onDelete("cascade"),
	unique("uk_subprocess_element_artisan_mapping_unique").on(table.subprocessElementId, table.artisanId),
	check("chk_subprocess_element_artisan_mapping_single_quantity_mode", sql`NOT ((quantity_of_fabric_in_meters IS NOT NULL) AND (quantity_of_products IS NOT NULL))`),
	check("chk_subprocess_element_artisan_mapping_quantity_of_fabric_in_me", sql`(quantity_of_fabric_in_meters IS NULL) OR (quantity_of_fabric_in_meters >= (0)::numeric)`),
	check("chk_subprocess_element_artisan_mapping_quantity_of_products", sql`(quantity_of_products IS NULL) OR (quantity_of_products >= (0)::numeric)`),
]);

export const imageOptimizationRecord = pgTable("image_optimization_record", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	objectKey: varchar("object_key", { length: 1024 }).notNull(),
	contentType: varchar("content_type", { length: 255 }),
	detectedFormat: imageFormatEnum("detected_format").notNull(),
	state: imageOptimizationStateEnum().notNull(),
	priority: imageOptimizationPriorityEnum().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	originalSize: bigint("original_size", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	optimizedSize: bigint("optimized_size", { mode: "number" }),
	sourceEtag: varchar("source_etag", { length: 255 }),
	resultEtag: varchar("result_etag", { length: 255 }),
	toolUsed: varchar("tool_used", { length: 255 }),
	attempts: integer().default(0).notNull(),
	lastError: text("last_error"),
	lockedBy: varchar("locked_by", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	lockedAt: bigint("locked_at", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	enqueuedAt: bigint("enqueued_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	completedAt: bigint("completed_at", { mode: "number" }),
}, (table) => [
	// drizzle-kit introspect assigns enum_ops to all three columns, but enqueued_at
	// is bigint and enum_ops does not accept it, so the generated index fails.
	// Operator classes dropped: Postgres picks the right default per column type.
	// Re-apply after each introspect - see docs/KNOWN-GAPS.md.
	index("idx_image_optimization_record_claim").using("btree", table.state.asc().nullsLast(), table.priority.asc().nullsLast(), table.enqueuedAt.asc().nullsLast()),
	unique("unique_image_optimization_record_object_key").on(table.objectKey),
]);

export const imageOptimizationControl = pgTable("image_optimization_control", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	runState: imageOptimizationRunStateEnum("run_state").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	interImageDelayMs: bigint("inter_image_delay_ms", { mode: "number" }).default(3000).notNull(),
	maxWorkers: integer("max_workers").default(10).notNull(),
	updatedBy: varchar("updated_by", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const imageOptimizationTool = pgTable("image_optimization_tool", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	toolName: varchar("tool_name", { length: 255 }).notNull(),
	format: imageFormatEnum().notNull(),
	enabled: boolean().default(true).notNull(),
	executionOrder: integer("execution_order").default(0).notNull(),
	activePresetKey: varchar("active_preset_key", { length: 255 }),
	updatedBy: varchar("updated_by", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_image_optimization_tool_name").on(table.toolName),
]);

export const imageOptimizationToolSetting = pgTable("image_optimization_tool_setting", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	toolName: varchar("tool_name", { length: 255 }).notNull(),
	optionKey: varchar("option_key", { length: 255 }).notNull(),
	choiceKey: varchar("choice_key", { length: 255 }).notNull(),
	updatedBy: varchar("updated_by", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_image_optimization_tool_setting").on(table.toolName, table.optionKey),
]);

export const imageOptimizationWorkerSession = pgTable("image_optimization_worker_session", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	workerLabel: varchar("worker_label", { length: 255 }).notNull(),
	startedBy: varchar("started_by", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	startedAt: bigint("started_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	stoppedAt: bigint("stopped_at", { mode: "number" }),
	stopReason: imageOptimizationWorkerStopReasonEnum("stop_reason"),
	imagesProcessed: integer("images_processed").default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	bytesSaved: bigint("bytes_saved", { mode: "number" }).default(0).notNull(),
});

export const whatsappNotificationHistory = pgTable("whatsapp_notification_history", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	tenantType: whatsappNotificationTenantTypeEnum("tenant_type").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }),
	tenantName: varchar("tenant_name").default('').notNull(),
	recipientMobile: varchar("recipient_mobile").notNull(),
	fromMobile: varchar("from_mobile").notNull(),
	triggerType: whatsappNotificationTriggerTypeEnum("trigger_type").notNull(),
	entityType: whatsappNotificationEntityTypeEnum("entity_type"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityId: bigint("entity_id", { mode: "number" }),
	templateName: varchar("template_name").notNull(),
	languageCode: varchar("language_code").default('en').notNull(),
	namespace: varchar().notNull(),
	headerType: varchar("header_type").default('').notNull(),
	headerMediaUrl: text("header_media_url").default('').notNull(),
	bodyParams: varchar("body_params").array().default([""]).notNull(),
	buttonSubType: varchar("button_sub_type").default('').notNull(),
	buttonParams: varchar("button_params").array().default([""]).notNull(),
	status: whatsappNotificationStatusEnum().notNull(),
	requestId: varchar("request_id").default('').notNull(),
	messageId: varchar("message_id"),
	httpStatus: integer("http_status").default(0).notNull(),
	errorCode: varchar("error_code").default('').notNull(),
	errorMessage: text("error_message").default('').notNull(),
	attemptCount: integer("attempt_count").default(1).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	latencyMs: bigint("latency_ms", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sentAt: bigint("sent_at", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusUpdatedAt: bigint("status_updated_at", { mode: "number" }).default(0).notNull(),
	metadata: jsonb().default({}).notNull(),
	requestPayload: jsonb("request_payload").default({}).notNull(),
	responsePayload: jsonb("response_payload").default({}).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	lastPolledAt: bigint("last_polled_at", { mode: "number" }).default(0).notNull(),
	pollAttemptCount: integer("poll_attempt_count").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_tenant_id"
		}),
]);

export const emailNotificationHistory = pgTable("email_notification_history", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	triggerType: emailNotificationTriggerTypeEnum("trigger_type").notNull(),
	entityType: emailNotificationEntityTypeEnum("entity_type"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityId: bigint("entity_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }),
	tenantName: varchar("tenant_name").default('').notNull(),
	toEmails: varchar("to_emails").array().default([""]).notNull(),
	ccEmails: varchar("cc_emails").array().default([""]).notNull(),
	bccEmails: varchar("bcc_emails").array().default([""]).notNull(),
	templateId: varchar("template_id").notNull(),
	status: emailNotificationStatusEnum().notNull(),
	httpStatus: integer("http_status").default(0).notNull(),
	errorMessage: text("error_message").default('').notNull(),
	attemptCount: integer("attempt_count").default(1).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	retriggeredFromId: bigint("retriggered_from_id", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	latencyMs: bigint("latency_ms", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sentAt: bigint("sent_at", { mode: "number" }).default(0).notNull(),
	requestPayload: jsonb("request_payload").default({}).notNull(),
	responsePayload: jsonb("response_payload").default({}).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [loomTenant.id],
			name: "fk_tenant_id"
		}),
]);

export const filterPageConfig = pgTable("filter_page_config", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	version: bigserial({ mode: "bigint" }).notNull(),
	productType: varchar("product_type").notNull(),
	permutationKey: text("permutation_key").default('').notNull(),
	pageTitle: text("page_title").default('').notNull(),
	metaTitle: text("meta_title").default('').notNull(),
	metaDescription: text("meta_description").default('').notNull(),
	bannerImage: text("banner_image").default('').notNull(),
	bannerHeading: text("banner_heading").default('').notNull(),
	structuredData: jsonb("structured_data"),
	isIndexable: boolean("is_indexable").default(false).notNull(),
	active: boolean().default(true).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timeOfCreation: bigint("time_of_creation", { mode: "number" }).notNull(),
}, (table) => [
	unique("unique_filter_page_config_key").on(table.productType, table.permutationKey),
]);
