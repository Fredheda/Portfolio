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
          bg-white shadow-xl flex flex-col overflow-hidden`}
        style={{
          // Use the CSS variable for height in fullscreen mode
          height: isFullscreen ? 'calc(var(--vh, 1vh) * 100)' : undefined,
        }}
      >
        {/* Header */}
        <div className="bg-stone-800 text-white py-4 px-5 flex flex-col items-center justify-center rounded-t-[15px] relative">
          <h4 className="text-xl m-0">FredBot</h4>
          <p className="text-base m-0">(Powered by OpenAI)</p>
          <div className="flex space-x-2 absolute top-1/2 right-3 transform -translate-y-1/2">
            {window.innerWidth > 768 && (
              <button
                className="bg-none border-none text-white cursor-pointer transition-colors duration-300 ease-in-out hover:text-stone-700"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
            )}
            <button
              className="bg-none border-none text-white cursor-pointer transition-colors duration-300 ease-in-out hover:text-red-500"
              onClick={clearChat}
            >
              <FaTrash />
            </button>
            <button
              className="bg-none border-none text-white cursor-pointer transition-colors duration-300 ease-in-out hover:text-gray-300"
              onClick={toggleChatbot}
            >
              <FaTimes />
            </button>
          </div>
        </div>
        {/* Message Container */}
 <div className="flex-1 p-4 overflow-y-auto text-sm flex flex-col bg-gray-100">
          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-2.5 my-1 rounded-[10px] max-w-3/4 break-words shadow ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white self-end text-right rounded-tr-none'
                  : 'bg-gray-300 text-gray-800 self-start text-left rounded-tl-none'
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
        <div className="flex items-center p-2.5 border-t border-gray-300 bg-white">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1 p-2 border border-gray-300 rounded-full outline-none transition-colors duration-300 ease-in-out focus:border-blue-500"
          />
          <button
onClick={handleSendMessage}
            className="bg-stone-800 text-white border-none px-4 py-2 ml-2.5 rounded-full cursor-pointer transition-colors duration-300 ease-in-out hover:bg-stone-600 hover:-translate-y-0.5 active:translate-y-0"
          >
            Send
          </button>
        </div>
      </div>

      {/* Chatbot Toggle Button */}
      <div
        className={`bg-stone-700 text-white rounded-full p-3 cursor-pointer shadow-lg 
          flex items-center justify-center transition-all duration-300 ease-in-out 
          hover:bg-stone-700 ${isOpen ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
        onClick={toggleChatbot}
      >
        <FaComments size={24} />
      </div>
    </div>
  );
};

export default Chatbot;