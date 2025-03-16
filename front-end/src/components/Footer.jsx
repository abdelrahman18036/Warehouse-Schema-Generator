import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ElasticLine from './ElasticLine';
const Footer = () => {
    // Animation variants for staggered children
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
            transition: { 
                type: "spring",
                stiffness: 100,
                damping: 10
            }
        }
    };

    const linkHoverVariants = {
        hover: { 
            scale: 1.05, 
            color: "#4361ee",
            transition: { duration: 0.2 } 
        }
    };

    const asteriskVariants = {
        initial: { rotate: 0 },
        animate: { 
            rotate: 360,
            transition: {
                duration: 10,
                repeat: Infinity,
                ease: "linear"
            }
        }
    };

    return (
      <div className=' overflow-hidden'>
            {/* Animated elastic line */}
            <ElasticLine
            releaseThreshold={50}
            strokeWidth={1}
            animateInTransition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                delay: 0.15,
            }}
             className='overflow-hidden'
            />
          <motion.footer 
            className="w-full border-t border-gray-200 py-10 mt-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
        >
            <div className="w-[80%] mx-auto px-4">
                <motion.div 
                    className="grid grid-cols-12 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {/* Logo and Copyright */}
                    <motion.div className="col-span-3" variants={itemVariants}>
                        <div className="flex flex-col">
                            <motion.a 
                                href="/" 
                                className="text-[#2b2b2b] font-semibold text-xl mb-3"
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                <span className="font-bold">W.</span> Warehouse Schema
                            </motion.a>
                            <motion.p 
                                className="text-[#2b2b2b] text-sm mt-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                © {new Date().getFullYear()} DataVault Technologies
                            </motion.p>
                        </div>
                    </motion.div>

                    {/* Navigation Links */}
                    <motion.div className="col-span-2" variants={itemVariants}>
                        <h3 className="text-[#4361ee] uppercase font-semibold mb-4 text-sm">Platform</h3>
                        <ul className="space-y-2">
                            {['Features', 'Pricing', 'Documentation', 'API'].map((item, index) => (
                                <motion.li key={index} whileHover="hover" variants={linkHoverVariants}>
                                    <a href="#" className="text-[#2b2b2b] text-sm transition-colors">
                                        {item}
                                    </a>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div className="col-span-2" variants={itemVariants}>
                        <h3 className="text-[#4361ee] uppercase font-semibold mb-4 text-sm">Resources</h3>
                        <ul className="space-y-2">
                            {['Blog', 'Templates', 'Case Studies', 'Support'].map((item, index) => (
                                <motion.li key={index} whileHover="hover" variants={linkHoverVariants}>
                                    <a href="#" className="text-[#2b2b2b] text-sm transition-colors">
                                        {item}
                                    </a>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div className="col-span-2" variants={itemVariants}>
                        <h3 className="text-[#4361ee] uppercase font-semibold mb-4 text-sm">Legal</h3>
                        <ul className="space-y-2">
                            {['Privacy', 'Terms', 'Security'].map((item, index) => (
                                <motion.li key={index} whileHover="hover" variants={linkHoverVariants}>
                                    <a href="#" className="text-[#2b2b2b] text-sm transition-colors">
                                        {item}
                                    </a>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Newsletter */}
                    <motion.div className="col-span-3" variants={itemVariants}>
                        <h3 className="text-[#4361ee] uppercase font-semibold mb-4 text-sm">Stay Updated</h3>
                        <div className="flex flex-col">
                            <p className="text-[#2b2b2b] text-sm mb-3">Subscribe to our newsletter</p>
                            <motion.div 
                                className="flex"
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                <input 
                                    type="email" 
                                    placeholder="Your email" 
                                    className="bg-gray-100 rounded-l-md py-2 px-3 text-sm w-full focus:outline-none focus:ring-1 focus:ring-[#4361ee]"
                                />
                                <motion.button 
                                    className="bg-[#4361ee] text-white rounded-r-md px-4 py-2 text-sm font-medium hover:bg-[#3050ee] transition-colors"
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Subscribe
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Bottom section with links and accent */}
                <motion.div 
                    className="flex justify-between items-center mt-12 pt-6 border-t border-gray-200"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    <div className="flex items-center gap-6">
                        {['GitHub', 'Twitter', 'LinkedIn'].map((platform, index) => (
                            <motion.a 
                                key={index}
                                href="#" 
                                className="text-[#2b2b2b] text-sm"
                                whileHover={{ scale: 1.1, color: "#4361ee" }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                {platform}
                            </motion.a>
                        ))}
                    </div>
                    
                    <div className="flex items-start gap-2">
                        <motion.span 
                            className="text-[#4361ee] text-xl"
                            variants={asteriskVariants}
                            initial="initial"
                            animate="animate"
                        >
                            *
                        </motion.span>
                        <motion.p 
                            className="text-[#2b2b2b] text-xs"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.8 }}
                        >
                            Design, optimize, and deploy data warehouse schemas in minutes.
                        </motion.p>
                    </div>
                </motion.div>
            </div>
        </motion.footer>
      </div>
    );
};

export default Footer;