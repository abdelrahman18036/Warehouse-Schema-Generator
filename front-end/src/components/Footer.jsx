import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import ElasticLine from './ElasticLine';
import { FaGithub, FaTwitter, FaLinkedinIn, FaArrowRight } from 'react-icons/fa';

const Footer = () => {
    const [emailFocused, setEmailFocused] = useState(false);
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    
    // Mouse interaction for the logo
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useTransform(mouseY, [-10, 10], [1, -1]);
    const rotateY = useTransform(mouseX, [-10, 10], [-1, 1]);
    
    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    };
    
    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email) {
            setSubscribed(true);
            setTimeout(() => setSubscribed(false), 3000);
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.07,
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
            x: 3,
            transition: { duration: 0.2 } 
        }
    };

    const asteriskVariants = {
        initial: { rotate: 0 },
        animate: { 
            rotate: 360,
            transition: {
                duration: 15,
                repeat: Infinity,
                ease: "linear"
            }
        }
    };
    
    // For the interactive gradient button
    const buttonX = useMotionValue(0);
    const buttonY = useMotionValue(0);
    const buttonRotateX = useTransform(buttonY, [-20, 20], [5, -5]);
    const buttonRotateY = useTransform(buttonX, [-20, 20], [-5, 5]);
    
    const handleButtonMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        buttonX.set(e.clientX - rect.left - rect.width / 2);
        buttonY.set(e.clientY - rect.top - rect.height / 2);
    };

    return (
      <div className="overflow-hidden ">
            {/* Enhanced elastic line with gradient */}
            <ElasticLine
                releaseThreshold={50}
                strokeWidth={1.5}
                maxDeflection={30}
                color="url(#gradient)"
                animateInTransition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    delay: 0.15,
                }}
                className="overflow-hidden"
            >
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4361ee" />
                    <stop offset="50%" stopColor="#6282fd" />
                    <stop offset="100%" stopColor="#4361ee" />
                </linearGradient>
            </ElasticLine>
            
          <motion.footer 
            className="w-full pt-14 pb-10 mt-auto "
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-[80%] mx-auto px-4">
                {/* Background decorative elements */}
                <div className="absolute left-0 right-0 -z-10 opacity-5 overflow-hidden">
                    <div className="absolute -top-40 -left-20 w-64 h-64 rounded-full border border-gray-300"></div>
                    <div className="absolute top-20 right-10 w-96 h-96 rounded-full border border-gray-300"></div>
                    <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-[800px] h-[800px] rounded-full border border-gray-300"></div>
                </div>
                
                <motion.div 
                    className="grid grid-cols-12 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {/* Logo and Copyright */}
                    <motion.div className="col-span-12 md:col-span-3" variants={itemVariants}>
                        <div className="flex flex-col">
                            <motion.a 
                                href="/" 
                                className="text-[#2b2b2b] font-semibold text-xl mb-4 inline-block"
                                onMouseMove={handleMouseMove}
                                style={{ 
                                    rotateX, 
                                    rotateY,
                                    perspective: "1000px",
                                    transformStyle: "preserve-3d"
                                }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <span className="font-bold text-[#4361ee]">W.</span> Warehouse Schema
                                <motion.div 
                                    className="h-0.5 bg-gradient-to-r from-[#4361ee] to-[#6282fd] mt-1 w-0"
                                    whileHover={{ width: "100%" }}
                                    transition={{ duration: 0.3 }}
                                />
                            </motion.a>
                            <motion.p 
                                className="text-gray-500 text-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                Transforming database schemas into <br />
                                optimized data warehouses with AI.
                            </motion.p>
                            
                            <motion.p 
                                className="text-gray-400 text-sm mt-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                © {new Date().getFullYear()} DataVault Technologies
                            </motion.p>
                        </div>
                    </motion.div>

                    {/* Navigation Links */}
                    <motion.div className="col-span-6 md:col-span-2" variants={itemVariants}>
                        <h3 className="text-[#4361ee] uppercase font-semibold mb-5 text-sm tracking-wider">Platform</h3>
                        <ul className="space-y-3">
                            {[
                                { label: 'Features', url: '#' },
                                { label: 'Pricing', url: '#' },
                                { label: 'Documentation', url: '#' },
                                { label: 'API', url: '#' }
                            ].map((item, index) => (
                                <motion.li key={index} whileHover="hover" className="flex items-center">
                                    <motion.div
                                        className="w-0 h-0.5 bg-[#4361ee] mr-0"
                                        variants={{
                                            hover: { width: 8, marginRight: 8, transition: { duration: 0.2 } }
                                        }}
                                    />
                                    <motion.a 
                                        href={item.url} 
                                        className="text-gray-600 text-sm transition-colors"
                                        variants={linkHoverVariants}
                                    >
                                        {item.label}
                                    </motion.a>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div className="col-span-6 md:col-span-2" variants={itemVariants}>
                        <h3 className="text-[#4361ee] uppercase font-semibold mb-5 text-sm tracking-wider">Resources</h3>
                        <ul className="space-y-3">
                            {[
                                { label: 'Blog', url: '#' },
                                { label: 'Templates', url: '#' },
                                { label: 'Case Studies', url: '#' },
                                { label: 'Support', url: '#' }
                            ].map((item, index) => (
                                <motion.li key={index} whileHover="hover" className="flex items-center">
                                    <motion.div
                                        className="w-0 h-0.5 bg-[#4361ee] mr-0"
                                        variants={{
                                            hover: { width: 8, marginRight: 8, transition: { duration: 0.2 } }
                                        }}
                                    />
                                    <motion.a 
                                        href={item.url} 
                                        className="text-gray-600 text-sm transition-colors"
                                        variants={linkHoverVariants}
                                    >
                                        {item.label}
                                    </motion.a>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div className="col-span-6 md:col-span-2" variants={itemVariants}>
                        <h3 className="text-[#4361ee] uppercase font-semibold mb-5 text-sm tracking-wider">Legal</h3>
                        <ul className="space-y-3">
                            {[
                                { label: 'Privacy', url: '#' },
                                { label: 'Terms', url: '#' },
                                { label: 'Security', url: '#' }
                            ].map((item, index) => (
                                <motion.li key={index} whileHover="hover" className="flex items-center">
                                    <motion.div
                                        className="w-0 h-0.5 bg-[#4361ee] mr-0"
                                        variants={{
                                            hover: { width: 8, marginRight: 8, transition: { duration: 0.2 } }
                                        }}
                                    />
                                    <motion.a 
                                        href={item.url} 
                                        className="text-gray-600 text-sm transition-colors"
                                        variants={linkHoverVariants}
                                    >
                                        {item.label}
                                    </motion.a>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Newsletter with enhanced interactive design */}
                    <motion.div className="col-span-12 md:col-span-3" variants={itemVariants}>
                        <h3 className="text-[#4361ee] uppercase font-semibold mb-5 text-sm tracking-wider">Stay Updated</h3>
                        <motion.form 
                            className="flex flex-col"
                            onSubmit={handleSubscribe}
                            animate={subscribed ? { y: [-5, 0], transition: { duration: 0.3 } } : {}}
                        >
                            <motion.p 
                                className="text-gray-600 text-sm mb-3"
                                animate={subscribed ? { opacity: 0, height: 0 } : { opacity: 1, height: "auto" }}
                            >
                                Get our latest updates and news
                            </motion.p>
                            
                            {subscribed ? (
                                <motion.div 
                                    className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm flex items-center"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <svg className="w-4 h-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Thank you for subscribing!
                                </motion.div>
                            ) : (
                                <motion.div 
                                    className={`flex relative overflow-hidden rounded-lg ${emailFocused ? 'ring-2 ring-[#4361ee]/30' : ''}`}
                                    whileHover={{ scale: 1.01 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                    onMouseMove={handleButtonMouseMove}
                                    style={{ transformStyle: "preserve-3d" }}
                                >
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Your email" 
                                        className="bg-gray-50 rounded-l-lg py-3 px-4 text-sm w-full focus:outline-none border border-gray-200"
                                        onFocus={() => setEmailFocused(true)}
                                        onBlur={() => setEmailFocused(false)}
                                        required
                                    />
                                    <motion.button 
                                        className="bg-[#4361ee] text-white rounded-r-lg px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 min-w-[90px]"
                                        whileTap={{ scale: 0.97 }}
                                        style={{ 
                                            rotateX: buttonRotateX,
                                            rotateY: buttonRotateY,
                                            perspective: "500px"
                                        }}
                                    >
                                        Subscribe
                                        <FaArrowRight size={12} />
                                    </motion.button>
                                    
                                    {/* Animated gradient border for focus effect */}
                                    {emailFocused && (
                                        <motion.div 
                                            className="absolute inset-0 pointer-events-none border border-[#4361ee]/20 rounded-lg"
                                            animate={{ 
                                                borderColor: ["rgba(67, 97, 238, 0.2)", "rgba(98, 130, 253, 0.4)", "rgba(67, 97, 238, 0.2)"],
                                                boxShadow: [
                                                    "0 0 0px rgba(67, 97, 238, 0)",
                                                    "0 0 8px rgba(67, 97, 238, 0.3)",
                                                    "0 0 0px rgba(67, 97, 238, 0)"
                                                ]
                                            }}
                                            transition={{ 
                                                repeat: Infinity, 
                                                duration: 2,
                                                ease: "easeInOut"
                                            }}
                                        />
                                    )}
                                </motion.div>
                            )}
                            
                            <motion.p 
                                className="text-gray-400 text-xs mt-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                We respect your privacy. No spam, ever.
                            </motion.p>
                        </motion.form>
                    </motion.div>
                </motion.div>

                {/* Bottom section with enhanced social links and accent */}
                <motion.div 
                    className="flex flex-wrap justify-between items-center mt-16 pt-8 border-t border-gray-100"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    <div className="flex items-center gap-6 mb-4 md:mb-0">
                        {[
                            { platform: 'GitHub', icon: <FaGithub size={16} />, url: '#' },
                            { platform: 'Twitter', icon: <FaTwitter size={16} />, url: '#' },
                            { platform: 'LinkedIn', icon: <FaLinkedinIn size={16} />, url: '#' }
                        ].map((platform, index) => (
                            <motion.a 
                                key={index}
                                href={platform.url} 
                                className="flex items-center gap-2 text-gray-500 hover:text-[#4361ee] transition-colors"
                                whileHover={{ 
                                    scale: 1.05,
                                    color: "#4361ee",
                                    y: -2
                                }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <span className="text-[#4361ee]">{platform.icon}</span>
                                <span className="text-sm">{platform.platform}</span>
                            </motion.a>
                        ))}
                    </div>
                    
                    <div className="flex items-start gap-2">
                        <motion.div 
                            className="relative"
                            animate={{ 
                                rotate: [0, 359],
                                transition: { duration: 15, repeat: Infinity, ease: "linear" }
                            }}
                        >
                            <motion.span 
                                className="absolute top-0 left-0 text-[#4361ee] text-xl  w-4 h-4 flex items-center justify-center"
                                animate={{ 
                                    scale: [1, 1.2, 1],
                                    opacity: [0.8, 1, 0.8]
                                }}
                                transition={{ 
                                    duration: 3, 
                                    repeat: Infinity,
                                    ease: "easeInOut" 
                                }}
                            >
                                *
                            </motion.span>
                        </motion.div>
                        <motion.p 
                            className="text-gray-500 text-sm pl-3"
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