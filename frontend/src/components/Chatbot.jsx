import React, { useState, useEffect } from 'react';
import { FaComments, FaTimes, FaTrash, FaExpand, FaCompress } from 'react-icons/fa';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import DOMPurify from 'dompurify';

// Bezier control points matching the SVG path "M 20 10 C 60 30, 70 60, 55 100"
const P = [{ x: 20, y: 10 }, { x: 60, y: 30 }, { x: 70, y: 60 }, { x: 55, y: 100 }];

const getBezier = (t) => {
  const u = 1 - t;
  const x = u*u*u*P[0].x + 3*u*u*t*P[1].x + 3*u*t*t*P[2].x + t*t*t*P[3].x;
  const y = u*u*u*P[0].y + 3*u*u*t*P[1].y + 3*u*t*t*P[2].y + t*t*t*P[3].y;
  const dx = 3*u*u*(P[1].x-P[0].x) + 6*u*t*(P[2].x-P[1].x) + 3*t*t*(P[3].x-P[2].x);
  const dy = 3*u*u*(P[1].y-P[0].y) + 6*u*t*(P[2].y-P[1].y) + 3*t*t*(P[3].y-P[2].y);
  return { x, y, angle: Math.atan2(dy, dx) * (180 / Math.PI) };
};

const ArrowAnimation = ({ onDone }) => {
  const progress = useMotionValue(0);
  const svgOpacity = useMotionValue(1);
  const arrowX = useTransform(progress, t => getBezier(t).x);
  const arrowY = useTransform(progress, t => getBezier(t).y);
  const arrowRotate = useTransform(progress, t => getBezier(t).angle);

  useEffect(() => {
    let active = true;
    const run = async () => {
      for (let i = 0; i < 10 && active; i++) {
        progress.set(0);
        svgOpacity.set(1);
        await animate(progress, 1, { duration: 1.2, ease: 'easeInOut' });
        await new Promise(r => setTimeout(r, 375));
        await animate(svgOpacity, 0, { duration: 0.3, ease: 'easeOut' });
        await new Promise(r => setTimeout(r, 1050));
      }
      if (active) onDone();
    };
    run();
    return () => { active = false; };
  }, []);

  return (
    <motion.div style={{ opacity: svgOpacity }} className="flex flex-col items-center">
      <p className="text-red-400 text-xl mb-1" style={{ fontFamily: 'Caveat, cursive', transform: 'rotate(-8deg)' }}>
        Ask me anything!
      </p>
      <svg width="80" height="120" viewBox="0 0 80 120" fill="none">
        <motion.path
          d="M 20 10 C 60 30, 70 60, 55 100"
          stroke="#f87171"
          strokeWidth="3"
          strokeLinecap="butt"
          fill="none"
          style={{ pathLength: progress }}
        />
        <motion.g style={{ x: arrowX, y: arrowY, rotate: arrowRotate }}>
          <path
            d="M -5.5 -5 L 4.5 0 L -5.5 5 Z"
            fill="#f87171"
            stroke="none"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showArrow, setShowArrow] = useState(true);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (window.innerWidth <= 768) {
      setIsFullscreen(true);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768 && isOpen) {
        setIsFullscreen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Calculate and update the viewport height
  useEffect(() => {
    const updateVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    updateVh();
    window.addEventListener('resize', updateVh);
    return () => window.removeEventListener('resize', updateVh);
  }, []);

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleSendMessage = async () => {
    if (input.trim()) {
      const sanitizedInput = DOMPurify.sanitize(input);
      const newMessage = {
        id: messages.length,
        text: sanitizedInput,
        sender: 'user',
      };

      setMessages([...messages, newMessage]);
      setInput('');

      try {
        const REACT_APP_BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;

        const response = await fetch(`${REACT_APP_BACKEND_URL}/chatbot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: sanitizedInput }),
        });
        
        if (!response.ok) {
          throw new Error(
            response.status === 429
              ? 'Rate limit exceeded'
              : `HTTP error! Status: ${response.status}`
          );
        }
        
        const data = await response.json();

        setMessages((prevMessages) => [
          ...prevMessages,
          { id: prevMessages.length, text: data.response, sender: 'bot' },
        ]);
      } catch (error) {
        console.error('Error communicating with the backend:', error);

        const errorMessage =
          error.message === 'Rate limit exceeded'
            ? 'Sorry, you are rate limited. Please try again later.'
            : 'Sorry, something went wrong. Please try again later.';

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: prevMessages.length,
            text: errorMessage,
            sender: 'bot',
          },
        ]);
      }
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  useEffect(() => {
    if (isOpen && isFullscreen && window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, isFullscreen]);

  return (
    <div className="fixed bottom-5 right-5 z-[1000]">
      <div
        className={`fixed transform transition-all duration-300 ease-in-out
          ${isFullscreen
            ? 'w-screen h-screen bottom-0 right-0 rounded-none origin-bottom-right'
            : 'w-[400px] h-[550px] bottom-20 right-5 rounded-[15px] origin-[calc(100%-28px)_calc(100%+28px)]'
          }
          ${isOpen 
            ? 'scale-100 opacity-100 visible' 
            : 'scale-0 opacity-0 invisible'
          }
          bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-sky-400/20 shadow-[0_0_30px_rgba(56,189,248,0.15)] flex flex-col overflow-hidden`}
        style={{
          height: isFullscreen ? 'calc(var(--vh, 1vh) * 100)' : undefined,
        }}
      >
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-400/5 via-zinc-800/95 to-zinc-900 text-white py-3 px-5 flex flex-col items-center justify-center rounded-t-[15px] relative border-b border-sky-400/20">
        <h4 className="text-xl m-0 font-permanent-marker">FredBot</h4>
        <div className="flex space-x-1.5 absolute top-3 right-3">
          {window.innerWidth > 768 && (
            <button
              className="bg-zinc-800/50 p-1.5 rounded-lg border border-sky-400/20 hover:border-sky-400/50 transition-all duration-300 text-sky-400"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <FaCompress size={14} /> : <FaExpand size={14} />}
            </button>
          )}
          <button
            className="bg-zinc-800/50 p-1.5 rounded-lg border border-red-500/20 hover:border-red-500/50 transition-all duration-300 text-red-400"
            onClick={clearChat}
          >
            <FaTrash size={14} />
          </button>
          <button
            className="bg-zinc-800/50 p-1.5 rounded-lg border border-sky-400/20 hover:border-sky-400/50 transition-all duration-300 text-sky-400"
            onClick={toggleChatbot}
          >
            <FaTimes size={14} />
          </button>
        </div>
      </div>

      {/* Message Container */}
      <div className="flex-1 p-4 overflow-y-auto text-sm flex flex-col bg-gradient-to-br from-zinc-900 to-zinc-800">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 my-1.5 rounded-xl max-w-3/4 break-words backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
              message.sender === 'user'
                ? 'bg-gradient-to-r from-sky-400/20 to-sky-500/20 border border-sky-400/20 text-white self-end text-right'
                : 'bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 border border-zinc-600/50 text-zinc-300 self-start text-left'
            }`}
          >
            <p
              className="m-0"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(message.text),
              }}
            ></p>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center p-3 border-t border-sky-400/20 bg-gradient-to-r from-zinc-900 to-zinc-800">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 p-2.5 bg-zinc-800/50 text-white border border-sky-400/20 rounded-xl outline-none transition-all duration-300 placeholder-zinc-400 focus:border-sky-400/50 focus:bg-zinc-700/50"
        />
        <button
          onClick={handleSendMessage}
          className="bg-gradient-to-r from-sky-400/20 to-sky-500/20 text-white border border-sky-400/20 px-4 py-2.5 ml-2.5 rounded-xl cursor-pointer transition-all duration-300 hover:border-sky-400/50 hover:-translate-y-0.5 active:translate-y-0"
        >
          Send
        </button>
      </div>
    </div>

    {/* Animated arrow pointing to chatbot */}
    <AnimatePresence>
      {!isOpen && showArrow && (
        <motion.div
          className="fixed right-24 bottom-16 pointer-events-none z-[999] flex-col items-center hidden md:flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0 } }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <ArrowAnimation onDone={() => setShowArrow(false)} />
        </motion.div>
      )}
    </AnimatePresence>

    {/* Chatbot Toggle Button */}
    <div
      className={`bg-gradient-to-r from-zinc-800 to-zinc-700 text-white rounded-full px-5 py-3 cursor-pointer shadow-lg
        flex items-center gap-2.5 transition-all duration-300 ease-in-out border border-sky-400/20
        hover:border-sky-400/50 hover:shadow-[0_0_15px_rgba(56,189,248,0.15)] ${isOpen ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
      onClick={toggleChatbot}
    >
      <FaComments size={18} className="text-sky-400" />
      <span className="text-sm font-semibold">Chat with FredBot</span>
    </div>
  </div>
);
};

export default Chatbot;