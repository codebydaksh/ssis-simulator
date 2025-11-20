import { SSISComponent, Connection, ColumnSchema } from './types';

export interface ExecutionResult {
    componentId: string;
    componentName: string;
    schema: ColumnSchema[];
    sampleData: Record<string, unknown>[];
    rowCount: number;
    executionTime: number; // milliseconds
    dbuCost: number;
    executionPlan?: string;
}

export interface PipelineExecutionResult {
    results: ExecutionResult[];
    totalExecutionTime: number;
    totalDbuCost: number;
    success: boolean;
    errors: string[];
}

export function simulateDatabricksExecution(
    components: SSISComponent[],
    connections: Connection[]
): PipelineExecutionResult {
    const databricksComponents = components.filter(c =>
        ['notebook', 'dataSource', 'transformation', 'output', 'orchestration', 'cluster'].includes(c.type)
    );

    if (databricksComponents.length === 0) {
        return {
            results: [],
            totalExecutionTime: 0,
            totalDbuCost: 0,
            success: false,
            errors: ['No Databricks components found']
        };
    }

    const results: ExecutionResult[] = [];
    const errors: string[] = [];
    let totalExecutionTime = 0;
    let totalDbuCost = 0;

    // Find source components (no incoming connections)
    const sourceComponents = databricksComponents.filter(comp => {
        const hasIncoming = connections.some(conn => conn.target === comp.id);
        return !hasIncoming && (comp.type === 'dataSource' || comp.type === 'notebook');
    });

    // Process each source and follow the pipeline
    const processed = new Set<string>();
    const dataMap = new Map<string, ExecutionResult>();

    sourceComponents.forEach(source => {
        const result = executeComponent(source, databricksComponents, connections, processed, dataMap);
        if (result) {
            dataMap.set(source.id, result);
            results.push(result);
            totalExecutionTime += result.executionTime;
            totalDbuCost += result.dbuCost;
        }
    });

    return {
        results,
        totalExecutionTime,
        totalDbuCost,
        success: errors.length === 0,
        errors
    };
}

function executeComponent(
    component: SSISComponent,
    allComponents: SSISComponent[],
    connections: Connection[],
    processed: Set<string>,
    dataMap: Map<string, ExecutionResult>
): ExecutionResult | null {
    if (processed.has(component.id)) {
        return dataMap.get(component.id) || null;
    }
    processed.add(component.id);

    const props = component.properties || {};
    let schema: ColumnSchema[] = [];
    let sampleData: Record<string, unknown>[] = [];
    let rowCount = 0;
    let executionTime = 0;
    let dbuCost = 0;

    // Get input data if available
    const incomingConnections = connections.filter(c => c.target === component.id);
    let inputResult: ExecutionResult | null = null;
    if (incomingConnections.length > 0) {
        inputResult = dataMap.get(incomingConnections[0].source) || null;
    }

    switch (component.category) {
        case 'DeltaTableSource':
        case 'AzureBlobStorage':
        case 'ADLSGen2':
        case 'AzureSQLDatabase':
            schema = generateSchemaForSource(component);
            sampleData = generateSampleData(schema, 10);
            rowCount = Math.floor(Math.random() * 100000) + 10000;
            executionTime = Math.floor(Math.random() * 5000) + 1000;
            dbuCost = 0.1;
            break;

        case 'KafkaStream':
            schema = [
                { name: 'key', dataType: 'string', nullable: false },
                { name: 'value', dataType: 'string', nullable: false },
                { name: 'timestamp', dataType: 'datetime', nullable: false }
            ];
            sampleData = generateSampleData(schema, 10);
            rowCount = Math.floor(Math.random() * 10000) + 1000;
            executionTime = Math.floor(Math.random() * 2000) + 500;
            dbuCost = 0.05;
            break;

        case 'DataFrameTransform':
            if (inputResult) {
                schema = transformSchema(inputResult.schema, props);
                sampleData = transformData(inputResult.sampleData, schema, props);
                rowCount = inputResult.rowCount;
                executionTime = Math.floor(Math.random() * 3000) + 500;
                dbuCost = 0.15;
            }
            break;

        case 'DeltaLakeMerge':
            if (inputResult) {
                schema = inputResult.schema;
                sampleData = inputResult.sampleData;
                rowCount = inputResult.rowCount;
                executionTime = Math.floor(Math.random() * 4000) + 1000;
                dbuCost = 0.2;
            }
            break;

        case 'DeltaTableSink':
        case 'AzureBlobStorageSink':
        case 'ADLSGen2Sink':
            if (inputResult) {
                schema = inputResult.schema;
                sampleData = inputResult.sampleData;
                rowCount = inputResult.rowCount;
                executionTime = Math.floor(Math.random() * 2000) + 500;
                dbuCost = 0.1;
            }
            break;

        case 'PythonNotebook':
        case 'ScalaNotebook':
        case 'SQLNotebook':
            schema = inputResult?.schema || generateSchemaForSource(component);
            sampleData = inputResult?.sampleData || generateSampleData(schema, 10);
            rowCount = inputResult?.rowCount || Math.floor(Math.random() * 50000) + 5000;
            executionTime = Math.floor(Math.random() * 10000) + 2000;
            dbuCost = 0.3;
            break;

        default:
            if (inputResult) {
                schema = inputResult.schema;
                sampleData = inputResult.sampleData;
                rowCount = inputResult.rowCount;
                executionTime = Math.floor(Math.random() * 2000) + 500;
                dbuCost = 0.1;
            }
            break;
    }

    const result: ExecutionResult = {
        componentId: component.id,
        componentName: component.name,
        schema,
        sampleData,
        rowCount,
        executionTime,
        dbuCost,
        executionPlan: generateExecutionPlan(component, props)
    };

    dataMap.set(component.id, result);

    // Process downstream components
    const outgoingConnections = connections.filter(c => c.source === component.id);
    outgoingConnections.forEach(conn => {
        const targetComponent = allComponents.find(c => c.id === conn.target);
        if (targetComponent) {
            const downstreamResult = executeComponent(targetComponent, allComponents, connections, processed, dataMap);
            if (downstreamResult) {
                dataMap.set(targetComponent.id, downstreamResult);
            }
        }
    });

    return result;
}

