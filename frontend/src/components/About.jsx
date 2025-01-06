import React from 'react';
import ExpandableBox from './expandableBox';
import '@fortawesome/fontawesome-free/css/all.min.css';

const QuickFact = ({ icon, text }) => (
  <div className="bg-stone-800 p-4 rounded-lg hover:bg-stone-700 transition-all duration-300 cursor-default">
    <i className={`${icon} text-2xl text-white mb-2`}></i>
    <p className="text-white text-sm">{text}</p>
  </div>
);

const About = () => {
  return (
    <>
      <section className="bg-stone-900 py-12 px-8 rounded-[15px] w-full max-w-[1200px] mx-auto mb-4 font-montserrat">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-5xl font-bold text-white mb-4 animate-fade-in">Hi! I'm Fred</h1>
            <p className="text-white text-xl mb-8">
              Senior Machine Learning Engineer: passionate about AI, building innovative solutions, and sharing knowledge.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <QuickFact icon="fas fa-robot" text="AI/ML Expert" />
              <QuickFact icon="fas fa-code" text="Software Engineer" />
              <QuickFact icon="fas fa-brain" text="Innovation Leader" />
              <QuickFact icon="fas fa-graduation-cap" text="2x MSc Degrees" />
              <QuickFact icon="fas fa-table-tennis" text="Table Tennis Player" />
              <QuickFact icon="fas fa-book" text="Lifelong Learner" />
            </div>

            <div className="flex gap-4">
              <a 
                href="https://www.linkedin.com/in/frederik-heda/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-all duration-300 cursor-pointer"
              >
                <i className="fab fa-linkedin mr-2"></i>Connect
              </a>
              <a 
                href="https://github.com/fredheda" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-stone-700 hover:bg-stone-600 text-white px-6 py-2 rounded-full transition-all duration-300 cursor-pointer"
              >
                <i className="fab fa-github mr-2"></i>GitHub
              </a>
            </div>
          </div>
          
          <div className="lg:w-1/3 min-w-[280px]">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent rounded-[15px]"></div>
              <img 
                src="/images/FH.png" 
                alt="A picture of me" 
                className="w-full rounded-[15px] shadow-xl transform hover:scale-[1.02] transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="about"
        className="bg-stone-900 py-4 px-5 rounded-[15px] w-full max-w-[1200px] mx-auto mb-2.5 text-center font-montserrat"
      >
        <h2 className="font-permanent-marker text-2xl text-left text-white mb-5 font-semibold">About Me</h2>

        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5 mb-5">
          <div className="flex-grow min-w-[280px] text-base text-white leading-[1.8] text-left">
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
              <br/> In my free time, I enjoy playing <strong>table tennis</strong> 🏓, <strong>travelling</strong> 🌍, and <strong>learning new things</strong> 📚. I've also recently <em>"rediscovered"</em> audio-books and am trying to listen to 1-2, mostly non-fiction, books every month.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 w-full lg:w-1/4 min-w-[200px] max-w-[300px] lg:self-center rounded-[10px] border border-stone-800 overflow-hidden">
            <img src="/images/FH.png" alt="A picture of me" className="w-full rounded-[10px]" />
          </div>
        </div>
      </section>

      <section
        id="website-info"
        className="bg-stone-900 py-4 px-2.5 rounded-[15px] shadow-lg w-full max-w-[1200px] mx-auto my-2.5 text-center font-montserrat flex flex-col"
      >
        <ExpandableBox 
          title="About This Website" 
          className="font-permanent-marker text-2xl text-left text-white font-semibold"
          defaultExpanded={true}
        >
          <div className="flex-grow min-w-[280px] text-base text-white leading-[1.8] text-left">
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
        className="bg-stone-900 py-4 px-2.5 rounded-[15px] shadow-lg w-full max-w-[1200px] mx-auto mt-2.5 text-center font-montserrat flex flex-col"
      >
          <ExpandableBox title="Demonstrated Skills" className="font-permanent-marker text-2xl text-left text-white font-semibold">
          <div className="text-left text-white mt-2.5">
          <ExpandableBox
            title="Machine Learning Engineering"
            className="text-xl text-left text-white font-semibold"
            details={[
              '🔬 ML Development: TensorFlow, PyTorch, Scikit-learn | Deployed enterprise-grade ML models, e.g. demand forecasting, anomaly detection & clustering.',
              '📊 Data Engineering: Built scalable data pipelines, e.g. for document processing and OCR',
              '🔄 MLOps: Implemented CI/CD pipelines with Azure DevOps, AWS Codecommit & Sagemaker Pipelines for automated model training and deployment',
              '📈 Time Series & Statistics: Developed forecasting models using ARIMA, Prophet, and custom deep learning architectures'
            ]}
          />

          <ExpandableBox
            title="Generative AI"
            className="text-xl text-left text-white font-semibold"
            details={[
              '🤖 LLM Development: Azure OpenAI, LangChain, HuggingFace | Built enterprise-grade GenAI applications that deliver multi-million dollar value',
              '🔍 RAG Systems: Developed production RAG solutions using custom retrieval systems',
              '📚 Model Fine-tuning: Implemented LoRA and PEFT techniques for domain-specific LLM adaptation',
              '🛠️ GenAI Tools: Created evaluation frameworks and productioned them as a reusable (internal) PIP library'
            ]}
          />

          <ExpandableBox
            title="Software Engineering"
            className="text-xl text-left text-white font-semibold"
            details={[
              '☁️ Cloud Architecture: Designed and implemented solutions using AWS and Azure cloud services',
              '🏗️ Infrastructure: Experienced in Docker, Kubernetes, and cloud-native application development',
              '💻 Programming: Python, SQL, Matlab, JavaScript, React | Built full-stack applications and REST APIs',
              '🔐 Best Practices: Test-driven development, code review, documentation, and agile methodologies'
            ]}
          />

          <ExpandableBox
            title="Leadership"
            className="text-xl text-left text-white font-semibold"
            details={[
              '👥 Team Leadership: Led cross-discipline teams of data scientists, engineers and developers in delivering data & analytics solutions',
              '🎯 Project Management: Managed end-to-end ML projects from conception to production deployment',
              '🤝 Stakeholder Management: Collaborated with senior business leaders to align technical solutions with business objectives',
              '📚 Knowledge Sharing: Created and led internal communities of practice with more than 750 members'
            ]}
          />
          </div>
        </ExpandableBox>
      </section>
    </>
  );
};

export default About;