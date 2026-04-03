import React from 'react';
import { motion } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};


const PillTag = ({ text }) => (
  <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-700/60 text-zinc-300 border border-zinc-600/50">
    {text}
  </span>
);

const About = () => {
  return (
    <>
      {/* Hero */}
      <motion.section
        {...fadeUp}
        className="bg-zinc-900 py-14 px-8 rounded-[15px] w-full max-w-[1200px] mx-auto mb-12 font-montserrat"
      >
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">

            {/* Role badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-400/10 border border-sky-400/30 text-sky-400 text-sm font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                Data Science &amp; AI Lead · BP
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-400 text-sm font-medium">
                <i className="fas fa-university text-xs"></i>
                Industry Advisory Board &amp; Guest Lecturer · University of Buckingham
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-sky-400 bg-clip-text text-transparent leading-tight">
              Hi! I'm Fred
            </h1>

            {/* Tagline */}
            <p className="text-zinc-300 text-xl mb-3 leading-snug font-medium">
              I lead AI from research to production.
            </p>
            <p className="text-zinc-500 text-base mb-8">
              6 teams · 40+ engineers, data scientists &amp; PMs · systems that actually ship.
            </p>

            {/* What I build */}
            <div className="flex flex-wrap gap-2 mb-10">
              {['LLM Chatbots', 'Document Intelligence', 'Demand Forecasting', 'Causal Inference', 'GenAI Apps'].map(t => (
                <span key={t} className="text-sm px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-sky-400/50 hover:text-sky-400 transition-colors duration-300">
                  {t}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-8">
              <a
                href="https://www.linkedin.com/in/frederik-heda/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-2.5 rounded-full transition-all duration-300 font-medium"
              >
                <i className="fab fa-linkedin mr-2"></i>Connect
              </a>
              <a
                href="https://github.com/fredheda"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-full border border-zinc-700 hover:border-zinc-500 transition-all duration-300 font-medium"
              >
                <i className="fab fa-github mr-2"></i>GitHub
              </a>
            </div>

          </div>

          {/* Photo */}
          <div className="lg:w-[340px] shrink-0">
            <div className="relative">
              <div className="absolute -inset-1 rounded-[18px] bg-gradient-to-br from-sky-400/20 to-transparent blur-sm"></div>
              <img
                src="/images/FH.jpeg"
                alt="Frederik Heda"
                className="relative w-full rounded-[15px] transform hover:scale-[1.02] transition-all duration-300"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <motion.a
            href="#about"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="text-zinc-500 hover:text-sky-400 transition-colors duration-300"
          >
            <i className="fas fa-chevron-down text-xl"></i>
          </motion.a>
        </div>
      </motion.section>

      {/* Beyond the Basics — bento grid */}
      <motion.section
        {...fadeUp}
        id="about"
        className="bg-zinc-900 py-8 px-6 rounded-[15px] w-full max-w-[1200px] mx-auto mb-12 font-montserrat scroll-mt-20"
      >
        <h2 className="font-montserrat text-2xl font-bold tracking-tight text-left text-white mb-8 flex items-center">
          <i className="fas fa-user-astronaut mr-4 text-sky-400"></i>Beyond the Basics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* What I'm working on */}
          <div className="bg-zinc-800/50 p-6 rounded-xl hover:bg-zinc-800/70 transition-all duration-300">
            <h3 className="text-xl text-white mb-4 flex items-center">
              <i className="fas fa-rocket text-sky-400 mr-3"></i>
              What I'm Working On
            </h3>
            <div className="text-zinc-300 leading-relaxed space-y-3">
              <p>Leading BP's GenAI transformation — shipping RAG pipelines, LLM chatbots, and document intelligence tools used across the business.</p>
              <p>Building AI that augments people, not replaces them. Democratising access to complex tech through communities of practice with 750+ members.</p>
              <span className="inline-flex items-center gap-2 text-sky-400 text-sm font-medium">
                <i className="fas fa-chart-line"></i>Multi-million dollar value delivered to date
              </span>
            </div>
          </div>

          {/* Beyond Work */}
          <div className="bg-zinc-800/50 p-6 rounded-xl hover:bg-zinc-800/70 transition-all duration-300">
            <h3 className="text-xl text-white mb-4 flex items-center">
              <i className="fas fa-compass text-sky-400 mr-3"></i>
              Beyond Work
            </h3>
            <div className="text-zinc-300 leading-relaxed space-y-3">
              <div className="flex items-start gap-3">
                <i className="fas fa-university text-sky-400 mt-0.5"></i>
                <span>Industry Advisory Board member &amp; Guest Lecturer at the University of Buckingham — advising on degree programmes and delivering MSc-level lectures.</span>
              </div>
              <div className="flex items-center gap-3">
                <i className="fas fa-table-tennis text-sky-400"></i>
                <span>Former University Table Tennis Club President</span>
              </div>
              <div className="flex items-center gap-3">
                <i className="fas fa-globe text-sky-400"></i>
                <span>Adventure seeker &amp; world explorer</span>
              </div>
              <div className="flex items-center gap-3">
                <i className="fas fa-headphones text-sky-400"></i>
                <span>Audiobook enthusiast — ~2 books a month</span>
              </div>
            </div>
          </div>

          {/* Fun facts strip — full width */}
          <div className="md:col-span-2 flex flex-wrap justify-around gap-6 py-5 px-6 bg-zinc-800/30 rounded-xl border border-zinc-700/40 text-zinc-400 text-sm">
            <div className="flex items-center gap-2">☕☕☕ <span>Coffee per day</span></div>
            <div className="flex items-center gap-2">🇬🇧 🇩🇪 🇵🇱 <span>Languages</span></div>
            <div className="flex items-center gap-2"><i className="fas fa-graduation-cap text-sky-400"></i> <span>2x Masters Degrees</span></div>
            <div className="flex items-center gap-2"><i className="fas fa-robot text-sky-400"></i> <span>3 Robots Built</span></div>
            <div className="flex items-center gap-2"><i className="fas fa-users text-sky-400"></i> <span>750+ Community Members</span></div>
          </div>
        </div>
      </motion.section>

      {/* Skills & Expertise */}
      <motion.section
        {...fadeUp}
        id="skills"
        className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 py-8 px-6 rounded-[15px] w-full max-w-[1200px] mx-auto mb-12 font-montserrat relative overflow-hidden scroll-mt-20"
      >
        <h2 className="font-montserrat text-2xl font-bold tracking-tight text-left text-white mb-8 flex items-center">
          <i className="fas fa-microchip mr-4 text-sky-400"></i>
          Skills &amp; Expertise
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* AI & ML */}
          <div className="group bg-gradient-to-br from-sky-400/5 via-zinc-800/95 to-zinc-900 p-6 rounded-xl border border-sky-400/20 hover:border-sky-400/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]">
            <h3 className="text-xl text-white mb-4 flex items-center">
              <i className="fas fa-brain text-sky-400 mr-3 group-hover:scale-110 transition-transform duration-300"></i>
              AI &amp; Machine Learning
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">LLM Development</p>
                <div className="flex flex-wrap gap-2">
                  {['Azure OpenAI', 'LangChain', 'HuggingFace'].map(t => <PillTag key={t} text={t} />)}
                </div>
              </div>
              <div>
                <p className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">ML Frameworks</p>
                <div className="flex flex-wrap gap-2">
                  {['TensorFlow', 'PyTorch', 'Scikit-learn'].map(t => <PillTag key={t} text={t} />)}
                </div>
              </div>
              <div>
                <p className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">MLOps</p>
                <div className="flex flex-wrap gap-2">
                  {['Azure ML', 'AWS SageMaker', 'MLflow'].map(t => <PillTag key={t} text={t} />)}
                </div>
              </div>
            </div>
          </div>

          {/* Software Engineering */}
          <div className="group bg-gradient-to-br from-sky-400/5 via-zinc-800/95 to-zinc-900 p-6 rounded-xl border border-sky-400/20 hover:border-sky-400/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]">
            <h3 className="text-xl text-white mb-4 flex items-center">
              <i className="fas fa-code text-sky-400 mr-3 group-hover:scale-110 transition-transform duration-300"></i>
              Software Engineering
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">Languages</p>
                <div className="flex flex-wrap gap-2">
                  {['Python', 'JavaScript', 'SQL', 'MATLAB'].map(t => <PillTag key={t} text={t} />)}
                </div>
              </div>
              <div>
                <p className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">Web Development</p>
                <div className="flex flex-wrap gap-2">
                  {['React', 'CSS', 'FastAPI'].map(t => <PillTag key={t} text={t} />)}
                </div>
              </div>
              <div>
                <p className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">Cloud &amp; DevOps</p>
                <div className="flex flex-wrap gap-2">
                  {['AWS', 'Azure', 'Docker', 'Kubernetes'].map(t => <PillTag key={t} text={t} />)}
                </div>
              </div>
            </div>
          </div>

          {/* Leadership */}
          <div className="group bg-gradient-to-br from-sky-400/5 via-zinc-800/95 to-zinc-900 p-6 rounded-xl border border-sky-400/20 hover:border-sky-400/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]">
            <h3 className="text-xl text-white mb-4 flex items-center">
              <i className="fas fa-users text-sky-400 mr-3 group-hover:scale-110 transition-transform duration-300"></i>
              Leadership
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">Team Management</p>
                <div className="flex flex-wrap gap-2">
                  {['Cross-functional Teams', '6+ Members'].map(t => <PillTag key={t} text={t} />)}
                </div>
              </div>
              <div>
                <p className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">Community Building</p>
                <div className="flex flex-wrap gap-2">
                  {['750+ Members', '2x CoP Lead'].map(t => <PillTag key={t} text={t} />)}
                </div>
              </div>
              <div>
                <p className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">Delivery</p>
                <div className="flex flex-wrap gap-2">
                  {['Multi-million $ Projects', 'Agile', 'Stakeholder Mgmt'].map(t => <PillTag key={t} text={t} />)}
                </div>
              </div>
            </div>
          </div>

          {/* Domain Expertise */}
          <div className="group bg-gradient-to-br from-sky-400/5 via-zinc-800/95 to-zinc-900 p-6 rounded-xl border border-sky-400/20 hover:border-sky-400/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]">
            <h3 className="text-xl text-white mb-4 flex items-center">
              <i className="fas fa-layer-group text-sky-400 mr-3 group-hover:scale-110 transition-transform duration-300"></i>
              Domain Expertise
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">Data Engineering</p>
                <div className="flex flex-wrap gap-2">
                  {['ETL', 'Data Pipelines', 'Big Data'].map(t => <PillTag key={t} text={t} />)}
                </div>
              </div>
              <div>
                <p className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">Computer Vision</p>
                <div className="flex flex-wrap gap-2">
                  {['OCR', 'Image Processing', 'Object Detection'].map(t => <PillTag key={t} text={t} />)}
                </div>
              </div>
              <div>
                <p className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">Time Series</p>
                <div className="flex flex-wrap gap-2">
                  {['Forecasting', 'Anomaly Detection'].map(t => <PillTag key={t} text={t} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </>
  );
};

export default About;
