"use client";

interface CheckoutWhatsAppOptinProps {
  onOptIn: () => void;
  onDismiss: () => void;
  isOptedIn?: boolean;
}

export function CheckoutWhatsAppOptin({
  onOptIn,
  onDismiss,
  isOptedIn = false,
}: CheckoutWhatsAppOptinProps) {
  if (isOptedIn) return null;

  return (
    <div className="bg-[#effcf4] border border-[#d1fae5] rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-full bg-white text-[#25D366] flex items-center justify-center shrink-0 border border-[#b2e7c4] shadow-xs">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.77.784 2.796.784 3.182 0 5.768-2.587 5.768-5.767.001-3.181-2.585-5.769-5.768-5.769zm3.393 8.163c-.144.405-.837.774-1.17.822-.312.043-.655.076-2.099-.523-1.848-.767-3.033-2.645-3.125-2.768-.093-.122-.748-.996-.748-1.9 0-.904.474-1.348.643-1.531.169-.183.37-.229.493-.229.123 0 .247.002.355.007.114.005.267-.043.418.32.155.37.531 1.296.577 1.39.046.093.077.202.015.324-.061.123-.092.2-.184.307-.092.108-.194.24-.277.323-.093.093-.19.194-.082.38.108.185.48 1.036 1.029 1.524.708.63 1.306.825 1.491.918.185.093.292.077.4-.047.108-.123.462-.538.585-.723.123-.185.246-.154.415-.092.17.062 1.079.509 1.264.601.185.093.308.139.354.216.046.077.046.447-.098.852z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#065f46]">
            Get order updates on WhatsApp
          </h4>
          <p className="text-xs text-[#047857] mt-0.5 leading-relaxed">
            Stay updated on your order status, shipping, and artisan updates — straight to WhatsApp.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 cursor-pointer transition-colors"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={onOptIn}
          className="bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition-colors shadow-xs"
        >
          Yes, notify me
        </button>
      </div>
    </div>
  );
}
