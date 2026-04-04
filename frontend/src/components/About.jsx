import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import GradientMesh from './ui/GradientMesh';

/* ─── animation variants ─── */
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const wordReveal = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)', rotateX: 20 },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)', rotateX: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const clipReveal = {
  hidden: { clipPath: 'inset(0 100% 0 0)' },
  visible: {
    clipPath: 'inset(0 0% 0 0)',
    transition: { duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const badgeSlide = {
  hidden: { opacity: 0, x: -30 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.5, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const pillPop = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.35, delay: 0.6 + i * 0.05, ease: [0.22, 1, 0.36, 1] },
  }),
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const skillCardStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const skillCardReveal = {
  hidden: { opacity: 0, y: 30, rotate: -2 },
  visible: {
    opacity: 1, y: 0, rotate: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const pillStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

const pillReveal = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

/* ─── skill categories config ─── */
const skillCategories = [
  {
    title: 'AI & Machine Learning',
    icon: 'fas fa-brain',
    accent: 'cyan',
    colors: {
      border: 'border-accent-cyan/20 hover:border-accent-cyan/50',
      gradient: 'from-cyan-500/5 via-zinc-800/95 to-zinc-900',
      text: 'text-accent-cyan',
      glow: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]',
    },
    groups: [
      { label: 'LLM Development', items: ['RAG', 'MCP', 'A2A', 'Azure OpenAI', 'Google AI', 'Claude Agent SDK', 'Anthropic'] },
      { label: 'ML Frameworks', items: ['TensorFlow', 'PyTorch', 'Scikit-learn'] },
      { label: 'MLOps', items: ['Azure ML', 'AWS SageMaker', 'MLflow'] },
    ],
  },
  {
    title: 'Software Engineering',
    icon: 'fas fa-code',
    accent: 'blue',
    colors: {
      border: 'border-accent-blue/20 hover:border-accent-blue/50',
      gradient: 'from-sky-400/5 via-zinc-800/95 to-zinc-900',
      text: 'text-accent-blue',
      glow: 'hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]',
    },
    groups: [
      { label: 'Languages', items: ['Python', 'SQL', 'PHP', 'JavaScript'] },
      { label: 'Web Development', items: ['React', 'CSS', 'FastAPI'] },
      { label: 'Cloud & DevOps', items: ['AWS', 'Azure', 'Docker', 'Kubernetes'] },
    ],
  },
  {
    title: 'Leadership',
    icon: 'fas fa-users',
    accent: 'violet',
    colors: {
      border: 'border-accent-violet/20 hover:border-accent-violet/50',
      gradient: 'from-violet-500/5 via-zinc-800/95 to-zinc-900',
      text: 'text-accent-violet',
      glow: 'hover:shadow-[0_0_30px_rgba(167,139,250,0.15)]',
    },
    groups: [
      { label: 'Team Management', items: ['19 Direct Reports', '40+ Across 6 Teams'] },
      { label: 'Community Building', items: ['750+ Active Members', '2x CoP Founded & Scaled'] },
      { label: 'Delivery', items: ['Multi-million $ Projects', 'Agile', 'Stakeholder Mgmt'] },
    ],
  },
  {
    title: 'Domain Expertise',
    icon: 'fas fa-layer-group',
    accent: 'gold',
    colors: {
      border: 'border-amber-400/20 hover:border-amber-400/50',
      gradient: 'from-amber-400/5 via-zinc-800/95 to-zinc-900',
      text: 'text-accent-gold',
      glow: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]',
    },
    groups: [
      { label: 'Data Engineering', items: ['ETL', 'Data Pipelines', 'Big Data'] },
      { label: 'Computer Vision', items: ['OCR', 'Image Processing', 'Object Detection'] },
      { label: 'Time Series', items: ['Forecasting', 'Anomaly Detection'] },
    ],
  },
];

/* ─── components ─── */

const PillTag = ({ text, accent = 'zinc' }) => {
  const accentColors = {
    cyan: 'hover:border-accent-cyan/50 hover:text-accent-cyan',
    blue: 'hover:border-accent-blue/50 hover:text-accent-blue',
    violet: 'hover:border-accent-violet/50 hover:text-accent-violet',
    gold: 'hover:border-amber-400/50 hover:text-accent-gold',
    zinc: 'hover:border-zinc-500 hover:text-zinc-200',
  };

  return (
    <motion.span
      variants={pillReveal}
      className={`text-xs px-2.5 py-1 rounded-full bg-zinc-700/60 text-zinc-300 border border-zinc-600/50 transition-all duration-200 hover:scale-105 cursor-default ${accentColors[accent]}`}
    >
      {text}
    </motion.span>
  );
};

const SpotlightCard = ({ children, className = '', accentColor = 'rgba(34,211,238,0.08)' }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {hovering && (
        <div
          className="pointer-events-none absolute -inset-px z-10 transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, ${accentColor}, transparent 60%)`,
          }}
        />
      )}
      {children}
    </div>
  );
};

