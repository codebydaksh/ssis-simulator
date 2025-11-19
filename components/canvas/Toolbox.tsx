'use client';

import React, { useState } from 'react';
import { COMPONENT_DEFINITIONS, ComponentDefinition } from '@/lib/componentDefinitions';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

export default function Toolbox() {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSections, setExpandedSections] = useState({
        source: true,
        transformation: true,
        destination: true,
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const onDragStart = (event: React.DragEvent, component: ComponentDefinition) => {
        event.dataTransfer.setData('application/reactflow', component.type);
        event.dataTransfer.setData('application/ssis-category', component.category);
        event.dataTransfer.effectAllowed = 'move';
    };

    const filteredComponents = COMPONENT_DEFINITIONS.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sources = filteredComponents.filter(c => c.type === 'source');
    const transformations = filteredComponents.filter(c => c.type === 'transformation');
    const destinations = filteredComponents.filter(c => c.type === 'destination');

    const renderSection = (title: string, items: ComponentDefinition[], sectionKey: keyof typeof expandedSections) => (
        <div className="mb-4">
            <button
                onClick={() => toggleSection(sectionKey)}
                className="flex items-center w-full p-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md mb-2"
            >
                {expandedSections[sectionKey] ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                {title} ({items.length})
            </button>

            {expandedSections[sectionKey] && (
                <div className="grid grid-cols-1 gap-2 pl-2">
                    {items.map((component) => (
                        <div
                            key={component.category}
                            className="flex items-center p-2 bg-white border border-gray-200 rounded-md cursor-move hover:border-blue-500 hover:shadow-sm transition-all"
                            draggable
                            onDragStart={(e) => onDragStart(e, component)}
                        >
                            <span className="text-xl mr-3">{component.icon}</span>
                            <div>
                                <div className="text-sm font-medium">{component.name}</div>
                                <div className="text-xs text-gray-500 truncate w-40">{component.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="w-[280px] bg-white border-r border-gray-200 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold mb-4">Toolbox</h2>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search components..."
                        className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {renderSection('Sources', sources, 'source')}
                {renderSection('Transformations', transformations, 'transformation')}
                {renderSection('Destinations', destinations, 'destination')}
            </div>
        </div>
    );
}
