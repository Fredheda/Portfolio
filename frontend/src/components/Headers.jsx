import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const Header = () => {
  return (
    <header className="flex flex-row justify-between items-center px-6 py-4 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 text-white relative border-b border-blue-500/20">
      <h1 className="font-permanent-marker text-xl">
        <RouterLink to="/" className="text-white no-underline">
          <img 
            src="/images/logo.png" 
            alt="Frederik Heda Logo" 
            className="h-10 w-auto transition-transform duration-300 hover:scale-105"
          />
        </RouterLink>
      </h1>
      <div className="flex items-center gap-6">
        <a 
          href="mailto:frederik.heda@gmx.net" 
          className="text-white/80 hover:text-white no-underline text-xl bg-stone-800/50 p-2.5 rounded-lg border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:scale-110"
        >
          <i className="fas fa-envelope"></i>
        </a>
        <a
          href="https://www.linkedin.com/in/frederik-heda/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/80 hover:text-white no-underline text-xl bg-stone-800/50 p-2.5 rounded-lg border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:scale-110"
        >
          <i className="fab fa-linkedin"></i>
        </a>
        <a
          href="https://github.com/Fredheda?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/80 hover:text-white no-underline text-xl bg-stone-800/50 p-2.5 rounded-lg border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:scale-110 mr-2"
        >
          <i className="fab fa-github"></i>
        </a>
      </div>
    </header>
  );
};

export default Header;