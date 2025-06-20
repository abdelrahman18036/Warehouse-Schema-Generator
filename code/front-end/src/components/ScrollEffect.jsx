import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";

const ScrollEffect = ({ text }) => {
  const paragraphsRef = useRef([]);

  useEffect(() => {
    const handleScroll = () => {
      paragraphsRef.current.forEach((p) => {
        if (p) {
          const rect = p.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight * 0.8;
          if (isVisible) {
            p.childNodes.forEach((span, index) => {
              span.style.transitionDelay = `${index * 0.02}s`;
              span.style.opacity = 1;
            });
          } else {
            p.childNodes.forEach((span) => {
              span.style.opacity = 0.1;
            });
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen p-8">
      <header className="min-h-20 flex items-center px-10">
        <h1 className="text-[clamp(35px,10vw,70px)]">Scroll Effect</h1>
      </header>
      <main>
        {text.split("\n").map((paragraph, index) => (
          <p
            key={index}
            ref={(el) => (paragraphsRef.current[index] = el)}
            className="mx-8 mb-28 text-[clamp(25px,5vw,45px)]"
          >
            {paragraph.split("").map((char, charIndex) => (
              <motion.span
                key={charIndex}
                initial={{ opacity: 0.1 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: charIndex * 0.02 }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </p>
        ))}
      </main>
      <h2 className="py-40 px-5 text-5xl bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-gray-900">
        FILL THIS TEXT
      </h2>
    </div>
  );
};

export default ScrollEffect;
``