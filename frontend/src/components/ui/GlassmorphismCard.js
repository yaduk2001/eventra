'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const GlassmorphismCard = ({ 
  children, 
  className = '', 
  intensity = 'medium',
  onClick,
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const intensities = {
    light: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdrop: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.15)',
      backdrop: 'blur(15px)',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    strong: {
      background: 'rgba(255, 255, 255, 0.2)',
      backdrop: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.4)'
    }
  };

  const currentIntensity = intensities[intensity];

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${className}`}
      style={{
        background: currentIntensity.background,
        backdropFilter: currentIntensity.backdrop,
        border: currentIntensity.border,
        boxShadow: isHovered 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
          : '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ 
        scale: 1.02,
        y: -5
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      {...props}
    >
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"
        animate={{ 
          opacity: isHovered ? 1 : 0.3 
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: isHovered ? ['-100%', '100%'] : '-100%'
        }}
        transition={{ duration: 0.8 }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassmorphismCard;
