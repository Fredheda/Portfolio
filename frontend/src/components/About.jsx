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
              Senior Machine Learning Engineer:<br/> passionate about AI, building innovative solutions, and sharing knowledge.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <QuickFact icon="fas fa-robot" text="AI/ML Expert" />
              <QuickFact icon="fas fa-code" text="Software Engineer" />
              <QuickFact icon="fas fa-brain" text="Innovation Leader" />
              <QuickFact icon="fas fa-graduation-cap" text="2x Masters Degrees" />
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
        className="bg-stone-900 py-8 px-6 rounded-[15px] w-full max-w-[1200px] mx-auto mb-2.5 font-montserrat"
      >
        <h2 className="font-permanent-marker text-3xl text-left text-white mb-8 font-semibold flex items-center">
          <i className="fas fa-user-astronaut mr-4 text-blue-500"></i>Beyond the Basics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Current Focus */}
          <div className="bg-stone-800/50 p-6 rounded-xl hover:bg-stone-800/70 transition-all duration-300">
            <h3 className="text-xl text-white mb-4 flex items-center">
              <i className="fas fa-rocket text-blue-500 mr-3"></i>
              Current Adventures
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Spearheading BP's GenAI revolution through innovative RAG solutions and LLM applications. 
              Democratizing AI by building tools that make complex tech accessible to everyone.
              <span className="block mt-2 text-blue-400">
                <i className="fas fa-chart-line mr-2"></i>Impact: Multi-million dollar value delivered
              </span>
            </p>
          </div>

          {/* Tech Philosophy */}
          <div className="bg-stone-800/50 p-6 rounded-xl hover:bg-stone-800/70 transition-all duration-300">
            <h3 className="text-xl text-white mb-4 flex items-center">
              <i className="fas fa-lightbulb text-yellow-500 mr-3"></i>
              Tech Philosophy
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Believe in building AI that augments human capabilities rather than replacing them.
              Focused on creating practical solutions that bridge the gap between cutting-edge tech and real-world applications.
              <span className="block mt-2 text-yellow-400">
                <i className="fas fa-users mr-2"></i>Led two communities of practice with 750+ members
              </span>
            </p>
          </div>

          {/* Beyond Work */}
          <div className="bg-stone-800/50 p-6 rounded-xl hover:bg-stone-800/70 transition-all duration-300">
            <h3 className="text-xl text-white mb-4 flex items-center">
              <i className="fas fa-compass text-green-500 mr-3"></i>
              Beyond Work
            </h3>
            <div className="text-gray-300 leading-relaxed">
              <div className="flex items-center mb-2">
                <i className="fas fa-table-tennis text-green-400 mr-2"></i>
                Former University Table Tennis Club President
              </div>
              <div className="flex items-center mb-2">
                <i className="fas fa-globe text-green-400 mr-2"></i>
                Adventure Seeker & World Explorer
              </div>
              <div className="flex items-center">
                <i className="fas fa-headphones text-green-400 mr-2"></i>
                Audiobook Enthusiast (2 books/month)
              </div>
            </div>
          </div>

          {/* Fun Facts */}
          <div className="bg-stone-800/50 p-6 rounded-xl hover:bg-stone-800/70 transition-all duration-300">
            <h3 className="text-xl text-white mb-4 flex items-center">
              <i className="fas fa-star text-purple-500 mr-3"></i>
              Quick Bytes
            </h3>
            <div className="grid grid-cols-2 gap-4 text-gray-300">
              <div className="flex items-center">
                <i className="fas fa-coffee text-purple-400 mr-2"></i>
                Coffee: ☕☕☕/day
              </div>
              <div className="flex items-center">
                <i className="fas fa-globe-europe text-purple-400 mr-2"></i>
                Languages: 🇬🇧 🇩🇪 🇵🇱
              </div>
              <div className="flex items-center">
                <i className="fas fa-graduation-cap text-purple-400 mr-2"></i>
                Degrees: 2
              </div>
              <div className="flex items-center">
                <i className="fas fa-robot text-purple-400 mr-2"></i>
                Robots: 3
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="website-info"
        className="bg-gradient-to-br from-stone-900 to-stone-800 py-8 px-6 rounded-[15px] w-full max-w-[1200px] mx-auto mb-2.5 font-montserrat"
      >
        <h2 className="font-permanent-marker text-3xl text-left text-white mb-8 font-semibold flex items-center">
          <i className="fas fa-code-branch mr-4 text-blue-500"></i>The Tech Behind This Site
        </h2>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column - Tech Details */}
          <div className="md:w-1/2 space-y-4">
            <div className="bg-stone-800/30 backdrop-blur-sm p-5 rounded-xl border border-stone-700/50 hover:border-blue-500/50 transition-all duration-300">
              <h3 className="text-xl text-white mb-3 flex items-center">
                <i className="fas fa-layer-group text-blue-500 mr-3"></i>
                Built With
              </h3>
              <div className="grid grid-cols-2 gap-3 text-gray-300">
                <div className="flex items-center space-x-2 bg-stone-800/50 p-2 rounded-lg">
                  <i className="fab fa-react text-blue-400"></i>
                  <span>React</span>
                </div>
                <div className="flex items-center space-x-2 bg-stone-800/50 p-2 rounded-lg">
                  <i className="fab fa-css3 text-blue-400"></i>
                  <span>Tailwind</span>
                </div>
                <div className="flex items-center space-x-2 bg-stone-800/50 p-2 rounded-lg">
                  <i className="fas fa-server text-blue-400"></i>
                  <span>Python</span>
                </div>
                <div className="flex items-center space-x-2 bg-stone-800/50 p-2 rounded-lg">
                  <i className="fas fa-cloud text-blue-400"></i>
                  <span>Heroku</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-800/30 backdrop-blur-sm p-5 rounded-xl border border-stone-700/50 hover:border-yellow-500/50 transition-all duration-300">
              <h3 className="text-xl text-white mb-3 flex items-center">
                <i className="fas fa-robot text-yellow-500 mr-3"></i>
                AI Integration
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Powered by OpenAI's GPT-4o-mini, Fredbot helps visitors learn more about my work and experience.
                <span className="block mt-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <i className="fas fa-info-circle text-yellow-500 mr-2"></i>
                  Currently in beta testing
                </span>
              </p>
            </div>
          </div>

          {/* Right Column - Status & Info */}
          <div className="md:w-1/2 space-y-4">
            <div className="bg-stone-800/30 backdrop-blur-sm p-5 rounded-xl border border-stone-700/50 hover:border-green-500/50 transition-all duration-300">
              <h3 className="text-xl text-white mb-3 flex items-center">
                <i className="fas fa-code-commit text-green-500 mr-3"></i>
                Latest Updates
              </h3>
              <div className="space-y-2 text-gray-300">
                <div className="flex items-center justify-between bg-stone-800/50 p-2 rounded-lg">
                  <span>Last Commit</span>
                  <span className="text-green-400">Q1/2025</span>
                </div>
                <div className="flex items-center justify-between bg-stone-800/50 p-2 rounded-lg">
                  <span>Status</span>
                  <span className="text-green-400">Active Development</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-800/30 backdrop-blur-sm p-5 rounded-xl border border-stone-700/50 hover:border-purple-500/50 transition-all duration-300">
              <h3 className="text-xl text-white mb-3 flex items-center">
                <i className="fas fa-wand-magic-sparkles text-purple-500 mr-3"></i>
                Site Features
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="group bg-gradient-to-br from-stone-800/50 to-purple-900/30 p-4 rounded-xl hover:scale-105 transition-all duration-300">
                  <i className="fas fa-palette text-purple-400 text-2xl mb-2"></i>
                  <h4 className="text-white text-sm font-semibold">Dark Theme</h4>
                  <p className="text-gray-400 text-xs">Optimized for readability</p>
                </div>
                <div className="group bg-gradient-to-br from-stone-800/50 to-blue-900/30 p-4 rounded-xl hover:scale-105 transition-all duration-300">
                  <i className="fas fa-mobile-screen text-blue-400 text-2xl mb-2"></i>
                  <h4 className="text-white text-sm font-semibold">Responsive</h4>
                  <p className="text-gray-400 text-xs">Mobile-first design</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="skills"
        className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 py-8 px-6 rounded-[15px] w-full max-w-[1200px] mx-auto mb-2.5 font-montserrat relative overflow-hidden"
      >
        <div className="relative">
          <h2 className="font-permanent-marker text-3xl text-left text-white mb-8 font-semibold flex items-center">
            <i className="fas fa-microchip mr-4 text-blue-500"></i>
            Skills & Expertise
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI & ML */}
            <div className="group bg-gradient-to-br from-blue-500/5 via-stone-800/95 to-stone-900 p-6 rounded-xl border border-blue-500/20 hover:border-blue-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]">
              <h3 className="text-xl text-white mb-4 flex items-center">
                <i className="fas fa-brain text-blue-500 mr-3 group-hover:scale-110 transition-transform duration-300"></i>
                AI & Machine Learning
              </h3>
              <div className="space-y-4">
                <div className="bg-stone-800/50 p-4 rounded-lg transform transition-transform hover:translate-x-1 hover:bg-stone-800/70">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-blue-400 font-semibold">LLM Development</p>
                  </div>
                  <p className="text-gray-300 text-sm">Azure OpenAI, LangChain, HuggingFace</p>
                </div>
                
                <div className="bg-stone-800/50 p-4 rounded-lg transform transition-transform hover:translate-x-1 hover:bg-stone-800/70">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-blue-400 font-semibold">ML Frameworks</p>
                  </div>
                  <p className="text-gray-300 text-sm">TensorFlow, PyTorch, Scikit-learn</p>
                </div>
                
                <div className="bg-stone-800/50 p-4 rounded-lg transform transition-transform hover:translate-x-1 hover:bg-stone-800/70">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-blue-400 font-semibold">MLOps</p>
                  </div>
                  <p className="text-gray-300 text-sm">Azure ML, AWS SageMaker, MLflow</p>
                </div>
              </div>
            </div>

            {/* Software Engineering */}
            <div className="group bg-gradient-to-br from-yellow-500/5 via-stone-800/95 to-stone-900 p-6 rounded-xl border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]">
              <h3 className="text-xl text-white mb-4 flex items-center">
                <i className="fas fa-code text-yellow-500 mr-3 group-hover:scale-110 transition-transform duration-300"></i>
                Software Engineering
              </h3>
              <div className="space-y-4">
                <div className="bg-stone-800/50 p-4 rounded-lg transform transition-transform hover:translate-x-1 hover:bg-stone-800/70">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-yellow-400 font-semibold">Languages</p>
                  </div>
                  <p className="text-gray-300 text-sm">Python, JavaScript, SQL, MATLAB</p>
                </div>
                
                <div className="bg-stone-800/50 p-4 rounded-lg transform transition-transform hover:translate-x-1 hover:bg-stone-800/70">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-yellow-400 font-semibold">Web Development</p>
                  </div>
                  <p className="text-gray-300 text-sm">React, CSS, FastAPI</p>
                </div>
                
                <div className="bg-stone-800/50 p-4 rounded-lg transform transition-transform hover:translate-x-1 hover:bg-stone-800/70">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-yellow-400 font-semibold">Cloud & DevOps</p>
                  </div>
                  <p className="text-gray-300 text-sm">AWS, Azure, Docker, Kubernetes</p>
                </div>
              </div>
            </div>

            {/* Leadership */}
            <div className="group bg-gradient-to-br from-green-500/5 via-stone-800/95 to-stone-900 p-6 rounded-xl border border-green-500/20 hover:border-green-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]">
              <h3 className="text-xl text-white mb-4 flex items-center">
                <i className="fas fa-users text-green-500 mr-3 group-hover:scale-110 transition-transform duration-300"></i>
                Leadership
              </h3>
              <div className="space-y-4">
                <div className="bg-stone-800/50 p-4 rounded-lg transform transition-transform hover:translate-x-1 hover:bg-stone-800/70">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-green-400 font-semibold">Team Management</p>
                  </div>
                  <p className="text-gray-300 text-sm">Led cross-functional teams of 6+ members</p>
                </div>
                
                <div className="bg-stone-800/50 p-4 rounded-lg transform transition-transform hover:translate-x-1 hover:bg-stone-800/70">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-green-400 font-semibold">Community Building</p>
                  </div>
                  <p className="text-gray-300 text-sm">Led 750+ member communities</p>
                </div>
                
                <div className="bg-stone-800/50 p-4 rounded-lg transform transition-transform hover:translate-x-1 hover:bg-stone-800/70">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-green-400 font-semibold">Project Management</p>
                  </div>
                  <p className="text-gray-300 text-sm">Delivered multi-million dollar projects</p>
                </div>
              </div>
            </div>

            {/* Domain Expertise */}
            <div className="group bg-gradient-to-br from-purple-500/5 via-stone-800/95 to-stone-900 p-6 rounded-xl border border-purple-500/20 hover:border-purple-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <h3 className="text-xl text-white mb-4 flex items-center">
                <i className="fas fa-layer-group text-purple-500 mr-3 group-hover:scale-110 transition-transform duration-300"></i>
                Domain Expertise
              </h3>
              <div className="space-y-4">
                <div className="bg-stone-800/50 p-4 rounded-lg transform transition-transform hover:translate-x-1 hover:bg-stone-800/70">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-purple-400 font-semibold">Data Engineering</p>
                  </div>
                  <p className="text-gray-300 text-sm">ETL, Data Pipelines, Big Data</p>
                </div>
                
                <div className="bg-stone-800/50 p-4 rounded-lg transform transition-transform hover:translate-x-1 hover:bg-stone-800/70">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-purple-400 font-semibold">Computer Vision</p>
                  </div>
                  <p className="text-gray-300 text-sm">OCR, Image Processing, Object Detection</p>
                </div>
                
                <div className="bg-stone-800/50 p-4 rounded-lg transform transition-transform hover:translate-x-1 hover:bg-stone-800/70">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-purple-400 font-semibold">Time Series</p>
                  </div>
                  <p className="text-gray-300 text-sm">Forecasting, Anomaly Detection</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;