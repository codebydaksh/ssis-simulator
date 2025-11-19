import { SSISComponent, Connection } from './types';

export interface SimulationResult {
    totalDuration: number; // in seconds
    memoryUsage: number; // in MB
    bottleneckComponentId: string | null;
    componentMetrics: ComponentMetric[];
    throughput: number; // rows per second
}

export interface ComponentMetric {
    componentId: string;
    componentName: string;
    duration: number; // seconds processing this component
    rowsProcessed: number;
    memoryImpact: 'Low' | 'Medium' | 'High';
    isBottleneck: boolean;
}

// Base processing speeds (rows per second)
const SPEEDS = {
    SOURCE_DB: 15000,
    SOURCE_FILE: 25000,
    TRANSFORM_SIMPLE: 100000, // Derived Column, Data Conversion
    TRANSFORM_COMPLEX: 40000, // Lookup, Conditional Split
    TRANSFORM_BLOCKING: 5000, // Sort, Aggregate (slower due to memory ops)
    DESTINATION_DB: 8000,
    DESTINATION_FILE: 15000,
    MULTICAST: 80000,
    UNION: 90000,
    MERGE_JOIN: 20000
};

export function simulatePerformance(
    components: SSISComponent[],
    connections: Connection[],
    totalRows: number
): SimulationResult {
    const metrics: ComponentMetric[] = [];
    let totalMemory = 50; // Base memory overhead in MB
    let slowestComponentId: string | null = null;
    let slowestSpeed = Infinity;

    // 1. Build dependency graph to propagate row counts
    // For simplicity in this v1, we assume linear flow or simple splits where rows might decrease
    // In a real engine, we'd traverse the graph. Here we estimate based on component type.

    components.forEach(comp => {
        let speed = SPEEDS.TRANSFORM_SIMPLE;
        let memory: 'Low' | 'Medium' | 'High' = 'Low';
        let rows = totalRows;

        // Determine characteristics based on component type
        if (comp.type === 'source') {
            speed = comp.category.includes('File') ? SPEEDS.SOURCE_FILE : SPEEDS.SOURCE_DB;
        } else if (comp.type === 'destination') {
            speed = comp.category.includes('File') ? SPEEDS.DESTINATION_FILE : SPEEDS.DESTINATION_DB;
        } else {
            switch (comp.category) {
                case 'Sort':
                    speed = Math.max(1000, SPEEDS.TRANSFORM_BLOCKING - (Math.log(totalRows) * 100)); // Sort gets slower with volume
                    memory = 'High';
                    totalMemory += (totalRows * 0.001); // Estimate 1KB per row
                    break;
                case 'Aggregate':
                    speed = SPEEDS.TRANSFORM_BLOCKING;
                    memory = 'Medium';
                    totalMemory += (totalRows * 0.0005);
                    rows = totalRows * 0.1; // Aggregation reduces row count
                    break;
                case 'Lookup':
                    speed = SPEEDS.TRANSFORM_COMPLEX;
                    memory = 'Medium';
                    totalMemory += 50; // Cache overhead
                    break;
                case 'MergeJoin':
                    speed = SPEEDS.MERGE_JOIN;
                    memory = 'Medium';
                    break;
                case 'Multicast':
                    speed = SPEEDS.MULTICAST;
                    break;
                case 'UnionAll':
                    speed = SPEEDS.UNION;
                    break;
                case 'ConditionalSplit':
                    speed = SPEEDS.TRANSFORM_COMPLEX;
                    break;
                default:
                    speed = SPEEDS.TRANSFORM_SIMPLE;
            }
        }

        // Calculate duration for this component
        // Duration = (Rows / Speed) + Overhead
        const duration = (rows / speed) + 0.1;

        if (speed < slowestSpeed) {
            slowestSpeed = speed;
            slowestComponentId = comp.id;
        }

        metrics.push({
            componentId: comp.id,
            componentName: comp.name,
            duration,
            rowsProcessed: rows,
            memoryImpact: memory,
            isBottleneck: false
        });
    });

    // Identify bottleneck
    if (slowestComponentId) {
        const bottleneck = metrics.find(m => m.componentId === slowestComponentId);
        if (bottleneck) bottleneck.isBottleneck = true;
    }

    // Total duration is roughly determined by the slowest component in a pipelined architecture
    // plus some latency for the pipeline to fill and drain.
    // We'll sum the top 20% slowest components to simulate backpressure.
    metrics.sort((a, b) => b.duration - a.duration);
    const pipelineLatency = metrics.reduce((acc, curr, idx) => {
        if (idx === 0) return acc + curr.duration; // Bottleneck dominates
        return acc + (curr.duration * 0.1); // Add small overhead for others
    }, 0);

    return {
        totalDuration: pipelineLatency,
        memoryUsage: Math.min(totalMemory, 16000), // Cap at 16GB
        bottleneckComponentId: slowestComponentId,
        componentMetrics: metrics,
        throughput: totalRows / pipelineLatency
    };
}

export function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}

export function formatBytes(mb: number): string {
    if (mb < 1024) return `${Math.round(mb)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
}
