import { redirect } from "next/navigation";

// Loyalty was merged into Wholesale (one program, one page). Deep-links redirect.
export default function LoyaltyPage() {
  redirect("/wholesale");
}
