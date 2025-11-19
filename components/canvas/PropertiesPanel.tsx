'use client';

import React from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { getComponentDefinition } from '@/lib/componentDefinitions';
import { Info, XCircle } from 'lucide-react';

export default function PropertiesPanel() {
    const { selectedComponent, components } = useCanvasStore();

    const component = selectedComponent
        ? components.find(c => c.id === selectedComponent)
        : null;

    if (!component) {
        return (
            <div className="w-[320px] bg-white border-l border-gray-200 h-full p-6 flex flex-col items-center justify-center text-gray-400">
                <Info className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-center">Select a component to view its properties</p>
            </div>
        );
    }

    const definition = getComponentDefinition(component.category);

    return (
        <div className="w-[320px] bg-white border-l border-gray-200 h-full flex flex-col overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{component.icon}</span>
                    <div>
                        <h2 className="text-xl font-bold">{component.name}</h2>
                        <span className="text-xs font-mono text-gray-500 px-2 py-1 bg-gray-100 rounded">
                            {component.category}
                        </span>
                    </div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                    {definition?.description || component.description}
                </div>

                {component.hasError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                        <div className="flex items-center text-red-700 font-semibold mb-1">
                            <XCircle className="w-4 h-4 mr-2" />
                            Validation Error
                        </div>
                        <p className="text-sm text-red-600">{component.errorMessage}</p>
                    </div>
                )}
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Use Cases</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {definition?.useCases.map((useCase, i) => (
                            <li key={i}>{useCase}</li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Configuration</h3>
                    <div className="text-sm text-gray-500 italic">
                        Properties configuration not available in this version.
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Data Type</h3>
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                        {definition?.dataType}
                    </span>
                </div>
            </div>
        </div>
    );
}
