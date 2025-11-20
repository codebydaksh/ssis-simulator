import { SSISComponent, Connection } from './types';

export interface GeneratedCode {
    pyspark: string;
    sparkSql: string;
    dltDefinition?: string;
    jobJson?: string;
}

export function generateDatabricksCode(
    components: SSISComponent[],
    connections: Connection[]
): GeneratedCode {
    const databricksComponents = components.filter(c =>
        ['notebook', 'dataSource', 'transformation', 'output', 'orchestration', 'cluster'].includes(c.type)
    );

    if (databricksComponents.length === 0) {
        return {
            pyspark: '# No Databricks components found',
            sparkSql: '-- No Databricks components found'
        };
    }

    const pysparkCode = generatePySparkCode(databricksComponents, connections);
    const sparkSqlCode = generateSparkSQLCode(databricksComponents, connections);
    const dltDefinition = generateDLTDefinition(databricksComponents, connections);
    const jobJson = generateJobJSON(databricksComponents, connections);

    return {
        pyspark: pysparkCode,
        sparkSql: sparkSqlCode,
        dltDefinition,
        jobJson
    };
}

function generatePySparkCode(components: SSISComponent[], connections: Connection[]): string {
    const lines: string[] = [];
    
    lines.push('# Generated PySpark Code for Databricks Pipeline');
    lines.push('# This code can be executed in a Databricks notebook');
    lines.push('');
    lines.push('from pyspark.sql import SparkSession');
    lines.push('from pyspark.sql.functions import col, when, lit, count, sum as spark_sum');
    lines.push('from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType, TimestampType');
    lines.push('');
    lines.push('# Initialize Spark Session');
    lines.push('spark = SparkSession.builder.appName("DatabricksPipeline").getOrCreate()');
    lines.push('');

    // Find source components (no incoming connections)
    const sourceComponents = components.filter(comp => {
        const hasIncoming = connections.some(conn => conn.target === comp.id);
        return !hasIncoming && (comp.type === 'dataSource' || comp.type === 'notebook');
    });

    // Process each source and follow the pipeline
    const processed = new Set<string>();
    const dataFrameMap = new Map<string, string>();

    sourceComponents.forEach(source => {
        const dfName = processComponent(source, components, connections, processed, dataFrameMap, lines);
        if (dfName) {
            dataFrameMap.set(source.id, dfName);
        }
    });

    lines.push('');
    lines.push('# Pipeline execution complete');
    lines.push('# Note: This is a generated template. Customize based on your specific requirements.');

    return lines.join('\n');
}

