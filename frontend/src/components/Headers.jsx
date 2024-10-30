import React from 'react';
import { Link as ScrollLink, animateScroll } from 'react-scroll';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import './Header.css';

function Header() {
  const navigate = useNavigate();

  // Function to navigate to root and scroll to a specific section
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
    <header className="header">
      <h1 className="header-title">
        <RouterLink to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          Frederik Heda
        </RouterLink>
      </h1>
      <nav className="header-nav">
        <button className="nav-button" onClick={() => handleNavClick('about')}>About</button>
        <button className="nav-button" onClick={() => handleNavClick('projects')}>Projects</button>
      </nav>
    </header>
  );
}

export default Header;