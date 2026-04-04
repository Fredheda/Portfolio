import { motion } from 'framer-motion';

const SectionDivider = () => (
  <div className="flex justify-center my-8 w-full max-w-[1200px] mx-auto">
    <motion.div
      className="h-[1px] w-full max-w-md"
      style={{ background: 'linear-gradient(90deg, transparent, #22d3ee, #a78bfa, transparent)' }}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    />
  </div>
);

export default SectionDivider;
