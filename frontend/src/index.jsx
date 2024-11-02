import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// CSP Meta Tag with Tailwind-compatible settings
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
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none'; 
    base-uri 'self'; 
    form-action 'self';
  `
);
document.head.appendChild(cspMetaTag);

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);