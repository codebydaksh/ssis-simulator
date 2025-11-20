import { Tutorial } from './tutorials';

export const DATABRICKS_TUTORIALS: Tutorial[] = [
    {
        id: 'db-first-notebook',
        name: 'Your First Databricks Notebook',
        description: 'Learn to create and configure a Python notebook in Databricks',
        estimatedTime: '7 minutes',
        steps: [
            {
                id: 'welcome',
                title: 'Welcome to Databricks!',
                message: 'Let\'s build your first Databricks notebook. This tutorial will guide you through creating a Python notebook, configuring a cluster, and running your first PySpark code. Click "Next" to continue.',
                canSkip: false
            },
            {
                id: 'add-notebook',
                title: 'Step 1: Create Python Notebook',
                message: 'Drag a "Python Notebook" component from the "Notebooks" section in the Toolbox and drop it onto the canvas. This represents a Databricks notebook where you can write PySpark code.',
                action: {
                    type: 'drag',
                    target: 'PythonNotebook',
                    description: 'Drag Python Notebook to canvas'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'configure-cluster',
                title: 'Step 2: Configure Cluster',
                message: 'Add an "All-Purpose Cluster" component from the "Clusters" section. Configure it with Standard_DS3_v2 node type and Databricks Runtime 13.3 LTS. This cluster will run your notebook.',
                action: {
                    type: 'drag',
                    target: 'AllPurposeCluster',
                    description: 'Drag All-Purpose Cluster to canvas'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'add-delta-source',
                title: 'Step 3: Add Delta Table Source',
                message: 'Add a "Delta Table Source" component from "Data Sources". Configure it to read from catalog "main", schema "default", and table "sales_data". This represents reading from a Delta Lake table.',
                action: {
                    type: 'drag',
                    target: 'DeltaTableSource',
                    description: 'Drag Delta Table Source to canvas'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'add-transform',
                title: 'Step 4: Add DataFrame Transform',
                message: 'Add a "DataFrame Transform" component from "Transformations". This will filter and aggregate your data. Configure it to filter by a condition and group by columns.',
                action: {
                    type: 'drag',
                    target: 'DataFrameTransform',
                    description: 'Drag DataFrame Transform to canvas'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'add-sink',
                title: 'Step 5: Add Delta Table Sink',
                message: 'Add a "Delta Table Sink" component from "Outputs". Configure it to write to catalog "main", schema "default", and table "sales_summary". This will save your transformed data.',
                action: {
                    type: 'drag',
                    target: 'DeltaTableSink',
                    description: 'Drag Delta Table Sink to canvas'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'connect-components',
                title: 'Step 6: Connect Components',
                message: 'Connect the components by dragging from the output handle (right side) of the Delta Table Source to the input handle (left side) of the DataFrame Transform. Then connect the transform to the sink.',
                action: {
                    type: 'connect',
                    description: 'Connect source to transform'
                },
                highlight: {
                    area: 'canvas'
                },
                canSkip: true
            },
            {
                id: 'preview-code',
                title: 'Step 7: Preview Generated Code',
                message: 'Click on any component and check the Properties Panel. You can see the generated PySpark code. The code preview shows how your visual pipeline translates to executable PySpark code.',
                action: {
                    type: 'click',
                    target: 'properties',
                    description: 'View code preview in Properties Panel'
                },
                highlight: {
                    area: 'properties'
                },
                canSkip: true
            },
            {
                id: 'complete',
                title: 'Congratulations!',
                message: 'You\'ve successfully created your first Databricks pipeline! You can now run the simulation to see how data flows through your pipeline. Try modifying the components and see how the generated code changes.',
                canSkip: false
            }
        ]
    },
    {
        id: 'db-medallion-architecture',
        name: 'Building a Medallion Architecture',
        description: 'Learn to build a Bronze-Silver-Gold medallion architecture with Delta Lake',
        estimatedTime: '15 minutes',
        steps: [
            {
                id: 'welcome-medallion',
                title: 'Medallion Architecture',
                message: 'The Medallion Architecture is a data design pattern used to organize data in a lakehouse. We\'ll build Bronze (raw), Silver (cleansed), and Gold (aggregated) layers. Click "Next" to start.',
                canSkip: false
            },
            {
                id: 'bronze-layer',
                title: 'Step 1: Create Bronze Layer',
                message: 'Add an "Auto Loader" component from "Data Sources" to ingest raw files from Azure Blob Storage. Configure it with source path, format (parquet), and checkpoint location. This is your Bronze layer.',
                action: {
                    type: 'drag',
                    target: 'AutoLoader',
                    description: 'Drag Auto Loader to canvas'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'bronze-sink',
                title: 'Step 2: Bronze Delta Table',
                message: 'Add a "Delta Table Sink" to write raw data to the Bronze layer. Configure it as catalog "main", schema "bronze", table "raw_data". Set mode to "append" for incremental loads.',
                action: {
                    type: 'drag',
                    target: 'DeltaTableSink',
                    description: 'Drag Delta Table Sink for Bronze layer'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'silver-transform',
                title: 'Step 3: Create Silver Layer',
                message: 'Add a "Delta Table Source" to read from Bronze, then add a "DataFrame Transform" to clean and standardize data (remove nulls, validate schemas). Add another Delta Table Sink for Silver layer.',
                action: {
                    type: 'drag',
                    target: 'DataFrameTransform',
                    description: 'Drag DataFrame Transform for Silver layer'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'silver-sink',
                title: 'Step 4: Silver Delta Table',
                message: 'Configure the Silver sink as catalog "main", schema "silver", table "cleansed_data". Enable schema enforcement and auto-optimize for better performance.',
                action: {
                    type: 'drag',
                    target: 'DeltaTableSink',
                    description: 'Drag Delta Table Sink for Silver layer'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'gold-layer',
                title: 'Step 5: Create Gold Layer',
                message: 'Add components for the Gold layer: read from Silver, aggregate data (groupBy, sum, count), and write to Gold Delta table. This layer contains business-ready aggregated data.',
                action: {
                    type: 'drag',
                    target: 'DataFrameTransform',
                    description: 'Drag DataFrame Transform for Gold aggregations'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'connect-layers',
                title: 'Step 6: Connect Layers',
                message: 'Connect Auto Loader -> Bronze Sink -> Silver Source -> Silver Transform -> Silver Sink -> Gold Source -> Gold Transform -> Gold Sink. This creates the complete medallion pipeline.',
                action: {
                    type: 'connect',
                    description: 'Connect all layers'
                },
                highlight: {
                    area: 'canvas'
                },
                canSkip: true
            },
            {
                id: 'add-merge',
                title: 'Step 7: Add Delta Lake Merge',
                message: 'Add a "Delta Lake Merge (UPSERT)" component between Silver and Gold layers. This allows incremental updates using MERGE statements for change data capture (CDC) patterns.',
                action: {
                    type: 'drag',
                    target: 'DeltaLakeMerge',
                    description: 'Drag Delta Lake Merge component'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'add-zordering',
                title: 'Step 8: Optimize with Z-Ordering',
                message: 'Configure Z-ordering on your Gold Delta table sink. Z-ordering improves query performance by colocating related data. Select frequently filtered columns for Z-ordering.',
                action: {
                    type: 'click',
                    target: 'properties',
                    description: 'Configure Z-ordering in properties'
                },
                highlight: {
                    area: 'properties'
                },
                canSkip: true
            },
            {
                id: 'configure-job',
                title: 'Step 9: Configure Job Scheduling',
                message: 'Add a "Job Task" component to schedule this pipeline. Configure it to run daily at a specific time. Set retries and timeout for production workloads.',
                action: {
                    type: 'drag',
                    target: 'JobTask',
                    description: 'Drag Job Task for scheduling'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'complete-medallion',
                title: 'Medallion Architecture Complete!',
                message: 'You\'ve built a complete Medallion Architecture! This pattern provides data quality, incremental processing, and optimized query performance. Try running the simulation to see data flow through all three layers.',
                canSkip: false
            }
        ]
    },
    {
        id: 'db-ml-pipeline',
        name: 'ML Pipeline with MLflow',
        description: 'Build an end-to-end machine learning pipeline with MLflow tracking',
        estimatedTime: '12 minutes',
        steps: [
            {
                id: 'welcome-ml',
                title: 'ML Pipeline with MLflow',
                message: 'We\'ll build a complete machine learning pipeline using MLflow for experiment tracking, model training, and model serving. Click "Next" to start.',
                canSkip: false
            },
            {
                id: 'load-training-data',
                title: 'Step 1: Load Training Data',
                message: 'Add a "Delta Table Source" to load your training dataset. Configure it to read from catalog "main", schema "ml", table "training_data". This contains features and labels for model training.',
                action: {
                    type: 'drag',
                    target: 'DeltaTableSource',
                    description: 'Drag Delta Table Source for training data'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'add-feature-store',
                title: 'Step 2: Add Feature Store Integration',
                message: 'Add a "Feature Store Integration" component to read features from Databricks Feature Store. This enables feature reuse and online feature serving for real-time inference.',
                action: {
                    type: 'drag',
                    target: 'FeatureStoreIntegration',
                    description: 'Drag Feature Store Integration'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'add-feature-engineering',
                title: 'Step 3: Feature Engineering Notebook',
                message: 'Add a "Python Notebook" component for feature engineering. This notebook will create derived features, handle missing values, and prepare data for model training.',
                action: {
                    type: 'drag',
                    target: 'PythonNotebook',
                    description: 'Drag Python Notebook for feature engineering'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'add-mlflow-training',
                title: 'Step 4: MLflow Model Training',
                message: 'Add an "MLflow Model Training" component. Configure it with experiment name, algorithm (XGBoost, LightGBM, etc.), and hyperparameters. MLflow will track all experiments automatically.',
                action: {
                    type: 'drag',
                    target: 'MLflowModelTraining',
                    description: 'Drag MLflow Model Training component'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'configure-hyperparameters',
                title: 'Step 5: Configure Hyperparameters',
                message: 'In the MLflow Training component properties, add hyperparameters like learning_rate, max_depth, n_estimators. MLflow will log these for experiment comparison.',
                action: {
                    type: 'click',
                    target: 'properties',
                    description: 'Configure hyperparameters in properties'
                },
                highlight: {
                    area: 'properties'
                },
                canSkip: true
            },
            {
                id: 'add-model-registry',
                title: 'Step 6: Register Model in Model Registry',
                message: 'Add an "MLflow Model Registry" component to register your trained model. Configure model name, version, and stage (Staging, Production). This enables model versioning and governance.',
                action: {
                    type: 'drag',
                    target: 'MLflowModelRegistry',
                    description: 'Drag MLflow Model Registry component'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'add-inference',
                title: 'Step 7: Create Inference Notebook',
                message: 'Add a "Python Notebook" for batch inference. This notebook will load the registered model from Model Registry and generate predictions on new data.',
                action: {
                    type: 'drag',
                    target: 'PythonNotebook',
                    description: 'Drag Python Notebook for inference'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'add-model-serving',
                title: 'Step 8: MLflow Model Serving',
                message: 'Add an "MLflow Model Serving" component for real-time inference. Configure it with model URI and inference mode (batch or streaming). This enables REST API endpoints for model serving.',
                action: {
                    type: 'drag',
                    target: 'MLflowModelServing',
                    description: 'Drag MLflow Model Serving component'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'connect-ml-pipeline',
                title: 'Step 9: Connect ML Pipeline',
                message: 'Connect all components: Training Data -> Feature Store -> Feature Engineering -> MLflow Training -> Model Registry -> Inference -> Model Serving. This creates the complete ML pipeline.',
                action: {
                    type: 'connect',
                    description: 'Connect ML pipeline components'
                },
                highlight: {
                    area: 'canvas'
                },
                canSkip: true
            },
            {
                id: 'complete-ml',
                title: 'ML Pipeline Complete!',
                message: 'You\'ve built a complete ML pipeline with MLflow! This includes experiment tracking, model versioning, and both batch and real-time inference. Try running the simulation to see MLflow metrics during training.',
                canSkip: false
            }
        ]
    },
    {
        id: 'db-streaming-etl',
        name: 'Streaming ETL with Kafka',
        description: 'Build a real-time streaming pipeline from Kafka to Delta Lake',
        estimatedTime: '10 minutes',
        steps: [
            {
                id: 'welcome-streaming',
                title: 'Streaming ETL with Kafka',
                message: 'We\'ll build a real-time streaming pipeline that ingests data from Kafka, transforms it, and writes to Delta Lake with checkpointing for fault tolerance. Click "Next" to start.',
                canSkip: false
            },
            {
                id: 'add-kafka-source',
                title: 'Step 1: Configure Kafka Source',
                message: 'Add a "Kafka Stream" component from "Data Sources". Configure bootstrap servers, topic name, and starting offsets (earliest or latest). This reads streaming data from Kafka.',
                action: {
                    type: 'drag',
                    target: 'KafkaStream',
                    description: 'Drag Kafka Stream component'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'add-streaming-transform',
                title: 'Step 2: Add Structured Streaming Transformations',
                message: 'Add a "DataFrame Transform" component configured for streaming. This will parse JSON, filter events, and transform data in real-time using Structured Streaming.',
                action: {
                    type: 'drag',
                    target: 'DataFrameTransform',
                    description: 'Drag DataFrame Transform for streaming'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'add-stateful-aggregations',
                title: 'Step 3: Add Stateful Aggregations',
                message: 'Configure the transform to perform stateful aggregations (window functions, groupBy with watermarks). This enables real-time analytics on streaming data.',
                action: {
                    type: 'click',
                    target: 'properties',
                    description: 'Configure stateful aggregations'
                },
                highlight: {
                    area: 'properties'
                },
                canSkip: true
            },
            {
                id: 'add-delta-sink',
                title: 'Step 4: Write to Delta Lake with Checkpointing',
                message: 'Add a "Delta Table Sink" configured for streaming writes. Set checkpoint location for fault tolerance. This ensures exactly-once processing and recovery from failures.',
                action: {
                    type: 'drag',
                    target: 'DeltaTableSink',
                    description: 'Drag Delta Table Sink for streaming'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'configure-checkpoint',
                title: 'Step 5: Configure Checkpoint Location',
                message: 'In the Delta Table Sink properties, set checkpoint location (e.g., /checkpoints/kafka-delta). This stores streaming state and enables recovery from failures.',
                action: {
                    type: 'click',
                    target: 'properties',
                    description: 'Configure checkpoint location'
                },
                highlight: {
                    area: 'properties'
                },
                canSkip: true
            },
            {
                id: 'add-late-data',
                title: 'Step 6: Handle Late Data',
                message: 'Configure watermarks and late data handling in the transform. Set watermark threshold and late data policy (drop or process). This handles out-of-order events.',
                action: {
                    type: 'click',
                    target: 'properties',
                    description: 'Configure late data handling'
                },
                highlight: {
                    area: 'properties'
                },
                canSkip: true
            },
            {
                id: 'connect-streaming',
                title: 'Step 7: Connect Streaming Pipeline',
                message: 'Connect Kafka Stream -> Streaming Transform -> Delta Table Sink. This creates the complete streaming pipeline. The pipeline will process events in real-time.',
                action: {
                    type: 'connect',
                    description: 'Connect streaming pipeline'
                },
                highlight: {
                    area: 'canvas'
                },
                canSkip: true
            },
            {
                id: 'monitor-streaming',
                title: 'Step 8: Monitor Streaming Metrics',
                message: 'Add monitoring for streaming metrics: input rate, processing rate, batch duration, and latency. These metrics help optimize streaming performance.',
                action: {
                    type: 'click',
                    target: 'properties',
                    description: 'View streaming metrics'
                },
                highlight: {
                    area: 'properties'
                },
                canSkip: true
            },
            {
                id: 'complete-streaming',
                title: 'Streaming Pipeline Complete!',
                message: 'You\'ve built a complete streaming ETL pipeline! This pipeline processes events in real-time from Kafka, transforms them, and writes to Delta Lake with fault tolerance. Try running the simulation to see streaming data flow.',
                canSkip: false
            }
        ]
    },
    {
        id: 'db-delta-live-tables',
        name: 'Delta Live Tables Pipeline',
        description: 'Build a declarative pipeline with Delta Live Tables and data quality',
        estimatedTime: '10 minutes',
        steps: [
            {
                id: 'welcome-dlt',
                title: 'Delta Live Tables (DLT)',
                message: 'Delta Live Tables provides a declarative approach to building data pipelines with built-in data quality. We\'ll build a DLT pipeline with expectations and materialized views. Click "Next" to start.',
                canSkip: false
            },
            {
                id: 'add-dlt-source',
                title: 'Step 1: Create Source Table with Expectations',
                message: 'Add a "Delta Live Tables Pipeline" component. Configure source table with data quality expectations (e.g., valid email format, non-null values). DLT will enforce these automatically.',
                action: {
                    type: 'drag',
                    target: 'DeltaLiveTables',
                    description: 'Drag Delta Live Tables Pipeline component'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'add-expectations',
                title: 'Step 2: Add Data Quality Expectations',
                message: 'In the DLT component properties, add expectations like expect("valid_email", col("email").rlike("^[A-Za-z0-9+_.-]+@(.+)$")) and expect_or_drop("no_nulls", col("id").isNotNull()).',
                action: {
                    type: 'click',
                    target: 'properties',
                    description: 'Add data quality expectations'
                },
                highlight: {
                    area: 'properties'
                },
                canSkip: true
            },
            {
                id: 'add-dlt-transform',
                title: 'Step 3: Add Transformation with Data Quality Rules',
                message: 'Configure transformations within the DLT pipeline. Add data quality rules for each transformation step. DLT will track data quality metrics automatically.',
                action: {
                    type: 'click',
                    target: 'properties',
                    description: 'Configure DLT transformations'
                },
                highlight: {
                    area: 'properties'
                },
                canSkip: true
            },
            {
                id: 'add-materialized-view',
                title: 'Step 4: Create Materialized View',
                message: 'Add a materialized view in the DLT pipeline. Materialized views are automatically refreshed and provide fast query performance. Configure aggregation logic.',
                action: {
                    type: 'click',
                    target: 'properties',
                    description: 'Configure materialized view'
                },
                highlight: {
                    area: 'properties'
                },
                canSkip: true
            },
            {
                id: 'add-scd-type2',
                title: 'Step 5: Add SCD Type 2 Tracking',
                message: 'Configure Slowly Changing Dimension (SCD) Type 2 tracking in the DLT pipeline. This tracks historical changes with effective dates and current flags.',
                action: {
                    type: 'click',
                    target: 'properties',
                    description: 'Configure SCD Type 2'
                },
                highlight: {
                    area: 'properties'
                },
                canSkip: true
            },
            {
                id: 'configure-pipeline-settings',
                title: 'Step 6: Configure Pipeline Settings',
                message: 'Configure DLT pipeline settings: target catalog/schema, storage location, cluster configuration, and pipeline mode (triggered or continuous).',
                action: {
                    type: 'click',
                    target: 'properties',
                    description: 'Configure pipeline settings'
                },
                highlight: {
                    area: 'properties'
                },
                canSkip: true
            },
            {
                id: 'view-lineage',
                title: 'Step 7: View Lineage Graph',
                message: 'View the data lineage graph for your DLT pipeline. This shows upstream and downstream dependencies, data quality metrics, and transformation flow.',
                action: {
                    type: 'click',
                    target: 'properties',
                    description: 'View lineage graph'
                },
                highlight: {
                    area: 'properties'
                },
                canSkip: true
            },
            {
                id: 'monitor-quality',
                title: 'Step 8: Monitor Data Quality Metrics',
                message: 'Monitor data quality metrics in the DLT pipeline: records processed, records dropped, expectation violations, and data freshness. These metrics help ensure data quality.',
                action: {
                    type: 'click',
                    target: 'properties',
                    description: 'View data quality metrics'
                },
                highlight: {
                    area: 'properties'
                },
                canSkip: true
            },
            {
                id: 'complete-dlt',
                title: 'DLT Pipeline Complete!',
                message: 'You\'ve built a complete Delta Live Tables pipeline with data quality expectations, materialized views, and SCD Type 2 tracking! DLT provides automatic data quality enforcement and lineage tracking. Try running the simulation to see data flow through the pipeline.',
                canSkip: false
            }
        ]
    }
];

