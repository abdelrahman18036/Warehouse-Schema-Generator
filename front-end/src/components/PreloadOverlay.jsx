import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { FaCode, FaDatabase, FaRobot, FaCloudUploadAlt, FaTimes } from 'react-icons/fa';

const steps = [
    { 
        id: 1, 
        label: 'Uploading Schema', 
        icon: <FaCloudUploadAlt />,
        description: 'Transferring your SQL file to our servers',
        duration: 1500,
        percentage: 25
    },
    { 
        id: 2, 
        label: 'Analyzing Structure', 
        icon: <FaDatabase />,
        description: 'Parsing tables, columns, and relationships',
        duration: 1500,
        percentage: 50
    },
    { 
        id: 3, 
        label: 'AI Enhancement', 
        icon: <FaRobot />,
        description: 'Applying domain-specific optimizations',
        duration: 2000,
        percentage: 75
    },
    { 
        id: 4, 
        label: 'Generating Results', 
        icon: <FaCode />,
        description: 'Creating your new warehouse schema',
        duration: 0,
        percentage: 100
    },
];

const PreloadOverlay = ({ currentStep: externalStep, onClose }) => {
    // Internal state to track automatic progression of first 3 steps
    const [internalStep, setInternalStep] = useState(1);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const progressControls = useAnimation();
    
    // Combine external and internal steps:
    // - For steps 1-3, use automatic progression
    // - For step 4, only use external step from backend
    const effectiveStep = externalStep >= 4 ? externalStep : internalStep;
    
    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { 
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        },
        exit: { opacity: 0 }
    };
    
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };
    
    // Immediately set percentage based on current step
    useEffect(() => {
        // For steps 1-3, use the step's predefined percentage
        if (effectiveStep < 4) {
            const currentStep = steps[effectiveStep - 1];
            setProgressPercentage(currentStep.percentage);
        } else if (externalStep >= 4) {
            // If the final step is completed, set to 100%
            setProgressPercentage(100);
        } else {
            // If we're at step 4 but waiting for completion, stay at 75%
            setProgressPercentage(75);
        }
    }, [effectiveStep, externalStep]);

    // Effect to automatically progress through the first 3 steps
    useEffect(() => {
        let timer;
        
        // Only auto-progress steps 1-3
        if (internalStep < 4) {
            const currentStepData = steps.find(step => step.id === internalStep);
            const duration = currentStepData?.duration || 1500;
            
            timer = setTimeout(() => {
                setInternalStep(prev => Math.min(prev + 1, 4));
            }, duration);
        }
        
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [internalStep]);

    // Effect to update progress bar width - using spring animation for a nice effect
    // but jumping directly to the target percentage
    useEffect(() => {
        progressControls.start({
            width: `${progressPercentage}%`,
            transition: { 
                type: "spring",
                stiffness: 100,
                damping: 15
            }
        });
    }, [progressPercentage, progressControls]);

    return (
        <motion.div
            className="fixed inset-0 bg-[#111827]/80 flex items-center justify-center z-50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
        >
            <motion.div
                className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                {/* Header with progress bar */}
                <div className="relative">
                    <div className="h-2 bg-gray-100 w-full">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-[#4361ee] to-[#6282fd]" 
                            initial={{ width: 0 }}
                            animate={progressControls}
                        />
                    </div>
                    <div className="p-8 pb-4 flex justify-between items-center">
                        <motion.div variants={itemVariants} className="flex flex-col">
                            <h2 className="text-3xl font-bold text-[#2b2b2b]">
                                Transforming Your Schema
                            </h2>
                            <div className="text-[#4361ee] text-lg font-semibold mt-1">
                                Step {effectiveStep} of {steps.length}
                            </div>
                        </motion.div>
                        <motion.div 
                            className="text-[#4361ee] font-bold text-3xl"
                            variants={itemVariants}
                        >
                            {progressPercentage}%
                        </motion.div>
                    </div>
                </div>

                {/* Steps */}
                <div className="px-8 py-6">
                    <div className="space-y-8">
                        {steps.map((step, index) => {
                            // Determine step status
                            const isActive = step.id === effectiveStep;
                            const isCompleted = step.id < effectiveStep;
                            const isLastStep = step.id === 4;
                            
                            // For step 4, use real backend status
                            const isLastStepCompleted = isLastStep && externalStep >= 4;
                            const isLastStepActive = isLastStep && internalStep === 4 && externalStep < 4;

                            return (
                                <motion.div 
                                    key={step.id}
                                    variants={itemVariants}
                                    className={`flex items-start ${index !== steps.length - 1 ? 'pb-8 border-l-2 border-dashed ml-3.5 pl-10' : ''} ${
                                        isActive || isLastStepActive ? 'border-[#4361ee]' : 
                                        isCompleted || isLastStepCompleted ? 'border-[#4361ee]' : 
                                        'border-gray-200'
                                    }`}
                                >
                                    {/* Step icon/indicator */}
                                    <div className="-ml-4 relative">
                                        <motion.div 
                                            className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                                isActive || isLastStepActive ? 'bg-[#4361ee] text-white ring-4 ring-blue-100' :
                                                isCompleted || isLastStepCompleted ? 'bg-[#4361ee] text-white' :
                                                'bg-gray-200 text-gray-500'
                                            }`}
                                            initial={false}
                                            animate={
                                                (isActive || isLastStepActive) ? 
                                                  { scale: [1, 1.2, 1], transition: { repeat: Infinity, duration: 2 } } : 
                                                  { scale: 1 }
                                            }
                                        >
                                            {isCompleted || isLastStepCompleted ? (
                                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <span className="text-sm font-semibold">{step.id}</span>
                                            )}
                                        </motion.div>
                                    </div>

                                    {/* Step content */}
                                    <div className="ml-6 flex-1">
                                        <div className={`flex items-center justify-between ${
                                            isActive || isLastStepActive ? 'text-[#4361ee]' :
                                            isCompleted || isLastStepCompleted ? 'text-[#2b2b2b]' :
                                            'text-gray-400'
                                        }`}>
                                            <div className="flex items-center">
                                                <div className={`mr-3 text-xl ${
                                                    isActive || isLastStepActive ? 'text-[#4361ee]' :
                                                    isCompleted || isLastStepCompleted ? 'text-[#4361ee]' :
                                                    'text-gray-400'
                                                }`}>
                                                    {step.icon}
                                                </div>
                                                <h3 className="font-semibold text-lg">{step.label}</h3>
                                            </div>
                                            
                                            {/* Processing indicator for the last step when active */}
                                            {isLastStepActive && (
                                                <span className="text-xs font-medium bg-blue-50 text-[#4361ee] px-3 py-1.5 rounded-full">
                                                    Processing...
                                                </span>
                                            )}
                                        </div>
                                        <p className={`mt-1.5 text-sm ${
                                            isActive || isLastStepActive ? 'text-gray-700' :
                                            isCompleted || isLastStepCompleted ? 'text-gray-600' :
                                            'text-gray-400'
                                        }`}>
                                            {step.description}
                                        </p>

                                        {/* Loading animation for active step */}
                                        {(isActive || isLastStepActive) && (
                                            <div className="mt-3">
                                                <motion.div
                                                    className="h-1.5 bg-blue-50 rounded-full overflow-hidden"
                                                    initial={{ width: "100%" }}
                                                >
                                                    <motion.div
                                                        className="h-full"
                                                        style={{
                                                            background: `linear-gradient(90deg, 
                                                                transparent 0%, 
                                                                #4361ee 50%, 
                                                                transparent 100%
                                                            )`,
                                                            backgroundSize: "200% 100%"
                                                        }}
                                                        initial={{ x: "-100%" }}
                                                        animate={{ x: "100%" }}
                                                        transition={{
                                                            repeat: Infinity,
                                                            duration: 1.5,
                                                            ease: "linear"
                                                        }}
                                                    />
                                                </motion.div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <motion.div 
                    className="bg-gray-50 px-8 py-5 flex justify-between items-center"
                    variants={itemVariants}
                >
                    <div className="flex items-center">
                        <motion.div 
                            className="w-2.5 h-2.5 bg-[#4361ee] rounded-full mr-2"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        ></motion.div>
                        <p className="text-gray-600 font-medium">
                            This may take a minute or two depending on schema size
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center px-5 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-red-200"
                    >
                        <FaTimes className="mr-2" size={14} />
                        Cancel
                    </button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default PreloadOverlay;