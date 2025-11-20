'use client';

import React, { useState, useMemo } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { analyzeAndSuggest, OptimizationSuggestion, getTemplateReference } from '@/lib/optimizationSuggestions';
import { Lightbulb, X, AlertTriangle, Info, Zap, CheckCircle2 } from 'lucide-react';

export default function SuggestionsPanel() {
    const { components, connections, platform } = useCanvasStore();
    const [isOpen, setIsOpen] = useState(false);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    const suggestions = useMemo(() => {
        const allSuggestions = analyzeAndSuggest(components, connections);
        return allSuggestions.filter(s => !dismissedIds.has(s.id));
    }, [components, connections, dismissedIds]);

    const handleDismiss = (id: string) => {
        setDismissedIds(prev => new Set([...prev, id]));
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            case 'suggestion':
                return <Lightbulb className="w-5 h-5 text-blue-600" />;
            default:
                return <Info className="w-5 h-5 text-gray-600" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'warning':
                return 'border-yellow-300 bg-yellow-50';
            case 'suggestion':
                return 'border-blue-300 bg-blue-50';
            default:
                return 'border-gray-300 bg-gray-50';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Performance':
                return 'bg-purple-100 text-purple-800';
            case 'Best Practice':
                return 'bg-green-100 text-green-800';
            case 'Alternative Method':
                return 'bg-blue-100 text-blue-800';
            case 'Data Quality':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <>
            {/* Floating button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 z-40 animate-pulse"
                    title="View optimization suggestions"
                >
                    <Lightbulb className="w-5 h-5" />
                    <span className="font-semibold">{suggestions.length} Suggestion{suggestions.length !== 1 ? 's' : ''}</span>
                </button>
            )}

            {/* Suggestions panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                        <div className="flex items-center space-x-2">
                            <Zap className="w-5 h-5" />
                            <h3 className="font-semibold">Optimization Suggestions</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Suggestions list */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {suggestions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                <CheckCircle2 className="w-12 h-12 mb-2 text-green-500" />
                                <p className="text-sm font-medium">All suggestions addressed!</p>
                                <p className="text-xs">Your pipeline looks good</p>
                            </div>
                        ) : (
                            suggestions.map((suggestion) => (
                                <div
                                    key={suggestion.id}
                                    className={`border-2 rounded-lg p-3 ${getSeverityColor(suggestion.severity)}`}
                                >
                                    {/* Title row */}
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-start space-x-2 flex-1">
                                            {getSeverityIcon(suggestion.severity)}
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-sm text-gray-900">
                                                    {suggestion.title}
                                                </h4>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(suggestion.category)}`}>
                                                        {suggestion.category}
                                                    </span>
                                                    {suggestion.estimatedImpact && (
                                                        <span className="text-xs text-gray-600 italic">
                                                            {suggestion.estimatedImpact}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDismiss(suggestion.id)}
                                            className="p-1 hover:bg-white/50 rounded transition-colors ml-2"
                                            title="Dismiss"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-gray-700 mb-2 pl-7">
                                        {suggestion.description}
                                    </p>

                                    {/* Recommendation */}
                                    <div className="bg-white/70 rounded p-2 text-sm pl-7">
                                        <p className="font-medium text-gray-800 mb-1">Recommendation:</p>
                                        <p className="text-gray-700">{suggestion.recommendation}</p>

                                        {suggestion.learnFrom && (
                                            <p className="text-xs text-blue-600 mt-2">
                                                Learn from: {getTemplateReference(suggestion.learnFrom)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t bg-gray-50 text-xs text-gray-600 rounded-b-lg">
                        <p>Suggestions are based on {platform === 'databricks' ? 'Databricks' : platform === 'adf' ? 'ADF' : 'SSIS'} best practices and your templates</p>
                    </div>
                </div>
            )}
        </>
    );
}
