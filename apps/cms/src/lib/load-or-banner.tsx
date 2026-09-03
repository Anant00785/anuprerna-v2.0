import React from "react";
import { BackendFetchError } from "@/lib/backend-fetch-error";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { WeaveShell } from "@/components/weave/WeaveShell";

/**
 * The one place a CMS page turns a failed backend read into a visible error.
 *
 * Every list page has the same body: await a fetch, hand the rows to a client
 * component. When the fetch throws (Loom unreachable, 401, 5xx, or a
 * `{success:false}` envelope) the page must show WHY — an empty table is a lie,
 * because "the backend refused" and "there are no rows" are different facts and
 * the operator can only act on one of them.
 *
 * This is the pattern already written by hand in artisanflow/workflow/page.tsx
 * and artisans/[id]/page.tsx, factored out so the remaining ~25 list pages get
 * it in one line instead of 25 copies of the same try/catch.
 *
 * Only BackendFetchError is caught. A genuine bug in `render` (or any other
 * exception) still propagates to Next's error boundary — swallowing those would
 * re-create the exact class of silent failure this function exists to fix.
 */
export async function loadOrBanner<T>(
  load: () => Promise<T>,
  render: (data: T) => React.ReactNode,
): Promise<React.ReactNode> {
  let data: T;
  try {
    data = await load();
  } catch (e) {
    if (!(e instanceof BackendFetchError)) throw e;
    return (
      <WeaveShell>
        <ErrorBanner message={e.message} />
      </WeaveShell>
    );
  }
  return render(data);
}
