-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."address_type" AS ENUM('BILLING', 'SHIPPING');--> statement-breakpoint
CREATE TYPE "public"."address_type_enum" AS ENUM('SHIPPING', 'BILLING');--> statement-breakpoint
CREATE TYPE "public"."artisan_role" AS ENUM('MASTER', 'WORKER');--> statement-breakpoint
CREATE TYPE "public"."artisan_role_enum" AS ENUM('MASTER', 'WORKER');--> statement-breakpoint
CREATE TYPE "public"."auth_action_enum" AS ENUM('LOGIN', 'LOGOUT');--> statement-breakpoint
CREATE TYPE "public"."auth_provider_enum" AS ENUM('UNKNOWN', 'BASIC', 'GOOGLE', 'FACEBOOK');--> statement-breakpoint
CREATE TYPE "public"."catalog_item_media_type_enum" AS ENUM('IMAGE', 'VIDEO', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."discount_method" AS ENUM('AUTOMATIC', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."discount_method_enum" AS ENUM('AUTOMATIC', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('FREE_SHIPPING', 'PERCENTAGE_OFF');--> statement-breakpoint
CREATE TYPE "public"."discount_type_enum" AS ENUM('FREE_SHIPPING', 'PERCENTAGE_OFF');--> statement-breakpoint
CREATE TYPE "public"."element_feedback_status" AS ENUM('APPROVED', 'PENDING', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."element_feedback_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."element_feedback_uploader_enum" AS ENUM('ADMIN', 'ARTISAN');--> statement-breakpoint
CREATE TYPE "public"."element_status" AS ENUM('COMPLETED', 'HALTED', 'IN_PROGRESS', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."element_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'HALTED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."element_type" AS ENUM('STEP', 'SUBPROCESS');--> statement-breakpoint
CREATE TYPE "public"."element_type_enum" AS ENUM('STEP', 'SUBPROCESS');--> statement-breakpoint
CREATE TYPE "public"."email_notification_entity_type_enum" AS ENUM('ORDER', 'CUSTOM_ORDER', 'WORKFLOW');--> statement-breakpoint
CREATE TYPE "public"."email_notification_status_enum" AS ENUM('PENDING_SEND', 'POST_SUCCESS', 'POST_FAILED', 'POST_ERROR');--> statement-breakpoint
CREATE TYPE "public"."email_notification_trigger_type_enum" AS ENUM('ORDER_CONFIRMATION', 'ORDER_FULFILLMENT_DISPATCH', 'ORDER_PAYMENT_FAILED', 'ORDER_CANCELLED', 'ORDER_REVIEW_REQUEST', 'CUSTOM_ORDER_CONFIRMATION', 'CUSTOM_ORDER_DISPATCH', 'PRE_ORDER_CONFIRMATION', 'PRE_ORDER_READY_TO_SHIP', 'CONTACT_US', 'CUSTOMER_BTS_UPDATE', 'INTERNAL_BTS_UPDATE', 'WORKFLOW_STATUS_UPDATE');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('FEMALE', 'MALE', 'OTHER', 'UNDEFINED');--> statement-breakpoint
CREATE TYPE "public"."gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER', 'UNDEFINED');--> statement-breakpoint
CREATE TYPE "public"."image_format_enum" AS ENUM('JPEG', 'PNG', 'WEBP', 'GIF', 'SVG', 'TIFF', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."image_optimization_priority_enum" AS ENUM('INCOMING', 'BACKLOG');--> statement-breakpoint
CREATE TYPE "public"."image_optimization_run_state_enum" AS ENUM('RUNNING', 'PAUSED');--> statement-breakpoint
CREATE TYPE "public"."image_optimization_state_enum" AS ENUM('DISCOVERED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED', 'UNSUPPORTED');--> statement-breakpoint
CREATE TYPE "public"."image_optimization_worker_stop_reason_enum" AS ENUM('MANUAL', 'EXPIRED', 'SHUTDOWN');--> statement-breakpoint
CREATE TYPE "public"."image_position_enum" AS ENUM('LT', 'RT', 'CT');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('DOMESTIC', 'INTERNATIONAL');--> statement-breakpoint
CREATE TYPE "public"."location_type_enum" AS ENUM('DOMESTIC', 'INTERNATIONAL');--> statement-breakpoint
CREATE TYPE "public"."log_enum" AS ENUM('EMERGENCY', 'ALERT', 'CRITICAL', 'ERROR', 'WARNING', 'NOTICE', 'INFO', 'DEBUG');--> statement-breakpoint
CREATE TYPE "public"."log_type" AS ENUM('ALERT', 'CRITICAL', 'DEBUG', 'EMERGENCY', 'ERROR', 'INFO', 'NOTICE', 'WARNING');--> statement-breakpoint
CREATE TYPE "public"."loyalty_config_audit_log_type" AS ENUM('ONBOARDING', 'RENEWAL_AUTO', 'RENEWAL_MANUAL', 'ADJUSTMENT');--> statement-breakpoint
CREATE TYPE "public"."nverse_auth_provider" AS ENUM('BASIC', 'FACEBOOK', 'GOOGLE', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('CANCELLED', 'DELIVERED', 'DISPATCHED', 'FAILED', 'INITIATED', 'IN_TRANSIT', 'PROCESSING');--> statement-breakpoint
CREATE TYPE "public"."order_status_enum" AS ENUM('INITIATED', 'PROCESSING', 'CANCELLED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'DISPATCHED');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('IN_STOCK', 'MADE_TO_ORDER', 'PRE_ORDER');--> statement-breakpoint
CREATE TYPE "public"."order_type_enum" AS ENUM('IN_STOCK', 'MADE_TO_ORDER', 'PRE_ORDER');--> statement-breakpoint
CREATE TYPE "public"."payment_mode_enum" AS ENUM('RAZORPAY', 'STRIPE', 'BANK', 'COD');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('FAILED', 'PAID', 'PENDING', 'PREPAID');--> statement-breakpoint
CREATE TYPE "public"."payment_status_enum" AS ENUM('PENDING', 'PREPAID', 'PAID', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."restock_request_status" AS ENUM('CONVERTED', 'FULFILLED', 'PARTIALLY_FULFILLED', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('APPROVED', 'PENDING', 'REMOVED');--> statement-breakpoint
CREATE TYPE "public"."review_status_enum" AS ENUM('PENDING', 'APPROVED', 'REMOVED');--> statement-breakpoint
CREATE TYPE "public"."scheduled_email_enum" AS ENUM('COMPLETED', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."scheduled_email_status" AS ENUM('PENDING', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."settings_attribute" AS ENUM('CASH_ON_DELIVERY', 'CRAFT_SITE_NOTIFICATION', 'FABRIC_SITE_NOTIFICATION', 'SWATCH_PRICE_PERCENTAGE');--> statement-breakpoint
CREATE TYPE "public"."settings_attribute_enum" AS ENUM('CASH_ON_DELIVERY', 'SWATCH_PRICE_PERCENTAGE', 'FABRIC_SITE_NOTIFICATION', 'CRAFT_SITE_NOTIFICATION');--> statement-breakpoint
CREATE TYPE "public"."settings_attribute_type" AS ENUM('BOOLEAN', 'NUMBER', 'TEXT');--> statement-breakpoint
CREATE TYPE "public"."settings_attribute_type_enum" AS ENUM('NUMBER', 'BOOLEAN', 'TEXT');--> statement-breakpoint
CREATE TYPE "public"."story_content_type" AS ENUM('ARTISTS', 'CLUSTERS', 'COLLABORATIONS', 'CRAFTS');--> statement-breakpoint
CREATE TYPE "public"."story_content_type_enum" AS ENUM('ARTISTS', 'CRAFTS', 'CLUSTERS', 'COLLABORATIONS');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('CREATED', 'FAILED', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."transaction_status_enum" AS ENUM('CREATED', 'PAID', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."unit_enum" AS ENUM('METER', 'UNIT');--> statement-breakpoint
CREATE TYPE "public"."usage_type" AS ENUM('MULTIPLE', 'SINGLE');--> statement-breakpoint
CREATE TYPE "public"."usage_type_enum" AS ENUM('SINGLE', 'MULTIPLE');--> statement-breakpoint
CREATE TYPE "public"."user_role_enum" AS ENUM('ROLE_GOD_MODE', 'ROLE_SUPER_USER', 'ROLE_ADMIN', 'ROLE_CUSTOMER');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_notification_entity_type_enum" AS ENUM('ORDER', 'ORDER_FULFILLMENT', 'CUSTOM_ORDER', 'CUSTOM_ORDER_FULFILLMENT');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_notification_status_enum" AS ENUM('PENDING_SEND', 'POST_SUCCESS', 'POST_FAILED', 'POST_ERROR', 'SENT', 'DELIVERED', 'READ', 'FAILED_DELIVERY');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_notification_tenant_type_enum" AS ENUM('CUSTOMER', 'ARTISAN');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_notification_trigger_type_enum" AS ENUM('ORDER_CONFIRMATION', 'ORDER_DISPATCH', 'ORDER_FULFILLMENT_DISPATCH', 'CUSTOM_ORDER_FULFILLMENT_DISPATCH', 'ORDER_CANCELLED', 'CUSTOMER_BTS_UPDATE', 'CUSTOM_ORDER_CONFIRMATION', 'PRE_ORDER_READY_TO_SHIP');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_opt_in_status_enum" AS ENUM('OPTED_IN', 'OPTED_OUT', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."workflow_status" AS ENUM('COMPLETED', 'CREATED', 'HALTED', 'INITIATED');--> statement-breakpoint
CREATE TYPE "public"."workflow_status_enum" AS ENUM('CREATED', 'INITIATED', 'COMPLETED', 'HALTED');--> statement-breakpoint
CREATE TYPE "public"."workflow_type" AS ENUM('CUSTOM_ORDER', 'ORDER');--> statement-breakpoint
CREATE TYPE "public"."workflow_type_enum" AS ENUM('ORDER', 'CUSTOM_ORDER');--> statement-breakpoint
CREATE SEQUENCE "public"."authentication_log_user_id_seq1" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "loom_tenant" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"loom_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"contact_number" varchar DEFAULT '' NOT NULL,
	"contact_number_verified" boolean DEFAULT false NOT NULL,
	"user_password" varchar NOT NULL,
	"creation_time" bigint NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"suspended" boolean DEFAULT false NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_date" bigint DEFAULT 0,
	"ban_uplift_date" bigint DEFAULT 0,
	"deleted" boolean DEFAULT false NOT NULL,
	"user_name" varchar(150) NOT NULL,
	"dob" bigint DEFAULT 0 NOT NULL,
	"gender" "gender_enum" NOT NULL,
	"last_access_time" bigint DEFAULT 0,
	"profile_image_url" varchar(255) DEFAULT 'default-display-picture.svg' NOT NULL,
	"provider" "auth_provider_enum" DEFAULT 'UNKNOWN' NOT NULL,
	"user_type" varchar(20) DEFAULT 'registered' NOT NULL,
	CONSTRAINT "unique_loom_id" UNIQUE("loom_id"),
	CONSTRAINT "unique_email" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "badge_profile" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"profile_name" varchar(255) NOT NULL,
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_badge_profile_name" UNIQUE("profile_name")
);
--> statement-breakpoint
CREATE TABLE "blog_content_type" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar(50) NOT NULL,
	"time_of_creation" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "color" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"hex" varchar(255) NOT NULL,
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_color_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "custom_size_profile" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"profile_name" varchar(255) NOT NULL,
	"disclaimer" text NOT NULL,
	"price" integer NOT NULL,
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_custom_size_profile_name" UNIQUE("profile_name")
);
--> statement-breakpoint
CREATE TABLE "custom_order_adjustment" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"custom_order_id" bigint NOT NULL,
	"adjustment_type" integer DEFAULT 1 NOT NULL,
	"particular" varchar(255) NOT NULL,
	"adjustment_amount" numeric NOT NULL,
	"currency" varchar NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_review_scheduled_email" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"order_id" bigint NOT NULL,
	"products" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"queued_date" bigint NOT NULL,
	"scheduled_date" bigint NOT NULL,
	"status" "scheduled_email_status" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_content_section" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"story_content_id" bigint NOT NULL,
	"template_type" integer NOT NULL,
	"template_color" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"image_1" text DEFAULT '',
	"image_2" text DEFAULT '',
	"caption_1" varchar(255) DEFAULT '',
	"caption_2" varchar(255) DEFAULT '',
	"video_1" text DEFAULT '',
	"video_2" text DEFAULT '',
	"heading" varchar(255) DEFAULT '',
	"title_1" varchar(255) DEFAULT '',
	"title_2" varchar(255) DEFAULT '',
	"paragraph_1" text DEFAULT '',
	"paragraph_2" text DEFAULT '',
	"cta_button_name_1" varchar(255) DEFAULT '',
	"cta_link_1" text DEFAULT '',
	"cta_button_name_2" varchar(255) DEFAULT '',
	"cta_link_2" text DEFAULT '',
	"top_motif" text DEFAULT '',
	"bottom_motif" text DEFAULT '',
	"image_1_alt" text DEFAULT '' NOT NULL,
	"image_2_alt" text DEFAULT '' NOT NULL,
	"video_1_alt" text DEFAULT '' NOT NULL,
	"video_2_alt" text DEFAULT '' NOT NULL,
	"image_1_link" text DEFAULT '',
	"image_2_link" text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE "sub_category" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"segment_id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" text DEFAULT '',
	"meta_title" varchar(255) DEFAULT '',
	"meta_description" text DEFAULT '',
	"social_image" text DEFAULT '',
	"badge_profile_id" bigint,
	"made_to_order_profile_id" bigint,
	"volume_discount_profile_id" bigint,
	"custom_size_profile_id" bigint,
	"size_profile_id" bigint,
	"finish_profile_id" bigint,
	"fabric_profile_id" bigint,
	"time_of_creation" bigint NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"featured_image" text DEFAULT '' NOT NULL,
	CONSTRAINT "unique_sub_category_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "cart_item" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"fabric_product_id" bigint,
	"finished_product_id" bigint,
	"selected_fabric_id" bigint,
	"selected_size_option_id" bigint,
	"selected_finish_id" varchar DEFAULT '',
	"custom_size" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"product_group" varchar NOT NULL,
	"order_type" "order_type_enum" NOT NULL,
	"quantity" numeric NOT NULL,
	"making_charge" numeric(8, 2) DEFAULT '0.00' NOT NULL,
	"last_updated_at" bigint DEFAULT (EXTRACT(epoch FROM CURRENT_TIMESTAMP) * (1000)::numeric) NOT NULL,
	"unit" "unit_enum" DEFAULT 'METER' NOT NULL,
	"click_id" text,
	"click_id_type" text,
	"click_captured_at" bigint,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text
);
--> statement-breakpoint
CREATE TABLE "inventory_adjustment" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"user_id" bigint NOT NULL,
	"adjustment_date" bigint NOT NULL,
	"warehouse_id" bigint NOT NULL,
	"reference_no" varchar DEFAULT '' NOT NULL,
	"reason_id" bigint DEFAULT 0 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "element" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"workflow_id" bigint NOT NULL,
	"element_id" varchar NOT NULL,
	"type" "element_type_enum" NOT NULL,
	"pos_x" integer NOT NULL,
	"pos_y" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artisan_incentive_config" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"key" varchar(64) NOT NULL,
	"value" varchar(128) NOT NULL,
	"description" text,
	"updated_by" varchar(128),
	"updated_at" bigint,
	CONSTRAINT "artisan_incentive_config_key_key" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "artisan_payment_record" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"artisan_id" bigint NOT NULL,
	"workflow_id" bigint NOT NULL,
	"effective_quantity" numeric(10, 3) NOT NULL,
	"rate" numeric(10, 2) NOT NULL,
	"quantity_type" "unit_enum" DEFAULT 'METER' NOT NULL,
	"base_payment" numeric(12, 2) NOT NULL,
	"total_incentive" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total_payment" numeric(12, 2) NOT NULL,
	"status" varchar(16) DEFAULT 'PENDING' NOT NULL,
	"calculated_at" bigint,
	"approved_at" bigint,
	"approved_by" varchar(128),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "order_fulfillment" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"order_id" bigint NOT NULL,
	"shipment_id" bigint,
	"shipping_mode" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"shipping_code" varchar DEFAULT '' NOT NULL,
	"tracking_url" text DEFAULT '' NOT NULL,
	"zoho_package_id" varchar DEFAULT '' NOT NULL,
	"dispatched_on" bigint DEFAULT 0 NOT NULL,
	"estimated_delivery_from" bigint DEFAULT 0 NOT NULL,
	"estimated_delivery_to" bigint DEFAULT 0 NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_order_item_ready" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"created_at" bigint NOT NULL,
	"custom_order_id" bigint NOT NULL,
	"custom_order_item_id" bigint,
	"custom_order_ready_id" bigint,
	"quantity" numeric NOT NULL,
	"updated_at" bigint NOT NULL,
	"unit" "unit_enum" DEFAULT 'METER' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "address" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"name" varchar NOT NULL,
	"address_line_1" varchar NOT NULL,
	"address_line_2" varchar DEFAULT '' NOT NULL,
	"postal_code" varchar(10) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"country" varchar NOT NULL,
	"company_name" varchar(255) DEFAULT '' NOT NULL,
	"primary_phone" varchar NOT NULL,
	"secondary_phone" varchar DEFAULT '' NOT NULL,
	"contact_email" varchar NOT NULL,
	"vat_gst_number" varchar(100) DEFAULT '' NOT NULL,
	"eori_number" varchar(100) DEFAULT '' NOT NULL,
	"address_type" "address_type_enum" NOT NULL,
	"primary_billing_address" boolean DEFAULT false NOT NULL,
	"primary_shipping_address" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_content" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"blog_content_category_id" bigint NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"reading_time" integer DEFAULT 0 NOT NULL,
	"banner_image_desktop" text DEFAULT '' NOT NULL,
	"banner_image_mobile" text DEFAULT '' NOT NULL,
	"banner_image_parallax" text DEFAULT '',
	"parallax_text" varchar(255) DEFAULT '',
	"slug" varchar(255) DEFAULT '',
	"previous_blog" bigint,
	"next_blog" bigint,
	"author_id" bigint NOT NULL,
	"time_of_creation" bigint NOT NULL,
	"last_update_time" bigint NOT NULL,
	"meta_title" varchar(255) DEFAULT '' NOT NULL,
	"meta_description" varchar(255) DEFAULT '' NOT NULL,
	"banner_image_alt" text DEFAULT '' NOT NULL,
	"banner_image_parallax_alt" text DEFAULT '' NOT NULL,
	"backward_compatible_link" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_content_section" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"blog_content_id" bigint NOT NULL,
	"template_type" integer NOT NULL,
	"template_color" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"image_1" text DEFAULT '',
	"image_2" text DEFAULT '',
	"caption_1" varchar(255) DEFAULT '',
	"caption_2" varchar(255) DEFAULT '',
	"video_1" text DEFAULT '',
	"video_2" text DEFAULT '',
	"heading" varchar(255) DEFAULT '',
	"title_1" varchar(255) DEFAULT '',
	"title_2" varchar(255) DEFAULT '',
	"paragraph_1" text DEFAULT '',
	"paragraph_2" text DEFAULT '',
	"cta_button_name_1" varchar(255) DEFAULT '',
	"cta_link_1" text DEFAULT '',
	"cta_button_name_2" varchar(255) DEFAULT '',
	"cta_link_2" text DEFAULT '',
	"top_motif" text DEFAULT '',
	"bottom_motif" text DEFAULT '',
	"image_1_alt" text DEFAULT '' NOT NULL,
	"image_2_alt" text DEFAULT '' NOT NULL,
	"video_1_alt" text DEFAULT '' NOT NULL,
	"video_2_alt" text DEFAULT '' NOT NULL,
	"image_1_link" text DEFAULT '',
	"image_2_link" text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE "custom_order" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"sub_total" numeric NOT NULL,
	"shipping_mode" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"shipping_cost" numeric DEFAULT '0' NOT NULL,
	"total" numeric NOT NULL,
	"currency" varchar NOT NULL,
	"advance_pay" numeric DEFAULT '0' NOT NULL,
	"remaining_pay" numeric DEFAULT '0' NOT NULL,
	"auto_discount" numeric DEFAULT '0' NOT NULL,
	"coupon_applied" boolean DEFAULT false NOT NULL,
	"coupon_code" varchar DEFAULT '' NOT NULL,
	"coupon_discount" numeric DEFAULT '0' NOT NULL,
	"coupon_discount_amount" numeric DEFAULT '0' NOT NULL,
	"address" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" bigint,
	"failed_error_code" integer DEFAULT '-1',
	"failed_error_message" varchar DEFAULT '',
	"deleted" boolean DEFAULT false NOT NULL,
	"zoho_order_id" varchar DEFAULT '' NOT NULL,
	"cancelled_at" bigint,
	"cancellation_reason" text DEFAULT '' NOT NULL,
	"adjusted_total" numeric DEFAULT '0' NOT NULL,
	"cc_emails" varchar[] DEFAULT '{""}',
	"order_type" varchar(50) DEFAULT 'FABRIC',
	"loyalty_order" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "inventory_adjustment_reason" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"reason" varchar NOT NULL,
	"description" varchar DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "unique_inventory_adjustment_reason" UNIQUE("reason")
);
--> statement-breakpoint
CREATE TABLE "badge_profile_item" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"image" text NOT NULL,
	"caption" varchar(255) NOT NULL,
	"link" text DEFAULT '' NOT NULL,
	"profile_id" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_content_category" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"blog_content_type_id" bigint NOT NULL,
	"name" varchar(50) NOT NULL,
	"time_of_creation" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" text DEFAULT '',
	"meta_title" varchar(255) DEFAULT '',
	"meta_description" text DEFAULT '',
	"social_image" text DEFAULT '',
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_category_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "custom_product" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"sku" varchar(50) NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"product_group" varchar(20) NOT NULL,
	"remarks" text DEFAULT '' NOT NULL,
	"hero_image" text DEFAULT '' NOT NULL,
	"additional_images" text DEFAULT '' NOT NULL,
	"additional_docs" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"unit" "unit_enum" DEFAULT 'METER' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_size_profile_item" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"profile_id" bigint NOT NULL,
	"label" varchar(255) NOT NULL,
	"field_type" integer NOT NULL,
	"placeholder" varchar(255) NOT NULL,
	"mandatory" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"discount_type" "discount_type_enum" NOT NULL,
	"discount_method" "discount_method_enum" NOT NULL,
	"discount_percentage" double precision DEFAULT 0 NOT NULL,
	"minimum_order_value" integer NOT NULL,
	"location" "location_type_enum" NOT NULL,
	"start_date" bigint NOT NULL,
	"end_date" bigint DEFAULT 0 NOT NULL,
	"coupon_code" varchar DEFAULT '' NOT NULL,
	"usage_type" "usage_type_enum" NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "filter_page_config" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"product_type" varchar NOT NULL,
	"permutation_key" text DEFAULT '' NOT NULL,
	"page_title" text DEFAULT '' NOT NULL,
	"meta_title" text DEFAULT '' NOT NULL,
	"meta_description" text DEFAULT '' NOT NULL,
	"banner_image" text DEFAULT '' NOT NULL,
	"banner_heading" text DEFAULT '' NOT NULL,
	"structured_data" jsonb,
	"is_indexable" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_filter_page_config_key" UNIQUE("product_type","permutation_key")
);
--> statement-breakpoint
CREATE TABLE "fabric_profile" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"profile_name" varchar(255) NOT NULL,
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_fabric_profile_name" UNIQUE("profile_name")
);
--> statement-breakpoint
CREATE TABLE "finish_profile" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"profile_name" varchar(255) NOT NULL,
	"display_name" varchar(255) DEFAULT 'Finish' NOT NULL,
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_finish_profile_name" UNIQUE("profile_name")
);
--> statement-breakpoint
CREATE TABLE "finish_profile_item" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"profile_id" bigint NOT NULL,
	"label" varchar NOT NULL,
	"description" text NOT NULL,
	"image" text NOT NULL,
	"price" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forex" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"country" varchar NOT NULL,
	"currency" varchar NOT NULL,
	"rate" numeric NOT NULL,
	CONSTRAINT "unique_country" UNIQUE("country")
);
--> statement-breakpoint
CREATE TABLE "forex_exchange_rate" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"record_date" bigint NOT NULL,
	"gbp" numeric(8, 4) NOT NULL,
	"eur" numeric(8, 4) NOT NULL,
	"usd" numeric(8, 4) NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_order_item" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"custom_order_id" bigint NOT NULL,
	"order_type" "order_type_enum" DEFAULT 'MADE_TO_ORDER' NOT NULL,
	"product_group" varchar(20) NOT NULL,
	"customization" jsonb NOT NULL,
	"quantity" numeric NOT NULL,
	"unit" "unit_enum" DEFAULT 'METER' NOT NULL,
	"price" numeric NOT NULL,
	"currency" varchar NOT NULL,
	"shipping_code" varchar DEFAULT '' NOT NULL,
	"tracking_url" text DEFAULT '' NOT NULL,
	"dispatched_on" bigint DEFAULT 0 NOT NULL,
	"estimated_delivery_from" bigint DEFAULT 0 NOT NULL,
	"estimated_delivery_to" bigint DEFAULT 0 NOT NULL,
	"order_status" "order_status_enum" NOT NULL,
	"zoho_package_id" varchar DEFAULT '' NOT NULL,
	"review_id" bigint,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"wishlist" text DEFAULT '' NOT NULL,
	"default_currency" varchar DEFAULT '' NOT NULL,
	CONSTRAINT "unique_customer" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "material" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_material_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"sub_total" numeric NOT NULL,
	"shipping_mode" jsonb NOT NULL,
	"shipping_cost" numeric NOT NULL,
	"total" numeric NOT NULL,
	"currency" varchar NOT NULL,
	"advance_pay" numeric NOT NULL,
	"remaining_pay" numeric NOT NULL,
	"auto_discount" numeric NOT NULL,
	"coupon_applied" boolean NOT NULL,
	"coupon_code" varchar DEFAULT '' NOT NULL,
	"coupon_discount" numeric NOT NULL,
	"address" jsonb NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"gift" boolean DEFAULT false NOT NULL,
	"created_at" bigint,
	"failed_error_code" integer DEFAULT '-1',
	"failed_error_message" varchar DEFAULT '',
	"deleted" boolean DEFAULT false NOT NULL,
	"zoho_order_id" varchar DEFAULT '' NOT NULL,
	"cancelled_at" bigint,
	"cancellation_reason" text DEFAULT '' NOT NULL,
	"coupon_discount_amount" numeric DEFAULT '0' NOT NULL,
	"loyalty_order" boolean DEFAULT false,
	"exchange_rate" numeric,
	"loyalty_discount" numeric(5, 2) DEFAULT '0',
	"loyalty_discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"click_id" text,
	"click_id_type" text,
	"click_captured_at" bigint,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"order_id" bigint NOT NULL,
	"order_type" "order_type_enum" NOT NULL,
	"product_group" varchar NOT NULL,
	"customization" jsonb NOT NULL,
	"volume_discount" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sale_discount_percentage" numeric DEFAULT '0' NOT NULL,
	"made_to_order_profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"quantity" numeric NOT NULL,
	"price" numeric NOT NULL,
	"currency" varchar NOT NULL,
	"shipping_code" varchar DEFAULT '' NOT NULL,
	"tracking_url" text DEFAULT '' NOT NULL,
	"dispatched_on" bigint DEFAULT 0 NOT NULL,
	"estimated_delivery_from" bigint DEFAULT 0 NOT NULL,
	"estimated_delivery_to" bigint DEFAULT 0 NOT NULL,
	"order_status" "order_status_enum" NOT NULL,
	"payment_status" "payment_status_enum" NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"preorder_ready" boolean DEFAULT false NOT NULL,
	"zoho_package_id" varchar DEFAULT '' NOT NULL,
	"review_id" bigint,
	"loyalty_order" boolean DEFAULT false NOT NULL,
	"loyalty_discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"unit" "unit_enum" DEFAULT 'METER' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "made_to_order_profile" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"profile_name" varchar(255) NOT NULL,
	"minimum_order_quantity" integer NOT NULL,
	"delivery_from_days" integer NOT NULL,
	"delivery_to_days" integer NOT NULL,
	"time_of_creation" bigint NOT NULL,
	"consumed_fabric" numeric(8, 2) DEFAULT '0.0' NOT NULL,
	CONSTRAINT "unique_made_to_order_profile_name" UNIQUE("profile_name")
);
--> statement-breakpoint
CREATE TABLE "pattern" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_pattern_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "purchase_order_feedback" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"order_id" bigint NOT NULL,
	"question_1" varchar NOT NULL,
	"question_1_answer" numeric DEFAULT '0' NOT NULL,
	"question_2" varchar NOT NULL,
	"question_2_answer" boolean DEFAULT false NOT NULL,
	"question_2_negative" varchar DEFAULT '',
	"question_2_neg_answer" varchar DEFAULT '',
	"question_3" varchar NOT NULL,
	"question_3_answer" varchar DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "unique_order_id" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "razorpay_transaction" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"razorpay_order_id" varchar NOT NULL,
	"loom_order_id" bigint NOT NULL,
	"amount" numeric NOT NULL,
	"currency" varchar NOT NULL,
	"transaction_id" varchar DEFAULT '' NOT NULL,
	"transaction_signature" text DEFAULT '' NOT NULL,
	"status" "transaction_status_enum" NOT NULL,
	"failed_error_code" integer DEFAULT '-1',
	"failed_error_message" varchar DEFAULT '',
	"data_dump" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	"payment_type" varchar DEFAULT 'advance' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "segment" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"category_id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" text DEFAULT '',
	"meta_title" varchar(255) DEFAULT '',
	"meta_description" text DEFAULT '',
	"social_image" text DEFAULT '',
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_segment_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"attribute_name" "settings_attribute_enum" NOT NULL,
	"attribute_type" "settings_attribute_type_enum" NOT NULL,
	"attribute_value" jsonb NOT NULL,
	"attribute_link" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar NOT NULL,
	"base_amount" integer NOT NULL,
	"base_quantity" integer NOT NULL,
	"additional_amount" integer NOT NULL,
	"estimated_from_day" integer NOT NULL,
	"estimated_to_day" integer NOT NULL,
	"location_type" "location_type_enum" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "size_profile" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"profile_name" varchar(255) NOT NULL,
	"display_name" varchar(255) DEFAULT 'Size' NOT NULL,
	"disclaimer" text NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_size_profile_name" UNIQUE("profile_name")
);
--> statement-breakpoint
CREATE TABLE "size_profile_option" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"profile_id" bigint NOT NULL,
	"label" varchar(255) NOT NULL,
	"key_feature" varchar(255) DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"consumed_fabric" numeric(8, 2) DEFAULT '0.0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "size_profile_guide" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"profile_id" bigint NOT NULL,
	"option_id" bigint NOT NULL,
	"guide" varchar(255) NOT NULL,
	"value" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faq" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"story_content_id" bigint,
	"blog_content_id" bigint,
	"heading" varchar(255) NOT NULL,
	"time_of_creation" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_content" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"story_content_category_id" bigint NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"reading_time" integer DEFAULT 0 NOT NULL,
	"banner_image_desktop" text DEFAULT '' NOT NULL,
	"banner_image_mobile" text DEFAULT '' NOT NULL,
	"banner_image_parallax" text DEFAULT '',
	"parallax_text" varchar(255) DEFAULT '',
	"slug" varchar(255) DEFAULT '',
	"previous_story" bigint,
	"next_story" bigint,
	"author_id" bigint NOT NULL,
	"time_of_creation" bigint NOT NULL,
	"last_update_time" bigint NOT NULL,
	"meta_title" varchar(255) DEFAULT '' NOT NULL,
	"meta_description" varchar(255) DEFAULT '' NOT NULL,
	"banner_image_alt" text DEFAULT '' NOT NULL,
	"banner_image_parallax_alt" text DEFAULT '' NOT NULL,
	"backward_compatible_link" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_content_category" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"story_content_type" "story_content_type_enum" NOT NULL,
	"name" varchar(255) NOT NULL,
	"time_of_creation" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faq_question" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"time_of_creation" bigint NOT NULL,
	"faq_id" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sku_group" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_sku_group_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "story_product_mapping" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"story_content_id" bigint NOT NULL,
	"product_id_csv" text NOT NULL,
	"finish_product_ids" bigint[]
);
--> statement-breakpoint
CREATE TABLE "sub_category_audit" (
	"audit_id" bigserial PRIMARY KEY NOT NULL,
	"sub_category_id" bigint,
	"sub_category_name" text,
	"operation_type" varchar(10),
	"old_data" jsonb,
	"new_data" jsonb,
	-- Corrected 2026-08-12: drizzle-kit introspect emitted this default with
	-- unbalanced parentheses, making the whole file unrunnable from this point on
	-- (54 of 116 tables created before psql aborted). Re-running introspect will
	-- reintroduce it; re-apply this fix if you do.
	"changed_at" bigint DEFAULT ((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint,
	"status" varchar(10) DEFAULT 'PENDING'
);
--> statement-breakpoint
CREATE TABLE "super_user" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	CONSTRAINT "unique_super_user" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_tag_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "temp_product_meta" (
	"id" bigint,
	"sku" varchar(255),
	"meta_title" varchar(70),
	"meta_description" varchar(165)
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"role" "user_role_enum" NOT NULL,
	"user_id" bigserial NOT NULL,
	CONSTRAINT "unique_user_role" UNIQUE("role","user_id")
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"token" varchar NOT NULL,
	"created_at" varchar NOT NULL,
	"expires_at" varchar,
	"verified_at" varchar
);
--> statement-breakpoint
CREATE TABLE "volume_discount_profile" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"profile_name" varchar(255) NOT NULL,
	"disclaimer" text NOT NULL,
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_volume_discount_profile_name" UNIQUE("profile_name")
);
--> statement-breakpoint
CREATE TABLE "product_fabric" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"product_id" bigint NOT NULL,
	"add_to_swatch" boolean DEFAULT true NOT NULL,
	"gsm" integer NOT NULL,
	"width" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"sub_category_id" bigint NOT NULL,
	"name" text NOT NULL,
	"sku" varchar(255) NOT NULL,
	"sku_group_id" bigint NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"main_product_check" boolean NOT NULL,
	"main_product_id" bigint,
	"tag_id" varchar(255) DEFAULT '' NOT NULL,
	"badge_profile_id" bigint,
	"volume_discount_profile_id" bigint,
	"made_to_order_profile_id" bigint,
	"made_to_order_fabric_id" bigint,
	"size_profile_id" bigint,
	"custom_size_profile_id" bigint,
	"finish_profile_id" bigint,
	"finish_profile_item_id" varchar(255),
	"fabric_profile_id" bigint,
	"special_status_id" bigint,
	"product_overview" text NOT NULL,
	"product_care" text NOT NULL,
	"material_id" varchar(255) NOT NULL,
	"color_id" varchar(255) NOT NULL,
	"pattern_id" varchar(255) DEFAULT '',
	"sale" boolean DEFAULT false,
	"discount" numeric(5, 2) DEFAULT '0.00',
	"hero_image" text DEFAULT '',
	"hover_image" text DEFAULT '',
	"gallery_images" text DEFAULT '',
	"product_group" varchar(255) NOT NULL,
	"slug" text NOT NULL,
	"product_video" varchar DEFAULT '' NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"meta_title" varchar(70) DEFAULT '' NOT NULL,
	"meta_description" varchar(165) DEFAULT '' NOT NULL,
	"hero_image_alt" text DEFAULT '' NOT NULL,
	"hover_image_alt" text DEFAULT '' NOT NULL,
	"product_video_alt" text DEFAULT '' NOT NULL,
	"backward_compatible_link" text DEFAULT '' NOT NULL,
	"quantity" numeric(8, 2) DEFAULT '0.00' NOT NULL,
	"external_quantity" numeric DEFAULT '0' NOT NULL,
	"badge_profile_enabled" boolean DEFAULT false NOT NULL,
	"volume_discount_profile_enabled" boolean DEFAULT false NOT NULL,
	"made_to_order_profile_enabled" boolean DEFAULT false NOT NULL,
	"size_profile_enabled" boolean DEFAULT false NOT NULL,
	"custom_size_profile_enabled" boolean DEFAULT false NOT NULL,
	"finish_profile_enabled" boolean DEFAULT false NOT NULL,
	"fabric_profile_enabled" boolean DEFAULT false NOT NULL,
	"unit" "unit_enum" DEFAULT 'METER' NOT NULL,
	CONSTRAINT "unique_name" UNIQUE("name"),
	CONSTRAINT "unique_sku" UNIQUE("sku"),
	CONSTRAINT "unique_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "special_status" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"time_of_creation" bigint NOT NULL,
	CONSTRAINT "unique_special_status_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "fabric_profile_item" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"profile_id" bigint NOT NULL,
	"product_id" bigint NOT NULL,
	"mockup_image" text DEFAULT '' NOT NULL,
	"mockup_text" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_restock_request" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"product_id" bigint NOT NULL,
	"made_to_order_product_id" bigint,
	"size_option_id" bigint,
	"product_group" varchar(20) NOT NULL,
	"requested_quantity" numeric DEFAULT '0.0' NOT NULL,
	"created_at" bigint NOT NULL,
	"notified_at" bigint DEFAULT 0 NOT NULL,
	"status" "restock_request_status" DEFAULT 'PENDING' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_finished" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"product_id" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_image_gallery_seo" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"product_id" bigint NOT NULL,
	"image" varchar(255) NOT NULL,
	"alt_text" varchar(255) NOT NULL,
	CONSTRAINT "unique_seo" UNIQUE("product_id","image")
);
--> statement-breakpoint
CREATE TABLE "product_size_profile" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"product_id" bigint NOT NULL,
	"size_profile_option_id" bigint NOT NULL,
	"size_profile_option_sku" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"consumed_fabric" numeric(8, 2),
	CONSTRAINT "unique_product_id_size_profile_option" UNIQUE("product_id","size_profile_option_sku")
);
--> statement-breakpoint
CREATE TABLE "volume_discount_profile_item" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"profile_id" bigint NOT NULL,
	"minimum_order_quantity" integer NOT NULL,
	"discount" numeric NOT NULL,
	"pre_order" boolean DEFAULT false NOT NULL,
	"advance_payment" numeric DEFAULT '0' NOT NULL,
	"delivery_from_days" integer DEFAULT 0 NOT NULL,
	"delivery_to_days" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_zoho_relation" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"product_id" bigint NOT NULL,
	"sku" varchar NOT NULL,
	"zoho_item_id" varchar DEFAULT '' NOT NULL,
	"hsn_code" varchar DEFAULT '' NOT NULL,
	"purchase_price" numeric(8, 4) DEFAULT '0.001' NOT NULL,
	"tax" numeric(8, 4) NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "unique_zoho_sku" UNIQUE("sku"),
	CONSTRAINT "unique_zoho_sku_item_id" UNIQUE("sku","zoho_item_id")
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar NOT NULL,
	"city" varchar DEFAULT '' NOT NULL,
	"country" varchar NOT NULL,
	"rating" integer NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"product_id" bigint,
	"order_id" bigint,
	"product_images" text DEFAULT '' NOT NULL,
	"status" "review_status_enum" NOT NULL,
	"active_url" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"admin_added" boolean DEFAULT false NOT NULL,
	"link" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouse" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "unique_warehouse_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "inventory_adjustment_item" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"inventory_adjustment_id" bigint NOT NULL,
	"product_id" bigint NOT NULL,
	"quantity_available" numeric NOT NULL,
	"quantity_adjusted" numeric NOT NULL,
	"quantity_at_hand" numeric NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_template" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar(500) DEFAULT '' NOT NULL,
	"tenant_id" bigint NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"product_associated" boolean DEFAULT false NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "element_template" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"workflow_id" bigint NOT NULL,
	"element_id" varchar NOT NULL,
	"type" "element_type_enum" NOT NULL,
	"pos_x" integer NOT NULL,
	"pos_y" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subprocess_element_template" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"workflow_id" bigint NOT NULL,
	"step_id" bigint NOT NULL,
	"element_id" bigint NOT NULL,
	"parent_subprocess_id" varchar DEFAULT '' NOT NULL,
	"previous_subprocess_id" varchar DEFAULT '' NOT NULL,
	"next_subprocess_id" varchar DEFAULT '' NOT NULL,
	"primary_subprocess" boolean NOT NULL,
	"name" varchar NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"feedback_required" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "step_element_template" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"workflow_id" bigint NOT NULL,
	"element_id" bigint NOT NULL,
	"parent_step_id" varchar DEFAULT '' NOT NULL,
	"previous_step_id" varchar DEFAULT '' NOT NULL,
	"next_step_id" varchar DEFAULT '' NOT NULL,
	"primary_step" boolean NOT NULL,
	"name" varchar NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"feedback_required" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"workflow_template_id" bigint NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar(500) DEFAULT '' NOT NULL,
	"tenant_id" bigint NOT NULL,
	"product_id" bigint,
	"status" "workflow_status_enum" DEFAULT 'CREATED' NOT NULL,
	"estimated_start_date" bigint NOT NULL,
	"estimated_end_date" bigint NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"order_id" bigint,
	"order_item_id" bigint,
	"type" "workflow_type_enum" DEFAULT 'ORDER' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "element_feedback" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"element_id" bigint,
	"text" text DEFAULT '' NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"video" text DEFAULT '' NOT NULL,
	"status" "element_feedback_status_enum" DEFAULT 'PENDING' NOT NULL,
	"remarks" text DEFAULT '' NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "unique_element_id" UNIQUE("element_id")
);
--> statement-breakpoint
CREATE TABLE "step_element" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"workflow_id" bigint NOT NULL,
	"element_id" bigint NOT NULL,
	"parent_step_id" varchar DEFAULT '' NOT NULL,
	"previous_step_id" varchar DEFAULT '' NOT NULL,
	"next_step_id" varchar DEFAULT '' NOT NULL,
	"primary_step" boolean NOT NULL,
	"estimated_days" integer NOT NULL,
	"estimated_start_date" bigint NOT NULL,
	"estimated_end_date" bigint NOT NULL,
	"actual_start_date" bigint DEFAULT 0 NOT NULL,
	"actual_end_date" bigint DEFAULT 0 NOT NULL,
	"name" varchar NOT NULL,
	"status" "element_status_enum" DEFAULT 'PENDING' NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"feedback_required" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subprocess_element" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"workflow_id" bigint NOT NULL,
	"step_id" bigint NOT NULL,
	"element_id" bigint NOT NULL,
	"parent_subprocess_id" varchar DEFAULT '' NOT NULL,
	"previous_subprocess_id" varchar DEFAULT '' NOT NULL,
	"next_subprocess_id" varchar DEFAULT '' NOT NULL,
	"primary_subprocess" boolean NOT NULL,
	"estimated_days" integer NOT NULL,
	"estimated_start_date" bigint NOT NULL,
	"estimated_end_date" bigint NOT NULL,
	"actual_start_date" bigint DEFAULT 0 NOT NULL,
	"actual_end_date" bigint DEFAULT 0 NOT NULL,
	"name" varchar NOT NULL,
	"status" "element_status_enum" DEFAULT 'PENDING' NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"feedback_required" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_custom_order_mapping" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"workflow_id" bigint NOT NULL,
	"custom_order_id" bigint NOT NULL,
	"custom_order_item_id" bigint NOT NULL,
	"custom" boolean DEFAULT false NOT NULL,
	"product_id" bigint,
	"custom_product_id" bigint
);
--> statement-breakpoint
CREATE TABLE "authentication_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"attempt" smallint DEFAULT 1,
	"information" text DEFAULT 'no information' NOT NULL,
	"time" bigint NOT NULL,
	"user_id" bigint DEFAULT nextval('authentication_log_user_id_seq1'::regclass) NOT NULL,
	"action" "auth_action_enum" DEFAULT 'LOGIN' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"data_dump" text DEFAULT 'no information' NOT NULL,
	"log_type" "log_enum" NOT NULL,
	"logger" text NOT NULL,
	"message" text DEFAULT 'no information' NOT NULL,
	"time" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_notification_history" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"tenant_type" "whatsapp_notification_tenant_type_enum" NOT NULL,
	"tenant_id" bigint,
	"tenant_name" varchar DEFAULT '' NOT NULL,
	"recipient_mobile" varchar NOT NULL,
	"from_mobile" varchar NOT NULL,
	"trigger_type" "whatsapp_notification_trigger_type_enum" NOT NULL,
	"entity_type" "whatsapp_notification_entity_type_enum",
	"entity_id" bigint,
	"template_name" varchar NOT NULL,
	"language_code" varchar DEFAULT 'en' NOT NULL,
	"namespace" varchar NOT NULL,
	"header_type" varchar DEFAULT '' NOT NULL,
	"header_media_url" text DEFAULT '' NOT NULL,
	"body_params" varchar[] DEFAULT '{""}' NOT NULL,
	"button_sub_type" varchar DEFAULT '' NOT NULL,
	"button_params" varchar[] DEFAULT '{""}' NOT NULL,
	"status" "whatsapp_notification_status_enum" NOT NULL,
	"request_id" varchar DEFAULT '' NOT NULL,
	"message_id" varchar,
	"http_status" integer DEFAULT 0 NOT NULL,
	"error_code" varchar DEFAULT '' NOT NULL,
	"error_message" text DEFAULT '' NOT NULL,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"latency_ms" bigint DEFAULT 0 NOT NULL,
	"created_at" bigint NOT NULL,
	"sent_at" bigint DEFAULT 0 NOT NULL,
	"status_updated_at" bigint DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"request_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"response_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_polled_at" bigint DEFAULT 0 NOT NULL,
	"poll_attempt_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_notification_history" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"trigger_type" "email_notification_trigger_type_enum" NOT NULL,
	"entity_type" "email_notification_entity_type_enum",
	"entity_id" bigint,
	"tenant_id" bigint,
	"tenant_name" varchar DEFAULT '' NOT NULL,
	"to_emails" varchar[] DEFAULT '{""}' NOT NULL,
	"cc_emails" varchar[] DEFAULT '{""}' NOT NULL,
	"bcc_emails" varchar[] DEFAULT '{""}' NOT NULL,
	"template_id" varchar NOT NULL,
	"status" "email_notification_status_enum" NOT NULL,
	"http_status" integer DEFAULT 0 NOT NULL,
	"error_message" text DEFAULT '' NOT NULL,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"retriggered_from_id" bigint DEFAULT 0 NOT NULL,
	"latency_ms" bigint DEFAULT 0 NOT NULL,
	"created_at" bigint NOT NULL,
	"sent_at" bigint DEFAULT 0 NOT NULL,
	"request_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"response_payload" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_program_config" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"customer_id" bigint NOT NULL,
	"min_order_value_currency" varchar(10) NOT NULL,
	"min_order_value" numeric(10, 2) NOT NULL,
	"min_order_value_inr" numeric(10, 2) NOT NULL,
	"exchange_rate" numeric(8, 4) NOT NULL,
	"tenure" integer NOT NULL,
	"discount_percentage" numeric(10, 2) NOT NULL,
	"start_date" bigint NOT NULL,
	"end_date" bigint NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint,
	CONSTRAINT "unique_loyalty_program_customer_id" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "loyalty_program_config_audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"customer_id" bigint NOT NULL,
	"type" "loyalty_config_audit_log_type" DEFAULT 'ONBOARDING' NOT NULL,
	"min_order_value_currency" varchar(10) NOT NULL,
	"min_order_value" numeric(10, 2) NOT NULL,
	"min_order_value_inr" numeric(10, 2) NOT NULL,
	"exchange_rate" numeric(8, 4) NOT NULL,
	"tenure" integer NOT NULL,
	"discount_percentage" numeric(10, 2) NOT NULL,
	"start_date" bigint NOT NULL,
	"end_date" bigint NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint
);
--> statement-breakpoint
CREATE TABLE "artisan" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"artisan_role" "artisan_role_enum" NOT NULL,
	"master_artisan_id" bigint,
	"has_whatsapp" boolean DEFAULT false NOT NULL,
	"state" varchar(255),
	"district" varchar(255),
	"village_town" varchar(255),
	"postal_code" varchar(255),
	"expertise" varchar(255),
	"experience" integer DEFAULT 0 NOT NULL,
	"has_bank_account" boolean DEFAULT false,
	"bank_name" varchar(255),
	"account_holder_name" varchar(255),
	"ifsc_code" varchar(255),
	"last_update_time" bigint DEFAULT 0 NOT NULL,
	"tenant_id" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "unique_artisan_tenant_id" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "artisan_skill_mapping" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"artisan_id" bigint NOT NULL,
	"skill_id" bigint NOT NULL,
	CONSTRAINT "uk_artisan_skill_mapping_unique" UNIQUE("artisan_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "skill" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"deleted" boolean DEFAULT false NOT NULL,
	"time_of_creation" bigint NOT NULL,
	"last_update_time" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "unique_skill_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "catalog_item" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"quantity" integer NOT NULL,
	"description" text,
	"catalog_id" bigint NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "chk_catalog_item_price" CHECK (price >= (0)::numeric),
	CONSTRAINT "chk_catalog_item_quantity" CHECK (quantity >= 0)
);
--> statement-breakpoint
CREATE TABLE "workflow_artisan_mapping" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"workflow_id" bigint NOT NULL,
	"artisan_id" bigint NOT NULL,
	"quantity_of_fabric_in_meters" numeric(10, 2),
	"quantity_of_products" numeric(10, 2),
	"base_pay" numeric(10, 2),
	CONSTRAINT "uk_workflow_artisan_mapping_unique" UNIQUE("workflow_id","artisan_id"),
	CONSTRAINT "chk_workflow_artisan_mapping_quantity_of_fabric_in_meters" CHECK ((quantity_of_fabric_in_meters IS NULL) OR (quantity_of_fabric_in_meters >= (0)::numeric)),
	CONSTRAINT "chk_workflow_artisan_mapping_quantity_of_products" CHECK ((quantity_of_products IS NULL) OR (quantity_of_products >= (0)::numeric)),
	CONSTRAINT "chk_workflow_artisan_mapping_single_quantity_mode" CHECK (NOT ((quantity_of_fabric_in_meters IS NOT NULL) AND (quantity_of_products IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "step_element_artisan_mapping" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"step_element_id" bigint NOT NULL,
	"artisan_id" bigint NOT NULL,
	"quantity_of_fabric_in_meters" numeric(10, 2),
	"quantity_of_products" numeric(10, 2),
	"base_pay" numeric(10, 2),
	CONSTRAINT "uk_step_element_artisan_mapping_unique" UNIQUE("step_element_id","artisan_id"),
	CONSTRAINT "chk_step_element_artisan_mapping_quantity_of_fabric_in_meters" CHECK ((quantity_of_fabric_in_meters IS NULL) OR (quantity_of_fabric_in_meters >= (0)::numeric)),
	CONSTRAINT "chk_step_element_artisan_mapping_quantity_of_products" CHECK ((quantity_of_products IS NULL) OR (quantity_of_products >= (0)::numeric)),
	CONSTRAINT "chk_step_element_artisan_mapping_single_quantity_mode" CHECK (NOT ((quantity_of_fabric_in_meters IS NOT NULL) AND (quantity_of_products IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "subprocess_element_artisan_mapping" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"subprocess_element_id" bigint NOT NULL,
	"artisan_id" bigint NOT NULL,
	"quantity_of_fabric_in_meters" numeric(10, 2),
	"quantity_of_products" numeric(10, 2),
	"base_pay" numeric(10, 2),
	CONSTRAINT "uk_subprocess_element_artisan_mapping_unique" UNIQUE("subprocess_element_id","artisan_id"),
	CONSTRAINT "chk_subprocess_element_artisan_mapping_quantity_of_fabric_in_me" CHECK ((quantity_of_fabric_in_meters IS NULL) OR (quantity_of_fabric_in_meters >= (0)::numeric)),
	CONSTRAINT "chk_subprocess_element_artisan_mapping_quantity_of_products" CHECK ((quantity_of_products IS NULL) OR (quantity_of_products >= (0)::numeric)),
	CONSTRAINT "chk_subprocess_element_artisan_mapping_single_quantity_mode" CHECK (NOT ((quantity_of_fabric_in_meters IS NOT NULL) AND (quantity_of_products IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "catalog_item_media" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"media_url" text DEFAULT '' NOT NULL,
	"alt_text" varchar(75),
	"hero" boolean DEFAULT false NOT NULL,
	"catalog_item_id" bigint NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"media_type" "catalog_item_media_type_enum" DEFAULT 'UNKNOWN' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"artisan_id" bigint NOT NULL,
	"default_catalog" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_pdf" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigint DEFAULT 0 NOT NULL,
	"artisan_id" bigint NOT NULL,
	"requested_by_id" bigint NOT NULL,
	"status" varchar DEFAULT 'QUEUED' NOT NULL,
	"download_url" text DEFAULT '' NOT NULL,
	"s3_key" text DEFAULT '' NOT NULL,
	"file_name" text DEFAULT '' NOT NULL,
	"requested_at" bigint NOT NULL,
	"completed_at" bigint,
	"failure_message" text DEFAULT '' NOT NULL,
	"restart_recovery_required" boolean DEFAULT false NOT NULL,
	"compressed_attempt_count" integer DEFAULT 0 NOT NULL,
	"compressed_download_url" text DEFAULT '' NOT NULL,
	"compressed_failure_message" text DEFAULT '' NOT NULL,
	"compressed_file_name" text DEFAULT '' NOT NULL,
	"compressed_s3_key" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item_fulfillment" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"order_id" bigint NOT NULL,
	"order_fulfillment_id" bigint NOT NULL,
	"order_item_id" bigint NOT NULL,
	"quantity" numeric NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"unit" "unit_enum" DEFAULT 'METER' NOT NULL,
	CONSTRAINT "uq_order_item_once_per_fulfillment" UNIQUE("order_fulfillment_id","order_item_id"),
	CONSTRAINT "chk_order_item_fulfillment_quantity_positive" CHECK (quantity > (0)::numeric)
);
--> statement-breakpoint
CREATE TABLE "order_ready" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"created_at" bigint NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"order_id" bigint,
	"received_date" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item_ready" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"created_at" bigint NOT NULL,
	"order_id" bigint NOT NULL,
	"order_item_id" bigint,
	"order_ready_id" bigint,
	"quantity" numeric NOT NULL,
	"updated_at" bigint NOT NULL,
	"unit" "unit_enum" DEFAULT 'METER' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_order_fulfillment" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"custom_order_id" bigint NOT NULL,
	"shipment_id" bigint,
	"shipping_mode" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"shipping_code" varchar DEFAULT '' NOT NULL,
	"tracking_url" text DEFAULT '' NOT NULL,
	"zoho_package_id" varchar DEFAULT '' NOT NULL,
	"dispatched_on" bigint DEFAULT 0 NOT NULL,
	"estimated_delivery_from" bigint DEFAULT 0 NOT NULL,
	"estimated_delivery_to" bigint DEFAULT 0 NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_order_item_fulfillment" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"custom_order_id" bigint NOT NULL,
	"custom_order_fulfillment_id" bigint NOT NULL,
	"custom_order_item_id" bigint NOT NULL,
	"quantity" numeric NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"unit" "unit_enum" DEFAULT 'METER' NOT NULL,
	CONSTRAINT "uq_custom_order_item_once_per_fulfillment" UNIQUE("custom_order_fulfillment_id","custom_order_item_id"),
	CONSTRAINT "chk_custom_order_item_fulfillment_quantity_positive" CHECK (quantity > (0)::numeric)
);
--> statement-breakpoint
CREATE TABLE "custom_order_ready" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"created_at" bigint NOT NULL,
	"custom_order_id" bigint,
	"deleted" boolean DEFAULT false NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"received_date" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_vector" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"product_id" bigint NOT NULL,
	"embedding" vector(1536),
	CONSTRAINT "uk_product_vector_product_id" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "blog_vector" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"blog_content_id" bigint NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"version" bigserial NOT NULL,
	CONSTRAINT "blog_vector_blog_content_id_key" UNIQUE("blog_content_id")
);
--> statement-breakpoint
CREATE TABLE "story_vector" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"story_content_id" bigint NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"version" bigserial NOT NULL,
	CONSTRAINT "story_vector_story_content_id_key" UNIQUE("story_content_id")
);
--> statement-breakpoint
CREATE TABLE "cron_job_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"job_name" varchar(255) NOT NULL,
	"start_time" bigint NOT NULL,
	"end_time" bigint,
	"status" varchar(20) NOT NULL,
	"message" text,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_transaction" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"stripe_session_id" varchar NOT NULL,
	"loom_order_id" bigint NOT NULL,
	"stripe_payment_intent_id" varchar,
	"amount" numeric NOT NULL,
	"currency" varchar NOT NULL,
	"checkout_url" text DEFAULT '',
	"status" "transaction_status_enum" NOT NULL,
	"failed_error_code" integer DEFAULT '-1',
	"failed_error_message" varchar DEFAULT '',
	"data_dump" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" bigint NOT NULL,
	"payment_type" varchar DEFAULT 'advance' NOT NULL,
	"payment_method" varchar DEFAULT 'card' NOT NULL,
	"webhook_received" boolean DEFAULT false NOT NULL,
	"webhook_received_at" bigint,
	"webhook_data_dump" jsonb DEFAULT '{}'::jsonb,
	"webhook_event_type" varchar DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "impact_factor" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"artisan_hours" numeric,
	"assumption_snapshot" jsonb NOT NULL,
	"assumption_version" integer DEFAULT 1 NOT NULL,
	"calculation_status" varchar(16) NOT NULL,
	"co2_offset_kg" numeric,
	"created_at" bigint NOT NULL,
	"fabric_meters" numeric,
	"order_id" bigint NOT NULL,
	"order_item_id" bigint NOT NULL,
	"pending_reason" varchar(128),
	"product_type" varchar(16) NOT NULL,
	"stitching_hours" numeric,
	"tenant_id" bigint,
	"textile_artisan_hours" numeric,
	"total_work_hours" numeric,
	"updated_at" bigint NOT NULL,
	"water_saved_litres" numeric,
	"women_artisan_hours" numeric,
	"women_stitching_hours" numeric,
	"workflow_id" bigint,
	"instock_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "unique_impact_factor_order_item" UNIQUE("order_item_id"),
	CONSTRAINT "unique_impact_factor_workflow" UNIQUE("workflow_id"),
	CONSTRAINT "impact_factor_calculation_status_check" CHECK ((calculation_status)::text = ANY ((ARRAY['PARTIAL'::character varying, 'COMPLETE'::character varying])::text[])),
	CONSTRAINT "impact_factor_product_type_check" CHECK ((product_type)::text = ANY ((ARRAY['FABRIC'::character varying, 'APPAREL'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "image_optimization_record" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"object_key" varchar(1024) NOT NULL,
	"content_type" varchar(255),
	"detected_format" "image_format_enum" NOT NULL,
	"state" "image_optimization_state_enum" NOT NULL,
	"priority" "image_optimization_priority_enum" NOT NULL,
	"original_size" bigint NOT NULL,
	"optimized_size" bigint,
	"source_etag" varchar(255),
	"result_etag" varchar(255),
	"tool_used" varchar(255),
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"locked_by" varchar(255),
	"locked_at" bigint,
	"enqueued_at" bigint NOT NULL,
	"completed_at" bigint,
	CONSTRAINT "unique_image_optimization_record_object_key" UNIQUE("object_key")
);
--> statement-breakpoint
CREATE TABLE "image_optimization_control" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"run_state" "image_optimization_run_state_enum" NOT NULL,
	"inter_image_delay_ms" bigint DEFAULT 3000 NOT NULL,
	"max_workers" integer DEFAULT 10 NOT NULL,
	"updated_by" varchar(255),
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_optimization_tool" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"tool_name" varchar(255) NOT NULL,
	"format" "image_format_enum" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"execution_order" integer DEFAULT 0 NOT NULL,
	"active_preset_key" varchar(255),
	"updated_by" varchar(255),
	"updated_at" bigint NOT NULL,
	CONSTRAINT "unique_image_optimization_tool_name" UNIQUE("tool_name")
);
--> statement-breakpoint
CREATE TABLE "image_optimization_tool_setting" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"tool_name" varchar(255) NOT NULL,
	"option_key" varchar(255) NOT NULL,
	"choice_key" varchar(255) NOT NULL,
	"updated_by" varchar(255),
	"updated_at" bigint NOT NULL,
	CONSTRAINT "unique_image_optimization_tool_setting" UNIQUE("tool_name","option_key")
);
--> statement-breakpoint
CREATE TABLE "image_optimization_worker_session" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"worker_label" varchar(255) NOT NULL,
	"started_by" varchar(255),
	"started_at" bigint NOT NULL,
	"stopped_at" bigint,
	"stop_reason" "image_optimization_worker_stop_reason_enum",
	"images_processed" integer DEFAULT 0 NOT NULL,
	"bytes_saved" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_order_adjustment" ADD CONSTRAINT "fk_custom_order_id" FOREIGN KEY ("custom_order_id") REFERENCES "public"."custom_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_review_scheduled_email" ADD CONSTRAINT "fk_order_id" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_content_section" ADD CONSTRAINT "fk_story_content_id" FOREIGN KEY ("story_content_id") REFERENCES "public"."story_content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_category" ADD CONSTRAINT "fk_badge_profile_id" FOREIGN KEY ("badge_profile_id") REFERENCES "public"."badge_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_category" ADD CONSTRAINT "fk_custom_size_profile_id" FOREIGN KEY ("custom_size_profile_id") REFERENCES "public"."custom_size_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_category" ADD CONSTRAINT "fk_fabric_profile_id" FOREIGN KEY ("fabric_profile_id") REFERENCES "public"."fabric_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_category" ADD CONSTRAINT "fk_finish_profile_id" FOREIGN KEY ("finish_profile_id") REFERENCES "public"."finish_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_category" ADD CONSTRAINT "fk_made_to_order_profile_id" FOREIGN KEY ("made_to_order_profile_id") REFERENCES "public"."made_to_order_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_category" ADD CONSTRAINT "fk_segment_id" FOREIGN KEY ("segment_id") REFERENCES "public"."segment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_category" ADD CONSTRAINT "fk_volume_discount_profile_id" FOREIGN KEY ("volume_discount_profile_id") REFERENCES "public"."volume_discount_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "fk_fabric_product_id" FOREIGN KEY ("fabric_product_id") REFERENCES "public"."product_fabric"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "fk_finished_product_id" FOREIGN KEY ("finished_product_id") REFERENCES "public"."product_finished"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "fk_selected_fabric_id" FOREIGN KEY ("selected_fabric_id") REFERENCES "public"."product_fabric"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "fk_selected_size_option_id" FOREIGN KEY ("selected_size_option_id") REFERENCES "public"."size_profile_option"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustment" ADD CONSTRAINT "fk_reason_id" FOREIGN KEY ("reason_id") REFERENCES "public"."inventory_adjustment_reason"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustment" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustment" ADD CONSTRAINT "fk_warehouse_id" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouse"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "element" ADD CONSTRAINT "fk_workflow_id" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artisan_payment_record" ADD CONSTRAINT "fk_artisan_payment_record_artisan" FOREIGN KEY ("artisan_id") REFERENCES "public"."artisan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artisan_payment_record" ADD CONSTRAINT "fk_artisan_payment_record_workflow" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_fulfillment" ADD CONSTRAINT "fk_order_fulfillment_order_id" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_fulfillment" ADD CONSTRAINT "fk_order_fulfillment_shipment_id" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order_item_ready" ADD CONSTRAINT "fk_custom_order_item_ready_custom_order_item_id" FOREIGN KEY ("custom_order_item_id") REFERENCES "public"."custom_order_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order_item_ready" ADD CONSTRAINT "fk_custom_order_item_ready_ready_id" FOREIGN KEY ("custom_order_ready_id") REFERENCES "public"."custom_order_ready"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_content" ADD CONSTRAINT "fk_author_id" FOREIGN KEY ("author_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_content" ADD CONSTRAINT "fk_blog_content_category_id" FOREIGN KEY ("blog_content_category_id") REFERENCES "public"."blog_content_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_content_section" ADD CONSTRAINT "fk_blog_content_id" FOREIGN KEY ("blog_content_id") REFERENCES "public"."blog_content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_profile_item" ADD CONSTRAINT "fk_profile_id" FOREIGN KEY ("profile_id") REFERENCES "public"."badge_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_content_category" ADD CONSTRAINT "fk_blog_content_type_id" FOREIGN KEY ("blog_content_type_id") REFERENCES "public"."blog_content_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_size_profile_item" ADD CONSTRAINT "fk_profile_id" FOREIGN KEY ("profile_id") REFERENCES "public"."custom_size_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finish_profile_item" ADD CONSTRAINT "fk_profile_id" FOREIGN KEY ("profile_id") REFERENCES "public"."finish_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order_item" ADD CONSTRAINT "fk_custom_order_id" FOREIGN KEY ("custom_order_id") REFERENCES "public"."custom_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "fk_order_id" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_feedback" ADD CONSTRAINT "fk_order_id" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "razorpay_transaction" ADD CONSTRAINT "fk_loom_order_id" FOREIGN KEY ("loom_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment" ADD CONSTRAINT "fk_category_id" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "size_profile_option" ADD CONSTRAINT "fk_profile_id" FOREIGN KEY ("profile_id") REFERENCES "public"."size_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "size_profile_guide" ADD CONSTRAINT "fk_option_id" FOREIGN KEY ("option_id") REFERENCES "public"."size_profile_option"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "size_profile_guide" ADD CONSTRAINT "fk_profile_id" FOREIGN KEY ("profile_id") REFERENCES "public"."size_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq" ADD CONSTRAINT "fk_blog_content_id" FOREIGN KEY ("blog_content_id") REFERENCES "public"."blog_content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq" ADD CONSTRAINT "fk_story_content_id" FOREIGN KEY ("story_content_id") REFERENCES "public"."story_content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_content" ADD CONSTRAINT "fk_author_id" FOREIGN KEY ("author_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_content" ADD CONSTRAINT "fk_story_content_category_id" FOREIGN KEY ("story_content_category_id") REFERENCES "public"."story_content_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_question" ADD CONSTRAINT "fk_faq_id" FOREIGN KEY ("faq_id") REFERENCES "public"."faq"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_product_mapping" ADD CONSTRAINT "fk_story_content_id" FOREIGN KEY ("story_content_id") REFERENCES "public"."story_content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "super_user" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_token" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_fabric" ADD CONSTRAINT "fk_product_id" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "fk_badge_profile_id" FOREIGN KEY ("badge_profile_id") REFERENCES "public"."badge_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "fk_custom_size_profile_id" FOREIGN KEY ("custom_size_profile_id") REFERENCES "public"."custom_size_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "fk_fabric_profile_id" FOREIGN KEY ("fabric_profile_id") REFERENCES "public"."fabric_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "fk_finish_profile_id" FOREIGN KEY ("finish_profile_id") REFERENCES "public"."finish_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "fk_made_to_order_fabric_id" FOREIGN KEY ("made_to_order_fabric_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "fk_made_to_order_profile_id" FOREIGN KEY ("made_to_order_profile_id") REFERENCES "public"."made_to_order_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "fk_main_product_id" FOREIGN KEY ("main_product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "fk_size_profile_id" FOREIGN KEY ("size_profile_id") REFERENCES "public"."size_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "fk_sku_group_id" FOREIGN KEY ("sku_group_id") REFERENCES "public"."sku_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "fk_special_status_id" FOREIGN KEY ("special_status_id") REFERENCES "public"."special_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "fk_sub_category_id" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "fk_volume_discount_profile_id" FOREIGN KEY ("volume_discount_profile_id") REFERENCES "public"."volume_discount_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_profile_item" ADD CONSTRAINT "fk_product_id" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_profile_item" ADD CONSTRAINT "fk_profile_id" FOREIGN KEY ("profile_id") REFERENCES "public"."fabric_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_restock_request" ADD CONSTRAINT "fk_made_to_order_product_id" FOREIGN KEY ("made_to_order_product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_restock_request" ADD CONSTRAINT "fk_product_id" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_restock_request" ADD CONSTRAINT "fk_size_option_id" FOREIGN KEY ("size_option_id") REFERENCES "public"."size_profile_option"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_restock_request" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_finished" ADD CONSTRAINT "fk_product_id" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image_gallery_seo" ADD CONSTRAINT "fk_product_id" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_size_profile" ADD CONSTRAINT "fk_product_id" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_size_profile" ADD CONSTRAINT "fk_size_profile_option_id" FOREIGN KEY ("size_profile_option_id") REFERENCES "public"."size_profile_option"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volume_discount_profile_item" ADD CONSTRAINT "fk_profile_id" FOREIGN KEY ("profile_id") REFERENCES "public"."volume_discount_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_zoho_relation" ADD CONSTRAINT "fk_product_id" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "fk_product_id" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustment_item" ADD CONSTRAINT "fk_inventory_adjustment_id" FOREIGN KEY ("inventory_adjustment_id") REFERENCES "public"."inventory_adjustment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustment_item" ADD CONSTRAINT "fk_product_id" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_template" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "element_template" ADD CONSTRAINT "fk_workflow_id" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subprocess_element_template" ADD CONSTRAINT "fk_element_id" FOREIGN KEY ("element_id") REFERENCES "public"."element_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subprocess_element_template" ADD CONSTRAINT "fk_step_id" FOREIGN KEY ("step_id") REFERENCES "public"."step_element_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subprocess_element_template" ADD CONSTRAINT "fk_workflow_id" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_element_template" ADD CONSTRAINT "fk_element_id" FOREIGN KEY ("element_id") REFERENCES "public"."element_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_element_template" ADD CONSTRAINT "fk_workflow_id" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow" ADD CONSTRAINT "fk_product_id" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow" ADD CONSTRAINT "fk_workflow_template_id" FOREIGN KEY ("workflow_template_id") REFERENCES "public"."workflow_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "element_feedback" ADD CONSTRAINT "fk_element_id" FOREIGN KEY ("element_id") REFERENCES "public"."element"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_element" ADD CONSTRAINT "fk_element_id" FOREIGN KEY ("element_id") REFERENCES "public"."element"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_element" ADD CONSTRAINT "fk_workflow_id" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subprocess_element" ADD CONSTRAINT "fk_element_id" FOREIGN KEY ("element_id") REFERENCES "public"."element"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subprocess_element" ADD CONSTRAINT "fk_step_id" FOREIGN KEY ("step_id") REFERENCES "public"."step_element"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subprocess_element" ADD CONSTRAINT "fk_workflow_id" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_custom_order_mapping" ADD CONSTRAINT "fk_custom_product_id" FOREIGN KEY ("custom_product_id") REFERENCES "public"."custom_product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_custom_order_mapping" ADD CONSTRAINT "fk_product_id" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_custom_order_mapping" ADD CONSTRAINT "fk_workflow_id" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authentication_log" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_notification_history" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_notification_history" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_program_config" ADD CONSTRAINT "fk_loyalty_program_config_customer" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_program_config_audit_log" ADD CONSTRAINT "fk_loyalty_program_config_customer" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artisan" ADD CONSTRAINT "fk_artisan_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artisan" ADD CONSTRAINT "fk_master_artisan_id" FOREIGN KEY ("master_artisan_id") REFERENCES "public"."artisan"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artisan_skill_mapping" ADD CONSTRAINT "fk_artisan_skill_mapping_artisan" FOREIGN KEY ("artisan_id") REFERENCES "public"."artisan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artisan_skill_mapping" ADD CONSTRAINT "fk_artisan_skill_mapping_skill" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_item" ADD CONSTRAINT "fk_catalog_id" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalog"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "workflow_artisan_mapping" ADD CONSTRAINT "fk_workflow_artisan_mapping_workflow" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_artisan_mapping" ADD CONSTRAINT "fk_workflow_artisan_mapping_artisan" FOREIGN KEY ("artisan_id") REFERENCES "public"."artisan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_element_artisan_mapping" ADD CONSTRAINT "fk_step_element_artisan_mapping_step_element" FOREIGN KEY ("step_element_id") REFERENCES "public"."step_element"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_element_artisan_mapping" ADD CONSTRAINT "fk_step_element_artisan_mapping_artisan" FOREIGN KEY ("artisan_id") REFERENCES "public"."artisan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subprocess_element_artisan_mapping" ADD CONSTRAINT "fk_subprocess_element_artisan_mapping_subprocess" FOREIGN KEY ("subprocess_element_id") REFERENCES "public"."subprocess_element"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subprocess_element_artisan_mapping" ADD CONSTRAINT "fk_subprocess_element_artisan_mapping_artisan" FOREIGN KEY ("artisan_id") REFERENCES "public"."artisan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_item_media" ADD CONSTRAINT "fk_catalog_item_id" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_item"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "catalog_pdf" ADD CONSTRAINT "fk_catalog_pdf_request_artisan_id" FOREIGN KEY ("artisan_id") REFERENCES "public"."artisan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_pdf" ADD CONSTRAINT "fk_catalog_pdf_request_requested_by_id" FOREIGN KEY ("requested_by_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_fulfillment" ADD CONSTRAINT "fk_order_item_fulfillment_order_id" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_fulfillment" ADD CONSTRAINT "fk_order_item_fulfillment_fulfillment_id" FOREIGN KEY ("order_fulfillment_id") REFERENCES "public"."order_fulfillment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_fulfillment" ADD CONSTRAINT "fk_order_item_fulfillment_order_item_id" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_ready" ADD CONSTRAINT "fk_order_ready_order_id" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_ready" ADD CONSTRAINT "fk_order_item_ready_order_item_id" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_ready" ADD CONSTRAINT "fk_order_item_ready_ready_id" FOREIGN KEY ("order_ready_id") REFERENCES "public"."order_ready"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order_fulfillment" ADD CONSTRAINT "fk_custom_order_fulfillment_custom_order_id" FOREIGN KEY ("custom_order_id") REFERENCES "public"."custom_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order_fulfillment" ADD CONSTRAINT "fk_custom_order_fulfillment_shipment_id" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order_item_fulfillment" ADD CONSTRAINT "fk_custom_order_item_fulfillment_custom_order_id" FOREIGN KEY ("custom_order_id") REFERENCES "public"."custom_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order_item_fulfillment" ADD CONSTRAINT "fk_custom_order_item_fulfillment_fulfillment_id" FOREIGN KEY ("custom_order_fulfillment_id") REFERENCES "public"."custom_order_fulfillment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order_item_fulfillment" ADD CONSTRAINT "fk_custom_order_item_fulfillment_custom_order_item_id" FOREIGN KEY ("custom_order_item_id") REFERENCES "public"."custom_order_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order_ready" ADD CONSTRAINT "fk_custom_order_ready_custom_order_id" FOREIGN KEY ("custom_order_id") REFERENCES "public"."custom_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_transaction" ADD CONSTRAINT "fk_loom_order_id" FOREIGN KEY ("loom_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_factor" ADD CONSTRAINT "fk_impact_factor_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."loom_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_factor" ADD CONSTRAINT "fk_impact_factor_workflow" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_custom_order_adjustment_custom_order_id" ON "custom_order_adjustment" USING btree ("custom_order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_order_review_scheduled_email_order_id" ON "order_review_scheduled_email" USING btree ("order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_story_content_section_story_content_id" ON "story_content_section" USING btree ("story_content_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_sub_category_badge_profile_id" ON "sub_category" USING btree ("badge_profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_sub_category_custom_size_profile_id" ON "sub_category" USING btree ("custom_size_profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_sub_category_fabric_profile_id" ON "sub_category" USING btree ("fabric_profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_sub_category_finish_profile_id" ON "sub_category" USING btree ("finish_profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_sub_category_made_to_order_profile_id" ON "sub_category" USING btree ("made_to_order_profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_sub_category_segment_id" ON "sub_category" USING btree ("segment_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_sub_category_volume_discount_profile_id" ON "sub_category" USING btree ("volume_discount_profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "trgm_index_sub_category" ON "sub_category" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "ix_cart_item_fabric_product_id" ON "cart_item" USING btree ("fabric_product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_cart_item_finished_product_id" ON "cart_item" USING btree ("finished_product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_cart_item_selected_fabric_id" ON "cart_item" USING btree ("selected_fabric_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_cart_item_selected_size_option_id" ON "cart_item" USING btree ("selected_size_option_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_cart_item_tenant_id" ON "cart_item" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_inventory_adjustment_reason_id" ON "inventory_adjustment" USING btree ("reason_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_inventory_adjustment_user_id" ON "inventory_adjustment" USING btree ("user_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_inventory_adjustment_warehouse_id" ON "inventory_adjustment" USING btree ("warehouse_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_element_workflow_id" ON "element" USING btree ("workflow_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_artisan_payment_record_artisan_id" ON "artisan_payment_record" USING btree ("artisan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_artisan_payment_record_workflow_id" ON "artisan_payment_record" USING btree ("workflow_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_order_fulfillment_order_id" ON "order_fulfillment" USING btree ("order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_order_fulfillment_shipment_id" ON "order_fulfillment" USING btree ("shipment_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_custom_order_item_ready_custom_order_item_id" ON "custom_order_item_ready" USING btree ("custom_order_item_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_custom_order_item_ready_custom_order_ready_id" ON "custom_order_item_ready" USING btree ("custom_order_ready_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_address_tenant_id" ON "address" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_blog_content_author_id" ON "blog_content" USING btree ("author_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_blog_content_blog_content_category_id" ON "blog_content" USING btree ("blog_content_category_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_blog_content_section_blog_content_id" ON "blog_content_section" USING btree ("blog_content_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_custom_order_tenant_id" ON "custom_order" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_badge_profile_item_profile_id" ON "badge_profile_item" USING btree ("profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_blog_content_category_blog_content_type_id" ON "blog_content_category" USING btree ("blog_content_type_id" int8_ops);--> statement-breakpoint
CREATE INDEX "trgm_index_category" ON "category" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "ix_custom_size_profile_item_profile_id" ON "custom_size_profile_item" USING btree ("profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_finish_profile_item_profile_id" ON "finish_profile_item" USING btree ("profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_custom_order_item_custom_order_id" ON "custom_order_item" USING btree ("custom_order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "trgm_index_material" ON "material" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "ix_orders_tenant_id" ON "orders" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_order_item_order_id" ON "order_item" USING btree ("order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_razorpay_transaction_loom_order_id" ON "razorpay_transaction" USING btree ("loom_order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_segment_category_id" ON "segment" USING btree ("category_id" int8_ops);--> statement-breakpoint
CREATE INDEX "trgm_index_segment" ON "segment" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "ix_size_profile_option_profile_id" ON "size_profile_option" USING btree ("profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_size_profile_guide_option_id" ON "size_profile_guide" USING btree ("option_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_size_profile_guide_profile_id" ON "size_profile_guide" USING btree ("profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_faq_blog_content_id" ON "faq" USING btree ("blog_content_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_faq_story_content_id" ON "faq" USING btree ("story_content_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_story_content_author_id" ON "story_content" USING btree ("author_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_story_content_story_content_category_id" ON "story_content" USING btree ("story_content_category_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_faq_question_faq_id" ON "faq_question" USING btree ("faq_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_story_product_mapping_story_content_id" ON "story_product_mapping" USING btree ("story_content_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_user_role_user_id" ON "user_role" USING btree ("user_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_verification_token_tenant_id" ON "verification_token" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_fabric_product_id" ON "product_fabric" USING btree ("product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_badge_profile_id" ON "product" USING btree ("badge_profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_custom_size_profile_id" ON "product" USING btree ("custom_size_profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_fabric_profile_id" ON "product" USING btree ("fabric_profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_finish_profile_id" ON "product" USING btree ("finish_profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_made_to_order_fabric_id" ON "product" USING btree ("made_to_order_fabric_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_made_to_order_profile_id" ON "product" USING btree ("made_to_order_profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_main_product_id" ON "product" USING btree ("main_product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_size_profile_id" ON "product" USING btree ("size_profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_sku_group_id" ON "product" USING btree ("sku_group_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_special_status_id" ON "product" USING btree ("special_status_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_sub_category_id" ON "product" USING btree ("sub_category_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_volume_discount_profile_id" ON "product" USING btree ("volume_discount_profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_fabric_profile_item_product_id" ON "fabric_profile_item" USING btree ("product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_fabric_profile_item_profile_id" ON "fabric_profile_item" USING btree ("profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_inventory_restock_request_made_to_order_product_id" ON "inventory_restock_request" USING btree ("made_to_order_product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_inventory_restock_request_product_id" ON "inventory_restock_request" USING btree ("product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_inventory_restock_request_size_option_id" ON "inventory_restock_request" USING btree ("size_option_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_inventory_restock_request_tenant_id" ON "inventory_restock_request" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_finished_product_id" ON "product_finished" USING btree ("product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_size_profile_size_profile_option_id" ON "product_size_profile" USING btree ("size_profile_option_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_volume_discount_profile_item_profile_id" ON "volume_discount_profile_item" USING btree ("profile_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_product_zoho_relation_product_id" ON "product_zoho_relation" USING btree ("product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_review_product_id" ON "review" USING btree ("product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_inventory_adjustment_item_inventory_adjustment_id" ON "inventory_adjustment_item" USING btree ("inventory_adjustment_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_inventory_adjustment_item_product_id" ON "inventory_adjustment_item" USING btree ("product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_workflow_template_tenant_id" ON "workflow_template" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_element_template_workflow_id" ON "element_template" USING btree ("workflow_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_subprocess_element_template_element_id" ON "subprocess_element_template" USING btree ("element_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_subprocess_element_template_step_id" ON "subprocess_element_template" USING btree ("step_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_subprocess_element_template_workflow_id" ON "subprocess_element_template" USING btree ("workflow_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_step_element_template_element_id" ON "step_element_template" USING btree ("element_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_step_element_template_workflow_id" ON "step_element_template" USING btree ("workflow_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_workflow_product_id" ON "workflow" USING btree ("product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_workflow_tenant_id" ON "workflow" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_workflow_workflow_template_id" ON "workflow" USING btree ("workflow_template_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_step_element_element_id" ON "step_element" USING btree ("element_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_step_element_workflow_id" ON "step_element" USING btree ("workflow_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_subprocess_element_element_id" ON "subprocess_element" USING btree ("element_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_subprocess_element_step_id" ON "subprocess_element" USING btree ("step_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_subprocess_element_workflow_id" ON "subprocess_element" USING btree ("workflow_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_workflow_custom_order_mapping_custom_product_id" ON "workflow_custom_order_mapping" USING btree ("custom_product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_workflow_custom_order_mapping_product_id" ON "workflow_custom_order_mapping" USING btree ("product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_workflow_custom_order_mapping_workflow_id" ON "workflow_custom_order_mapping" USING btree ("workflow_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_authentication_log_user_id" ON "authentication_log" USING btree ("user_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_whatsapp_notification_history_tenant_id" ON "whatsapp_notification_history" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_email_notification_history_tenant_id" ON "email_notification_history" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_loyalty_program_config_audit_log_customer_id" ON "loyalty_program_config_audit_log" USING btree ("customer_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_artisan_master_artisan_id" ON "artisan" USING btree ("master_artisan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_artisan_skill_mapping_skill_id" ON "artisan_skill_mapping" USING btree ("skill_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_catalog_item_catalog_id" ON "catalog_item" USING btree ("catalog_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_workflow_artisan_mapping_artisan_id" ON "workflow_artisan_mapping" USING btree ("artisan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_step_element_artisan_mapping_artisan_id" ON "step_element_artisan_mapping" USING btree ("artisan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_subprocess_element_artisan_mapping_artisan_id" ON "subprocess_element_artisan_mapping" USING btree ("artisan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_catalog_item_media_catalog_item_id" ON "catalog_item_media" USING btree ("catalog_item_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_catalog_pdf_artisan_id" ON "catalog_pdf" USING btree ("artisan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_catalog_pdf_requested_by_id" ON "catalog_pdf" USING btree ("requested_by_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_order_item_fulfillment_order_id" ON "order_item_fulfillment" USING btree ("order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_order_item_fulfillment_order_item_id" ON "order_item_fulfillment" USING btree ("order_item_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_order_ready_order_id" ON "order_ready" USING btree ("order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_order_item_ready_order_item_id" ON "order_item_ready" USING btree ("order_item_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_order_item_ready_order_ready_id" ON "order_item_ready" USING btree ("order_ready_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_custom_order_fulfillment_custom_order_id" ON "custom_order_fulfillment" USING btree ("custom_order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_custom_order_fulfillment_shipment_id" ON "custom_order_fulfillment" USING btree ("shipment_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_custom_order_item_fulfillment_custom_order_id" ON "custom_order_item_fulfillment" USING btree ("custom_order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_custom_order_item_fulfillment_custom_order_item_id" ON "custom_order_item_fulfillment" USING btree ("custom_order_item_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_custom_order_ready_custom_order_id" ON "custom_order_ready" USING btree ("custom_order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_stripe_transaction_loom_order_id" ON "stripe_transaction" USING btree ("loom_order_id" int8_ops);--> statement-breakpoint
CREATE INDEX "ix_impact_factor_tenant_id" ON "impact_factor" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
-- Corrected 2026-08-12: introspect assigned enum_ops to all three columns, but
-- enqueued_at is bigint and enum_ops does not accept it. Dropping the explicit
-- operator classes lets Postgres choose the default per column type.
CREATE INDEX "idx_image_optimization_record_claim" ON "image_optimization_record" USING btree ("state","priority","enqueued_at");
*/