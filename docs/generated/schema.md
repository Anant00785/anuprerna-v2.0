# Database schema

> **Generated file — do not edit.** Produced by `scripts/gen-docs/index.mjs` from the code
> itself. Run `pnpm docs:gen` to refresh; CI runs `pnpm docs:check` and fails if this file is
> stale. Introspected from the production database — see `docs/KNOWN-GAPS.md` for the introspect defects that must be re-applied after every regenerate.

**117 tables, 45 enum types.**

## Tables

- `address`
- `artisan`
- `artisan_incentive_config`
- `artisan_payment_record`
- `artisan_skill_mapping`
- `authentication_log`
- `badge_profile`
- `badge_profile_item`
- `blog_content`
- `blog_content_category`
- `blog_content_section`
- `blog_content_type`
- `blog_vector`
- `cart_item`
- `catalog`
- `catalog_item`
- `catalog_item_media`
- `catalog_pdf`
- `category`
- `color`
- `cron_job_log`
- `custom_impact_factor`
- `custom_order`
- `custom_order_adjustment`
- `custom_order_fulfillment`
- `custom_order_item`
- `custom_order_item_fulfillment`
- `custom_order_item_ready`
- `custom_order_ready`
- `custom_product`
- `custom_size_profile`
- `custom_size_profile_item`
- `customer`
- `discount`
- `element`
- `element_feedback`
- `element_template`
- `email_notification_history`
- `fabric_profile`
- `fabric_profile_item`
- `faq`
- `faq_question`
- `filter_page_config`
- `finish_profile`
- `finish_profile_item`
- `forex`
- `forex_exchange_rate`
- `image_optimization_control`
- `image_optimization_record`
- `image_optimization_tool`
- `image_optimization_tool_setting`
- `image_optimization_worker_session`
- `impact_factor`
- `inventory_adjustment`
- `inventory_adjustment_item`
- `inventory_adjustment_reason`
- `inventory_restock_request`
- `log`
- `loom_tenant`
- `loyalty_program_config`
- `loyalty_program_config_audit_log`
- `made_to_order_profile`
- `material`
- `order_fulfillment`
- `order_item`
- `order_item_fulfillment`
- `order_item_ready`
- `order_ready`
- `order_review_scheduled_email`
- `orders`
- `pattern`
- `product`
- `product_fabric`
- `product_finished`
- `product_image_gallery_seo`
- `product_size_profile`
- `product_vector`
- `product_zoho_relation`
- `purchase_order_feedback`
- `razorpay_transaction`
- `review`
- `segment`
- `settings`
- `shipment`
- `size_profile`
- `size_profile_guide`
- `size_profile_option`
- `skill`
- `sku_group`
- `special_status`
- `step_element`
- `step_element_artisan_mapping`
- `step_element_template`
- `story_content`
- `story_content_category`
- `story_content_section`
- `story_product_mapping`
- `story_vector`
- `stripe_transaction`
- `sub_category`
- `sub_category_audit`
- `subprocess_element`
- `subprocess_element_artisan_mapping`
- `subprocess_element_template`
- `super_user`
- `tag`
- `temp_product_meta`
- `user_role`
- `verification_token`
- `volume_discount_profile`
- `volume_discount_profile_item`
- `warehouse`
- `whatsapp_notification_history`
- `workflow`
- `workflow_artisan_mapping`
- `workflow_custom_order_mapping`
- `workflow_template`

## Enums

