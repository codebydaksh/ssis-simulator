import { SSISComponent, Connection } from './types';

export interface PerformanceIssue {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    componentId: string;
    componentName: string;
    issue: string;
    impact: string;
    recommendation: string;
    estimatedImprovement?: string;
}

export interface PerformanceAnalysis {
    score: number; // 0-100
    issues: PerformanceIssue[];
    summary: {
        shuffleOperations: number;
        dataSkew: boolean;
        cachingOpportunities: number;
        broadcastJoinOpportunities: number;
        zOrderingOpportunities: number;
    };
}

export function analyzeDatabricksPerformance(
    components: SSISComponent[],
    connections: Connection[]
): PerformanceAnalysis {
    const databricksComponents = components.filter(c =>
        ['notebook', 'dataSource', 'transformation', 'output', 'orchestration', 'cluster'].includes(c.type)
    );

    if (databricksComponents.length === 0) {
        return {
            score: 100,
            issues: [],
            summary: {
                shuffleOperations: 0,
                dataSkew: false,
                cachingOpportunities: 0,
                broadcastJoinOpportunities: 0,
                zOrderingOpportunities: 0
            }
        };
    }

    const issues: PerformanceIssue[] = [];
    let score = 100;

    // Analyze shuffle operations
    const shuffleOperations = countShuffleOperations(databricksComponents, connections);
    if (shuffleOperations > 5) {
        score -= 10;
        issues.push({
            id: 'shuffle-excessive',
            severity: 'warning',
            componentId: '',
            componentName: 'Pipeline',
            issue: `Excessive shuffle operations detected (${shuffleOperations})`,
            impact: 'High network overhead and slower execution',
            recommendation: 'Reduce joins and groupBy operations. Consider bucketing for frequently joined tables.',
            estimatedImprovement: '20-30% faster execution'
        });
    }

    // Detect data skew
    const hasDataSkew = detectDataSkew(databricksComponents);
    if (hasDataSkew) {
        score -= 15;
        issues.push({
            id: 'data-skew',
            severity: 'warning',
            componentId: '',
            componentName: 'Pipeline',
            issue: 'Potential data skew detected in groupBy operations',
            impact: 'Uneven workload distribution, some tasks take much longer',
            recommendation: 'Consider salting keys or using different partitioning strategy',
            estimatedImprovement: '30-50% faster execution'
        });
    }

    // Find caching opportunities
    const cachingOpportunities = findCachingOpportunities(databricksComponents, connections);
    if (cachingOpportunities > 0) {
        score -= 5 * Math.min(cachingOpportunities, 3);
        issues.push({
            id: 'caching-opportunity',
            severity: 'info',
            componentId: '',
            componentName: 'Pipeline',
            issue: `${cachingOpportunities} DataFrame(s) reused multiple times without caching`,
            impact: 'Repeated computation of same data',
            recommendation: 'Cache DataFrames that are used multiple times using df.cache() or df.persist()',
            estimatedImprovement: '10-20% faster execution'
        });
    }

    // Find broadcast join opportunities
    const broadcastJoinOpportunities = findBroadcastJoinOpportunities(databricksComponents);
    if (broadcastJoinOpportunities > 0) {
        score -= 5;
        issues.push({
            id: 'broadcast-join',
            severity: 'info',
            componentId: '',
            componentName: 'Pipeline',
            issue: `${broadcastJoinOpportunities} join(s) could use broadcast for small tables`,
            impact: 'Unnecessary shuffle operations for small lookup tables',
            recommendation: 'Use broadcast joins for tables < 2GB. Add .hint("broadcast") to join operations',
            estimatedImprovement: '15-25% faster execution'
        });
    }

    // Find Z-ordering opportunities
    const zOrderingOpportunities = findZOrderingOpportunities(databricksComponents);
    if (zOrderingOpportunities > 0) {
        score -= 5;
        issues.push({
            id: 'z-ordering',
            severity: 'info',
            componentId: '',
            componentName: 'Pipeline',
            issue: `${zOrderingOpportunities} Delta table(s) missing Z-ordering on filtered columns`,
            impact: 'Slower query performance on filtered columns',
            recommendation: 'Add Z-ordering on frequently filtered columns using OPTIMIZE ZORDER BY',
            estimatedImprovement: '20-40% faster queries'
        });
    }

    // Check for missing AQE
    const clusters = databricksComponents.filter(c => c.type === 'cluster');
    clusters.forEach(cluster => {
        const props = cluster.properties || {};
        const runtimeVersion = props.runtimeVersion as string || '';
        const sparkConfig = props.sparkConfig as Record<string, string> | undefined;
        
        if (runtimeVersion.includes('13.') && (!sparkConfig || sparkConfig['spark.sql.adaptive.enabled'] !== 'true')) {
            score -= 10;
            issues.push({
                id: 'aqe-missing',
                severity: 'warning',
                componentId: cluster.id,
                componentName: cluster.name,
                issue: 'Adaptive Query Execution (AQE) not enabled',
                impact: 'Missing automatic query optimization',
                recommendation: 'Enable AQE by setting spark.sql.adaptive.enabled=true in Spark config',
                estimatedImprovement: '10-30% faster execution'
            });
        }
    });

    // Check for missing Photon
    const sqlWarehouses = databricksComponents.filter(c => c.category === 'SQLWarehouse');
    sqlWarehouses.forEach(warehouse => {
        const props = warehouse.properties || {};
        if (!props.enablePhoton) {
            score -= 15;
            issues.push({
                id: 'photon-missing',
                severity: 'warning',
                componentId: warehouse.id,
                componentName: warehouse.name,
                issue: 'Photon engine not enabled for SQL warehouse',
                impact: 'Missing 2-3x performance improvement for SQL workloads',
                recommendation: 'Enable Photon in SQL warehouse settings (requires runtime 11.3 LTS+)',
                estimatedImprovement: '2-3x faster SQL queries'
            });
        }
    });

    // Check for missing partitioning
    const deltaSinks = databricksComponents.filter(c => c.category === 'DeltaTableSink');
    deltaSinks.forEach(sink => {
        const props = sink.properties || {};
        const partitionBy = props.partitionBy;
        if (!partitionBy || !Array.isArray(partitionBy) || partitionBy.length === 0) {
            score -= 5;
            issues.push({
                id: 'partitioning-missing',
                severity: 'info',
                componentId: sink.id,
                componentName: sink.name,
                issue: 'Delta table missing partitioning strategy',
                impact: 'Full table scans on filtered queries',
                recommendation: 'Add partitioning on columns used in WHERE clauses',
                estimatedImprovement: '30-50% faster queries'
            });
        }
    });

    // Check for inefficient UDFs
    const notebooksWithUDFs = databricksComponents.filter(c => {
        const code = c.properties?.code as string;
        return code && (code.includes('udf') || code.includes('@udf'));
    });
    if (notebooksWithUDFs.length > 0) {
        score -= 10;
        issues.push({
            id: 'udf-inefficient',
            severity: 'warning',
            componentId: notebooksWithUDFs[0].id,
            componentName: notebooksWithUDFs[0].name,
            issue: 'Inefficient UDFs detected',
            impact: 'UDFs are slower than built-in Spark functions',
            recommendation: 'Replace UDFs with built-in Spark functions or use pandas UDFs for better performance',
            estimatedImprovement: '20-40% faster execution'
        });
    }

    score = Math.max(0, score);

    return {
        score,
        issues,
        summary: {
            shuffleOperations,
            dataSkew: hasDataSkew,
            cachingOpportunities,
            broadcastJoinOpportunities,
            zOrderingOpportunities
        }
    };
}

