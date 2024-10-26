import React from 'react';
import './About.css';

const About = () => {
  return (
    <section className="about-section">
      <h2 className="about-title">About Me</h2>
      
      <div className="about-content">
        <div className="about-text">
          <p>
            Hello! I'm a passionate software developer with a love for creating interactive and dynamic web applications. 
            My journey started a few years ago when I began exploring front-end technologies like HTML, CSS, and JavaScript. 
            Since then, I've expanded my skill set to include frameworks such as React and backend development with Python.
          </p>
          <p>
            I enjoy problem-solving and continuously learning new tools and technologies. My goal is to build modern, 
            user-friendly web applications that make life easier for people. When I'm not coding, I love reading tech blogs, 
            experimenting with new software, and exploring the world of AI.
          </p>
        </div>
        <div className="about-image">
          <img src="/images/FH.png" alt="A picture of me" />
        </div>
      </div>
      
      <div className="about-details">
        <h3>My Skills</h3>
        <ul className="about-skills">
          <li>JavaScript, React, HTML, CSS</li>
          <li>Python, Django, FastAPI</li>
          <li>APIs, RESTful Services</li>
          <li>Git, Version Control</li>
        </ul>
      </div>
      
      <div className="about-details">
        <h3>Hobbies</h3>
        <p>
          Besides coding, I have a few hobbies that keep me inspired and motivated:
        </p>
        <ul className="about-hobbies">
          <li>📸 Photography - Capturing moments and telling stories through images</li>
          <li>🌍 Travel - Exploring new places and cultures</li>
          <li>📚 Reading - From tech blogs to fantasy novels</li>
        </ul>
      </div>
    </section>
  );
};

export default About;