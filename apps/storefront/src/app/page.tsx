// Home page -- buyer-mode-aware composition (v1, founder taste review).
// Section rendering + per-mode ordering now lives in the client component
// BuyerModeHome (reads useBuyerMode). Mode only changes ORDER/EMPHASIS -- every
// section is always present and no price ever depends on mode (lib/buyer-mode.ts).
//   guest/b2c -> shoppable-forward (Hero -> Finished -> Featured -> trust
//                -> Collaborations -> Reviews -> Manufacturing
//                -> Wholesale invitation -> Wholesale -> News)
//   b2b       -> capability-forward (Hero -> Manufacturing -> Wholesale
//                -> Collaborations -> Featured -> trust -> Reviews
//                -> Finished -> News)
// ISR preserved: SSR renders the guest-default order that the cache is keyed on.
//
// ManufacturingProcess and Collaborations are SERVER components rendered HERE and
// handed to BuyerModeHome as slots. Collaborations is async (it fetches the Loom
// collaboration stories + co-created products with revalidate 3600); importing it
// into the client component would move that fetch into the browser and defeat the
// ISR cache, so it is passed through as a child instead.
// Header + Footer live in app/layout.tsx (shared SiteHeader/SiteFooter).
import BuyerModeHome from "../components/BuyerModeHome";
import ManufacturingProcess from "../components/ManufacturingProcess";
import Collaborations from "../components/Collaborations";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <BuyerModeHome
        manufacturing={<ManufacturingProcess />}
        collaborations={<Collaborations />}
      />
    </main>
  );
}
