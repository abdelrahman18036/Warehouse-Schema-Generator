import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar = () => {
  // Variants for the underline animation
  const linkUnderlineVariants = {
    initial: { width: 0, left: 0, right: "auto" },
    hover: { 
      width: "100%", 
      transition: { duration: 0.3, ease: "easeInOut" } 
    },
    exit: { 
      width: 0, 
      left: "auto", 
      right: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  // Custom link component with the underline animation
  const AnimatedLink = ({ to, children }) => {
    return (
      <Link to={to} className="text-[#4361ee] uppercase font-semibold relative group">
        {children}
        <motion.div 
          className="absolute bottom-0 h-0.5 bg-[#4361ee]"
          initial="initial"
          whileHover="hover"
          exit="exit"
          variants={linkUnderlineVariants}
        />
      </Link>
    );
  };

  return (
    <motion.nav
      className="p-4"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto flex justify-between items-center py-4 font-semibold">
        {/* Left Section: Brand */}
        <div className="flex flex-col">
          <Link to="/" className="text-[#2b2b2b] font-semibold text-xl">
            <span className="font-bold">W.</span> DataVault
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[#2b2b2b] font-semibold">Schema Generator</span>
            <span className="text-[#4361ee] text-xl">·</span>
          </div>
        </div>


        {/* Center Section: Product Info */}
        <div className="text-left">
          <p className="text-[#2b2b2b]">
            Enterprise Edition /<br />
            Warehouse Management System
          </p>
        </div>

        {/* Right Section: Navigation Links */}
        <div className="flex items-center gap-16">
          <AnimatedLink to="/features">
            Features
          </AnimatedLink>
          <AnimatedLink to="/login">
            Login
          </AnimatedLink>
          <AnimatedLink to="/register">
            Register
          </AnimatedLink>

          {/* CTA Button */}
          <motion.button
            className="border border-[#4361ee] text-[#4361ee] px-4 py-2 rounded-full flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started <span className="text-xl">↗</span>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;