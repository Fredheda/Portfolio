import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

// Dynamically set the CSP with environment variables
const cspMetaTag = document.createElement('meta');
cspMetaTag.setAttribute('http-equiv', 'Content-Security-Policy');
cspMetaTag.setAttribute(
  'content',
  `
    default-src 'self'; 
    img-src 'self' data:; 
    script-src 'self'; 
    style-src 'self' 'unsafe-inline'; 
    connect-src 'self' ${import.meta.env.VITE_BACKEND_API_URL}; 
    font-src 'self'; 
    object-src 'none'; 
    base-uri 'self'; 
    form-action 'self';
  `
);
document.head.appendChild(cspMetaTag);

ReactDOM.render(<App />, document.getElementById('root'));