| Type | Values |
|---|---|
| `address_type_enum` | `SHIPPING`, `BILLING` |
| `artisan_role_enum` | `MASTER`, `WORKER` |
| `auth_action_enum` | `LOGIN`, `LOGOUT` |
| `auth_provider_enum` | `UNKNOWN`, `BASIC`, `GOOGLE`, `FACEBOOK` |
| `catalog_item_media_type_enum` | `IMAGE`, `VIDEO`, `UNKNOWN` |
| `discount_method_enum` | `AUTOMATIC`, `MANUAL` |
| `discount_type_enum` | `FREE_SHIPPING`, `PERCENTAGE_OFF` |
| `element_feedback_status_enum` | `PENDING`, `APPROVED`, `REJECTED` |
| `element_feedback_uploader_enum` | `ADMIN`, `ARTISAN` |
| `element_status_enum` | `PENDING`, `IN_PROGRESS`, `HALTED`, `COMPLETED` |
| `element_type_enum` | `STEP`, `SUBPROCESS` |
| `email_notification_entity_type_enum` | `ORDER`, `CUSTOM_ORDER`, `WORKFLOW` |
| `email_notification_status_enum` | `PENDING_SEND`, `POST_SUCCESS`, `POST_FAILED`, `POST_ERROR` |
| `email_notification_trigger_type_enum` | `ORDER_CONFIRMATION`, `ORDER_FULFILLMENT_DISPATCH`, `ORDER_PAYMENT_FAILED`, `ORDER_CANCELLED`, `ORDER_REVIEW_REQUEST`, `CUSTOM_ORDER_CONFIRMATION`, `CUSTOM_ORDER_DISPATCH`, `PRE_ORDER_CONFIRMATION`, `PRE_ORDER_READY_TO_SHIP`, `CONTACT_US`, `CUSTOMER_BTS_UPDATE`, `INTERNAL_BTS_UPDATE`, `WORKFLOW_STATUS_UPDATE` |
| `gender_enum` | `MALE`, `FEMALE`, `OTHER`, `UNDEFINED` |
| `image_format_enum` | `JPEG`, `PNG`, `WEBP`, `GIF`, `SVG`, `TIFF`, `UNKNOWN` |
| `image_optimization_priority_enum` | `INCOMING`, `BACKLOG` |
| `image_optimization_run_state_enum` | `RUNNING`, `PAUSED` |
| `image_optimization_state_enum` | `DISCOVERED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`, `FAILED`, `UNSUPPORTED` |
| `image_optimization_worker_stop_reason_enum` | `MANUAL`, `EXPIRED`, `SHUTDOWN` |
| `image_position_enum` | `LT`, `RT`, `CT` |
| `location_type_enum` | `DOMESTIC`, `INTERNATIONAL` |
| `log_enum` | `EMERGENCY`, `ALERT`, `CRITICAL`, `ERROR`, `WARNING`, `NOTICE`, `INFO`, `DEBUG` |
| `loyalty_config_audit_log_type` | `ONBOARDING`, `RENEWAL_AUTO`, `RENEWAL_MANUAL`, `ADJUSTMENT` |
| `order_status_enum` | `INITIATED`, `PROCESSING`, `CANCELLED`, `IN_TRANSIT`, `PARTIALLY_DISPATCHED`, `DELIVERED`, `FAILED`, `DISPATCHED` |
| `order_type_enum` | `IN_STOCK`, `MADE_TO_ORDER`, `PRE_ORDER` |
| `payment_mode_enum` | `RAZORPAY`, `STRIPE`, `BANK`, `COD` |
| `payment_status_enum` | `PENDING`, `PREPAID`, `PAID`, `FAILED` |
| `restock_request_status` | `PENDING`, `PARTIALLY_FULFUILLED`, `FULFILLED`, `CONVERTED` |
| `review_status_enum` | `PENDING`, `APPROVED`, `REMOVED` |
| `scheduled_email_status` | `PENDING`, `COMPLETED` |
| `settings_attribute_enum` | `CASH_ON_DELIVERY`, `SWATCH_PRICE_PERCENTAGE`, `FABRIC_SITE_NOTIFICATION`, `CRAFT_SITE_NOTIFICATION`, `IMPACT_ASSUMPTIONS` |
| `settings_attribute_type_enum` | `NUMBER`, `BOOLEAN`, `TEXT`, `OBJECT` |
| `story_content_type_enum` | `ARTISTS`, `CRAFTS`, `CLUSTERS`, `COLLABORATIONS` |
| `transaction_status_enum` | `CREATED`, `PAID`, `FAILED` |
| `unit_enum` | `UNIT`, `METER` |
| `usage_type_enum` | `SINGLE`, `MULTIPLE` |
| `user_role_enum` | `ROLE_GOD_MODE`, `ROLE_SUPER_USER`, `ROLE_ADMIN`, `ROLE_CUSTOMER`, `ROLE_ARTISAN` |
| `whatsapp_notification_entity_type_enum` | `ORDER`, `ORDER_FULFILLMENT`, `CUSTOM_ORDER`, `CUSTOM_ORDER_FULFILLMENT` |
| `whatsapp_notification_status_enum` | `PENDING_SEND`, `POST_SUCCESS`, `POST_FAILED`, `POST_ERROR`, `SENT`, `DELIVERED`, `READ`, `FAILED_DELIVERY` |
| `whatsapp_notification_tenant_type_enum` | `CUSTOMER`, `ARTISAN` |
| `whatsapp_notification_trigger_type_enum` | `ORDER_CONFIRMATION`, `ORDER_DISPATCH`, `ORDER_FULFILLMENT_DISPATCH`, `CUSTOM_ORDER_FULFILLMENT_DISPATCH`, `ORDER_CANCELLED`, `CUSTOMER_BTS_UPDATE`, `CUSTOM_ORDER_CONFIRMATION`, `PRE_ORDER_READY_TO_SHIP` |
| `whatsapp_opt_in_status_enum` | `OPTED_IN`, `OPTED_OUT`, `DISMISSED` |
| `workflow_status_enum` | `CREATED`, `INITIATED`, `COMPLETED`, `HALTED` |
| `workflow_type_enum` | `ORDER`, `CUSTOM_ORDER` |