function processComponent(
    component: SSISComponent,
    allComponents: SSISComponent[],
    connections: Connection[],
    processed: Set<string>,
    dataFrameMap: Map<string, string>,
    lines: string[]
): string | null {
    if (processed.has(component.id)) {
        return dataFrameMap.get(component.id) || null;
    }
    processed.add(component.id);

    const dfName = `df_${component.id.substring(0, 8)}`;
    const props = component.properties || {};

    switch (component.category) {
        case 'DeltaTableSource':
            const catalog = props.catalog as string || 'main';
            const schema = props.schema as string || 'default';
            const table = props.table as string || 'table_name';
            lines.push(`# Read from Delta Table: ${catalog}.${schema}.${table}`);
            lines.push(`${dfName} = spark.read.table("${catalog}.${schema}.${table}")`);
            break;

        case 'AzureBlobStorage':
            const storageAccount = props.storageAccount as string || 'storageaccount';
            const container = props.container as string || 'container';
            const path = props.path as string || '/path/to/data';
            const format = props.format as string || 'parquet';
            lines.push(`# Read from Azure Blob Storage: ${storageAccount}/${container}${path}`);
            lines.push(`${dfName} = spark.read.format("${format}") \\`);
            lines.push(`    .option("header", "true") \\`);
            lines.push(`    .load("wasbs://${container}@${storageAccount}.blob.core.windows.net${path}")`);
            break;

        case 'ADLSGen2':
            const adlsAccount = props.storageAccount as string || 'storageaccount';
            const adlsContainer = props.container as string || 'container';
            const adlsPath = props.path as string || '/path/to/data';
            const adlsFormat = props.format as string || 'delta';
            lines.push(`# Read from ADLS Gen2: ${adlsAccount}/${adlsContainer}${adlsPath}`);
            lines.push(`${dfName} = spark.read.format("${adlsFormat}") \\`);
            lines.push(`    .load("abfss://${adlsContainer}@${adlsAccount}.dfs.core.windows.net${adlsPath}")`);
            break;

        case 'AzureSQLDatabase':
            const server = props.server as string || 'server.database.windows.net';
            const database = props.database as string || 'database';
            const sqlTable = props.table as string || 'table';
            lines.push(`# Read from Azure SQL Database: ${server}/${database}.${sqlTable}`);
            lines.push(`${dfName} = spark.read.format("jdbc") \\`);
            lines.push(`    .option("url", "jdbc:sqlserver://${server}:1433;database=${database}") \\`);
            lines.push(`    .option("dbtable", "${sqlTable}") \\`);
            lines.push(`    .option("user", "dbutils.secrets.get(scope='keyvault', key='sql-user')") \\`);
            lines.push(`    .option("password", "dbutils.secrets.get(scope='keyvault', key='sql-password')") \\`);
            lines.push(`    .load()`);
            break;

        case 'KafkaStream':
            const bootstrapServers = props.bootstrapServers as string || 'kafka-broker:9092';
            const topic = props.topic as string || 'topic';
            lines.push(`# Read from Kafka Stream: ${topic}`);
            lines.push(`${dfName} = spark.readStream.format("kafka") \\`);
            lines.push(`    .option("kafka.bootstrap.servers", "${bootstrapServers}") \\`);
            lines.push(`    .option("subscribe", "${topic}") \\`);
            lines.push(`    .option("startingOffsets", "${props.startingOffsets || 'latest'}") \\`);
            lines.push(`    .load()`);
            break;

        case 'DataFrameTransform':
            const incomingConnections = connections.filter(c => c.target === component.id);
            if (incomingConnections.length > 0) {
                const sourceDf = dataFrameMap.get(incomingConnections[0].source);
                if (sourceDf) {
                    lines.push(`# Transform: ${component.name}`);
                    const operations = props.operations as string[] || [];
                    let currentDf = sourceDf;
                    
                    if (operations.includes('select')) {
                        const selectCols = props.selectColumns as string[] || ['*'];
                        if (selectCols.includes('*')) {
                            lines.push(`${dfName} = ${currentDf}.select("*")`);
                        } else {
                            const colList = selectCols.map(c => `col("${c}")`).join(', ');
                            lines.push(`${dfName} = ${currentDf}.select(${colList})`);
                        }
                        currentDf = dfName;
                    }
                    
                    if (operations.includes('filter') && props.filterCondition) {
                        lines.push(`${dfName} = ${currentDf}.filter("${props.filterCondition}")`);
                        currentDf = dfName;
                    }
                    
                    if (operations.includes('groupBy')) {
                        const groupByCols = props.groupByColumns as string[] || [];
                        if (groupByCols.length > 0) {
                            const colList = groupByCols.map(c => `col("${c}")`).join(', ');
                            lines.push(`${dfName} = ${currentDf}.groupBy(${colList})`);
                            const aggregations = props.aggregations as string[] || [];
                            if (aggregations.length > 0) {
                                lines.push(`    .agg(${aggregations.map(a => a).join(', ')})`);
                            }
                        }
                    }
                }
            }
            break;

        case 'DeltaLakeMerge':
            const targetTable = props.targetTable as string || 'target_table';
            const sourceTable = props.sourceTable as string || 'source_table';
            const mergeCondition = props.mergeCondition as string || 'id = id';
            lines.push(`# Delta Lake MERGE: ${targetTable}`);
            lines.push(`from delta.tables import DeltaTable`);
            lines.push(`target = DeltaTable.forName(spark, "${targetTable}")`);
            lines.push(`source = spark.table("${sourceTable}")`);
            lines.push(`target.alias("target").merge(`);
            lines.push(`    source.alias("source"),`);
            lines.push(`    "${mergeCondition}"`);
            lines.push(`).whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()`);
            break;

        case 'DeltaTableSink':
            const sinkCatalog = props.catalog as string || 'main';
            const sinkSchema = props.schema as string || 'default';
            const sinkTable = props.table as string || 'output_table';
            const mode = props.mode as string || 'append';
            const incomingSinkConnections = connections.filter(c => c.target === component.id);
            if (incomingSinkConnections.length > 0) {
                const sourceDf = dataFrameMap.get(incomingSinkConnections[0].source);
                if (sourceDf) {
                    lines.push(`# Write to Delta Table: ${sinkCatalog}.${sinkSchema}.${sinkTable}`);
                    if (mode === 'overwrite') {
                        lines.push(`${sourceDf}.write.format("delta").mode("overwrite").option("overwriteSchema", "true") \\`);
                    } else {
                        lines.push(`${sourceDf}.write.format("delta").mode("${mode}") \\`);
                    }
                    const partitionBy = props.partitionBy as string[] || [];
                    if (partitionBy.length > 0) {
                        lines.push(`    .partitionBy(${partitionBy.map(p => `"${p}"`).join(', ')}) \\`);
                    }
                    lines.push(`    .saveAsTable("${sinkCatalog}.${sinkSchema}.${sinkTable}")`);
                }
            }
            break;

        case 'PythonNotebook':
        case 'ScalaNotebook':
        case 'SQLNotebook':
        case 'RNotebook':
            const code = props.code as string || '';
            if (code) {
                lines.push(`# Notebook: ${component.name}`);
                lines.push(code);
            }
            break;

        default:
            lines.push(`# Component: ${component.name} (${component.category})`);
            lines.push(`# TODO: Implement code generation for ${component.category}`);
            break;
    }

    dataFrameMap.set(component.id, dfName);

    // Process downstream components
    const outgoingConnections = connections.filter(c => c.source === component.id);
    outgoingConnections.forEach(conn => {
        const targetComponent = allComponents.find(c => c.id === conn.target);
        if (targetComponent) {
            processComponent(targetComponent, allComponents, connections, processed, dataFrameMap, lines);
        }
    });

    return dfName;
}

