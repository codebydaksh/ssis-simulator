import { SSISComponent, Connection } from './types';
import { v4 as uuidv4 } from 'uuid';

export interface DatabricksTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedRuntime?: string;
    estimatedCost?: string;
    tags: string[];
    components: SSISComponent[];
    connections: Connection[];
    sampleCode?: string;
    readme?: string;
}

export const DATABRICKS_TEMPLATES: DatabricksTemplate[] = [
    // Data Engineering Templates
    {
        id: 'db-bronze-silver-gold',
        name: 'Bronze-Silver-Gold Medallion Architecture',
        description: 'Complete medallion architecture pipeline with Delta Lake layers.',
        category: 'Data Engineering',
        difficulty: 'intermediate',
        estimatedRuntime: '15-30 min',
        estimatedCost: '2-5 DBU',
        tags: ['medallion', 'delta-lake', 'etl', 'architecture'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'AzureBlobStorage',
                name: 'Blob Source',
                icon: 'Cloud',
                description: 'Read raw data from Azure Blob Storage',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    storageAccount: 'mystorageaccount',
                    container: 'raw',
                    path: '/bronze/',
                    format: 'parquet',
                    autoLoader: true
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Bronze Transform',
                icon: 'Shuffle',
                description: 'Clean and standardize data',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['select', 'filter'],
                    selectColumns: ['*'],
                    filterCondition: 'isNotNull(value)'
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Bronze Delta Table',
                icon: 'Save',
                description: 'Write to bronze Delta table',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'bronze',
                    table: 'raw_data',
                    mode: 'append',
                    optimize: true
                }
            },
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Bronze Source',
                icon: 'Database',
                description: 'Read from bronze Delta table',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 250 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'bronze',
                    table: 'raw_data',
                    operation: 'read'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Silver Transform',
                icon: 'Shuffle',
                description: 'Enrich and validate data',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 250 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['select', 'filter', 'groupBy'],
                    selectColumns: ['*'],
                    filterCondition: 'quality_score > 0.8'
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Silver Delta Table',
                icon: 'Save',
                description: 'Write to silver Delta table',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 250 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'silver',
                    table: 'cleaned_data',
                    mode: 'overwrite',
                    partitionBy: ['date'],
                    optimize: true
                }
            },
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Silver Source',
                icon: 'Database',
                description: 'Read from silver Delta table',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 400 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'silver',
                    table: 'cleaned_data',
                    operation: 'read'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Gold Transform',
                icon: 'Shuffle',
                description: 'Aggregate and create business metrics',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 400 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['groupBy', 'agg'],
                    groupByColumns: ['customer_id', 'date'],
                    aggregations: ['sum(revenue)', 'count(orders)']
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Gold Delta Table',
                icon: 'Save',
                description: 'Write to gold Delta table',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 400 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'gold',
                    table: 'business_metrics',
                    mode: 'overwrite',
                    partitionBy: ['date'],
                    zOrderColumns: ['customer_id'],
                    optimize: true
                }
            }
        ],
        connections: [],
        sampleCode: `# Bronze Layer
bronze_df = spark.read.format("parquet").load("abfss://raw@storage.dfs.core.windows.net/bronze/")
bronze_df.write.format("delta").mode("append").saveAsTable("main.bronze.raw_data")

# Silver Layer
silver_df = spark.read.table("main.bronze.raw_data").filter("quality_score > 0.8")
silver_df.write.format("delta").mode("overwrite").partitionBy("date").saveAsTable("main.silver.cleaned_data")

# Gold Layer
gold_df = spark.read.table("main.silver.cleaned_data").groupBy("customer_id", "date").agg(
    sum("revenue").alias("total_revenue"),
    count("orders").alias("order_count")
)
gold_df.write.format("delta").mode("overwrite").partitionBy("date").option("delta.autoOptimize.optimizeWrite", "true").saveAsTable("main.gold.business_metrics")`,
        readme: 'This template demonstrates the medallion architecture pattern with Delta Lake. Bronze layer stores raw data, Silver layer contains cleaned and validated data, and Gold layer has business-ready aggregated metrics.'
    },
    {
        id: 'db-incremental-etl-merge',
        name: 'Incremental ETL with Delta Lake Merge',
        description: 'Incremental data loading using Delta Lake MERGE operations.',
        category: 'Data Engineering',
        difficulty: 'intermediate',
        estimatedRuntime: '10-20 min',
        estimatedCost: '1-3 DBU',
        tags: ['incremental', 'merge', 'upsert', 'delta-lake'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'AzureSQLDatabase',
                name: 'SQL Source',
                icon: 'Database',
                description: 'Read incremental data from SQL',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    server: 'myserver.database.windows.net',
                    database: 'mydb',
                    table: 'source_table',
                    query: 'SELECT * FROM source_table WHERE modified_date > ?',
                    authentication: 'sql'
                }
            },
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Target Delta Table',
                icon: 'Database',
                description: 'Read existing target table',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 350 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'default',
                    table: 'target_table',
                    operation: 'read'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DeltaLakeMerge',
                name: 'Delta Merge',
                icon: 'GitMerge',
                description: 'Merge source into target',
                useCases: [],
                dataType: 'structured',
                position: { x: 400, y: 275 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    targetTable: 'main.default.target_table',
                    sourceTable: 'source_df',
                    mergeCondition: 'target.id = source.id',
                    whenMatched: 'update',
                    whenNotMatched: 'insert'
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Merged Table',
                icon: 'Save',
                description: 'Write merged results',
                useCases: [],
                dataType: 'structured',
                position: { x: 700, y: 275 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'default',
                    table: 'target_table',
                    mode: 'merge',
                    optimize: true
                }
            }
        ],
        connections: [],
        sampleCode: `from delta.tables import DeltaTable

source_df = spark.read.jdbc(url, "source_table", properties)
target_table = DeltaTable.forName(spark, "main.default.target_table")

target_table.alias("target").merge(
    source_df.alias("source"),
    "target.id = source.id"
).whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()`
    },
    {
        id: 'db-ml-pipeline-mlflow',
        name: 'ML Pipeline with MLflow',
        description: 'End-to-end machine learning pipeline with MLflow tracking.',
        category: 'Data Science & ML',
        difficulty: 'advanced',
        estimatedRuntime: '30-60 min',
        estimatedCost: '5-10 DBU',
        tags: ['mlflow', 'machine-learning', 'training', 'ml'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Training Data',
                icon: 'Database',
                description: 'Load training dataset',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'ml',
                    table: 'training_data',
                    operation: 'read'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Feature Engineering',
                icon: 'Shuffle',
                description: 'Create features',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['select', 'withColumn'],
                    selectColumns: ['*']
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'MLflowModelTraining',
                name: 'Train Model',
                icon: 'Brain',
                description: 'Train ML model with MLflow',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    experimentName: 'my_experiment',
                    algorithm: 'xgboost',
                    hyperparameters: { max_depth: 5, learning_rate: 0.1 }
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'MLflowModelRegistry',
                name: 'Register Model',
                icon: 'Package',
                description: 'Register model in MLflow',
                useCases: [],
                dataType: 'structured',
                position: { x: 700, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    modelName: 'my_model',
                    modelVersion: '1',
                    stage: 'Staging',
                    description: 'XGBoost model for prediction'
                }
            }
        ],
        connections: [],
        sampleCode: `import mlflow
import mlflow.xgboost
from xgboost import XGBClassifier

mlflow.set_experiment("/Users/user@example.com/my_experiment")

with mlflow.start_run():
    # Load and prepare data
    df = spark.read.table("main.ml.training_data")
    
    # Train model
    model = XGBClassifier(max_depth=5, learning_rate=0.1)
    model.fit(X_train, y_train)
    
    # Log model
    mlflow.xgboost.log_model(model, "model")
    mlflow.log_params({"max_depth": 5, "learning_rate": 0.1})
    mlflow.log_metrics({"accuracy": 0.95, "f1_score": 0.93})
    
    # Register model
    mlflow.register_model("runs:/<run_id>/model", "my_model")`
    },
    {
        id: 'db-streaming-kafka-delta',
        name: 'Streaming ETL from Kafka to Delta Lake',
        description: 'Real-time streaming pipeline from Kafka to Delta Lake with checkpointing.',
        category: 'Data Engineering',
        difficulty: 'advanced',
        estimatedRuntime: 'Continuous',
        estimatedCost: '10-20 DBU/day',
        tags: ['streaming', 'kafka', 'structured-streaming', 'real-time'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'KafkaStream',
                name: 'Kafka Source',
                icon: 'Radio',
                description: 'Read streaming data from Kafka',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    bootstrapServers: 'kafka-broker:9092',
                    topic: 'events',
                    startingOffsets: 'latest',
                    maxOffsetsPerTrigger: 1000
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Stream Transform',
                icon: 'Shuffle',
                description: 'Transform streaming data',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['select', 'filter', 'withWatermark'],
                    selectColumns: ['*'],
                    filterCondition: 'isNotNull(value)'
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Delta Sink',
                icon: 'Save',
                description: 'Write to Delta Lake',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'streaming',
                    table: 'events',
                    mode: 'append',
                    checkpointLocation: '/checkpoints/kafka-delta',
                    optimize: true
                }
            }
        ],
        connections: [],
        sampleCode: `from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StringType

# Read from Kafka
df = spark.readStream.format("kafka") \\
    .option("kafka.bootstrap.servers", "kafka-broker:9092") \\
    .option("subscribe", "events") \\
    .option("startingOffsets", "latest") \\
    .load()

# Parse JSON and transform
schema = StructType().add("value", StringType())
parsed_df = df.select(from_json(col("value").cast("string"), schema).alias("data"))

# Write to Delta Lake
query = parsed_df.writeStream \\
    .format("delta") \\
    .outputMode("append") \\
    .option("checkpointLocation", "/checkpoints/kafka-delta") \\
    .table("main.streaming.events")

query.awaitTermination()`
    },
    {
        id: 'db-first-notebook',
        name: 'Your First Databricks Notebook',
        description: 'Simple notebook template to get started with PySpark.',
        category: 'Getting Started',
        difficulty: 'beginner',
        estimatedRuntime: '5 min',
        estimatedCost: '0.5 DBU',
        tags: ['beginner', 'notebook', 'pyspark', 'tutorial'],
        components: [
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'PythonNotebook',
                name: 'Python Notebook',
                icon: 'FileCode',
                description: 'Your first Python notebook',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'python',
                    code: `from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count

# Create Spark session
spark = SparkSession.builder.appName("MyFirstNotebook").getOrCreate()

# Read data
df = spark.read.table("main.default.sample_data")

# Transform
result = df.groupBy("category").agg(count("*").alias("count"))

# Display
result.show()`,
                    parameters: {},
                    clusterId: ''
                }
            }
        ],
        connections: [],
        sampleCode: `from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("MyFirstNotebook").getOrCreate()
df = spark.read.table("main.default.sample_data")
df.show()`
    },
    // Additional Data Engineering Templates
    {
        id: 'db-incremental-etl-delta-merge',
        name: 'Incremental ETL with Delta Lake Merge',
        description: 'Incremental data loading using Delta Lake MERGE operations for UPSERT patterns.',
        category: 'Data Engineering',
        difficulty: 'intermediate',
        estimatedRuntime: '10-20 min',
        estimatedCost: '1-3 DBU',
        tags: ['incremental', 'merge', 'upsert', 'delta-lake'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'AzureBlobStorage',
                name: 'Source Data',
                icon: 'Cloud',
                description: 'Read incremental data',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    storageAccount: 'mystorageaccount',
                    container: 'incremental',
                    path: '/updates/',
                    format: 'parquet'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DeltaLakeMerge',
                name: 'Delta Merge',
                icon: 'GitMerge',
                description: 'UPSERT using MERGE',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    targetTable: 'main.default.target_table',
                    sourceTable: 'main.default.source_table',
                    mergeCondition: 'target.id = source.id',
                    whenMatched: 'update',
                    whenNotMatched: 'insert'
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Target Table',
                icon: 'Save',
                description: 'Updated Delta table',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'default',
                    table: 'target_table',
                    mode: 'merge'
                }
            }
        ],
        connections: [],
        sampleCode: `from delta.tables import DeltaTable

target = DeltaTable.forName(spark, "main.default.target_table")
source = spark.read.table("main.default.source_table")

target.alias("target").merge(
    source.alias("source"),
    "target.id = source.id"
).whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()`
    },
    {
        id: 'db-cdc-delta-lake',
        name: 'Change Data Capture (CDC) with Delta Lake',
        description: 'Capture and process change data using Delta Lake Change Data Feed (CDF).',
        category: 'Data Engineering',
        difficulty: 'advanced',
        estimatedRuntime: '20-30 min',
        estimatedCost: '2-4 DBU',
        tags: ['cdc', 'change-data-feed', 'delta-lake', 'streaming'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Source with CDF',
                icon: 'Database',
                description: 'Read from Delta table with CDF enabled',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 300 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'cdc',
                    table: 'source_table',
                    changeDataFeed: true
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Process Changes',
                icon: 'Shuffle',
                description: 'Process CDC changes',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 300 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['select', 'filter'],
                    filterCondition: "_change_type IN ('insert', 'update_preimage', 'update_postimage', 'delete')"
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'CDC Target',
                icon: 'Save',
                description: 'Write CDC changes',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 300 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'cdc',
                    table: 'cdc_events',
                    mode: 'append'
                }
            }
        ],
        connections: [],
        sampleCode: `# Read change data feed
df = spark.read.format("delta") \\
    .option("readChangeFeed", "true") \\
    .table("main.cdc.source_table")

# Process changes
changes = df.filter("_change_type IN ('insert', 'update_preimage', 'update_postimage', 'delete')")

# Write to target
changes.write.format("delta").mode("append").saveAsTable("main.cdc.cdc_events")`
    },
    {
        id: 'db-streaming-kafka-delta-v2',
        name: 'Streaming ETL from Kafka to Delta Lake',
        description: 'Real-time streaming pipeline from Kafka to Delta Lake with checkpointing.',
        category: 'Data Engineering',
        difficulty: 'intermediate',
        estimatedRuntime: 'Continuous',
        estimatedCost: '5-10 DBU/day',
        tags: ['streaming', 'kafka', 'delta-lake', 'structured-streaming'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'KafkaStream',
                name: 'Kafka Source',
                icon: 'Radio',
                description: 'Read from Kafka',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 400 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    bootstrapServers: 'kafka-broker:9092',
                    topic: 'events',
                    startingOffsets: 'latest'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Stream Transform',
                icon: 'Shuffle',
                description: 'Transform streaming data',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 400 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['select', 'filter'],
                    streaming: true
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Delta Sink',
                icon: 'Save',
                description: 'Write to Delta Lake',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 400 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'streaming',
                    table: 'events',
                    mode: 'append',
                    checkpointLocation: '/checkpoints/kafka-delta',
                    streaming: true
                }
            }
        ],
        connections: [],
        sampleCode: `from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StringType

# Read from Kafka
df = spark.readStream.format("kafka") \\
    .option("kafka.bootstrap.servers", "kafka-broker:9092") \\
    .option("subscribe", "events") \\
    .option("startingOffsets", "latest") \\
    .load()

# Parse JSON and transform
schema = StructType().add("value", StringType())
parsed_df = df.select(from_json(col("value").cast("string"), schema).alias("data"))

# Write to Delta Lake
query = parsed_df.writeStream \\
    .format("delta") \\
    .outputMode("append") \\
    .option("checkpointLocation", "/checkpoints/kafka-delta") \\
    .table("main.streaming.events")

query.awaitTermination()`
    },
    {
        id: 'db-autoloader-ingestion',
        name: 'Auto Loader: Ingest files from cloud storage',
        description: 'Streaming file ingestion with automatic schema inference using Auto Loader.',
        category: 'Data Engineering',
        difficulty: 'beginner',
        estimatedRuntime: 'Continuous',
        estimatedCost: '2-5 DBU/day',
        tags: ['autoloader', 'streaming', 'schema-inference', 'cloud-storage'],
        components: [
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'AutoLoader',
                name: 'Auto Loader',
                icon: 'Upload',
                description: 'Streaming file ingestion',
                useCases: [],
                dataType: 'structured',
                position: { x: 200, y: 500 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    sourcePath: 'abfss://container@storageaccount.dfs.core.windows.net/raw/',
                    format: 'cloudFiles',
                    schemaLocation: '/schemas/autoloader',
                    checkpointLocation: '/checkpoints/autoloader',
                    maxFilesPerTrigger: 1000
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Bronze Table',
                icon: 'Save',
                description: 'Write to bronze layer',
                useCases: [],
                dataType: 'structured',
                position: { x: 400, y: 500 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'bronze',
                    table: 'raw_files',
                    mode: 'append'
                }
            }
        ],
        connections: [],
        sampleCode: `# Auto Loader with schema inference
df = spark.readStream.format("cloudFiles") \\
    .option("cloudFiles.format", "parquet") \\
    .option("cloudFiles.schemaLocation", "/schemas/autoloader") \\
    .option("cloudFiles.inferColumnTypes", "true") \\
    .load("abfss://container@storageaccount.dfs.core.windows.net/raw/")

# Write to Delta table
query = df.writeStream \\
    .format("delta") \\
    .option("checkpointLocation", "/checkpoints/autoloader") \\
    .table("main.bronze.raw_files")

query.awaitTermination()`
    },
    {
        id: 'db-scd-type2-delta',
        name: 'Slowly Changing Dimension (SCD Type 2) with Delta',
        description: 'Implement SCD Type 2 pattern using Delta Lake for historical tracking.',
        category: 'Data Engineering',
        difficulty: 'advanced',
        estimatedRuntime: '15-25 min',
        estimatedCost: '2-4 DBU',
        tags: ['scd', 'type2', 'slowly-changing-dimension', 'delta-lake'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Source Dimension',
                icon: 'Database',
                description: 'Read source dimension data',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 600 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'staging',
                    table: 'source_dimension'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DeltaLakeMerge',
                name: 'SCD Type 2 Merge',
                icon: 'GitMerge',
                description: 'Merge with SCD Type 2 logic',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 600 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    targetTable: 'main.dw.dim_customer',
                    sourceTable: 'main.staging.source_dimension',
                    mergeCondition: 'target.business_key = source.business_key',
                    scdType2: true,
                    effectiveDateColumn: 'effective_date',
                    expirationDateColumn: 'expiration_date',
                    currentFlagColumn: 'is_current'
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Dimension Table',
                icon: 'Save',
                description: 'SCD Type 2 dimension',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 600 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'dw',
                    table: 'dim_customer',
                    mode: 'merge'
                }
            }
        ],
        connections: [],
        sampleCode: `from delta.tables import DeltaTable
from pyspark.sql.functions import current_timestamp, lit

target = DeltaTable.forName(spark, "main.dw.dim_customer")
source = spark.read.table("main.staging.source_dimension")

# SCD Type 2 merge logic
target.alias("target").merge(
    source.alias("source"),
    "target.business_key = source.business_key AND target.is_current = true"
).whenMatchedUpdate(
    condition="target.attribute_hash != source.attribute_hash",
    set={
        "is_current": lit(False),
        "expiration_date": current_timestamp()
    }
).whenNotMatchedInsertAll().execute()`
    },
    // Data Science & ML Templates
    {
        id: 'db-mlflow-end-to-end',
        name: 'End-to-end ML Pipeline with MLflow',
        description: 'Complete ML pipeline with MLflow tracking, model training, and deployment.',
        category: 'Data Science & ML',
        difficulty: 'intermediate',
        estimatedRuntime: '30-60 min',
        estimatedCost: '5-10 DBU',
        tags: ['mlflow', 'machine-learning', 'model-training', 'deployment'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Training Data',
                icon: 'Database',
                description: 'Load training dataset',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'ml',
                    table: 'training_data'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'MLflowModelTraining',
                name: 'MLflow Training',
                icon: 'Brain',
                description: 'Train model with MLflow',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    experimentName: 'customer_churn_prediction',
                    algorithm: 'xgboost',
                    hyperparameters: { max_depth: 6, learning_rate: 0.1 }
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'MLflowModelRegistry',
                name: 'Model Registry',
                icon: 'Package',
                description: 'Register model',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    modelName: 'churn_model',
                    modelVersion: '1',
                    stage: 'Staging'
                }
            }
        ],
        connections: [],
        sampleCode: `import mlflow
import mlflow.xgboost
from xgboost import XGBClassifier

with mlflow.start_run():
    model = XGBClassifier(max_depth=6, learning_rate=0.1)
    model.fit(X_train, y_train)
    
    mlflow.log_params({"max_depth": 6, "learning_rate": 0.1})
    mlflow.log_metric("accuracy", accuracy_score(y_test, model.predict(X_test)))
    
    mlflow.xgboost.log_model(model, "model")
    
    mlflow.register_model("runs:/<run_id>/model", "churn_model")`
    },
    {
        id: 'db-feature-store-integration',
        name: 'Feature Engineering with Feature Store',
        description: 'Create and use features from Databricks Feature Store for ML models.',
        category: 'Data Science & ML',
        difficulty: 'advanced',
        estimatedRuntime: '20-40 min',
        estimatedCost: '3-6 DBU',
        tags: ['feature-store', 'feature-engineering', 'ml'],
        components: [
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'FeatureStoreIntegration',
                name: 'Feature Store',
                icon: 'Package',
                description: 'Read/write features',
                useCases: [],
                dataType: 'structured',
                position: { x: 200, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    featureStore: 'main',
                    featureTable: 'customer_features',
                    operation: 'read',
                    keys: ['customer_id']
                }
            }
        ],
        connections: [],
        sampleCode: `from databricks.feature_store import FeatureStoreClient

fs = FeatureStoreClient()

# Read features
features = fs.read_table(name="main.customer_features", keys=["customer_id"])

# Write features
fs.write_table(
    name="main.customer_features",
    df=feature_df,
    mode="merge"
)`
    },
    {
        id: 'db-hyperparameter-tuning',
        name: 'Hyperparameter Tuning with Hyperopt',
        description: 'Automated hyperparameter tuning using Hyperopt for optimal model performance.',
        category: 'Data Science & ML',
        difficulty: 'advanced',
        estimatedRuntime: '60-120 min',
        estimatedCost: '10-20 DBU',
        tags: ['hyperparameter-tuning', 'hyperopt', 'optimization'],
        components: [
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'PythonNotebook',
                name: 'Hyperopt Tuning',
                icon: 'FileCode',
                description: 'Hyperparameter tuning notebook',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 300 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'python',
                    code: `from hyperopt import fmin, tpe, hp, Trials
import mlflow

def objective(params):
    with mlflow.start_run():
        model = train_model(params)
        accuracy = evaluate_model(model)
        mlflow.log_params(params)
        mlflow.log_metric("accuracy", accuracy)
        return -accuracy

space = {
    'max_depth': hp.choice('max_depth', [3, 5, 7]),
    'learning_rate': hp.uniform('learning_rate', 0.01, 0.3)
}

trials = Trials()
best = fmin(fn=objective, space=space, algo=tpe.suggest, max_evals=50, trials=trials)`
                }
            }
        ],
        connections: [],
        sampleCode: `from hyperopt import fmin, tpe, hp, Trials

def objective(params):
    model = train_model(params)
    return -evaluate_model(model)

space = {'max_depth': hp.choice('max_depth', [3, 5, 7])}
best = fmin(fn=objective, space=space, algo=tpe.suggest, max_evals=50)`
    },
    // Data Analytics Templates
    {
        id: 'db-sql-analytics-delta',
        name: 'SQL Analytics on Delta Lake',
        description: 'Perform SQL analytics queries on Delta Lake tables using Databricks SQL.',
        category: 'Data Analytics',
        difficulty: 'beginner',
        estimatedRuntime: '5-10 min',
        estimatedCost: '0.5-1 DBU',
        tags: ['sql', 'analytics', 'delta-lake', 'bi'],
        components: [
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'SQLNotebook',
                name: 'SQL Analytics',
                icon: 'Database',
                description: 'SQL queries on Delta Lake',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 400 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'sql',
                    code: `SELECT 
    category,
    COUNT(*) as count,
    AVG(amount) as avg_amount,
    SUM(amount) as total_amount
FROM main.default.sales_data
WHERE date >= CURRENT_DATE() - INTERVAL 30 DAYS
GROUP BY category
ORDER BY total_amount DESC`
                }
            },
            {
                id: uuidv4(),
                type: 'cluster',
                category: 'SQLWarehouse',
                name: 'SQL Warehouse',
                icon: 'Database',
                description: 'Serverless SQL warehouse',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 400 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    warehouseName: 'analytics-warehouse',
                    clusterSize: 'Small',
                    enablePhoton: true
                }
            }
        ],
        connections: [],
        sampleCode: `SELECT 
    category,
    COUNT(*) as count,
    AVG(amount) as avg_amount
FROM main.default.sales_data
GROUP BY category`
    },
    {
        id: 'db-customer-segmentation',
        name: 'Customer Segmentation with Clustering',
        description: 'Perform customer segmentation using K-means clustering on customer data.',
        category: 'Data Analytics',
        difficulty: 'intermediate',
        estimatedRuntime: '15-30 min',
        estimatedCost: '2-4 DBU',
        tags: ['clustering', 'segmentation', 'k-means', 'analytics'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Customer Data',
                icon: 'Database',
                description: 'Load customer data',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 500 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'analytics',
                    table: 'customers'
                }
            },
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'PythonNotebook',
                name: 'K-Means Clustering',
                icon: 'FileCode',
                description: 'Customer segmentation',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 500 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'python',
                    code: `from pyspark.ml.clustering import KMeans
from pyspark.ml.feature import VectorAssembler, StandardScaler

# Prepare features
assembler = VectorAssembler(inputCols=['age', 'income', 'spending'], outputCol='features')
df_features = assembler.transform(df)

# Scale features
scaler = StandardScaler(inputCol='features', outputCol='scaled_features')
scaler_model = scaler.fit(df_features)
df_scaled = scaler_model.transform(df_features)

# K-means clustering
kmeans = KMeans(k=5, featuresCol='scaled_features', predictionCol='segment')
model = kmeans.fit(df_scaled)
segmented = model.transform(df_scaled)`
                }
            }
        ],
        connections: [],
        sampleCode: `from pyspark.ml.clustering import KMeans

kmeans = KMeans(k=5, featuresCol='features')
model = kmeans.fit(df)
segmented = model.transform(df)`
    },
    // Delta Live Tables Templates
    {
        id: 'db-dlt-multi-hop',
        name: 'Multi-hop DLT Pipeline',
        description: 'Delta Live Tables pipeline with multiple transformation hops and data quality.',
        category: 'Delta Live Tables',
        difficulty: 'intermediate',
        estimatedRuntime: '20-40 min',
        estimatedCost: '3-6 DBU',
        tags: ['dlt', 'delta-live-tables', 'multi-hop', 'data-quality'],
        components: [
            {
                id: uuidv4(),
                type: 'orchestration',
                category: 'DeltaLiveTables',
                name: 'DLT Pipeline',
                icon: 'Workflow',
                description: 'Multi-hop DLT pipeline',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 600 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    pipelineName: 'multi_hop_pipeline',
                    target: 'main.default',
                    storageLocation: '/pipelines/dlt',
                    expectations: [
                        { name: 'valid_id', constraint: 'id IS NOT NULL' },
                        { name: 'positive_amount', constraint: 'amount > 0' }
                    ]
                }
            }
        ],
        connections: [],
        sampleCode: `import dlt
from pyspark.sql.functions import col

@dlt.table(
    name="bronze_table",
    comment="Raw data ingestion"
)
def bronze():
    return spark.read.format("json").load("/raw/data")

@dlt.table(
    name="silver_table",
    comment="Cleansed data",
    expect_all_or_drop={"valid_id": "id IS NOT NULL"}
)
def silver():
    return dlt.read("bronze_table").filter(col("amount") > 0)

@dlt.table(
    name="gold_table",
    comment="Aggregated data"
)
def gold():
    return dlt.read("silver_table").groupBy("category").agg(sum("amount"))`
    },
    {
        id: 'db-dlt-expectations',
        name: 'Expectations and Data Quality',
        description: 'Delta Live Tables pipeline with comprehensive data quality expectations.',
        category: 'Delta Live Tables',
        difficulty: 'intermediate',
        estimatedRuntime: '15-30 min',
        estimatedCost: '2-4 DBU',
        tags: ['dlt', 'data-quality', 'expectations', 'validation'],
        components: [
            {
                id: uuidv4(),
                type: 'orchestration',
                category: 'DeltaLiveTables',
                name: 'DLT with Expectations',
                icon: 'Workflow',
                description: 'DLT with data quality',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 700 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    pipelineName: 'quality_pipeline',
                    target: 'main.default',
                    expectations: [
                        { name: 'no_nulls', constraint: 'id IS NOT NULL AND name IS NOT NULL' },
                        { name: 'valid_email', constraint: "email RLIKE '^[A-Za-z0-9+_.-]+@(.+)$'" },
                        { name: 'positive_values', constraint: 'amount > 0 AND quantity > 0' }
                    ]
                }
            }
        ],
        connections: [],
        sampleCode: `import dlt

@dlt.table(
    name="validated_table",
    expect_all_or_drop={
        "no_nulls": "id IS NOT NULL AND name IS NOT NULL",
        "valid_email": "email RLIKE '^[A-Za-z0-9+_.-]+@(.+)$'",
        "positive_values": "amount > 0"
    }
)
def validated():
    return spark.read.table("source_table")`
    },
    // More Data Engineering Templates
    {
        id: 'db-multi-hop-pipeline',
        name: 'Multi-hop pipeline with data quality checks',
        description: 'Complex multi-hop pipeline with data quality validation at each stage.',
        category: 'Data Engineering',
        difficulty: 'advanced',
        estimatedRuntime: '25-40 min',
        estimatedCost: '3-6 DBU',
        tags: ['multi-hop', 'data-quality', 'validation', 'etl'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'AzureBlobStorage',
                name: 'Raw Source',
                icon: 'Cloud',
                description: 'Read raw data',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    storageAccount: 'storageaccount',
                    container: 'raw',
                    path: '/data/',
                    format: 'parquet'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Quality Check 1',
                icon: 'Shuffle',
                description: 'Validate data quality',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['filter'],
                    filterCondition: 'id IS NOT NULL AND amount > 0'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Transform 1',
                icon: 'Shuffle',
                description: 'First transformation',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['select', 'groupBy'],
                    selectColumns: ['*']
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Quality Check 2',
                icon: 'Shuffle',
                description: 'Second quality check',
                useCases: [],
                dataType: 'structured',
                position: { x: 700, y: 100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['filter'],
                    filterCondition: 'total_amount > 0'
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Final Output',
                icon: 'Save',
                description: 'Write final data',
                useCases: [],
                dataType: 'structured',
                position: { x: 900, y: 100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'gold',
                    table: 'final_data',
                    mode: 'overwrite'
                }
            }
        ],
        connections: [],
        sampleCode: `# Multi-hop pipeline with quality checks
df_raw = spark.read.format("parquet").load("abfss://raw@storage.dfs.core.windows.net/data/")

# Quality check 1
df_qc1 = df_raw.filter("id IS NOT NULL AND amount > 0")

# Transform 1
df_transform1 = df_qc1.groupBy("category").agg(sum("amount").alias("total_amount"))

# Quality check 2
df_qc2 = df_transform1.filter("total_amount > 0")

# Write final output
df_qc2.write.format("delta").mode("overwrite").saveAsTable("main.gold.final_data")`
    },
    {
        id: 'db-data-deduplication',
        name: 'Data deduplication and cleansing',
        description: 'Remove duplicates and clean data using Delta Lake operations.',
        category: 'Data Engineering',
        difficulty: 'intermediate',
        estimatedRuntime: '15-25 min',
        estimatedCost: '2-4 DBU',
        tags: ['deduplication', 'cleansing', 'data-quality'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Source with Duplicates',
                icon: 'Database',
                description: 'Read data with duplicates',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'bronze',
                    table: 'raw_data'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Deduplicate',
                icon: 'Shuffle',
                description: 'Remove duplicates',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['select'],
                    deduplication: true,
                    deduplicationKeys: ['id', 'timestamp']
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Cleansed Data',
                icon: 'Save',
                description: 'Write deduplicated data',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'silver',
                    table: 'cleansed_data',
                    mode: 'overwrite'
                }
            }
        ],
        connections: [],
        sampleCode: `# Deduplicate data
df = spark.read.table("main.bronze.raw_data")

# Remove duplicates based on business key
df_dedup = df.dropDuplicates(["id", "timestamp"])

# Write cleansed data
df_dedup.write.format("delta").mode("overwrite").saveAsTable("main.silver.cleansed_data")`
    },
    {
        id: 'db-partitioned-delta-ingestion',
        name: 'Partitioned Delta Lake ingestion',
        description: 'Ingest data into partitioned Delta tables for optimal query performance.',
        category: 'Data Engineering',
        difficulty: 'intermediate',
        estimatedRuntime: '20-30 min',
        estimatedCost: '2-5 DBU',
        tags: ['partitioning', 'delta-lake', 'performance'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'AzureBlobStorage',
                name: 'Source Data',
                icon: 'Cloud',
                description: 'Read partitioned source',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 300 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    storageAccount: 'storageaccount',
                    container: 'source',
                    path: '/partitioned/',
                    format: 'parquet'
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Partitioned Delta',
                icon: 'Save',
                description: 'Write with partitioning',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 300 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'partitioned',
                    table: 'sales_data',
                    mode: 'overwrite',
                    partitionBy: ['year', 'month', 'region']
                }
            }
        ],
        connections: [],
        sampleCode: `# Write to partitioned Delta table
df = spark.read.format("parquet").load("abfss://source@storage.dfs.core.windows.net/partitioned/")

df.write.format("delta") \\
    .mode("overwrite") \\
    .partitionBy("year", "month", "region") \\
    .saveAsTable("main.partitioned.sales_data")`
    },
    {
        id: 'db-time-travel-versioning',
        name: 'Time Travel and versioning workflow',
        description: 'Query historical versions of Delta tables using time travel.',
        category: 'Data Engineering',
        difficulty: 'intermediate',
        estimatedRuntime: '10-20 min',
        estimatedCost: '1-3 DBU',
        tags: ['time-travel', 'versioning', 'delta-lake', 'audit'],
        components: [
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DeltaLakeTimeTravel',
                name: 'Time Travel Query',
                icon: 'Clock',
                description: 'Query historical version',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 400 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    table: 'main.default.sales_data',
                    version: 5,
                    operation: 'read'
                }
            }
        ],
        connections: [],
        sampleCode: `# Time travel to specific version
df_v5 = spark.read.format("delta").option("versionAsOf", 5).table("main.default.sales_data")

# Time travel to specific timestamp
df_timestamp = spark.read.format("delta") \\
    .option("timestampAsOf", "2024-01-15 10:00:00") \\
    .table("main.default.sales_data")

# Restore to previous version
df_v5.write.format("delta").mode("overwrite").saveAsTable("main.default.sales_data")`
    },
    {
        id: 'db-schema-evolution',
        name: 'Schema evolution and enforcement',
        description: 'Handle schema changes in Delta Lake with automatic evolution and enforcement.',
        category: 'Data Engineering',
        difficulty: 'advanced',
        estimatedRuntime: '15-25 min',
        estimatedCost: '2-4 DBU',
        tags: ['schema-evolution', 'schema-enforcement', 'delta-lake'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Source Table',
                icon: 'Database',
                description: 'Read with schema',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 500 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'evolving',
                    table: 'data_table'
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Target with Evolution',
                icon: 'Save',
                description: 'Write with schema evolution',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 500 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'evolving',
                    table: 'data_table',
                    mode: 'append',
                    mergeSchema: true,
                    schemaEnforcement: true
                }
            }
        ],
        connections: [],
        sampleCode: `# Write with schema evolution
df_new = spark.read.table("main.evolving.data_table")

# Add new column
df_new = df_new.withColumn("new_column", lit("value"))

# Write with mergeSchema to allow evolution
df_new.write.format("delta") \\
    .mode("append") \\
    .option("mergeSchema", "true") \\
    .saveAsTable("main.evolving.data_table")`
    },
    // More Data Science & ML Templates
    {
        id: 'db-xgboost-training',
        name: 'Model training with XGBoost/LightGBM',
        description: 'Train gradient boosting models with XGBoost or LightGBM using MLflow.',
        category: 'Data Science & ML',
        difficulty: 'intermediate',
        estimatedRuntime: '30-60 min',
        estimatedCost: '5-10 DBU',
        tags: ['xgboost', 'lightgbm', 'gradient-boosting', 'ml'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Training Data',
                icon: 'Database',
                description: 'Load training dataset',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 600 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'ml',
                    table: 'training_features'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'MLflowModelTraining',
                name: 'XGBoost Training',
                icon: 'Brain',
                description: 'Train XGBoost model',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 600 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    experimentName: 'xgboost_experiment',
                    algorithm: 'xgboost',
                    hyperparameters: {
                        max_depth: 6,
                        learning_rate: 0.1,
                        n_estimators: 100
                    }
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'MLflowModelRegistry',
                name: 'Model Registry',
                icon: 'Package',
                description: 'Register model',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 600 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    modelName: 'xgboost_model',
                    stage: 'Staging'
                }
            }
        ],
        connections: [],
        sampleCode: `import mlflow
import mlflow.xgboost
from xgboost import XGBClassifier

with mlflow.start_run():
    model = XGBClassifier(
        max_depth=6,
        learning_rate=0.1,
        n_estimators=100
    )
    model.fit(X_train, y_train)
    
    mlflow.log_params({
        "max_depth": 6,
        "learning_rate": 0.1,
        "n_estimators": 100
    })
    mlflow.log_metric("accuracy", accuracy_score(y_test, model.predict(X_test)))
    
    mlflow.xgboost.log_model(model, "model")`
    },
    {
        id: 'db-distributed-training',
        name: 'Distributed training with Spark MLlib',
        description: 'Train machine learning models using Spark MLlib for distributed processing.',
        category: 'Data Science & ML',
        difficulty: 'advanced',
        estimatedRuntime: '60-120 min',
        estimatedCost: '10-20 DBU',
        tags: ['spark-mllib', 'distributed-training', 'ml'],
        components: [
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'PythonNotebook',
                name: 'Spark MLlib Training',
                icon: 'FileCode',
                description: 'Distributed ML training',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 700 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'python',
                    code: `from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml.feature import VectorAssembler

# Prepare features
assembler = VectorAssembler(inputCols=feature_cols, outputCol="features")
df_features = assembler.transform(df)

# Train model
rf = RandomForestClassifier(featuresCol="features", labelCol="label", numTrees=100)
model = rf.fit(df_features)

# Save model
model.write().overwrite().save("/models/rf_model")`
                }
            }
        ],
        connections: [],
        sampleCode: `from pyspark.ml.classification import RandomForestClassifier

rf = RandomForestClassifier(numTrees=100)
model = rf.fit(training_df)
predictions = model.transform(test_df)`
    },
    {
        id: 'db-ab-testing',
        name: 'A/B testing framework',
        description: 'Implement A/B testing framework for model comparison and deployment.',
        category: 'Data Science & ML',
        difficulty: 'advanced',
        estimatedRuntime: '40-60 min',
        estimatedCost: '6-10 DBU',
        tags: ['ab-testing', 'model-deployment', 'ml'],
        components: [
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'MLflowModelServing',
                name: 'Model A',
                icon: 'Server',
                description: 'Serve model A',
                useCases: [],
                dataType: 'structured',
                position: { x: 200, y: 800 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    modelUri: 'models:/churn_model/1',
                    inferenceMode: 'batch'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'MLflowModelServing',
                name: 'Model B',
                icon: 'Server',
                description: 'Serve model B',
                useCases: [],
                dataType: 'structured',
                position: { x: 400, y: 800 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    modelUri: 'models:/churn_model/2',
                    inferenceMode: 'batch'
                }
            }
        ],
        connections: [],
        sampleCode: `# A/B Testing Framework
import mlflow

# Load both models
model_a = mlflow.pyfunc.load_model("models:/churn_model/1")
model_b = mlflow.pyfunc.load_model("models:/churn_model/2")

# Run predictions
pred_a = model_a.predict(test_data)
pred_b = model_b.predict(test_data)

# Compare metrics
metrics_a = evaluate_model(pred_a, y_test)
metrics_b = evaluate_model(pred_b, y_test)

# Deploy winner
if metrics_b['accuracy'] > metrics_a['accuracy']:
    mlflow.register_model("models:/churn_model/2", "churn_model_production")`
    },
    // More Data Analytics Templates
    {
        id: 'db-sales-forecasting',
        name: 'Sales forecasting and trend analysis',
        description: 'Perform time series forecasting and trend analysis on sales data.',
        category: 'Data Analytics',
        difficulty: 'intermediate',
        estimatedRuntime: '20-40 min',
        estimatedCost: '3-6 DBU',
        tags: ['forecasting', 'time-series', 'analytics'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Sales History',
                icon: 'Database',
                description: 'Load historical sales',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 900 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'analytics',
                    table: 'sales_history'
                }
            },
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'PythonNotebook',
                name: 'Forecasting Model',
                icon: 'FileCode',
                description: 'Time series forecasting',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 900 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'python',
                    code: `from prophet import Prophet
import pandas as pd

# Prepare data
df = spark.read.table("main.analytics.sales_history").toPandas()
df['ds'] = pd.to_datetime(df['date'])
df['y'] = df['sales']

# Train Prophet model
model = Prophet()
model.fit(df)

# Forecast
future = model.make_future_dataframe(periods=30)
forecast = model.predict(future)`
                }
            }
        ],
        connections: [],
        sampleCode: `from prophet import Prophet

model = Prophet()
model.fit(df)
forecast = model.predict(future)`
    },
    {
        id: 'db-churn-prediction',
        name: 'Churn prediction and cohort analysis',
        description: 'Predict customer churn and perform cohort analysis.',
        category: 'Data Analytics',
        difficulty: 'intermediate',
        estimatedRuntime: '25-45 min',
        estimatedCost: '4-7 DBU',
        tags: ['churn', 'cohort-analysis', 'predictive-analytics'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Customer Data',
                icon: 'Database',
                description: 'Load customer data',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 1000 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'analytics',
                    table: 'customers'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'MLflowModelTraining',
                name: 'Churn Model',
                icon: 'Brain',
                description: 'Train churn prediction model',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 1000 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    experimentName: 'churn_prediction',
                    algorithm: 'xgboost'
                }
            }
        ],
        connections: [],
        sampleCode: `# Churn prediction
from pyspark.ml.classification import GBTClassifier

# Prepare features
features = ['days_since_signup', 'total_orders', 'avg_order_value', 'last_login_days']

# Train model
gbt = GBTClassifier(featuresCol="features", labelCol="churned")
model = gbt.fit(training_df)

# Predict churn
predictions = model.transform(test_df)`
    },
    // More Delta Live Tables Templates
    {
        id: 'db-dlt-streaming',
        name: 'Streaming DLT pipeline',
        description: 'Delta Live Tables pipeline for streaming data processing.',
        category: 'Delta Live Tables',
        difficulty: 'advanced',
        estimatedRuntime: 'Continuous',
        estimatedCost: '5-10 DBU/day',
        tags: ['dlt', 'streaming', 'real-time'],
        components: [
            {
                id: uuidv4(),
                type: 'orchestration',
                category: 'DeltaLiveTables',
                name: 'Streaming DLT',
                icon: 'Workflow',
                description: 'Streaming pipeline',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 1100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    pipelineName: 'streaming_pipeline',
                    target: 'main.default',
                    streaming: true,
                    expectations: [
                        { name: 'valid_timestamp', constraint: 'timestamp IS NOT NULL' }
                    ]
                }
            }
        ],
        connections: [],
        sampleCode: `import dlt

@dlt.table(
    name="streaming_table",
    comment="Streaming data ingestion"
)
def streaming():
    return spark.readStream.format("kafka") \\
        .option("kafka.bootstrap.servers", "broker:9092") \\
        .option("subscribe", "events") \\
        .load()`
    },
    {
        id: 'db-dlt-scd-type2',
        name: 'Slowly Changing Dimension with DLT',
        description: 'Implement SCD Type 2 pattern using Delta Live Tables.',
        category: 'Delta Live Tables',
        difficulty: 'advanced',
        estimatedRuntime: '20-35 min',
        estimatedCost: '3-5 DBU',
        tags: ['dlt', 'scd', 'type2', 'slowly-changing-dimension'],
        components: [
            {
                id: uuidv4(),
                type: 'orchestration',
                category: 'DeltaLiveTables',
                name: 'SCD Type 2 DLT',
                icon: 'Workflow',
                description: 'SCD Type 2 with DLT',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 1200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    pipelineName: 'scd_type2_pipeline',
                    target: 'main.dw',
                    scdType2: true
                }
            }
        ],
        connections: [],
        sampleCode: `import dlt
from pyspark.sql.functions import current_timestamp, lit

@dlt.table(
    name="dim_customer_scd2",
    comment="SCD Type 2 dimension"
)
def dim_customer():
    source = dlt.read("staging_customer")
    target = dlt.read("dim_customer")
    
    return target.merge(
        source,
        "target.business_key = source.business_key AND target.is_current = true"
    ).whenMatchedUpdate(
        condition="target.attribute_hash != source.attribute_hash",
        set={"is_current": lit(False), "expiration_date": current_timestamp()}
    ).whenNotMatchedInsertAll()`
    },
    // More Advanced Patterns
    {
        id: 'db-unity-catalog-governance',
        name: 'Unity Catalog governance and lineage',
        description: 'Implement data governance with Unity Catalog including access control and lineage tracking.',
        category: 'Advanced Patterns',
        difficulty: 'advanced',
        estimatedRuntime: '30-50 min',
        estimatedCost: '4-8 DBU',
        tags: ['unity-catalog', 'governance', 'lineage', 'security'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Governed Table',
                icon: 'Database',
                description: 'Read from Unity Catalog',
                useCases: [],
                dataType: 'structured',
                position: { x: 200, y: 1300 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'production',
                    schema: 'sales',
                    table: 'transactions'
                }
            }
        ],
        connections: [],
        sampleCode: `# Unity Catalog with governance
# Read from governed catalog
df = spark.read.table("production.sales.transactions")

# Access control enforced automatically
# Lineage tracked in Unity Catalog
# Audit logs available in system.access.audit`
    },
    {
        id: 'db-photon-optimization',
        name: 'Lakehouse architecture with Photon',
        description: 'Optimize SQL workloads using Photon engine for 2-3x performance improvement.',
        category: 'Advanced Patterns',
        difficulty: 'intermediate',
        estimatedRuntime: '15-25 min',
        estimatedCost: '2-4 DBU',
        tags: ['photon', 'optimization', 'sql', 'performance'],
        components: [
            {
                id: uuidv4(),
                type: 'cluster',
                category: 'SQLWarehouse',
                name: 'Photon SQL Warehouse',
                icon: 'Database',
                description: 'SQL warehouse with Photon',
                useCases: [],
                dataType: 'structured',
                position: { x: 200, y: 1400 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    warehouseName: 'photon-warehouse',
                    clusterSize: 'Large',
                    enablePhoton: true
                }
            },
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'SQLNotebook',
                name: 'Photon SQL Queries',
                icon: 'Database',
                description: 'SQL with Photon',
                useCases: [],
                dataType: 'structured',
                position: { x: 400, y: 1400 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'sql',
                    code: `SELECT 
    category,
    SUM(amount) as total,
    AVG(amount) as avg_amount
FROM main.default.sales_data
WHERE date >= CURRENT_DATE() - INTERVAL 30 DAYS
GROUP BY category
ORDER BY total DESC`
                }
            }
        ],
        connections: [],
        sampleCode: `-- Photon-accelerated SQL query
-- Photon provides 2-3x performance improvement
SELECT category, SUM(amount) as total
FROM main.default.sales_data
GROUP BY category`
    },
    {
        id: 'db-cost-optimization',
        name: 'Cost optimization and cluster tuning',
        description: 'Optimize Databricks costs through cluster configuration and workload tuning.',
        category: 'Advanced Patterns',
        difficulty: 'intermediate',
        estimatedRuntime: '20-30 min',
        estimatedCost: '2-4 DBU',
        tags: ['cost-optimization', 'cluster-tuning', 'performance'],
        components: [
            {
                id: uuidv4(),
                type: 'cluster',
                category: 'JobCluster',
                name: 'Optimized Job Cluster',
                icon: 'Briefcase',
                description: 'Cost-optimized cluster',
                useCases: [],
                dataType: 'structured',
                position: { x: 200, y: 1500 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    nodeType: 'Standard_DS3_v2',
                    numWorkers: 2,
                    minWorkers: 1,
                    maxWorkers: 4,
                    autoscaling: true,
                    runtimeVersion: '13.3.x-scala2.12'
                }
            }
        ],
        connections: [],
        sampleCode: `# Cost-optimized cluster configuration
# - Use Job Clusters (not All-Purpose)
# - Enable autoscaling
# - Set appropriate worker limits
# - Use instance pools for faster startup
# - Enable auto-termination`
    },
    {
        id: 'db-cicd-repos',
        name: 'CI/CD with Databricks Repos and Jobs',
        description: 'Implement CI/CD pipeline using Databricks Repos and Jobs API.',
        category: 'Advanced Patterns',
        difficulty: 'advanced',
        estimatedRuntime: '40-60 min',
        estimatedCost: '5-8 DBU',
        tags: ['cicd', 'repos', 'jobs', 'devops'],
        components: [
            {
                id: uuidv4(),
                type: 'orchestration',
                category: 'JobTask',
                name: 'CI/CD Job',
                icon: 'Briefcase',
                description: 'Automated deployment job',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 1600 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    jobName: 'deployment_pipeline',
                    timeout: 3600,
                    retries: 3,
                    gitProvider: 'github',
                    repoPath: '/Repos/project/pipeline'
                }
            }
        ],
        connections: [],
        sampleCode: `# CI/CD with Databricks Repos
# 1. Connect Git repository to Databricks Repos
# 2. Create job that runs notebooks from Repos
# 3. Use Jobs API to trigger deployments
# 4. Implement branch protection and code review
# 5. Automate testing and validation`
    },
    // More Data Engineering Templates
    {
        id: 'db-upsert-multiple-sources',
        name: 'Upsert from multiple sources',
        description: 'Merge data from multiple sources into a single Delta table using UPSERT operations.',
        category: 'Data Engineering',
        difficulty: 'intermediate',
        estimatedRuntime: '20-30 min',
        estimatedCost: '3-5 DBU',
        tags: ['upsert', 'merge', 'multiple-sources'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'AzureSQLDatabase',
                name: 'Source 1',
                icon: 'Database',
                description: 'SQL source 1',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 1700 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    server: 'server1.database.windows.net',
                    database: 'db1',
                    table: 'table1'
                }
            },
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'AzureBlobStorage',
                name: 'Source 2',
                icon: 'Cloud',
                description: 'Blob source 2',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 1800 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    storageAccount: 'storageaccount',
                    container: 'data',
                    path: '/source2/',
                    format: 'parquet'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Union Sources',
                icon: 'Shuffle',
                description: 'Combine sources',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 1750 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['union']
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DeltaLakeMerge',
                name: 'Merge to Target',
                icon: 'GitMerge',
                description: 'UPSERT operation',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 1750 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    targetTable: 'main.default.unified_table',
                    sourceTable: 'main.staging.combined_source',
                    mergeCondition: 'target.id = source.id'
                }
            }
        ],
        connections: [],
        sampleCode: `# Union multiple sources
df1 = spark.read.jdbc(url1, table1, properties=props1)
df2 = spark.read.format("parquet").load("abfss://data@storage.dfs.core.windows.net/source2/")
df_combined = df1.union(df2)

# Merge to target
target = DeltaTable.forName(spark, "main.default.unified_table")
target.alias("target").merge(
    df_combined.alias("source"),
    "target.id = source.id"
).whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()`
    },
    {
        id: 'db-realtime-aggregations',
        name: 'Real-time aggregations with Structured Streaming',
        description: 'Perform real-time aggregations on streaming data using Structured Streaming.',
        category: 'Data Engineering',
        difficulty: 'advanced',
        estimatedRuntime: 'Continuous',
        estimatedCost: '6-12 DBU/day',
        tags: ['streaming', 'aggregations', 'real-time', 'structured-streaming'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'KafkaStream',
                name: 'Kafka Events',
                icon: 'Radio',
                description: 'Streaming events',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 1900 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    bootstrapServers: 'kafka-broker:9092',
                    topic: 'events',
                    startingOffsets: 'latest'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Window Aggregations',
                icon: 'Shuffle',
                description: 'Real-time aggregations',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 1900 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['groupBy'],
                    streaming: true,
                    windowDuration: '5 minutes'
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Aggregated Results',
                icon: 'Save',
                description: 'Write aggregations',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 1900 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'streaming',
                    table: 'realtime_aggregates',
                    mode: 'append',
                    checkpointLocation: '/checkpoints/realtime-agg',
                    streaming: true
                }
            }
        ],
        connections: [],
        sampleCode: `from pyspark.sql.functions import window, sum, count

# Real-time aggregations
df = spark.readStream.format("kafka") \\
    .option("kafka.bootstrap.servers", "broker:9092") \\
    .option("subscribe", "events") \\
    .load()

# Window aggregations
aggregated = df.groupBy(
    window("timestamp", "5 minutes"),
    "category"
).agg(sum("amount").alias("total"), count("*").alias("count"))

# Write to Delta
query = aggregated.writeStream \\
    .format("delta") \\
    .outputMode("complete") \\
    .option("checkpointLocation", "/checkpoints/realtime-agg") \\
    .table("main.streaming.realtime_aggregates")

query.awaitTermination()`
    },
    {
        id: 'db-event-driven-pipeline',
        name: 'Event-driven pipeline with Azure Event Hub',
        description: 'Build event-driven data pipeline using Azure Event Hub as source.',
        category: 'Data Engineering',
        difficulty: 'advanced',
        estimatedRuntime: 'Continuous',
        estimatedCost: '5-10 DBU/day',
        tags: ['event-driven', 'event-hub', 'streaming'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'KafkaStream',
                name: 'Event Hub Source',
                icon: 'Radio',
                description: 'Read from Event Hub',
                useCases: [],
                dataType: 'structured',
                position: { x: 200, y: 2000 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    bootstrapServers: 'namespace.servicebus.windows.net:9093',
                    topic: 'events',
                    startingOffsets: 'latest'
                }
            }
        ],
        connections: [],
        sampleCode: `# Event Hub as Kafka source
df = spark.readStream.format("kafka") \\
    .option("kafka.bootstrap.servers", "namespace.servicebus.windows.net:9093") \\
    .option("kafka.sasl.mechanism", "PLAIN") \\
    .option("kafka.security.protocol", "SASL_SSL") \\
    .option("subscribe", "events") \\
    .load()`
    },
    {
        id: 'db-batch-streaming-unification',
        name: 'Batch and streaming Delta Lake unification',
        description: 'Unify batch and streaming data in Delta Lake for consistent analytics.',
        category: 'Data Engineering',
        difficulty: 'advanced',
        estimatedRuntime: '30-50 min',
        estimatedCost: '4-7 DBU',
        tags: ['batch', 'streaming', 'unification', 'delta-lake'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'DeltaTableSource',
                name: 'Batch Data',
                icon: 'Database',
                description: 'Historical batch data',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 2100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'batch',
                    table: 'historical_data'
                }
            },
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'KafkaStream',
                name: 'Streaming Data',
                icon: 'Radio',
                description: 'Real-time streaming',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 2200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    bootstrapServers: 'kafka:9092',
                    topic: 'events'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Union Batch & Stream',
                icon: 'Shuffle',
                description: 'Unify data',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 2150 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['union']
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'Unified Table',
                icon: 'Save',
                description: 'Unified Delta table',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 2150 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'unified',
                    table: 'all_data',
                    mode: 'append'
                }
            }
        ],
        connections: [],
        sampleCode: `# Unify batch and streaming
df_batch = spark.read.table("main.batch.historical_data")
df_stream = spark.readStream.format("kafka").load()

# Union and write
df_unified = df_batch.union(df_stream)
df_unified.write.format("delta").mode("append").saveAsTable("main.unified.all_data")`
    },
    // More Data Science & ML Templates
    {
        id: 'db-automl-pipeline',
        name: 'AutoML with Databricks AutoML',
        description: 'Automated machine learning pipeline using Databricks AutoML.',
        category: 'Data Science & ML',
        difficulty: 'intermediate',
        estimatedRuntime: '60-120 min',
        estimatedCost: '10-20 DBU',
        tags: ['automl', 'machine-learning', 'automation'],
        components: [
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'PythonNotebook',
                name: 'AutoML Training',
                icon: 'FileCode',
                description: 'AutoML pipeline',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 2300 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'python',
                    code: `from databricks import automl

summary = automl.classify(
    dataset=df,
    target_col="label",
    time_col="timestamp",
    experiment_dir="/Shared/automl_experiment",
    timeout_minutes=60
)`
                }
            }
        ],
        connections: [],
        sampleCode: `from databricks import automl

summary = automl.classify(
    dataset=df,
    target_col="label",
    timeout_minutes=60
)`
    },
    {
        id: 'db-time-series-prophet',
        name: 'Time series forecasting with Prophet',
        description: 'Forecast time series data using Facebook Prophet algorithm.',
        category: 'Data Science & ML',
        difficulty: 'intermediate',
        estimatedRuntime: '30-60 min',
        estimatedCost: '5-10 DBU',
        tags: ['prophet', 'time-series', 'forecasting'],
        components: [
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'PythonNotebook',
                name: 'Prophet Forecasting',
                icon: 'FileCode',
                description: 'Time series forecast',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 2400 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'python',
                    code: `from prophet import Prophet
import pandas as pd

# Prepare data
df_prophet = df.toPandas()
df_prophet['ds'] = pd.to_datetime(df_prophet['date'])
df_prophet['y'] = df_prophet['value']

# Train model
model = Prophet()
model.fit(df_prophet)

# Forecast
future = model.make_future_dataframe(periods=30)
forecast = model.predict(future)`
                }
            }
        ],
        connections: [],
        sampleCode: `from prophet import Prophet

model = Prophet()
model.fit(df)
forecast = model.predict(future)`
    },
    {
        id: 'db-nlp-pipeline',
        name: 'NLP pipeline with Spark NLP',
        description: 'Natural language processing pipeline using Spark NLP library.',
        category: 'Data Science & ML',
        difficulty: 'advanced',
        estimatedRuntime: '40-80 min',
        estimatedCost: '6-12 DBU',
        tags: ['nlp', 'spark-nlp', 'text-processing'],
        components: [
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'PythonNotebook',
                name: 'Spark NLP Pipeline',
                icon: 'FileCode',
                description: 'NLP processing',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 2500 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'python',
                    code: `from sparknlp.base import DocumentAssembler
from sparknlp.annotator import Tokenizer, SentimentDLModel

# NLP pipeline
document = DocumentAssembler().setInputCol("text").setOutputCol("document")
tokenizer = Tokenizer().setInputCols(["document"]).setOutputCol("token")
sentiment = SentimentDLModel.load().setInputCols(["token"]).setOutputCol("sentiment")

pipeline = Pipeline(stages=[document, tokenizer, sentiment])
model = pipeline.fit(df)
result = model.transform(df)`
                }
            }
        ],
        connections: [],
        sampleCode: `from sparknlp.base import DocumentAssembler
from sparknlp.annotator import Tokenizer

document = DocumentAssembler().setInputCol("text")
tokenizer = Tokenizer().setInputCols(["document"])

pipeline = Pipeline(stages=[document, tokenizer])
model = pipeline.fit(df)`
    },
    {
        id: 'db-computer-vision',
        name: 'Computer vision with TensorFlow/PyTorch',
        description: 'Image processing and computer vision using TensorFlow or PyTorch on Databricks.',
        category: 'Data Science & ML',
        difficulty: 'advanced',
        estimatedRuntime: '60-120 min',
        estimatedCost: '10-20 DBU',
        tags: ['computer-vision', 'tensorflow', 'pytorch', 'deep-learning'],
        components: [
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'PythonNotebook',
                name: 'CV Model Training',
                icon: 'FileCode',
                description: 'Computer vision training',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 2600 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'python',
                    code: `import tensorflow as tf
from tensorflow import keras

# Load images
train_ds = tf.keras.utils.image_dataset_from_directory(
    'dbfs:/data/images/train',
    image_size=(224, 224),
    batch_size=32
)

# Build model
model = keras.Sequential([
    keras.layers.Rescaling(1./255),
    keras.layers.Conv2D(32, 3, activation='relu'),
    keras.layers.MaxPooling2D(),
    keras.layers.Dense(128, activation='relu'),
    keras.layers.Dense(num_classes)
])

# Train
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy')
model.fit(train_ds, epochs=10)`
                }
            }
        ],
        connections: [],
        sampleCode: `import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Conv2D(32, 3, activation='relu'),
    tf.keras.layers.MaxPooling2D(),
    tf.keras.layers.Dense(128, activation='relu')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy')
model.fit(train_ds, epochs=10)`
    },
    // More Data Analytics Templates
    {
        id: 'db-dashboarding-sql',
        name: 'Dashboarding with Databricks SQL',
        description: 'Create interactive dashboards using Databricks SQL and visualization tools.',
        category: 'Data Analytics',
        difficulty: 'beginner',
        estimatedRuntime: '10-20 min',
        estimatedCost: '1-2 DBU',
        tags: ['dashboarding', 'sql', 'bi', 'visualization'],
        components: [
            {
                id: uuidv4(),
                type: 'cluster',
                category: 'SQLWarehouse',
                name: 'BI Warehouse',
                icon: 'Database',
                description: 'SQL warehouse for BI',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 2700 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    warehouseName: 'bi-warehouse',
                    clusterSize: 'Medium',
                    enablePhoton: true
                }
            },
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'SQLNotebook',
                name: 'Dashboard Queries',
                icon: 'Database',
                description: 'SQL for dashboard',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 2700 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'sql',
                    code: `-- Dashboard queries
SELECT 
    DATE_TRUNC('day', date) as day,
    category,
    SUM(amount) as daily_total,
    COUNT(*) as transaction_count
FROM main.default.sales_data
WHERE date >= CURRENT_DATE() - INTERVAL 30 DAYS
GROUP BY DATE_TRUNC('day', date), category
ORDER BY day DESC, daily_total DESC`
                }
            }
        ],
        connections: [],
        sampleCode: `-- Dashboard SQL queries
SELECT category, SUM(amount) as total
FROM main.default.sales_data
GROUP BY category`
    },
    {
        id: 'db-adhoc-exploration',
        name: 'Ad-hoc exploration notebook',
        description: 'Interactive notebook for ad-hoc data exploration and analysis.',
        category: 'Data Analytics',
        difficulty: 'beginner',
        estimatedRuntime: '15-30 min',
        estimatedCost: '1-3 DBU',
        tags: ['exploration', 'ad-hoc', 'analytics'],
        components: [
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'PythonNotebook',
                name: 'Exploration Notebook',
                icon: 'FileCode',
                description: 'Ad-hoc analysis',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 2800 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'python',
                    code: `# Ad-hoc exploration
df = spark.read.table("main.default.sales_data")

# Explore data
df.printSchema()
df.describe().show()
df.show(20)

# Basic analysis
df.groupBy("category").agg(
    sum("amount").alias("total"),
    avg("amount").alias("avg"),
    count("*").alias("count")
).show()`
                }
            }
        ],
        connections: [],
        sampleCode: `df = spark.read.table("main.default.sales_data")
df.describe().show()
df.groupBy("category").agg(sum("amount")).show()`
    },
    {
        id: 'db-trend-analysis',
        name: 'Sales forecasting and trend analysis',
        description: 'Analyze sales trends and forecast future sales using time series analysis.',
        category: 'Data Analytics',
        difficulty: 'intermediate',
        estimatedRuntime: '25-45 min',
        estimatedCost: '4-7 DBU',
        tags: ['trend-analysis', 'forecasting', 'sales'],
        components: [
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'PythonNotebook',
                name: 'Trend Analysis',
                icon: 'FileCode',
                description: 'Sales trend analysis',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 2900 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'python',
                    code: `from pyspark.sql.functions import window, sum, avg

# Trend analysis
df_trends = df.groupBy(
    window("date", "1 week"),
    "category"
).agg(
    sum("amount").alias("weekly_total"),
    avg("amount").alias("weekly_avg")
).orderBy("window")

# Forecast using Prophet
from prophet import Prophet
forecast = model.predict(future)`
                }
            }
        ],
        connections: [],
        sampleCode: `# Trend analysis
df_trends = df.groupBy(window("date", "1 week")).agg(sum("amount"))
forecast = model.predict(future)`
    },
    {
        id: 'db-realtime-kpi',
        name: 'Real-time KPI dashboard',
        description: 'Build real-time KPI dashboard using streaming data and Delta Lake.',
        category: 'Data Analytics',
        difficulty: 'advanced',
        estimatedRuntime: 'Continuous',
        estimatedCost: '6-12 DBU/day',
        tags: ['real-time', 'kpi', 'dashboard', 'streaming'],
        components: [
            {
                id: uuidv4(),
                type: 'dataSource',
                category: 'KafkaStream',
                name: 'Real-time Events',
                icon: 'Radio',
                description: 'Streaming events',
                useCases: [],
                dataType: 'structured',
                position: { x: 100, y: 3000 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    bootstrapServers: 'kafka:9092',
                    topic: 'metrics'
                }
            },
            {
                id: uuidv4(),
                type: 'transformation',
                category: 'DataFrameTransform',
                name: 'Calculate KPIs',
                icon: 'Shuffle',
                description: 'KPI calculations',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 3000 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    operations: ['groupBy'],
                    aggregations: ['sum', 'avg', 'count']
                }
            },
            {
                id: uuidv4(),
                type: 'output',
                category: 'DeltaTableSink',
                name: 'KPI Table',
                icon: 'Save',
                description: 'Real-time KPIs',
                useCases: [],
                dataType: 'structured',
                position: { x: 500, y: 3000 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    catalog: 'main',
                    schema: 'analytics',
                    table: 'realtime_kpis',
                    mode: 'append',
                    streaming: true
                }
            }
        ],
        connections: [],
        sampleCode: `# Real-time KPI dashboard
df = spark.readStream.format("kafka").load()

# Calculate KPIs
kpis = df.groupBy(window("timestamp", "1 minute")).agg(
    sum("revenue").alias("total_revenue"),
    count("*").alias("transaction_count"),
    avg("amount").alias("avg_amount")
)

# Write to Delta for dashboard
kpis.writeStream.format("delta").outputMode("complete") \\
    .option("checkpointLocation", "/checkpoints/kpis") \\
    .table("main.analytics.realtime_kpis")`
    },
    {
        id: 'db-data-profiling',
        name: 'Data profiling and quality checks',
        description: 'Perform comprehensive data profiling and quality validation.',
        category: 'Data Analytics',
        difficulty: 'intermediate',
        estimatedRuntime: '20-35 min',
        estimatedCost: '3-5 DBU',
        tags: ['profiling', 'data-quality', 'validation'],
        components: [
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'PythonNotebook',
                name: 'Data Profiling',
                icon: 'FileCode',
                description: 'Profile data quality',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 3100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'python',
                    code: `# Data profiling
df = spark.read.table("main.default.data_table")

# Basic statistics
df.describe().show()

# Null counts
from pyspark.sql.functions import col, sum as spark_sum
null_counts = df.select([spark_sum(col(c).isNull().cast("int")).alias(c) for c in df.columns])
null_counts.show()

# Value distributions
df.groupBy("category").count().show()

# Outlier detection
from pyspark.sql.functions import percentile_approx
percentiles = df.select(percentile_approx("amount", [0.25, 0.5, 0.75, 0.99]).alias("percentiles"))`
                }
            }
        ],
        connections: [],
        sampleCode: `# Data profiling
df.describe().show()
null_counts = df.select([sum(col(c).isNull().cast("int")) for c in df.columns])`
    },
    {
        id: 'db-funnel-analysis',
        name: 'Funnel analysis',
        description: 'Analyze user funnel and conversion rates across different stages.',
        category: 'Data Analytics',
        difficulty: 'intermediate',
        estimatedRuntime: '25-40 min',
        estimatedCost: '4-6 DBU',
        tags: ['funnel', 'conversion', 'analytics'],
        components: [
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'PythonNotebook',
                name: 'Funnel Analysis',
                icon: 'FileCode',
                description: 'Funnel conversion analysis',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 3200 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'python',
                    code: `# Funnel analysis
stages = ['view', 'click', 'add_to_cart', 'purchase']

funnel = df.groupBy("stage").agg(count("*").alias("count")).orderBy("stage")

# Calculate conversion rates
conversion_rates = []
for i in range(1, len(stages)):
    prev_count = funnel.filter(col("stage") == stages[i-1]).select("count").first()[0]
    curr_count = funnel.filter(col("stage") == stages[i]).select("count").first()[0]
    conversion_rate = (curr_count / prev_count) * 100
    conversion_rates.append(conversion_rate)`
                }
            }
        ],
        connections: [],
        sampleCode: `# Funnel analysis
funnel = df.groupBy("stage").agg(count("*").alias("count"))
conversion_rate = (next_stage_count / prev_stage_count) * 100`
    },
    {
        id: 'db-attribution-modeling',
        name: 'Attribution modeling',
        description: 'Model customer attribution across multiple touchpoints and channels.',
        category: 'Data Analytics',
        difficulty: 'advanced',
        estimatedRuntime: '40-60 min',
        estimatedCost: '6-10 DBU',
        tags: ['attribution', 'marketing', 'analytics'],
        components: [
            {
                id: uuidv4(),
                type: 'notebook',
                category: 'PythonNotebook',
                name: 'Attribution Model',
                icon: 'FileCode',
                description: 'Attribution analysis',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 3300 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    language: 'python',
                    code: `# Attribution modeling
# Last-touch attribution
df_last_touch = df.filter(col("converted") == True) \\
    .withColumn("attribution", col("last_touchpoint"))

# First-touch attribution
df_first_touch = df.filter(col("converted") == True) \\
    .withColumn("attribution", col("first_touchpoint"))

# Multi-touch attribution (equal weight)
df_multi_touch = df.groupBy("customer_id").agg(
    collect_list("touchpoint").alias("touchpoints")
).withColumn("attribution", explode("touchpoints"))`
                }
            }
        ],
        connections: [],
        sampleCode: `# Attribution modeling
# Last-touch
df_last = df.filter(col("converted") == True).select("last_touchpoint")

# Multi-touch
df_multi = df.groupBy("customer_id").agg(collect_list("touchpoint"))`
    },
    // More Delta Live Tables Templates
    {
        id: 'db-dlt-change-data-feed',
        name: 'Change Data Feed processing',
        description: 'Process Change Data Feed (CDF) events using Delta Live Tables.',
        category: 'Delta Live Tables',
        difficulty: 'advanced',
        estimatedRuntime: '25-40 min',
        estimatedCost: '4-6 DBU',
        tags: ['dlt', 'cdf', 'change-data-feed', 'cdc'],
        components: [
            {
                id: uuidv4(),
                type: 'orchestration',
                category: 'DeltaLiveTables',
                name: 'CDF DLT Pipeline',
                icon: 'Workflow',
                description: 'Process CDF events',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 3400 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    pipelineName: 'cdf_pipeline',
                    target: 'main.default',
                    changeDataFeed: true
                }
            }
        ],
        connections: [],
        sampleCode: `import dlt

@dlt.table(
    name="cdc_events",
    comment="Change Data Feed events"
)
def cdc_events():
    return spark.read.format("delta") \\
        .option("readChangeFeed", "true") \\
        .table("main.default.source_table") \\
        .filter("_change_type IN ('insert', 'update_postimage', 'delete')")`
    },
    {
        id: 'db-dlt-fan-out-fan-in',
        name: 'Fan-out and fan-in patterns',
        description: 'Implement fan-out (one-to-many) and fan-in (many-to-one) patterns in DLT.',
        category: 'Delta Live Tables',
        difficulty: 'advanced',
        estimatedRuntime: '30-50 min',
        estimatedCost: '4-7 DBU',
        tags: ['dlt', 'fan-out', 'fan-in', 'patterns'],
        components: [
            {
                id: uuidv4(),
                type: 'orchestration',
                category: 'DeltaLiveTables',
                name: 'Fan-out Fan-in DLT',
                icon: 'Workflow',
                description: 'Fan patterns',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 3500 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    pipelineName: 'fan_patterns_pipeline',
                    target: 'main.default'
                }
            }
        ],
        connections: [],
        sampleCode: `import dlt

# Fan-out: One source to multiple targets
@dlt.table(name="table_a")
def table_a():
    return dlt.read("source").filter("category == 'A'")

@dlt.table(name="table_b")
def table_b():
    return dlt.read("source").filter("category == 'B'")

# Fan-in: Multiple sources to one target
@dlt.table(name="unified")
def unified():
    return dlt.read("table_a").union(dlt.read("table_b"))`
    },
    {
        id: 'db-dlt-materialized-views',
        name: 'Materialized views and aggregations',
        description: 'Create materialized views with pre-computed aggregations in Delta Live Tables.',
        category: 'Delta Live Tables',
        difficulty: 'intermediate',
        estimatedRuntime: '20-35 min',
        estimatedCost: '3-5 DBU',
        tags: ['dlt', 'materialized-views', 'aggregations'],
        components: [
            {
                id: uuidv4(),
                type: 'orchestration',
                category: 'DeltaLiveTables',
                name: 'Materialized Views DLT',
                icon: 'Workflow',
                description: 'Materialized aggregations',
                useCases: [],
                dataType: 'structured',
                position: { x: 300, y: 3600 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: {
                    pipelineName: 'materialized_views_pipeline',
                    target: 'main.default',
                    materializedViews: true
                }
            }
        ],
        connections: [],
        sampleCode: `import dlt

@dlt.table(
    name="sales_summary",
    comment="Materialized view with aggregations"
)
def sales_summary():
    return dlt.read("sales_data").groupBy("category", "region").agg(
        sum("amount").alias("total_sales"),
        count("*").alias("transaction_count")
    )`
    }
];

