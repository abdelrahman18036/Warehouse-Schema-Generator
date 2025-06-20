// src/components/Layout.jsx
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { motion } from 'framer-motion';

const Layout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen ">
            <Navbar />
            <motion.main
                className="flex-grow container mx-auto p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
            >
                {children}
            </motion.main>
            <Footer />
        </div>
    );
};

export default Layout;
