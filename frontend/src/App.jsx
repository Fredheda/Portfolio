import React from 'react';
import './App.css';
import Header from './components/Headers';
import About from './components/About';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';

function App() {
  return (
    <div id="root">
      <Header />
      <main>
        <About />
        <Projects />
        <Contact />
        <Chatbot />
      </main>
      <Footer />
    </div>
  );
}

export default App;