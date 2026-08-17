"use client";

import { CheckoutStep } from "@/types/domain/checkout";

interface CheckoutStepHeaderProps {
  currentStep: CheckoutStep;
  onSelectStep: (step: CheckoutStep) => void;
}

export function CheckoutStepHeader({
  currentStep,
  onSelectStep,
}: CheckoutStepHeaderProps) {
  const stepIndexMap: Record<CheckoutStep, number> = {
    cart: 1,
    shipping: 2,
    payment: 3,
  };

  const currentIndex = stepIndexMap[currentStep] || 1;

  const steps = [
    {
      key: "cart" as CheckoutStep,
      number: 1,
      label: "Your order",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
    },
    {
      key: "shipping" as CheckoutStep,
      number: 2,
      label: "Delivery details",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h2m-6 0a1 1 0 001-1v-3"
          />
        </svg>
      ),
    },
    {
      key: "payment" as CheckoutStep,
      number: 3,
      label: "Payment",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
  ];

  const currentStepTitle =
    currentIndex === 1
      ? "Step 1 of 3 · Your order"
      : currentIndex === 2
      ? "Step 2 of 3 · Delivery details"
      : "Step 3 of 3 · Payment";

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-6 sm:p-7 mb-6">
      {/* Stepper Icons and Connector Lines */}
      <div className="relative flex items-center justify-between max-w-xl mx-auto">
        {steps.map((step, idx) => {
          const isCompleted = step.number < currentIndex;
          const isActive = step.number === currentIndex;
          const isClickable = step.number <= currentIndex;

          return (
            <div key={step.key} className="flex-1 flex items-center">
              {/* Step circle & label */}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onSelectStep(step.key)}
                className={`flex flex-col items-center group transition-all mx-auto ${
                  isClickable ? "cursor-pointer" : "cursor-default opacity-60"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "border-2 border-[#15803d] bg-[#15803d]/10 text-[#15803d]"
                      : isActive
                      ? "border-2 border-[#15803d] text-[#15803d] bg-white shadow-xs"
                      : "border border-gray-200 bg-white text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-6 h-6 text-[#15803d]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>

                <span
                  className={`text-xs font-semibold mt-2.5 tracking-tight ${
                    isActive
                      ? "text-gray-900"
                      : isCompleted
                      ? "text-gray-800"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </button>

              {/* Connecting line between steps */}
              {idx < steps.length - 1 && (
                <div
                  className={`h-[1.5px] flex-1 mx-2 sm:mx-4 -mt-5 transition-colors ${
                    step.number < currentIndex ? "bg-[#15803d]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Centered Step subtitle */}
      <p className="text-center text-sm font-bold text-gray-900 mt-6 tracking-wide">
        {currentStepTitle}
      </p>
    </div>
  );
}
