import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDatabase } from 'react-icons/fa';

const PreLoader = ({ setLoading }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  const loadingPhrases = [
    "Initializing data schemas",
    "Preparing warehouse components",
    "Loading optimization tools",
    "Connecting to AI engine"
  ];

  // Simulate loading process
  useEffect(() => {
    let interval;
    let textInterval;
    let currentPhraseIndex = 0;

    // Update loading text periodically
    textInterval = setInterval(() => {
      setLoadingText(loadingPhrases[currentPhraseIndex]);
      currentPhraseIndex = (currentPhraseIndex + 1) % loadingPhrases.length;
    }, 1500);

    // Increment progress
    interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 1;
        
        // When progress reaches 100, notify parent component
        if (newProgress >= 100) {
          clearInterval(interval);
          
          // Allow animation to complete before hiding
          setTimeout(() => {
            setLoading(false);
          }, 600);
        }
        
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 30);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, [setLoading]);

  return (
    <motion.div 
      className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[100]"
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        transition: { duration: 0.5, ease: "easeInOut" }
      }}
    >
      <div className="w-full max-w-md px-8 flex flex-col items-center">
        {/* Logo Animation */}
        <motion.div 
          className="mb-10 flex flex-col items-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div 
            className="bg-gradient-to-r from-[#4361ee] to-[#6282fd] text-white w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-4"
            animate={{ 
              rotate: [0, 10, 0, -10, 0],
              scale: [1, 1.05, 1, 1.05, 1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 5,
              ease: "easeInOut"
            }}
          >
            <FaDatabase size={30} />
          </motion.div>
          
          <motion.h1 
            className="text-[#2b2b2b] text-2xl font-bold mb-1"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            Data<span className="text-[#4361ee]">Forge</span>
          </motion.h1>
          <motion.p 
            className="text-gray-500 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Warehouse Schema Generator
          </motion.p>
        </motion.div>

        {/* Loading Progress Indicator */}
        <motion.div 
          className="w-full mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#4361ee] to-[#6282fd]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <motion.span 
              className="text-xs text-gray-500 font-medium"
              animate={{ opacity: loadingText ? 1 : 0.5 }}
            >
              {loadingText}
            </motion.span>
            <motion.span 
              className="text-[#4361ee] text-sm font-bold"
              key={progress}
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              {progress}%
            </motion.span>
          </div>
        </motion.div>

        {/* Dynamic Pattern Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Background patterns */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-[#4361ee] rounded-full opacity-[0.03]"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
              }}
              animate={{
                opacity: [0.01, 0.03, 0.01],
                scale: [1, 1.2, 1],
                x: [0, 10, 0],
                y: [0, 10, 0]
              }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 3 + Math.random() * 5,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
        
        {/* Animated Data Points */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#4361ee] rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 0.5, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 1 + Math.random() * 2,
                delay: Math.random() * 3
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PreLoader;