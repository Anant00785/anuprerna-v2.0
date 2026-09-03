import { CustomContentPage } from "@/components/content/CustomContentPage";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <main className="w-full">
          <CustomContentPage blogId="terms-and-conditions" />
        </main>
      </div>
    </div>
  );
}
