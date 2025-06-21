import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaRocket, FaDatabase, FaUserCircle, FaChevronDown, FaBars, FaTimes, FaChartLine, FaSignOutAlt } from "react-icons/fa";
import { isAuthenticated, getCurrentUser, logout } from "../utils/auth";

const Navbar = () => {
  const location = useLocation();
  const [isProductHovered, setIsProductHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Variants for the underline animation
  const linkUnderlineVariants = {
    initial: { width: 0, opacity: 0, left: 0, right: "auto" },
    hover: {
      width: "100%",
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    exit: {
      width: 0,
      opacity: 0,
      left: "auto",
      right: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  // Dropdown animation variants
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -5,
      transition: { duration: 0.2 }
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  // Mobile menu animation variants
  const mobileMenuVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.3 }
    },
    visible: {
      opacity: 1,
      height: "auto",
      transition: { duration: 0.3 }
    }
  };

  // Custom link component with the underline animation
  const AnimatedLink = ({ to, children, icon }) => {
    const active = isActive(to);

    return (
      <Link
        to={to}
        className={`relative group flex items-center gap-2 py-2 transition-colors ${active ? "text-[#2B5EE8] font-bold" : "text-gray-700 hover:text-[#2B5EE8]"
          }`}
      >
        {icon && <span className="text-[#2B5EE8]">{icon}</span>}
        <span>{children}</span>

        {/* Active indicator or hover underline */}
        {active ? (
          <motion.div
            className="absolute -bottom-1 left-0 h-0.5 bg-[#2B5EE8] w-full"
            layoutId="activeNavIndicator"
          />
        ) : (
          <motion.div
            className="absolute -bottom-1 h-0.5 bg-[#2B5EE8]"
            initial="initial"
            whileHover="hover"
            exit="exit"
            variants={linkUnderlineVariants}
          />
        )}
      </Link>
    );
  };

  return (
    <motion.nav
      className="sticky top-0 z-50 bg-white backdrop-blur-md bg-opacity-80 shadow-sm px-6 py-3 rounded-lg"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto flex justify-between items-center flex-wrap md:flex-nowrap">
        {/* Left Section: Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 group mb-2 md:mb-0"
        >
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
            whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.3 }}
          >
            <FaDatabase size={18} />
          </motion.div>
          <div className="flex flex-col">
            <motion.span
              className="text-gray-900 font-bold text-xl"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              DataForge
            </motion.span>
            <div className="flex items-center">
              <span className="text-gray-500 text-sm font-medium">Schema Generator</span>
              <span className="text-[#2B5EE8] ml-1 relative top-px">•</span>
            </div>
          </div>
        </Link>

        {/* Mobile Menu Icon */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-700 focus:outline-none"
          >
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Center Section: Product Info */}
        <div
          className="relative hidden md:flex items-center cursor-pointer rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors mb-2 md:mb-0"
          onMouseEnter={() => setIsProductHovered(true)}
          onMouseLeave={() => setIsProductHovered(false)}
        >
          <div className="flex items-center gap-2">
            <motion.div
              className="text-[#2B5EE8] bg-blue-50 p-1.5 rounded-md"
              whileHover={{ scale: 1.05 }}
            >
              <FaDatabase size={16} />
            </motion.div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-800 font-semibold">Enterprise Edition</span>
                <motion.div
                  animate={{ rotate: isProductHovered ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FaChevronDown size={12} className="text-gray-500" />
                </motion.div>
              </div>
              <span className="text-gray-500 text-sm">Warehouse Management System</span>
            </div>
          </div>

          {/* Product dropdown */}
          <AnimatePresence>
            {isProductHovered && (
              <motion.div
                className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100 w-60 z-50"
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <ul className="py-2">
                  <li className="px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span className="text-blue-500"><FaDatabase size={14} /></span>
                    <span className="text-gray-800">Standard Edition</span>
                  </li>
                  <li className="px-4 py-2 bg-blue-50 text-[#2B5EE8] flex items-center gap-2">
                    <span><FaDatabase size={14} /></span>
                    <span className="font-medium">Enterprise Edition</span>
                  </li>
                  <li className="px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span className="text-purple-500"><FaDatabase size={14} /></span>
                    <span className="text-gray-800">Cloud Edition</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Section: Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <AnimatedLink to="/features" icon={<FaRocket size={14} />}>
            Features
          </AnimatedLink>

          {isAuthenticated() ? (
            <>
              <AnimatedLink to="/dashboard" icon={<FaChartLine size={14} />}>
                Dashboard
              </AnimatedLink>

              <div className="flex items-center gap-2 text-gray-700">
                <FaUserCircle size={16} />
                <span className="text-sm">
                  Hi, {getCurrentUser()?.first_name || 'User'}
                </span>
              </div>

              <motion.button
                onClick={logout}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <FaSignOutAlt size={14} />
                Logout
              </motion.button>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative"
              >
                <Link to="/upload" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all">
                  Generate Schema
                  <motion.span
                    className="text-lg"
                    animate={{ x: [0, 2, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </Link>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg opacity-30 blur-md -z-10"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </motion.div>
            </>
          ) : (
            <>
              <AnimatedLink to="/login" icon={<FaUserCircle size={14} />}>
                Login
              </AnimatedLink>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative"
              >
                <Link to="/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all">
                  Get Started
                  <motion.span
                    className="text-lg"
                    animate={{ x: [0, 2, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </Link>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg opacity-30 blur-md -z-10"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden mt-2"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="flex flex-col gap-4">
              <AnimatedLink to="/features" icon={<FaRocket size={14} />}>
                Features
              </AnimatedLink>

              {isAuthenticated() ? (
                <>
                  <AnimatedLink to="/dashboard" icon={<FaChartLine size={14} />}>
                    Dashboard
                  </AnimatedLink>

                  <div className="flex items-center gap-2 text-gray-700 py-2">
                    <FaUserCircle size={16} />
                    <span>Hi, {getCurrentUser()?.first_name || 'User'}</span>
                  </div>

                  <motion.button
                    onClick={logout}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors justify-start"
                  >
                    <FaSignOutAlt size={14} />
                    Logout
                  </motion.button>

                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative"
                  >
                    <Link to="/upload" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all">
                      Generate Schema
                      <motion.span
                        className="text-lg"
                        animate={{ x: [0, 2, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        →
                      </motion.span>
                    </Link>
                  </motion.div>
                </>
              ) : (
                <>
                  <AnimatedLink to="/login" icon={<FaUserCircle size={14} />}>
                    Login
                  </AnimatedLink>

                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative"
                  >
                    <Link to="/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all">
                      Get Started
                      <motion.span
                        className="text-lg"
                        animate={{ x: [0, 2, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        →
                      </motion.span>
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;