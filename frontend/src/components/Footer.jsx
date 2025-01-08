import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-stone-900 py-7 px-5 text-center">
      <p className="inline-block m-0 text-sm text-white">
        &copy; {new Date().getFullYear()} Frederik Heda |{' '}
        <Link to="/privacy-policy" className="text-white no-underline hover:underline">
          Privacy Policy
        </Link>
      </p>
    </footer>
  );
}

export default Footer;