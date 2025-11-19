'use client';

import React, { useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { AlertCircle, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ErrorPanel() {
    const { errors, selectComponent } = useCanvasStore();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warningCount = errors.filter(e => e.severity === 'warning').length;

    const handleErrorClick = (componentIds: string[]) => {
        if (componentIds.length > 0) {
            selectComponent(componentIds[0]);
        }
    };

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg transition-all duration-300 z-50",
                isCollapsed ? "h-10" : "h-48"
            )}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 h-10 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center space-x-4">
                    <h3 className="font-bold text-sm text-gray-700">Validation Results</h3>
                    <div className="flex space-x-3 text-xs">
                        <span className={cn("flex items-center", errorCount > 0 ? "text-red-600 font-bold" : "text-gray-500")}>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {errorCount} Errors
                        </span>
                        <span className={cn("flex items-center", warningCount > 0 ? "text-orange-600 font-bold" : "text-gray-500")}>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {warningCount} Warnings
                        </span>
                    </div>
                </div>
                {isCollapsed ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </div>

            {/* Content */}
            {!isCollapsed && (
                <div className="h-38 overflow-y-auto p-0">
                    {errors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                            <CheckCircle2 className="w-8 h-8 mb-2 text-green-500 opacity-50" />
                            <p>No validation errors found. Good job!</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 font-medium w-20">Severity</th>
                                    <th className="px-4 py-2 font-medium">Message</th>
                                    <th className="px-4 py-2 font-medium w-1/3">Suggestion</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {errors.map((error, idx) => (
                                    <tr
                                        key={idx}
                                        className="hover:bg-blue-50 cursor-pointer group"
                                        onClick={() => handleErrorClick(error.affectedComponents)}
                                    >
                                        <td className="px-4 py-2">
                                            {error.severity === 'error' && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                    Error
                                                </span>
                                            )}
                                            {error.severity === 'warning' && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                                    Warning
                                                </span>
                                            )}
                                            {error.severity === 'info' && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    Info
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-gray-800 group-hover:text-blue-700">
                                            {error.message}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 italic">
                                            {error.suggestion}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
