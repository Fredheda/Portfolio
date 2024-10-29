import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Headers';
import About from './components/About';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import PrivacyPolicy from './components/PrivacyPolicy'; // Import PrivacyPolicy component
import LinkedInPostsCarousel from './components/LinkedInPosts'; // Import LinkedInPosts component


function App() {
  return (
    <Router>
      <div id="root">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

// Separate component for main content to use in routing
function MainContent() {
  return (
    <>
      <About />
      <Projects />
      <Chatbot />
    </>
  );
}

export default App;