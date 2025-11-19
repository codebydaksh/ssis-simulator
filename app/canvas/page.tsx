'use client';

import React, { useEffect, useRef } from 'react';
import Canvas from '@/components/canvas/Canvas';
import Toolbox from '@/components/canvas/Toolbox';
import PropertiesPanel from '@/components/canvas/PropertiesPanel';
import ErrorPanel from '@/components/canvas/ErrorPanel';
import TemplateSelector from '@/components/canvas/TemplateSelector';
import SuggestionsPanel from '@/components/canvas/SuggestionsPanel';
import PerformanceModal from '@/components/canvas/PerformanceModal';
import { useCanvasStore } from '@/store/canvasStore';
import { Download, Upload, Trash2, Save, Undo, Redo, Activity } from 'lucide-react';

export default function CanvasPage() {
    const {
        loadFromStorage,
        saveToStorage,
        exportToFile,
        importFromFile,
        clearCanvas,
        undo,
        redo,
        canUndo,
        canRedo,
        selectedComponent,
        removeComponent
    } = useCanvasStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPerformanceModalOpen, setIsPerformanceModalOpen] = React.useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        loadFromStorage();
    }, [loadFromStorage]);

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
    }, [undo, redo, canUndo, canRedo, saveToStorage, selectedComponent, removeComponent]);

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

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            <header className="h-12 bg-gray-900 text-white flex items-center justify-between px-4 shadow-md z-10">
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg">SSIS Data Flow Simulator</span>
                    <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">Beta</span>
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
                        onClick={() => setIsPerformanceModalOpen(true)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded text-sm transition-all shadow-sm"
                        title="Simulate Performance"
                    >
                        <Activity className="w-4 h-4" />
                        <span>Simulate</span>
                    </button>

                    <TemplateSelector />
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

                <div className="flex-1 relative bg-gray-50">
                    <Canvas />
                    <ErrorPanel />
                    <SuggestionsPanel />
                    <PerformanceModal
                        isOpen={isPerformanceModalOpen}
                        onClose={() => setIsPerformanceModalOpen(false)}
                    />
                </div>

                <PropertiesPanel />
            </div>
        </div>
    );
}
