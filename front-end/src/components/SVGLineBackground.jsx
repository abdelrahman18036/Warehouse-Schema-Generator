import React, { useState, useEffect } from 'react';

const SVGLineBackground = () => {
  const [lines, setLines] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Set up initial lines
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Create initial lines
    const initialLines = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x1: Math.random() * window.innerWidth,
      y1: Math.random() * window.innerHeight,
      x2: Math.random() * window.innerWidth,
      y2: Math.random() * window.innerHeight,
      opacity: Math.random() * 0.5 + 0.2,
      speed: Math.random() * 2 - 1
    }));
    
    setLines(initialLines);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Animation loop
  useEffect(() => {
    if (!lines.length) return;
    
    const interval = setInterval(() => {
      setLines(prevLines => prevLines.map(line => {
        // Check proximity to mouse
        const dx = mousePos.x - (line.x1 + line.x2) / 2;
        const dy = mousePos.y - (line.y1 + line.y2) / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Adjust line based on mouse proximity
        let newLine = { ...line };
        
        if (distance < 200) {
          // Move towards mouse slightly
          newLine.x1 += dx * 0.01;
          newLine.y1 += dy * 0.01;
          newLine.x2 += dx * 0.01;
          newLine.y2 += dy * 0.01;
          newLine.opacity = Math.min(line.opacity + 0.05, 0.8);
        } else {
          // Random movement
          newLine.x1 += Math.sin(Date.now() * 0.001 + line.id) * line.speed;
          newLine.y1 += Math.cos(Date.now() * 0.001 + line.id) * line.speed;
          newLine.x2 += Math.cos(Date.now() * 0.001 + line.id) * line.speed;
          newLine.y2 += Math.sin(Date.now() * 0.001 + line.id) * line.speed;
          newLine.opacity = Math.max(line.opacity - 0.01, 0.2);
        }
        
        // Keep within bounds
        if (newLine.x1 < 0) newLine.x1 = dimensions.width;
        if (newLine.x1 > dimensions.width) newLine.x1 = 0;
        if (newLine.y1 < 0) newLine.y1 = dimensions.height;
        if (newLine.y1 > dimensions.height) newLine.y1 = 0;
        
        if (newLine.x2 < 0) newLine.x2 = dimensions.width;
        if (newLine.x2 > dimensions.width) newLine.x2 = 0;
        if (newLine.y2 < 0) newLine.y2 = dimensions.height;
        if (newLine.y2 > dimensions.height) newLine.y2 = 0;
        
        return newLine;
      }));
    }, 50);
    
    return () => clearInterval(interval);
  }, [lines, dimensions, mousePos]);
  
  return (
    <svg className="fixed top-0 left-0 w-full h-full -z-10">
      {lines.map(line => (
        <line
          key={line.id}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="#3b82f6" // Tailwind blue
          strokeWidth="2"
          strokeOpacity={line.opacity}
        />
      ))}
    </svg>
  );
};

export default SVGLineBackground;