function generateSparkSQLCode(components: SSISComponent[], connections: Connection[]): string {
    const lines: string[] = [];
    
    lines.push('-- Generated Spark SQL Code for Databricks Pipeline');
    lines.push('-- This code can be executed in a Databricks SQL notebook or SQL Warehouse');
    lines.push('');

    const sourceComponents = components.filter(comp => {
        const hasIncoming = connections.some(conn => conn.target === comp.id);
        return !hasIncoming && comp.type === 'dataSource';
    });

    sourceComponents.forEach(source => {
        const props = source.properties || {};
        if (source.category === 'DeltaTableSource') {
            const catalog = props.catalog as string || 'main';
            const schema = props.schema as string || 'default';
            const table = props.table as string || 'table_name';
            lines.push(`-- Read from Delta Table: ${catalog}.${schema}.${table}`);
            lines.push(`SELECT * FROM ${catalog}.${schema}.${table} LIMIT 10;`);
            lines.push('');
        }
    });

    return lines.join('\n');
}

function generateDLTDefinition(components: SSISComponent[], connections: Connection[]): string | undefined {
    const dltComponents = components.filter(c => c.category === 'DeltaLiveTables');
    if (dltComponents.length === 0) {
        return undefined;
    }

    const lines: string[] = [];
    lines.push('{');
    lines.push('  "pipeline": {');
    lines.push('    "name": "generated_dlt_pipeline",');
    lines.push('    "target": "main.default",');
    lines.push('    "storage": "/pipelines/storage",');
    lines.push('    "libraries": [],');
    lines.push('    "clusters": [],');
    lines.push('    "notebooks": []');
    lines.push('  }');
    lines.push('}');

    return lines.join('\n');
}

function generateJobJSON(components: SSISComponent[], connections: Connection[]): string | undefined {
    const jobComponents = components.filter(c => c.type === 'orchestration');
    if (jobComponents.length === 0) {
        return undefined;
    }

    const tasks = jobComponents.map(comp => {
        const props = comp.properties || {};
        if (comp.category === 'NotebookTask') {
            return {
                task_key: comp.name.toLowerCase().replace(/\s+/g, '_'),
                notebook_task: {
                    notebook_path: props.notebookPath as string || '/path/to/notebook',
                    base_parameters: props.parameters as Record<string, string> || {}
                }
            };
        }
        return null;
    }).filter(t => t !== null);

    const jobDef = {
        name: 'generated_databricks_job',
        tasks: tasks,
        timeout_seconds: 3600,
        max_concurrent_runs: 1
    };

    return JSON.stringify(jobDef, null, 2);
}

