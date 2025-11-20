'use client';

import React, { useState } from 'react';
import { COMPONENT_DEFINITIONS, ComponentDefinition } from '@/lib/componentDefinitions';
import { ADF_COMPONENT_DEFINITIONS, ADFComponentDefinition } from '@/lib/adfComponentDefinitions';
import { DATABRICKS_COMPONENT_DEFINITIONS, DatabricksComponentDefinition } from '@/lib/databricksComponentDefinitions';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';

export default function Toolbox() {
    const { viewMode, currentDataFlowTaskId, platform } = useCanvasStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        source: true,
        transformation: true,
        destination: true,
        'control-flow-task': true,
        'data-movement': true,
        'control-flow': true,
        notebook: true,
        dataSource: true,
        output: true,
        orchestration: true,
        cluster: true,
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const onDragStart = (event: React.DragEvent, component: ComponentDefinition | ADFComponentDefinition | DatabricksComponentDefinition) => {
        event.dataTransfer.setData('application/reactflow', component.type);
        event.dataTransfer.setData('application/ssis-category', component.category);
        event.dataTransfer.effectAllowed = 'move';
    };

    // Filter components based on view mode and platform
    const availableComponents = React.useMemo(() => {
        if (platform === 'adf') {
            return ADF_COMPONENT_DEFINITIONS;
        }

        if (platform === 'databricks') {
            return DATABRICKS_COMPONENT_DEFINITIONS;
        }

        // SSIS Logic
        // If in nested data flow, show only data flow components
        if (currentDataFlowTaskId) {
            return COMPONENT_DEFINITIONS.filter(c =>
                c.type === 'source' ||
                c.type === 'transformation' ||
                c.type === 'destination'
            );
        }
        // If in control flow view, show only control flow tasks
        if (viewMode === 'control-flow') {
            return COMPONENT_DEFINITIONS.filter(c => c.type === 'control-flow-task');
        }
        // Default: data flow view - show data flow components
        return COMPONENT_DEFINITIONS.filter(c =>
            c.type === 'source' ||
            c.type === 'transformation' ||
            c.type === 'destination'
        );
    }, [viewMode, currentDataFlowTaskId, platform]);

    const filteredComponents = availableComponents.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group components by type for rendering
    const groupedComponents = React.useMemo(() => {
        const groups: Record<string, (ComponentDefinition | ADFComponentDefinition | DatabricksComponentDefinition)[]> = {};

        filteredComponents.forEach(c => {
            if (!groups[c.type]) {
                groups[c.type] = [];
            }
            groups[c.type].push(c);
        });

        return groups;
    }, [filteredComponents]);

    const getSectionTitle = (type: string) => {
        switch (type) {
            case 'source': return 'Sources';
            case 'transformation': return 'Transformations';
            case 'destination': return 'Destinations';
            case 'control-flow-task': return 'Control Flow Tasks';
            case 'data-movement': return 'Data Movement';
            case 'control-flow': return 'Control Flow';
            case 'notebook': return 'Notebooks';
            case 'dataSource': return 'Data Sources';
            case 'output': return 'Outputs';
            case 'orchestration': return 'Orchestration';
            case 'cluster': return 'Clusters';
            default: return type.charAt(0).toUpperCase() + type.slice(1);
        }
    };

    // Define section order
    const sectionOrder = platform === 'adf'
        ? ['data-movement', 'transformation', 'control-flow']
        : platform === 'databricks'
        ? ['notebook', 'dataSource', 'transformation', 'output', 'orchestration', 'cluster']
        : ['control-flow-task', 'source', 'transformation', 'destination'];

    const renderSection = (type: string) => {
        const items = groupedComponents[type] || [];
        if (items.length === 0 && searchTerm) return null; // Hide empty sections when searching
        if (items.length === 0 && !searchTerm && platform === 'ssis' && viewMode === 'control-flow' && type !== 'control-flow-task') return null;

        const title = getSectionTitle(type);
        const isExpanded = expandedSections[type];

        return (
            <div className="mb-4" key={type}>
                <button
                    onClick={() => toggleSection(type)}
                    className="flex items-center w-full p-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md mb-2"
                >
                    {isExpanded ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                    {title} ({items.length})
                </button>

                {isExpanded && (
                    <div className="grid grid-cols-1 gap-2 pl-2">
                        {items.length === 0 ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400 italic p-2">No components available</div>
                        ) : (
                            items.map((component) => (
                                <div
                                    key={component.category}
                                    className="flex items-start p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md cursor-move hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-sm transition-all"
                                    draggable
                                    onDragStart={(e) => onDragStart(e, component)}
                                >
                                    <span className="text-lg mr-3 flex-shrink-0">{component.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1 leading-tight">{component.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">{component.description}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-[280px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                    {platform === 'adf' ? 'ADF Activities' : 
                     platform === 'databricks' ? 'Databricks Components' : 
                     'SSIS Toolbox'}
                </h2>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search components..."
                        className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {sectionOrder.map(type => renderSection(type))}
            </div>
        </div>
    );
}
