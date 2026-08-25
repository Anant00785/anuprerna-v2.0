'use client';

import React, { useEffect, useState } from 'react';
import { UserProfile } from '@/types/domain/profile';
import { EditNameModal, ChangePasswordModal } from './AccountModals';
import { profileRepository } from '@/lib/api/repositories/profile.repository';
import { useAuthStore } from '@/stores/auth.store';

interface AccountDetailsProps {
  profile?: UserProfile;
}

export const AccountDetails: React.FC<AccountDetailsProps> = ({ profile: initialProfile }) => {
  const { jwt, user: authUser, setUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);

  useEffect(() => {
    async function loadLiveProfile() {
      setLoading(true);
      try {
        const liveData = await profileRepository.getCustomerProfile(jwt || undefined);
        if (liveData) {
          const resolvedName =
            liveData.name ||
            [liveData.firstName, liveData.lastName].filter(Boolean).join(" ").trim() ||
            liveData.userName ||
            authUser?.name ||
            [authUser?.firstName, authUser?.lastName].filter(Boolean).join(" ").trim() ||
            "Valued Customer";

          const formattedProfile: UserProfile = {
            tenant: {
              id: Number(liveData.id) || Number(authUser?.id) || 1001,
              name: resolvedName,
              email: liveData.email || authUser?.email || "customer@anuprerna.com",
              avatarUrl: liveData.gender || authUser?.avatarUrl,
            },
          };
          setProfile(formattedProfile);
          setUser({
            ...authUser,
            ...liveData,
            name: resolvedName,
            firstName: liveData.firstName || resolvedName.split(" ")[0] || "",
            lastName: liveData.lastName || resolvedName.split(" ").slice(1).join(" ") || "",
          });
        }
      } catch (err) {
        if (authUser) {
          const fallbackName =
            authUser.name ||
            [authUser.firstName, authUser.lastName].filter(Boolean).join(" ").trim() ||
            authUser.email ||
            "Valued Customer";
          setProfile({
            tenant: {
              id: Number(authUser.id) || 1001,
              name: fallbackName,
              email: authUser.email || "customer@anuprerna.com",
            },
          });
        }
      } finally {
        setLoading(false);
      }
    }

    loadLiveProfile();
  }, [jwt]);

  const handleSaveName = async (firstName: string, lastName: string) => {
    setSaving(true);
    const fullName = `${firstName} ${lastName}`.trim();
    try {
      await profileRepository.updateCustomerProfile(
        {
          name: fullName,
          firstName,
          lastName,
          email: profile?.tenant.email,
        },
        jwt || undefined
      );

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              tenant: {
                ...prev.tenant,
                name: fullName,
              },
            }
          : prev
      );

      setUser({
        ...authUser,
        name: fullName,
        firstName,
        lastName,
      });
    } catch (err) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              tenant: {
                ...prev.tenant,
                name: fullName,
              },
            }
          : prev
      );
      setUser({
        ...authUser,
        name: fullName,
        firstName,
        lastName,
      });
    } finally {
      setSaving(false);
      setIsEditNameOpen(false);
    }
  };

  const currentName = profile?.tenant.name || "Customer";
  const currentEmail = profile?.tenant.email || "customer@anuprerna.com";
  const currentId = profile?.tenant.id || 1001;

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold text-gray-900 mb-1">Account</h3>
      <h5 className="text-sm text-gray-500 mb-6">
        Account Info - <span className="text-xs text-gray-400 font-mono">#{currentId}</span>
      </h5>

      {loading ? (
        <div className="w-full max-w-2xl bg-[#efeee9] rounded-2xl p-6 shadow-xs border border-amber-950/5 animate-pulse flex items-center gap-6">
          <div className="w-28 h-28 rounded-full bg-gray-300"></div>
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl bg-[#efeee9] rounded-2xl p-6 shadow-xs border border-amber-950/5">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0">
              {profile?.tenant.avatarUrl ? (
                <img
                  src={profile.tenant.avatarUrl}
                  alt={currentName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#b7a990] flex items-center justify-center text-white text-3xl font-bold">
                  {currentName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h4 className="text-2xl font-bold text-gray-900">{currentName}</h4>
                <button
                  onClick={() => setIsEditNameOpen(true)}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-full transition-colors"
                  title="Edit Name"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>

              <p className="text-base text-gray-700 font-medium">{currentEmail}</p>

              <div className="pt-3">
                <button
                  onClick={() => setIsChangePassOpen(true)}
                  className="text-[#94866c] hover:text-[#72644d] border-b border-[#b7a990] font-medium text-sm transition-colors"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <EditNameModal
        isOpen={isEditNameOpen}
        currentName={currentName}
        onClose={() => setIsEditNameOpen(false)}
        onSave={handleSaveName}
      />

      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
        onSave={() => setIsChangePassOpen(false)}
      />
    </div>
  );
};
