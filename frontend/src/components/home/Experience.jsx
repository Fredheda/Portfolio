import { content } from '../../lib/content';
import Section from './Section';

export default function Experience() {
  return (
    <Section id="experience" title="Experience">
      <div className="grid gap-4 md:grid-cols-2">
        {content.experience.map((entry) => (
          <article key={entry.id} className="rounded-xl border border-line bg-white p-5">
            <h3 className="m-0 text-base font-semibold">{entry.role}</h3>
            <p className="mt-1 text-sm text-muted">
              {entry.sector} · {entry.start} to {entry.end ?? 'now'}
            </p>
            <p className="mt-3 leading-relaxed">{entry.impact}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
