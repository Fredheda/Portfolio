import React, { useState } from 'react';

const ExpandableBox = ({ title, details, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
      <h3 className="text-xl font-semibold cursor-pointer" onClick={toggleExpand}>
        {title} {isExpanded ? '▲' : '▼'}
      </h3>
      {isExpanded && (
        <div className="mt-2">
          {details ? (
            <ul className="list-disc list-inside">
              {details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
};

export default ExpandableBox;