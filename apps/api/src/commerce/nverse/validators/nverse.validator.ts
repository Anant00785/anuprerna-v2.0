/**
 * Request validators for the NVerse auth endpoints.
 *
 * The OTP ones mirror Loom:
 *   ContactNumberValidator.java — CONTACT_NUMBER_PATTERN = "^[0-9]{3,20}$"
 *   OTPSendRequestValidator.java / OTPResendRequestValidator.java — contact number only
 *   OTPVerifyRequestValidator.java — contact number, then otp non-blank, then
 *     `otp.matches("\\d+")`, then `otp.length() == msg91.otp.length` (default 6)
 *
 * All of them return the SAME message on failure. Loom answers
 * ActionCode.INCORRECT_INFORMATION for a failed validator and for an unknown
 * contact number alike (OTPController.java:211 vs :214); a validator that said
 * "OTP must be 6 digits" while the lookup said "unknown number" would rebuild
 * the enumeration oracle one layer up.
 */
import { LoginRequest, OtpSendRequest, OtpVerifyRequest, EmailVerifyRequest } from '../types/nverse.types.js';
import { GENERIC_FAILURE } from '../service/nverse.service.js';
import { DEFAULT_OTP_LENGTH } from '../service/msg91-otp.service.js';

/** ContactNumberValidator.java:CONTACT_NUMBER_PATTERN. */
const CONTACT_NUMBER_PATTERN = /^[0-9]{3,20}$/;
const DIGITS_ONLY = /^\d+$/;

function validContactNumber(contactNumber?: string): boolean {
  return !!contactNumber && CONTACT_NUMBER_PATTERN.test(contactNumber);
}

export function validateLoginRequest(data: LoginRequest) {
  if (!data.email && !validContactNumber(data.contactNumber)) return GENERIC_FAILURE;
  if (!data.password) return GENERIC_FAILURE;
  return null;
}

/** OTPSendRequestValidator / OTPResendRequestValidator. */
export function validateOtpSendRequest(data: OtpSendRequest) {
  return validContactNumber(data.contactNumber) ? null : GENERIC_FAILURE;
}

/**
 * OTPVerifyRequestValidator. `otpLength` is passed in by the controller from
 * Msg91OtpService (which reads MSG91_OTP_LENGTH), matching the Java's
 * `@Value("${msg91.otp.length:6}")` on the validator itself.
 */
export function validateOtpVerifyRequest(data: OtpVerifyRequest, otpLength: number = DEFAULT_OTP_LENGTH) {
  if (!validContactNumber(data.contactNumber)) return GENERIC_FAILURE;
  const otp = data.otp?.trim();
  if (!otp || !DIGITS_ONLY.test(otp) || otp.length !== otpLength) return GENERIC_FAILURE;
  return null;
}

export function validateEmailVerifyRequest(data: EmailVerifyRequest) {
  if (!data.email || !data.token) return GENERIC_FAILURE;
  return null;
}
