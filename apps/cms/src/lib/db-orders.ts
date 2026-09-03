import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import type { OrderRow, OrderDetail, OrderItemRow } from './api';

const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_F1GySf6XvrZq@ep-small-cell-ayxce8q9-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DB_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

// Fallback JSON path (shared with storefront)
const FALLBACK_PATHS = [
  path.join(process.cwd(), '..', 'storefront', '.orders-data', 'local-orders.json'),
  path.join(process.cwd(), '.orders-data', 'local-orders.json'),
];

function readFallbackOrders(): any[] {
  for (const p of FALLBACK_PATHS) {
    try {
      if (fs.existsSync(p)) {
        const text = fs.readFileSync(p, 'utf8');
        const list = JSON.parse(text);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch {
      // continue
    }
  }
  return [];
}

export async function getRecentDbOrders(): Promise<OrderRow[]> {
  const localList = readFallbackOrders();
  const dbRows: OrderRow[] = [];

  try {
    const client = await getPool().connect();
    try {
      // Fetch latest orders created
      const res = await client.query(`
        SELECT o.*,
               COALESCE((
                 SELECT json_agg(i.*)
                 FROM order_item i
                 WHERE i.order_id = o.id
               ), '[]'::json) as items
        FROM orders o
        ORDER BY o.created_at DESC
        LIMIT 50
      `);

      for (const r of res.rows) {
        const items = Array.isArray(r.items) ? r.items : [];
        const addr = typeof r.address === 'object' && r.address ? r.address : {};
        const ship = addr.shippingAddress || {};
        const overallStatus = r.cancelled_at
          ? 'CANCELLED'
          : items.some((it: any) => String(it.order_status).toUpperCase() === 'PROCESSING')
          ? 'PROCESSING'
          : 'PROCESSING';

        dbRows.push({
          id: Number(r.id),
          customerName: ship.name || String(r.zoho_order_id || 'Customer'),
          total: Number(r.total || 0),
          currency: String(r.currency || 'INR'),
          itemCount: items.length || 1,
          createdAt: Number(r.created_at || Date.now()),
          overallStatus,
          paymentStatus: 'PAID',
          paymentMode: String(r.payment_mode || 'RAZORPAY'),
          zohoOrderId: String(r.zoho_order_id || ''),
          loyaltyOrder: Boolean(r.loyalty_order),
          deleted: Boolean(r.deleted),
          hasSwatchItems: false,
          hasMadeToOrderItems: false,
          hasPreOrderItems: false,
          productType: 'FABRIC',
          isOverdue: false,
          processingItemCount: items.length,
          readyItemCount: 0,
          dispatchedItemCount: 0,
          cancelledItemCount: r.cancelled_at ? items.length : 0,
          estimatedDeliveryFrom: 0,
          estimatedDeliveryTo: 0,
        });
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('[db-orders] Could not query Neon Postgres:', err);
  }

  // Merge local fallback orders if not present in dbRows
  for (const lo of localList) {
    if (!dbRows.some((r) => r.id === lo.id)) {
      dbRows.unshift({
        id: lo.id,
        customerName: lo.customerName || 'Customer',
        total: lo.total || 0,
        currency: lo.currency || 'INR',
        itemCount: lo.items?.length || 1,
        createdAt: lo.createdAt || Date.now(),
        overallStatus: lo.overallStatus || 'PROCESSING',
        paymentStatus: lo.paymentStatus || 'PAID',
        paymentMode: lo.paymentMode || 'RAZORPAY',
        zohoOrderId: lo.orderNumber || '',
        loyaltyOrder: false,
        deleted: false,
        hasSwatchItems: false,
        hasMadeToOrderItems: false,
        hasPreOrderItems: false,
        productType: 'FABRIC',
        isOverdue: false,
        processingItemCount: lo.items?.length || 1,
        readyItemCount: 0,
        dispatchedItemCount: 0,
        cancelledItemCount: lo.overallStatus === 'CANCELLED' ? (lo.items?.length || 1) : 0,
        estimatedDeliveryFrom: 0,
        estimatedDeliveryTo: 0,
      });
    }
  }

  return dbRows;
}

export async function getDbOrderDetail(orderId: number): Promise<OrderDetail | null> {
  // Check local fallback first
  const localList = readFallbackOrders();
  const local = localList.find((o) => o.id === orderId);

  try {
    const client = await getPool().connect();
    try {
      const oRes = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
      if (oRes.rows.length > 0) {
        const row = oRes.rows[0];
        const iRes = await client.query('SELECT * FROM order_item WHERE order_id = $1', [orderId]);
        const addr = typeof row.address === 'object' && row.address ? row.address : {};
        const ship = addr.shippingAddress || {};
        const bill = addr.billingAddress || ship;

        const items: OrderItemRow[] = iRes.rows.map((it: any) => {
          const cust = typeof it.customization === 'object' && it.customization ? it.customization : {};
          return {
            id: Number(it.id),
            orderId: Number(it.order_id),
            productName: cust.name || 'Artisanal Product',
            sku: cust.sku || '',
            productGroup: String(it.product_group || 'fabric'),
            orderType: String(it.order_type || 'IN_STOCK'),
            quantity: Number(it.quantity || 1),
            unit: String(it.unit || 'UNIT'),
            price: Number(it.price || 0),
            currency: String(it.currency || 'INR'),
            orderStatus: String(it.order_status || 'PROCESSING'),
            paymentStatus: String(it.payment_status || 'PAID'),
            dispatchedOn: 0,
            estimatedDeliveryFrom: 0,
            estimatedDeliveryTo: 0,
            trackingUrl: '',
            shippingCode: '',
            zohoPackageId: '',
          };
        });

        return {
          id: Number(row.id),
          version: 1,
          customerName: ship.name || 'Customer',
          subTotal: Number(row.sub_total || 0),
          shippingCost: Number(row.shipping_cost || 0),
          total: Number(row.total || 0),
          currency: String(row.currency || 'INR'),
          advancePay: Number(row.advance_pay || row.total || 0),
          remainingPay: 0,
          autoDiscount: 0,
          couponApplied: false,
          couponCode: '',
          couponDiscount: 0,
          couponDiscountAmount: 0,
          loyaltyOrder: false,
          loyaltyDiscount: 0,
          loyaltyDiscountAmount: 0,
          note: String(row.note || ''),
          globalNote: '',
          zohoOrderId: String(row.zoho_order_id || ''),
          paymentMode: String(row.payment_mode || 'RAZORPAY'),
          exchangeRate: 1,
          createdAt: Number(row.created_at || Date.now()),
          deleted: Boolean(row.deleted),
          cancellationReason: String(row.cancellation_reason || ''),
          shippingAddress: ship.name ? ship : undefined,
          billingAddress: bill.name ? bill : undefined,
          items,
          transactions: [
            {
              id: 1,
              amount: Number(row.total || 0),
              currency: String(row.currency || 'INR'),
              status: 'PAID',
              transactionId: `tx_${row.id}`,
              createdAt: String(row.created_at || Date.now()),
            },
          ],
        };
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('[db-orders] Error fetching order detail from DB:', err);
  }

  if (local) {
    return {
      id: local.id,
      version: 1,
      customerName: local.customerName || 'Customer',
      subTotal: local.subTotal || 0,
      shippingCost: local.shippingCost || 0,
      total: local.total || 0,
      currency: local.currency || 'INR',
      advancePay: local.total || 0,
      remainingPay: 0,
      autoDiscount: 0,
      couponApplied: false,
      couponCode: '',
      couponDiscount: 0,
      couponDiscountAmount: 0,
      loyaltyOrder: false,
      loyaltyDiscount: 0,
      loyaltyDiscountAmount: 0,
      note: local.orderNumber || '',
      globalNote: '',
      zohoOrderId: local.orderNumber || '',
      paymentMode: local.paymentMode || 'RAZORPAY',
      exchangeRate: 1,
      createdAt: local.createdAt || Date.now(),
      deleted: false,
      cancellationReason: local.cancellationReason || '',
      shippingAddress: local.shippingAddress,
      billingAddress: local.billingAddress,
      items: (local.items || []).map((it: any) => ({
        id: it.id,
        orderId: local.id,
        productName: it.productName,
        sku: it.sku || '',
        productGroup: it.productGroup || 'fabric',
        orderType: it.orderType || 'IN_STOCK',
        quantity: it.quantity || 1,
        unit: it.unit || 'UNIT',
        price: it.price || 0,
        currency: it.currency || 'INR',
        orderStatus: it.orderStatus || 'PROCESSING',
        paymentStatus: it.paymentStatus || 'PAID',
        dispatchedOn: 0,
        estimatedDeliveryFrom: 0,
        estimatedDeliveryTo: 0,
        trackingUrl: '',
        shippingCode: '',
        zohoPackageId: '',
      })),
      transactions: [
        {
          id: 1,
          amount: local.total || 0,
          currency: local.currency || 'INR',
          status: 'PAID',
          transactionId: `tx_${local.id}`,
          createdAt: String(local.createdAt || Date.now()),
        },
      ],
    };
  }

  return null;
}
