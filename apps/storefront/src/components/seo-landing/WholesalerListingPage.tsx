interface LocationEntry {
  slug: string;
  city: string;
  country: string;
}

interface Region {
  name: string;
  locations: LocationEntry[];
}

const REGIONS: Region[] = [
  {
    name: 'North America',
    locations: [
      { slug: 'new-york-city', city: 'New York City', country: 'United States' },
      { slug: 'manhattan', city: 'Manhattan', country: 'United States' },
      { slug: 'brooklyn', city: 'Brooklyn', country: 'United States' },
      { slug: 'queens', city: 'Queens', country: 'United States' },
      { slug: 'los-angeles', city: 'Los Angeles', country: 'United States' },
      { slug: 'santa-monica', city: 'Santa Monica', country: 'United States' },
      { slug: 'culver-city', city: 'Culver City', country: 'United States' },
      { slug: 'pasadena', city: 'Pasadena', country: 'United States' },
      { slug: 'san-francisco-bay-area', city: 'San Francisco Bay Area', country: 'United States' },
      { slug: 'san-francisco', city: 'San Francisco', country: 'United States' },
      { slug: 'san-jose', city: 'San Jose', country: 'United States' },
      { slug: 'palo-alto', city: 'Palo Alto', country: 'United States' },
      { slug: 'mountain-view', city: 'Mountain View', country: 'United States' },
      { slug: 'oakland', city: 'Oakland', country: 'United States' },
      { slug: 'seattle', city: 'Seattle', country: 'United States' },
      { slug: 'portland', city: 'Portland', country: 'United States' },
      { slug: 'austin', city: 'Austin', country: 'United States' },
      { slug: 'dallas', city: 'Dallas', country: 'United States' },
      { slug: 'houston', city: 'Houston', country: 'United States' },
      { slug: 'chicago', city: 'Chicago', country: 'United States' },
    ],
  },
  {
    name: 'South America',
    locations: [
      { slug: 'sao-paulo', city: 'São Paulo', country: 'Brazil' },
      { slug: 'buenos-aires', city: 'Buenos Aires', country: 'Argentina' },
      { slug: 'bogota', city: 'Bogotá', country: 'Colombia' },
      { slug: 'lima', city: 'Lima', country: 'Peru' },
      { slug: 'santiago', city: 'Santiago', country: 'Chile' },
    ],
  },
  {
    name: 'Europe',
    locations: [
      { slug: 'london', city: 'London', country: 'UK' },
      { slug: 'paris', city: 'Paris', country: 'France' },
      { slug: 'milan', city: 'Milan', country: 'Italy' },
      { slug: 'berlin', city: 'Berlin', country: 'Germany' },
      { slug: 'amsterdam', city: 'Amsterdam', country: 'Netherlands' },
      { slug: 'barcelona', city: 'Barcelona', country: 'Spain' },
      { slug: 'madrid', city: 'Madrid', country: 'Spain' },
      { slug: 'stockholm', city: 'Stockholm', country: 'Sweden' },
      { slug: 'copenhagen', city: 'Copenhagen', country: 'Denmark' },
      { slug: 'oslo', city: 'Oslo', country: 'Norway' },
    ],
  },
  {
    name: 'Asia',
    locations: [
      { slug: 'tokyo', city: 'Tokyo', country: 'Japan' },
      { slug: 'singapore', city: 'Singapore', country: 'Singapore' },
      { slug: 'hong-kong', city: 'Hong Kong', country: 'Hong Kong' },
      { slug: 'seoul', city: 'Seoul', country: 'South Korea' },
      { slug: 'dubai', city: 'Dubai', country: 'UAE' },
      { slug: 'bangkok', city: 'Bangkok', country: 'Thailand' },
      { slug: 'kuala-lumpur', city: 'Kuala Lumpur', country: 'Malaysia' },
      { slug: 'jakarta', city: 'Jakarta', country: 'Indonesia' },
      { slug: 'taipei', city: 'Taipei', country: 'Taiwan' },
    ],
  },
  {
    name: 'Oceania',
    locations: [
      { slug: 'sydney', city: 'Sydney', country: 'Australia' },
      { slug: 'melbourne', city: 'Melbourne', country: 'Australia' },
      { slug: 'brisbane', city: 'Brisbane', country: 'Australia' },
      { slug: 'perth', city: 'Perth', country: 'Australia' },
    ],
  },
];

function LocationCard({ location }: { location: LocationEntry }) {
  return (
    <a
      href={`/fabric-wholesaler/${location.slug}`}
      aria-label={`Fabric Wholesaler in ${location.city}, ${location.country}`}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
    >
      <p className="text-xs text-gray-500 mb-1">Fabric Wholesaler in</p>
      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
        {location.city}
      </h3>
      <p className="text-xs text-gray-400 mt-0.5">{location.country}</p>
    </a>
  );
}

export default function WholesalerListingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#F9F4F5] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Global Fabric Wholesaler
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Anuprerna supplies premium handwoven fabrics to fashion brands, designers, and
            retailers across the globe. Find a wholesale fabric supplier near you.
          </p>
        </div>
      </section>

      {/* Location grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {REGIONS.map((region) => (
            <div key={region.name}>
              <div className="bg-[#EAEBF1] px-6 py-4 rounded-lg mb-6">
                <h2 className="font-serif text-xl font-bold text-gray-900">{region.name}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {region.locations.map((loc) => (
                  <LocationCard key={loc.slug} location={loc} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