function generateSchemaForSource(component: SSISComponent): ColumnSchema[] {
    const props = component.properties || {};
    
    if (component.category === 'DeltaTableSource') {
        return [
            { name: 'id', dataType: 'int', nullable: false },
            { name: 'name', dataType: 'string', nullable: false },
            { name: 'amount', dataType: 'decimal', nullable: true },
            { name: 'created_date', dataType: 'datetime', nullable: false }
        ];
    }

    if (component.category === 'AzureSQLDatabase') {
        return [
            { name: 'customer_id', dataType: 'int', nullable: false },
            { name: 'order_id', dataType: 'int', nullable: false },
            { name: 'order_date', dataType: 'datetime', nullable: false },
            { name: 'total_amount', dataType: 'decimal', nullable: true }
        ];
    }

    return [
        { name: 'col1', dataType: 'string', nullable: false },
        { name: 'col2', dataType: 'int', nullable: true },
        { name: 'col3', dataType: 'decimal', nullable: true }
    ];
}

function generateSampleData(schema: ColumnSchema[], count: number): Record<string, unknown>[] {
    const data: Record<string, unknown>[] = [];
    
    for (let i = 0; i < count; i++) {
        const row: Record<string, unknown> = {};
        schema.forEach(col => {
            switch (col.dataType) {
                case 'int':
                    row[col.name] = Math.floor(Math.random() * 1000) + i;
                    break;
                case 'string':
                    row[col.name] = `Sample ${col.name} ${i + 1}`;
                    break;
                case 'decimal':
                    row[col.name] = (Math.random() * 1000).toFixed(2);
                    break;
                case 'datetime':
                    row[col.name] = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString();
                    break;
                case 'boolean':
                    row[col.name] = Math.random() > 0.5;
                    break;
                default:
                    row[col.name] = `Value ${i + 1}`;
            }
        });
        data.push(row);
    }
    
    return data;
}

function transformSchema(inputSchema: ColumnSchema[], props: Record<string, unknown>): ColumnSchema[] {
    const operations = props.operations as string[] || [];
    
    if (operations.includes('select')) {
        const selectCols = props.selectColumns as string[] || [];
        if (selectCols.includes('*')) {
            return inputSchema;
        }
        return inputSchema.filter(col => selectCols.includes(col.name));
    }
    
    return inputSchema;
}

function transformData(
    inputData: Record<string, unknown>[],
    schema: ColumnSchema[],
    props: Record<string, unknown>
): Record<string, unknown>[] {
    let data = [...inputData];
    
    const operations = props.operations as string[] || [];
    
    if (operations.includes('filter') && props.filterCondition) {
        // Simple filter simulation - keep 70% of rows
        data = data.filter((_, i) => i % 3 !== 0);
    }
    
    if (operations.includes('groupBy')) {
        // Simulate aggregation - reduce to unique groups
        const groupByCols = props.groupByColumns as string[] || [];
        if (groupByCols.length > 0) {
            const uniqueGroups = new Set<string>();
            data = data.filter(row => {
                const key = groupByCols.map(col => String(row[col])).join('|');
                if (!uniqueGroups.has(key)) {
                    uniqueGroups.add(key);
                    return true;
                }
                return false;
            });
        }
    }
    
    return data.slice(0, 10); // Return sample
}

function generateExecutionPlan(component: SSISComponent, props: Record<string, unknown>): string {
    const plans: string[] = [];
    
    plans.push(`== Physical Plan ==`);
    plans.push(`* ${component.category}`);
    
    if (component.category === 'DataFrameTransform') {
        const operations = props.operations as string[] || [];
        operations.forEach(op => {
            plans.push(`  +- ${op.toUpperCase()}`);
        });
    }
    
    if (component.category === 'DeltaTableSink') {
        const mode = props.mode as string || 'append';
        plans.push(`  +- WriteMode: ${mode}`);
        const partitionBy = props.partitionBy as string[] || [];
        if (partitionBy.length > 0) {
            plans.push(`  +- PartitionBy: ${partitionBy.join(', ')}`);
        }
    }
    
    plans.push(`  +- Estimated Rows: ${Math.floor(Math.random() * 100000) + 10000}`);
    plans.push(`  +- Estimated Size: ${(Math.random() * 100).toFixed(2)} MB`);
    
    return plans.join('\n');
}

