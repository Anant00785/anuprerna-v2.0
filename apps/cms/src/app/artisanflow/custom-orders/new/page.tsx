/**
 * /artisanflow/custom-orders/new — create a custom order.
 *
 * Server component: fetches the customer list (sandbox copy) and the custom-
 * product catalogue, then hands them to the client form. The actual create write
 * (POST add/custom-order) is issued by the form via /api/crud -> sandbox pg only.
 */

import { ArtisanFlowShell } from '@/components/artisanflow/ArtisanFlowShell';
import { getSandboxToken } from '@/lib/sandbox-token';
import { getCustomProductList } from '@/lib/custom-products-api';
import { NewCustomOrderForm, type CustomerLite } from './NewCustomOrderForm';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';

async function fetchCustomers(): Promise<CustomerLite[]> {
  const token = getSandboxToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Origin: 'localhost' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const seen = new Set<number>();
  const out: CustomerLite[] = [];
  for (const verified of ['true', 'false']) {
    try {
      const res = await fetch(
        BACKEND + '/get/customers?pageNumber=0&pageSize=800&verified=' + verified,
        { headers, cache: 'no-store' },
      );
      if (!res.ok) continue;
      const j = (await res.json()) as { customerList?: Record<string, unknown>[] };
      for (const c of j.customerList ?? []) {
        const tenantId = Number(c['tenantId']);
        if (!tenantId || seen.has(tenantId)) continue;
        seen.add(tenantId);
        out.push({
          tenantId,
          userName: String(c['userName'] ?? ''),
          email: String(c['email'] ?? ''),
          isActiveLoyaltyUser: Boolean(c['isActiveLoyaltyUser']),
        });
      }
    } catch {
      /* degrade to whatever we have */
    }
  }
  out.sort((a, b) => (a.userName || '').localeCompare(b.userName || ''));
  return out;
}

export default async function NewCustomOrderPage() {
  const [customers, productsResult] = await Promise.all([fetchCustomers(), getCustomProductList()]);
  const products = productsResult.ok
    ? productsResult.data.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        productGroup: p.productGroup,
        unit: p.unit,
        heroImage: p.heroImage,
      }))
    : [];

  return (
    <ArtisanFlowShell parentCrumb={{ label: 'Custom Orders', href: '/artisanflow/custom-orders' }} crumb="New">
      <NewCustomOrderForm customers={customers} products={products} />
    </ArtisanFlowShell>
  );
}
