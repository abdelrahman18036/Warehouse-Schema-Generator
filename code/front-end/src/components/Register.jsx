import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle registration logic here
    console.log("Registration attempt with:", formData);
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
            <h2 className="text-3xl font-bold text-[#2b2b2b] mb-1">Create account</h2>
            <p className="text-[#2b2b2b] opacity-70 mb-8">Sign up to get started with DataVault</p>
          </motion.div>
          
          <form onSubmit={handleSubmit}>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:border-transparent"
                  required
                />
              </div>
              
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
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:border-transparent"
                  required
                />
              </div>

              <motion.button
                type="submit"
                className="w-full py-3 bg-[#4361ee] text-white rounded-md font-medium mt-2 relative overflow-hidden group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="herooverlay bg-[#292929] w-full h-full absolute rounded-md left-[-100%]"></div>
                <span className="relative z-10">Create Account</span>
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
              Already have an account?{" "}
              <Link to="/login" className="text-[#4361ee] font-medium hover:underline">
                Sign in
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
              By signing up, you agree to our Terms of Service and Privacy Policy. 
              Start designing your data warehouse schemas today.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;