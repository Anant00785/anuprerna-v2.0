import { redirect } from "next/navigation";

export default async function SearchRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || resolvedParams.search || "";
  const queryString = q ? `?search=${encodeURIComponent(String(q))}` : "";
  redirect(`/display/search${queryString}`);
}
