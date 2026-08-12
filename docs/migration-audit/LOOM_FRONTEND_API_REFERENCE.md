# LOOM Backend API Reference for Frontend Team

*This document is generated strictly from the Java LOOM backend source code (the primary source of truth).*

Total Discovered APIs: **686**

---

## ADDRESS MODULE (6 APIs)

### `GET /get/address-list`
- **Method**: `GET`
- **Path**: `/get/address-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/address/controller/AddressController.java:227`

---
### `POST /add/address`
- **Method**: `POST`
- **Path**: `/add/address`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Address`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/address/controller/AddressController.java:266`

---
### `PATCH /update/address`
- **Method**: `PATCH`
- **Path**: `/update/address`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Address`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/address/controller/AddressController.java:308`

---
### `DELETE /delete/address/{addressId}`
- **Method**: `DELETE`
- **Path**: `/delete/address/{addressId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `addressId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/address/controller/AddressController.java:352`

---
### `GET /get/table-explorer/data/address`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/address`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/address/controller/AddressController.java:392`

---
### `GET /get/table-explorer/data/address/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/address/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/address/controller/AddressController.java:426`

---

## ADS CONVERSION MODULE (3 APIs)

### `GET /get/super-user/ads-conversion/summary`
- **Method**: `GET`
- **Path**: `/get/super-user/ads-conversion/summary`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `from: long (query), to: long (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/ads_conversion/controller/AdsConversionController.java:79`

---
### `GET /get/super-user/ads-conversion/orders`
- **Method**: `GET`
- **Path**: `/get/super-user/ads-conversion/orders`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `from: long (query), to: long (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/ads_conversion/controller/AdsConversionController.java:100`

---
### `GET /get/super-user/ads-conversion/abandoned-carts`
- **Method**: `GET`
- **Path**: `/get/super-user/ads-conversion/abandoned-carts`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `from: long (query), to: long (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/ads_conversion/controller/AdsConversionController.java:121`

---

## AI MODULE (7 APIs)

### `GET /get/ai-embedding-stats`
- **Method**: `GET`
- **Path**: `/get/ai-embedding-stats`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/ai/controller/AIEmbeddingStatsController.java:152`

---
### `GET /get/table-explorer/data/blog-vector/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/blog-vector/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/ai/controller/AIEmbeddingStatsController.java:177`

---
### `GET /get/table-explorer/data/blog-vector`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/blog-vector`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/ai/controller/AIEmbeddingStatsController.java:206`

---
### `GET /get/table-explorer/data/product-vector/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/product-vector/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/ai/controller/AIEmbeddingStatsController.java:235`

---
### `GET /get/table-explorer/data/product-vector`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/product-vector`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/ai/controller/AIEmbeddingStatsController.java:264`

---
### `GET /get/table-explorer/data/story-vector/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/story-vector/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/ai/controller/AIEmbeddingStatsController.java:293`

---
### `GET /get/table-explorer/data/story-vector`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/story-vector`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/ai/controller/AIEmbeddingStatsController.java:322`

---

## ALFRED MODULE (7 APIs)

### `GET /get/cron-logs`
- **Method**: `GET`
- **Path**: `/get/cron-logs`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/alfred/controller/CronJobLogController.java:164`

---
### `GET /get/table-explorer/data/cron-job-log`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/cron-job-log`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/alfred/controller/CronJobLogController.java:192`

---
### `GET /get/table-explorer/data/authentication-log/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/authentication-log/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/alfred/controller/CronJobLogController.java:227`

---
### `GET /get/table-explorer/data/authentication-log`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/authentication-log`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/alfred/controller/CronJobLogController.java:259`

---
### `GET /get/table-explorer/data/log/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/log/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/alfred/controller/CronJobLogController.java:294`

---
### `GET /get/table-explorer/data/log`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/log`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/alfred/controller/CronJobLogController.java:326`

---
### `GET /get/table-explorer/data/cron-job-log/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/cron-job-log/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/alfred/controller/CronJobLogController.java:360`

---

## ARTISAN MODULE (12 APIs)

### `GET /get/artisan/profile`
- **Method**: `GET`
- **Path**: `/get/artisan/profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/artisan/controller/ArtisanController.java:158`

---
### `GET /get/artisan/{artisanId}`
- **Method**: `GET`
- **Path**: `/get/artisan/{artisanId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `artisanId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisan/controller/ArtisanController.java:179`

---
### `GET /get/artisans`
- **Method**: `GET`
- **Path**: `/get/artisans`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `=: (required (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisan/controller/ArtisanController.java:204`

---
### `GET /get/artisan/{masterId}/workers`
- **Method**: `GET`
- **Path**: `/get/artisan/{masterId}/workers`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `param: ("masterId" (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisan/controller/ArtisanController.java:228`

---
### `GET /get/workers`
- **Method**: `GET`
- **Path**: `/get/workers`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisan/controller/ArtisanController.java:252`

---
### `PATCH /update/artisan/profile`
- **Method**: `PATCH`
- **Path**: `/update/artisan/profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Artisan`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/artisan/controller/ArtisanController.java:322`

---
### `POST /add/artisan`
- **Method**: `POST`
- **Path**: `/add/artisan`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Artisan`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/artisan/controller/ArtisanController.java:362`

---
### `PATCH /update/artisan`
- **Method**: `PATCH`
- **Path**: `/update/artisan`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Artisan`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisan/controller/ArtisanController.java:414`

---
### `DELETE /delete/artisan/{artisanId}`
- **Method**: `DELETE`
- **Path**: `/delete/artisan/{artisanId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `artisanId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisan/controller/ArtisanController.java:441`

---
### `GET /get/table-explorer/data/artisan`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/artisan`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/artisan/controller/ArtisanController.java:465`

---
### `GET /get/table-explorer/data/artisan/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/artisan/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisan/controller/ArtisanController.java:493`

---
### `GET /get/table-explorer/data/artisan-skill-mapping`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/artisan-skill-mapping`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/artisan/controller/ArtisanController.java:521`

---

## ARTISAN PAYMENT MODULE (11 APIs)

### `POST /add/artisan-payment/calculate/{workflowId}`
- **Method**: `POST`
- **Path**: `/add/artisan-payment/calculate/{workflowId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `workflowId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisanpayment/controller/ArtisanPaymentController.java:191`

---
### `GET /get/artisan-payment/artisan/{artisanId}`
- **Method**: `GET`
- **Path**: `/get/artisan-payment/artisan/{artisanId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `artisanId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisanpayment/controller/ArtisanPaymentController.java:226`

---
### `GET /get/artisan-payment/artisan/{artisanId}/summary`
- **Method**: `GET`
- **Path**: `/get/artisan-payment/artisan/{artisanId}/summary`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `artisanId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisanpayment/controller/ArtisanPaymentController.java:257`

---
### `GET /get/artisan-payment`
- **Method**: `GET`
- **Path**: `/get/artisan-payment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisanpayment/controller/ArtisanPaymentController.java:287`

---
### `GET /get/artisan-payment/summary`
- **Method**: `GET`
- **Path**: `/get/artisan-payment/summary`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisanpayment/controller/ArtisanPaymentController.java:327`

---
### `GET /get/artisan-payments`
- **Method**: `GET`
- **Path**: `/get/artisan-payments`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisanpayment/controller/ArtisanPaymentController.java:366`

---
### `PATCH /update/artisan-payment/approve`
- **Method**: `PATCH`
- **Path**: `/update/artisan-payment/approve`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ArtisanPaymentApprovalRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisanpayment/controller/ArtisanPaymentController.java:395`

---
### `PATCH /update/artisan-payment/record`
- **Method**: `PATCH`
- **Path**: `/update/artisan-payment/record`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ArtisanPaymentRecordUpdateRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisanpayment/controller/ArtisanPaymentController.java:437`

---
### `DELETE /delete/artisan-payment/record/{recordId}`
- **Method**: `DELETE`
- **Path**: `/delete/artisan-payment/record/{recordId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `recordId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisanpayment/controller/ArtisanPaymentController.java:472`

---
### `GET /get/artisan-incentive-config`
- **Method**: `GET`
- **Path**: `/get/artisan-incentive-config`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisanpayment/controller/ArtisanPaymentController.java:503`

---
### `PATCH /update/artisan-incentive-config`
- **Method**: `PATCH`
- **Path**: `/update/artisan-incentive-config`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ArtisanIncentiveConfig`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/artisanpayment/controller/ArtisanPaymentController.java:532`

---

## AUTH / NVERSE MODULE (17 APIs)

### `POST /fake/otp/send`
- **Method**: `POST`
- **Path**: `/fake/otp/send`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `@NotNull`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/FakeOTPController.java:143`

---
### `POST /fake/otp/verify`
- **Method**: `POST`
- **Path**: `/fake/otp/verify`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `@NotNull`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/FakeOTPController.java:183`

---
### `POST /fake/otp/resend`
- **Method**: `POST`
- **Path**: `/fake/otp/resend`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `@NotNull`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/FakeOTPController.java:228`

---
### `POST /authenticate/email`
- **Method**: `POST`
- **Path**: `/authenticate/email`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `@NotNull`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/NverseAuthenticationController.java:96`

---
### `POST /authenticate/social`
- **Method**: `POST`
- **Path**: `/authenticate/social`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `@NotNull`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/NverseAuthenticationController.java:128`

---
### `GET /get/authority/token`
- **Method**: `GET`
- **Path**: `/get/authority/token`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/NverseAuthenticationController.java:171`

---
### `POST /validate/provider`
- **Method**: `POST`
- **Path**: `/validate/provider`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `@NotNull`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/NverseAuthenticationController.java:192`

---
### `POST /send/verification/email`
- **Method**: `POST`
- **Path**: `/send/verification/email`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `EmailPayload`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/NVerseEmailVerificationController.java:115`

---
### `POST /send/password-reset/email`
- **Method**: `POST`
- **Path**: `/send/password-reset/email`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `EmailPayload`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/NVerseEmailVerificationController.java:137`

---
### `POST /confirm/verification/email`
- **Method**: `POST`
- **Path**: `/confirm/verification/email`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Token`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/NVerseEmailVerificationController.java:159`

---
### `POST /reset/password`
- **Method**: `POST`
- **Path**: `/reset/password`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `PasswordResetPayload`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/NVerseEmailVerificationController.java:182`

---
### `POST /verification/token`
- **Method**: `POST`
- **Path**: `/verification/token`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Token`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/NVerseEmailVerificationController.java:205`

---
### `GET /get/table-explorer/data/verification-token/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/verification-token/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/NVerseEmailVerificationController.java:227`

---
### `GET /get/table-explorer/data/verification-token`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/verification-token`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/NVerseEmailVerificationController.java:247`

---
### `POST /otp/send`
- **Method**: `POST`
- **Path**: `/otp/send`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `@NotNull`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/OTPController.java:161`

---
### `POST /otp/verify`
- **Method**: `POST`
- **Path**: `/otp/verify`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `@NotNull`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/OTPController.java:202`

---
### `POST /otp/resend`
- **Method**: `POST`
- **Path**: `/otp/resend`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `@NotNull`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/nverse/controller/OTPController.java:260`

---

## CART MODULE (9 APIs)

### `GET /get/table-explorer/data/cart-item`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/cart-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/cart/controller/CartController.java:154`

---
### `GET /get/table-explorer/data/cart-item/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/cart-item/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/cart/controller/CartController.java:185`

---
### `GET /get/cart-item/list`
- **Method**: `GET`
- **Path**: `/get/cart-item/list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/cart/controller/CartController.java:214`

---
### `GET /get/tenant/cart-item/list/{uid}`
- **Method**: `GET`
- **Path**: `/get/tenant/cart-item/list/{uid}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `uid: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/cart/controller/CartController.java:247`

---
### `GET /get/tenant/cart-item/list`
- **Method**: `GET`
- **Path**: `/get/tenant/cart-item/list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/cart/controller/CartController.java:277`

---
### `POST /add/cart-item`
- **Method**: `POST`
- **Path**: `/add/cart-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CartItem`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/cart/controller/CartController.java:306`

---
### `PATCH /update/cart-item`
- **Method**: `PATCH`
- **Path**: `/update/cart-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CartItem`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/cart/controller/CartController.java:345`

---
### `DELETE /delete/cart-item/{cartItemId}`
- **Method**: `DELETE`
- **Path**: `/delete/cart-item/{cartItemId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `cartItemId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/cart/controller/CartController.java:378`

---
### `DELETE /delete/all-cart-item`
- **Method**: `DELETE`
- **Path**: `/delete/all-cart-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/cart/controller/CartController.java:406`

---

## CATALOG MODULE (36 APIs)

### `GET /get/table-explorer/data/catalog`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/catalog`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogController.java:167`

---
### `GET /get/catalog/{catalogId}`
- **Method**: `GET`
- **Path**: `/get/catalog/{catalogId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `catalogId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogController.java:195`

---
### `GET /get/recent-catalog-list/{limit}`
- **Method**: `GET`
- **Path**: `/get/recent-catalog-list/{limit}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `limit: Integer (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogController.java:225`

---
### `GET /get/catalog-list`
- **Method**: `GET`
- **Path**: `/get/catalog-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogController.java:252`

---
### `GET /get/catalog-list/artisan/{artisanId}`
- **Method**: `GET`
- **Path**: `/get/catalog-list/artisan/{artisanId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `artisanId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogController.java:278`

---
### `GET /get/artisan/catalog-list`
- **Method**: `GET`
- **Path**: `/get/artisan/catalog-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogController.java:307`

---
### `GET /get/artisan/catalog/{catalogId}`
- **Method**: `GET`
- **Path**: `/get/artisan/catalog/{catalogId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `catalogId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogController.java:347`

---
### `POST /add/catalog`
- **Method**: `POST`
- **Path**: `/add/catalog`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Catalog`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogController.java:395`

---
### `POST /add/artisan/catalog`
- **Method**: `POST`
- **Path**: `/add/artisan/catalog`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Catalog`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogController.java:429`

---
### `PATCH /update/catalog`
- **Method**: `PATCH`
- **Path**: `/update/catalog`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Catalog`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogController.java:470`

---
### `PATCH /update/artisan/catalog`
- **Method**: `PATCH`
- **Path**: `/update/artisan/catalog`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Catalog`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogController.java:504`

---
### `DELETE /delete/catalog/{catalogId}`
- **Method**: `DELETE`
- **Path**: `/delete/catalog/{catalogId}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `catalogId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogController.java:558`

---
### `DELETE /delete/artisan/catalog/{catalogId}`
- **Method**: `DELETE`
- **Path**: `/delete/artisan/catalog/{catalogId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `catalogId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogController.java:581`

---
### `GET /get/table-explorer/data/catalog-item`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/catalog-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogItemController.java:176`

---
### `GET /get/catalog-item/{catalogItemId}`
- **Method**: `GET`
- **Path**: `/get/catalog-item/{catalogItemId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `catalogItemId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogItemController.java:204`

---
### `GET /get/catalog-item-list`
- **Method**: `GET`
- **Path**: `/get/catalog-item-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogItemController.java:230`

---
### `GET /get/artisan/catalog-item/{catalogItemId}`
- **Method**: `GET`
- **Path**: `/get/artisan/catalog-item/{catalogItemId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `catalogItemId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogItemController.java:260`

---
### `POST /add/catalog-item`
- **Method**: `POST`
- **Path**: `/add/catalog-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CatalogItemUpsertPayload`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogItemController.java:310`

---
### `POST /add/artisan/catalog-item`
- **Method**: `POST`
- **Path**: `/add/artisan/catalog-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CatalogItemUpsertPayload`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogItemController.java:348`

---
### `PATCH /update/catalog-item`
- **Method**: `PATCH`
- **Path**: `/update/catalog-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CatalogItemUpsertPayload`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogItemController.java:408`

---
### `PATCH /update/artisan/catalog-item`
- **Method**: `PATCH`
- **Path**: `/update/artisan/catalog-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CatalogItemUpsertPayload`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogItemController.java:447`

---
### `DELETE /delete/catalog-item/{catalogItemId}`
- **Method**: `DELETE`
- **Path**: `/delete/catalog-item/{catalogItemId}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `catalogItemId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogItemController.java:518`

---
### `DELETE /delete/artisan/catalog-item/{catalogItemId}`
- **Method**: `DELETE`
- **Path**: `/delete/artisan/catalog-item/{catalogItemId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `catalogItemId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogItemController.java:541`

---
### `DELETE /delete/catalog-item-media/{catalogItemMediaId}`
- **Method**: `DELETE`
- **Path**: `/delete/catalog-item-media/{catalogItemMediaId}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `catalogItemMediaId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogItemMediaController.java:160`

---
### `DELETE /delete/artisan/catalog-item-media/{catalogItemMediaId}`
- **Method**: `DELETE`
- **Path**: `/delete/artisan/catalog-item-media/{catalogItemMediaId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `catalogItemMediaId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogItemMediaController.java:183`

---
### `GET /get/table-explorer/data/catalog-item-media`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/catalog-item-media`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogItemMediaController.java:284`

---
### `GET /get/table-explorer/data/catalog-item-media/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/catalog-item-media/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogItemMediaController.java:312`

---
### `POST /add/catalog-pdf-generation/artisan/{artisanId}`
- **Method**: `POST`
- **Path**: `/add/catalog-pdf-generation/artisan/{artisanId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `artisanId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogPdfDownloadHistoryController.java:186`

---
### `POST /add/artisan/catalog-pdf-generation`
- **Method**: `POST`
- **Path**: `/add/artisan/catalog-pdf-generation`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogPdfDownloadHistoryController.java:221`

---
### `GET /get/catalog-pdf-generation/{generationId}`
- **Method**: `GET`
- **Path**: `/get/catalog-pdf-generation/{generationId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `generationId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogPdfDownloadHistoryController.java:260`

---
### `GET /wait/catalog-pdf-generation/{generationId}`
- **Method**: `GET`
- **Path**: `/wait/catalog-pdf-generation/{generationId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `generationId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `DeferredResult<String>`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogPdfDownloadHistoryController.java:293`

---
### `GET /get/catalog-pdf-generation-list/artisan/{artisanId}`
- **Method**: `GET`
- **Path**: `/get/catalog-pdf-generation-list/artisan/{artisanId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `artisanId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogPdfDownloadHistoryController.java:324`

---
### `GET /get/artisan/catalog-pdf-generation/{generationId}`
- **Method**: `GET`
- **Path**: `/get/artisan/catalog-pdf-generation/{generationId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `generationId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogPdfDownloadHistoryController.java:357`

---
### `GET /wait/artisan/catalog-pdf-generation/{generationId}`
- **Method**: `GET`
- **Path**: `/wait/artisan/catalog-pdf-generation/{generationId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `generationId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `DeferredResult<String>`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogPdfDownloadHistoryController.java:390`

---
### `GET /get/artisan/catalog-pdf-generation-list`
- **Method**: `GET`
- **Path**: `/get/artisan/catalog-pdf-generation-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogPdfDownloadHistoryController.java:420`

---
### `GET /get/table-explorer/data/catalog-pdf`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/catalog-pdf`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/catalog/controller/CatalogPdfDownloadHistoryController.java:549`

---

## COLOR MODULE (6 APIs)

### `GET /get/color-list`
- **Method**: `GET`
- **Path**: `/get/color-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/color/controller/ColorController.java:159`

---
### `POST /add/color`
- **Method**: `POST`
- **Path**: `/add/color`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Color`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/color/controller/ColorController.java:182`

---
### `PATCH /update/color`
- **Method**: `PATCH`
- **Path**: `/update/color`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Color`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/color/controller/ColorController.java:217`

---
### `DELETE /delete/color/{colorId}`
- **Method**: `DELETE`
- **Path**: `/delete/color/{colorId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `colorId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/color/controller/ColorController.java:252`

---
### `GET /get/table-explorer/data/color`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/color`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/color/controller/ColorController.java:283`

---
### `GET /get/table-explorer/data/color/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/color/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/color/controller/ColorController.java:315`

---

## COMPATIBILITY MODULE (3 APIs)

### `GET /redirect/blog`
- **Method**: `GET`
- **Path**: `/redirect/blog`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `slug: String (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/compatibility/controller/BlogUrlCompatibilityController.java:149`

---
### `GET /redirect/product`
- **Method**: `GET`
- **Path**: `/redirect/product`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `slug: String (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/compatibility/controller/ProductUrlCompatibilityController.java:150`

---
### `GET /redirect/story`
- **Method**: `GET`
- **Path**: `/redirect/story`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `slug: String (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/compatibility/controller/StoryUrlCompatibilityController.java:149`

---

## CONTENT MODULE (56 APIs)

### `GET /get/blog-content-category-list`
- **Method**: `GET`
- **Path**: `/get/blog-content-category-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentCategoryController.java:114`

---
### `POST /add/blog-content-category/{blogContentTypeId}`
- **Method**: `POST`
- **Path**: `/add/blog-content-category/{blogContentTypeId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `blogContentTypeId: Long (path)`
- **Request Body**: `BlogContentCategory`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentCategoryController.java:141`

---
### `PATCH /update/blog-content-category`
- **Method**: `PATCH`
- **Path**: `/update/blog-content-category`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `BlogContentCategory`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentCategoryController.java:174`

---
### `GET /get/table-explorer/data/blog-content-category`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/blog-content-category`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentCategoryController.java:205`

---
### `GET /get/table-explorer/data/blog-content-category/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/blog-content-category/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentCategoryController.java:233`

---
### `GET /get/table-explorer/data/blog-content`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/blog-content`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentController.java:124`

---
### `GET /get/blog-content/{blogContentId}`
- **Method**: `GET`
- **Path**: `/get/blog-content/{blogContentId}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `blogContentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentController.java:152`

---
### `GET /get/blog-content/slug/{slug}`
- **Method**: `GET`
- **Path**: `/get/blog-content/slug/{slug}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `slug: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentController.java:173`

---
### `POST /add/blog-content`
- **Method**: `POST`
- **Path**: `/add/blog-content`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentController.java:198`

---
### `PATCH /update/blog-content/{blogContentId}`
- **Method**: `PATCH`
- **Path**: `/update/blog-content/{blogContentId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `blogContentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentController.java:239`

---
### `DELETE /delete/blog-content/{blogContentId}`
- **Method**: `DELETE`
- **Path**: `/delete/blog-content/{blogContentId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `blogContentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentController.java:272`

---
### `GET /get/table-explorer/data/blog-content/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/blog-content/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentController.java:298`

---
### `GET /get/blog-content-list`
- **Method**: `GET`
- **Path**: `/get/blog-content-list`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentPreviewController.java:92`

---
### `GET /get/blog-content-list/customer`
- **Method**: `GET`
- **Path**: `/get/blog-content-list/customer`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentPreviewController.java:118`

---
### `GET /get/blog-content-list/csv/{commaSeparatedIDList}`
- **Method**: `GET`
- **Path**: `/get/blog-content-list/csv/{commaSeparatedIDList}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `commaSeparatedIDList: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentPreviewController.java:143`

---
### `GET /get/blogs/category/{blogCategoryId}`
- **Method**: `GET`
- **Path**: `/get/blogs/category/{blogCategoryId}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `blogCategoryId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentPreviewController.java:166`

---
### `GET /get/blogs/{blogId}/recommended`
- **Method**: `GET`
- **Path**: `/get/blogs/{blogId}/recommended`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `blogId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentPreviewController.java:189`

---
### `POST /add/blog-content-section`
- **Method**: `POST`
- **Path**: `/add/blog-content-section`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentSectionController.java:123`

---
### `PATCH /update/blog-content-section/{blogContentSectionId}`
- **Method**: `PATCH`
- **Path**: `/update/blog-content-section/{blogContentSectionId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `blogContentSectionId: Long (path), =: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentSectionController.java:164`

---
### `DELETE /delete/blog-content-section/{blogContentSectionId}`
- **Method**: `DELETE`
- **Path**: `/delete/blog-content-section/{blogContentSectionId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `blogContentSectionId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentSectionController.java:202`

---
### `GET /get/table-explorer/data/blog-content-section/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/blog-content-section/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentSectionController.java:228`

---
### `GET /get/table-explorer/data/blog-content-section`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/blog-content-section`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentSectionController.java:256`

---
### `GET /get/blog-content-types`
- **Method**: `GET`
- **Path**: `/get/blog-content-types`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentTypeController.java:117`

---
### `POST /add/blog-content-type`
- **Method**: `POST`
- **Path**: `/add/blog-content-type`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `BlogContentType`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentTypeController.java:143`

---
### `PATCH /update/blog-content-type`
- **Method**: `PATCH`
- **Path**: `/update/blog-content-type`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `BlogContentType`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentTypeController.java:175`

---
### `GET /get/table-explorer/data/blog-content-type`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/blog-content-type`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentTypeController.java:206`

---
### `GET /get/table-explorer/data/blog-content-type/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/blog-content-type/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/blog/controller/BlogContentTypeController.java:234`

---
### `GET /get/story-content-category-list`
- **Method**: `GET`
- **Path**: `/get/story-content-category-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentCategoryController.java:143`

---
### `POST /add/story-content-category`
- **Method**: `POST`
- **Path**: `/add/story-content-category`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `StoryContentCategory`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentCategoryController.java:170`

---
### `PATCH /update/story-content-category`
- **Method**: `PATCH`
- **Path**: `/update/story-content-category`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `StoryContentCategory`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentCategoryController.java:203`

---
### `GET /get/table-explorer/data/story-content-category`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/story-content-category`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentCategoryController.java:238`

---
### `GET /get/table-explorer/data/story-content-category/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/story-content-category/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentCategoryController.java:270`

---
### `GET /get/story-content/{storyContentId}`
- **Method**: `GET`
- **Path**: `/get/story-content/{storyContentId}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `storyContentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentController.java:155`

---
### `GET /get/story-content/slug/{slug}`
- **Method**: `GET`
- **Path**: `/get/story-content/slug/{slug}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `slug: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentController.java:179`

---
### `POST /add/story-content`
- **Method**: `POST`
- **Path**: `/add/story-content`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentController.java:205`

---
### `PATCH /update/story-content/{storyContentId}`
- **Method**: `PATCH`
- **Path**: `/update/story-content/{storyContentId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `storyContentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentController.java:247`

---
### `DELETE /delete/story-content/{storyContentId}`
- **Method**: `DELETE`
- **Path**: `/delete/story-content/{storyContentId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `storyContentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentController.java:283`

---
### `GET /get/table-explorer/data/story-content`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/story-content`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentController.java:314`

---
### `GET /get/table-explorer/data/story-content/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/story-content/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentController.java:346`

---
### `GET /get/story-content-list`
- **Method**: `GET`
- **Path**: `/get/story-content-list`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentPreviewController.java:112`

---
### `GET /get/story-content-list/csv/{commaSeparatedIDList}`
- **Method**: `GET`
- **Path**: `/get/story-content-list/csv/{commaSeparatedIDList}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `commaSeparatedIDList: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentPreviewController.java:133`

---
### `GET /get/stories/category/{storyCategoryId}`
- **Method**: `GET`
- **Path**: `/get/stories/category/{storyCategoryId}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `storyCategoryId: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentPreviewController.java:159`

---
### `GET /get/stories/{storyId}/recommended`
- **Method**: `GET`
- **Path**: `/get/stories/{storyId}/recommended`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `storyId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentPreviewController.java:185`

---
### `POST /add/story-content-section`
- **Method**: `POST`
- **Path**: `/add/story-content-section`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentSectionController.java:142`

---
### `PATCH /update/story-content-section/{storyContentSectionId}`
- **Method**: `PATCH`
- **Path**: `/update/story-content-section/{storyContentSectionId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `storyContentSectionId: Long (path), =: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentSectionController.java:184`

---
### `DELETE /delete/story-content-section/{storyContentSectionId}`
- **Method**: `DELETE`
- **Path**: `/delete/story-content-section/{storyContentSectionId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `storyContentSectionId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentSectionController.java:225`

---
### `GET /get/table-explorer/data/story-content-section/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/story-content-section/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentSectionController.java:255`

---
### `GET /get/table-explorer/data/story-content-section`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/story-content-section`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryContentSectionController.java:287`

---
### `GET /get/story/product-previews/{storyContentId}`
- **Method**: `GET`
- **Path**: `/get/story/product-previews/{storyContentId}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `storyContentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryProductMappingController.java:176`

---
### `GET /get/story/products/{storyContentId}`
- **Method**: `GET`
- **Path**: `/get/story/products/{storyContentId}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `storyContentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryProductMappingController.java:199`

---
### `GET /get/product/related/story/{storyContentId}`
- **Method**: `GET`
- **Path**: `/get/product/related/story/{storyContentId}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `storyContentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryProductMappingController.java:223`

---
### `GET /get/story/related/product/{productId}`
- **Method**: `GET`
- **Path**: `/get/story/related/product/{productId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `productId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryProductMappingController.java:243`

---
### `GET /get/table-explorer/data/story-product-mapping/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/story-product-mapping/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryProductMappingController.java:268`

---
### `GET /get/table-explorer/data/story-product-mapping`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/story-product-mapping`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryProductMappingController.java:300`

---
### `POST /add/story-product/relation`
- **Method**: `POST`
- **Path**: `/add/story-product/relation`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `StoryProductMappingRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryProductMappingController.java:332`

---
### `POST /update/story-product/relation`
- **Method**: `POST`
- **Path**: `/update/story-product/relation`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `StoryProductMappingRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_METHOD`
- **Source Location**: `main/java/com/bloomscorp/loom/content/story/controller/StoryProductMappingController.java:370`

---

## DIAGNOSTICS MODULE (5 APIs)

### `GET /get/diagnostics/app`
- **Method**: `GET`
- **Path**: `/get/diagnostics/app`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/diagnostics/controller/DiagnosticsController.java:217`

---
### `GET /get/diagnostics/host`
- **Method**: `GET`
- **Path**: `/get/diagnostics/host`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/diagnostics/controller/DiagnosticsController.java:249`

---
### `GET /get/diagnostics/summary`
- **Method**: `GET`
- **Path**: `/get/diagnostics/summary`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/diagnostics/controller/DiagnosticsController.java:280`

---
### `GET /get/diagnostics/ping`
- **Method**: `GET`
- **Path**: `/get/diagnostics/ping`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/diagnostics/controller/DiagnosticsController.java:310`

---
### `GET /get/diagnostics/thread-dump`
- **Method**: `GET`
- **Path**: `/get/diagnostics/thread-dump`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/diagnostics/controller/DiagnosticsController.java:345`

---

## DISCOUNT MODULE (7 APIs)

### `GET /get/discount/{discountId}`
- **Method**: `GET`
- **Path**: `/get/discount/{discountId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `discountId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/discount/controller/DiscountController.java:188`

---
### `GET /get/discount-list`
- **Method**: `GET`
- **Path**: `/get/discount-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/discount/controller/DiscountController.java:219`

---
### `POST /add/discount`
- **Method**: `POST`
- **Path**: `/add/discount`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Discount`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/discount/controller/DiscountController.java:249`

---
### `PATCH /update/discount`
- **Method**: `PATCH`
- **Path**: `/update/discount`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Discount`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/discount/controller/DiscountController.java:285`

---
### `DELETE /delete/discount/{discountId}`
- **Method**: `DELETE`
- **Path**: `/delete/discount/{discountId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `discountId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/discount/controller/DiscountController.java:318`

---
### `GET /get/table-explorer/data/discount`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/discount`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/discount/controller/DiscountController.java:351`

---
### `POST /apply/voucher/discount`
- **Method**: `POST`
- **Path**: `/apply/voucher/discount`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `VoucherApplicationRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/discount/controller/DiscountController.java:391`

---

## FAQ MODULE (8 APIs)

### `GET /get/faqs`
- **Method**: `GET`
- **Path**: `/get/faqs`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/faq/controller/FaqController.java:95`

---
### `GET /get/faq/{faqId}`
- **Method**: `GET`
- **Path**: `/get/faq/{faqId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `faqId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/faq/controller/FaqController.java:114`

---
### `POST /add/faq`
- **Method**: `POST`
- **Path**: `/add/faq`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Faq`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/faq/controller/FaqController.java:134`

---
### `PATCH /update/faq`
- **Method**: `PATCH`
- **Path**: `/update/faq`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Faq`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/faq/controller/FaqController.java:157`

---
### `GET /get/table-explorer/data/faq`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/faq`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/faq/controller/FaqController.java:180`

---
### `GET /get/table-explorer/data/faq-question/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/faq-question/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/faq/controller/FaqController.java:201`

---
### `GET /get/table-explorer/data/faq-question`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/faq-question`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/faq/controller/FaqController.java:221`

---
### `GET /get/table-explorer/data/faq/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/faq/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/faq/controller/FaqController.java:242`

---

## FEEDBACK MODULE (9 APIs)

### `POST /add/order/feedback`
- **Method**: `POST`
- **Path**: `/add/order/feedback`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `PurchaseOrderFeedback`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/feedback/controller/PurchaseOrderFeedbackController.java:78`

---
### `GET /get/order/feedback/{orderId}`
- **Method**: `GET`
- **Path**: `/get/order/feedback/{orderId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/feedback/controller/PurchaseOrderFeedbackController.java:103`

---
### `GET /get/super-user/order/feedback/{feedbackId}`
- **Method**: `GET`
- **Path**: `/get/super-user/order/feedback/{feedbackId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `feedbackId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/feedback/controller/PurchaseOrderFeedbackController.java:130`

---
### `GET /get/order/feedback-list`
- **Method**: `GET`
- **Path**: `/get/order/feedback-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/feedback/controller/PurchaseOrderFeedbackController.java:152`

---
### `PATCH /update/order/feedback/q1`
- **Method**: `PATCH`
- **Path**: `/update/order/feedback/q1`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `PurchaseOrderFeedback`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/feedback/controller/PurchaseOrderFeedbackController.java:171`

---
### `PATCH /update/order/feedback/q2`
- **Method**: `PATCH`
- **Path**: `/update/order/feedback/q2`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `PurchaseOrderFeedback`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/feedback/controller/PurchaseOrderFeedbackController.java:193`

---
### `PATCH /update/order/feedback/q3`
- **Method**: `PATCH`
- **Path**: `/update/order/feedback/q3`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `PurchaseOrderFeedback`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/feedback/controller/PurchaseOrderFeedbackController.java:215`

---
### `GET /get/table-explorer/data/purchase-order-feedback`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/purchase-order-feedback`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/feedback/controller/PurchaseOrderFeedbackController.java:238`

---
### `GET /get/table-explorer/data/purchase-order-feedback/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/purchase-order-feedback/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/feedback/controller/PurchaseOrderFeedbackController.java:259`

---

## FILTER MODULE (4 APIs)

### `GET /get/filter/fabric`
- **Method**: `GET`
- **Path**: `/get/filter/fabric`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `=: (required (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/filter/controller/FilterController.java:69`

---
### `GET /get/v2/filter/fabric`
- **Method**: `GET`
- **Path**: `/get/v2/filter/fabric`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `=: (required (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/filter/controller/FilterController.java:83`

---
### `GET /get/filter/finished`
- **Method**: `GET`
- **Path**: `/get/filter/finished`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `=: (required (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/filter/controller/FilterController.java:104`

---
### `GET /get/filter/fabric/filtered`
- **Method**: `GET`
- **Path**: `/get/filter/fabric/filtered`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `=: (required (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/filter/controller/FilterController.java:117`

---

## FOREX MODULE (12 APIs)

### `GET /get/forex/{forexId}`
- **Method**: `GET`
- **Path**: `/get/forex/{forexId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `forexId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/forex/controller/ForexController.java:79`

---
### `GET /get/forex-list`
- **Method**: `GET`
- **Path**: `/get/forex-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/forex/controller/ForexController.java:100`

---
### `POST /add/forex`
- **Method**: `POST`
- **Path**: `/add/forex`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Forex`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/forex/controller/ForexController.java:113`

---
### `PATCH /update/forex`
- **Method**: `PATCH`
- **Path**: `/update/forex`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Forex`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/forex/controller/ForexController.java:136`

---
### `DELETE /delete/forex/{forexId}`
- **Method**: `DELETE`
- **Path**: `/delete/forex/{forexId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `forexId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/forex/controller/ForexController.java:159`

---
### `GET /get/data-dump/forex`
- **Method**: `GET`
- **Path**: `/get/data-dump/forex`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/forex/controller/ForexController.java:178`

---
### `GET /get/table-explorer/data/forex`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/forex`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/forex/controller/ForexController.java:195`

---
### `GET /get/table-explorer/data/forex/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/forex/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/forex/controller/ForexController.java:216`

---
### `GET /get/forex-exchange-rate/latest`
- **Method**: `GET`
- **Path**: `/get/forex-exchange-rate/latest`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/forex/controller/ForexExchangeRateController.java:76`

---
### `GET /get/forex-exchange-rate-list`
- **Method**: `GET`
- **Path**: `/get/forex-exchange-rate-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/forex/controller/ForexExchangeRateController.java:88`

---
### `GET /get/table-explorer/data/forex-exchange-rate`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/forex-exchange-rate`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/forex/controller/ForexExchangeRateController.java:99`

---
### `GET /get/table-explorer/data/forex-exchange-rate/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/forex-exchange-rate/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/forex/controller/ForexExchangeRateController.java:120`

---

## IMAGE MODULE (20 APIs)

### `POST /upload/image`
- **Method**: `POST`
- **Path**: `/upload/image`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/controller/ImageController.java:70`

---
### `DELETE /delete/image`
- **Method**: `DELETE`
- **Path**: `/delete/image`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Image`
- **Response Type**: `void`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/controller/ImageController.java:91`

---
### `GET /get/image-optimization/overview`
- **Method**: `GET`
- **Path**: `/get/image-optimization/overview`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:133`

---
### `GET /get/image-optimization/records`
- **Method**: `GET`
- **Path**: `/get/image-optimization/records`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:140`

---
### `GET /get/image-optimization/analytics`
- **Method**: `GET`
- **Path**: `/get/image-optimization/analytics`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:157`

---
### `GET /get/image-optimization/unsupported`
- **Method**: `GET`
- **Path**: `/get/image-optimization/unsupported`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:164`

---
### `GET /get/image-optimization/threads`
- **Method**: `GET`
- **Path**: `/get/image-optimization/threads`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:171`

---
### `GET /get/image-optimization/tools`
- **Method**: `GET`
- **Path**: `/get/image-optimization/tools`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:178`

---
### `GET /get/image-optimization/progress`
- **Method**: `GET`
- **Path**: `/get/image-optimization/progress`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:185`

---
### `GET /get/image-optimization/bucket`
- **Method**: `GET`
- **Path**: `/get/image-optimization/bucket`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:196`

---
### `POST /update/image-optimization/discovery/run`
- **Method**: `POST`
- **Path**: `/update/image-optimization/discovery/run`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:210`

---
### `POST /update/image-optimization/requeue`
- **Method**: `POST`
- **Path**: `/update/image-optimization/requeue`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:217`

---
### `POST /update/image-optimization/main/pause`
- **Method**: `POST`
- **Path**: `/update/image-optimization/main/pause`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:228`

---
### `POST /update/image-optimization/main/resume`
- **Method**: `POST`
- **Path**: `/update/image-optimization/main/resume`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:237`

---
### `POST /update/image-optimization/main/settings`
- **Method**: `POST`
- **Path**: `/update/image-optimization/main/settings`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:246`

---
### `POST /update/image-optimization/workers/start`
- **Method**: `POST`
- **Path**: `/update/image-optimization/workers/start`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:259`

---
### `POST /update/image-optimization/workers/stop`
- **Method**: `POST`
- **Path**: `/update/image-optimization/workers/stop`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:269`

---
### `POST /update/image-optimization/tools/preset`
- **Method**: `POST`
- **Path**: `/update/image-optimization/tools/preset`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:284`

---
### `POST /update/image-optimization/tools/option`
- **Method**: `POST`
- **Path**: `/update/image-optimization/tools/option`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:297`

---
### `POST /update/image-optimization/tools/enabled`
- **Method**: `POST`
- **Path**: `/update/image-optimization/tools/enabled`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/image/optimization/controller/ImageOptimizationController.java:311`

---

## IMPACT MODULE (6 APIs)

### `GET /get/impact/order/{orderId}`
- **Method**: `GET`
- **Path**: `/get/impact/order/{orderId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/impact/controller/ImpactFactorController.java:124`

---
### `POST /trigger/impact/order/{orderId}`
- **Method**: `POST`
- **Path**: `/trigger/impact/order/{orderId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/impact/controller/ImpactFactorController.java:163`

---
### `GET /get/impact/order/aggregation`
- **Method**: `GET`
- **Path**: `/get/impact/order/aggregation`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/impact/controller/ImpactFactorController.java:189`

---
### `GET /get/impact/custom-order/{customOrderId}`
- **Method**: `GET`
- **Path**: `/get/impact/custom-order/{customOrderId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `customOrderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/impact/controller/ImpactFactorController.java:213`

---
### `POST /trigger/impact/custom-order/{customOrderId}`
- **Method**: `POST`
- **Path**: `/trigger/impact/custom-order/{customOrderId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `customOrderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/impact/controller/ImpactFactorController.java:252`

---
### `GET /get/impact/custom-order/aggregation`
- **Method**: `GET`
- **Path**: `/get/impact/custom-order/aggregation`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/impact/controller/ImpactFactorController.java:278`

---

## INVENTORY MODULE (24 APIs)

### `GET /get/inventory-adjustment/{adjustmentId}`
- **Method**: `GET`
- **Path**: `/get/inventory-adjustment/{adjustmentId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `adjustmentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryAdjustmentController.java:84`

---
### `GET /get/inventory-adjustment`
- **Method**: `GET`
- **Path**: `/get/inventory-adjustment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `=: (defaultValue (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryAdjustmentController.java:104`

---
### `POST /add/inventory-adjustment`
- **Method**: `POST`
- **Path**: `/add/inventory-adjustment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `InventoryAdjustment`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryAdjustmentController.java:130`

---
### `GET /get/table-explorer/data/inventory-adjustment-item`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/inventory-adjustment-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryAdjustmentController.java:160`

---
### `GET /get/table-explorer/data/inventory-adjustment`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/inventory-adjustment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryAdjustmentController.java:181`

---
### `GET /get/inventory-adjustment-reason/{reasonId}`
- **Method**: `GET`
- **Path**: `/get/inventory-adjustment-reason/{reasonId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `reasonId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryAdjustmentReasonController.java:185`

---
### `GET /get/inventory-adjustment-reason`
- **Method**: `GET`
- **Path**: `/get/inventory-adjustment-reason`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryAdjustmentReasonController.java:223`

---
### `POST /add/inventory-adjustment-reason`
- **Method**: `POST`
- **Path**: `/add/inventory-adjustment-reason`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `InventoryAdjustmentReason`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryAdjustmentReasonController.java:261`

---
### `PATCH /update/inventory-adjustment-reason`
- **Method**: `PATCH`
- **Path**: `/update/inventory-adjustment-reason`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `InventoryAdjustmentReason`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryAdjustmentReasonController.java:307`

---
### `GET /get/table-explorer/data/inventory-adjustment-reason`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/inventory-adjustment-reason`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryAdjustmentReasonController.java:330`

---
### `GET /get/table-explorer/data/inventory-adjustment-reason/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/inventory-adjustment-reason/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryAdjustmentReasonController.java:351`

---
### `GET /get/inventory-restock-request`
- **Method**: `GET`
- **Path**: `/get/inventory-restock-request`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryReStockRequestController.java:91`

---
### `POST /add/inventory-restock-request`
- **Method**: `POST`
- **Path**: `/add/inventory-restock-request`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `InventoryReStockRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryReStockRequestController.java:110`

---
### `PATCH /update/inventory-restock-request/quantity`
- **Method**: `PATCH`
- **Path**: `/update/inventory-restock-request/quantity`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ReStockRequestUpdatePayload`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryReStockRequestController.java:141`

---
### `PATCH /update/inventory-restock-request/status`
- **Method**: `PATCH`
- **Path**: `/update/inventory-restock-request/status`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `InventoryReStockRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryReStockRequestController.java:164`

---
### `GET /get/table-explorer/data/inventory-restock-request`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/inventory-restock-request`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryReStockRequestController.java:187`

---
### `DELETE /delete/inventory-restock-request/{requestId}`
- **Method**: `DELETE`
- **Path**: `/delete/inventory-restock-request/{requestId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `requestId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryReStockRequestController.java:208`

---
### `GET /get/table-explorer/data/inventory-restock-request/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/inventory-restock-request/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/InventoryReStockRequestController.java:227`

---
### `GET /get/warehouse/{warehouseId}`
- **Method**: `GET`
- **Path**: `/get/warehouse/{warehouseId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `warehouseId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/WarehouseController.java:79`

---
### `GET /get/warehouse`
- **Method**: `GET`
- **Path**: `/get/warehouse`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/WarehouseController.java:99`

---
### `GET /get/table-explorer/data/warehouse`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/warehouse`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/WarehouseController.java:116`

---
### `GET /get/table-explorer/data/warehouse/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/warehouse/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/WarehouseController.java:137`

---
### `POST /add/warehouse`
- **Method**: `POST`
- **Path**: `/add/warehouse`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Warehouse`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/WarehouseController.java:157`

---
### `PATCH /update/warehouse`
- **Method**: `PATCH`
- **Path**: `/update/warehouse`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Warehouse`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/inventory/controller/WarehouseController.java:180`

---

## IP LOCATION MODULE (1 APIs)

### `GET /get/ip-wise/currency`
- **Method**: `GET`
- **Path**: `/get/ip-wise/currency`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/iplocation/controller/IPLocationController.java:64`

---

## LOYALTY PROGRAM MODULE (8 APIs)

### `POST /enable/loyalty-program`
- **Method**: `POST`
- **Path**: `/enable/loyalty-program`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `LoyaltyProgramConfig`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/loyaltyprogram/controller/LoyaltyProgramConfigController.java:100`

---
### `GET /get/customer/loyalty/info`
- **Method**: `GET`
- **Path**: `/get/customer/loyalty/info`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/loyaltyprogram/controller/LoyaltyProgramConfigController.java:123`

---
### `GET /get/table-explorer/data/loyalty-program-config/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/loyalty-program-config/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/loyaltyprogram/controller/LoyaltyProgramConfigController.java:146`

---
### `GET /get/table-explorer/data/loyalty-program-config`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/loyalty-program-config`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/loyaltyprogram/controller/LoyaltyProgramConfigController.java:166`

---
### `GET /get/table-explorer/data/loyalty-program-config-audit-log/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/loyalty-program-config-audit-log/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/loyaltyprogram/controller/LoyaltyProgramConfigController.java:187`

---
### `GET /get/table-explorer/data/loyalty-program-config-audit-log`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/loyalty-program-config-audit-log`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/loyaltyprogram/controller/LoyaltyProgramConfigController.java:207`

---
### `GET /get/order/loyalty/info`
- **Method**: `GET`
- **Path**: `/get/order/loyalty/info`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/loyaltyprogram/controller/LoyaltyProgramInfoController.java:73`

---
### `GET /get/customer/order-list/loyalty`
- **Method**: `GET`
- **Path**: `/get/customer/order-list/loyalty`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/loyaltyprogram/controller/LoyaltyProgramInfoController.java:96`

---

## MATERIAL MODULE (6 APIs)

### `GET /get/material-list`
- **Method**: `GET`
- **Path**: `/get/material-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/material/controller/MaterialController.java:82`

---
### `POST /add/material`
- **Method**: `POST`
- **Path**: `/add/material`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Material`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/material/controller/MaterialController.java:94`

---
### `PATCH /update/material`
- **Method**: `PATCH`
- **Path**: `/update/material`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Material`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/material/controller/MaterialController.java:117`

---
### `DELETE /delete/material/{materialId}`
- **Method**: `DELETE`
- **Path**: `/delete/material/{materialId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `materialId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/material/controller/MaterialController.java:140`

---
### `GET /get/table-explorer/data/material`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/material`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/material/controller/MaterialController.java:159`

---
### `GET /get/table-explorer/data/material/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/material/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/material/controller/MaterialController.java:180`

---

## MISC MODULE (2 APIs)

### `POST /send/contact-us`
- **Method**: `POST`
- **Path**: `/send/contact-us`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ContactUsData`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/misc/controller/MiscController.java:76`

---
### `POST /update/email`
- **Method**: `POST`
- **Path**: `/update/email`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/misc/controller/MiscController.java:100`

---

## NAVIGATION MODULE (7 APIs)

### `GET /get/navigation`
- **Method**: `GET`
- **Path**: `/get/navigation`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/navigation/controller/NavigationController.java:69`

---
### `GET /get/navigation/fabric/craft`
- **Method**: `GET`
- **Path**: `/get/navigation/fabric/craft`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/navigation/controller/NavigationController.java:88`

---
### `GET /get/navigation/fabric/material`
- **Method**: `GET`
- **Path**: `/get/navigation/fabric/material`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/navigation/controller/NavigationController.java:106`

---
### `GET /get/navigation/fabric/pattern`
- **Method**: `GET`
- **Path**: `/get/navigation/fabric/pattern`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/navigation/controller/NavigationController.java:125`

---
### `GET /get/navigation/fabric/color`
- **Method**: `GET`
- **Path**: `/get/navigation/fabric/color`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/navigation/controller/NavigationController.java:144`

---
### `GET /get/navigation/finished/{category}`
- **Method**: `GET`
- **Path**: `/get/navigation/finished/{category}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `category: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/navigation/controller/NavigationController.java:162`

---
### `GET /get/navigation/story/{category}`
- **Method**: `GET`
- **Path**: `/get/navigation/story/{category}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `category: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/navigation/controller/NavigationController.java:183`

---

## NOTIFICATION MODULE (13 APIs)

### `POST /send/email`
- **Method**: `POST`
- **Path**: `/send/email`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `void`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/notifire/controller/EmailNotificationController.java:61`

---
### `GET /get/email/audit-log`
- **Method**: `GET`
- **Path**: `/get/email/audit-log`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/notifire/controller/EmailNotificationHistoryController.java:112`

---
### `GET /get/email/audit-log/{id}`
- **Method**: `GET`
- **Path**: `/get/email/audit-log/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/notifire/controller/EmailNotificationHistoryController.java:144`

---
### `GET /get/email/audit-log/order/{orderId}`
- **Method**: `GET`
- **Path**: `/get/email/audit-log/order/{orderId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/notifire/controller/EmailNotificationHistoryController.java:164`

---
### `POST /retrigger/email/audit-log`
- **Method**: `POST`
- **Path**: `/retrigger/email/audit-log`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `EmailRetriggerRequest`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/notifire/controller/EmailNotificationHistoryController.java:184`

---
### `POST /send/email/order-notification`
- **Method**: `POST`
- **Path**: `/send/email/order-notification`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `OrderEmailTriggerRequest`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/notifire/controller/EmailNotificationHistoryController.java:214`

---
### `GET /get/table-explorer/data/whatsapp-notification-history/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/whatsapp-notification-history/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/notifire/controller/WhatsappNotificationController.java:97`

---
### `GET /get/table-explorer/data/whatsapp-notification-history`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/whatsapp-notification-history`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/notifire/controller/WhatsappNotificationController.java:117`

---
### `GET /get/whatsapp/audit-log/{id}`
- **Method**: `GET`
- **Path**: `/get/whatsapp/audit-log/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/notifire/controller/WhatsappNotificationController.java:138`

---
### `GET /get/whatsapp/audit-log`
- **Method**: `GET`
- **Path**: `/get/whatsapp/audit-log`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/notifire/controller/WhatsappNotificationController.java:158`

---
### `POST /poll/whatsapp/delivery-status`
- **Method**: `POST`
- **Path**: `/poll/whatsapp/delivery-status`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/notifire/controller/WhatsappNotificationController.java:188`

---
### `POST /poll/whatsapp/delivery-status/stale`
- **Method**: `POST`
- **Path**: `/poll/whatsapp/delivery-status/stale`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/notifire/controller/WhatsappNotificationController.java:215`

---
### `POST /poll/whatsapp/delivery-status/{id}`
- **Method**: `POST`
- **Path**: `/poll/whatsapp/delivery-status/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/notifire/controller/WhatsappNotificationController.java:240`

---

## ORDER MODULE (70 APIs)

### `POST /add/custom-order-adjustment`
- **Method**: `POST`
- **Path**: `/add/custom-order-adjustment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomOrderAdjustment`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderAdjustmentController.java:80`

---
### `PATCH /update/custom-order-adjustment`
- **Method**: `PATCH`
- **Path**: `/update/custom-order-adjustment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomOrderAdjustment`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderAdjustmentController.java:103`

---
### `DELETE /delete/custom-order-adjustment/{adjustmentId}`
- **Method**: `DELETE`
- **Path**: `/delete/custom-order-adjustment/{adjustmentId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `adjustmentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderAdjustmentController.java:126`

---
### `GET /get/table-explorer/data/custom-order-adjustment/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/custom-order-adjustment/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderAdjustmentController.java:145`

---
### `GET /get/table-explorer/data/custom-order-adjustment`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/custom-order-adjustment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderAdjustmentController.java:165`

---
### `GET /get/super-user/custom-order/{orderId}`
- **Method**: `GET`
- **Path**: `/get/super-user/custom-order/{orderId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:118`

---
### `POST /add/custom-order`
- **Method**: `POST`
- **Path**: `/add/custom-order`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomOrder`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:140`

---
### `PATCH /update/custom-order`
- **Method**: `PATCH`
- **Path**: `/update/custom-order`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomOrderAdjustedPricePayload`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:163`

---
### `PATCH /update/custom-order/global-note`
- **Method**: `PATCH`
- **Path**: `/update/custom-order/global-note`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomOrderGlobalNoteUpdateRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:198`

---
### `PATCH /update/custom-order/shipment`
- **Method**: `PATCH`
- **Path**: `/update/custom-order/shipment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomOrderUpdateRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:221`

---
### `PATCH /update/custom-order-info`
- **Method**: `PATCH`
- **Path**: `/update/custom-order-info`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomOrderUpdateRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:244`

---
### `DELETE /cancel/custom-order`
- **Method**: `DELETE`
- **Path**: `/cancel/custom-order`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `OrderCancellationPayload`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_METHOD`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:267`

---
### `DELETE /delete/custom-order/{orderId}`
- **Method**: `DELETE`
- **Path**: `/delete/custom-order/{orderId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:289`

---
### `POST /send/email/confirmed-custom-order/{orderId}`
- **Method**: `POST`
- **Path**: `/send/email/confirmed-custom-order/{orderId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:308`

---
### `PATCH /update/custom-order-item`
- **Method**: `PATCH`
- **Path**: `/update/custom-order-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomOrderItemUpdatePayload`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:326`

---
### `DELETE /delete/custom-order-item/{orderItemId}`
- **Method**: `DELETE`
- **Path**: `/delete/custom-order-item/{orderItemId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `orderItemId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:348`

---
### `PATCH /add/custom-order-items`
- **Method**: `PATCH`
- **Path**: `/add/custom-order-items`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NewCustomOrderItemAddPayload`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:367`

---
### `GET /get/customer/custom-order/{orderId}`
- **Method**: `GET`
- **Path**: `/get/customer/custom-order/{orderId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:390`

---
### `GET /get/data-dump/custom-order`
- **Method**: `GET`
- **Path**: `/get/data-dump/custom-order`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:416`

---
### `GET /get/data-dump/custom-order-item`
- **Method**: `GET`
- **Path**: `/get/data-dump/custom-order-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:433`

---
### `GET /get/table-explorer/data/custom-order`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/custom-order`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:450`

---
### `GET /get/table-explorer/data/custom-order-item`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/custom-order-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:471`

---
### `GET /get/table-explorer/data/custom-order-item/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/custom-order-item/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:492`

---
### `GET /get/table-explorer/data/custom-order/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/custom-order/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderController.java:512`

---
### `POST /add/custom-order/fulfillment`
- **Method**: `POST`
- **Path**: `/add/custom-order/fulfillment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomOrderFulfillmentRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderFulfillmentController.java:95`

---
### `PATCH /update/custom-order/fulfillment`
- **Method**: `PATCH`
- **Path**: `/update/custom-order/fulfillment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomOrderFulfillmentRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderFulfillmentController.java:126`

---
### `GET /get/super-user/custom-order/{orderId}/fulfillment-list`
- **Method**: `GET`
- **Path**: `/get/super-user/custom-order/{orderId}/fulfillment-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderFulfillmentController.java:150`

---
### `GET /get/customer/custom-order/{orderId}/fulfillment-list`
- **Method**: `GET`
- **Path**: `/get/customer/custom-order/{orderId}/fulfillment-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderFulfillmentController.java:170`

---
### `GET /get/table-explorer/data/custom-order-item-fulfillment`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/custom-order-item-fulfillment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderFulfillmentController.java:195`

---
### `GET /get/table-explorer/data/custom-order-fulfillment/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/custom-order-fulfillment/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderFulfillmentController.java:216`

---
### `GET /get/table-explorer/data/custom-order-fulfillment`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/custom-order-fulfillment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderFulfillmentController.java:236`

---
### `GET /get/super-user/custom-order-list`
- **Method**: `GET`
- **Path**: `/get/super-user/custom-order-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderPreviewController.java:73`

---
### `GET /get/super-user/custom-order-list/search`
- **Method**: `GET`
- **Path**: `/get/super-user/custom-order-list/search`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderPreviewController.java:114`

---
### `POST /add/custom-order/ready`
- **Method**: `POST`
- **Path**: `/add/custom-order/ready`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomOrderReadyRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderReadyController.java:87`

---
### `PATCH /update/custom-order/ready`
- **Method**: `PATCH`
- **Path**: `/update/custom-order/ready`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomOrderReadyRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderReadyController.java:118`

---
### `GET /get/super-user/custom-order/{orderId}/ready-list`
- **Method**: `GET`
- **Path**: `/get/super-user/custom-order/{orderId}/ready-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/CustomOrderReadyController.java:149`

---
### `GET /get/customer/order/{orderId}`
- **Method**: `GET`
- **Path**: `/get/customer/order/{orderId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:141`

---
### `GET /get/super-user/order/{orderId}`
- **Method**: `GET`
- **Path**: `/get/super-user/order/{orderId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:167`

---
### `POST /add/order`
- **Method**: `POST`
- **Path**: `/add/order`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Orders`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:190`

---
### `PATCH /update/order/shipment`
- **Method**: `PATCH`
- **Path**: `/update/order/shipment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `OrderUpdateRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:219`

---
### `PATCH /update/order`
- **Method**: `PATCH`
- **Path**: `/update/order`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Orders`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:242`

---
### `PATCH /update/order/global-note`
- **Method**: `PATCH`
- **Path**: `/update/order/global-note`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `OrderGlobalNoteUpdateRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:276`

---
### `DELETE /cancel/order`
- **Method**: `DELETE`
- **Path**: `/cancel/order`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `OrderCancellationPayload`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:299`

---
### `DELETE /delete/order/{orderId}`
- **Method**: `DELETE`
- **Path**: `/delete/order/{orderId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:326`

---
### `POST /send/email/prepared-order`
- **Method**: `POST`
- **Path**: `/send/email/prepared-order`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `OrderPreparationRequest`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:345`

---
### `POST /send/email/confirmed-order/{orderId}`
- **Method**: `POST`
- **Path**: `/send/email/confirmed-order/{orderId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:374`

---
### `GET /get/customer/order-list/v2`
- **Method**: `GET`
- **Path**: `/get/customer/order-list/v2`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:399`

---
### `GET /get/customer/order-list/all`
- **Method**: `GET`
- **Path**: `/get/customer/order-list/all`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:426`

---
### `GET /get/customer/orders/status/processing`
- **Method**: `GET`
- **Path**: `/get/customer/orders/status/processing`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:453`

---
### `GET /get/data-dump/order`
- **Method**: `GET`
- **Path**: `/get/data-dump/order`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:478`

---
### `GET /get/data-dump/order-item`
- **Method**: `GET`
- **Path**: `/get/data-dump/order-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:495`

---
### `GET /get/table-explorer/data/order-item`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/order-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:512`

---
### `GET /get/table-explorer/data/order-item/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/order-item/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:533`

---
### `GET /get/table-explorer/data/orders`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/orders`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:553`

---
### `GET /get/table-explorer/data/order-review-scheduled-email/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/order-review-scheduled-email/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:574`

---
### `GET /get/table-explorer/data/order-review-scheduled-email`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/order-review-scheduled-email`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:594`

---
### `GET /get/table-explorer/data/orders/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/orders/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderController.java:615`

---
### `POST /add/order/fulfillment`
- **Method**: `POST`
- **Path**: `/add/order/fulfillment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `OrderFulfillmentRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderFulfillmentController.java:102`

---
### `PATCH /update/order/fulfillment`
- **Method**: `PATCH`
- **Path**: `/update/order/fulfillment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `OrderFulfillmentRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderFulfillmentController.java:133`

---
### `GET /get/super-user/order/{orderId}/fulfillment-list`
- **Method**: `GET`
- **Path**: `/get/super-user/order/{orderId}/fulfillment-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderFulfillmentController.java:164`

---
### `GET /get/customer/order/{orderId}/fulfillment-list`
- **Method**: `GET`
- **Path**: `/get/customer/order/{orderId}/fulfillment-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderFulfillmentController.java:191`

---
### `GET /get/table-explorer/data/order-item-fulfillment`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/order-item-fulfillment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderFulfillmentController.java:216`

---
### `GET /get/table-explorer/data/order-fulfillment`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/order-fulfillment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderFulfillmentController.java:237`

---
### `GET /get/table-explorer/data/order-fulfillment/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/order-fulfillment/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderFulfillmentController.java:258`

---
### `GET /get/customer/order-list`
- **Method**: `GET`
- **Path**: `/get/customer/order-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderPreviewController.java:74`

---
### `GET /get/super-user/order-list`
- **Method**: `GET`
- **Path**: `/get/super-user/order-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderPreviewController.java:97`

---
### `GET /get/super-user/order-list/search`
- **Method**: `GET`
- **Path**: `/get/super-user/order-list/search`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderPreviewController.java:136`

---
### `POST /add/order/ready`
- **Method**: `POST`
- **Path**: `/add/order/ready`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `OrderReadyRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderReadyController.java:87`

---
### `PATCH /update/order/ready`
- **Method**: `PATCH`
- **Path**: `/update/order/ready`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `OrderReadyRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderReadyController.java:118`

---
### `GET /get/super-user/order/{orderId}/ready-list`
- **Method**: `GET`
- **Path**: `/get/super-user/order/{orderId}/ready-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/order/controller/OrderReadyController.java:149`

---

## PATTERN MODULE (6 APIs)

### `GET /get/pattern-list`
- **Method**: `GET`
- **Path**: `/get/pattern-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/pattern/controller/PatternController.java:83`

---
### `POST /add/pattern`
- **Method**: `POST`
- **Path**: `/add/pattern`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Pattern`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/pattern/controller/PatternController.java:94`

---
### `GET /get/table-explorer/data/pattern`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/pattern`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/pattern/controller/PatternController.java:117`

---
### `PATCH /update/pattern`
- **Method**: `PATCH`
- **Path**: `/update/pattern`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Pattern`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/pattern/controller/PatternController.java:138`

---
### `DELETE /delete/pattern/{patternId}`
- **Method**: `DELETE`
- **Path**: `/delete/pattern/{patternId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `patternId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/pattern/controller/PatternController.java:161`

---
### `GET /get/table-explorer/data/pattern/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/pattern/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/pattern/controller/PatternController.java:180`

---

## PAYMENT MODULE (11 APIs)

### `POST /create/payment-session`
- **Method**: `POST`
- **Path**: `/create/payment-session`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `@NotNull`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/payment/controller/RazorpayPaymentController.java:104`

---
### `POST /update/payment/success`
- **Method**: `POST`
- **Path**: `/update/payment/success`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `@NotNull`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/payment/controller/RazorpayPaymentController.java:132`

---
### `POST /update/payment/failure`
- **Method**: `POST`
- **Path**: `/update/payment/failure`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `@NotNull`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/payment/controller/RazorpayPaymentController.java:162`

---
### `GET /get/data-dump/transaction`
- **Method**: `GET`
- **Path**: `/get/data-dump/transaction`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/payment/controller/RazorpayPaymentController.java:185`

---
### `POST /update/payment/transaction`
- **Method**: `POST`
- **Path**: `/update/payment/transaction`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `@NotNull`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/payment/controller/RazorpayPaymentController.java:202`

---
### `GET /get/table-explorer/data/razorpay-transaction`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/razorpay-transaction`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/payment/controller/RazorpayPaymentController.java:225`

---
### `GET /get/table-explorer/data/razorpay-transaction/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/razorpay-transaction/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/payment/controller/RazorpayPaymentController.java:246`

---
### `POST /create/stripe/payment-session`
- **Method**: `POST`
- **Path**: `/create/stripe/payment-session`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `@NotNull`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/payment/controller/StripePaymentController.java:79`

---
### `GET /get/table-explorer/data/stripe-transaction`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/stripe-transaction`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/payment/controller/StripePaymentController.java:107`

---
### `GET /get/table-explorer/data/stripe-transaction/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/stripe-transaction/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/payment/controller/StripePaymentController.java:128`

---
### `POST /checkout/stripe/webhook`
- **Method**: `POST`
- **Path**: `/checkout/stripe/webhook`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `String`
- **Response Type**: `ResponseEntity<String>`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/payment/webhook/controller/StripeWebhookController.java:113`

---

## PRODUCT MODULE (77 APIs)

### `GET /get/category/{categoryId}`
- **Method**: `GET`
- **Path**: `/get/category/{categoryId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `categoryId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/category/controller/CategoryController.java:82`

---
### `GET /get/category-list`
- **Method**: `GET`
- **Path**: `/get/category-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/product/category/controller/CategoryController.java:102`

---
### `POST /add/category`
- **Method**: `POST`
- **Path**: `/add/category`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/category/controller/CategoryController.java:119`

---
### `PATCH /update/category/{categoryId}`
- **Method**: `PATCH`
- **Path**: `/update/category/{categoryId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `categoryId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/category/controller/CategoryController.java:142`

---
### `GET /get/table-explorer/data/category`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/category`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/category/controller/CategoryController.java:166`

---
### `DELETE /delete/category/{categoryId}`
- **Method**: `DELETE`
- **Path**: `/delete/category/{categoryId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `categoryId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/category/controller/CategoryController.java:187`

---
### `GET /get/custom-product/{productId}`
- **Method**: `GET`
- **Path**: `/get/custom-product/{productId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `productId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/CustomProductController.java:76`

---
### `GET /get/custom-product`
- **Method**: `GET`
- **Path**: `/get/custom-product`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/CustomProductController.java:95`

---
### `POST /add/custom-product`
- **Method**: `POST`
- **Path**: `/add/custom-product`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomProduct`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/CustomProductController.java:111`

---
### `PATCH /update/custom-product`
- **Method**: `PATCH`
- **Path**: `/update/custom-product`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomProduct`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/CustomProductController.java:133`

---
### `GET /get/table-explorer/data/custom-product`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/custom-product`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/CustomProductController.java:161`

---
### `GET /get/fabric-product/{productId}`
- **Method**: `GET`
- **Path**: `/get/fabric-product/{productId}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `productId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/FabricProductController.java:120`

---
### `GET /get/fabric-product/slug/{productSlug}`
- **Method**: `GET`
- **Path**: `/get/fabric-product/slug/{productSlug}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `productSlug: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/FabricProductController.java:135`

---
### `GET /get/v2/fabric-product/slug/{productSlug}`
- **Method**: `GET`
- **Path**: `/get/v2/fabric-product/slug/{productSlug}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `productSlug: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/FabricProductController.java:148`

---
### `POST /add/fabric-product`
- **Method**: `POST`
- **Path**: `/add/fabric-product`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `FabricProduct`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/FabricProductController.java:159`

---
### `PATCH /update/fabric-product`
- **Method**: `PATCH`
- **Path**: `/update/fabric-product`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `FabricProduct`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/FabricProductController.java:187`

---
### `PATCH /disable/fabric-product`
- **Method**: `PATCH`
- **Path**: `/disable/fabric-product`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ProductDisableRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/FabricProductController.java:215`

---
### `POST /trigger/fabric-product/zoho-workflow`
- **Method**: `POST`
- **Path**: `/trigger/fabric-product/zoho-workflow`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ProductZohoTriggerData`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/FabricProductController.java:238`

---
### `GET /get/fabric-overview-list`
- **Method**: `GET`
- **Path**: `/get/fabric-overview-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/FabricProductController.java:267`

---
### `GET /get/table-explorer/data/fabric-product-data`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/fabric-product-data`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/FabricProductController.java:284`

---
### `GET /get/table-explorer/data/product-fabric`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/product-fabric`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/FabricProductController.java:305`

---
### `DELETE /delete/product-zoho-relation/{id}`
- **Method**: `DELETE`
- **Path**: `/delete/product-zoho-relation/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/FabricProductController.java:326`

---
### `GET /get/table-explorer/data/product-zoho-relation/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/product-zoho-relation/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/FabricProductController.java:347`

---
### `GET /get/table-explorer/data/product-zoho-relation`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/product-zoho-relation`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/FabricProductController.java:367`

---
### `GET /get/product-gist-list`
- **Method**: `GET`
- **Path**: `/get/product-gist-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/ProductController.java:87`

---
### `GET /get/related-products/id/{csv}`
- **Method**: `GET`
- **Path**: `/get/related-products/id/{csv}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `csv: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/ProductController.java:104`

---
### `GET /get/table-explorer/data/product/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/product/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/ProductController.java:117`

---
### `GET /get/table-explorer/data/product`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/product`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/ProductController.java:137`

---
### `GET /get/product-preview-list/{category}`
- **Method**: `GET`
- **Path**: `/get/product-preview-list/{category}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `category: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/ProductPreviewController.java:78`

---
### `GET /check/unique-product/sku/{sku}`
- **Method**: `GET`
- **Path**: `/check/unique-product/sku/{sku}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `sku: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/ProductPreviewController.java:91`

---
### `GET /check/unique-product/name/{name}`
- **Method**: `GET`
- **Path**: `/check/unique-product/name/{name}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `name: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/ProductPreviewController.java:105`

---
### `GET /get/product-preview-list/csv/{commaSeparatedCSVList}`
- **Method**: `GET`
- **Path**: `/get/product-preview-list/csv/{commaSeparatedCSVList}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `commaSeparatedCSVList: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/ProductPreviewController.java:119`

---
### `PATCH /update/bulk/product-price`
- **Method**: `PATCH`
- **Path**: `/update/bulk/product-price`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `BulkProductPriceUpdateRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/controller/ProductPreviewController.java:134`

---
### `GET /get/fabric-preview-list`
- **Method**: `GET`
- **Path**: `/get/fabric-preview-list`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `name: ( (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/product/controller/FabricPreviewController.java:65`

---
### `GET /get/finished-preview-list`
- **Method**: `GET`
- **Path**: `/get/finished-preview-list`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/product/controller/FinishedPreviewController.java:65`

---
### `GET /get/finished-product/{productId}`
- **Method**: `GET`
- **Path**: `/get/finished-product/{productId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `productId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/product/controller/FinishedProductController.java:106`

---
### `GET /get/finished-product/slug/{productSlug}`
- **Method**: `GET`
- **Path**: `/get/finished-product/slug/{productSlug}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `productSlug: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/product/controller/FinishedProductController.java:120`

---
### `POST /add/finished-product`
- **Method**: `POST`
- **Path**: `/add/finished-product`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `FinishedProduct`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/product/controller/FinishedProductController.java:134`

---
### `PATCH /update/finished-product`
- **Method**: `PATCH`
- **Path**: `/update/finished-product`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `FinishedProduct`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/product/controller/FinishedProductController.java:164`

---
### `PATCH /disable/finished-product`
- **Method**: `PATCH`
- **Path**: `/disable/finished-product`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ProductDisableRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/product/controller/FinishedProductController.java:194`

---
### `POST /trigger/finished-product/zoho-workflow`
- **Method**: `POST`
- **Path**: `/trigger/finished-product/zoho-workflow`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ProductZohoTriggerData`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/product/controller/FinishedProductController.java:217`

---
### `GET /get/table-explorer/data/product-finished`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/product-finished`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/product/controller/FinishedProductController.java:248`

---
### `GET /get/table-explorer/data/product-size-profile/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/product-size-profile/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/product/controller/FinishedProductController.java:269`

---
### `GET /get/table-explorer/data/product-size-profile`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/product-size-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/product/product/controller/FinishedProductController.java:289`

---
### `GET /get/segment/{segmentId}`
- **Method**: `GET`
- **Path**: `/get/segment/{segmentId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `segmentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/segment/controller/SegmentController.java:87`

---
### `GET /get/segment-list`
- **Method**: `GET`
- **Path**: `/get/segment-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/segment/controller/SegmentController.java:107`

---
### `POST /add/segment`
- **Method**: `POST`
- **Path**: `/add/segment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/segment/controller/SegmentController.java:124`

---
### `PATCH /update/segment/{segmentId}`
- **Method**: `PATCH`
- **Path**: `/update/segment/{segmentId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `segmentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/segment/controller/SegmentController.java:147`

---
### `DELETE /delete/segment/{segmentId}`
- **Method**: `DELETE`
- **Path**: `/delete/segment/{segmentId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `segmentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/segment/controller/SegmentController.java:171`

---
### `GET /get/table-explorer/data/segment`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/segment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/segment/controller/SegmentController.java:192`

---
### `GET /get/filter/segment-list`
- **Method**: `GET`
- **Path**: `/get/filter/segment-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/segment/controller/SegmentController.java:213`

---
### `GET /get/table-explorer/data/segment/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/segment/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/segment/controller/SegmentController.java:227`

---
### `GET /get/sku-group-list`
- **Method**: `GET`
- **Path**: `/get/sku-group-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/sku_group/controller/SkuGroupController.java:80`

---
### `POST /add/sku-group`
- **Method**: `POST`
- **Path**: `/add/sku-group`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `SkuGroup`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/product/sku_group/controller/SkuGroupController.java:98`

---
### `PATCH /update/sku-group`
- **Method**: `PATCH`
- **Path**: `/update/sku-group`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `SkuGroup`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/product/sku_group/controller/SkuGroupController.java:121`

---
### `GET /get/table-explorer/data/sku-group`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/sku-group`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/product/sku_group/controller/SkuGroupController.java:144`

---
### `GET /get/table-explorer/data/sku-group/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/sku-group/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/sku_group/controller/SkuGroupController.java:165`

---
### `DELETE /delete/sku-group/{groupId}`
- **Method**: `DELETE`
- **Path**: `/delete/sku-group/{groupId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `groupId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/sku_group/controller/SkuGroupController.java:185`

---
### `GET /get/table-explorer/data/special-status`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/special-status`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/product/special_status/controller/SpecialStatusController.java:80`

---
### `GET /get/special-status-list`
- **Method**: `GET`
- **Path**: `/get/special-status-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/special_status/controller/SpecialStatusController.java:101`

---
### `POST /add/special-status`
- **Method**: `POST`
- **Path**: `/add/special-status`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `SpecialStatus`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/product/special_status/controller/SpecialStatusController.java:119`

---
### `PATCH /update/special-status`
- **Method**: `PATCH`
- **Path**: `/update/special-status`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `SpecialStatus`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/product/special_status/controller/SpecialStatusController.java:142`

---
### `DELETE /delete/special-status/{statusId}`
- **Method**: `DELETE`
- **Path**: `/delete/special-status/{statusId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `statusId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/special_status/controller/SpecialStatusController.java:165`

---
### `GET /get/table-explorer/data/special-status/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/special-status/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/special_status/controller/SpecialStatusController.java:184`

---
### `GET /get/sub-category/{subCategoryId}`
- **Method**: `GET`
- **Path**: `/get/sub-category/{subCategoryId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `subCategoryId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/sub_category/controller/SubCategoryController.java:91`

---
### `POST /add/sub-category`
- **Method**: `POST`
- **Path**: `/add/sub-category`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/sub_category/controller/SubCategoryController.java:111`

---
### `PATCH /update/sub-category/{subCategoryId}`
- **Method**: `PATCH`
- **Path**: `/update/sub-category/{subCategoryId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `subCategoryId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/sub_category/controller/SubCategoryController.java:134`

---
### `DELETE /delete/sub-category/{subCategoryId}`
- **Method**: `DELETE`
- **Path**: `/delete/sub-category/{subCategoryId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `subCategoryId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/sub_category/controller/SubCategoryController.java:158`

---
### `GET /get/featured/{categoryName}/sub-category`
- **Method**: `GET`
- **Path**: `/get/featured/{categoryName}/sub-category`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `categoryName: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/product/sub_category/controller/SubCategoryController.java:179`

---
### `GET /get/table-explorer/data/sub-category`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/sub-category`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/sub_category/controller/SubCategoryController.java:193`

---
### `GET /get/table-explorer/data/sub-category/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/sub-category/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/sub_category/controller/SubCategoryController.java:214`

---
### `GET /get/sub-category-list`
- **Method**: `GET`
- **Path**: `/get/sub-category-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/sub_category/controller/SubCategoryPreviewController.java:69`

---
### `GET /get/tag-list`
- **Method**: `GET`
- **Path**: `/get/tag-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/tag/controller/TagController.java:80`

---
### `POST /add/tag`
- **Method**: `POST`
- **Path**: `/add/tag`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Tag`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/product/tag/controller/TagController.java:98`

---
### `GET /get/table-explorer/data/tag`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/tag`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/product/tag/controller/TagController.java:121`

---
### `GET /get/table-explorer/data/tag/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/tag/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/product/tag/controller/TagController.java:142`

---
### `PATCH /update/tag`
- **Method**: `PATCH`
- **Path**: `/update/tag`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Tag`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/product/tag/controller/TagController.java:162`

---

## PROFILE MODULE (73 APIs)

### `GET /get/badge-profile-list`
- **Method**: `GET`
- **Path**: `/get/badge-profile-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/badge/controller/BadgeProfileController.java:90`

---
### `GET /get/badge-profile/{profileId}`
- **Method**: `GET`
- **Path**: `/get/badge-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/badge/controller/BadgeProfileController.java:107`

---
### `POST /add/badge-profile`
- **Method**: `POST`
- **Path**: `/add/badge-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/badge/controller/BadgeProfileController.java:127`

---
### `PATCH /update/badge-profile/{profileId}`
- **Method**: `PATCH`
- **Path**: `/update/badge-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/badge/controller/BadgeProfileController.java:150`

---
### `DELETE /delete/badge-profile/{profileId}`
- **Method**: `DELETE`
- **Path**: `/delete/badge-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/badge/controller/BadgeProfileController.java:174`

---
### `GET /get/table-explorer/data/badge-profile`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/badge-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/badge/controller/BadgeProfileController.java:193`

---
### `GET /get/table-explorer/data/badge-profile-item`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/badge-profile-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/badge/controller/BadgeProfileController.java:214`

---
### `GET /get/table-explorer/data/badge-profile/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/badge-profile/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/badge/controller/BadgeProfileController.java:235`

---
### `GET /get/table-explorer/data/badge-profile-item/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/badge-profile-item/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/badge/controller/BadgeProfileController.java:255`

---
### `GET /get/custom-size-profile-list`
- **Method**: `GET`
- **Path**: `/get/custom-size-profile-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/custom_size/controller/CustomSizeProfileController.java:97`

---
### `GET /get/custom-size-profile/{profileId}`
- **Method**: `GET`
- **Path**: `/get/custom-size-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/custom_size/controller/CustomSizeProfileController.java:114`

---
### `POST /add/custom-size-profile`
- **Method**: `POST`
- **Path**: `/add/custom-size-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomSizeProfile`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/custom_size/controller/CustomSizeProfileController.java:134`

---
### `PATCH /update/custom-size-profile`
- **Method**: `PATCH`
- **Path**: `/update/custom-size-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `CustomSizeProfile`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/custom_size/controller/CustomSizeProfileController.java:157`

---
### `DELETE /delete/custom-size-profile/{profileId}`
- **Method**: `DELETE`
- **Path**: `/delete/custom-size-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/custom_size/controller/CustomSizeProfileController.java:180`

---
### `GET /get/table-explorer/data/custom-size-profile`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/custom-size-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/custom_size/controller/CustomSizeProfileController.java:199`

---
### `GET /get/table-explorer/data/custom-size-profile-item/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/custom-size-profile-item/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/custom_size/controller/CustomSizeProfileController.java:220`

---
### `GET /get/table-explorer/data/custom-size-profile-item`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/custom-size-profile-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/custom_size/controller/CustomSizeProfileController.java:240`

---
### `GET /get/table-explorer/data/custom-size-profile/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/custom-size-profile/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/custom_size/controller/CustomSizeProfileController.java:261`

---
### `GET /get/fabric-profile-list`
- **Method**: `GET`
- **Path**: `/get/fabric-profile-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/fabric/controller/FabricProfileController.java:85`

---
### `GET /get/fabric-profile/{profileId}`
- **Method**: `GET`
- **Path**: `/get/fabric-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/fabric/controller/FabricProfileController.java:102`

---
### `POST /add/fabric-profile`
- **Method**: `POST`
- **Path**: `/add/fabric-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `FabricProfile`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/fabric/controller/FabricProfileController.java:122`

---
### `PATCH /update/fabric-profile/{profileId}`
- **Method**: `PATCH`
- **Path**: `/update/fabric-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `FabricProfile`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/fabric/controller/FabricProfileController.java:145`

---
### `DELETE /delete/fabric-profile/{profileId}`
- **Method**: `DELETE`
- **Path**: `/delete/fabric-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/fabric/controller/FabricProfileController.java:169`

---
### `GET /get/table-explorer/data/fabric-profile`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/fabric-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/fabric/controller/FabricProfileController.java:188`

---
### `GET /get/table-explorer/data/fabric-profile/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/fabric-profile/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/fabric/controller/FabricProfileController.java:209`

---
### `DELETE /delete/fabric-profile-item/{profileItemId}`
- **Method**: `DELETE`
- **Path**: `/delete/fabric-profile-item/{profileItemId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileItemId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/fabric/controller/FabricProfileItemController.java:79`

---
### `GET /get/table-explorer/data/fabric-profile-item/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/fabric-profile-item/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/fabric/controller/FabricProfileItemController.java:97`

---
### `GET /get/table-explorer/data/fabric-profile-item`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/fabric-profile-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/fabric/controller/FabricProfileItemController.java:117`

---
### `GET /get/finish-profile-list`
- **Method**: `GET`
- **Path**: `/get/finish-profile-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/finish/controller/FinishProfileController.java:85`

---
### `GET /get/finish-profile/{profileId}`
- **Method**: `GET`
- **Path**: `/get/finish-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/finish/controller/FinishProfileController.java:102`

---
### `POST /add/finish-profile`
- **Method**: `POST`
- **Path**: `/add/finish-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/finish/controller/FinishProfileController.java:122`

---
### `PATCH /update/finish-profile/{profileId}`
- **Method**: `PATCH`
- **Path**: `/update/finish-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/finish/controller/FinishProfileController.java:145`

---
### `DELETE /delete/finish-profile/{profileId}`
- **Method**: `DELETE`
- **Path**: `/delete/finish-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/finish/controller/FinishProfileController.java:169`

---
### `GET /get/table-explorer/data/finish-profile`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/finish-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/finish/controller/FinishProfileController.java:188`

---
### `GET /get/table-explorer/data/finish-profile/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/finish-profile/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/finish/controller/FinishProfileController.java:209`

---
### `DELETE /delete/finish-profile-item/{finishItemId}`
- **Method**: `DELETE`
- **Path**: `/delete/finish-profile-item/{finishItemId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `finishItemId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/finish/controller/FinishProfileItemController.java:88`

---
### `GET /get/table-explorer/data/finish-profile-item/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/finish-profile-item/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/finish/controller/FinishProfileItemController.java:110`

---
### `GET /get/table-explorer/data/finish-profile-item`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/finish-profile-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/finish/controller/FinishProfileItemController.java:130`

---
### `GET /get/usage/finish-profile-item/{finishItemId}`
- **Method**: `GET`
- **Path**: `/get/usage/finish-profile-item/{finishItemId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `finishItemId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/finish/controller/FinishProfileItemController.java:151`

---
### `GET /get/made-to-order-profile-list`
- **Method**: `GET`
- **Path**: `/get/made-to-order-profile-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/made_to_order/controller/MadeToOrderProfileController.java:82`

---
### `GET /get/made-to-order-profile/{profileId}`
- **Method**: `GET`
- **Path**: `/get/made-to-order-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/made_to_order/controller/MadeToOrderProfileController.java:99`

---
### `POST /add/made-to-order-profile`
- **Method**: `POST`
- **Path**: `/add/made-to-order-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `MadeToOrderProfile`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/made_to_order/controller/MadeToOrderProfileController.java:119`

---
### `PATCH /update/made-to-order-profile`
- **Method**: `PATCH`
- **Path**: `/update/made-to-order-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `MadeToOrderProfile`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/made_to_order/controller/MadeToOrderProfileController.java:142`

---
### `DELETE /delete/made-to-order-profile/{profileId}`
- **Method**: `DELETE`
- **Path**: `/delete/made-to-order-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/made_to_order/controller/MadeToOrderProfileController.java:165`

---
### `GET /get/table-explorer/data/made-to-order-profile`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/made-to-order-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/made_to_order/controller/MadeToOrderProfileController.java:184`

---
### `GET /get/table-explorer/data/made-to-order-profile/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/made-to-order-profile/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/made_to_order/controller/MadeToOrderProfileController.java:205`

---
### `GET /get/size-profile/{profileId}`
- **Method**: `GET`
- **Path**: `/get/size-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileController.java:88`

---
### `GET /get/size-profile-list`
- **Method**: `GET`
- **Path**: `/get/size-profile-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileController.java:108`

---
### `POST /add/size-profile`
- **Method**: `POST`
- **Path**: `/add/size-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileController.java:127`

---
### `PATCH /update/size-profile/{profileId}`
- **Method**: `PATCH`
- **Path**: `/update/size-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileController.java:151`

---
### `GET /get/table-explorer/data/size-profile`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/size-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileController.java:175`

---
### `DELETE /delete/size-profile/{profileId}`
- **Method**: `DELETE`
- **Path**: `/delete/size-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileController.java:196`

---
### `GET /get/table-explorer/data/size-profile/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/size-profile/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileController.java:216`

---
### `GET /get/table-explorer/data/size-profile-guide/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/size-profile-guide/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileGuideController.java:79`

---
### `GET /get/table-explorer/data/size-profile-guide`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/size-profile-guide`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileGuideController.java:99`

---
### `POST /add/size-profile-guide`
- **Method**: `POST`
- **Path**: `/add/size-profile-guide`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `SizeProfileGuide`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileGuideController.java:120`

---
### `PATCH /update/size-profile-guide`
- **Method**: `PATCH`
- **Path**: `/update/size-profile-guide`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `SizeProfileGuide`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileGuideController.java:143`

---
### `DELETE /delete/size-profile-guide/{sizeProfileGuideId}`
- **Method**: `DELETE`
- **Path**: `/delete/size-profile-guide/{sizeProfileGuideId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `sizeProfileGuideId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileGuideController.java:166`

---
### `GET /get/table-explorer/data/size-profile-option/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/size-profile-option/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileOptionController.java:88`

---
### `GET /get/table-explorer/data/size-profile-option`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/size-profile-option`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileOptionController.java:108`

---
### `POST /add/size-profile-option`
- **Method**: `POST`
- **Path**: `/add/size-profile-option`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `SizeProfileOption`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileOptionController.java:129`

---
### `PATCH /update/size-profile-option`
- **Method**: `PATCH`
- **Path**: `/update/size-profile-option`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `SizeProfileOption`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileOptionController.java:153`

---
### `DELETE /delete/size-profile-option/{sizeProfileOptionId}`
- **Method**: `DELETE`
- **Path**: `/delete/size-profile-option/{sizeProfileOptionId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `sizeProfileOptionId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileOptionController.java:176`

---
### `GET /get/usage/size-profile-option/{sizeProfileOptionId}`
- **Method**: `GET`
- **Path**: `/get/usage/size-profile-option/{sizeProfileOptionId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `sizeProfileOptionId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/size_profile/controller/SizeProfileOptionController.java:198`

---
### `GET /get/volume-discount-profile-list`
- **Method**: `GET`
- **Path**: `/get/volume-discount-profile-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/volume_discount/controller/VolumeDiscountProfileController.java:99`

---
### `GET /get/volume-discount-profile/{profileId}`
- **Method**: `GET`
- **Path**: `/get/volume-discount-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/volume_discount/controller/VolumeDiscountProfileController.java:116`

---
### `POST /add/volume-discount-profile`
- **Method**: `POST`
- **Path**: `/add/volume-discount-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `VolumeDiscountProfile`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/volume_discount/controller/VolumeDiscountProfileController.java:136`

---
### `PATCH /update/volume-discount-profile`
- **Method**: `PATCH`
- **Path**: `/update/volume-discount-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `VolumeDiscountProfile`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/volume_discount/controller/VolumeDiscountProfileController.java:159`

---
### `DELETE /delete/volume-discount-profile/{profileId}`
- **Method**: `DELETE`
- **Path**: `/delete/volume-discount-profile/{profileId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `profileId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/volume_discount/controller/VolumeDiscountProfileController.java:182`

---
### `GET /get/table-explorer/data/volume-discount-profile`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/volume-discount-profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/volume_discount/controller/VolumeDiscountProfileController.java:201`

---
### `GET /get/table-explorer/data/volume-discount-profile-item/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/volume-discount-profile-item/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/volume_discount/controller/VolumeDiscountProfileController.java:222`

---
### `GET /get/table-explorer/data/volume-discount-profile/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/volume-discount-profile/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/volume_discount/controller/VolumeDiscountProfileController.java:242`

---
### `GET /get/table-explorer/data/volume-discount-profile-item`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/volume-discount-profile-item`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/profile/volume_discount/controller/VolumeDiscountProfileController.java:262`

---

## REPORT MODULE (1 APIs)

### `POST /download/report/{type}`
- **Method**: `POST`
- **Path**: `/download/report/{type}`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `type: String (path)`
- **Request Body**: `ReportConfig`
- **Response Type**: `ResponseEntity<StreamingResponseBody>`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/report/controller/ReportController.java:68`

---

## REVIEW MODULE (10 APIs)

### `GET /get/review/stats`
- **Method**: `GET`
- **Path**: `/get/review/stats`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/review/controller/ReviewController.java:88`

---
### `GET /get/review/{reviewId}`
- **Method**: `GET`
- **Path**: `/get/review/{reviewId}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `reviewId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/review/controller/ReviewController.java:101`

---
### `GET /get/customer/review`
- **Method**: `GET`
- **Path**: `/get/customer/review`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/review/controller/ReviewController.java:115`

---
### `GET /get/product/review/{productId}`
- **Method**: `GET`
- **Path**: `/get/product/review/{productId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `productId: Long (path), =: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/review/controller/ReviewController.java:133`

---
### `GET /get/super-user/review`
- **Method**: `GET`
- **Path**: `/get/super-user/review`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/review/controller/ReviewController.java:153`

---
### `GET /get/table-explorer/data/review`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/review`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/review/controller/ReviewController.java:179`

---
### `POST /add/review`
- **Method**: `POST`
- **Path**: `/add/review`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Review`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/review/controller/ReviewController.java:200`

---
### `PATCH /update/customer/review`
- **Method**: `PATCH`
- **Path**: `/update/customer/review`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Review`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/review/controller/ReviewController.java:223`

---
### `PATCH /update/super-user/review`
- **Method**: `PATCH`
- **Path**: `/update/super-user/review`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Review`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/review/controller/ReviewController.java:246`

---
### `GET /get/table-explorer/data/review/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/review/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/review/controller/ReviewController.java:269`

---

## SEARCH MODULE (9 APIs)

### `GET /reindex/vector`
- **Method**: `GET`
- **Path**: `/reindex/vector`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/search/controller/AISearchController.java:113`

---
### `GET /reindex/vector/blog`
- **Method**: `GET`
- **Path**: `/reindex/vector/blog`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/search/controller/AISearchController.java:144`

---
### `GET /reindex/vector/story`
- **Method**: `GET`
- **Path**: `/reindex/vector/story`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/search/controller/AISearchController.java:175`

---
### `GET /search/ai/{keyword}`
- **Method**: `GET`
- **Path**: `/search/ai/{keyword}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `keyword: String (path), =: (required (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/search/controller/AISearchController.java:196`

---
### `GET /search/ai/blog/{keyword}`
- **Method**: `GET`
- **Path**: `/search/ai/blog/{keyword}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `keyword: String (path), =: (required (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/search/controller/AISearchController.java:236`

---
### `GET /search/ai/story/{keyword}`
- **Method**: `GET`
- **Path**: `/search/ai/story/{keyword}`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `keyword: String (path), =: (required (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/search/controller/AISearchController.java:272`

---
### `GET /reindex`
- **Method**: `GET`
- **Path**: `/reindex`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/search/controller/SearchController.java:83`

---
### `GET /get/search/result/{keyword}`
- **Method**: `GET`
- **Path**: `/get/search/result/{keyword}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `keyword: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/search/controller/SearchController.java:101`

---
### `GET /get/v2/search/result/{keyword}`
- **Method**: `GET`
- **Path**: `/get/v2/search/result/{keyword}`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `keyword: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/search/controller/SearchController.java:120`

---

## SEO MODULE (5 APIs)

### `GET /get/table-explorer/data/product-image-gallery-seo`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/product-image-gallery-seo`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/seo/controller/ProductImageGallerySEOController.java:80`

---
### `POST /modify/gallery-images`
- **Method**: `POST`
- **Path**: `/modify/gallery-images`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ProductImageGallerySEOPayload`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/seo/controller/ProductImageGallerySEOController.java:101`

---
### `GET /get/product-seo-list`
- **Method**: `GET`
- **Path**: `/get/product-seo-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/seo/controller/SeoController.java:77`

---
### `GET /get/article-seo-list`
- **Method**: `GET`
- **Path**: `/get/article-seo-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/seo/controller/SeoController.java:96`

---
### `GET /get/filter-seo/{code}/{name}`
- **Method**: `GET`
- **Path**: `/get/filter-seo/{code}/{name}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `code: String (path), name: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/seo/controller/SeoController.java:115`

---

## SETTINGS MODULE (5 APIs)

### `GET /get/settings-list`
- **Method**: `GET`
- **Path**: `/get/settings-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/settings/controller/SettingsController.java:80`

---
### `GET /get/settings/{settingId}`
- **Method**: `GET`
- **Path**: `/get/settings/{settingId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `settingId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/settings/controller/SettingsController.java:93`

---
### `PATCH /update/settings`
- **Method**: `PATCH`
- **Path**: `/update/settings`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Settings`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/settings/controller/SettingsController.java:113`

---
### `GET /get/table-explorer/data/settings`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/settings`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/settings/controller/SettingsController.java:136`

---
### `GET /get/table-explorer/data/settings/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/settings/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/settings/controller/SettingsController.java:157`

---

## SHIPMENT MODULE (7 APIs)

### `GET /get/shipment-list`
- **Method**: `GET`
- **Path**: `/get/shipment-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/shipment/controller/ShipmentController.java:80`

---
### `GET /get/shipment/{shipmentId}`
- **Method**: `GET`
- **Path**: `/get/shipment/{shipmentId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `shipmentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/shipment/controller/ShipmentController.java:99`

---
### `POST /add/shipment`
- **Method**: `POST`
- **Path**: `/add/shipment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Shipment`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/shipment/controller/ShipmentController.java:119`

---
### `PATCH /update/shipment`
- **Method**: `PATCH`
- **Path**: `/update/shipment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Shipment`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/shipment/controller/ShipmentController.java:142`

---
### `GET /get/table-explorer/data/shipment`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/shipment`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/shipment/controller/ShipmentController.java:165`

---
### `DELETE /delete/shipment/{shipmentId}`
- **Method**: `DELETE`
- **Path**: `/delete/shipment/{shipmentId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `shipmentId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/shipment/controller/ShipmentController.java:186`

---
### `GET /get/table-explorer/data/shipment/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/shipment/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/shipment/controller/ShipmentController.java:205`

---

## SITEMAP MODULE (2 APIs)

### `GET /get/product/image-sitemap`
- **Method**: `GET`
- **Path**: `/get/product/image-sitemap`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/sitemap/controller/ProductImageSitemapController.java:88`

---
### `GET /get/product/enabled-image-sitemap`
- **Method**: `GET`
- **Path**: `/get/product/enabled-image-sitemap`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/sitemap/controller/ProductImageSitemapController.java:107`

---

## SKILL MODULE (6 APIs)

### `GET /get/skills`
- **Method**: `GET`
- **Path**: `/get/skills`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/skill/controller/SkillController.java:81`

---
### `POST /add/skill`
- **Method**: `POST`
- **Path**: `/add/skill`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SUCU (Super User & Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Skill`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/skill/controller/SkillController.java:98`

---
### `PATCH /update/skill`
- **Method**: `PATCH`
- **Path**: `/update/skill`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Skill`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/skill/controller/SkillController.java:121`

---
### `DELETE /delete/skill/{skillId}`
- **Method**: `DELETE`
- **Path**: `/delete/skill/{skillId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `skillId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/skill/controller/SkillController.java:144`

---
### `GET /get/table-explorer/data/skill`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/skill`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/skill/controller/SkillController.java:165`

---
### `GET /get/table-explorer/data/skill/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/skill/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/skill/controller/SkillController.java:186`

---

## TABLE EXPLORER MODULE (1 APIs)

### `GET /get/table-explorer/tables`
- **Method**: `GET`
- **Path**: `/get/table-explorer/tables`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/table_explorer/controller/TableExplorerController.java:58`

---

## TENANT MODULE (26 APIs)

### `GET /get/customer/profile`
- **Method**: `GET`
- **Path**: `/get/customer/profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:115`

---
### `GET /get/customers`
- **Method**: `GET`
- **Path**: `/get/customers`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:136`

---
### `POST /customer/registration/email`
- **Method**: `POST`
- **Path**: `/customer/registration/email`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Customer`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:153`

---
### `POST /customer/registration/social`
- **Method**: `POST`
- **Path**: `/customer/registration/social`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Customer`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:174`

---
### `PATCH /update/customer/profile`
- **Method**: `PATCH`
- **Path**: `/update/customer/profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Customer`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:195`

---
### `PUT /manage/wishlist/{commaSeparatedSkuList}`
- **Method**: `PUT`
- **Path**: `/manage/wishlist/{commaSeparatedSkuList}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `commaSeparatedSkuList: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:223`

---
### `GET /get/loyalty-eligible/customers`
- **Method**: `GET`
- **Path**: `/get/loyalty-eligible/customers`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `=: (required (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:250`

---
### `GET /get/loyalty-program/customers/metrics`
- **Method**: `GET`
- **Path**: `/get/loyalty-program/customers/metrics`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `=: (required (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:277`

---
### `GET /get/data-dump/customer`
- **Method**: `GET`
- **Path**: `/get/data-dump/customer`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:300`

---
### `GET /get/table-explorer/data/customer`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/customer`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:317`

---
### `GET /get/customers/whatsapp-status`
- **Method**: `GET`
- **Path**: `/get/customers/whatsapp-status`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:351`

---
### `GET /get/table-explorer/data/customer/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/customer/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:368`

---
### `PATCH /customer/whatsapp/opt-in`
- **Method**: `PATCH`
- **Path**: `/customer/whatsapp/opt-in`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `WhatsAppOptInRequest`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_METHOD`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:388`

---
### `PATCH /customer/whatsapp/dismiss`
- **Method**: `PATCH`
- **Path**: `/customer/whatsapp/dismiss`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_METHOD`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:416`

---
### `PATCH /customer/whatsapp/opt-out`
- **Method**: `PATCH`
- **Path**: `/customer/whatsapp/opt-out`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_WRONG_METHOD`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/CustomerController.java:436`

---
### `POST /super-user/registration`
- **Method**: `POST`
- **Path**: `/super-user/registration`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/SuperUserController.java:105`

---
### `GET /get/super-user/profile`
- **Method**: `GET`
- **Path**: `/get/super-user/profile`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/SuperUserController.java:131`

---
### `GET /get/table-explorer/data/super-user`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/super-user`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/SuperUserController.java:152`

---
### `GET /get/table-explorer/data/user-role/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/user-role/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/SuperUserController.java:173`

---
### `GET /get/table-explorer/data/user-role`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/user-role`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_AND_MATCHING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/SuperUserController.java:193`

---
### `GET /get/table-explorer/data/super-user/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/super-user/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/SuperUserController.java:214`

---
### `GET /get/tenant/profile/{uId}`
- **Method**: `GET`
- **Path**: `/get/tenant/profile/{uId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `uId: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/TenantController.java:80`

---
### `POST /check-email/tenant`
- **Method**: `POST`
- **Path**: `/check-email/tenant`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `EmailPayload`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/TenantController.java:100`

---
### `GET /get/data-dump/tenant`
- **Method**: `GET`
- **Path**: `/get/data-dump/tenant`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/TenantController.java:121`

---
### `GET /get/table-explorer/data/loom-tenant`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/loom-tenant`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query), =: (defaultValue (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/TenantController.java:138`

---
### `GET /get/table-explorer/data/loom-tenant/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/loom-tenant/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path), =: (defaultValue (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/tenant/controller/TenantController.java:161`

---

## UTILITY MODULE (2 APIs)

### `GET /users/users`
- **Method**: `GET`
- **Path**: `/users/users`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/utility/annotation/TrimRequestController.java:24`

---
### `POST /users`
- **Method**: `POST`
- **Path**: `/users`
- **Auth Required**: NO
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `NOT IDENTIFIED FROM SOURCE`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/utility/annotation/TrimRequestController.java:27`

---

## WORKFLOW MODULE (66 APIs)

### `GET /get/custom-workflow-list/{status}`
- **Method**: `GET`
- **Path**: `/get/custom-workflow-list/{status}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `status: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/CustomWorkflowController.java:104`

---
### `GET /get/artisan/custom-workflow-list/{status}`
- **Method**: `GET`
- **Path**: `/get/artisan/custom-workflow-list/{status}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `status: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/CustomWorkflowController.java:124`

---
### `GET /get/custom-order/{orderId}/workflow-list`
- **Method**: `GET`
- **Path**: `/get/custom-order/{orderId}/workflow-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/CustomWorkflowController.java:156`

---
### `GET /get/custom-workflow/{workflowId}`
- **Method**: `GET`
- **Path**: `/get/custom-workflow/{workflowId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `workflowId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/CustomWorkflowController.java:176`

---
### `POST /add/custom-workflow`
- **Method**: `POST`
- **Path**: `/add/custom-workflow`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Workflow`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/CustomWorkflowController.java:196`

---
### `PATCH /update/custom-workflow`
- **Method**: `PATCH`
- **Path**: `/update/custom-workflow`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Workflow`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/CustomWorkflowController.java:233`

---
### `GET /get/custom-order/{orderId}/workflow/{orderItemId}`
- **Method**: `GET`
- **Path**: `/get/custom-order/{orderId}/workflow/{orderItemId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `orderId: Long (path), orderItemId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/CustomWorkflowController.java:263`

---
### `GET /get/table-explorer/data/workflow-custom-order-mapping`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/workflow-custom-order-mapping`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/CustomWorkflowController.java:290`

---
### `GET /get/table-explorer/data/workflow-custom-order-mapping/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/workflow-custom-order-mapping/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/CustomWorkflowController.java:311`

---
### `GET /get/element/feedback`
- **Method**: `GET`
- **Path**: `/get/element/feedback`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/ElementFeedbackController.java:97`

---
### `GET /get/custom-workflow/element/feedback`
- **Method**: `GET`
- **Path**: `/get/custom-workflow/element/feedback`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/ElementFeedbackController.java:122`

---
### `GET /get/element/feedback/{feedbackId}`
- **Method**: `GET`
- **Path**: `/get/element/feedback/{feedbackId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `feedbackId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/ElementFeedbackController.java:147`

---
### `POST /add/element/feedback`
- **Method**: `POST`
- **Path**: `/add/element/feedback`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ElementFeedback`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/ElementFeedbackController.java:166`

---
### `PATCH /update/element/feedback`
- **Method**: `PATCH`
- **Path**: `/update/element/feedback`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ElementFeedback`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/ElementFeedbackController.java:196`

---
### `POST /add/artisan/element/feedback`
- **Method**: `POST`
- **Path**: `/add/artisan/element/feedback`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/ElementFeedbackController.java:226`

---
### `PATCH /update/artisan/element/feedback`
- **Method**: `PATCH`
- **Path**: `/update/artisan/element/feedback`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `=: (name (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/ElementFeedbackController.java:269`

---
### `PATCH /update/element/feedback/admin`
- **Method**: `PATCH`
- **Path**: `/update/element/feedback/admin`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ElementFeedbackPreview`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/ElementFeedbackController.java:312`

---
### `GET /get/table-explorer/data/element-feedback`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/element-feedback`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/ElementFeedbackController.java:343`

---
### `GET /get/table-explorer/data/element-feedback/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/element-feedback/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/ElementFeedbackController.java:364`

---
### `GET /get/step-element/{stepId}/artisan-assignments`
- **Method**: `GET`
- **Path**: `/get/step-element/{stepId}/artisan-assignments`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `stepId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementArtisanAssignmentController.java:76`

---
### `GET /get/table-explorer/data/step-element-artisan-mapping`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/step-element-artisan-mapping`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementArtisanAssignmentController.java:96`

---
### `PATCH /update/step-element/artisan-assignments`
- **Method**: `PATCH`
- **Path**: `/update/step-element/artisan-assignments`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ElementArtisanAssignmentUpdate`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementArtisanAssignmentController.java:116`

---
### `GET /get/artisan/step-element-list/{status}`
- **Method**: `GET`
- **Path**: `/get/artisan/step-element-list/{status}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `status: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementController.java:106`

---
### `PATCH /update/step-element`
- **Method**: `PATCH`
- **Path**: `/update/step-element`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `StepElement`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementController.java:137`

---
### `GET /get/table-explorer/data/step-element`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/step-element`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementController.java:165`

---
### `GET /get/table-explorer/data/element/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/element/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementController.java:186`

---
### `GET /get/table-explorer/data/element`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/element`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementController.java:206`

---
### `POST /add/step-element-template`
- **Method**: `POST`
- **Path**: `/add/step-element-template`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `StepElementTemplate`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementTemplateController.java:91`

---
### `PATCH /update/step-element-template`
- **Method**: `PATCH`
- **Path**: `/update/step-element-template`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `StepElementTemplate`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementTemplateController.java:119`

---
### `DELETE /delete/step-element-template/{templateId}`
- **Method**: `DELETE`
- **Path**: `/delete/step-element-template/{templateId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `templateId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementTemplateController.java:147`

---
### `GET /get/table-explorer/data/step-element-template`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/step-element-template`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementTemplateController.java:166`

---
### `GET /get/table-explorer/data/element-template/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/element-template/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementTemplateController.java:187`

---
### `GET /get/table-explorer/data/step-element-template/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/step-element-template/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementTemplateController.java:207`

---
### `GET /get/table-explorer/data/element-template`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/element-template`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/StepElementTemplateController.java:227`

---
### `GET /get/subprocess-element/{subProcessId}/artisan-assignments`
- **Method**: `GET`
- **Path**: `/get/subprocess-element/{subProcessId}/artisan-assignments`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `subProcessId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/SubProcessElementArtisanAssignmentController.java:76`

---
### `GET /get/table-explorer/data/subprocess-element-artisan-mapping`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/subprocess-element-artisan-mapping`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/SubProcessElementArtisanAssignmentController.java:96`

---
### `PATCH /update/subprocess-element/artisan-assignments`
- **Method**: `PATCH`
- **Path**: `/update/subprocess-element/artisan-assignments`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `ElementArtisanAssignmentUpdate`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/SubProcessElementArtisanAssignmentController.java:116`

---
### `GET /get/artisan/subprocess-element-list/{status}`
- **Method**: `GET`
- **Path**: `/get/artisan/subprocess-element-list/{status}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `status: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/SubProcessElementController.java:89`

---
### `PATCH /update/subprocess-element`
- **Method**: `PATCH`
- **Path**: `/update/subprocess-element`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `SubProcessElement`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/SubProcessElementController.java:120`

---
### `GET /get/table-explorer/data/sub-process-element`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/sub-process-element`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/SubProcessElementController.java:145`

---
### `POST /add/subprocess-element-template`
- **Method**: `POST`
- **Path**: `/add/subprocess-element-template`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `SubProcessElementTemplate`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/SubProcessElementTemplateController.java:75`

---
### `PATCH /update/subprocess-element-template`
- **Method**: `PATCH`
- **Path**: `/update/subprocess-element-template`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `SubProcessElementTemplate`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/SubProcessElementTemplateController.java:100`

---
### `GET /get/table-explorer/data/subprocess-element-template`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/subprocess-element-template`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/SubProcessElementTemplateController.java:125`

---
### `DELETE /delete/subprocess-element-template/{templateId}`
- **Method**: `DELETE`
- **Path**: `/delete/subprocess-element-template/{templateId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `templateId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/SubProcessElementTemplateController.java:146`

---
### `GET /get/workflow-list/{status}`
- **Method**: `GET`
- **Path**: `/get/workflow-list/{status}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `status: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:135`

---
### `GET /get/artisan/workflow-list/{status}`
- **Method**: `GET`
- **Path**: `/get/artisan/workflow-list/{status}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `status: String (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:155`

---
### `GET /get/artisan/workflow/dashboard`
- **Method**: `GET`
- **Path**: `/get/artisan/workflow/dashboard`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:187`

---
### `GET /get/artisan/workflow/{workflowId}/assigned-element-details`
- **Method**: `GET`
- **Path**: `/get/artisan/workflow/{workflowId}/assigned-element-details`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `workflowId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:245`

---
### `GET /get/artisan/custom-workflow/{workflowId}/assigned-element-details`
- **Method**: `GET`
- **Path**: `/get/artisan/custom-workflow/{workflowId}/assigned-element-details`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `workflowId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:245`

---
### `GET /get/master/{masterId}/worker/{artisanId}/bpm-details`
- **Method**: `GET`
- **Path**: `/get/master/{masterId}/worker/{artisanId}/bpm-details`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_AR (Artisan User)`
- **Request Parameters**: `masterId: Long (path), artisanId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:281`

---
### `GET /get/master/{masterId}/worker/{artisanId}/workflow/{workflowId}/assigned-element-details`
- **Method**: `GET`
- **Path**: `/get/master/{masterId}/worker/{artisanId}/workflow/{workflowId}/assigned-element-details`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `masterId: Long (path), artisanId: Long (path), workflowId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:313`

---
### `GET /get/order/{orderId}/workflow-list`
- **Method**: `GET`
- **Path**: `/get/order/{orderId}/workflow-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `orderId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:348`

---
### `GET /get/workflow/{workflowId}`
- **Method**: `GET`
- **Path**: `/get/workflow/{workflowId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `workflowId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:368`

---
### `POST /add/workflow`
- **Method**: `POST`
- **Path**: `/add/workflow`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Workflow`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:388`

---
### `PATCH /update/workflow`
- **Method**: `PATCH`
- **Path**: `/update/workflow`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `Workflow`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:425`

---
### `GET /get/order/{orderId}/workflow/{orderItemId}`
- **Method**: `GET`
- **Path**: `/get/order/{orderId}/workflow/{orderItemId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_CU (Customer User)`
- **Request Parameters**: `orderId: Long (path), orderItemId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:462`

---
### `GET /get/table-explorer/data/workflow`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/workflow`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_WRONG_PATH`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:489`

---
### `GET /get/table-explorer/data/workflow-artisan-mapping`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/workflow-artisan-mapping`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:510`

---
### `GET /get/table-explorer/data/workflow/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/workflow/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowController.java:531`

---
### `GET /get/workflow-template-list`
- **Method**: `GET`
- **Path**: `/get/workflow-template-list`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowTemplateController.java:85`

---
### `GET /get/workflow-template/{templateId}`
- **Method**: `GET`
- **Path**: `/get/workflow-template/{templateId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `templateId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowTemplateController.java:104`

---
### `POST /add/workflow-template`
- **Method**: `POST`
- **Path**: `/add/workflow-template`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `WorkflowTemplate`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowTemplateController.java:124`

---
### `PATCH /update/workflow-template`
- **Method**: `PATCH`
- **Path**: `/update/workflow-template`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `WorkflowTemplate`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowTemplateController.java:161`

---
### `DELETE /delete/workflow-template/{templateId}`
- **Method**: `DELETE`
- **Path**: `/delete/workflow-template/{templateId}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `templateId: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowTemplateController.java:198`

---
### `GET /get/table-explorer/data/workflow-template`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/workflow-template`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `page: int (query), size: int (query)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowTemplateController.java:217`

---
### `GET /get/table-explorer/data/workflow-template/{id}`
- **Method**: `GET`
- **Path**: `/get/table-explorer/data/workflow-template/{id}`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `id: Long (path)`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `MISSING`
- **Source Location**: `main/java/com/bloomscorp/loom/workflow/controller/WorkflowTemplateController.java:238`

---

## ZOHO ADAPTER MODULE (4 APIs)

### `POST /zoho/sync/all-product`
- **Method**: `POST`
- **Path**: `/zoho/sync/all-product`
- **Auth Required**: YES
- **Authorization Gate**: `CODE_SU (Super User)`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `NOT IDENTIFIED FROM SOURCE`
- **Response Type**: `String`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/zoho_adapter/controller/ZohoStockSyncController.java:62`

---
### `POST /zoho/webhook/sales-order`
- **Method**: `POST`
- **Path**: `/zoho/webhook/sales-order`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `SalesOrderWebhookEvent`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/zoho_adapter/webhook/controller/ZohoStockSyncWebhookController.java:75`

---
### `POST /zoho/webhook/bill`
- **Method**: `POST`
- **Path**: `/zoho/webhook/bill`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `BillWebhookEvent`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/zoho_adapter/webhook/controller/ZohoStockSyncWebhookController.java:92`

---
### `POST /zoho/webhook/inventory-adjustment`
- **Method**: `POST`
- **Path**: `/zoho/webhook/inventory-adjustment`
- **Auth Required**: YES
- **Authorization Gate**: `NOT IDENTIFIED FROM SOURCE`
- **Request Parameters**: `NOT IDENTIFIED FROM SOURCE`
- **Request Body**: `InventoryAdjustmentWebhookEvent`
- **Response Type**: `RainTreeResponse`
- **Current Anuprerna Status**: `PRESENT_BUT_NOT_IN_SWAGGER`
- **Source Location**: `main/java/com/bloomscorp/loom/zoho_adapter/webhook/controller/ZohoStockSyncWebhookController.java:109`

---
