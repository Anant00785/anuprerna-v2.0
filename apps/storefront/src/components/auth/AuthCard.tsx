// Shared card shell for all auth pages (login, forgot-password, reset, verify).
// Renders the Anuprerna logo mark + letter, a title + subtitle, and a content slot.
// Matches the live Angular layout: centered card with off-white bg on sand page bg.
export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      className='min-h-[80vh] flex items-center justify-center px-4 py-16'
      style={{ background: 'radial-gradient(ellipse at top, #f5f2ed 0%, #faf9f7 100%)' }}
    >
      <div className='w-full max-w-md bg-white rounded-2xl shadow-md px-8 py-10 sm:px-10'>
        {/* Brand mark */}
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-9 h-9 rounded-full border border-clay flex items-center justify-center'>
            <span className='text-clay font-semibold text-base leading-none'>A</span>
          </div>
          <span className='text-xs font-medium tracking-[.22em] text-clay uppercase'>Anuprerna</span>
        </div>

        <h1 className='text-2xl font-medium text-black mb-1'>{title}</h1>
        {subtitle && (
          <p className='text-sm text-black/55 mb-6'>{subtitle}</p>
        )}
        {children}
      </div>
    </main>
  );
}
