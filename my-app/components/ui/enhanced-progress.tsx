"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  icon: React.ElementType;
  description?: string;
}

interface EnhancedProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  showDescriptions?: boolean;
}

export function EnhancedProgress({
  steps,
  currentStep,
  className,
  orientation = 'horizontal',
  showDescriptions = false,
}: EnhancedProgressProps) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={cn(
      "relative mb-8",
      isHorizontal ? "w-full" : "h-full",
      className
    )}>
      <div className={cn(
        "flex items-center",
        isHorizontal ? "justify-between" : "flex-col justify-start space-y-8"
      )}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={step.id} className={cn(
              "flex items-center relative z-10",
              isHorizontal ? "flex-col" : "flex-row space-x-4"
            )}>
              {/* Step Circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
                className={cn(
                  "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg",
                  {
                    "bg-gradient-to-r from-green-500 to-emerald-600 text-white": isCompleted,
                    "bg-gradient-to-r from-blue-500 to-indigo-600 text-white ring-4 ring-blue-200": isCurrent,
                    "bg-gray-200 text-gray-400": isUpcoming,
                  }
                )}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <CheckCircle className="w-6 h-6" />
                  </motion.div>
                ) : isCurrent ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <step.icon className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <step.icon className="w-6 h-6" />
                )}

                {/* Pulse animation for current step */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-blue-400"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  />
                )}
              </motion.div>

              {/* Step Info */}
              <div className={cn(
                "text-center",
                isHorizontal ? "mt-3" : "ml-0 text-left"
              )}>
                <motion.h4
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={cn(
                    "font-medium text-sm transition-colors duration-300",
                    {
                      "text-green-600": isCompleted,
                      "text-blue-600": isCurrent,
                      "text-gray-500": isUpcoming,
                    }
                  )}
                >
                  {step.title}
                </motion.h4>
                
                {showDescriptions && step.description && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="text-xs text-gray-400 mt-1 max-w-32"
                  >
                    {step.description}
                  </motion.p>
                )}
              </div>

              {/* Connection Line */}
              {isHorizontal && index < steps.length - 1 && (
                <div className="absolute top-6 left-12 w-full h-0.5 bg-gray-200 -z-10">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    initial={{ width: "0%" }}
                    animate={{ 
                      width: stepNumber < currentStep ? "100%" : "0%" 
                    }}
                    transition={{ 
                      duration: 0.8,
                      delay: 0.2,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Line for Horizontal */}
      {isHorizontal && (
        <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200 -z-20">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
            initial={{ width: "0%" }}
            animate={{ 
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` 
            }}
            transition={{ 
              duration: 1,
              ease: "easeInOut"
            }}
          />
        </div>
      )}
    </div>
  );
}

// Enhanced Progress with Steps Info
export function StepsProgress({ 
  currentStep, 
  totalSteps, 
  stepTitles 
}: {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}) {
  return (
    <div className="mb-8">
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <motion.div 
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {stepTitles[currentStep - 1]}
        </h3>
      </div>
    </div>
  );
}