import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import Lenis from 'lenis';
import Header from './components/Headers';
import Footer from './components/Footer';
import AgentTools from './components/AgentTools';
import Home from './pages/Home';

const ProjectPage = React.lazy(() => import('./pages/ProjectPage'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const PrivacyPolicy = React.lazy(() => import('./components/PrivacyPolicy'));

const lazy = (element) => (
  <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>{element}</Suspense>
);

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
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            {/* About page hidden: pages/About.jsx and content.about stay. To show it again, route it here, add the nav link and the routeMeta entry. */}
            <Route path="/about" element={<Navigate to="/" replace />} />
            <Route path="/projects/:slug" element={lazy(<ProjectPage />)} />
            <Route path="/privacy-policy" element={lazy(<PrivacyPolicy />)} />
            <Route path="*" element={lazy(<NotFound />)} />
          </Routes>
        </main>
        <Footer />
        {/* Mounted on every route: fredbot's frontend tools must stay registered. */}
        <AgentTools />
      </div>
    </Router>
  );
}

export default App;
