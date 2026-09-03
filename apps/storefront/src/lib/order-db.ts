import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export interface StoredOrderItem {
  id: number;
  orderId: number;
  productName: string;
  heroImage?: string;
  sku?: string;
  slug?: string;
  orderType: string;
  productGroup: string;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  orderStatus: string;
  paymentStatus: string;
}

export interface StoredOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subTotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  paymentMode: string;
  paymentStatus: string;
  overallStatus: string;
  shippingAddress: Record<string, any>;
  billingAddress?: Record<string, any>;
  items: StoredOrderItem[];
  createdAt: number;
  cancelledAt?: number | null;
  cancellationReason?: string | null;
  guestOrder: boolean;
  guestToken?: string;
}

const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_F1GySf6XvrZq@ep-small-cell-ayxce8q9-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';

let pool: Pool | null = null;
export function getPool(): Pool {
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

// Local fallback JSON file for durability across restarts
const FALLBACK_DIR = path.join(process.cwd(), '.orders-data');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'local-orders.json');

function ensureFallbackDir() {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
  } catch {
    // ignore
  }
}

function readFallbackOrders(): StoredOrder[] {
  try {
    ensureFallbackDir();
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf8');
      return JSON.parse(data) || [];
    }
  } catch {
    // ignore
  }
  return [];
}

