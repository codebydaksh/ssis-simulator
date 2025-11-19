'use client';

import React from 'react';
import { ValidationResult } from '@/lib/types';
import { X, AlertCircle, AlertTriangle, Info, Lightbulb, BookOpen, ExternalLink } from 'lucide-react';

interface ErrorDetailModalProps {
    error: ValidationResult | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ErrorDetailModal({ error, isOpen, onClose }: ErrorDetailModalProps) {
    if (!isOpen || !error) return null;

    const getSeverityIcon = () => {
        switch (error.severity) {
            case 'error':
                return <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />;
            case 'warning':
                return <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />;
            case 'info':
                return <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
            default:
                return <Info className="w-6 h-6 text-gray-600 dark:text-gray-400" />;
        }
    };

    const getSeverityColor = () => {
        switch (error.severity) {
            case 'error':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            case 'warning':
                return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
            case 'info':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            default:
                return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
        }
    };

    const getDetailedExplanation = (): string => {
        const message = error.message.toLowerCase();
        
        if (message.includes('cannot connect csv') || message.includes('flat file')) {
            return 'CSV (Flat File) sources output data as text strings. OLEDB destinations expect strongly-typed data (integers, decimals, dates). The Data Conversion transformation converts text to the appropriate data types before loading into the database.';
        }
        
        if (message.includes('excel') && message.includes('limit')) {
            return 'Excel files have a row limit of 65,536 rows per worksheet. If your data exceeds this limit, rows will be truncated. For larger datasets, consider using CSV or database destinations.';
        }
        
        if (message.includes('merge join') && message.includes('sorted')) {
            return 'Merge Join requires both input streams to be sorted by the join key. This allows the component to efficiently match rows from both streams in a single pass. Without sorting, the Merge Join cannot guarantee correct results.';
        }
        
        if (message.includes('union all') && message.includes('structure')) {
            return 'Union All combines rows from multiple sources into a single output. All input streams must have the same column structure (same column names, data types, and order) for the union to work correctly.';
        }
        
        if (message.includes('lookup') && message.includes('reference')) {
            return 'Lookup transformation requires a reference dataset (lookup table) to match against. This reference input must be configured in the component properties to specify which table or query to use for lookups.';
        }
        
        if (message.includes('circular dependency')) {
            return 'A circular dependency occurs when data flows in a loop (Component A  Component B  Component A). SSIS data flows must be acyclic (no loops) because data can only flow forward through the pipeline.';
        }
        
        if (message.includes('source') && message.includes('input')) {
            return 'Source components are the starting point of a data flow. They read data from external sources (databases, files) and cannot receive data from other components. Only transformations and destinations can receive input connections.';
        }
        
        if (message.includes('destination') && message.includes('output')) {
            return 'Destination components are the end point of a data flow. They write data to external targets (databases, files) and cannot send data to other components. Only sources and transformations can have output connections.';
        }
        
        if (message.includes('transformation') && message.includes('input')) {
            return 'Transformations process data between sources and destinations. They require at least one input connection to receive data from upstream components (sources or other transformations).';
        }
        
        if (message.includes('sort') && message.includes('large dataset')) {
            return 'Sort operations load all data into memory before sorting. For large datasets, this can cause memory pressure and performance issues. Filtering data before sorting reduces the amount of data that needs to be sorted.';
        }
        
        if (message.includes('multiple lookups')) {
            return 'When you have multiple Lookup transformations in sequence, each lookup requires a separate database query. For large datasets, this can be slow. Merge Join is more efficient when both input streams are large and already sorted.';
        }
        
        if (message.includes('aggregate') && message.includes('group by')) {
            return 'Aggregate transformations group rows and calculate summaries. Sorting input data by the GROUP BY columns before aggregating can improve performance because it allows the aggregate to process data in groups more efficiently.';
        }
        
        if (message.includes('data conversion') && message.includes('unnecessary')) {
            return 'Data Conversion transformations change data types. If the source and destination already have compatible types, the conversion is unnecessary and adds overhead. Verify that the conversion is actually needed.';
        }
        
        if (message.includes('error output')) {
            return 'Error outputs allow you to handle data quality issues gracefully. Instead of failing the entire pipeline, rows that fail validation or conversion can be routed to an error output, logged, and processed separately.';
        }
        
        if (message.includes('null value')) {
            return 'NULL values can cause issues in calculations and expressions. Operations like division, concatenation, or arithmetic can produce NULL results if any input is NULL. Use ISNULL or COALESCE functions to provide default values.';
        }
        
        if (message.includes('duplicate detection')) {
            return 'Duplicate rows can cause data quality issues. The standard pattern for deduplication is: Sort by the business key, then use Aggregate to keep only one row per key (typically the first or last based on a date field).';
        }
        
        return 'This validation rule checks for common SSIS best practices and potential issues. Review the suggestion and apply the recommended fix to improve your pipeline.';
    };

    const getFixSteps = (): string[] => {
        const message = error.message.toLowerCase();
        const suggestion = error.suggestion?.toLowerCase() || '';
        
        if (message.includes('cannot connect csv') || message.includes('flat file')) {
            return [
                '1. Add a Data Conversion transformation between the Flat File Source and OLEDB Destination',
                '2. Configure the Data Conversion to convert text columns to appropriate data types (e.g., string to integer, string to decimal)',
                '3. Connect: Flat File Source  Data Conversion  OLEDB Destination',
                '4. Map the converted columns to the destination table columns'
            ];
        }
        
        if (message.includes('merge join') && message.includes('sorted')) {
            return [
                '1. Add a Sort transformation before each input to the Merge Join',
                '2. Configure each Sort to sort by the join key columns',
                '3. Ensure both Sort components use the same sort order (ASC or DESC)',
                '4. Connect: Source 1  Sort 1  Merge Join, Source 2  Sort 2  Merge Join'
            ];
        }
        
        if (message.includes('union all') && message.includes('structure')) {
            return [
                '1. Ensure all input sources have the same column structure',
                '2. Use Derived Column to add missing columns or rename columns to match',
                '3. Use Data Conversion to ensure data types match across all inputs',
                '4. Verify column order is the same in all inputs'
            ];
        }
        
        if (message.includes('lookup') && message.includes('reference')) {
            return [
                '1. Select the Lookup component',
                '2. Open the Properties panel',
                '3. Configure the Reference Connection property with your lookup table connection',
                '4. Specify the lookup table name or query',
                '5. Map the lookup key columns'
            ];
        }
        
        if (suggestion.includes('add') || suggestion.includes('configure')) {
            return [
                `1. ${error.suggestion}`,
                '2. Review the component properties to ensure correct configuration',
                '3. Re-run validation to verify the fix'
            ];
        }
        
        return [
            '1. Review the error message and understand the issue',
            '2. Apply the suggested fix',
            '3. Re-validate the pipeline to confirm the issue is resolved'
        ];
    };

    const getRelevantTemplates = (): string[] => {
        const message = error.message.toLowerCase();
        
        if (message.includes('data conversion')) {
            return ['Basic ETL: Database to CSV', 'Data Type Conversion Pattern'];
        }
        
        if (message.includes('merge join') || message.includes('join')) {
            return ['Merge Join Pattern', 'Star Schema Loading'];
        }
        
        if (message.includes('lookup')) {
            return ['Lookup Transformation', 'Customer Data Enrichment'];
        }
        
        if (message.includes('union')) {
            return ['Union All Pattern', 'Multiple Sources to Single Destination'];
        }
        
        if (message.includes('sort')) {
            return ['Sort and Aggregate Pattern', 'Deduplication Pattern'];
        }
        
        return ['Basic ETL: Database to CSV'];
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                <div className={`flex items-center justify-between p-4 border-b ${getSeverityColor()}`}>
                    <div className="flex items-center space-x-3">
                        {getSeverityIcon()}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {error.severity === 'error' ? 'Error Details' : 
                                 error.severity === 'warning' ? 'Warning Details' : 
                                 'Information'}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {error.connectionId}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Error Message */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Error Message
                        </h3>
                        <p className="text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                            {error.message}
                        </p>
                    </div>

                    {/* Detailed Explanation */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <Info className="w-4 h-4 mr-2" />
                            Why This Matters
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md leading-relaxed">
                            {getDetailedExplanation()}
                        </p>
                    </div>

                    {/* Fix Steps */}
                    {error.suggestion && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <Lightbulb className="w-4 h-4 mr-2" />
                                How to Fix
                            </h3>
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Suggestion: {error.suggestion}
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                    {getFixSteps().map((step, idx) => (
                                        <li key={idx} className="ml-2">{step.replace(/^\d+\.\s*/, '')}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    )}

                    {/* Relevant Templates */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Learn From Templates
                        </h3>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                These templates demonstrate similar patterns:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {getRelevantTemplates().map((template, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-xs"
                                    >
                                        {template}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                Open the Templates menu to load these examples
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            Click on affected components in the error list to select them on the canvas
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

