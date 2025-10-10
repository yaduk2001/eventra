'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const PremiumCard = ({ 
  children, 
  className = '', 
  hoverEffect = 'lift',
  glass = false,
  onClick,
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const hoverEffects = {
    lift: {
      y: -8,
      scale: 1.02,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    },
    tilt: {
      rotateY: 2,
      rotateX: 2,
      scale: 1.02
    },
    glow: {
      scale: 1.02,
      boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)'
    },
    scale: {
      scale: 1.05
    }
  };

  const cardClass = glass ? 'card-glass' : 'card-premium';

  return (
    <motion.div
      className={`relative overflow-hidden transition-all duration-300 ${cardClass} ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={hoverEffects[hoverEffect]}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      {...props}
    >
      {/* Subtle gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 opacity-0"
        animate={{ 
          opacity: isHovered ? 1 : 0 
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          opacity: isHovered ? 1 : 0,
          x: isHovered ? ['-100%', '100%'] : '-100%'
        }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default PremiumCard;
