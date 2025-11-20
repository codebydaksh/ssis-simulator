'use client';

import React, { useMemo, useState } from 'react';
import { SSISComponent, Connection } from '@/lib/types';
import { DollarSign, TrendingUp } from 'lucide-react';

interface DatabricksCostCalculatorProps {
    components: SSISComponent[];
    connections: Connection[];
}

const DBU_RATES: Record<string, number> = {
    'Standard_DS3_v2': 0.15,
    'Standard_DS4_v2': 0.30,
    'Standard_DS5_v2': 0.60,
    'Standard_D8s_v3': 0.40,
    'Standard_D16s_v3': 0.80,
    'Standard_D32s_v3': 1.60,
    'Small': 0.20,
    'Medium': 0.40,
    'Large': 0.80,
    'X-Large': 1.60
};

interface CostBreakdown {
    clusters: number;
    sqlWarehouses: number;
    streaming: number;
    storage: number;
    total: number;
}

export default function DatabricksCostCalculator({ components }: DatabricksCostCalculatorProps) {
    const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('monthly');
    const [clusterUptime, setClusterUptime] = useState<number>(8); // hours per day
    const [jobRunsPerDay, setJobRunsPerDay] = useState<number>(1);
    const [jobDuration, setJobDuration] = useState<number>(1); // hours per run

    const costBreakdown = useMemo<CostBreakdown>(() => {
        const clusters = components.filter(c => c.type === 'cluster' && c.category !== 'SQLWarehouse');
        const sqlWarehouses = components.filter(c => c.category === 'SQLWarehouse');
        const streamingComponents = components.filter(c => 
            c.category === 'KafkaStream' || 
            c.category === 'AutoLoader' || 
            (c.properties?.streaming === true)
        );

        let clusterCost = 0;
        clusters.forEach(cluster => {
            const props = cluster.properties || {};
            const nodeType = props.nodeType as string || 'Standard_DS3_v2';
            const numWorkers = props.numWorkers as number || 2;
            const dbuRate = DBU_RATES[nodeType] || 0.15;
            const totalNodes = 1 + numWorkers;
            const hourlyCost = dbuRate * totalNodes;
            clusterCost += hourlyCost * clusterUptime;
        });

        let sqlWarehouseCost = 0;
        sqlWarehouses.forEach(warehouse => {
            const props = warehouse.properties || {};
            const size = props.clusterSize as string || 'Small';
            const dbuRate = DBU_RATES[size] || 0.20;
            sqlWarehouseCost += dbuRate * clusterUptime;
        });

        let streamingCost = 0;
        if (streamingComponents.length > 0) {
            streamingCost = 5.0 * 24; // Estimated $5/hour for streaming, 24/7
        }

        const jobCost = clusters.reduce((acc, cluster) => {
            const props = cluster.properties || {};
            const nodeType = props.nodeType as string || 'Standard_DS3_v2';
            const numWorkers = props.numWorkers as number || 2;
            const dbuRate = DBU_RATES[nodeType] || 0.15;
            const totalNodes = 1 + numWorkers;
            const hourlyCost = dbuRate * totalNodes;
            return acc + (hourlyCost * jobDuration * jobRunsPerDay);
        }, 0);

        const storageCost = 0.023; // $0.023 per GB/month (estimated)

        const dailyTotal = clusterCost + sqlWarehouseCost + streamingCost + jobCost;
        const monthlyTotal = dailyTotal * 30 + storageCost;

        return {
            clusters: viewMode === 'daily' ? clusterCost : clusterCost * 30,
            sqlWarehouses: viewMode === 'daily' ? sqlWarehouseCost : sqlWarehouseCost * 30,
            streaming: viewMode === 'daily' ? streamingCost : streamingCost * 30,
            storage: viewMode === 'daily' ? storageCost / 30 : storageCost,
            total: viewMode === 'daily' ? dailyTotal : monthlyTotal
        };
    }, [components, viewMode, clusterUptime, jobRunsPerDay, jobDuration]);

    const streamingComponents = useMemo(() => {
        return components.filter(c => 
        c.category === 'KafkaStream' || 
        c.category === 'AutoLoader' || 
        (c.properties?.streaming === true)
        );
    }, [components]);

    const optimizationSuggestions = useMemo(() => {
        const suggestions: string[] = [];
        const clusters = components.filter(c => c.type === 'cluster' && c.category !== 'SQLWarehouse');
        
        clusters.forEach(cluster => {
            const props = cluster.properties || {};
            if (!props.autoscaling && props.numWorkers && (props.numWorkers as number) > 2) {
                suggestions.push(`Enable autoscaling on ${cluster.name} to reduce costs during low usage`);
            }
            if (props.autoterminationMinutes && (props.autoterminationMinutes as number) > 60) {
                suggestions.push(`Reduce auto-termination time on ${cluster.name} to save costs`);
            }
        });

        if (streamingComponents.length > 0 && !suggestions.some(s => s.includes('streaming'))) {
            suggestions.push('Consider batch processing instead of streaming for non-real-time requirements');
        }

        return suggestions;
    }, [components, streamingComponents.length]);

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cost Calculator</h3>
                </div>
                <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 rounded p-1">
                    <button
                        onClick={() => setViewMode('daily')}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                            viewMode === 'daily'
                                ? 'bg-orange-600 text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        Daily
                    </button>
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                            viewMode === 'monthly'
                                ? 'bg-orange-600 text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Cluster Uptime (hours/day)
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="24"
                        value={clusterUptime}
                        onChange={(e) => setClusterUptime(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Job Runs per Day
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={jobRunsPerDay}
                        onChange={(e) => setJobRunsPerDay(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Job Duration (hours)
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={jobDuration}
                        onChange={(e) => setJobDuration(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            Total {viewMode === 'daily' ? 'Daily' : 'Monthly'} Cost
                        </h4>
                    </div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        ${costBreakdown.total.toFixed(2)}
                    </div>
                </div>

                <div className="space-y-3 mt-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Clusters:</span>
                        <span className="font-semibold">${costBreakdown.clusters.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">SQL Warehouses:</span>
                        <span className="font-semibold">${costBreakdown.sqlWarehouses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Streaming:</span>
                        <span className="font-semibold">${costBreakdown.streaming.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Storage:</span>
                        <span className="font-semibold">${costBreakdown.storage.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {optimizationSuggestions.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                        Cost Optimization Suggestions
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-xs text-yellow-700 dark:text-yellow-300">
                        {optimizationSuggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Cost estimates are approximate and based on Azure Databricks pricing.</p>
                <p>Actual costs may vary based on usage patterns, data volume, and region.</p>
            </div>
        </div>
    );
}

