// Shared UTC-safe delivery-date helpers for the PDP surfaces (LogisticsBlock,
// ProductInfoPanel, LeadTimeDialog) so server + client render the SAME string
// (UTC accessors on both sides) and every surface quotes the same ship date.

export function addDaysUtc(days: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  return (['th', 'st', 'nd', 'rd'][day % 10] ?? 'th');
}

export function formatDeliveryDate(d: Date): string {
  const day = d.getUTCDate();
  return day + ordinal(day) + ' ' + MONTHS[d.getUTCMonth()] + ', ' + d.getUTCFullYear();
}

/** Formatted estimated-delivery string N days out (UTC-safe). */
export function estimatedDeliveryString(days: number): string {
  return formatDeliveryDate(addDaysUtc(days));
}
