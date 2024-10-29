import React, { useState } from 'react';
import './SkillSet.css';

const SkillSet = ({ title, details }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`skill-set ${isExpanded ? 'expanded' : ''}`} onClick={() => setIsExpanded(!isExpanded)}>
      <div className="skill-title-container">
        <h4 className="skill-title">{title}</h4>
        <span className="arrow">{isExpanded ? '▲' : '▼'}</span>
      </div>
      {isExpanded && (
        <ul className="skill-details">
          {details.map((detail, index) => (
            <li key={index}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SkillSet;