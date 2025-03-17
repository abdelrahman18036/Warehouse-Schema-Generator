import React, { useState } from "react";
import { Link, Navigate, redirect, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login attempt with:", formData);
    navigate("/upload");
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div 
        className="bg-white shadow-lg rounded-lg w-full max-w-md p-8 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background accent */}
        <div className="absolute -right-10 -top-10">
          <div className="w-24 h-24 bg-[#d7d1ff] rounded-full opacity-80 blur-sm"></div>
        </div>
        
        <div className="relative z-10">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-[#2b2b2b] mb-1">Welcome back</h2>
            <p className="text-[#2b2b2b] opacity-70 mb-8">Sign in to access your account</p>
          </motion.div>
          
          <form onSubmit={handleSubmit}>
            <motion.div 
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-[#2b2b2b]">Password</label>
                  <Link to="/forgot-password" className="text-sm text-[#4361ee] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:border-transparent"
                  required
                />
              </div>

              <motion.button
                type="submit"
                className="w-full py-3 bg-[#4361ee] text-white rounded-md font-medium relative overflow-hidden group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="herooverlay bg-[#292929] w-full h-full absolute rounded-md left-[-100%]"></div>
                <span className="relative z-10">Sign In</span>
              </motion.button>
            </motion.div>
          </form>
          
          <motion.div 
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-[#2b2b2b]">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#4361ee] font-medium hover:underline">
                Create account
              </Link>
            </p>
          </motion.div>
          
          <motion.div 
            className="flex items-start gap-2 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="text-[#4361ee] text-xl">*</span>
            <p className="text-[#2b2b2b] text-xs">
              Your data warehouse schemas are securely stored and accessible from anywhere.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;