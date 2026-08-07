'use client';

import React, { useState, useEffect } from 'react';
import { AddressItem } from '@/types/domain/profile';

interface AddressModalProps {
  isOpen: boolean;
  addressType: 'SHIPPING' | 'BILLING';
  editingAddress?: AddressItem | null;
  onClose: () => void;
  onSave: (address: AddressItem) => void;
}

const countryList = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'Singapore',
  'United Arab Emirates',
];

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  addressType,
  editingAddress,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<AddressItem>>({
    addressType: addressType,
    name: '',
    country: 'India',
    state: '',
    city: '',
    addressLineOne: '',
    addressLineTwo: '',
    postalCode: '',
    companyName: '',
    primaryPhone: '',
    secondaryPhone: '',
    contactEmail: '',
    vatgstNumber: '',
    eoriNumber: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingAddress) {
      setFormData(editingAddress);
    } else {
      setFormData({
        addressType: addressType,
        name: '',
        country: 'India',
        state: '',
        city: '',
        addressLineOne: '',
        addressLineTwo: '',
        postalCode: '',
        companyName: '',
        primaryPhone: '',
        secondaryPhone: '',
        contactEmail: '',
        vatgstNumber: '',
        eoriNumber: '',
      });
    }
    setErrors({});
  }, [editingAddress, addressType, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name?.trim()) errs.name = 'Name is required.';
    if (!formData.country) errs.country = 'Country is required.';
    if (!formData.state?.trim()) errs.state = 'State is required.';
    if (!formData.city?.trim()) errs.city = 'City is required.';
    if (!formData.addressLineOne?.trim()) errs.addressLineOne = 'Address Line 1 is required.';
    if (!formData.postalCode?.trim()) errs.postalCode = 'Postal code is required.';
    if (!formData.primaryPhone?.trim()) errs.primaryPhone = 'A valid phone number is required.';
    if (!formData.contactEmail?.trim()) errs.contactEmail = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) errs.contactEmail = 'Invalid email format.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: editingAddress ? editingAddress.id : Date.now(),
      addressType: addressType,
      name: formData.name || '',
      country: formData.country || 'India',
      state: formData.state || '',
      city: formData.city || '',
      addressLineOne: formData.addressLineOne || '',
      addressLineTwo: formData.addressLineTwo || '',
      postalCode: formData.postalCode || '',
      companyName: formData.companyName || '',
      primaryPhone: formData.primaryPhone || '',
      secondaryPhone: formData.secondaryPhone || '',
      contactEmail: formData.contactEmail || '',
      vatgstNumber: formData.vatgstNumber || '',
      eoriNumber: formData.eoriNumber || '',
      primaryShippingAddress: editingAddress?.primaryShippingAddress,
      primaryBillingAddress: editingAddress?.primaryBillingAddress,
    });
  };

  const isEdit = !!editingAddress;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose}></div>
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 z-10 border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-5">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit' : 'Add new'} {addressType === 'BILLING' ? 'Billing' : 'Shipping'} address
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Name *"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B7A990] focus:outline-hidden"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>}
          </div>

          <div>
            <select
              value={formData.country || 'India'}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B7A990] focus:outline-hidden bg-white"
            >
              <option value="">Country *</option>
              {countryList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.country && <p className="text-xs text-red-500 mt-1 font-medium">{errors.country}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="State *"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B7A990] focus:outline-hidden"
              />
              {errors.state && <p className="text-xs text-red-500 mt-1 font-medium">{errors.state}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="City *"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B7A990] focus:outline-hidden"
              />
              {errors.city && <p className="text-xs text-red-500 mt-1 font-medium">{errors.city}</p>}
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="Address Line 1 *"
              value={formData.addressLineOne || ''}
              onChange={(e) => setFormData({ ...formData, addressLineOne: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B7A990] focus:outline-hidden"
            />
            {errors.addressLineOne && <p className="text-xs text-red-500 mt-1 font-medium">{errors.addressLineOne}</p>}
          </div>

          <div>
            <input
              type="text"
              placeholder="Address Line 2"
              value={formData.addressLineTwo || ''}
              onChange={(e) => setFormData({ ...formData, addressLineTwo: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B7A990] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Postal Code *"
                maxLength={10}
                value={formData.postalCode || ''}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B7A990] focus:outline-hidden"
              />
              {errors.postalCode && <p className="text-xs text-red-500 mt-1 font-medium">{errors.postalCode}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="Company Name"
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B7A990] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="tel"
                placeholder="Primary Phone *"
                value={formData.primaryPhone || ''}
                onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B7A990] focus:outline-hidden"
              />
              {errors.primaryPhone && <p className="text-xs text-red-500 mt-1 font-medium">{errors.primaryPhone}</p>}
            </div>

            <div>
              <input
                type="tel"
                placeholder="Secondary Phone"
                value={formData.secondaryPhone || ''}
                onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B7A990] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <input
              type="email"
              placeholder="Email *"
              value={formData.contactEmail || ''}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B7A990] focus:outline-hidden"
            />
            {errors.contactEmail && <p className="text-xs text-red-500 mt-1 font-medium">{errors.contactEmail}</p>}
          </div>

          <div>
            <input
              type="text"
              placeholder="VAT/GST No."
              value={formData.vatgstNumber || ''}
              onChange={(e) => setFormData({ ...formData, vatgstNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B7A990] focus:outline-hidden"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="EORI Number - Must for custom clearance if applicable"
              value={formData.eoriNumber || ''}
              onChange={(e) => setFormData({ ...formData, eoriNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B7A990] focus:outline-hidden"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm text-white bg-[#8E7862] hover:bg-[#6c5b48] rounded-lg transition-colors shadow-xs font-semibold"
            >
              {isEdit ? 'Update' : 'Save'} {addressType === 'BILLING' ? 'Billing' : 'Shipping'} Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
