import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

export const metadata = {
  title: 'Wholesale Program | Anuprerna',
  robots: { index: false, follow: false },
};

const TEAL = '#0f766e';

function formatDateTime(epochMs: number): string {
  if (!epochMs) return '—';
  return new Date(epochMs).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function money(currency: string, value: number): string {
  return (currency ? currency + ' ' : '') + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
}

interface MembershipInfo {
  active?: boolean;
  programEnrollmentDateEpochMS?: number;
  currentCycleStartDateEpochMS?: number;
  currentCycleEndDateEpochMS?: number;
  tenureMonths?: number;
  minimumOrderValueCurrency?: string;
  minimumOrderValue?: number;
  percentileDiscount?: number;
}

interface OrderInfo {
  totalOrderCount?: number;
  averageOrderValue?: number;
  percentileUtilization?: number;
  totalAbsoluteDiscount?: number;
  totalAbsoluteOrderValueWithinTenure?: number;
}

export default async function WholesaleProgramPage() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return null;

  let membership: MembershipInfo | null = null;
  let orderInfo: OrderInfo = {};
  let firstName = '';

  try {
    const [memRes, ordRes, profRes] = await Promise.allSettled([
      loomGet<{ loyaltyProgramInfo?: MembershipInfo }>('/get/customer/loyalty/info', { token }),
      loomGet<{ loyaltyProgramInfo?: OrderInfo }>('/get/order/loyalty/info', { token }),
      loomGet<{ customer?: { tenant?: { name?: string } } }>('/get/customer/profile', { token }),
    ]);
    if (memRes.status === 'fulfilled') membership = memRes.value?.loyaltyProgramInfo ?? null;
    if (ordRes.status === 'fulfilled') orderInfo = ordRes.value?.loyaltyProgramInfo ?? {};
    if (profRes.status === 'fulfilled') firstName = (profRes.value?.customer?.tenant?.name ?? '').split(' ')[0];
  } catch {
    // empty -> no-info state below
  }

  if (!membership) {
    return (
      <>
        <meta name="robots" content="noindex" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-16 text-center">
          <span className="material-symbols-outlined text-[40px] text-gray-300 mb-3 block">workspace_premium</span>
          <p className="text-gray-500">No wholesale program information found.</p>
        </div>
      </>
    );
  }

  const currency = membership.minimumOrderValueCurrency ?? '';
  const goal = membership.minimumOrderValue ?? 0;
  const current = orderInfo.totalAbsoluteOrderValueWithinTenure ?? 0;
  const diff = current - goal;
  const met = diff === 0;
  const exceeded = diff > 0;
  const progressAmount = Math.abs(diff);
  const progressWidth = goal ? Math.min(100, (current / goal) * 100) : 0;

  // Days until cycle renewal
  const endMs = membership.currentCycleEndDateEpochMS ?? 0;
  const daysToEnd = endMs ? Math.ceil((endMs - Date.now()) / (24 * 60 * 60 * 1000)) : 0;

  // Months as member
  const enroll = membership.programEnrollmentDateEpochMS ?? 0;
  const now = new Date();
  const e = new Date(enroll);
  const monthsAsMember = enroll
    ? (now.getFullYear() - e.getFullYear()) * 12 + (now.getMonth() - e.getMonth())
    : 0;

  const isActive = membership.active === true;

  return (
    <>
      <meta name="robots" content="noindex" />

      {/* Header + progress */}
      <div className="p-6 my-6 bg-white border border-gray-100 shadow-sm rounded-2xl lg:p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 lg:text-4xl">Welcome back, {firstName || 'there'}</h1>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full"
              style={isActive ? { backgroundColor: '#ECFDF5', color: '#52a183' } : { backgroundColor: '#F3F4F6', color: '#4B5563' }}
            >
              <span className="material-symbols-outlined mr-2 text-[16px]">workspace_premium</span>
              <span>{isActive ? 'Active' : 'Expired'} Wholesale Program Member</span>
            </span>
          </div>
        </div>

        {/* Program Progress */}
        <div className="p-6 mt-8 border border-gray-100 rounded-xl" style={{ background: 'linear-gradient(90deg, rgba(15,118,110,0.05), rgba(202,138,4,0.05))' }}>
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg text-white" style={{ backgroundColor: TEAL }}>
                    <span className="material-symbols-outlined scale-75">monitoring</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Program Progress</h3>
                </div>
                {(progressAmount > 0 || met) && (
                  <span
                    className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full"
                    style={
                      exceeded
                        ? { backgroundColor: 'rgba(15,118,110,0.1)', color: TEAL }
                        : met
                        ? { backgroundColor: '#D1FAE5', color: '#047857' }
                        : { backgroundColor: '#FFE4E6', color: '#E11D48' }
                    }
                  >
                    <span className="material-symbols-outlined mr-1 text-[16px]">
                      {exceeded ? 'local_police' : met ? 'check_circle' : 'error'}
                    </span>
                    {met ? 'Goal met 🎉' : exceeded ? 'Exceeded goal by ' + money(currency, progressAmount) : money(currency, progressAmount) + ' needed to reach goal'}
                  </span>
                )}
              </div>
              <div className="relative pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block text-xs font-bold" style={{ color: TEAL }}>
                    Current Orders: <span className="text-gray-600">{money(currency, current)}</span>
                  </span>
                  <span className="inline-block text-xs font-bold text-gray-600">Minimum Goal: {money(currency, goal)}</span>
                </div>
                <div className="flex h-4 overflow-hidden text-xs bg-gray-100 rounded-full">
                  <div className="rounded-full" style={{ width: progressWidth + '%', background: 'linear-gradient(90deg,' + TEAL + ', #ca8a04)' }} />
                </div>
              </div>
            </div>
            <div className="lg:border-l lg:pl-6 lg:ml-6">
              <div className="flex flex-col items-center text-center">
                {daysToEnd >= 0 && (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{daysToEnd} Day{daysToEnd > 1 ? 's' : ''}</div>
                    <div className="text-sm text-gray-600">Until Program Renewal</div>
                  </>
                )}
                <div className="flex items-center gap-1 mt-2 text-sm" style={{ color: TEAL }}>
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <span>End{daysToEnd >= 0 ? 's' : 'ed'} {formatDateTime(endMs)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Program Details + Congratulations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 text-white rounded-lg" style={{ backgroundColor: TEAL }}>
              <span className="material-symbols-outlined scale-75">license</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Trade Program Details</h2>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Program Enrollment Date</span>
              <span className="font-medium text-gray-900">{formatDateTime(enroll)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Current Cycle Start Date</span>
              <span className="font-medium text-gray-900">{formatDateTime(membership.currentCycleStartDateEpochMS ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Current Cycle End Date</span>
              <span className="font-medium text-gray-900">{formatDateTime(endMs)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Discount Percentage</span>
              <span className="text-2xl font-bold" style={{ color: TEAL }}>{membership.percentileDiscount ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Minimum Order</span>
              <span className="text-lg font-medium text-gray-900">{money(currency, goal)}</span>
            </div>
          </div>
        </div>

        {/* Congratulations card */}
        <div className="p-6 border border-gray-100 shadow-sm rounded-2xl" style={{ background: 'linear-gradient(135deg, #efe1ec, #faf6f9)' }}>
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-white rounded-full shadow-sm">
                <span className="material-symbols-outlined !text-4xl" style={{ color: '#a8729a' }}>emoji_events</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Congratulations!</h3>
              <p className="leading-relaxed text-gray-700">
                You are now part of our exclusive wholesale trade program and will receive all the amazing benefits
                including priority support, bulk discounts, and special promotions.
              </p>
            </div>
            <div className="p-4 text-center bg-white rounded-xl">
              <div className="mb-1 text-sm text-gray-600">Total Savings to Date</div>
              <div className="text-3xl font-bold" style={{ color: TEAL }}>{money(currency, orderInfo.totalAbsoluteDiscount ?? 0)}</div>
              <div className="mt-1 text-sm text-gray-500">Since program start</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-stat strip */}
      <div className="grid grid-cols-2 gap-4 my-6 lg:grid-cols-4">
        <div className="p-4 text-center bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="text-2xl font-bold" style={{ color: '#a8729a' }}>{monthsAsMember}</div>
          <div className="text-sm text-gray-600">Months as Member</div>
        </div>
        <div className="p-4 text-center bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="text-2xl font-bold text-gray-900">{orderInfo.totalOrderCount ?? 0}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="p-4 text-center bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="text-2xl font-bold" style={{ color: TEAL }}>{money(currency, orderInfo.averageOrderValue ?? 0)}</div>
          <div className="text-sm text-gray-600">Avg Order Value</div>
        </div>
        <div className="p-4 text-center bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="text-2xl font-bold" style={{ color: TEAL }}>{Math.round(orderInfo.percentileUtilization ?? 0)}%</div>
          <div className="text-sm text-gray-600">Program Utilization</div>
        </div>
      </div>
    </>
  );
}
