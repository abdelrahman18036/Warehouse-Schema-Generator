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
        hidden: { y: 15, opacity: 0 },
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
            className="fixed inset-0 bg-[#111827]/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
        >
            <motion.div
                className="bg-white  shadow-xl w-full max-w-xl overflow-hidden"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                {/* Header with progress bar */}
                <div className="relative">
                    <div className="h-1.5 w-full bg-gray-50   ">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-[#4361ee] to-[#6282fd]" 
                            initial={{ width: 0 }}
                            animate={progressControls}
                        />
                    </div>
                    <div className="p-6 pb-3 flex justify-between items-center">
                        <motion.div variants={itemVariants} className="flex flex-col">
                            <h2 className="text-xl font-bold text-[#2b2b2b]">
                                Transforming Your Schema
                            </h2>
                            <div className="text-[#4361ee] text-sm font-medium mt-1">
                                Step {effectiveStep} of {steps.length}
                            </div>
                        </motion.div>
                        <motion.div 
                            className="text-[#4361ee] font-bold text-2xl"
                            variants={itemVariants}
                        >
                            {progressPercentage}%
                        </motion.div>
                    </div>
                </div>

                {/* Steps */}
                <div className="px-6 py-4">
                    <div className="space-y-6">
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
                                    className={`flex items-start ${index !== steps.length - 1 ? 'pb-6 border-l border-dashed ml-2.5 pl-8' : ''} ${
                                        isActive || isLastStepActive ? 'border-[#4361ee]' : 
                                        isCompleted || isLastStepCompleted ? 'border-[#4361ee]' : 
                                        'border-gray-200'
                                    }`}
                                >
                                    {/* Step icon/indicator */}
                                    <div className="-ml-3 relative">
                                        <motion.div 
                                            className={`flex items-center justify-center w-6 h-6 rounded-full ${
                                                isActive || isLastStepActive ? 'bg-[#4361ee] text-white ring-2 ring-blue-100' :
                                                isCompleted || isLastStepCompleted ? 'bg-[#4361ee] text-white' :
                                                'bg-gray-200 text-gray-500'
                                            }`}
                                            initial={false}
                                            animate={
                                                (isActive || isLastStepActive) ? 
                                                  { scale: [1, 1.15, 1], transition: { repeat: Infinity, duration: 2 } } : 
                                                  { scale: 1 }
                                            }
                                        >
                                            {isCompleted || isLastStepCompleted ? (
                                                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <span className="text-xs font-medium">{step.id}</span>
                                            )}
                                        </motion.div>
                                    </div>

                                    {/* Step content */}
                                    <div className="ml-5 flex-1">
                                        <div className={`flex items-center justify-between ${
                                            isActive || isLastStepActive ? 'text-[#4361ee]' :
                                            isCompleted || isLastStepCompleted ? 'text-[#2b2b2b]' :
                                            'text-gray-400'
                                        }`}>
                                            <div className="flex items-center">
                                                <div className={`mr-2 text-sm ${
                                                    isActive || isLastStepActive ? 'text-[#4361ee]' :
                                                    isCompleted || isLastStepCompleted ? 'text-[#4361ee]' :
                                                    'text-gray-400'
                                                }`}>
                                                    {step.icon}
                                                </div>
                                                <h3 className="font-medium text-sm">{step.label}</h3>
                                            </div>
                                            
                                            {/* Processing indicator for the last step when active */}
                                            {isLastStepActive && (
                                                <span className="text-[10px] font-medium bg-blue-50 text-[#4361ee] px-2 py-1 rounded-full">
                                                    Processing...
                                                </span>
                                            )}
                                        </div>
                                        <p className={`mt-1 text-xs ${
                                            isActive || isLastStepActive ? 'text-gray-700' :
                                            isCompleted || isLastStepCompleted ? 'text-gray-600' :
                                            'text-gray-400'
                                        }`}>
                                            {step.description}
                                        </p>

                                        {/* Loading animation for active step */}
                                        {(isActive || isLastStepActive) && (
                                            <div className="mt-2">
                                                <motion.div
                                                    className="h-1 bg-blue-50 rounded-full overflow-hidden"
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
                    className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t border-gray-100"
                    variants={itemVariants}
                >
                    <div className="flex items-center">
                        <motion.div 
                            className="w-2 h-2 bg-[#4361ee] rounded-full mr-2"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        ></motion.div>
                        <p className="text-gray-600 text-xs font-medium">
                            Processing may take a minute depending on schema size
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-red-600 hover:bg-red-50 transition-colors border border-red-200"
                    >
                        <FaTimes className="mr-1.5" size={10} />
                        Cancel
                    </button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default PreloadOverlay;