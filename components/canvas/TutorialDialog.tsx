'use client';

import React, { useState, useEffect } from 'react';
import { Tutorial, TutorialStep } from '@/lib/tutorials';
import { X, ChevronRight, ChevronLeft, SkipForward, CheckCircle } from 'lucide-react';

interface TutorialDialogProps {
    tutorial: Tutorial | null;
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

export default function TutorialDialog({ tutorial, isOpen, onClose, onComplete }: TutorialDialogProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (tutorial && isOpen) {
            // Reset tutorial state when opening
            setCurrentStepIndex(() => 0);
            setCompletedSteps(() => new Set());
        }
    }, [tutorial, isOpen]);

    if (!isOpen || !tutorial) return null;

    const currentStep: TutorialStep = tutorial.steps[currentStepIndex];
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === tutorial.steps.length - 1;
    const totalSteps = tutorial.steps.length;

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStepIndex(prev => {
                const next = prev + 1;
                setCompletedSteps(prevSet => new Set([...prevSet, prev]));
                return next;
            });
        }
    };

    const handlePrevious = () => {
        if (!isFirstStep) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        if (currentStep.canSkip) {
            handleNext();
        }
    };

    const handleClose = () => {
        if (isLastStep) {
            onComplete();
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{tutorial.name}</h2>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Step {currentStepIndex + 1} of {totalSteps}  {tutorial.estimatedTime}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-gray-200 dark:bg-gray-700">
                    <div
                        className="h-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {currentStep.title}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {currentStep.message}
                        </p>
                    </div>

                    {currentStep.action && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-4">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                                Action Required:
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                {currentStep.action.description}
                            </p>
                        </div>
                    )}

                    {currentStep.highlight && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
                            <p className="text-xs text-yellow-800 dark:text-yellow-300">
                                {currentStep.highlight.area === 'toolbox' && 'Look at the Toolbox on the left'}
                                {currentStep.highlight.area === 'canvas' && 'Look at the Canvas in the center'}
                                {currentStep.highlight.area === 'properties' && 'Look at the Properties Panel on the right'}
                            </p>
                        </div>
                    )}

                    {/* Step Indicators */}
                    <div className="flex space-x-2 mt-6">
                        {tutorial.steps.map((step, idx) => (
                            <div
                                key={step.id}
                                className={`flex-1 h-1 rounded ${
                                    idx < currentStepIndex
                                        ? 'bg-green-500'
                                        : idx === currentStepIndex
                                        ? 'bg-indigo-600'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center space-x-2">
                        {currentStep.canSkip && !isLastStep && (
                            <button
                                onClick={handleSkip}
                                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                            >
                                <SkipForward className="w-4 h-4" />
                                <span>Skip</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handlePrevious}
                            disabled={isFirstStep}
                            className={`flex items-center space-x-1 px-4 py-2 rounded-md text-sm transition-colors ${
                                isFirstStep
                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Previous</span>
                        </button>

                        <button
                            onClick={handleNext}
                            className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition-colors"
                        >
                            <span>{isLastStep ? 'Finish' : 'Next'}</span>
                            {isLastStep ? (
                                <CheckCircle className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

