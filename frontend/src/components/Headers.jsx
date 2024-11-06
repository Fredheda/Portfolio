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
    <header className="flex flex-col lg:flex-row justify-left items-center p-2.5 bg-purple-950 text-white relative">
      <h1 className="font-montserrat text-xl font-semibold m-0 mb-2.5 lg:mb-0 lg:mr-5">
        <RouterLink to="/" className="text-white no-underline">
          Frederik Heda
        </RouterLink>
      </h1>
    </header>
  );
}

export default Header;