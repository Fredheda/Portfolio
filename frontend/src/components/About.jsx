import React from 'react';
import SkillSet from './SkillSet';
import './About.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const About = () => {
  return (
    <section className="about-section" id="about">
      <h2 className="about-title">About Me</h2>
      <div className="contact-info">
        <p><i className="fas fa-envelope"></i> <a href="mailto:frederik.heda@gmx.net">frederik.heda@gmx.net</a></p>
        <p><i className="fas fa-phone"></i> <a href="tel:+447948905688">+44 7948 905688</a></p>
        <p><i className="fab fa-linkedin"></i> <a href="https://www.linkedin.com/in/frederik-heda/" target="_blank" rel="noopener noreferrer">linkedin.com/in/frederik-heda</a></p>
        <p><i className="fab fa-github"></i> <a href="https://github.com/Fredheda?tab=repositories" target="_blank" rel="noopener noreferrer">https://github.com/Fredheda</a></p>
      </div>
      
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
        <h3>Demonstrated Skills</h3>
        <SkillSet 
          title="Machine Learning, Statistics & Software Engineering" 
          details={[
            "Experience with Python",
            "Time-Series Forecasting",
            "Docker",
            "DevOps",
            "Kubernetes",
            "AWS",
            "Azure",
            "Open AI",
            "APIs",
            "LoRA",
            "PEFT"
          ]}
        />
        <SkillSet 
          title="Generative AI, Large Language Models & RAG Solutions" 
          details={[
            "Developed internal Pip packages for automated evaluation of GenAI/LLM applications",
            "Implemented generative AI solutions using large language models (LLM) with Azure OpenAI",
            "Led the development & implementation of Retrieval Augmented Generation (RAG) solutions"
          ]}
        />
        <SkillSet 
          title="Data Science, Time-Series Forecasting & Causal Inference" 
          details={[
            "Led the data science workstream in demand management",
            "Developed and deployed ML and analytics solutions",
            "Spearheaded the development of predictive maintenance solutions using causal inference and anomaly detection"
          ]}
        />
        <SkillSet 
          title="Computer Vision, Robotics & Microcontrollers" 
          details={[
            "Implemented industrial Bin-Picking systems",
            "Developed computer vision systems for process automation",
            "Worked on robotics projects using TensorFlow and Arduino"
          ]}
        />
      </div>
    </section>
  );
}

export default About;