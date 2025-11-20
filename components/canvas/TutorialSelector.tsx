'use client';

import React, { useState, useMemo } from 'react';
import { TUTORIALS, Tutorial } from '@/lib/tutorials';
import { ADF_TUTORIALS } from '@/lib/adfTutorials';
import { useCanvasStore } from '@/store/canvasStore';
import TutorialDialog from './TutorialDialog';
import { Book, Play, X, Clock } from 'lucide-react';

export default function TutorialSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
    const [isTutorialRunning, setIsTutorialRunning] = useState(false);
    const { platform } = useCanvasStore();

    const currentTutorials = useMemo(() => {
        return platform === 'adf' ? ADF_TUTORIALS : TUTORIALS;
    }, [platform]);

    const handleStartTutorial = (tutorial: Tutorial) => {
        setSelectedTutorial(tutorial);
        setIsTutorialRunning(true);
        setIsOpen(false);
    };

    const handleTutorialComplete = () => {
        setIsTutorialRunning(false);
        setSelectedTutorial(null);
    };

    const handleTutorialClose = () => {
        setIsTutorialRunning(false);
        setSelectedTutorial(null);
    };

    if (!isOpen && !isTutorialRunning) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors text-white"
                title="Start Tutorial"
            >
                <Book className="w-4 h-4" />
                <span>{platform === 'adf' ? 'ADF Tutorials' : 'SSIS Tutorials'}</span>
            </button>
        );
    }

    if (isTutorialRunning && selectedTutorial) {
        return (
            <TutorialDialog
                tutorial={selectedTutorial}
                isOpen={isTutorialRunning}
                onClose={handleTutorialClose}
                onComplete={handleTutorialComplete}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Interactive {platform === 'adf' ? 'ADF' : 'SSIS'} Tutorials
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Learn {platform === 'adf' ? 'Azure Data Factory' : 'SSIS'} step-by-step with interactive tutorials. Each tutorial guides you through building real pipelines.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentTutorials.map((tutorial) => (
                            <div
                                key={tutorial.id}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                                            {tutorial.name}
                                        </h3>
                                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {tutorial.estimatedTime}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {tutorial.description}
                                </p>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                    {tutorial.steps.length} steps
                                </div>
                                <button
                                    onClick={() => handleStartTutorial(tutorial)}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors"
                                >
                                    <Play className="w-4 h-4" />
                                    <span>Start Tutorial</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Tutorials are interactive guides that help you learn by doing. Follow the steps to build real pipelines.
                    </p>
                </div>
            </div>
        </div>
    );
}

