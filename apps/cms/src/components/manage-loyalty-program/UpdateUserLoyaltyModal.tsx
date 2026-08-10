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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-base uppercase tracking-wider">
            Update User Wholesale Program
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Currency */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.minimumOrderValueCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
              {validationErrors.minimumOrderValueCurrency && (
                <span className="text-xs text-red-500">{validationErrors.minimumOrderValueCurrency}</span>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Amount ({formData.minimumOrderValueCurrency}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.minimumOrderValue || ''}
                onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {validationErrors.minimumOrderValue && (
                <span className="text-xs text-red-500">{validationErrors.minimumOrderValue}</span>
              )}
            </div>

            {/* Tenure (Months) */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Tenure (Months) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.tenure || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, tenure: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {validationErrors.tenure && (
                <span className="text-xs text-red-500">{validationErrors.tenure}</span>
              )}
            </div>

            {/* Discount (%) */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Discount (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.discountPercentage ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, discountPercentage: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {validationErrors.discountPercentage && (
                <span className="text-xs text-red-500">{validationErrors.discountPercentage}</span>
              )}
            </div>

            {/* Type of Action */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Type of Action <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as LoyaltyConfigAuditLogTypeEnum }))}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value={LoyaltyConfigAuditLogTypeEnum.ONBOARDING} disabled={!!formData.id}>
                  ONBOARDING
                </option>
                <option value={LoyaltyConfigAuditLogTypeEnum.RENEWAL_MANUAL} disabled={!formData.id}>
                  RENEWAL (MANUAL)
                </option>
                <option value={LoyaltyConfigAuditLogTypeEnum.ADJUSTMENT} disabled={!formData.id}>
                  ADJUSTMENT
                </option>
              </select>
              {validationErrors.type && (
                <span className="text-xs text-red-500">{validationErrors.type}</span>
              )}
            </div>
          </div>

          {/* Forex Conversion Banner */}
          {formData.minimumOrderValueCurrency !== 'INR' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between text-xs text-slate-700 gap-2">
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
                <div className="text-slate-500 italic">
                  1 {formData.minimumOrderValueCurrency} ≈ {(1 / formData.exchangeRate).toFixed(2)} INR
                  {forexRates?.recordDate && ` (as per ${new Date(forexRates.recordDate).toLocaleDateString()})`}
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
