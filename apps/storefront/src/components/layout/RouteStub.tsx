// Foundation placeholder for scaffolded routes. Later workers replace the body
// of each page with the real implementation; the shared header/footer come from
// app/layout.tsx so there are no structural collisions.
export default function RouteStub({
  name,
  note,
}: {
  name: string;
  note?: string;
}) {
  return (
    <main className='min-h-[60vh] bg-white text-black'>
      <div className='mx-auto max-w-screen-xl px-5 py-24 text-center'>
        <p className='text-xs uppercase tracking-[.2em] text-bark mb-3'>Foundation scaffold</p>
        <h1 className='text-3xl sm:text-4xl font-medium text-clay'>{name}</h1>
        <p className='mt-4 text-black/60'>{note || 'Coming soon — this page is a foundation scaffold.'}</p>
      </div>
    </main>
  );
}
