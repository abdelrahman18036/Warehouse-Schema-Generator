    import React, { useEffect } from 'react';
    import { motion, useAnimation } from 'framer-motion';
    import { useInView } from 'react-intersection-observer';

    // Custom phrase - you can replace this with your own text
    const phrase = "DataForge optimizes warehouse operations with scalable schema generation, enhancing inventory management, order processing, and real-time logistics tracking..";

    function ScrollOpacity() {
    // Create a single ref and controls for the container
    const [containerRef, inView] = useInView({
        triggerOnce: false,
        threshold: 0.25,
        rootMargin: "-50px"
    });
    
    const controls = useAnimation();
    
    // Trigger animation when container comes into view
    useEffect(() => {
        if (inView) {
        controls.start(i => ({
            opacity: 1,
            y: 0,
            color: "#000000",
            transition: { 
            opacity: { duration: 0.3, ease: "easeOut" },
            y: { duration: 0.4, ease: "easeOut" },
            color: { 
                delay: i * 0.02, // Slightly longer delay for more noticeable effect
                duration: 0.5,
                ease: [0.2, 0.65, 0.3, 0.9]
            }
            }
        }));
        } else {
        controls.start(i => ({
            opacity: 0.5,
            y: 15,
            color: "#d1d5db", // Light gray initial color
            transition: { 
            opacity: { duration: 0.2 },
            y: { duration: 0.3 },
            color: { duration: 0.2 }
            }
        }));
        }
    }, [inView, controls]);

    // Split text into words and create a React component for each
    const splitWords = (phrase) => {
        let letterCounter = 0; // Global counter for all letters to ensure consistent reveal order
        
        return phrase.split(" ").map((word, wordIndex) => (
        <div 
            key={`word-${wordIndex}`} 
            className="mr-3 mb-3 inline-block"
        >
            {word.split("").map((letter, letterIndex) => {
            letterCounter++; // Increment counter for each letter
            
            return (
                <motion.span
                key={`letter-${wordIndex}-${letterIndex}`}
                custom={letterCounter} // Use global counter for consistent sequence
                animate={controls}
                initial={{ opacity: 0.5, y: 15, color: "#d1d5db" }}
                className="inline-block text-3xl md:text-4xl lg:text-5xl font-medium"
                style={{ 
                    willChange: 'color, opacity, transform',
                    display: 'inline-block' 
                }}
                >
                {letter}
                </motion.span>
            );
            })}
        </div>
        ));
    };

    return (
        <section 
        ref={containerRef}
        className="min-h-screen flex items-center justify-center py-24 px-6  overflow-hidden"
        >
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
            <motion.div 
                className="bg-black/70 inline-block px-4 py-2 rounded-full mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
            >
                <span className="text-blue-600 text-sm font-semibold"></span>
            </motion.div>
            
          
            </div>
            
            <div className="text-center">
            {splitWords(phrase)}
            </div>
            
            {/* Visual indicator to show scroll position */}
            <motion.div 
            className="flex justify-center mt-14"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            >
            <div className="px-4 py-2 bg-black/70 rounded-lg text-blue-700 text-sm">
                <span className="font-medium">{inView ? "" : ""}</span>
            </div>
            </motion.div>
        </div>
        </section>
    );
    }

    export default ScrollOpacity;