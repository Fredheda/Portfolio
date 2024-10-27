import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for routing
import './footer.css'; // Import the CSS

function Footer() {
  return (
    <footer>
      <p>
        &copy; {new Date().getFullYear()} Frederik Heda |{' '}
        <Link to="/privacy-policy">Privacy Policy</Link>
      </p>
    </footer>
  );
}

export default Footer;