function writeFallbackOrders(orders: StoredOrder[]) {
  try {
    ensureFallbackDir();
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

export async function saveOrder(order: StoredOrder): Promise<boolean> {
  // 1. Always save to local fallback
  const current = readFallbackOrders();
  const existingIdx = current.findIndex((o) => o.id === order.id);
  if (existingIdx >= 0) {
    current[existingIdx] = order;
  } else {
    current.unshift(order);
  }
  writeFallbackOrders(current);

  // 2. Persist to Neon Postgres DB
  try {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');

      const addressJson = JSON.stringify({
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress || order.shippingAddress,
      });

      const shippingModeJson = JSON.stringify({
        id: 16104210,
        name: 'Standard Delivery',
        locationType: 'DOMESTIC',
      });

      // Resolve valid tenant_id from loom_tenant
      let tenantId = 9365;
      try {
        const tRes = await client.query('SELECT id FROM loom_tenant ORDER BY id LIMIT 1');
        if (tRes.rows.length > 0) {
          tenantId = Number(tRes.rows[0].id);
        }
      } catch {
        // fallback
      }

      // Insert into orders table
      await client.query(
        `INSERT INTO orders (
          id, version, tenant_id, sub_total, shipping_mode, shipping_cost, total, currency,
          advance_pay, remaining_pay, auto_discount, coupon_applied, coupon_code, coupon_discount,
          address, note, gift, created_at, failed_error_code, failed_error_message,
          deleted, zoho_order_id, cancelled_at, cancellation_reason, coupon_discount_amount,
          loyalty_order, exchange_rate, loyalty_discount, loyalty_discount_amount, payment_mode
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25,
          $26, $27, $28, $29, $30
        ) ON CONFLICT (id) DO UPDATE SET
          advance_pay = EXCLUDED.advance_pay,
          payment_mode = EXCLUDED.payment_mode,
          cancelled_at = EXCLUDED.cancelled_at,
          cancellation_reason = EXCLUDED.cancellation_reason`,
        [
          order.id,
          1,
          tenantId,
          order.subTotal.toFixed(2),
          shippingModeJson,
          order.shippingCost.toFixed(2),
          order.total.toFixed(2),
          order.currency,
          order.total.toFixed(2), // advance_pay
          '0.00',
          '0.00',
          false,
          '',
          '0.00',
          addressJson,
          order.orderNumber, // note stores orderNumber for easy lookup
          false,
          order.createdAt,
          -1,
          '',
          false,
          order.orderNumber, // zoho_order_id carries AP-XXXXXX
          order.cancelledAt || null,
          order.cancellationReason || '',
          '0.00',
          false,
          '1.00',
          '0.00',
          '0.00',
          order.paymentMode || 'RAZORPAY',
        ],
      );

      // Insert order items
      for (const item of order.items) {
        const customizationJson = JSON.stringify({
          name: item.productName,
          heroImage: item.heroImage || '',
          sku: item.sku || '',
          slug: item.slug || '',
        });

        await client.query(
          `INSERT INTO order_item (
            id, version, order_id, order_type, product_group, customization,
            volume_discount, sale_discount_percentage, made_to_order_profile,
            quantity, unit, price, currency, shipping_code, tracking_url,
            dispatched_on, estimated_delivery_from, estimated_delivery_to,
            order_status, payment_status, created_at, updated_at, preorder_ready,
            zoho_package_id, loyalty_order, loyalty_discount_amount
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9,
            $10, $11, $12, $13, $14, $15,
            $16, $17, $18,
            $19, $20, $21, $22, $23,
            $24, $25, $26
          ) ON CONFLICT (id) DO UPDATE SET
            order_status = EXCLUDED.order_status,
            payment_status = EXCLUDED.payment_status`,
          [
            item.id,
            1,
            order.id,
            item.orderType || 'IN_STOCK',
            item.productGroup || 'fabric',
            customizationJson,
            '{}',
            '0',
            '{}',
            String(item.quantity || 1),
            item.unit || 'UNIT',
            item.price.toFixed(2),
            item.currency || 'INR',
            '',
            '',
            0,
            0,
            0,
            item.orderStatus || 'PROCESSING',
            item.paymentStatus || 'PAID',
            order.createdAt,
            order.createdAt,
            false,
            '',
            false,
            '0.00',
          ],
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (dbErr) {
      await client.query('ROLLBACK');
      console.warn('[order-db] Database insert warning (saved locally):', dbErr);
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('[order-db] Pool connection warning:', err);
  }

  return true;
}

export async function getOrder(orderId: number): Promise<StoredOrder | null> {
  // Check local fallback first
  const current = readFallbackOrders();
  const found = current.find((o) => o.id === orderId);
  if (found) return found;

  // Try DB
  try {
    const client = await getPool().connect();
    try {
      const orderRes = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
      if (orderRes.rows.length === 0) return null;
      const row = orderRes.rows[0];

      const itemRes = await client.query('SELECT * FROM order_item WHERE order_id = $1', [orderId]);
      const items: StoredOrderItem[] = itemRes.rows.map((it: any) => {
        const cust = typeof it.customization === 'object' ? it.customization : {};
        return {
          id: Number(it.id),
          orderId: Number(it.order_id),
          productName: cust?.name || 'Item',
          heroImage: cust?.heroImage || '',
          sku: cust?.sku || '',
          slug: cust?.slug || '',
          orderType: it.order_type,
          productGroup: it.product_group,
          quantity: Number(it.quantity || 1),
          unit: it.unit,
          price: Number(it.price || 0),
          currency: it.currency,
          orderStatus: it.order_status,
          paymentStatus: it.payment_status,
        };
      });

      const addr = typeof row.address === 'object' ? row.address : {};
      const ship = addr.shippingAddress || {};

      return {
        id: Number(row.id),
        orderNumber: row.zoho_order_id || row.note || `AP-${row.id}`,
        customerName: ship.name || 'Customer',
        customerEmail: ship.contactEmail || '',
        customerPhone: ship.primaryPhone || '',
        subTotal: Number(row.sub_total || 0),
        shippingCost: Number(row.shipping_cost || 0),
        total: Number(row.total || 0),
        currency: row.currency || 'INR',
        paymentMode: row.payment_mode || 'RAZORPAY',
        paymentStatus: 'PAID',
        overallStatus: row.cancelled_at ? 'CANCELLED' : 'PROCESSING',
        shippingAddress: ship,
        billingAddress: addr.billingAddress || ship,
        items,
        createdAt: Number(row.created_at || Date.now()),
        cancelledAt: row.cancelled_at ? Number(row.cancelled_at) : null,
        cancellationReason: row.cancellation_reason || null,
        guestOrder: true,
      };
    } finally {
      client.release();
    }
  } catch {
    return null;
  }
}

export async function cancelOrder(orderId: number, reason: string): Promise<boolean> {
  const cancelledAt = Date.now();

  // 1. Update local fallback
  const current = readFallbackOrders();
  const o = current.find((item) => item.id === orderId);
  if (o) {
    o.overallStatus = 'CANCELLED';
    o.cancelledAt = cancelledAt;
    o.cancellationReason = reason;
    o.items = o.items.map((it) => ({ ...it, orderStatus: 'CANCELLED' }));
    writeFallbackOrders(current);
  }

  // 2. Update DB
  try {
    const client = await getPool().connect();
    try {
      await client.query(
        `UPDATE orders SET cancelled_at = $1, cancellation_reason = $2 WHERE id = $3`,
        [cancelledAt, reason, orderId],
      );
      await client.query(
        `UPDATE order_item SET order_status = 'CANCELLED' WHERE order_id = $1`,
        [orderId],
      );
      return true;
    } finally {
      client.release();
    }
  } catch (e) {
    console.warn('[order-db] Error updating cancellation in DB:', e);
  }

  return true;
}

export function getAllLocalOrders(): StoredOrder[] {
  return readFallbackOrders();
}
