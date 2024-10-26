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

  const handleSendMessage = () => {
    if (input.trim()) {
      const sanitizedInput = DOMPurify.sanitize(input); // Sanitize user input
      const newMessage = {
        id: messages.length,
        text: sanitizedInput,
        sender: 'user',
      };
  
      // Add the user's message to the chat
      setMessages([...messages, newMessage]);
  
      // Directly add "hello world" as the bot's response
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: prevMessages.length, text: "hello world", sender: 'bot' },
      ]);
  
      // Clear the input field
      setInput('');
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
          <h4>Chat with Us!</h4>
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