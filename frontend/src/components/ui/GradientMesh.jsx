import React from 'react';
import { motion } from 'framer-motion';

const blobs = [
  {
    color: 'bg-cyan-500/20',
    size: 'w-[500px] h-[500px]',
    initial: { x: '-10%', y: '-20%' },
    animate: { x: ['−10%', '10%', '-10%'], y: ['-20%', '0%', '-20%'] },
    duration: 18,
  },
  {
    color: 'bg-violet-500/15',
    size: 'w-[400px] h-[400px]',
    initial: { x: '60%', y: '10%' },
    animate: { x: ['60%', '50%', '60%'], y: ['10%', '-10%', '10%'] },
    duration: 22,
  },
  {
    color: 'bg-sky-400/10',
    size: 'w-[450px] h-[450px]',
    initial: { x: '20%', y: '50%' },
    animate: { x: ['20%', '35%', '20%'], y: ['50%', '30%', '50%'] },
    duration: 20,
  },
  {
    color: 'bg-accent-gold/10',
    size: 'w-[300px] h-[300px]',
    initial: { x: '80%', y: '60%' },
    animate: { x: ['80%', '70%', '80%'], y: ['60%', '40%', '60%'] },
    duration: 16,
  },
];

const GradientMesh = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${blob.color} ${blob.size} will-change-transform`}
          initial={blob.initial}
          animate={blob.animate}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default GradientMesh;
