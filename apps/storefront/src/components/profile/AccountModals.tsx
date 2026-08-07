'use client';

import React, { useState } from 'react';

interface EditNameModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (firstName: string, lastName: string) => void;
}

export const EditNameModal: React.FC<EditNameModalProps> = ({
  isOpen,
  currentName,
  onClose,
  onSave,
}) => {
  const parts = currentName.trim().split(' ');
  const [firstName, setFirstName] = useState(parts[0] || '');
  const [lastName, setLastName] = useState(parts.slice(1).join(' ') || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required.');
      return;
    }
    setError('');
    onSave(firstName, lastName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 z-10 border border-gray-100">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Name</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#B7A990]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#B7A990]"
            />
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm text-white bg-[#8E7862] hover:bg-[#6c5b48] rounded-lg transition-colors shadow-xs font-medium"
            >
              Save Change
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      setError('Password is required.');
      return;
    }
    if (!newPassword) {
      setError('New Password is required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Password and Confirm Password mismatched');
      return;
    }

    setError('');
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onSave();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 z-10 border border-gray-100">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <span className="material-symbols-outlined text-emerald-500 text-5xl">check_circle</span>
            <p className="font-semibold text-gray-900">Password Updated Successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Old Password *</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Old Password"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#B7A990]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">New Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#B7A990]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#B7A990]"
              />
            </div>

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm text-white bg-[#8E7862] hover:bg-[#6c5b48] rounded-lg transition-colors shadow-xs font-medium"
              >
                Save Change
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
