// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';

const Home = () => {
    return (
        <Layout>
            <div className="flex flex-col items-center justify-center text-center py-20">
                <motion.h1
                    className="text-5xl font-bold mb-6 text-titanite"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    Welcome to Warehouse Schema Generator
                </motion.h1>
                <motion.p
                    className="text-xl mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    Upload your database schema and generate a warehouse schema with AI enhancements.
                </motion.p>
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Link
                        to="/upload"
                        className="bg-titanite text-white px-6 py-3 rounded-lg shadow-lg hover:bg-titanite-dark transition"
                    >
                        Get Started
                    </Link>
                </motion.div>
            </div>
        </Layout >
    );
};

export default Home;
