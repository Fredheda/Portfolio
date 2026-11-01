import { content } from '../lib/content';

const { links } = content.profile;

const items = [
  { label: 'Email', href: links.email, icon: 'fas fa-envelope', external: false },
  { label: 'LinkedIn', href: links.linkedin, icon: 'fab fa-linkedin', external: true },
  { label: 'GitHub', href: links.github, icon: 'fab fa-github', external: true },
];

// Email, LinkedIn and GitHub as icon buttons; used by the header, the mobile
// menu and the footer.
export default function ContactLinks({ className = '' }) {
  return (
    <div className={`items-center gap-2 ${className}`}>
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          aria-label={item.label}
          {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink no-underline transition-colors hover:border-royal hover:text-royal"
        >
          <i className={item.icon} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
