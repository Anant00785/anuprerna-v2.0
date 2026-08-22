'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeading } from '@/components/ui/PageHeading';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { UserService, UserLitePreview, CartOverview } from '@/services/user-service';

function formatDateTime(timestamp?: number | string | null): string {
  if (!timestamp) return 'Never';
  const date = new Date(typeof timestamp === 'number' ? timestamp : String(timestamp));
  if (isNaN(date.getTime())) return 'Never';

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${dd}-${mm}-${yyyy} @ ${hours}:${minutes} ${ampm}`;
}

function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<'cart' | 'verified' | 'unverified'>('cart');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserLitePreview[]>([]);
  const [cartItems, setCartItems] = useState<CartOverview[]>([]);
  const [error, setError] = useState('');

  const fetchUserData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, cartData] = await Promise.all([
        UserService.getCustomers().catch(() => []),
        UserService.getCartOverviewList().catch(() => []),
      ]);
      setUsers(usersData);
      setCartItems(cartData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user directory from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const verifiedUsers = users.filter(u => u.emailVerified !== false);
  const unverifiedUsers = users.filter(u => u.emailVerified === false);

  const filteredCart = cartItems.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = (c.tenant?.name || c.tenant?.userName || '').toLowerCase();
    const email = (c.tenant?.decryptedEmail || c.tenant?.email || '').toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  const filteredVerified = verifiedUsers.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const uid = (u.loomId || u.uid || '').toLowerCase();
    const name = (u.userName || u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return uid.includes(term) || name.includes(term) || email.includes(term);
  });

  const filteredUnverified = unverifiedUsers.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const uid = (u.loomId || u.uid || '').toLowerCase();
    const name = (u.userName || u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return uid.includes(term) || name.includes(term) || email.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading heading="User" />
        <button
          onClick={fetchUserData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Navigation Tabs matching live Weave */}
      <div className="flex gap-4 items-center mb-4">
        <button
          onClick={() => setActiveTab('cart')}
          className={`px-4 py-2 text-sm transition-all ${
            activeTab === 'cart' ? 'border border-black bg-white text-black font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          User Cart ({cartItems.length})
        </button>
        <button
          onClick={() => setActiveTab('verified')}
          className={`px-4 py-2 text-sm transition-all ${
            activeTab === 'verified' ? 'border border-black bg-white text-black font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Verified Users ({verifiedUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('unverified')}
          className={`px-4 py-2 text-sm transition-all ${
            activeTab === 'unverified' ? 'border border-black bg-white text-black font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Un-verified Users ({unverifiedUsers.length})
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by UID, name, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-sm"
        />
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 font-light">Loading user and cart data from backend...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: USER CART OVERVIEW */}
          {activeTab === 'cart' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Last Updated</th>
                      <th className="px-6 py-4">Email / Name</th>
                      <th className="px-6 py-4 text-center">Cart Item Count</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Estimated Total</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCart.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                          No active user carts found.
                        </td>
                      </tr>
                    ) : (
                      filteredCart.map((cart, idx) => (
                        <tr key={cart.tenant?.uid || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 text-slate-900 font-medium whitespace-nowrap">
                            {formatDateTime(cart.lastUpdatedAt)}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900">
                            <div>{cart.tenant?.decryptedEmail || cart.tenant?.email || 'N/A'}</div>
                            {cart.tenant?.name && <div className="text-xs text-slate-500">{cart.tenant.name}</div>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                              {cart.cartItemCount || 0} {cart.cartItemCount === 1 ? 'item' : 'items'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {cart.hasAbandonedItem ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Abandoned
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900">
                            {formatCurrency(cart.estimatedTotalPrice)}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <Link
                              href={`/user/cart/${cart.tenant?.uid}`}
                              target="_blank"
                              className="px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            >
                              View Cart
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: VERIFIED USERS */}
          {activeTab === 'verified' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Email / Name</th>
                      <th className="px-6 py-4 text-center">Auth Provider</th>
                      <th className="px-6 py-4 text-right">Date of Joining</th>
                      <th className="px-6 py-4 text-right">Last Login</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVerified.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          No verified users found.
                        </td>
                      </tr>
                    ) : (
                      filteredVerified.map((user, idx) => (
                        <tr key={user.loomId || user.uid || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            <div>{user.email || 'N/A'}</div>
                            {user.userName && user.userName !== user.email && (
                              <div className="text-xs text-slate-500">{user.userName}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-slate-700 uppercase text-xs tracking-wide">{user.provider || 'BASIC'}</span>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-900 whitespace-nowrap">
                            {formatDateTime(user.creationTime)}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-900 whitespace-nowrap">
                            {formatDateTime(user.lastAccessTime)}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <Link
                              href={`/user/cart/${user.loomId || user.uid}`}
                              target="_blank"
                              className="px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            >
                              View Cart
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: UN-VERIFIED USERS */}
          {activeTab === 'unverified' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Email / Name</th>
                      <th className="px-6 py-4 text-center">Auth Provider</th>
                      <th className="px-6 py-4 text-right">Date of Joining</th>
                      <th className="px-6 py-4 text-right">Last Login</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUnverified.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          No un-verified users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUnverified.map((user, idx) => (
                        <tr key={user.loomId || user.uid || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            <div>{user.email || 'N/A'}</div>
                            {user.userName && user.userName !== user.email && (
                              <div className="text-xs text-slate-500">{user.userName}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-slate-700 uppercase text-xs tracking-wide">{user.provider || 'BASIC'}</span>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-900 whitespace-nowrap">
                            {formatDateTime(user.creationTime)}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-900 whitespace-nowrap">
                            {formatDateTime(user.lastAccessTime)}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <Link
                              href={`/user/cart/${user.loomId || user.uid}`}
                              target="_blank"
                              className="px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            >
                              View Cart
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
