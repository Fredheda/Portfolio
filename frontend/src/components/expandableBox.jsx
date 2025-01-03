import React, { useState } from 'react';

const ExpandableBox = ({ title, details, children, className, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="p-1 rounded-lg">
      <h3
        className={`font-semibold cursor-pointer ${className}`}
        onClick={toggleExpand}
      >
        {title} {isExpanded ? '▲' : '▼'}
      </h3>
      {isExpanded && (
        <div className="m-2">
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