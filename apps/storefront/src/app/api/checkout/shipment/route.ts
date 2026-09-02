import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

const DEFAULT_SHIPMENT_LIST = [
  {
    id: 16104210,
    version: 1,
    name: 'Express - By Air',
    baseAmount: 200,
    baseQuantity: 5,
    additionalAmount: 15,
    estimatedFromDay: 3,
    estimatedToDay: 4,
    locationType: 'DOMESTIC',
  },
  {
    id: 21209,
    version: 31,
    name: 'Regular - By Road',
    baseAmount: 150,
    baseQuantity: 1,
    additionalAmount: 50,
    estimatedFromDay: 3,
    estimatedToDay: 7,
    locationType: 'DOMESTIC',
  },
  {
    id: 62591603,
    version: 6,
    name: 'Standard International Shipping (DDP)',
    baseAmount: 3000,
    baseQuantity: 4,
    additionalAmount: 125,
    estimatedFromDay: 10,
    estimatedToDay: 20,
    locationType: 'INTERNATIONAL',
  },
];

export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;

  // 1. Try local NestJS backend first
  try {
    const nestRes = await fetch('http://127.0.0.1:3000/get/shipment-list', {
      headers: { Origin: 'localhost', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (nestRes.ok) {
      const nestData = await nestRes.json();
      const list = nestData?.shipmentList || nestData?.entity;
      if (Array.isArray(list) && list.length > 0) {
        return NextResponse.json({ shipmentList: list, success: true, authenticated: !!token });
      }
    }
  } catch {
    // ignore
  }

  // 2. Try remote Loom
  const path = token ? '/get/shipment-list' : '/checkout/shipment-list';
  try {
    const data = await loomGet<{ shipmentList?: unknown[]; success?: boolean }>(
      path,
      token ? { token } : undefined,
    );
    const list = data?.shipmentList;
    if (Array.isArray(list) && list.length > 0) {
      return NextResponse.json({ ...data, authenticated: !!token });
    }
  } catch {
    // ignore
  }

  // 3. Fallback to default shipment options
  return NextResponse.json({
    shipmentList: DEFAULT_SHIPMENT_LIST,
    success: true,
    authenticated: !!token,
  });
}
