import React from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";

const Features = () => {
  // Feature card animation variants
  const cardVariants = {
    offscreen: { y: 100, opacity: 0 },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        bounce: 0.4,
        duration: 0.8
      }
    },
    hover: {
      y: -10,
      boxShadow: "0 20px 25px -5px rgba(67, 97, 238, 0.1), 0 10px 10px -5px rgba(67, 97, 238, 0.04)",
      transition: { type: "spring", stiffness: 400, damping: 10 }
    }
  };

  // Text stagger animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  // Feature section data
  const features = [
    {
      icon: "💾",
      title: "AI-Enhanced Schema Generation",
      description: "Intelligently transform your database schema into an optimized data warehouse design with ML-driven optimization."
    },
    {
      icon: "📊",
      title: "Automated Dimensional Modeling",
      description: "Convert transactional data models to dimensional schemas with smart fact and dimension table identification."
    },
    {
      icon: "🔄",
      title: "Schema Comparison & Analysis",
      description: "Visually compare your original schema with the enhanced warehouse schema to identify improvements."
    },
    {
      icon: "📈",
      title: "Query Performance Optimization",
      description: "Get suggestions for indexes, partitioning, and other optimizations based on your specific domain and data patterns."
    },
    {
      icon: "🔍",
      title: "Domain-Specific Intelligence",
      description: "Specialized optimization for e-commerce, healthcare, finance, education, and more industry verticals."
    },
    {
      icon: "📝",
      title: "Documentation Generation",
      description: "Automatically create comprehensive documentation for your warehouse schema including data lineage."
    }
  ];

  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <motion.div 
          className="absolute top-40 right-20 w-64 h-64 bg-[#d7d1ff] rounded-full opacity-50 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{ 
            duration: 20,
            ease: "linear", 
            repeat: Infinity,
          }}
        />
        
        <motion.div 
          className="absolute bottom-40 left-20 w-48 h-48 bg-[#4361ee] rounded-full opacity-20 blur-3xl"
          animate={{ 
            scale: [1, 1.5, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ 
            duration: 15,
            ease: "easeInOut", 
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />

        {/* Hero Section */}
        <div className="pt-16 pb-24 px-8 max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-20"
          >
            <motion.h1 
              variants={itemVariants}
              className="text-[#2b2b2b] text-6xl font-medium mb-6"
            >
              Powerful <span className="text-[#4361ee]">Features</span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Transform your database schemas into high-performance data warehouse designs
              with our AI-powered platform. Enhance analytics capabilities and unlock insights faster.
            </motion.p>
            
            <motion.div
              variants={itemVariants}
              className="mt-10"
            >
              <Link to="/upload">
                <motion.button
                  className="bg-[#4361ee] text-white px-8 py-4 rounded-md text-lg font-medium"
                  whileHover={{ scale: 1.05, backgroundColor: "#1E4BCB" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try It Now
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl p-8 border border-[#DDE3EC] hover:border-[#4361ee]"
                variants={cardVariants}
                initial="offscreen"
                whileInView="onscreen"
                whileHover="hover"
                viewport={{ once: true, amount: 0.3 }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-[#2b2b2b] text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-[#F7F7F7] py-24 px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl font-medium text-[#2b2b2b] mb-6">How It <span className="text-[#4361ee]">Works</span></h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our platform uses advanced AI algorithms to analyze your database schema and transform it into an optimized warehouse design in just a few steps.
              </p>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-8 items-center">
              {/* Process Steps */}
              <div className="w-full lg:w-1/2">
                {[
                  { number: "01", title: "Upload Your Schema", description: "Upload your SQL database schema file to our platform." },
                  { number: "02", title: "AI Enhancement", description: "Our AI analyzes your schema to identify fact and dimension tables." },
                  { number: "03", title: "Schema Transformation", description: "We transform your schema into an optimized warehouse design." },
                  { number: "04", title: "Results & Implementation", description: "View the enhanced schema and implement it in your data warehouse." }
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2, duration: 0.5 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-6 mb-10"
                  >
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-[#4361ee] text-white flex items-center justify-center font-bold text-lg">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[#2b2b2b] mb-2">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Visual Illustration */}
              <motion.div
                className="w-full lg:w-1/2 bg-white p-8 rounded-xl shadow-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <div className="rounded-lg overflow-hidden border border-[#DDE3EC] p-6 bg-[#F7F7F7]">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-gray-500">schema_transformation.sql</div>
                  </div>

                  {/* Code visualization */}
                  {[
                    { color: "#4361ee", text: "CREATE TABLE dim_customer (" },
                    { color: "#2b2b2b", text: "  customer_id INT PRIMARY KEY," },
                    { color: "#2b2b2b", text: "  customer_name VARCHAR(100)," },
                    { color: "#2b2b2b", text: "  email VARCHAR(100)," },
                    { color: "#2b2b2b", text: "  address VARCHAR(255)" },
                    { color: "#4361ee", text: ");" },
                    { color: "", text: "" },
                    { color: "#4361ee", text: "CREATE TABLE fact_sales (" },
                    { color: "#2b2b2b", text: "  sale_id INT PRIMARY KEY," },
                    { color: "#2b2b2b", text: "  customer_id INT," },
                    { color: "#2b2b2b", text: "  product_id INT," },
                    { color: "#2b2b2b", text: "  sale_date DATE," },
                    { color: "#2b2b2b", text: "  amount DECIMAL(10,2)," },
                    { color: "#4361ee", text: "  FOREIGN KEY (customer_id) REFERENCES dim_customer(customer_id)" },
                    { color: "#4361ee", text: ");" },
                  ].map((line, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                      viewport={{ once: true }}
                      className="font-mono text-sm"
                      style={{ color: line.color }}
                    >
                      {line.text}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-[#4361ee] text-white py-24 px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h2
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-5xl font-bold mb-6"
            >
              Ready to Transform Your Data Warehouse?
            </motion.h2>
            
            <motion.p
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl mb-10 text-blue-100"
            >
              Get started today and see how our AI-powered platform can optimize your database schemas for better analytics performance.
            </motion.p>
            
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Link to="/upload">
                <motion.button
                  className="bg-white text-[#4361ee] px-8 py-4 rounded-md text-lg font-medium"
                  whileHover={{ scale: 1.05, backgroundColor: "#F7F7F7" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Upload Your Schema
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer Marquee */}
        <div className="p-5 bg-[#4361ee] text-white border-t border-blue-400">
          <div className="overflow-hidden">
            <motion.div
              className="flex items-center gap-8 whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            >
              {Array.from({ length: 10 }).map((_, index) => (
                <span key={index} className="text-[1.2rem] font-bold px-4">
                  AI-Driven Data Warehousing
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Features;