import React, { useState } from 'react';

const SkillSet = ({ title, details }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`mb-3 cursor-pointer p-1 border border-gray-800 rounded-lg transition-all duration-300 ease-in-out shadow-sm bg-purple-950 text-white ${
        isExpanded ? 'bg-purple-950 shadow-lg' : ''
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex justify-between items-center p-1">
        <h4 className="text-lg font-medium mb-1 mt-1 flex-grow text-white">{title}</h4>
        <span className={`text-xl transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180' : ''}`}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </div>
      {isExpanded && (
        <ul className="text-base text-white leading-6 pl-4 transition-all duration-300 ease-in-out list-disc ml-5 mt-1 mb-1">
          {details.map((detail, index) => (
            <li key={index}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SkillSet;