import React from 'react';
import { motion } from 'framer-motion';
import { FaSpinner, FaCheckCircle, FaTimes } from 'react-icons/fa';

const steps = [
    { id: 1, label: 'Uploading', icon: <FaSpinner className="animate-spin text-[#2B5EE8]" /> },
    { id: 2, label: 'Analyzing', icon: <FaSpinner className="animate-spin text-[#2B5EE8]" /> },
    { id: 3, label: 'Enhancing', icon: <FaSpinner className="animate-spin text-[#2B5EE8]" /> },
    { id: 4, label: 'Upgrading', icon: <FaSpinner className="animate-spin text-[#2B5EE8]" /> },
];

const PreloadOverlay = ({ currentStep, onClose }) => {
    return (
        <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
            <motion.div
                className="bg-white p-8 rounded-2xl shadow-lg text-center w-11/12 max-w-md relative border border-[#DDE3EC]"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
                <h2 className="text-3xl font-bold text-[#2B5EE8] mb-6">Processing Your Schema</h2>
                <div className="space-y-4">
                    {steps.map((step) => (
                        <motion.div 
                            key={step.id} 
                            className="flex items-center space-x-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: step.id * 0.1 }}
                        >
                            <div className="text-2xl">
                                {currentStep > step.id ? (
                                    <FaCheckCircle className="text-green-500" />
                                ) : (
                                    step.icon
                                )}
                            </div>
                            <div className="text-lg text-gray-700">{step.label}</div>
                        </motion.div>
                    ))}
                </div>
                {/* Cancel Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
                >
                    <FaTimes size={20} />
                </button>
            </motion.div>
        </motion.div>
    );
};

export default PreloadOverlay;