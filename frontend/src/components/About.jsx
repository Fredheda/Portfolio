import React from 'react';
import SkillSet from './SkillSet';
import '@fortawesome/fontawesome-free/css/all.min.css';

const About = () => {
  return (
    <section
      id="about"
      className="bg-gray-100 py-2.5 px-5 rounded-[15px] shadow-lg w-full max-w-[1200px] mx-auto my-5 text-center font-montserrat"
    >
      <h2 className="text-2xl text-gray-800 mb-5 font-semibold">About Me</h2>

      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-2.5">
        <div className="flex items-center">
          <i className="fas fa-envelope mr-[5px]"></i>
          <a
            href="mailto:frederik.heda@gmx.net"
            className="text-blue-600 no-underline hover:underline"
          >
            frederik.heda@gmx.net
          </a>
        </div>
        <div className="flex items-center">
          <i className="fas fa-phone mr-[5px]"></i>
          <a href="tel:+447948905688" className="text-blue-600 no-underline hover:underline">
            +44 7948 905688
          </a>
        </div>
        <div className="flex items-center">
          <i className="fab fa-linkedin mr-[5px]"></i>
          <a
            href="https://www.linkedin.com/in/frederik-heda/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 no-underline hover:underline"
          >
            linkedin.com/in/frederik-heda
          </a>
        </div>
        <div className="flex items-center">
          <i className="fab fa-github mr-[5px]"></i>
          <a
            href="https://github.com/Fredheda?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 no-underline hover:underline"
          >
            github.com/Fredheda
          </a>
        </div>
      </div>

      {/* About Content */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5 mb-7.5">
        <div className="flex-grow min-w-[280px] text-base text-gray-600 leading-[1.8] p-2.5 text-left">
          <p>
            Frederik is a senior data scientist at BP, where he spearheads digital innovation across
            the trading and shipping organisation. He is an AI enthusiast with a strong background in
            machine learning, statistics, and software engineering.
          </p>
          <p>
            Frederik's role is to drive innovation through advanced data science and analytics
            solutions, leading the development and adoption of generative AI across the trading and
            shipping organisation. He is a leading member of BP's data & analytics and GenAI
            communities of practice, actively demystifying data science and AI across the business.
          </p>
          <p>
            Frederik holds master's degrees in Mechanical & Electrical Engineering from Robert Gordon
            University, and Applied Data Science from the University of Buckingham, and has led
            projects across various domains including demand forecasting, causal inference, and
            generative AI. Frederik is a strong advocate for democratising artificial intelligence and
            believes it can help us be more efficient, productive, and safe.
          </p>
        </div>
        <div className="flex-shrink-0 w-full lg:w-1/4 min-w-[200px] max-w-[300px] lg:self-center">
          <img src="/images/FH.png" alt="A picture of me" className="w-full rounded-[10px]" />
        </div>
      </div>

      <div className="text-left mt-2.5">
        <h3 className="text-2xl mb-4">Demonstrated Skills</h3>
        <SkillSet
          title="Machine Learning, Statistics & Software Engineering"
          details={[
            'Experience with Python',
            'Time-Series Forecasting',
            'Docker',
            'DevOps',
            'Kubernetes',
            'AWS',
            'Azure',
            'OpenAI',
            'APIs',
            'LoRA',
            'PEFT',
          ]}
        />
        <SkillSet
          title="Generative AI, Large Language Models & RAG Solutions"
          details={[
            'Developed internal Pip packages for automated evaluation of GenAI/LLM applications',
            'Implemented generative AI solutions using large language models (LLM) with Azure OpenAI',
            'Led the development & implementation of Retrieval Augmented Generation (RAG) solutions',
          ]}
        />
        <SkillSet
          title="Data Science, Time-Series Forecasting & Causal Inference"
          details={[
            'Led the data science workstream in demand management',
            'Developed and deployed ML and analytics solutions',
            'Spearheaded the development of predictive maintenance solutions using causal inference and anomaly detection',
          ]}
        />
        <SkillSet
          title="Computer Vision, Robotics & Microcontrollers"
          details={[
            'Implemented industrial bin-picking systems',
            'Developed computer vision systems for process automation',
            'Worked on robotics projects using TensorFlow and Arduino',
          ]}
        />
      </div>
    </section>
  );
};

export default About;