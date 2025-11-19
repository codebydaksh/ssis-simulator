'use client';

import React, { useState, useMemo } from 'react';
import { getComponentDefinition, COMPONENT_DEFINITIONS } from '@/lib/componentDefinitions';
import { X, Search, ArrowRight } from 'lucide-react';

interface ComponentComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ComponentComparisonModal({ isOpen, onClose }: ComponentComparisonModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [component1, setComponent1] = useState<string | null>(null);
    const [component2, setComponent2] = useState<string | null>(null);

    const filteredComponents = useMemo(() => {
        if (!searchTerm) return COMPONENT_DEFINITIONS;
        const term = searchTerm.toLowerCase();
        return COMPONENT_DEFINITIONS.filter(comp =>
            comp.name.toLowerCase().includes(term) ||
            comp.description.toLowerCase().includes(term) ||
            comp.category.toLowerCase().includes(term) ||
            comp.useCases.some(uc => uc.toLowerCase().includes(term))
        );
    }, [searchTerm]);

    const def1 = component1 ? getComponentDefinition(component1) : null;
    const def2 = component2 ? getComponentDefinition(component2) : null;

    const getComparisonData = () => {
        if (!def1 || !def2) return null;

        return {
            sameType: def1.type === def2.type,
            sameDataType: def1.dataType === def2.dataType,
            commonUseCases: def1.useCases.filter(uc => def2.useCases.includes(uc)),
            uniqueUseCases1: def1.useCases.filter(uc => !def2.useCases.includes(uc)),
            uniqueUseCases2: def2.useCases.filter(uc => !def1.useCases.includes(uc)),
        };
    };

    const getWhenToUse = (category: string): string => {
        const whenToUseMap: { [key: string]: string } = {
            'OLEDBSource': 'Use when reading from relational databases (SQL Server, Oracle, etc.). Best for structured, typed data.',
            'FlatFileSource': 'Use for CSV, TXT, or delimited text files. Good for importing legacy data or logs.',
            'ExcelSource': 'Use for Excel workbooks. Limited to 65,536 rows per sheet. Good for business reports.',
            'JSONSource': 'Use for JSON files or API responses. Requires flattening nested structures.',
            'XMLSource': 'Use for XML documents. Requires XPath queries to extract data.',
            'DataConversion': 'Use when source and destination have incompatible data types. Converts types explicitly.',
            'DerivedColumn': 'Use for calculations, string manipulations, or creating new columns. Fast and simple.',
            'Lookup': 'Use to join with reference tables. Good for small lookup tables. Caches data in memory.',
            'MergeJoin': 'Use to join two large sorted streams. More efficient than Lookup for large datasets.',
            'ConditionalSplit': 'Use to route rows to different outputs based on conditions. Like IF-THEN-ELSE logic.',
            'Sort': 'Use to order data. Required before Merge Join. Memory-intensive for large datasets.',
            'Aggregate': 'Use for grouping and summarizing (SUM, COUNT, AVG, etc.). Reduces row count.',
            'UnionAll': 'Use to combine multiple streams with same structure. Appends rows vertically.',
            'Multicast': 'Use to send same data to multiple destinations. Broadcasts data to all outputs.',
            'RowCount': 'Use for auditing. Counts rows and stores count in a variable.',
            'OLEDBDestination': 'Use to write to relational databases. Supports batch inserts for performance.',
            'FlatFileDestination': 'Use to write CSV or text files. Good for exports and data interchange.',
            'ExcelDestination': 'Use to write Excel files. Limited to 65,536 rows per sheet.',
        };

        return whenToUseMap[category] || 'Review component description and use cases to determine when to use.';
    };

    const getPerformanceNotes = (category: string): string => {
        const perfMap: { [key: string]: string } = {
            'Sort': 'Memory-intensive. Consider filtering before sorting. O(n log n) complexity.',
            'Aggregate': 'Memory-intensive for large groups. Sort input by GROUP BY columns for better performance.',
            'Lookup': 'Caches lookup table in memory. Best for small reference tables (< 1M rows).',
            'MergeJoin': 'Efficient for large sorted streams. O(n + m) complexity when inputs are sorted.',
            'Multicast': 'Broadcasts data to all outputs. Multiplies memory usage by number of outputs.',
            'DataConversion': 'Low overhead. Fast type conversions.',
            'DerivedColumn': 'Very fast. Row-by-row calculations with minimal overhead.',
        };

        return perfMap[category] || 'Performance depends on data volume and component configuration.';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Component Comparison</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left panel - Component selection */}
                    <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                        <div className="p-4 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Select Components to Compare
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search components..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                {filteredComponents.map((comp) => {
                                    const isSelected1 = component1 === comp.category;
                                    const isSelected2 = component2 === comp.category;
                                    const isSelected = isSelected1 || isSelected2;

                                    return (
                                        <button
                                            key={comp.category}
                                            onClick={() => {
                                                if (!component1) {
                                                    setComponent1(comp.category);
                                                } else if (!component2 && comp.category !== component1) {
                                                    setComponent2(comp.category);
                                                } else if (isSelected1) {
                                                    setComponent1(null);
                                                } else if (isSelected2) {
                                                    setComponent2(null);
                                                }
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                                isSelected1
                                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                                                    : isSelected2
                                                    ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
                                                    : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{comp.name}</span>
                                                {isSelected1 && <span className="text-xs">Component 1</span>}
                                                {isSelected2 && <span className="text-xs">Component 2</span>}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {comp.type} • {comp.dataType}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right panel - Comparison view */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {def1 && def2 ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Component 1 */}
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                                        <div className="flex items-center mb-3">
                                            <span className="text-2xl mr-2">{def1.icon}</span>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white">{def1.name}</h3>
                                                <span className="text-xs text-gray-600 dark:text-gray-400">{def1.category}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{def1.description}</p>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Type:</p>
                                                <p className="text-sm text-gray-900 dark:text-white">{def1.type}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Data Type:</p>
                                                <p className="text-sm text-gray-900 dark:text-white">{def1.dataType}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">When to Use:</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{getWhenToUse(def1.category)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Performance:</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{getPerformanceNotes(def1.category)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Use Cases:</p>
                                                <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                                                    {def1.useCases.map((uc, idx) => (
                                                        <li key={idx}>{uc}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Component 2 */}
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                                        <div className="flex items-center mb-3">
                                            <span className="text-2xl mr-2">{def2.icon}</span>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white">{def2.name}</h3>
                                                <span className="text-xs text-gray-600 dark:text-gray-400">{def2.category}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{def2.description}</p>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Type:</p>
                                                <p className="text-sm text-gray-900 dark:text-white">{def2.type}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Data Type:</p>
                                                <p className="text-sm text-gray-900 dark:text-white">{def2.dataType}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">When to Use:</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{getWhenToUse(def2.category)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Performance:</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{getPerformanceNotes(def2.category)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Use Cases:</p>
                                                <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                                                    {def2.useCases.map((uc, idx) => (
                                                        <li key={idx}>{uc}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Comparison Summary */}
                                {(() => {
                                    const comparison = getComparisonData();
                                    if (!comparison) return null;

                                    return (
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Comparison Summary</h3>
                                            <div className="space-y-3 text-sm">
                                                <div>
                                                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        {comparison.sameType ? 'Same component type' : 'Different component types'}
                                                    </p>
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        {comparison.sameType
                                                            ? 'Both components are the same type (source, transformation, or destination).'
                                                            : 'These components serve different roles in the data flow pipeline.'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        {comparison.sameDataType ? 'Compatible data types' : 'Different data types'}
                                                    </p>
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        {comparison.sameDataType
                                                            ? 'Both components work with the same data type. They can be used interchangeably for data type compatibility.'
                                                            : 'These components handle different data types. You may need Data Conversion between them.'}
                                                    </p>
                                                </div>
                                                {comparison.commonUseCases.length > 0 && (
                                                    <div>
                                                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Common Use Cases:</p>
                                                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                                                            {comparison.commonUseCases.map((uc, idx) => (
                                                                <li key={idx}>{uc}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {comparison.uniqueUseCases1.length > 0 && (
                                                    <div>
                                                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Unique to {def1.name}:
                                                        </p>
                                                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                                                            {comparison.uniqueUseCases1.map((uc, idx) => (
                                                                <li key={idx}>{uc}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {comparison.uniqueUseCases2.length > 0 && (
                                                    <div>
                                                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Unique to {def2.name}:
                                                        </p>
                                                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                                                            {comparison.uniqueUseCases2.map((uc, idx) => (
                                                                <li key={idx}>{uc}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                <div className="text-center">
                                    <ArrowRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Select two components from the list to compare them</p>
                                    <p className="text-sm mt-2">Choose Component 1, then Component 2</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            Compare components to understand when to use each one
                        </p>
                        <button
                            onClick={() => {
                                setComponent1(null);
                                setComponent2(null);
                            }}
                            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md transition-colors"
                        >
                            Clear Selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

