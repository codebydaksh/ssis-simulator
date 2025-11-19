'use client';

import React, { useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { simulatePerformance, formatDuration, formatBytes, SimulationResult } from '@/lib/performanceSimulator';
import { X, Play, Activity, Clock, Database, AlertTriangle, Cpu } from 'lucide-react';

interface PerformanceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PerformanceModal({ isOpen, onClose }: PerformanceModalProps) {
    const { components, connections } = useCanvasStore();
    const [rowCount, setRowCount] = useState<number>(100000);
    const [isSimulating, setIsSimulating] = useState(false);
    const [result, setResult] = useState<SimulationResult | null>(null);

    if (!isOpen) return null;

    const handleSimulate = () => {
        setIsSimulating(true);
        // Simulate network delay for realistic feel
        setTimeout(() => {
            const res = simulatePerformance(components, connections, rowCount);
            setResult(res);
            setIsSimulating(false);
        }, 800);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        <h2 className="text-xl font-bold">Performance Simulator</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-gray-800 p-1 rounded transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Input Section */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Estimated Data Volume (Rows)
                        </label>
                        <div className="flex items-center space-x-4">
                            <input
                                type="range"
                                min="1000"
                                max="10000000"
                                step="1000"
                                value={rowCount}
                                onChange={(e) => setRowCount(Number(e.target.value))}
                                className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="relative">
                                <input
                                    type="number"
                                    value={rowCount}
                                    onChange={(e) => setRowCount(Number(e.target.value))}
                                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <span className="absolute right-8 top-2 text-gray-400 text-xs">rows</span>
                            </div>
                            <button
                                onClick={handleSimulate}
                                disabled={isSimulating}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSimulating ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                                <span>{isSimulating ? 'Simulating...' : 'Run Simulation'}</span>
                            </button>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                            <span>1K</span>
                            <span>1M</span>
                            <span>5M</span>
                            <span>10M+</span>
                        </div>
                    </div>

                    {/* Results Section */}
                    {result && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Key Metrics Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                                    <div className="flex items-center space-x-2 text-blue-800 mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm font-semibold">Est. Duration</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-900">{formatDuration(result.totalDuration)}</p>
                                    <p className="text-xs text-blue-600 mt-1">~{formatNumber(result.throughput)} rows/sec</p>
                                </div>

                                <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg">
                                    <div className="flex items-center space-x-2 text-purple-800 mb-1">
                                        <Database className="w-4 h-4" />
                                        <span className="text-sm font-semibold">Memory Usage</span>
                                    </div>
                                    <p className="text-2xl font-bold text-purple-900">{formatBytes(result.memoryUsage)}</p>
                                    <p className="text-xs text-purple-600 mt-1">Peak allocation</p>
                                </div>

                                <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg">
                                    <div className="flex items-center space-x-2 text-orange-800 mb-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span className="text-sm font-semibold">Primary Bottleneck</span>
                                    </div>
                                    <p className="text-lg font-bold text-orange-900 truncate" title={result.componentMetrics.find(m => m.isBottleneck)?.componentName || 'None'}>
                                        {result.componentMetrics.find(m => m.isBottleneck)?.componentName || 'None'}
                                    </p>
                                    <p className="text-xs text-orange-600 mt-1">Slowest component</p>
                                </div>
                            </div>

                            {/* Component Breakdown Chart */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                                    <Cpu className="w-4 h-4 mr-2 text-gray-500" />
                                    Component Performance Breakdown
                                </h3>
                                <div className="space-y-3">
                                    {result.componentMetrics.map((metric) => (
                                        <div key={metric.componentId} className="relative">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className={`font-medium ${metric.isBottleneck ? 'text-red-600 flex items-center' : 'text-gray-700'}`}>
                                                    {metric.componentName}
                                                    {metric.isBottleneck && <AlertTriangle className="w-3 h-3 ml-1" />}
                                                </span>
                                                <span className="text-gray-500">{formatDuration(metric.duration)}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className={`h-2.5 rounded-full ${metric.isBottleneck ? 'bg-red-500' :
                                                            metric.memoryImpact === 'High' ? 'bg-yellow-500' : 'bg-green-500'
                                                        }`}
                                                    style={{ width: `${Math.min(100, (metric.duration / result.totalDuration) * 100)}%` }}
                                                />
                                            </div>
                                            {metric.memoryImpact === 'High' && (
                                                <p className="text-[10px] text-yellow-600 mt-0.5">High Memory Impact</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommendations */}
                            {result.memoryUsage > 1000 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-yellow-800 text-sm">High Memory Warning</h4>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            This pipeline uses significant memory ({formatBytes(result.memoryUsage)}).
                                            Consider removing blocking transformations like Sort or Aggregate, or filtering data earlier in the source query.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
