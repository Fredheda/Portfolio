// A home page section: an anchor id the header links to, a serif h2 that
// names the region for screen readers, and an optional link on the right.
export default function Section({ id, title, aside = null, children, className = '' }) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className={`scroll-mt-20 py-8 md:py-10 ${className}`}>
      <div className="mx-auto max-w-page px-4 md:px-6">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 id={headingId} className="m-0 font-serif text-[1.75rem] font-semibold leading-tight tracking-[-0.01em]">
            {title}
          </h2>
          {aside}
        </div>
        {children}
      </div>
    </section>
  );
}
