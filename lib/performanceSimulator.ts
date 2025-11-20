import { SSISComponent, Connection, PlatformType } from './types';

export interface SimulationResult {
    totalDuration: number; // in seconds
    memoryUsage: number; // in MB
    bottleneckComponentId: string | null;
    componentMetrics: ComponentMetric[];
    throughput: number; // rows per second
    // ADF-specific metrics
    estimatedDIUs?: number;
    estimatedCost?: number; // in USD
    clusterSize?: string;
    platform: PlatformType;
}

export interface ComponentMetric {
    componentId: string;
    componentName: string;
    duration: number; // seconds processing this component
    rowsProcessed: number;
    memoryImpact: 'Low' | 'Medium' | 'High';
    isBottleneck: boolean;
    // ADF-specific
    activityExecutionCost?: number; // in USD
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

// ADF Activity processing speeds and characteristics
const ADF_SPEEDS = {
    COPY_DATA: 50000, // rows per second with default DIUs
    MAPPING_DATA_FLOW: 30000, // rows per second on medium cluster
    WEB_ACTIVITY: 1, // Not row-based, but has latency
    WAIT: 1, // Duration is configured
    DATABRICKS: 80000, // Fast on optimized cluster
    EXECUTE_PIPELINE: 0.5, // Overhead for launching child pipeline
};

// ADF Pricing (approximate, as of 2024)
const ADF_PRICING = {
    ORCHESTRATION_PER_1000_RUNS: 1.00, // USD per 1000 activity runs
    DIU_HOUR: 0.25, // USD per DIU-hour for Copy Data
    DATA_FLOW_VCORE_HOUR: 0.274, // USD per vCore-hour for Data Flow
    PIPELINE_EXECUTION_PER_1000: 1.00, // USD per 1000 pipeline executions
};

export function simulatePerformance(
    components: SSISComponent[],
    connections: Connection[],
    totalRows: number,
    platform: PlatformType = 'ssis'
): SimulationResult {
    if (platform === 'adf') {
        return simulateADFPerformance(components, connections, totalRows);
    }
    return simulateSSISPerformance(components, connections, totalRows);
}

function simulateSSISPerformance(
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
        throughput: totalRows / pipelineLatency,
        platform: 'ssis'
    };
}

function simulateADFPerformance(
    components: SSISComponent[],
    connections: Connection[],
    totalRows: number
): SimulationResult {
    const metrics: ComponentMetric[] = [];
    let totalCost = 0;
    let totalDIUs = 0;
    let slowestComponentId: string | null = null;
    let slowestDuration = 0;

    components.forEach(comp => {
        let speed = ADF_SPEEDS.COPY_DATA;
        let memory: 'Low' | 'Medium' | 'High' = 'Low';
        let rows = totalRows;
        let activityCost = 0;
        let duration = 0;

        switch (comp.category) {
            case 'CopyData':
                // DIUs scale with data volume
                const estimatedDIUs = Math.min(256, Math.max(4, Math.ceil(totalRows / 1000000)));
                totalDIUs += estimatedDIUs;

                // Speed increases with DIUs
                speed = ADF_SPEEDS.COPY_DATA * (estimatedDIUs / 4);
                duration = (rows / speed) + 2; // 2s overhead for setup

                // Cost = DIU-hours
                const durationHours = duration / 3600;
                activityCost = estimatedDIUs * durationHours * ADF_PRICING.DIU_HOUR;
                memory = 'Low';
                break;

            case 'MappingDataFlow':
                // Data Flow uses Spark clusters
                const vCores = Math.min(32, Math.max(8, Math.ceil(totalRows / 500000)));
                speed = ADF_SPEEDS.MAPPING_DATA_FLOW * (vCores / 8);

                // Include cluster startup time (3-5 minutes unless using TTL)
                const startupTime = 180; // 3 minutes
                const processingTime = (rows / speed);
                duration = startupTime + processingTime;

                const totalHours = duration / 3600;
                activityCost = vCores * totalHours * ADF_PRICING.DATA_FLOW_VCORE_HOUR;
                memory = 'High';
                break;

            case 'DatabricksNotebook':
                speed = ADF_SPEEDS.DATABRICKS;
                duration = (rows / speed) + 60; // 1 min cluster attach overhead
                // Databricks has separate pricing, we'll approximate
                activityCost = (duration / 3600) * 2.0; // Approximate DBU cost
                memory = 'High';
                break;

            case 'WebActivity':
                duration = 2; // 2 seconds average API call
                activityCost = ADF_PRICING.ORCHESTRATION_PER_1000_RUNS / 1000;
                memory = 'Low';
                rows = 1; // Not row-based
                break;

            case 'Wait':
                const props = (comp.properties || {}) as Record<string, any>;
                duration = parseInt(String(props.waitTimeInSeconds || 1));
                activityCost = 0; // Wait is free
                memory = 'Low';
                rows = 0;
                break;

            case 'ForEach':
            case 'IfCondition':
            case 'Switch':
                duration = 1; // Orchestration overhead
                activityCost = ADF_PRICING.ORCHESTRATION_PER_1000_RUNS / 1000;
                memory = 'Low';
                rows = 0;
                break;

            case 'ExecutePipeline':
                duration = 5; // Child pipeline execution overhead
                activityCost = (ADF_PRICING.ORCHESTRATION_PER_1000_RUNS / 1000) + (ADF_PRICING.PIPELINE_EXECUTION_PER_1000 / 1000);
                memory = 'Low';
                rows = 0;
                break;

            case 'SetVariable':
            case 'GetMetadata':
            case 'Validation':
            case 'Filter':
                duration = 0.5;
                activityCost = ADF_PRICING.ORCHESTRATION_PER_1000_RUNS / 1000;
                memory = 'Low';
                rows = 0;
                break;

            default:
                duration = 1;
                activityCost = ADF_PRICING.ORCHESTRATION_PER_1000_RUNS / 1000;
                memory = 'Low';
        }

        totalCost += activityCost;

        if (duration > slowestDuration) {
            slowestDuration = duration;
            slowestComponentId = comp.id;
        }

        metrics.push({
            componentId: comp.id,
            componentName: comp.name,
            duration,
            rowsProcessed: rows,
            memoryImpact: memory,
            isBottleneck: false,
            activityExecutionCost: activityCost
        });
    });

    // Identify bottleneck
    if (slowestComponentId) {
        const bottleneck = metrics.find(m => m.componentId === slowestComponentId);
        if (bottleneck) bottleneck.isBottleneck = true;
    }

    // ADF pipelines run activities sequentially unless explicitly parallel
    // For simplicity, we sum all durations (pessimistic, sequential execution)
    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);

    // Determine cluster size recommendation
    let clusterSize = 'Small (4-8 cores)';
    if (totalRows > 10000000) {
        clusterSize = 'Large (16-32 cores)';
    } else if (totalRows > 1000000) {
        clusterSize = 'Medium (8-16 cores)';
    }

    return {
        totalDuration,
        memoryUsage: 0, // ADF is serverless, memory is managed by the service
        bottleneckComponentId: slowestComponentId,
        componentMetrics: metrics,
        throughput: totalRows > 0 ? totalRows / totalDuration : 0,
        estimatedDIUs: totalDIUs || 4,
        estimatedCost: totalCost,
        clusterSize,
        platform: 'adf'
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

export function formatCost(usd: number): string {
    if (usd < 0.01) return `$${(usd * 100).toFixed(4)}c`;
    return `$${usd.toFixed(4)}`;
}
