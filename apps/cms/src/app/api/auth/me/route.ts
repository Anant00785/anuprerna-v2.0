import { NextResponse } from "next/server";
import { getIdentity } from "@/lib/feedback-identity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Who-am-I for the Page-Feedback widget: presence of the weave_token cookie
// gates the widget (logged-in only); weave_user supplies email/name + owner.
export async function GET() {
  return NextResponse.json(await getIdentity());
}
