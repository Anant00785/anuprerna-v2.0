import { NextResponse } from 'next/server';
import { getForex, getForexList } from '@/lib/loom/endpoints';

// GET -> the TWO numbers live prices a foreign order with:
//   forexExchangeRate  the day's market rate, per 1 INR (Loom forex_exchange_rate)
//   forexList          the studio's per-market uplift  (Loom forex)
// The effective rate is their product. Returning only the first one is the bug
// that under-priced every non-INR display by the 1.25 uplift.
// Lets the client currency selector refetch without exposing Loom directly.
export async function GET() {
  const [rate, list] = await Promise.all([getForex(), getForexList()]);
  return NextResponse.json({ forexExchangeRate: rate, forexList: list });
}
