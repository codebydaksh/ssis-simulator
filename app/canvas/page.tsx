'use client';

import React, { useEffect, useRef } from 'react';
import Canvas from '@/components/canvas/Canvas';
import Toolbox from '@/components/canvas/Toolbox';
import PropertiesPanel from '@/components/canvas/PropertiesPanel';
import ErrorPanel from '@/components/canvas/ErrorPanel';
import TemplateSelector from '@/components/canvas/TemplateSelector';
import SuggestionsPanel from '@/components/canvas/SuggestionsPanel';
import PerformanceModal from '@/components/canvas/PerformanceModal';
import DataPreviewModal from '@/components/canvas/DataPreviewModal';
import ComponentComparisonModal from '@/components/canvas/ComponentComparisonModal';
import TutorialSelector from '@/components/canvas/TutorialSelector';
import { useCanvasStore } from '@/store/canvasStore';
import { Download, Upload, Trash2, Save, Undo, Redo, Activity, Moon, Sun, Share2, Eye, GitCompare, Workflow, Database, ArrowLeft, Cloud } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { encodePipelineToURL, copyToClipboard } from '@/lib/shareableLinks';

export default function CanvasPage() {
    const {
        platform,
        setPlatform,
        loadFromStorage,
        loadFromURL,
        saveToStorage,
        exportToFile,
        importFromFile,
        clearCanvas,
        undo,
        redo,
        canUndo,
        canRedo,
        selectedComponent,
        removeComponent,
        copyComponent,
        pasteComponent,
        canPaste,
        components: allComponents,
        connections,
        viewMode,
        setViewMode,
        currentDataFlowTaskId,
        navigateToControlFlow
    } = useCanvasStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPerformanceModalOpen, setIsPerformanceModalOpen] = React.useState(false);
    const [isDataPreviewModalOpen, setIsDataPreviewModalOpen] = React.useState(false);
    const [isComponentComparisonModalOpen, setIsComponentComparisonModalOpen] = React.useState(false);
    const { theme, toggleTheme } = useTheme();

    // Load from URL first (if present), then from localStorage
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const hasPipelineParam = urlParams.has('pipeline');

        if (hasPipelineParam) {
            loadFromURL();
        } else {
            loadFromStorage();
        }
    }, [loadFromStorage, loadFromURL]);

    // Auto-save every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            saveToStorage();
        }, 30000);

        return () => clearInterval(interval);
    }, [saveToStorage]);

    // Save on window unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            saveToStorage();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [saveToStorage]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Z - Undo
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo()) {
                    undo();
                }
            }

            // Ctrl+Y or Ctrl+Shift+Z - Redo
            if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                if (canRedo()) {
                    redo();
                }
            }

            // Ctrl+S - Save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveToStorage();
                // Show brief save confirmation
                const notification = document.createElement('div');
                notification.textContent = 'Pipeline saved!';
                notification.className = 'fixed top-16 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50';
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 2000);
            }

            // Ctrl+C - Copy selected component
            if (e.ctrlKey && e.key === 'c' && selectedComponent) {
                e.preventDefault();
                copyComponent(selectedComponent);
            }

            // Ctrl+V - Paste component
            if (e.ctrlKey && e.key === 'v' && canPaste()) {
                e.preventDefault();
                pasteComponent();
            }

            // Delete - Remove selected component
            if (e.key === 'Delete' && selectedComponent) {
                e.preventDefault();
                removeComponent(selectedComponent);
            }

            // Escape - Deselect
            if (e.key === 'Escape') {
                // This will be handled by selectComponent(null) in Canvas
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, canUndo, canRedo, saveToStorage, selectedComponent, removeComponent, copyComponent, pasteComponent, canPaste]);

    const handleImport = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            await importFromFile(file);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleClear = () => {
        if (confirm('Are you sure you want to clear the canvas? This will delete all components and connections.')) {
            clearCanvas();
        }
    };

    const handleShare = async () => {
        try {
            const shareUrl = encodePipelineToURL(allComponents, connections);
            await copyToClipboard(shareUrl);

            const notification = document.createElement('div');
            notification.textContent = 'Shareable link copied to clipboard!';
            notification.className = 'fixed top-16 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        } catch (error) {
            console.error('Failed to copy shareable link:', error);
            const notification = document.createElement('div');
            notification.textContent = 'Failed to copy link. Please try again.';
            notification.className = 'fixed top-16 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            <header className="min-h-12 bg-gray-900 dark:bg-gray-800 text-white flex flex-wrap items-center justify-between px-3 py-2 gap-2 shadow-md z-10">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg">SSIS Simulator</span>
                        <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">Beta</span>
                    </div>

                    {/* Platform Switcher */}
                    <div className="flex items-center space-x-1 bg-gray-700 rounded p-1">
                        <button
                            onClick={() => setPlatform('ssis')}
                            className={`flex items-center space-x-1 px-3 py-1 rounded text-xs transition-colors ${platform === 'ssis'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:text-white'
                                }`}
                            title="Switch to SSIS Mode"
                        >
                            <Database className="w-3 h-3" />
                            <span>SSIS</span>
                        </button>
                        <button
                            onClick={() => setPlatform('adf')}
                            className={`flex items-center space-x-1 px-3 py-1 rounded text-xs transition-colors ${platform === 'adf'
                                ? 'bg-teal-600 text-white'
                                : 'text-gray-300 hover:text-white'
                                }`}
                            title="Switch to Azure Data Factory Mode"
                        >
                            <Cloud className="w-3 h-3" />
                            <span>ADF</span>
                        </button>
                    </div>

                    {/* Breadcrumb */}
                    {currentDataFlowTaskId && (
                        <div className="flex items-center space-x-2 text-sm">
                            <button
                                onClick={navigateToControlFlow}
                                className="flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                <span>Control Flow</span>
                            </button>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-300">
                                {allComponents.find(c => c.id === currentDataFlowTaskId)?.name || 'Data Flow'}
                            </span>
                        </div>
                    )}

                    {/* View Mode Toggle */}
                    {!currentDataFlowTaskId && (
                        <div className="flex items-center space-x-1 bg-gray-700 rounded p-1">
                            <button
                                onClick={() => setViewMode('control-flow')}
                                className={`flex items-center space-x-1 px-3 py-1 rounded text-xs transition-colors ${viewMode === 'control-flow'
                                    ? 'bg-orange-600 text-white'
                                    : 'text-gray-300 hover:text-white'
                                    }`}
                                title="Control Flow View"
                            >
                                <Workflow className="w-3 h-3" />
                                <span>Control Flow</span>
                            </button>
                            <button
                                onClick={() => setViewMode('data-flow')}
                                className={`flex items-center space-x-1 px-3 py-1 rounded text-xs transition-colors ${viewMode === 'data-flow'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:text-white'
                                    }`}
                                title="Data Flow View"
                            >
                                <Database className="w-3 h-3" />
                                <span>Data Flow</span>
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-3">
                    {/* Undo/Redo buttons */}
                    <div className="flex items-center space-x-1 border-r border-gray-700 pr-3">
                        <button
                            onClick={undo}
                            disabled={!canUndo()}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm transition-colors ${canUndo()
                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo className="w-4 h-4" />
                            <span>Undo</span>
                        </button>
                        <button
                            onClick={redo}
                            disabled={!canRedo()}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm transition-colors ${canRedo()
                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo className="w-4 h-4" />
                            <span>Redo</span>
                        </button>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-4 h-4" />
                        ) : (
                            <Moon className="w-4 h-4" />
                        )}
                    </button>

                    <button
                        onClick={() => setIsPerformanceModalOpen(true)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded text-sm transition-all shadow-sm"
                        title="Simulate Performance"
                    >
                        <Activity className="w-4 h-4" />
                        <span>Simulate</span>
                    </button>

                    <button
                        onClick={() => setIsDataPreviewModalOpen(true)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 rounded text-sm transition-colors"
                        title="Preview Data Flow"
                    >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                    </button>

                    <button
                        onClick={() => setIsComponentComparisonModalOpen(true)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
                        title="Compare Components"
                    >
                        <GitCompare className="w-4 h-4" />
                        <span>Compare</span>
                    </button>

                    <TutorialSelector />
                    <TemplateSelector />
                    <button
                        onClick={handleShare}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-sm transition-colors"
                        title="Copy shareable link"
                    >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                    </button>
                    <button
                        onClick={saveToStorage}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                        title="Save Now (Ctrl+S) - Auto-saves every 30s"
                    >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                    </button>
                    <button
                        onClick={exportToFile}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                        title="Export to JSON file"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                    <button
                        onClick={handleImport}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
                        title="Import from JSON file"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Import</span>
                    </button>
                    <button
                        onClick={handleClear}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                        title="Clear canvas"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                <Toolbox />

                <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
                    <Canvas />
                    <ErrorPanel />
                    <SuggestionsPanel />
                    <PerformanceModal
                        isOpen={isPerformanceModalOpen}
                        onClose={() => setIsPerformanceModalOpen(false)}
                    />
                    <DataPreviewModal
                        isOpen={isDataPreviewModalOpen}
                        onClose={() => setIsDataPreviewModalOpen(false)}
                    />
                    <ComponentComparisonModal
                        isOpen={isComponentComparisonModalOpen}
                        onClose={() => setIsComponentComparisonModalOpen(false)}
                    />
                </div>

                <PropertiesPanel />
            </div>
        </div>
    );
}
