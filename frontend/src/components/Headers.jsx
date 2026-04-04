import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/#about', label: 'About' },
  { href: '/#skills', label: 'Skills' },
  { href: '/#projects', label: 'Projects' },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 flex flex-row justify-between items-center px-6 backdrop-blur-md text-white transition-all duration-300 border-b ${
          scrolled
            ? 'py-3 bg-surface-950/95 border-zinc-800'
            : 'py-4 bg-surface-950/80 border-accent-cyan/20'
        }`}
      >
        {/* Logo */}
        <RouterLink to="/" className="flex items-center gap-2 text-zinc-300 hover:text-accent-cyan transition-colors duration-300 no-underline">
          <img src="/images/logo.png" alt="FH" className="h-7 w-7 rounded" />
        </RouterLink>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="link-underline text-zinc-400 hover:text-white text-sm font-medium transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Social icons + hamburger */}
        <div className="flex items-center gap-4">
          <a
            href="mailto:frederik.heda@gmx.net"
            className="hidden sm:flex text-zinc-300 hover:text-accent-gold no-underline text-xl bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-700/50 hover:border-accent-gold/50 transition-all duration-300 hover:scale-110"
          >
            <i className="fas fa-envelope" />
          </a>
          <a
            href="https://www.linkedin.com/in/frederik-heda/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex text-zinc-300 hover:text-[#0A66C2] no-underline text-xl bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-700/50 hover:border-[#0A66C2]/50 transition-all duration-300 hover:scale-110"
          >
            <i className="fab fa-linkedin" />
          </a>
          <a
            href="https://github.com/Fredheda?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex text-zinc-300 hover:text-white no-underline text-xl bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-700/50 hover:border-zinc-400/50 transition-all duration-300 hover:scale-110"
          >
            <i className="fab fa-github" />
          </a>

          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
            aria-label="Toggle menu"
          >
            <motion.span
              className="block w-5 h-[2px] bg-zinc-300 rounded-full"
              animate={mobileOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
            />
            <motion.span
              className="block w-5 h-[2px] bg-zinc-300 rounded-full"
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.15 }}
            />
            <motion.span
              className="block w-5 h-[2px] bg-zinc-300 rounded-full"
              animate={mobileOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
            />
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-30 bg-surface-950/98 backdrop-blur-lg flex flex-col items-center justify-center gap-8"
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="text-2xl font-heading font-bold text-white hover:text-accent-cyan transition-colors"
              >
                {link.label}
              </motion.a>
            ))}

            {/* Mobile social icons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex gap-6 mt-4"
            >
              <a href="mailto:frederik.heda@gmx.net" className="text-zinc-400 hover:text-accent-gold text-2xl transition-colors">
                <i className="fas fa-envelope" />
              </a>
              <a href="https://www.linkedin.com/in/frederik-heda/" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#0A66C2] text-2xl transition-colors">
                <i className="fab fa-linkedin" />
              </a>
              <a href="https://github.com/Fredheda?tab=repositories" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white text-2xl transition-colors">
                <i className="fab fa-github" />
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
