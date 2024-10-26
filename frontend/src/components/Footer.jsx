import React from 'react';
import './footer.css'; // Import the CSS

function Footer() {
  return (
    <footer>
      <p>&copy; {new Date().getFullYear()} Your Name</p>
    </footer>
  );
}

export default Footer;