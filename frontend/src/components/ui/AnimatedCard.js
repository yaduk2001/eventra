'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const AnimatedCard = ({ 
  children, 
  className = '', 
  hoverEffect = 'lift',
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
      rotateY: 5,
      rotateX: 5,
      scale: 1.05
    },
    glow: {
      scale: 1.05,
      boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
    },
    flip: {
      rotateY: 180,
      scale: 1.05
    }
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 ${className}`}
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
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-0"
        animate={{ 
          opacity: isHovered ? 1 : 0 
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
        animate={{
          opacity: isHovered ? 0.3 : 0,
          x: isHovered ? ['-100%', '100%'] : '-100%'
        }}
        transition={{ duration: 0.6 }}
      />
    </motion.div>
  );
};

export default AnimatedCard;
