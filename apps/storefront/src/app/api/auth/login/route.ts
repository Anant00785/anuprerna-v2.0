import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { authenticateEmail } from '@/lib/loom/endpoints';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { getPool } from '@/lib/order-db';
import { signToken } from '@/lib/auth/token-helper';

export async function POST(req: Request) {
  let email = '';
  let password = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? body?.username ?? '').trim().toLowerCase();
    password = String(body?.password ?? '').trim();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }
  if (!email || !password) {
    return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
  }

  // 1. Check Neon PostgreSQL loom_tenant directly
  const pool = getPool();
  if (pool) {
    try {
      const client = await pool.connect();
      try {
        const tenantRes = await client.query(
          'SELECT id, email, user_name, user_password, user_type FROM loom_tenant WHERE email = $1 OR email ILIKE $1 LIMIT 1',
          [email]
        );
        if (tenantRes.rows.length > 0) {
          const tenant = tenantRes.rows[0];
          const matches = bcrypt.compareSync(password, tenant.user_password || '');
          if (matches) {
            const userName = tenant.user_name || email.split('@')[0];
            const subId = Number(tenant.id);
            if (!Number.isFinite(subId) || subId <= 0) {
              console.error('[Storefront Login] tenant row has no usable id', { email });
              return NextResponse.json(
                { success: false, message: 'Your account is not fully provisioned. Please contact support.' },
                { status: 500 },
              );
            }
            const jwtToken = signToken({
              sub: subId,
              email: tenant.email || email,
              name: userName,
              firstName: userName.split(' ')[0] || 'Member',
              contactNumber: '',
              phone: '',
              buyerType: 'b2c',
              roles: ['ROLE_CUSTOMER'],
              iat: Math.floor(Date.now() / 1000),
              exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14,
            });

            const store = await cookies();
            store.set(LOOM_JWT_COOKIE, jwtToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: 60 * 60 * 24 * 14,
            });

            return NextResponse.json({ success: true, redirectTo: '/' });
          } else {
            return NextResponse.json(
              { success: false, message: 'Invalid password. Please check your credentials.' },
              { status: 401 },
            );
          }
        }
      } finally {
        client.release();
      }
    } catch (dbErr) {
      console.warn('[Storefront Login] DB check skipped:', dbErr);
    }
  }

  // 2. Fallback to upstream Loom authenticateEmail
  const result = await authenticateEmail(email, password);
  if (!result.ok) {
    const status = result.code === 'unavailable' ? 503 : 401;
    return NextResponse.json(
      { success: false, message: result.message, passwordless: result.passwordless === true },
      { status },
    );
  }

  const store = await cookies();
  store.set(LOOM_JWT_COOKIE, result.jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });

  return NextResponse.json({ success: true });
}
