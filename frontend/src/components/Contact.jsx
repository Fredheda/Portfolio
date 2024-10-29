// src/components/Contact.jsx
import React from 'react';
import './Contact.css'; // Make sure to create this CSS file

function Contact() {
  return (
    <section id="contact" className="contact-section">
      <div className="contact-info">
        <p>Email: <a href="mailto:youremail@example.com">youremail@example.com</a></p>
        <p>Phone: <a href="tel:+1234567890">+1 (234) 567-890</a></p>
        <p>LinkedIn: <a href="https://www.linkedin.com/in/yourprofile" target="_blank" rel="noopener noreferrer">linkedin.com/in/yourprofile</a></p>
        <p>GitHub: <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer">github.com/yourusername</a></p>
      </div>
    </section>
  );
}

export default Contact;