function countShuffleOperations(components: SSISComponent[], connections: Connection[]): number {
    let count = 0;
    components.forEach(comp => {
        const code = comp.properties?.code as string;
        if (code) {
            const shuffleKeywords = ['groupBy', 'join', 'orderBy', 'distinct', 'repartition', 'coalesce'];
            shuffleKeywords.forEach(keyword => {
                const matches = code.match(new RegExp(keyword, 'gi'));
                if (matches) count += matches.length;
            });
        }
        if (comp.category === 'DataFrameTransform') {
            const props = comp.properties || {};
            const groupByCols = props.groupByColumns;
            if (groupByCols && Array.isArray(groupByCols) && groupByCols.length > 0) count++;
            if (props.joinType) count++;
        }
    });
    return count;
}

function detectDataSkew(components: SSISComponent[]): boolean {
    const groupByTransforms = components.filter(c =>
        c.category === 'DataFrameTransform' &&
        c.properties?.groupByColumns &&
        Array.isArray(c.properties.groupByColumns) && c.properties.groupByColumns.length > 0
    );
    return groupByTransforms.length > 2;
}

function findCachingOpportunities(components: SSISComponent[], connections: Connection[]): number {
    const transforms = components.filter((c: SSISComponent) => c.type === 'transformation');
    let opportunities = 0;
    
    transforms.forEach(transform => {
        const outgoingConnections = connections.filter((c: Connection) => c.source === transform.id);
        if (outgoingConnections.length > 1) {
            opportunities++;
        }
    });
    
    return opportunities;
}

function findBroadcastJoinOpportunities(components: SSISComponent[]): number {
    const joinTransforms = components.filter(c =>
        c.category === 'DataFrameTransform' &&
        c.properties?.joinType &&
        c.properties.joinType !== 'broadcast'
    );
    return joinTransforms.length;
}

function findZOrderingOpportunities(components: SSISComponent[]): number {
    const deltaSinks = components.filter(c => 
        c.category === 'DeltaTableSink' &&
        (!c.properties?.zOrderColumns || !Array.isArray(c.properties.zOrderColumns) || c.properties.zOrderColumns.length === 0)
    );
    return deltaSinks.length;
}

