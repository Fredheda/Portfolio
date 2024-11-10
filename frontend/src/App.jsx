import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Headers';
import About from './components/About';
import Projects from './components/Projects';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import PrivacyPolicy from './components/PrivacyPolicy';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-purple-950">
        <Header /> {/* Update Header component with: className="bg-gray-800 text-white text-center py-6" */}
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          </Routes>
        </main>
        <Footer /> {/* Update Footer component with: className="bg-gray-800 text-white text-center py-6" */}
        <Chatbot />
      </div>
    </Router>
  );
}

function MainContent() {
  return (
    <div className="space-y-8">
      <section className="mb-8">
        <About />
      </section>
      <section className="mb-8">
        <Projects />
      </section>
    </div>
  );
}

export default App;