import { redirect } from "next/navigation";

export default async function FilterGroupRedirectPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const resolvedParams = await params;
  redirect(`/products/${resolvedParams.group || "fabric"}`);
}
