import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-zinc-900 border-t border-sky-400/10 py-6 px-5 text-center">
      <div className="flex justify-center gap-5 mb-4">
        <a
          href="mailto:frederik.heda@gmx.net"
          className="text-zinc-400 hover:text-sky-400 text-xl transition-colors duration-300"
        >
          <i className="fas fa-envelope"></i>
        </a>
        <a
          href="https://www.linkedin.com/in/frederik-heda/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-sky-400 text-xl transition-colors duration-300"
        >
          <i className="fab fa-linkedin"></i>
        </a>
        <a
          href="https://github.com/Fredheda?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-sky-400 text-xl transition-colors duration-300"
        >
          <i className="fab fa-github"></i>
        </a>
      </div>
      <p className="inline-block m-0 text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} Frederik Heda |{' '}
        <Link to="/privacy-policy" className="text-zinc-500 hover:text-zinc-300 no-underline hover:underline transition-colors duration-300">
          Privacy Policy
        </Link>
      </p>
    </footer>
  );
}

export default Footer;
