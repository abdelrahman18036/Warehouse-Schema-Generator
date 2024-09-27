// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
    return (
        <motion.nav
            className="bg-surface p-4 shadow-lg"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 75 }}
        >
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-titanite font-bold text-2xl">
                    Warehouse Schema Generator
                </Link>
                {/* <div className="flex items-center space-x-4">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Link to="/upload" className="text-titanite-light hover:text-titanite-dark">
                            Upload Schema
                        </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Link to="/result" className="text-titanite-light hover:text-titanite-dark">
                            Schema Result
                        </Link>
                    </motion.div>
                </div> */}
            </div>
        </motion.nav>
    );
};

export default Navbar;
