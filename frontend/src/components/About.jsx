import React from 'react';
import ExpandableBox from './expandableBox';
import '@fortawesome/fontawesome-free/css/all.min.css';

const About = () => {
  return (
    <>
      <section
        id="about"
        className="bg-gray-100 py-4 px-5 rounded-[15px] w-full max-w-[1200px] mx-auto my-4 text-center font-montserrat"
      >
        <h2 className="font-permanent-marker text-2xl text-left text-black mb-5 font-semibold">About Me</h2>

        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5 mb-5">
          <div className="flex-grow min-w-[280px] text-base text-black leading-[1.8] text-left">
            <div className="rounded-lg mb-4">
              <p>
                <strong>Frederik</strong> is a senior data scientist at <strong>BP</strong>, where he spearheads digital innovation across the trading and shipping organisation. He is an <em>AI enthusiast</em> with a strong background in <strong>machine learning</strong>, <strong>statistics</strong>, and <strong>software engineering</strong>.
                <br /><br />
                Frederik's role is to drive innovation through advanced data science and analytics solutions, leading the development and adoption of <strong>generative AI</strong> across the trading and shipping organisation. He is a leading member of BP's <strong>data & analytics</strong> and <strong>GenAI communities of practice</strong>, actively demystifying data science and AI across the business.
                <br /><br />
                Frederik holds master's degrees in <strong>Mechanical & Electrical Engineering</strong> from <strong>Robert Gordon University</strong>, and <strong>Applied Data Science</strong> from the <strong>University of Buckingham</strong>, and has led projects across various domains including <strong>demand forecasting</strong>, <strong>causal inference</strong>, and <strong>generative AI</strong>.
                <br /><br />
                Frederik is a strong advocate for <em>democratising artificial intelligence</em> and believes it can help us be more efficient, productive, and safe.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 w-full lg:w-1/4 min-w-[200px] max-w-[300px] lg:self-center rounded-[10px] border border-black overflow-hidden">
            <img src="/images/FH.png" alt="A picture of me" className="w-full rounded-[10px]" />
          </div>
        </div>
      </section>

      <section
        id="skills"
        className="bg-gray-100 py-1 px-2.5 rounded-[15px] shadow-lg w-full max-w-[1200px] mx-auto my-1 text-center font-montserrat flex flex-col"
      >
        <ExpandableBox title="Demonstrated Skills" className="font-permanent-marker text-2xl text-left text-black font-semibold">
          <div className="text-left mt-2.5">
            <ExpandableBox
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
            <ExpandableBox
              title="Generative AI, Large Language Models & RAG Solutions"
              details={[
                'Developed internal Pip packages for automated evaluation of GenAI/LLM applications',
                'Implemented generative AI solutions using large language models (LLM) with Azure OpenAI',
                'Led the development & implementation of Retrieval Augmented Generation (RAG) solutions',
              ]}
            />
            <ExpandableBox
              title="Data Science, Time-Series Forecasting & Causal Inference"
              details={[
                'Led the data science workstream in demand management',
                'Developed and deployed ML and analytics solutions',
                'Spearheaded the development of predictive maintenance solutions using causal inference and anomaly detection',
              ]}
            />
            <ExpandableBox
              title="Computer Vision, Robotics & Microcontrollers"
              details={[
                'Implemented industrial bin-picking systems',
                'Developed computer vision systems for process automation',
                'Worked on robotics projects using TensorFlow and Arduino',
              ]}
            />
          </div>
        </ExpandableBox>
      </section>
    </>
  );
};

export default About;