import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function Footer() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative bg-surface-900 py-8 px-5 text-center"
    >
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-cyan to-transparent opacity-40" />

      <div className="flex justify-center gap-6 mb-5">
        <a
          href="mailto:frederik.heda@gmx.net"
          className="text-zinc-400 hover:text-accent-gold text-xl transition-colors duration-300"
          aria-label="Email"
        >
          <i className="fas fa-envelope" />
        </a>
        <a
          href="https://www.linkedin.com/in/frederik-heda/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-[#0A66C2] text-xl transition-colors duration-300"
          aria-label="LinkedIn"
        >
          <i className="fab fa-linkedin" />
        </a>
        <a
          href="https://github.com/Fredheda?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-white text-xl transition-colors duration-300"
          aria-label="GitHub"
        >
          <i className="fab fa-github" />
        </a>
      </div>

      <p className="inline-block m-0 text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} Frederik Heda |{' '}
        <Link to="/privacy-policy" className="text-zinc-500 hover:text-zinc-300 no-underline link-underline transition-colors duration-300">
          Privacy Policy
        </Link>
      </p>

      {/* Back to top */}
      {showTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-6 z-30 w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-accent-cyan hover:border-accent-cyan/50 transition-all duration-300 flex items-center justify-center shadow-lg"
          aria-label="Back to top"
        >
          <i className="fas fa-arrow-up text-sm" />
        </motion.button>
      )}
    </motion.footer>
  );
}

export default Footer;
