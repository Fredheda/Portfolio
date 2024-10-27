import React from 'react';
import './About.css';

const About = () => {
  return (
    <section className="about-section" id="about">
      <h2 className="about-title">About Me</h2>
      
      <div className="about-content">
        <div className="about-text">
          <p>
            Frederik is a senior data scientist at BP, where he spearheads digital innovation across the trading and shipping organisation. He is an AI enthusiast with a strong background in machine learning, statistics, and software engineering.
          </p>
          <p>
            Frederik's role is to drive innovation through advanced data science and analytics solutions, leading the development and adoption of generative AI across the trading and shipping organisation. He is a leading member of BP's data & analytics and GenAI communities of practice, actively demystifying data science and AI across the business.
          </p>
          <p>
            Frederik holds master's degrees in Mechanical & Electrical Engineering from Robert Gordon University, and Applied Data Science from the University of Buckingham, and has led projects across various domains including demand forecasting, causal inference, and generative AI. Frederik is a strong advocate for democratising artificial intelligence and believes it can help us be more efficient, productive, and safe.
          </p>
        </div>
        <div className="about-image">
          <img src="/images/FH.png" alt="A picture of me" />
        </div>
      </div>
      
      <div className="about-details">
        <h3>My Skills</h3>
        <ul className="about-skills">
          <li>Machine Learning, Statistics, Software Engineering</li>
          <li>Generative AI, Large Language Models, RAG Solutions</li>
          <li>Python, Docker, DevOps, Kubernetes, AWS, Azure</li>
          <li>Data Science, Time-Series Forecasting, Causal Inference</li>
        </ul>
      </div>
    </section>
  );
}

export default About;