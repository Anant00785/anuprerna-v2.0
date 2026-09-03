import { CustomContentPage } from "@/components/content/CustomContentPage";

export default function InternationalOrdersPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <main className="w-full">
          <CustomContentPage blogId="shipping-policy" />
        </main>
      </div>
    </div>
  );
}
