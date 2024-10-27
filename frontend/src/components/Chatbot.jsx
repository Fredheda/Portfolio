import React, { useState } from 'react';
import { FaComments, FaTimes, FaTrash, FaExpand, FaCompress } from 'react-icons/fa'; // Import icons for expand and compress
import DOMPurify from 'dompurify';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // New state to track expanded size
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded); // Toggle the expanded state
  };

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
  
      // Add the user's message to the chat
      setMessages([...messages, newMessage]);
  
      // Clear the input field
      setInput('');
  
      try {
        // Determine the backend URL based on the environment
        const REACT_APP_BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;
        console.log("REACT_APP_BACKEND_URL: ", REACT_APP_BACKEND_URL)
  
        // Send the user's message to the backend API
        const response = await fetch(`${REACT_APP_BACKEND_URL}/chatbot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: sanitizedInput }),
        });

        console.log("error: ", response)
  
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
  
        const data = await response.json();
  
        // Add the chatbot's response to the chat
        setMessages((prevMessages) => [
          ...prevMessages,
          { id: prevMessages.length, text: data.response, sender: 'bot' },
        ]);
      } catch (error) {
        console.error('Error communicating with the backend:', error);
  
        // Optionally, display an error message in the chat
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: prevMessages.length,
            text: 'Sorry, something went wrong. Please try again later.',
            sender: 'bot',
          },
        ]);
      }
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Function to clear the chat
  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="chatbot-container">
      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? 'open' : 'closed'} ${isExpanded ? 'expanded' : ''}`}>
        <div className="chatbot-header">
          <h4>Fredbot</h4> <p>(Powered by OpenAI)</p>
          <div className="chatbot-header-buttons">
            <button className="expand-btn" onClick={toggleExpand}>
              {isExpanded ? <FaCompress /> : <FaExpand />}
            </button>
            <button className="clear-btn" onClick={clearChat}>
              <FaTrash />
            </button>
            <button className="close-btn" onClick={toggleChatbot}>
              <FaTimes />
            </button>
          </div>
        </div>
        <div className="chatbot-body">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chatbot-message ${message.sender === 'user' ? 'user' : 'bot'}`}
            >
              <p>{message.text}</p>
            </div>
          ))}
        </div>
        <div className="chatbot-footer">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>

      {/* Toggle Button */}
      <div className={`chatbot-toggle ${isOpen ? 'hidden' : ''}`} onClick={toggleChatbot}>
        <FaComments size={24} />
      </div>
    </div>
  );
};

export default Chatbot;