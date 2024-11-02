import React from 'react';
import { Link as ScrollLink, animateScroll } from 'react-scroll';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();

  const handleNavClick = (sectionId) => {
    if (window.location.pathname !== '/') {
      navigate('/'); 
    }
    
    setTimeout(() => {
      animateScroll.scrollTo(document.getElementById(sectionId).offsetTop - 70, {
        duration: 100,
        smooth: true,
      });
    }, 20); 
  };

  return (
    <header className="flex flex-col lg:flex-row justify-center items-center p-2.5 bg-gray-800 text-white relative">
      <h1 className="font-montserrat text-xl font-semibold m-0 mb-2.5 lg:mb-0 lg:mr-5">
        <RouterLink to="/" className="text-white no-underline">
          Frederik Heda
        </RouterLink>
      </h1>
      <nav className="flex flex-col lg:flex-row gap-2.5 lg:gap-5">
        <button 
          className="font-montserrat text-xl font-semibold bg-transparent border-none text-white cursor-pointer hover:underline lg:text-lg"
          onClick={() => handleNavClick('about')}
        >
          About
        </button>
        <button 
          className="font-montserrat text-xl font-semibold bg-transparent border-none text-white cursor-pointer hover:underline lg:text-lg"
          onClick={() => handleNavClick('projects')}
        >
          Projects
        </button>
        <button 
          className="font-montserrat text-xl font-semibold bg-transparent border-none text-white cursor-pointer hover:underline lg:text-lg"
          onClick={() => handleNavClick('contact')}
        >
        </button>
      </nav>
    </header>
  );
}

export default Header;