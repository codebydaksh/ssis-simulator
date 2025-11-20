'use client';

import React, { useState, useMemo } from 'react';
import { SSISComponent, Connection } from '@/lib/types';
import { generateDatabricksCode } from '@/lib/databricksCodeGenerator';
import { exportDatabricksPipeline, downloadExport } from '@/lib/databricksExporter';
import { Copy, Download, FileCode, Database, Workflow, Package } from 'lucide-react';

interface DatabricksCodePreviewProps {
    components: SSISComponent[];
    connections: Connection[];
}

type CodeTab = 'pyspark' | 'sparksql' | 'dlt' | 'job';

export default function DatabricksCodePreview({ components, connections }: DatabricksCodePreviewProps) {
    const [activeTab, setActiveTab] = useState<CodeTab>('pyspark');
    const [copied, setCopied] = useState(false);

    const generatedCode = useMemo(() => {
        return generateDatabricksCode(components, connections);
    }, [components, connections]);

    const handleCopy = async () => {
        let textToCopy = '';
        switch (activeTab) {
            case 'pyspark':
                textToCopy = generatedCode.pyspark;
                break;
            case 'sparksql':
                textToCopy = generatedCode.sparkSql;
                break;
            case 'dlt':
                textToCopy = generatedCode.dltDefinition || '';
                break;
            case 'job':
                textToCopy = generatedCode.jobJson || '';
                break;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleExport = () => {
        let format: 'ipynb' | 'py' | 'dlt' | 'job' = 'py';
        let filename = 'databricks-pipeline';
        let mimeType = 'text/plain';

        switch (activeTab) {
            case 'pyspark':
                format = 'py';
                filename = 'pipeline.py';
                mimeType = 'text/x-python';
                break;
            case 'sparksql':
                format = 'py';
                filename = 'pipeline.sql';
                mimeType = 'text/plain';
                break;
            case 'dlt':
                format = 'dlt';
                filename = 'dlt-pipeline.json';
                mimeType = 'application/json';
                break;
            case 'job':
                format = 'job';
                filename = 'databricks-job.json';
                mimeType = 'application/json';
                break;
        }

        const content = exportDatabricksPipeline(components, connections, { format, includeComments: true });
        downloadExport(content, filename, mimeType);
    };

    const getCurrentCode = () => {
        switch (activeTab) {
            case 'pyspark':
                return generatedCode.pyspark;
            case 'sparksql':
                return generatedCode.sparkSql;
            case 'dlt':
                return generatedCode.dltDefinition || '// No DLT pipeline components found';
            case 'job':
                return generatedCode.jobJson || '// No job components found';
            default:
                return '';
        }
    };

    const tabs: { id: CodeTab; label: string; icon: React.ReactNode }[] = [
        { id: 'pyspark', label: 'PySpark', icon: <FileCode className="w-4 h-4" /> },
        { id: 'sparksql', label: 'Spark SQL', icon: <Database className="w-4 h-4" /> },
        { id: 'dlt', label: 'DLT', icon: <Workflow className="w-4 h-4" /> },
        { id: 'job', label: 'Job JSON', icon: <Package className="w-4 h-4" /> }
    ];

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between px-4 py-2">
                <div className="flex space-x-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-orange-600 text-white'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleCopy}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded transition-colors"
                        title="Copy to clipboard"
                    >
                        <Copy className="w-3 h-3" />
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                        title="Export to file"
                    >
                        <Download className="w-3 h-3" />
                        <span>Export</span>
                    </button>
                </div>
            </div>
            <div className="bg-gray-900 text-gray-100 p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                    <code>{getCurrentCode()}</code>
                </pre>
            </div>
        </div>
    );
}

