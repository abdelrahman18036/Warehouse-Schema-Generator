// src/components/PreloadOverlay.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaSpinner, FaCheckCircle, FaTimes } from 'react-icons/fa';

const steps = [
    { id: 1, label: 'Uploading', icon: <FaSpinner className="animate-spin text-titanite" /> },
    { id: 2, label: 'Analyzing', icon: <FaSpinner className="animate-spin text-titanite" /> },
    { id: 3, label: 'Enhancing', icon: <FaSpinner className="animate-spin text-titanite" /> },
    { id: 4, label: 'Upgrading', icon: <FaSpinner className="animate-spin text-titanite" /> },
];

const PreloadOverlay = ({ currentStep, onClose }) => {
    return (
        <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="bg-surface p-8 rounded-lg shadow-lg text-center w-11/12 max-w-md relative"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <h2 className="text-3xl font-bold text-titanite mb-6">Processing Your Schema</h2>
                <div className="space-y-4">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-center space-x-4">
                            <div className="text-2xl">
                                {currentStep > step.id ? (
                                    <FaCheckCircle className="text-teal-400" />
                                ) : (
                                    step.icon
                                )}
                            </div>
                            <div className="text-lg text-white">{step.label}</div>
                        </div>
                    ))}
                </div>
                {/* Cancel Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:text-red-500 transition"
                >
                    <FaTimes size={20} />
                </button>
            </motion.div>
        </motion.div>
    );
};

export default PreloadOverlay;
