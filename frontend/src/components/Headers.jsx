import React from 'react';
import { Link as ScrollLink, animateScroll } from 'react-scroll';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();

  // Function to navigate to root and scroll to a specific section
  const handleNavClick = (sectionId) => {
    if (window.location.pathname !== '/') {
      navigate('/'); // Navigate to root if not already on the homepage
    }
    // Scroll to the specified section after a short delay
    setTimeout(() => {
      animateScroll.scrollTo(document.getElementById(sectionId).offsetTop - 70, {
        duration: 100,
        smooth: true,
      });
    }, 20); // Delay for the page navigation to complete
  };

  return (
    <header>
      <h1>
        <RouterLink to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          Frederik Heda
        </RouterLink>
      </h1>
      <nav>
        <button onClick={() => handleNavClick('about')}>About</button>
        <button onClick={() => handleNavClick('projects')}>Projects</button>
        <button onClick={() => handleNavClick('contact')}>Contact</button>
      </nav>
    </header>
  );
}

export default Header;