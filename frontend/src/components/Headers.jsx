import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 flex flex-row justify-between items-center px-6 py-4 bg-zinc-950/80 backdrop-blur-md text-white relative border-b border-sky-400/20">
      <RouterLink to="/" className="text-zinc-300 hover:text-sky-400 transition-colors duration-300 text-2xl no-underline">
        <i className="fas fa-house"></i>
      </RouterLink>

      <nav className="hidden md:flex items-center gap-8">
        <a href="/#about" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors duration-300">About</a>
        <a href="/#skills" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors duration-300">Skills</a>
        <a href="/#projects" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors duration-300">Projects</a>
      </nav>

      <div className="flex items-center gap-4">
        <a
          href="mailto:frederik.heda@gmx.net"
          className="text-zinc-300 hover:text-sky-400 no-underline text-xl bg-zinc-800/50 p-2.5 rounded-lg border border-sky-400/20 hover:border-sky-400/50 transition-all duration-300 hover:scale-110"
        >
          <i className="fas fa-envelope"></i>
        </a>
        <a
          href="https://www.linkedin.com/in/frederik-heda/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-300 hover:text-sky-400 no-underline text-xl bg-zinc-800/50 p-2.5 rounded-lg border border-sky-400/20 hover:border-sky-400/50 transition-all duration-300 hover:scale-110"
        >
          <i className="fab fa-linkedin"></i>
        </a>
        <a
          href="https://github.com/Fredheda?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-300 hover:text-sky-400 no-underline text-xl bg-zinc-800/50 p-2.5 rounded-lg border border-sky-400/20 hover:border-sky-400/50 transition-all duration-300 hover:scale-110"
        >
          <i className="fab fa-github"></i>
        </a>
      </div>
    </header>
  );
};

export default Header;
