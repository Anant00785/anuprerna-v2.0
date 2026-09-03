import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet, loomPatch } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { isWrapperToken } from '@/lib/loom/token';

export async function PATCH(request: Request) {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
  }
  if (!isWrapperToken(token)) {
    return NextResponse.json(
      { success: false, reauth: true, message: 'Your session has expired — please sign in again.' },
      { status: 401 },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }
  const id = Number((body as { id?: unknown })?.id);
  const quantity = Number((body as { quantity?: unknown })?.quantity);
  if (!Number.isFinite(id) || !Number.isFinite(quantity) || quantity < 0) {
    return NextResponse.json({ success: false, message: 'id and a non-negative quantity are required.' }, { status: 400 });
  }

  // The backend re-binds the WHOLE cart-item entity on update, so a bare
  // {id, quantity} is rejected ("selectedFinishId must be a string").
  //
  // The row is therefore re-read HERE and the new quantity merged onto the
  // server's own copy. The client still sends only {id, quantity}: it must
  // never echo a price back, which is what silently discarded volume discounts
  // and wiped fabric/size/customSize selections when the drawer rebuilt the
  // row from its cached preview.
  try {
    const cart = await loomGet<{ cartItemList?: Record<string, unknown>[] }>(
      '/get/cart-item/list',
      { token },
    );
    const row = (cart?.cartItemList ?? []).find((r) => Number(r?.id) === id);
    if (!row) {
      return NextResponse.json({ success: false, message: 'That cart item no longer exists.' }, { status: 404 });
    }

    // Only the quantity changes. Foreign keys are flattened back to the ids the
    // write contract expects, and NOT NULL columns are preserved as sent.
    //
    // The product FK is taken from the stored row's preview when the backend
    // hydrates one; it does not always, and the write validator REQUIRES the id
    // for fabric/swatch/finished rows. So the caller may pass the id it already
    // holds as a fallback. It is only ever a fallback — it identifies the row's
    // product, never its price, so it cannot be used to re-price the line.
    const bodyFabricId = Number((body as { fabricProductId?: unknown })?.fabricProductId);
    const bodyFinishedId = Number((body as { finishedProductId?: unknown })?.finishedProductId);
    const payload: Record<string, unknown> = {
      ...row,
      quantity,
      fabricProductId:
        (row.fabricProductPreview as { id?: number } | null)?.id ??
        row.fabricProductId ??
        (Number.isFinite(bodyFabricId) && bodyFabricId > 0 ? bodyFabricId : undefined),
      finishedProductId:
        (row.finishedProductPreview as { id?: number } | null)?.id ??
        row.finishedProductId ??
        (Number.isFinite(bodyFinishedId) && bodyFinishedId > 0 ? bodyFinishedId : undefined),
      selectedFinishId: typeof row.selectedFinishId === 'string' ? row.selectedFinishId : '',
      customSize: row.customSize ?? {},
    };
    delete payload.fabricProductPreview;
    delete payload.finishedProductPreview;

    const result = await loomPatch('/update/cart-item', payload, { token });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, message: 'Could not update the cart.' }, { status: 502 });
  }
}
