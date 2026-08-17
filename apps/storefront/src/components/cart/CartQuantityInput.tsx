'use client';

import React, { useState } from 'react';
import {
  StockCalculationParams,
  calculateAvailableStock,
  calculateMOQ,
  getIncrementStep,
  validateAndClampQuantity,
} from '@/lib/cart/cart-helpers';

interface CartQuantityInputProps {
  quantity: number;
  params: StockCalculationParams;
  onChange: (newQuantity: number) => void;
  disabled?: boolean;
}

export const CartQuantityInput: React.FC<CartQuantityInputProps> = ({
  quantity,
  params,
  onChange,
  disabled = false,
}) => {
  const [warning, setWarning] = useState<string | null>(null);

  const step = getIncrementStep(params.unit, params.productGroup);
  const maxStock = calculateAvailableStock(params);
  const moq = calculateMOQ(params);

  const isMaxReached = isFinite(maxStock) && quantity >= maxStock;
  const isMinReached = quantity <= moq;
  const unitLabel = (params.unit || 'meter').toLowerCase();

  const handleIncrement = () => {
    setWarning(null);
    if (isMaxReached) {
      setWarning(`Maximum quantity available is ${maxStock} ${unitLabel}(s)`);
      return;
    }
    const target = quantity + step;
    const validation = validateAndClampQuantity(target, params);
    if (validation.exceededMaxStock) {
      setWarning(`Maximum quantity available is ${maxStock} ${unitLabel}(s)`);
    }
    onChange(validation.clampedQuantity);
  };

  const handleDecrement = () => {
    setWarning(null);
    if (isMinReached) {
      setWarning(`Minimum order quantity is ${moq} ${unitLabel}(s)`);
      return;
    }
    const target = quantity - step;
    const validation = validateAndClampQuantity(target, params);
    if (validation.exceededMinMOQ) {
      setWarning(`Minimum order quantity is ${moq} ${unitLabel}(s)`);
    }
    onChange(validation.clampedQuantity);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWarning(null);
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;

    const validation = validateAndClampQuantity(val, params);
    if (validation.exceededMaxStock) {
      setWarning(`Maximum quantity available is ${maxStock} ${unitLabel}(s)`);
    } else if (validation.exceededMinMOQ) {
      setWarning(`Minimum order quantity is ${moq} ${unitLabel}(s)`);
    }
    onChange(validation.clampedQuantity);
  };

  const activeWarning = warning || (isMaxReached ? `Maximum quantity available is ${maxStock} ${unitLabel}(s)` : null);

  return (
    <div className="space-y-1">
      <div className="flex items-center rounded-lg border border-gray-300 bg-white w-max">
        <button
          type="button"
          disabled={disabled || isMinReached}
          onClick={handleDecrement}
          className="px-2.5 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 rounded-l-lg transition-colors select-none"
        >
          -
        </button>

        <input
          type="number"
          step={step}
          min={moq}
          max={isFinite(maxStock) ? maxStock : undefined}
          value={quantity}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-14 text-center text-sm font-medium text-gray-900 border-x border-gray-200 py-1 focus:outline-none bg-transparent"
        />

        <button
          type="button"
          disabled={disabled || isMaxReached}
          onClick={handleIncrement}
          className="px-2.5 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 rounded-r-lg transition-colors select-none"
        >
          +
        </button>
      </div>

      {activeWarning && (
        <p className="text-[11px] font-semibold text-red-500 animate-fade-in">
          {activeWarning}
        </p>
      )}
    </div>
  );
};
