"use client";

import { PaymentMethodId } from "@/types/domain/checkout";

interface CheckoutPaymentMethodsProps {
  paymentMethod: PaymentMethodId;
  onSelectPaymentMethod: (id: PaymentMethodId) => void;
  currencyCode: string;
}

export function CheckoutPaymentMethods({
  paymentMethod,
  onSelectPaymentMethod,
  currencyCode,
}: CheckoutPaymentMethodsProps) {
  const isDomestic = currencyCode.toUpperCase() === "INR";

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-6 sm:p-7 mb-6">
      <h3 className="text-base font-bold text-gray-900 mb-4">
        How would you like to pay?
      </h3>

      <div className="flex flex-col gap-3">
        {isDomestic ? (
          <div
            onClick={() => onSelectPaymentMethod("rp")}
            className="p-5 rounded-xl border border-[#ca9b6d] ring-1 ring-[#ca9b6d] bg-white cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === "rp"}
                onChange={() => onSelectPaymentMethod("rp")}
                className="accent-[#ca9b6d] w-4 h-4 cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">Razorpay</span>
                {/* Razorpay Blue Logo Icon */}
                <svg
                  className="w-5 h-5 text-[#0c2340]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M22.436 0l-11.91 7.773-1.174 4.276 6.625-4.324-4.908 16.275h4.153l7.214-24zM1.564 24l5.632-18.665 4.316-2.817-4.135 13.708 4.908-3.204-2.148 10.978h-8.573z"
                    fill="#0284c7"
                  />
                </svg>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-2 ml-7">
              Credit/Debit Card, UPI, Net Banking, Wallets
            </p>

            <div className="bg-[#f8f9fa] border border-gray-100 rounded-lg p-3 mt-3 ml-7 text-xs text-gray-500 leading-relaxed">
              Secure payment powered by Razorpay. All major payment methods accepted.
            </div>
          </div>
        ) : (
          <>
            {/* Stripe Card */}
            <div
              onClick={() => onSelectPaymentMethod("st")}
              className={`p-5 rounded-xl border transition-all cursor-pointer ${
                paymentMethod === "st"
                  ? "border-[#ca9b6d] ring-1 ring-[#ca9b6d] bg-white"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "st"}
                    onChange={() => onSelectPaymentMethod("st")}
                    className="accent-[#ca9b6d] w-4 h-4 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      Credit / Debit Card (Stripe)
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Stripe
                </span>
              </div>

              <p className="text-xs text-gray-600 mt-2 ml-7">
                Visa, MasterCard, American Express, Discover, JCB
              </p>

              {paymentMethod === "st" && (
                <div className="bg-[#f8f9fa] border border-gray-100 rounded-lg p-3 mt-3 ml-7 text-xs text-gray-500 leading-relaxed">
                  Secure international payment powered by Stripe.
                </div>
              )}
            </div>

            {/* International Razorpay */}
            <div
              onClick={() => onSelectPaymentMethod("rp")}
              className={`p-5 rounded-xl border transition-all cursor-pointer ${
                paymentMethod === "rp"
                  ? "border-[#ca9b6d] ring-1 ring-[#ca9b6d] bg-white"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "rp"}
                    onChange={() => onSelectPaymentMethod("rp")}
                    className="accent-[#ca9b6d] w-4 h-4 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">Razorpay</span>
                    <svg
                      className="w-5 h-5 text-[#0c2340]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M22.436 0l-11.91 7.773-1.174 4.276 6.625-4.324-4.908 16.275h4.153l7.214-24zM1.564 24l5.632-18.665 4.316-2.817-4.135 13.708 4.908-3.204-2.148 10.978h-8.573z"
                        fill="#0284c7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-2 ml-7">
                International Cards, Net Banking, Wallets
              </p>

              {paymentMethod === "rp" && (
                <div className="bg-[#f8f9fa] border border-gray-100 rounded-lg p-3 mt-3 ml-7 text-xs text-gray-500 leading-relaxed">
                  Secure payment powered by Razorpay.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
