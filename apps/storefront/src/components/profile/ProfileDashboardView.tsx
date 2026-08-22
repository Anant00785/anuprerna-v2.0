import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserProfile, OrderListItem } from '@/types/domain/profile';
import { OrderListCard } from './OrderListCard';
import { useCartStore } from '@/stores/cart.store';

interface ProfileDashboardViewProps {
  profile: UserProfile;
  orders: OrderListItem[];
}

export const ProfileDashboardView: React.FC<ProfileDashboardViewProps> = ({ profile, orders: initialOrders }) => {
  const [orders, setOrders] = useState<OrderListItem[]>(initialOrders);
  const { cart, open: openCart, refresh: refreshCart } = useCartStore();

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const firstName = profile.tenant.name.split(' ')[0] || 'User';

  const handleCancelOrder = (orderId: number | string) => {
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: 'CANCELLED' as const } : o))
    );
  };

  const recentOrders = orders.slice(0, 2);
  const cartItems = cart?.items || [];

  return (
    <div className="w-full space-y-8">
      {/* Welcome Title matching Angular font-size 37px centered */}
      <h3 className="text-3xl md:text-4xl font-bold text-center text-gray-900 my-4">
        Welcome {firstName}
      </h3>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <h4 className="text-xl font-bold uppercase text-[#b7a990] border-b-2 border-[#f3e9d9] pb-2 tracking-wide">
          Recent Orders
        </h4>

        {recentOrders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-x-8 lg:gap-y-5">
            {recentOrders.map((item) => (
              <OrderListCard key={item.orderId} item={item} onCancelOrder={handleCancelOrder} />
            ))}
          </div>
        ) : (
          <div className="bg-[#efeee9] p-8 text-center rounded-xl text-gray-600 text-sm">
            No recent orders found.
          </div>
        )}
      </div>

      {/* Cart Preview Section matching Angular cart_cont */}
      <div className="space-y-4">
        <h4 className="text-xl font-bold uppercase text-[#b7a990] border-b-2 border-[#f3e9d9] pb-2 tracking-wide">
          Cart
        </h4>

        <div className="bg-[#efeee9] p-6 rounded-2xl border border-amber-950/5">
          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
              {cartItems.slice(0, 3).map((item) => {
                const img =
                  item.product?.thumbnail ||
                  item.product?.gallery?.[0] ||
                  "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=300&auto=format&fit=crop";
                const unit = item.unit || (item.productGroup === "fabric" ? "Meters" : "Units");
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={openCart}
                    className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs space-y-2 hover:shadow-md transition-shadow text-left cursor-pointer w-full"
                  >
                    <img
                      src={img}
                      alt={item.product?.name || "Product"}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <p className="text-xs font-bold uppercase text-gray-900 line-clamp-2 mt-2">
                      {item.product?.name || "Fabric Item"}
                    </p>
                    <p className="text-sm font-semibold text-gray-700">
                      {item.quantity} {unit}
                    </p>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={openCart}
                className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-center items-center text-center cursor-pointer hover:bg-amber-50/50 hover:border-[#8E7862] transition-colors h-full min-h-[160px] w-full group"
              >
                <p className="text-sm font-bold uppercase text-gray-900 group-hover:text-[#8E7862] flex items-center gap-1.5 transition-colors">
                  View Cart
                  <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </p>
              </button>
            </div>
          ) : (
            <div className="text-center py-8 flex flex-col items-center justify-center gap-3">
              <p className="text-lg uppercase text-gray-600 font-semibold tracking-wider">
                Your cart is empty
              </p>
              <button
                type="button"
                onClick={openCart}
                className="text-sm font-medium text-[#8E7862] hover:underline cursor-pointer"
              >
                Open Cart Drawer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
