import React, { useState, useEffect } from "react";
import { Link, Navigate, redirect, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { authAPI, isAuthenticated } from "../utils/auth";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authAPI.login(formData.email, formData.password);

      // Redirect to intended page or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
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

              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#4361ee] text-white rounded-md font-medium relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                <div className="herooverlay bg-[#292929] w-full h-full absolute rounded-md left-[-100%]"></div>
                <span className="relative z-10">
                  {loading ? "Signing In..." : "Sign In"}
                </span>
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