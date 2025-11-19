'use client';

import React, { useState, useMemo } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { generatePipelineDataPreview } from '@/lib/dataGenerator';
import { X, Eye, ChevronRight } from 'lucide-react';

interface DataPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DataPreviewModal({ isOpen, onClose }: DataPreviewModalProps) {
    const { components, connections } = useCanvasStore();
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

    const dataPreviews = useMemo(() => {
        if (components.length === 0) return [];
        return generatePipelineDataPreview(components, connections);
    }, [components, connections]);

    const selectedPreview = useMemo(() => {
        if (!selectedComponentId) return null;
        return dataPreviews.find(p => p.componentId === selectedComponentId) || null;
    }, [selectedComponentId, dataPreviews]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                        <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Data Flow Preview</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left sidebar - Component list */}
                    <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                        <div className="p-4">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Components ({dataPreviews.length})
                            </h3>
                            <div className="space-y-1">
                                {dataPreviews.map((preview) => {
                                    const isSelected = selectedComponentId === preview.componentId;
                                    return (
                                        <button
                                            key={preview.componentId}
                                            onClick={() => setSelectedComponentId(preview.componentId)}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${isSelected
                                                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100'
                                                : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium truncate">{preview.componentName}</span>
                                                <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {preview.rowCount} rows
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right panel - Data preview */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {selectedPreview ? (
                            <div>
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                        {selectedPreview.componentName}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Showing {selectedPreview.rows.length} sample rows
                                    </p>
                                </div>

                                {selectedPreview.rows.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                                            <thead>
                                                <tr className="bg-gray-100 dark:bg-gray-700">
                                                    {Object.keys(selectedPreview.rows[0]).map((key) => (
                                                        <th
                                                            key={key}
                                                            className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase"
                                                        >
                                                            {key}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedPreview.rows.map((row, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                                    >
                                                        {Object.keys(selectedPreview.rows[0]).map((key) => (
                                                            <td
                                                                key={key}
                                                                className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-900 dark:text-gray-100"
                                                            >
                                                                {String(row[key] ?? 'NULL')}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                        <p>No data available for this component</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                <div className="text-center">
                                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Select a component from the list to view its data preview</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Data preview shows sample rows generated based on component types. This is a simulation for learning purposes.
                    </p>
                </div>
            </div>
        </div>
    );
}

