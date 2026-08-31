import { Suspense } from 'react';
import SearchBox from '@/components/content-list/SearchBox';
import SearchResultsDisplay from '@/components/content-list/SearchResultsDisplay';
import { getSearchResults, getCatalogueTerms } from '@/components/content-list/loom';
import { didYouMean } from '@/components/content-list/search-suggest';

// Next.js 15 passes searchParams as a Promise in App Router.
// Live uses ?search=<term>; we mirror that and ALSO accept ?term= as a fallback.
interface PageProps {
  searchParams: Promise<{ search?: string; term?: string }>;
}

async function Results({ term, terms }: { term: string; terms: string[] }) {
  const results = await getSearchResults(term);
  const suggestion = didYouMean(term, terms);
  return (
    <SearchResultsDisplay term={term} results={results} suggestion={suggestion} />
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const term = (params?.search ?? params?.term ?? '').trim();

  // Catalogue terms power client-side autocomplete + the 'did you mean' hint.
  // Fault-tolerant — an empty list simply disables those affordances.
  const terms = await getCatalogueTerms().catch(() => [] as string[]);

  return (
    <main className='bg-white min-h-screen'>
      {/* Search bar — centred, matches live layout */}
      <div className='pt-12 pb-6 px-4'>
        <SearchBox initialTerm={term} terms={terms} />
      </div>

      {/* Results section — only when a term is present */}
      {term && (
        <Suspense
          fallback={
            <div className='text-center py-20 text-black/40 text-sm'>Searching…</div>
          }
        >
          <Results term={term} terms={terms} />
        </Suspense>
      )}
    </main>
  );
}
