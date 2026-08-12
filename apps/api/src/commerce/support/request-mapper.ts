// @ts-nocheck
/**
 * migrated/support/request-mapper.ts
 *
 * TypeScript port of Java's RequestMapper.java.
 * Contains all API endpoint URL constants.
 * Used as a single source of truth for route strings.
 *
 * Note: Only a representative subset is listed here — the full list is in
 * the Java RequestMapper.java. Add more constants as additional modules are integrated.
 */

// ─── Material ──────────────────────────────────────────────────────────────
export const GET_MATERIAL_LIST = "/get/material-list";
export const ADD_MATERIAL = "/add/material";
export const UPDATE_MATERIAL = "/update/material";
export const DELETE_MATERIAL = "/delete/material/:materialId";
export const GET_TABLE_EXPLORER_DATA_MATERIAL = "/get/table-explorer/data/material";
export const GET_TABLE_EXPLORER_DATA_MATERIAL_BY_ID = "/get/table-explorer/data/material/:id";

// ─── Color ─────────────────────────────────────────────────────────────────
export const GET_COLOR_LIST = "/get/color-list";
export const ADD_COLOR = "/add/color";
export const UPDATE_COLOR = "/update/color";
export const DELETE_COLOR = "/delete/color/:colorId";
export const GET_TABLE_EXPLORER_DATA_COLOR = "/get/table-explorer/data/color";
export const GET_TABLE_EXPLORER_DATA_COLOR_BY_ID = "/get/table-explorer/data/color/:id";

// ─── Pattern ───────────────────────────────────────────────────────────────
export const GET_PATTERN_LIST = "/get/pattern-list";
export const ADD_PATTERN = "/add/pattern";
export const UPDATE_PATTERN = "/update/pattern";
export const DELETE_PATTERN = "/delete/pattern/:patternId";
export const GET_TABLE_EXPLORER_DATA_PATTERN = "/get/table-explorer/data/pattern";
export const GET_TABLE_EXPLORER_DATA_PATTERN_BY_ID = "/get/table-explorer/data/pattern/:id";

// ─── Settings ──────────────────────────────────────────────────────────────
export const GET_SETTINGS_LIST = "/get/settings-list";
export const GET_SETTINGS = "/get/settings/:settingId";
export const UPDATE_SETTINGS = "/update/settings";
export const GET_TABLE_EXPLORER_DATA_SETTINGS = "/get/table-explorer/data/settings";
export const GET_TABLE_EXPLORER_DATA_SETTINGS_BY_ID = "/get/table-explorer/data/settings/:id";

// ─── Image ─────────────────────────────────────────────────────────────────
export const UPLOAD_IMAGE = "/upload/image";
export const DELETE_IMAGE = "/delete/image";

// ─── Profile ───────────────────────────────────────────────────────────────
export const GET_SUPER_USER_PROFILE = "/get/super-user/profile";
export const GET_TENANT_PROFILE = "/get/tenant/profile/:uId";
export const UPDATE_CUSTOMER_PROFILE = "/update/customer/profile";
export const GET_CUSTOMER_PROFILE = "/get/customer/profile";

// ─── Compatibility ─────────────────────────────────────────────────────────
export const PRODUCT_COMPATIBILITY_URL = "/redirect/product";
export const STORY_COMPATIBILITY_URL = "/redirect/story";
export const BLOG_COMPATIBILITY_URL = "/redirect/blog";

// ─── Feedback ──────────────────────────────────────────────────────────────
export const ADD_ORDER_FEEDBACK = "/add/order/feedback";
export const UPDATE_ORDER_FEEDBACK_Q1 = "/update/order/feedback/q1";
export const UPDATE_ORDER_FEEDBACK_Q2 = "/update/order/feedback/q2";
export const UPDATE_ORDER_FEEDBACK_Q3 = "/update/order/feedback/q3";
export const GET_ORDER_FEEDBACK = "/get/order/feedback/:orderId";
export const GET_ORDER_FEEDBACK_BY_ID = "/get/super-user/order/feedback/:feedbackId";
export const GET_ORDER_FEEDBACK_LIST = "/get/order/feedback-list";
export const GET_TABLE_EXPLORER_DATA_PURCHASE_ORDER_FEEDBACK = "/get/table-explorer/data/purchase-order-feedback";
export const GET_TABLE_EXPLORER_DATA_PURCHASE_ORDER_FEEDBACK_BY_ID = "/get/table-explorer/data/purchase-order-feedback/:id";
// @ts-nocheck
// @ts-nocheck
