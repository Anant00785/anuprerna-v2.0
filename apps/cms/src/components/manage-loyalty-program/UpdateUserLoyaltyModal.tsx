'use client';

import React, { useState, useEffect } from 'react';
import {
  ILoyaltyProgramConfigPayload,
  LoyaltyConfigAuditLogTypeEnum,
  LoyaltyProgramValidationService,
  LoyaltyService,
} from '@/services/loyalty-service';
import { LogisticService } from '@/services/logistic-service';
import { X, AlertCircle } from 'lucide-react';

interface UpdateUserLoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: ILoyaltyProgramConfigPayload | null;
}

export const UpdateUserLoyaltyModal: React.FC<UpdateUserLoyaltyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [formData, setFormData] = useState<ILoyaltyProgramConfigPayload>({
    id: 0,
    customerId: 0,
    tenure: 1,
    discountPercentage: 0,
    minimumOrderValueCurrency: 'INR',
    minimumOrderValue: 10000,
    minimumOrderValueINR: 10000,
    exchangeRate: 1,
    type: LoyaltyConfigAuditLogTypeEnum.ONBOARDING,
  });

  const [forexRates, setForexRates] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        ...initialData,
        minimumOrderValueCurrency: initialData.minimumOrderValueCurrency || 'INR',
        type: initialData.id
          ? LoyaltyConfigAuditLogTypeEnum.RENEWAL_MANUAL
          : LoyaltyConfigAuditLogTypeEnum.ONBOARDING,
      });
    }

    setValidationErrors({});
    setErrorMessage(null);

    fetchLatestForex();
  }, [isOpen, initialData]);

  const fetchLatestForex = async () => {
    try {
      const rates = await LogisticService.getLatestExchangeRate();
      setForexRates(rates);
      if (rates && formData.minimumOrderValueCurrency !== 'INR') {
        recalculateForex(formData.minimumOrderValueCurrency, formData.minimumOrderValue, rates);
      }
    } catch {
      // Ignore forex fetch failure silently or fallback
    }
  };

  const recalculateForex = (currency: string, amount: number, ratesObj = forexRates) => {
    let rate = 1;
    if (currency === 'USD') rate = ratesObj?.usd || 1;
    else if (currency === 'EUR') rate = ratesObj?.eur || 1;
    else if (currency === 'GBP') rate = ratesObj?.gbp || 1;

    const inrValue = currency === 'INR' ? amount || 0 : (amount || 0) / (rate || 1);

    setFormData((prev) => ({
      ...prev,
      minimumOrderValueCurrency: currency,
      exchangeRate: currency === 'INR' ? 1 : rate,
      minimumOrderValueINR: inrValue,
    }));
  };

  const handleCurrencyChange = (currency: string) => {
    recalculateForex(currency, formData.minimumOrderValue);
  };

  const handleAmountChange = (val: number) => {
    setFormData((prev) => {
      const inrValue =
        prev.minimumOrderValueCurrency === 'INR'
          ? val || 0
          : (val || 0) / (prev.exchangeRate || 1);
      return {
        ...prev,
        minimumOrderValue: val,
        minimumOrderValueINR: inrValue,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = LoyaltyProgramValidationService.validate(formData);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await LoyaltyService.enableLoyaltyProgramCustomers(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update user wholesale program');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 sm:p-7">
        {/* Title */}
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-center pb-5">
          UPDATE USER WHOLESALE PROGRAM
        </h3>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Currency Dropdown */}
          <div className="space-y-1">
            <select
              value={formData.minimumOrderValueCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-blue-400 rounded-md text-slate-800 outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            {validationErrors.minimumOrderValueCurrency && (
              <span className="text-[11px] text-red-500">{validationErrors.minimumOrderValueCurrency}</span>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Amount ({formData.minimumOrderValueCurrency}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.minimumOrderValue || ''}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
            {validationErrors.minimumOrderValue && (
              <span className="text-[11px] text-red-500">{validationErrors.minimumOrderValue}</span>
            )}
          </div>

          {/* Tenure (Months) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Tenure (Months) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.tenure || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, tenure: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
            {validationErrors.tenure && (
              <span className="text-[11px] text-red-500">{validationErrors.tenure}</span>
            )}
          </div>

          {/* Discount (%) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Discount (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.discountPercentage ?? ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, discountPercentage: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
            {validationErrors.discountPercentage && (
              <span className="text-[11px] text-red-500">{validationErrors.discountPercentage}</span>
            )}
          </div>

          {/* Type of Action */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Type Of Action <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as LoyaltyConfigAuditLogTypeEnum }))}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            >
              <option value={LoyaltyConfigAuditLogTypeEnum.ONBOARDING}>
                ONBOARDING
              </option>
              <option value={LoyaltyConfigAuditLogTypeEnum.RENEWAL_MANUAL}>
                RENEWAL (MANUAL)
              </option>
              <option value={LoyaltyConfigAuditLogTypeEnum.ADJUSTMENT}>
                ADJUSTMENT
              </option>
            </select>
            {validationErrors.type && (
              <span className="text-[11px] text-red-500">{validationErrors.type}</span>
            )}
          </div>

          {/* Forex Conversion Banner (if not INR) */}
          {formData.minimumOrderValueCurrency !== 'INR' && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md flex flex-col md:flex-row md:items-center justify-between text-xs text-slate-700 gap-2">
              <div className="flex items-center gap-2">
                <span>Final Value:</span>
                <span className="px-2 py-0.5 font-bold text-emerald-700 bg-emerald-100 rounded">
                  {formData.minimumOrderValueINR?.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  INR
                </span>
              </div>
              {formData.exchangeRate && (
                <div className="text-slate-500 italic text-[11px]">
                  1 {formData.minimumOrderValueCurrency} ≈ {(1 / formData.exchangeRate).toFixed(2)} INR
                </div>
              )}
            </div>
          )}

          {/* Buttons: Update and Close side by side in purple */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-4 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c68] rounded-md shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c68] rounded-md shadow-xs transition-colors"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
