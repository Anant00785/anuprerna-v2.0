'use client';

import React, { useEffect, useState } from 'react';
import { AddressItem } from '@/types/domain/profile';
import { AddressModal } from './AddressModal';
import { profileRepository } from '@/lib/api/repositories/profile.repository';
import { useAuthStore } from '@/stores/auth.store';

interface AddressBookProps {
  initialAddresses?: AddressItem[];
}

export const AddressBook: React.FC<AddressBookProps> = ({ initialAddresses = [] }) => {
  const { jwt } = useAuthStore();
  const [addresses, setAddresses] = useState<AddressItem[]>(initialAddresses);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'SHIPPING' | 'BILLING'>('SHIPPING');
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);

  useEffect(() => {
    async function loadLiveAddresses() {
      setLoading(true);
      try {
        const liveList = await profileRepository.getAddressList(jwt || undefined);
        if (Array.isArray(liveList) && liveList.length > 0) {
          const mapped: AddressItem[] = liveList.map((item, idx) => ({
            id: Number(item.id) || idx + 1,
            name: item.name || "Default Contact",
            addressType: (item.type?.toUpperCase() === 'BILLING' ? 'BILLING' : 'SHIPPING') as 'SHIPPING' | 'BILLING',
            addressLineOne: item.addressLine1 || "",
            addressLineTwo: item.addressLine2 || "",
            city: item.city || "",
            state: item.state || "",
            country: item.country || "India",
            postalCode: item.pincode || item.postalCode || "",
            primaryPhone: item.phone || "",
            contactEmail: "",
            primaryShippingAddress: Boolean(item.isDefault && item.type !== 'BILLING'),
            primaryBillingAddress: Boolean(item.isDefault && item.type === 'BILLING'),
          }));
          setAddresses(mapped);
        }
      } catch (err) {
        // Fall back to initial addresses if backend endpoint returns empty/error
      } finally {
        setLoading(false);
      }
    }

    loadLiveAddresses();
  }, [jwt]);

  const shippingAddresses = addresses.filter((a) => a.addressType === 'SHIPPING');
  const billingAddresses = addresses.filter((a) => a.addressType === 'BILLING');

  const handleOpenAdd = (type: 'SHIPPING' | 'BILLING') => {
    setModalType(type);
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: AddressItem) => {
    setModalType(addr.addressType);
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await profileRepository.deleteAddress(id, jwt || undefined);
    } catch {}
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefault = (addr: AddressItem) => {
    setAddresses((prev) =>
      prev.map((item) => {
        if (item.addressType === addr.addressType) {
          if (addr.addressType === 'SHIPPING') {
            return { ...item, primaryShippingAddress: item.id === addr.id };
          } else {
            return { ...item, primaryBillingAddress: item.id === addr.id };
          }
        }
        return item;
      })
    );
  };

  const handleSaveAddress = async (savedAddr: AddressItem) => {
    try {
      const payload = {
        id: savedAddr.id,
        name: savedAddr.name,
        phone: savedAddr.primaryPhone,
        addressLine1: savedAddr.addressLineOne,
        addressLine2: savedAddr.addressLineTwo,
        city: savedAddr.city,
        state: savedAddr.state,
        pincode: savedAddr.postalCode,
        country: savedAddr.country,
        type: savedAddr.addressType,
      };

      if (editingAddress) {
        await profileRepository.updateAddress(payload, jwt || undefined);
      } else {
        await profileRepository.addAddress(payload, jwt || undefined);
      }
    } catch {}

    setAddresses((prev) => {
      const exists = prev.some((a) => a.id === savedAddr.id);
      if (exists) {
        return prev.map((a) => (a.id === savedAddr.id ? savedAddr : a));
      } else {
        const typeCount = prev.filter((a) => a.addressType === savedAddr.addressType).length;
        const newAddr = {
          ...savedAddr,
          primaryShippingAddress: savedAddr.addressType === 'SHIPPING' && typeCount === 0,
          primaryBillingAddress: savedAddr.addressType === 'BILLING' && typeCount === 0,
        };
        return [...prev, newAddr];
      }
    });
    setIsModalOpen(false);
  };

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Address</h3>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-40 bg-gray-100 rounded-2xl"></div>
          <div className="h-40 bg-gray-100 rounded-2xl"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Shipping Address Book */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Shipping Address Book</h3>
                <p className="text-xs text-gray-500 mt-0.5">Set Shipping address</p>
              </div>
              <button
                onClick={() => handleOpenAdd('SHIPPING')}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#8E7862] hover:bg-[#6c5b48] text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
              >
                + Add Address
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shippingAddresses.map((addr) => {
                const isDefault = addr.primaryShippingAddress;
                return (
                  <div
                    key={addr.id}
                    className={`relative p-5 rounded-xl border transition-all ${
                      isDefault ? 'border-[#B7A990] bg-[#FFFCF7] shadow-xs' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(addr)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors text-xs"
                        title="Edit Address"
                      >
                        Edit
                      </button>
                      {!isDefault && (
                        <button
                          onClick={() => handleDelete(addr.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors text-xs"
                          title="Delete Address"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <h4 className="font-bold text-gray-900 text-base pr-16">
                      {addr.name} {isDefault && <span className="text-xs text-[#8E7862] font-semibold ml-1">( Default )</span>}
                    </h4>

                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      {addr.addressLineOne}
                      {addr.addressLineTwo ? `, ${addr.addressLineTwo}` : ''}, {addr.city}, {addr.state}, {addr.postalCode},{' '}
                      {addr.country}
                    </p>

                    <div className="mt-3 pt-3 border-t border-gray-100/80 space-y-1 text-xs text-gray-600">
                      <div>Phone: {addr.primaryPhone}</div>
                      {addr.contactEmail && <div>Email: {addr.contactEmail}</div>}
                    </div>

                    {!isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr)}
                        className="mt-4 text-xs font-semibold text-[#8E7862] hover:text-[#6c5b48] underline transition-colors cursor-pointer"
                      >
                        Set Default Address
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Billing Address Book */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Billing Address Book</h3>
                <p className="text-xs text-gray-500 mt-0.5">Set Billing address</p>
              </div>
              <button
                onClick={() => handleOpenAdd('BILLING')}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#8E7862] hover:bg-[#6c5b48] text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
              >
                + Add Address
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {billingAddresses.map((addr) => {
                const isDefault = addr.primaryBillingAddress;
                return (
                  <div
                    key={addr.id}
                    className={`relative p-5 rounded-xl border transition-all ${
                      isDefault ? 'border-[#B7A990] bg-[#FFFCF7] shadow-xs' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(addr)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors text-xs"
                        title="Edit Address"
                      >
                        Edit
                      </button>
                      {!isDefault && (
                        <button
                          onClick={() => handleDelete(addr.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors text-xs"
                          title="Delete Address"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <h4 className="font-bold text-gray-900 text-base pr-16">
                      {addr.name} {isDefault && <span className="text-xs text-[#8E7862] font-semibold ml-1">( Default )</span>}
                    </h4>

                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      {addr.addressLineOne}
                      {addr.addressLineTwo ? `, ${addr.addressLineTwo}` : ''}, {addr.city}, {addr.state}, {addr.postalCode},{' '}
                      {addr.country}
                    </p>

                    <div className="mt-3 pt-3 border-t border-gray-100/80 space-y-1 text-xs text-gray-600">
                      <div>Phone: {addr.primaryPhone}</div>
                      {addr.contactEmail && <div>Email: {addr.contactEmail}</div>}
                    </div>

                    {!isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr)}
                        className="mt-4 text-xs font-semibold text-[#8E7862] hover:text-[#6c5b48] underline transition-colors cursor-pointer"
                      >
                        Set Default Address
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <AddressModal
        isOpen={isModalOpen}
        addressType={modalType}
        editingAddress={editingAddress}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAddress}
      />
    </div>
  );
};
