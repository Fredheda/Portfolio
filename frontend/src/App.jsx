import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lenis from 'lenis';
import Header from './components/Headers';
import TerminalHero from './components/TerminalHero';
import Projects from './components/Projects';
import Footer from './components/Footer';
import AgentTools from './components/AgentTools';

const PrivacyPolicy = React.lazy(() => import('./components/PrivacyPolicy'));

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <Router>
      <div className="relative flex flex-col min-h-screen bg-surface-950">
        {/* Noise texture overlay */}
        <div className="noise-overlay fixed inset-0 z-50 pointer-events-none" />

        <Header />
        <main className="flex-1 px-4 py-8">
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="/privacy-policy" element={
              <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh] text-zinc-400">Loading...</div>}>
                <PrivacyPolicy />
              </Suspense>
            } />
          </Routes>
        </main>
        <Footer />
        <AgentTools />
      </div>
    </Router>
  );
}

function MainContent() {
  return (
    <div>
      <TerminalHero />
      <Projects />
    </div>
  );
}

export default App;
