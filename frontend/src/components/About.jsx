import React from 'react';
import ExpandableBox from './expandableBox';
import '@fortawesome/fontawesome-free/css/all.min.css';

const About = () => {
  return (
    <>
      <section
        id="about"
        className="bg-gray-100 py-4 px-5 rounded-[15px] w-full max-w-[1200px] mx-auto mb-2.5 text-center font-montserrat"
      >
        <h2 className="font-permanent-marker text-2xl text-left text-black mb-5 font-semibold">About Me</h2>

        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5 mb-5">
          <div className="flex-grow min-w-[280px] text-base text-black leading-[1.8] text-left">
            <div className="rounded-lg mb-4">
              <p>
              I'm a <strong>senior machine learning engineer</strong> at <strong>BP</strong> 🚀, where I lead digital innovation across the trading and shipping organisation. I'm passionate about <em>AI</em> with a strong background in <strong>machine learning</strong>, <strong>statistics</strong>, and <strong>software engineering</strong>.
              <br /><br />
              <strong>My Role 🧑🏻‍💻</strong><br/>
              My role focuses on driving innovation through advanced data science and analytics solutions, particularly leading the development and adoption of <strong>generative AI</strong> across the organisation. I'm an active leader in BP's <strong>data & analytics</strong> and <strong>GenAI communities of practice</strong>, working to make data science and AI more accessible across the business.<br/>
              over the last two years, I have been leading the development and implementation of <strong>Retrieval Augmented Generation (RAG)</strong> solutions, which have been deployed across the organisation to improve efficiency and drive innovation.
              Throughout my career, I've led projects across various domains including <strong>demand forecasting</strong>, <strong>causal inference</strong>, and <strong>generative AI</strong>.
              <br /><br />
              <strong>Academics 🎓</strong><br/>
              I hold master's degrees in <strong>Mechanical & Electrical Engineering</strong> from <strong>Robert Gordon University</strong>, and <strong>Applied Data Science</strong> from the <strong>University of Buckingham</strong>. While doing my first Masters at RGU, I was also president of the University table tennis club and student representative for my cohort.
              <br /><br />
              <strong>Passions 🏓</strong><br/>
              I'm a strong advocate for <em>democratising artificial intelligence</em> 🤝 and believe it can help us work smarter, not harder. I'm always excited to collaborate on innovative projects that push the boundaries of what's possible with AI.
              <br/> In my free time, I enjoy playing <strong>table tennis</strong> 🏓, <strong>travelling</strong> 🌍, and <strong>learning new things</strong> 📚. I've also recently <em>"rediscovered"</em> e-books and am trying to listen to 1-2, mostly non-fiction, books every month.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 w-full lg:w-1/4 min-w-[200px] max-w-[300px] lg:self-center rounded-[10px] border border-black overflow-hidden">
            <img src="/images/FH.png" alt="A picture of me" className="w-full rounded-[10px]" />
          </div>
        </div>
      </section>

      <section
        id="website-info"
        className="bg-gray-100 py-4 px-2.5 rounded-[15px] shadow-lg w-full max-w-[1200px] mx-auto my-2.5 text-center font-montserrat flex flex-col"
      >
        <ExpandableBox 
          title="About This Website" 
          className="font-permanent-marker text-2xl text-left text-black font-semibold"
          defaultExpanded={true}
        >
          <div className="flex-grow min-w-[280px] text-base text-black leading-[1.8] text-left">
            <div className="rounded-lg mb-4">
              <p>
                This Portfolio website was built to introduce myself and showcase my work. It was built using <strong>React</strong> and <strong>Tailwind CSS</strong>, and is hosted on <strong>Heroku</strong>.
                <br/>
                In the following sections, you can find more information about my <strong>skills</strong>, <strong>projects</strong>, and <strong>interests</strong>.
                <br /><br />
                Say Hi to <strong>Fredbot 🤖</strong>! <br/>
                Fredbot is a simple, chatbot that can answer questions about me and my work. <br /> Please be kind and patient when using Fredbot - it is still learning! 
                <br /><br />
                <strong>Draft mode</strong><br />
                This website is currently in draft mode and is being updated regularly. I am using this website to learn more about web development and to showcase my work.
                Many parts of this site are still under construction, not optimised, or may contain placeholder content.
                <br /> Please check back soon for more updates!
              </p>
            </div>
          </div>
        </ExpandableBox>
      </section>

      <section
        id="skills"
        className="bg-gray-100 py-4 px-2.5 rounded-[15px] shadow-lg w-full max-w-[1200px] mx-auto mt-2.5 text-center font-montserrat flex flex-col"
      >
          <ExpandableBox title="Demonstrated Skills" className="font-permanent-marker text-2xl text-left text-black font-semibold">
          <div className="text-left mt-2.5">
            <ExpandableBox
              title="Machine Learning, Statistics & Software Engineering"
              className="text-xl text-left text-black font-semibold"
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
              className="text-xl text-left text-black font-semibold"
              details={[
                'Developed internal Pip packages for automated evaluation of GenAI/LLM applications',
                'Implemented generative AI solutions using large language models (LLM) with Azure OpenAI',
                'Led the development & implementation of Retrieval Augmented Generation (RAG) solutions',
              ]}
            />
            <ExpandableBox
              title="Data Science, Time-Series Forecasting & Causal Inference"
              className="text-xl text-left text-black font-semibold"
              details={[
                'Led the data science workstream in demand management',
                'Developed and deployed ML and analytics solutions',
                'Spearheaded the development of predictive maintenance solutions using causal inference and anomaly detection',
              ]}
            />
            <ExpandableBox
              title="Computer Vision, Robotics & Microcontrollers"
              className="text-xl text-left text-black font-semibold"
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