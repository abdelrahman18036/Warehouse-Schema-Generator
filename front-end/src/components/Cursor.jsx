import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const moveCursor = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Larger circle */}
      <motion.div
        className="fixed top-0 left-0 w-14 h-14 border border-gray-400 rounded-full pointer-events-none mix-blend-difference z-50"
        style={{
          translateX: "-50%",
          translateY: "-50%"
        }}
        animate={{ 
          x: position.x, 
          y: position.y,
          transition: { type: "tween", duration: 0 }
        }}
      />

      {/* Smaller dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-blue-500 rounded-full pointer-events-none z-50"
        style={{
          translateX: "-50%",
          translateY: "-50%"
        }}
        animate={{ 
          x: position.x, 
          y: position.y,
          transition: { type: "tween", duration: 0 }
        }}
      />
    </>
  );
};

export default CustomCursor;