'use client';

import React, { useState, useMemo } from 'react';
import { SSISComponent } from '@/lib/types';
import { Server, DollarSign, Package } from 'lucide-react';

interface ClusterConfigPanelProps {
    cluster: SSISComponent;
    onUpdate: (updates: Partial<SSISComponent>) => void;
}

const NODE_TYPES = [
    'Standard_DS3_v2',
    'Standard_DS4_v2',
    'Standard_DS5_v2',
    'Standard_D8s_v3',
    'Standard_D16s_v3',
    'Standard_D32s_v3'
];

const RUNTIME_VERSIONS = [
    '13.3.x-scala2.12',
    '14.3.x-scala2.12',
    '15.4.x-scala2.12',
    '16.2.x-scala2.12'
];

const DBU_RATES: Record<string, number> = {
    'Standard_DS3_v2': 0.15,
    'Standard_DS4_v2': 0.30,
    'Standard_DS5_v2': 0.60,
    'Standard_D8s_v3': 0.40,
    'Standard_D16s_v3': 0.80,
    'Standard_D32s_v3': 1.60
};

export default function ClusterConfigPanel({ cluster, onUpdate }: ClusterConfigPanelProps) {
    const props = cluster.properties || {};
    const [nodeType, setNodeType] = useState<string>(props.nodeType as string || 'Standard_DS3_v2');
    const [numWorkers, setNumWorkers] = useState<number>(props.numWorkers as number || 2);
    const [minWorkers, setMinWorkers] = useState<number>(props.minWorkers as number || 1);
    const [maxWorkers, setMaxWorkers] = useState<number>(props.maxWorkers as number || 8);
    const [runtimeVersion, setRuntimeVersion] = useState<string>(props.runtimeVersion as string || '13.3.x-scala2.12');
    const [autoterminationMinutes, setAutoterminationMinutes] = useState<number>(
        props.autoterminationMinutes as number || 30
    );
    const [autoscaling, setAutoscaling] = useState<boolean>(props.autoscaling as boolean || false);
    const [libraries, setLibraries] = useState<Array<{ type: string; name: string; version?: string }>>(
        (props.libraries as Array<{ type: string; name: string; version?: string }>) || []
    );
    const [newLibraryType, setNewLibraryType] = useState<string>('pypi');
    const [newLibraryName, setNewLibraryName] = useState<string>('');
    const [newLibraryVersion, setNewLibraryVersion] = useState<string>('');

    const estimatedCost = useMemo(() => {
        const dbuRate = DBU_RATES[nodeType] || 0.15;
        const totalNodes = 1 + numWorkers; // Driver + workers
        return dbuRate * totalNodes;
    }, [nodeType, numWorkers]);

    const handleAddLibrary = () => {
        if (newLibraryName.trim()) {
            const newLib = {
                type: newLibraryType,
                name: newLibraryName.trim(),
                version: newLibraryVersion.trim() || undefined
            };
            const updatedLibraries = [...libraries, newLib];
            setLibraries(updatedLibraries);
            onUpdate({ properties: { ...props, libraries: updatedLibraries } });
            setNewLibraryName('');
            setNewLibraryVersion('');
        }
    };

    const handleRemoveLibrary = (index: number) => {
        const updatedLibraries = libraries.filter((_, i) => i !== index);
        setLibraries(updatedLibraries);
        onUpdate({ properties: { ...props, libraries: updatedLibraries } });
    };

    const handleSave = () => {
        onUpdate({
            properties: {
                ...props,
                nodeType,
                numWorkers,
                minWorkers,
                maxWorkers,
                runtimeVersion,
                autoterminationMinutes,
                autoscaling,
                libraries
            }
        });
    };

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center space-x-2 mb-4">
                <Server className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cluster Configuration</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Node Type
                    </label>
                    <select
                        value={nodeType}
                        onChange={(e) => {
                            setNodeType(e.target.value);
                            handleSave();
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        {NODE_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Runtime Version
                    </label>
                    <select
                        value={runtimeVersion}
                        onChange={(e) => {
                            setRuntimeVersion(e.target.value);
                            handleSave();
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        {RUNTIME_VERSIONS.map(version => (
                            <option key={version} value={version}>{version}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={autoscaling}
                        onChange={(e) => {
                            setAutoscaling(e.target.checked);
                            handleSave();
                        }}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                        Enable Autoscaling
                    </label>
                </div>

                {autoscaling ? (
                    <>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Min Workers: {minWorkers}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={minWorkers}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setMinWorkers(val);
                                    if (val > maxWorkers) setMaxWorkers(val);
                                    handleSave();
                                }}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Max Workers: {maxWorkers}
                            </label>
                            <input
                                type="range"
                                min={minWorkers}
                                max="20"
                                value={maxWorkers}
                                onChange={(e) => {
                                    setMaxWorkers(parseInt(e.target.value));
                                    handleSave();
                                }}
                                className="w-full"
                            />
                        </div>
                    </>
                ) : (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Number of Workers: {numWorkers}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="20"
                            value={numWorkers}
                            onChange={(e) => {
                                setNumWorkers(parseInt(e.target.value));
                                handleSave();
                            }}
                            className="w-full"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Auto Termination (minutes): {autoterminationMinutes}
                    </label>
                    <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={autoterminationMinutes}
                        onChange={(e) => {
                            setAutoterminationMinutes(parseInt(e.target.value));
                            handleSave();
                        }}
                        className="w-full"
                    />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center space-x-2 mb-3">
                        <Package className="w-4 h-4 text-orange-600" />
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Libraries</h4>
                    </div>
                    <div className="space-y-2 mb-3">
                        {libraries.map((lib, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                <span className="text-xs text-gray-700 dark:text-gray-300">
                                    {lib.type}: {lib.name}{lib.version ? `==${lib.version}` : ''}
                                </span>
                                <button
                                    onClick={() => handleRemoveLibrary(index)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex space-x-2">
                        <select
                            value={newLibraryType}
                            onChange={(e) => setNewLibraryType(e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="pypi">PyPI</option>
                            <option value="maven">Maven</option>
                            <option value="jar">JAR</option>
                            <option value="cran">CRAN</option>
                            <option value="egg">Egg</option>
                            <option value="whl">Wheel</option>
                        </select>
                        <input
                            type="text"
                            value={newLibraryName}
                            onChange={(e) => setNewLibraryName(e.target.value)}
                            placeholder="Library name"
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <input
                            type="text"
                            value={newLibraryVersion}
                            onChange={(e) => setNewLibraryVersion(e.target.value)}
                            placeholder="Version (optional)"
                            className="w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                            onClick={handleAddLibrary}
                            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded"
                        >
                            Add
                        </button>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cost Estimation</h4>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex justify-between mb-1">
                                <span>DBU Rate (per node):</span>
                                <span className="font-semibold">${DBU_RATES[nodeType]?.toFixed(2)}/hour</span>
                            </div>
                            <div className="flex justify-between mb-1">
                                <span>Total Nodes:</span>
                                <span className="font-semibold">{1 + numWorkers}</span>
                            </div>
                            <div className="flex justify-between font-bold text-green-700 dark:text-green-300">
                                <span>Estimated Cost:</span>
                                <span>${estimatedCost.toFixed(2)}/hour</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Monthly (24/7): ${(estimatedCost * 24 * 30).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

