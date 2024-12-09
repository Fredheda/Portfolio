import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const Header = () => {
  return (
    <header className="flex flex-row justify-between items-center p-2.5 bg-purple-950 text-white relative">
      <h1 className="font-permanent-marker text-xl pl-3">
        <RouterLink to="/" className="text-white no-underline">
          <img 
            src="/images/logo.png" 
            alt="Frederik Heda Logo" 
            className="h-10 w-auto"
          />
        </RouterLink>
      </h1>
      <div className="flex items-center gap-4 mr-4">
        <a href="mailto:frederik.heda@gmx.net" className="text-white no-underline hover:underline text-2xl">
          <i className="fas fa-envelope"></i>
        </a>
        <a
          href="https://www.linkedin.com/in/frederik-heda/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white no-underline hover:underline text-2xl"
        >
          <i className="fab fa-linkedin"></i>
        </a>
        <a
          href="https://github.com/Fredheda?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white no-underline hover:underline text-2xl"
        >
          <i className="fab fa-github"></i>
        </a>
      </div>
    </header>
  );
};

export default Header;