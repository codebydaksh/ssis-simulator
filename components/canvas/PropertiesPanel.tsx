'use client';

import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { getComponentDefinition } from '@/lib/componentDefinitions';
import { Info, XCircle, Save as SaveIcon } from 'lucide-react';

export default function PropertiesPanel() {
    const { selectedComponent, components, updateComponent } = useCanvasStore();
    const [localProperties, setLocalProperties] = useState<Record<string, any>>({});
    const [hasChanges, setHasChanges] = useState(false);

    const component = selectedComponent
        ? components.find(c => c.id === selectedComponent)
        : null;

    useEffect(() => {
        if (component) {
            setLocalProperties(component.properties || {});
            setHasChanges(false);
        }
    }, [component?.id]);

    if (!component) {
        return (
            <div className="w-[320px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 h-full p-6 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <Info className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-center">Select a component to view its properties</p>
            </div>
        );
    }

    const definition = getComponentDefinition(component.category);

    return (
        <div className="w-[320px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{component.icon}</span>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{component.name}</h2>
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                            {component.category}
                        </span>
                    </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
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
                    <h3 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Use Cases</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {definition?.useCases.map((useCase, i) => (
                            <li key={i}>{useCase}</li>
                        ))}
                    </ul>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400">Configuration</h3>
                        {hasChanges && (
                            <button
                                onClick={() => {
                                    if (component) {
                                        updateComponent(component.id, { properties: localProperties });
                                        setHasChanges(false);
                                    }
                                }}
                                className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                            >
                                <SaveIcon className="w-3 h-3" />
                                <span>Save</span>
                            </button>
                        )}
                    </div>
                    {renderEditableProperties()}
                </div>

                <div>
                    <h3 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Data Type</h3>
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        {definition?.dataType}
                    </span>
                </div>
            </div>
        </div>
    );

    function renderEditableProperties() {
        if (!component) return null;

        const updateProperty = (key: string, value: any) => {
            setLocalProperties(prev => ({ ...prev, [key]: value }));
            setHasChanges(true);
        };

        if (component.type === 'source') {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Connection String
                        </label>
                        <input
                            type="text"
                            value={localProperties.connectionString || ''}
                            onChange={(e) => updateProperty('connectionString', e.target.value)}
                            placeholder="e.g., Data Source=Server;Initial Catalog=DB;..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {component.category === 'OLEDBSource' && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Table/Query
                            </label>
                            <input
                                type="text"
                                value={localProperties.tableName || localProperties.query || ''}
                                onChange={(e) => {
                                    if (localProperties.query) {
                                        updateProperty('query', e.target.value);
                                    } else {
                                        updateProperty('tableName', e.target.value);
                                    }
                                }}
                                placeholder="Table name or SQL query"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                    {component.category === 'FlatFileSource' && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                File Path
                            </label>
                            <input
                                type="text"
                                value={localProperties.filePath || ''}
                                onChange={(e) => updateProperty('filePath', e.target.value)}
                                placeholder="C:\\Data\\file.csv"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>
            );
        }

        if (component.type === 'destination') {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Connection String
                        </label>
                        <input
                            type="text"
                            value={localProperties.connectionString || ''}
                            onChange={(e) => updateProperty('connectionString', e.target.value)}
                            placeholder="e.g., Data Source=Server;Initial Catalog=DB;..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {component.category === 'OLEDBDestination' && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Target Table
                            </label>
                            <input
                                type="text"
                                value={localProperties.tableName || ''}
                                onChange={(e) => updateProperty('tableName', e.target.value)}
                                placeholder="dbo.TableName"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                    {component.category === 'FlatFileDestination' && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                File Path
                            </label>
                            <input
                                type="text"
                                value={localProperties.filePath || ''}
                                onChange={(e) => updateProperty('filePath', e.target.value)}
                                placeholder="C:\\Data\\output.csv"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>
            );
        }

        if (component.type === 'transformation') {
            if (component.category === 'Lookup') {
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Reference Connection
                            </label>
                            <input
                                type="text"
                                value={localProperties.referenceConnection || ''}
                                onChange={(e) => updateProperty('referenceConnection', e.target.value)}
                                placeholder="Connection string for lookup table"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Lookup Table
                            </label>
                            <input
                                type="text"
                                value={localProperties.lookupTable || ''}
                                onChange={(e) => updateProperty('lookupTable', e.target.value)}
                                placeholder="dbo.LookupTable"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                );
            }

            if (component.category === 'DerivedColumn') {
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Expression
                            </label>
                            <textarea
                                value={localProperties.expression || ''}
                                onChange={(e) => updateProperty('expression', e.target.value)}
                                placeholder="e.g., [FirstName] + ' ' + [LastName]"
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            />
                        </div>
                    </div>
                );
            }

            if (component.category === 'ConditionalSplit') {
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Condition
                            </label>
                            <textarea
                                value={localProperties.condition || ''}
                                onChange={(e) => updateProperty('condition', e.target.value)}
                                placeholder="e.g., [Status] == 'Active'"
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            />
                        </div>
                    </div>
                );
            }

            if (component.category === 'Sort') {
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Sort Columns
                            </label>
                            <input
                                type="text"
                                value={localProperties.sortColumns || ''}
                                onChange={(e) => updateProperty('sortColumns', e.target.value)}
                                placeholder="e.g., CustomerID ASC, OrderDate DESC"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                );
            }

            return (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No editable properties for this transformation type.
                </div>
            );
        }

        return null;
    }
}