const TiltCard = ({ children, className = '' }) => {
  const [transform, setTransform] = useState('');
  const prefersReduced = useReducedMotion();

  const handleMouseMove = (e) => {
    if (prefersReduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(1000px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`);
  };

  return (
    <div
      className={`transition-transform duration-300 ease-out ${className}`}
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTransform('')}
    >
      {children}
    </div>
  );
};

/* ─── main component ─── */
const About = () => {
  const headlineWords = "Hi! I'm Fred".split(' ');
  const skillPills = ['LLM Chatbots', 'Agentic AI', 'Document Intelligence', 'Demand Forecasting', 'Causal Inference', 'GenAI Apps'];

  return (
    <>
      {/* ═══ HERO ═══ */}
      <motion.section
        initial="hidden"
        animate="visible"
        className="relative bg-surface-900 py-14 px-6 md:px-8 rounded-[15px] w-full max-w-[1200px] mx-auto mb-12 overflow-hidden"
      >
        <GradientMesh />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">

            {/* Role badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              <motion.div custom={0} variants={badgeSlide}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-sm font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
                Data Science &amp; AI Lead &middot; BP
              </motion.div>
              <motion.div custom={1} variants={badgeSlide}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-400 text-sm font-medium"
              >
                <i className="fas fa-university text-xs" />
                Industry Advisory Board &amp; Guest Lecturer &middot; University of Buckingham
              </motion.div>
            </div>

            {/* Headline — staggered word reveal */}
            <motion.h1
              variants={staggerContainer}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight font-heading"
            >
              {headlineWords.map((word, i) => (
                <motion.span
                  key={i}
                  variants={wordReveal}
                  className="inline-block mr-3 gradient-text"
                  style={{ perspective: '600px' }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            {/* Tagline — clip-path reveal */}
            <motion.p variants={clipReveal} className="text-zinc-300 text-lg md:text-xl mb-3 leading-snug font-medium">
              I lead AI from research to production.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-zinc-400 text-base mb-8"
            >
              6 teams &middot; 40+ engineers, data scientists &amp; PMs &middot; systems that actually ship.
            </motion.p>

            {/* What I build — pill pop-in */}
            <div className="flex flex-wrap gap-2 mb-10">
              {skillPills.map((t, i) => (
                <motion.span
                  key={t}
                  custom={i}
                  variants={pillPop}
                  className="text-sm px-3 py-1.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700 hover:border-accent-cyan/50 hover:text-accent-cyan transition-colors duration-300 cursor-default"
                >
                  {t}
                </motion.span>
              ))}
            </div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="flex flex-wrap gap-4 mb-8"
            >
              <a
                href="https://www.linkedin.com/in/frederik-heda/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative group bg-gradient-to-r from-accent-cyan to-accent-violet text-white px-6 py-2.5 rounded-full font-medium transition-all duration-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]"
              >
                <i className="fab fa-linkedin mr-2" />Connect
              </a>
              <a
                href="https://github.com/fredheda"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-zinc-800/60 backdrop-blur-sm hover:bg-zinc-700/60 text-white px-6 py-2.5 rounded-full border border-zinc-600 hover:border-zinc-400 transition-all duration-300 font-medium"
              >
                <i className="fab fa-github mr-2" />GitHub
              </a>
            </motion.div>

          </div>

          {/* Photo with animated gradient ring */}
          <motion.div
            className="lg:w-[340px] shrink-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              {/* Rotating gradient ring */}
              <div className="absolute -inset-[3px] rounded-[18px] gradient-ring opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -inset-[1px] rounded-[17px] bg-surface-900" />
              <img
                src="/images/FH.jpeg"
                alt="Frederik Heda"
                className="relative w-full rounded-[15px]"
                loading="eager"
                decoding="async"
              />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-10">
          <motion.a
            href="#about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-zinc-500 hover:text-accent-cyan transition-colors duration-300 flex flex-col items-center gap-2"
          >
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <motion.div
              className="w-[1px] h-6 bg-gradient-to-b from-zinc-500 to-transparent"
              animate={{ scaleY: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              style={{ transformOrigin: 'top' }}
            />
          </motion.a>
        </div>
      </motion.section>

      {/* ═══ BEYOND THE BASICS — bento grid ═══ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        id="about"
        className="bg-surface-900 py-8 px-6 rounded-[15px] w-full max-w-[1200px] mx-auto mb-12 scroll-mt-20"
      >
        <motion.h2
          variants={slideFromLeft}
          className="font-heading text-2xl font-bold tracking-tight text-left text-white mb-8 flex items-center"
        >
          <i className="fas fa-user-astronaut mr-4 text-accent-cyan" />Beyond the Basics
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* What I'm working on */}
          <motion.div variants={slideFromLeft}>
            <SpotlightCard accentColor="rgba(34,211,238,0.08)" className="bg-zinc-800/50 p-6 rounded-xl hover:bg-zinc-800/70 transition-all duration-300 h-full">
              <h3 className="text-xl text-white mb-4 flex items-center">
                <i className="fas fa-rocket text-accent-cyan mr-3 animate-float" />
                What I'm Working On
              </h3>
              <div className="text-zinc-300 leading-relaxed space-y-3">
                <p>Leading BP's GenAI transformation — shipping agentic chatbots, document intelligence pipelines and NLP tools across the front office.</p>
                <p>Building and scaling LLM evaluation frameworks adopted by AI teams across bp.</p>
                <p>Speaking at industry conferences including the London AI Summit &amp; Microsoft Reactor.</p>
                <span className="inline-flex items-center gap-2 text-accent-cyan text-sm font-medium">
                  <i className="fas fa-chart-line" />Multi-million dollar value delivered to date
                </span>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Beyond Work */}
          <motion.div variants={slideFromRight}>
            <SpotlightCard accentColor="rgba(167,139,250,0.08)" className="bg-zinc-800/50 p-6 rounded-xl hover:bg-zinc-800/70 transition-all duration-300 h-full">
              <h3 className="text-xl text-white mb-4 flex items-center">
                <i className="fas fa-compass text-accent-violet mr-3 animate-spin-slow" />
                Beyond Work
              </h3>
              <div className="text-zinc-300 leading-relaxed space-y-3">
                <div className="flex items-start gap-3">
                  <i className="fas fa-university text-accent-violet mt-0.5" />
                  <span>Industry Advisory Board member &amp; Guest Lecturer at the University of Buckingham — advising on degree programmes and delivering MSc-level lectures.</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-table-tennis text-accent-violet" />
                  <span>Former University Table Tennis Club President</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-globe text-accent-violet" />
                  <span>Adventure seeker &amp; world explorer</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-headphones text-accent-violet" />
                  <span>Audiobook enthusiast — ~2 books a month</span>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </motion.section>

      {/* ═══ SKILLS & EXPERTISE ═══ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={skillCardStagger}
        id="skills"
        className="bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900 py-8 px-6 rounded-[15px] w-full max-w-[1200px] mx-auto mb-12 relative overflow-hidden scroll-mt-20"
      >
        <motion.h2
          variants={slideFromLeft}
          className="font-heading text-2xl font-bold tracking-tight text-left text-white mb-8 flex items-center"
        >
          <i className="fas fa-microchip mr-4 gradient-text" style={{ WebkitTextFillColor: 'unset' }}>
          </i>
          <span>Skills &amp; Expertise</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {skillCategories.map((cat) => (
            <motion.div key={cat.title} variants={skillCardReveal}>
              <TiltCard>
                <div className={`group bg-gradient-to-br ${cat.colors.gradient} p-6 rounded-xl border ${cat.colors.border} transition-all duration-500 ${cat.colors.glow}`}>
                  <h3 className="text-xl text-white mb-4 flex items-center">
                    <i className={`${cat.icon} ${cat.colors.text} mr-3 group-hover:scale-110 transition-transform duration-300`} />
                    {cat.title}
                  </h3>
                  <motion.div className="space-y-3" variants={pillStagger}>
                    {cat.groups.map((group) => (
                      <div key={group.label}>
                        <p className={`${cat.colors.text} text-xs font-semibold uppercase tracking-wider mb-2`}>{group.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map((t) => <PillTag key={t} text={t} accent={cat.accent} />)}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </>
  );
};

export default About;
