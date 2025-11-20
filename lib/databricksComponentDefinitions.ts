import { DatabricksComponentType, DataType } from './types';

export interface DatabricksComponentDefinition {
    type: DatabricksComponentType;
    category: string;
    name: string;
    icon: string;
    description: string;
    useCases: string[];
    dataType: DataType;
    defaultProperties?: Record<string, unknown>;
}

export const DATABRICKS_COMPONENT_DEFINITIONS: DatabricksComponentDefinition[] = [
    // --- NOTEBOOKS (5 types) ---
    {
        type: 'notebook',
        category: 'PythonNotebook',
        name: 'Python Notebook',
        icon: 'FileCode',
        description: 'Python notebook for data processing and analysis.',
        useCases: ['Data transformation', 'Feature engineering', 'Machine learning'],
        dataType: 'structured',
        defaultProperties: {
            language: 'python',
            code: '# Write your PySpark code here\nfrom pyspark.sql import SparkSession\n\nspark = SparkSession.builder.appName("MyApp").getOrCreate()',
            parameters: {},
            clusterId: ''
        }
    },
    {
        type: 'notebook',
        category: 'ScalaNotebook',
        name: 'Scala Notebook',
        icon: 'FileCode',
        description: 'Scala notebook for high-performance data processing.',
        useCases: ['High-performance transformations', 'Complex algorithms', 'Type-safe processing'],
        dataType: 'structured',
        defaultProperties: {
            language: 'scala',
            code: '// Write your Scala code here\nimport org.apache.spark.sql.SparkSession\n\nval spark = SparkSession.builder.appName("MyApp").getOrCreate()',
            parameters: {},
            clusterId: ''
        }
    },
    {
        type: 'notebook',
        category: 'SQLNotebook',
        name: 'SQL Notebook',
        icon: 'Database',
        description: 'SQL notebook for querying Delta Lake and other data sources.',
        useCases: ['Ad-hoc queries', 'Data exploration', 'SQL-based transformations'],
        dataType: 'structured',
        defaultProperties: {
            language: 'sql',
            code: '-- Write your SQL queries here\nSELECT * FROM delta.`/path/to/table` LIMIT 10;',
            parameters: {},
            clusterId: ''
        }
    },
    {
        type: 'notebook',
        category: 'RNotebook',
        name: 'R Notebook',
        icon: 'FileCode',
        description: 'R notebook for statistical analysis and visualization.',
        useCases: ['Statistical analysis', 'Data visualization', 'R-based ML'],
        dataType: 'structured',
        defaultProperties: {
            language: 'r',
            code: '# Write your R code here\nlibrary(SparkR)\n\nsparkR.session()',
            parameters: {},
            clusterId: ''
        }
    },
    {
        type: 'notebook',
        category: 'MarkdownNotebook',
        name: 'Markdown Notebook',
        icon: 'FileText',
        description: 'Markdown notebook for documentation and explanations.',
        useCases: ['Documentation', 'Tutorials', 'Code explanations'],
        dataType: 'text',
        defaultProperties: {
            language: 'markdown',
            content: '# Documentation\n\nWrite your markdown here'
        }
    },

    // --- DATA SOURCES (6 types) ---
    {
        type: 'dataSource',
        category: 'DeltaTableSource',
        name: 'Delta Table Source',
        icon: 'Database',
        description: 'Read data from a Delta Lake table in Unity Catalog or DBFS.',
        useCases: ['Read from bronze/silver/gold tables', 'Incremental loads', 'Time travel queries'],
        dataType: 'structured',
        defaultProperties: {
            catalog: 'main',
            schema: 'default',
            table: '',
            operation: 'read',
            version: null,
            timestamp: null
        }
    },
    {
        type: 'dataSource',
        category: 'AzureBlobStorage',
        name: 'Azure Blob Storage',
        icon: 'Cloud',
        description: 'Read data from Azure Blob Storage using Auto Loader or direct read.',
        useCases: ['Ingest files from blob storage', 'Streaming file ingestion', 'Batch file processing'],
        dataType: 'structured',
        defaultProperties: {
            storageAccount: '',
            container: '',
            path: '',
            format: 'parquet',
            autoLoader: true
        }
    },
    {
        type: 'dataSource',
        category: 'ADLSGen2',
        name: 'ADLS Gen2',
        icon: 'HardDrive',
        description: 'Read data from Azure Data Lake Storage Gen2.',
        useCases: ['Lakehouse architecture', 'Large-scale data ingestion', 'Multi-format support'],
        dataType: 'structured',
        defaultProperties: {
            storageAccount: '',
            container: '',
            path: '',
            format: 'delta',
            authentication: 'managedIdentity'
        }
    },
    {
        type: 'dataSource',
        category: 'AzureSQLDatabase',
        name: 'Azure SQL Database',
        icon: 'Database',
        description: 'Read data from Azure SQL Database using JDBC connector.',
        useCases: ['Extract from SQL databases', 'Incremental loads', 'CDC patterns'],
        dataType: 'structured',
        defaultProperties: {
            server: '',
            database: '',
            table: '',
            query: '',
            authentication: 'sql'
        }
    },
    {
        type: 'dataSource',
        category: 'SnowflakeConnector',
        name: 'Snowflake Connector',
        icon: 'Snowflake',
        description: 'Read data from Snowflake data warehouse.',
        useCases: ['Cross-cloud analytics', 'Data federation', 'Unified querying'],
        dataType: 'structured',
        defaultProperties: {
            account: '',
            warehouse: '',
            database: '',
            schema: '',
            table: ''
        }
    },
    {
        type: 'dataSource',
        category: 'KafkaStream',
        name: 'Kafka Stream',
        icon: 'Radio',
        description: 'Read streaming data from Apache Kafka.',
        useCases: ['Real-time data ingestion', 'Event streaming', 'Stream processing'],
        dataType: 'structured',
        defaultProperties: {
            bootstrapServers: '',
            topic: '',
            startingOffsets: 'latest',
            maxOffsetsPerTrigger: null
        }
    },

    // --- TRANSFORMATIONS (8 types) ---
    {
        type: 'transformation',
        category: 'DataFrameTransform',
        name: 'DataFrame Transform',
        icon: 'Shuffle',
        description: 'Transform data using PySpark DataFrame operations (select, filter, groupBy, join).',
        useCases: ['Data cleansing', 'Column transformations', 'Aggregations', 'Joins'],
        dataType: 'structured',
        defaultProperties: {
            operations: ['select', 'filter'],
            selectColumns: [],
            filterCondition: '',
            groupByColumns: [],
            aggregations: [],
            joinType: 'inner',
            joinColumns: []
        }
    },
    {
        type: 'transformation',
        category: 'DeltaLakeMerge',
        name: 'Delta Lake Merge (UPSERT)',
        icon: 'GitMerge',
        description: 'Perform UPSERT operations on Delta tables using MERGE statement.',
        useCases: ['Incremental updates', 'Change data capture', 'SCD Type 1'],
        dataType: 'structured',
        defaultProperties: {
            targetTable: '',
            sourceTable: '',
            mergeCondition: '',
            whenMatched: 'update',
            whenNotMatched: 'insert'
        }
    },
    {
        type: 'transformation',
        category: 'DeltaLakeTimeTravel',
        name: 'Delta Lake Time Travel',
        icon: 'Clock',
        description: 'Query historical versions of Delta tables using time travel.',
        useCases: ['Audit trails', 'Data versioning', 'Point-in-time recovery'],
        dataType: 'structured',
        defaultProperties: {
            table: '',
            version: null,
            timestamp: null,
            operation: 'read'
        }
    },
    {
        type: 'transformation',
        category: 'SparkSQLQuery',
        name: 'Spark SQL Query',
        icon: 'Database',
        description: 'Execute Spark SQL queries for complex transformations.',
        useCases: ['Complex SQL logic', 'Window functions', 'CTEs and subqueries'],
        dataType: 'structured',
        defaultProperties: {
            query: 'SELECT * FROM delta.`/path/to/table`',
            tempView: ''
        }
    },
    {
        type: 'transformation',
        category: 'MLflowModelTraining',
        name: 'MLflow Model Training',
        icon: 'Brain',
        description: 'Train machine learning models with MLflow tracking.',
        useCases: ['Model training', 'Hyperparameter tuning', 'Experiment tracking'],
        dataType: 'structured',
        defaultProperties: {
            experimentName: '',
            algorithm: 'xgboost',
            hyperparameters: {},
            metrics: []
        }
    },
    {
        type: 'transformation',
        category: 'MLflowModelServing',
        name: 'MLflow Model Serving',
        icon: 'Server',
        description: 'Serve MLflow models for batch or real-time inference.',
        useCases: ['Batch inference', 'Model deployment', 'A/B testing'],
        dataType: 'structured',
        defaultProperties: {
            modelUri: '',
            modelVersion: '',
            inferenceMode: 'batch'
        }
    },
    {
        type: 'transformation',
        category: 'FeatureStoreIntegration',
        name: 'Feature Store Integration',
        icon: 'Package',
        description: 'Read and write features to Databricks Feature Store.',
        useCases: ['Feature engineering', 'Feature reuse', 'Online feature serving'],
        dataType: 'structured',
        defaultProperties: {
            featureStore: '',
            featureTable: '',
            operation: 'read',
            keys: []
        }
    },
    {
        type: 'transformation',
        category: 'AutoLoader',
        name: 'Auto Loader',
        icon: 'Upload',
        description: 'Streaming file ingestion with automatic schema inference and evolution.',
        useCases: ['Streaming file ingestion', 'Schema evolution', 'Cloud storage ingestion'],
        dataType: 'structured',
        defaultProperties: {
            sourcePath: '',
            format: 'cloudFiles',
            schemaLocation: '',
            checkpointLocation: '',
            maxFilesPerTrigger: null
        }
    },

    // --- OUTPUTS (6 types) ---
    {
        type: 'output',
        category: 'DeltaTableSink',
        name: 'Delta Table Sink',
        icon: 'Save',
        description: 'Write data to a Delta Lake table with ACID transactions.',
        useCases: ['Write to bronze/silver/gold tables', 'Append or overwrite', 'Partitioned writes'],
        dataType: 'structured',
        defaultProperties: {
            catalog: 'main',
            schema: 'default',
            table: '',
            mode: 'append',
            partitionBy: [],
            optimize: true
        }
    },
    {
        type: 'output',
        category: 'AzureBlobStorageSink',
        name: 'Azure Blob Storage Sink',
        icon: 'Cloud',
        description: 'Write data to Azure Blob Storage in various formats.',
        useCases: ['Export to blob storage', 'Archive data', 'Data lake storage'],
        dataType: 'structured',
        defaultProperties: {
            storageAccount: '',
            container: '',
            path: '',
            format: 'parquet',
            mode: 'overwrite'
        }
    },
    {
        type: 'output',
        category: 'ADLSGen2Sink',
        name: 'ADLS Gen2 Sink',
        icon: 'HardDrive',
        description: 'Write data to Azure Data Lake Storage Gen2.',
        useCases: ['Lakehouse writes', 'Partitioned storage', 'Multi-format output'],
        dataType: 'structured',
        defaultProperties: {
            storageAccount: '',
            container: '',
            path: '',
            format: 'delta',
            mode: 'overwrite',
            partitionBy: []
        }
    },
    {
        type: 'output',
        category: 'AzureSQLDatabaseSink',
        name: 'Azure SQL Database Sink',
        icon: 'Database',
        description: 'Write data to Azure SQL Database using JDBC.',
        useCases: ['Load to SQL databases', 'Data warehouse loads', 'Reporting tables'],
        dataType: 'structured',
        defaultProperties: {
            server: '',
            database: '',
            table: '',
            mode: 'append',
            batchSize: 10000
        }
    },
    {
        type: 'output',
        category: 'PowerBIDataset',
        name: 'Power BI Dataset',
        icon: 'BarChart',
        description: 'Publish data to Power BI datasets for visualization.',
        useCases: ['BI dashboards', 'Data visualization', 'Reporting'],
        dataType: 'structured',
        defaultProperties: {
            workspaceId: '',
            datasetId: '',
            authentication: 'servicePrincipal'
        }
    },
    {
        type: 'output',
        category: 'MLflowModelRegistry',
        name: 'MLflow Model Registry',
        icon: 'Package',
        description: 'Register trained models in MLflow Model Registry.',
        useCases: ['Model versioning', 'Model governance', 'Model deployment'],
        dataType: 'structured',
        defaultProperties: {
            modelName: '',
            modelVersion: '',
            stage: 'None',
            description: ''
        }
    },

    // --- ORCHESTRATION (5 types) ---
    {
        type: 'orchestration',
        category: 'JobTask',
        name: 'Job Task',
        icon: 'Briefcase',
        description: 'Execute a Databricks job with multiple tasks.',
        useCases: ['Multi-task workflows', 'Scheduled jobs', 'Complex orchestration'],
        dataType: 'structured',
        defaultProperties: {
            jobId: '',
            jobName: '',
            timeout: 3600,
            retries: 0
        }
    },
    {
        type: 'orchestration',
        category: 'NotebookTask',
        name: 'Notebook Task',
        icon: 'FileCode',
        description: 'Run a notebook as part of a job workflow.',
        useCases: ['Notebook execution', 'Task dependencies', 'Parameterized runs'],
        dataType: 'structured',
        defaultProperties: {
            notebookPath: '',
            parameters: {},
            timeout: 3600
        }
    },
    {
        type: 'orchestration',
        category: 'JARTask',
        name: 'JAR Task',
        icon: 'Package',
        description: 'Execute a JAR file on a Databricks cluster.',
        useCases: ['Java/Scala applications', 'Custom libraries', 'Legacy code'],
        dataType: 'structured',
        defaultProperties: {
            jarPath: '',
            mainClassName: '',
            parameters: []
        }
    },
    {
        type: 'orchestration',
        category: 'PythonWheelTask',
        name: 'Python Wheel Task',
        icon: 'Package',
        description: 'Execute a Python wheel package on a Databricks cluster.',
        useCases: ['Python packages', 'Custom libraries', 'Reusable code'],
        dataType: 'structured',
        defaultProperties: {
            packagePath: '',
            entryPoint: '',
            parameters: {}
        }
    },
    {
        type: 'orchestration',
        category: 'DeltaLiveTables',
        name: 'Delta Live Tables Pipeline',
        icon: 'Workflow',
        description: 'Declarative pipeline for Delta Live Tables with data quality expectations.',
        useCases: ['Medallion architecture', 'Data quality enforcement', 'Incremental processing'],
        dataType: 'structured',
        defaultProperties: {
            pipelineName: '',
            target: '',
            storageLocation: '',
            expectations: []
        }
    },

    // --- CLUSTER MANAGEMENT (3 types) ---
    {
        type: 'cluster',
        category: 'AllPurposeCluster',
        name: 'All-Purpose Cluster',
        icon: 'Server',
        description: 'Interactive cluster for ad-hoc analysis and development.',
        useCases: ['Interactive notebooks', 'Data exploration', 'Development'],
        dataType: 'structured',
        defaultProperties: {
            clusterName: '',
            nodeType: 'Standard_DS3_v2',
            numWorkers: 2,
            minWorkers: 1,
            maxWorkers: 8,
            runtimeVersion: '13.3.x-scala2.12',
            autoterminationMinutes: 30,
            libraries: []
        }
    },
    {
        type: 'cluster',
        category: 'JobCluster',
        name: 'Job Cluster',
        icon: 'Briefcase',
        description: 'Ephemeral cluster created for job execution, terminated after completion.',
        useCases: ['Production jobs', 'Scheduled workflows', 'Cost optimization'],
        dataType: 'structured',
        defaultProperties: {
            nodeType: 'Standard_DS3_v2',
            numWorkers: 2,
            minWorkers: 1,
            maxWorkers: 8,
            runtimeVersion: '13.3.x-scala2.12',
            libraries: []
        }
    },
    {
        type: 'cluster',
        category: 'SQLWarehouse',
        name: 'SQL Warehouse',
        icon: 'Database',
        description: 'Serverless SQL warehouse for BI and analytics workloads.',
        useCases: ['BI dashboards', 'SQL analytics', 'Ad-hoc queries'],
        dataType: 'structured',
        defaultProperties: {
            warehouseName: '',
            clusterSize: 'Small',
            minClusters: 1,
            maxClusters: 1,
            autoStopMinutes: 10,
            enablePhoton: true
        }
    }
];

export const getDatabricksComponentDefinition = (category: string) =>
    DATABRICKS_COMPONENT_DEFINITIONS.find(c => c.category === category);

