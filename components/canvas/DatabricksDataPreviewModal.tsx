'use client';

import React, { useState, useMemo } from 'react';
import { SSISComponent, Connection } from '@/lib/types';
import { simulateDatabricksExecution } from '@/lib/databricksExecutor';
import { X, Play, Database, Eye } from 'lucide-react';

interface DatabricksDataPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    components: SSISComponent[];
    connections: Connection[];
}

export default function DatabricksDataPreviewModal({
    isOpen,
    onClose,
    components,
    connections
}: DatabricksDataPreviewModalProps) {
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);

    const executionResult = useMemo(() => {
        if (!isOpen || components.length === 0) return null;
        return simulateDatabricksExecution(components, connections);
    }, [components, connections, isOpen]);

    const selectedResult = useMemo(() => {
        if (!selectedComponentId || !executionResult) return null;
        return executionResult.results.find(r => r.componentId === selectedComponentId) || null;
    }, [selectedComponentId, executionResult]);

    const handleExecute = () => {
        setIsExecuting(true);
        setTimeout(() => setIsExecuting(false), 1000);
    };

    if (!isOpen) return null;

    const databricksComponents = components.filter(c =>
        ['notebook', 'dataSource', 'transformation', 'output', 'orchestration', 'cluster'].includes(c.type)
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                        <Database className="w-5 h-5 text-orange-600" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Databricks Pipeline Execution</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
                        <div className="mb-4">
                            <button
                                onClick={handleExecute}
                                disabled={isExecuting}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded transition-colors"
                            >
                                <Play className="w-4 h-4" />
                                <span>{isExecuting ? 'Executing...' : 'Run Simulation'}</span>
                            </button>
                        </div>

                        {executionResult && (
                            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Summary</div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 dark:text-gray-300">Total Time:</span>
                                        <span className="font-semibold">{(executionResult.totalExecutionTime / 1000).toFixed(2)}s</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 dark:text-gray-300">Total Cost:</span>
                                        <span className="font-semibold">${executionResult.totalDbuCost.toFixed(3)} DBU</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 dark:text-gray-300">Components:</span>
                                        <span className="font-semibold">{executionResult.results.length}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Components</div>
                        <div className="space-y-1">
                            {databricksComponents.map(comp => {
                                const result = executionResult?.results.find(r => r.componentId === comp.id);
                                return (
                                    <button
                                        key={comp.id}
                                        onClick={() => setSelectedComponentId(comp.id)}
                                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                                            selectedComponentId === comp.id
                                                ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-900 dark:text-orange-200'
                                                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        <div className="font-medium">{comp.name}</div>
                                        {result && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {result.rowCount.toLocaleString()} rows
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {selectedResult ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                        {selectedResult.componentName}
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rows</div>
                                            <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                                                {selectedResult.rowCount.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Execution Time</div>
                                            <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                                                {(selectedResult.executionTime / 1000).toFixed(2)}s
                                            </div>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">DBU Cost</div>
                                            <div className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                                                ${selectedResult.dbuCost.toFixed(3)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Schema</h4>
                                    <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Column</th>
                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Type</th>
                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Nullable</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {selectedResult.schema.map((col, idx) => (
                                                    <tr key={idx} className="bg-white dark:bg-gray-800">
                                                        <td className="px-3 py-2 text-gray-900 dark:text-white font-mono text-xs">
                                                            {col.name}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 text-xs">
                                                            {col.dataType}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 text-xs">
                                                            {col.nullable ? 'Yes' : 'No'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sample Data</h4>
                                    <div className="border border-gray-200 dark:border-gray-700 rounded overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    {selectedResult.schema.map((col, idx) => (
                                                        <th
                                                            key={idx}
                                                            className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300"
                                                        >
                                                            {col.name}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {selectedResult.sampleData.slice(0, 10).map((row, rowIdx) => (
                                                    <tr key={rowIdx} className="bg-white dark:bg-gray-800">
                                                        {selectedResult.schema.map((col, colIdx) => (
                                                            <td
                                                                key={colIdx}
                                                                className="px-3 py-2 text-gray-900 dark:text-white text-xs font-mono"
                                                            >
                                                                {String(row[col.name] ?? 'NULL')}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {selectedResult.executionPlan && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Execution Plan</h4>
                                        <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs font-mono overflow-x-auto">
                                            {selectedResult.executionPlan}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                                <Eye className="w-12 h-12 mb-4 opacity-20" />
                                <p>Select a component to view execution results</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

