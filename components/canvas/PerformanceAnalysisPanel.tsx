'use client';

import React, { useMemo } from 'react';
import { SSISComponent, Connection } from '@/lib/types';
import { analyzeDatabricksPerformance, PerformanceAnalysis } from '@/lib/databricksPerformanceAnalyzer';
import { Activity, AlertTriangle, Info, CheckCircle, TrendingUp } from 'lucide-react';

interface PerformanceAnalysisPanelProps {
    components: SSISComponent[];
    connections: Connection[];
}

export default function PerformanceAnalysisPanel({ components, connections }: PerformanceAnalysisPanelProps) {
    const analysis = useMemo<PerformanceAnalysis>(() => {
        return analyzeDatabricksPerformance(components, connections);
    }, [components, connections]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 dark:bg-green-900/20';
        if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
        return 'bg-red-100 dark:bg-red-900/20';
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical':
                return <AlertTriangle className="w-4 h-4 text-red-600" />;
            case 'warning':
                return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
            default:
                return <Info className="w-4 h-4 text-blue-600" />;
        }
    };

    const getSeverityBg = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            case 'warning':
                return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
            default:
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center space-x-2 mb-4">
                <Activity className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Performance Analysis</h3>
            </div>

            <div className={`${getScoreBgColor(analysis.score)} border-2 rounded-lg p-6`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Performance Score</div>
                        <div className={`text-4xl font-bold ${getScoreColor(analysis.score)}`}>
                            {analysis.score}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">out of 100</div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {analysis.score >= 80 ? (
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : (
                            <TrendingUp className="w-8 h-8 text-orange-600" />
                        )}
                    </div>
                </div>

                {analysis.score < 80 && (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        {analysis.score >= 60 
                            ? 'Good performance with room for optimization'
                            : 'Performance issues detected. Review recommendations below.'}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shuffle Operations</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {analysis.summary.shuffleOperations}
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Data Skew</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {analysis.summary.dataSkew ? 'Detected' : 'None'}
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Caching Opportunities</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {analysis.summary.cachingOpportunities}
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Broadcast Join Opportunities</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {analysis.summary.broadcastJoinOpportunities}
                    </div>
                </div>
            </div>

            {analysis.issues.length > 0 ? (
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Performance Issues ({analysis.issues.length})
                    </h4>
                    <div className="space-y-3">
                        {analysis.issues.map((issue, index) => (
                            <div
                                key={index}
                                className={`${getSeverityBg(issue.severity)} border rounded-lg p-4`}
                            >
                                <div className="flex items-start space-x-3">
                                    {getSeverityIcon(issue.severity)}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {issue.issue}
                                            </div>
                                            <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">
                                                {issue.severity}
                                            </span>
                                        </div>
                                        {issue.componentName && (
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                                Component: {issue.componentName}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                                            <strong>Impact:</strong> {issue.impact}
                                        </div>
                                        <div className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                                            <strong>Recommendation:</strong> {issue.recommendation}
                                        </div>
                                        {issue.estimatedImprovement && (
                                            <div className="text-xs font-semibold text-green-700 dark:text-green-400">
                                                Estimated Improvement: {issue.estimatedImprovement}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">No performance issues detected!</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        Your pipeline is well-optimized. Continue monitoring as you add more components.
                    </p>
                </div>
            )}
        </div>
    );
}

