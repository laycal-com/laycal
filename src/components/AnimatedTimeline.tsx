'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TimelineStep {
  icon: string;
  title: string;
  description: string;
}

interface AnimatedTimelineProps {
  steps: TimelineStep[];
}

export default function AnimatedTimeline({ steps }: AnimatedTimelineProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000); // Change step every 3 seconds

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="relative w-full max-w-md mx-auto py-8">
      {/* Timeline steps */}
      <div className="relative">
        {/* Progress line - positioned relative to the container */}
        <div className="absolute left-8 top-8 w-0.5 h-80 bg-gray-200 overflow-hidden">
          <motion.div
            className="bg-purple-600 w-full h-full origin-top"
            initial={{ scaleY: 0 }}
            animate={{ 
              scaleY: (activeStep + 1) / steps.length,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex items-start space-x-4 relative"
              initial={{ opacity: 0.3, scale: 0.95 }}
              animate={{
                opacity: index <= activeStep ? 1 : 0.3,
                scale: index === activeStep ? 1.02 : index <= activeStep ? 1 : 0.95,
              }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Step circle */}
              <motion.div
                className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 z-10 relative ${
                  index <= activeStep 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-400'
                }`}
                animate={{
                  backgroundColor: index <= activeStep ? '#9333ea' : '#e5e7eb',
                  color: index <= activeStep ? '#ffffff' : '#9ca3af',
                }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-2xl">{step.icon}</span>
              </motion.div>

              {/* Step content */}
              <div className="flex-1 pt-2">
                <motion.h3
                  className={`font-semibold mb-2 ${
                    index <= activeStep ? 'text-gray-900' : 'text-gray-500'
                  }`}
                  animate={{
                    color: index <= activeStep ? '#111827' : '#6b7280',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {step.title}
                </motion.h3>
                <motion.p
                  className={`text-sm ${
                    index <= activeStep ? 'text-gray-600' : 'text-gray-400'
                  }`}
                  animate={{
                    color: index <= activeStep ? '#4b5563' : '#9ca3af',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {step.description}
                </motion.p>
              </div>

              {/* Active step indicator */}
              {index === activeStep && (
                <motion.div
                  className="absolute -left-2 top-6 w-20 h-20 border-2 border-purple-300 rounded-full pointer-events-none"
                  initial={{ scale: 0.8, opacity: 0.3 }}
                  animate={{ scale: 1.1, opacity: 0.6 }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center space-x-2 mt-8">
          {steps.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index <= activeStep ? 'bg-purple-600' : 'bg-gray-300'
              }`}
              onClick={() => setActiveStep(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}