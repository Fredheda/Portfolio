import React, { useState, useEffect } from 'react';
import { FaComments, FaTimes, FaTrash, FaExpand, FaCompress } from 'react-icons/fa';
import DOMPurify from 'dompurify';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

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
        bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col overflow-hidden`}
      style={{
        height: isFullscreen ? 'calc(var(--vh, 1vh) * 100)' : undefined,
      }}
    >
    {/* Header */}
    <div className="bg-gradient-to-r from-blue-500/5 via-stone-800/95 to-stone-900 text-white py-3 px-5 flex flex-col items-center justify-center rounded-t-[15px] relative border-b border-blue-500/20">
      <h4 className="text-xl m-0 font-permanent-marker">FredBot</h4>
      <p className="text-sm text-gray-300 m-0">(Powered by OpenAI)</p>
      <div className="flex space-x-1.5 absolute top-3 right-3">
        {window.innerWidth > 768 && (
          <button
            className="bg-stone-800/50 p-1.5 rounded-lg border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 text-blue-400"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <FaCompress size={14} /> : <FaExpand size={14} />}
          </button>
        )}
        <button
          className="bg-stone-800/50 p-1.5 rounded-lg border border-red-500/20 hover:border-red-500/50 transition-all duration-300 text-red-400"
          onClick={clearChat}
        >
          <FaTrash size={14} />
        </button>
        <button
          className="bg-stone-800/50 p-1.5 rounded-lg border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 text-blue-400"
          onClick={toggleChatbot}
        >
          <FaTimes size={14} />
        </button>
      </div>
    </div>

      {/* Message Container */}
      <div className="flex-1 p-4 overflow-y-auto text-sm flex flex-col bg-gradient-to-br from-stone-900 to-stone-800">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 my-1.5 rounded-xl max-w-3/4 break-words backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
              message.sender === 'user'
                ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/20 text-white self-end text-right'
                : 'bg-gradient-to-r from-stone-800/50 to-stone-700/50 border border-stone-600/50 text-gray-300 self-start text-left'
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
      <div className="flex items-center p-3 border-t border-blue-500/20 bg-gradient-to-r from-stone-900 to-stone-800">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 p-2.5 bg-stone-800/50 text-white border border-blue-500/20 rounded-xl outline-none transition-all duration-300 placeholder-gray-400 focus:border-blue-500/50 focus:bg-stone-700/50"
        />
        <button
          onClick={handleSendMessage}
          className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-white border border-blue-500/20 px-4 py-2.5 ml-2.5 rounded-xl cursor-pointer transition-all duration-300 hover:border-blue-500/50 hover:-translate-y-0.5 active:translate-y-0"
        >
          Send
        </button>
      </div>
    </div>

    {/* Chatbot Toggle Button */}
    <div
      className={`bg-gradient-to-r from-stone-800 to-stone-700 text-white rounded-full p-3.5 cursor-pointer shadow-lg 
        flex items-center justify-center transition-all duration-300 ease-in-out border border-blue-500/20
        hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] ${isOpen ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
      onClick={toggleChatbot}
    >
      <FaComments size={24} className="text-blue-400" />
    </div>
  </div>
);
};

export default Chatbot;