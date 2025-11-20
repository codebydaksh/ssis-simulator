import { Tutorial } from './tutorials';

export const ADF_TUTORIALS: Tutorial[] = [
    {
        id: 'adf-first-pipeline',
        name: 'Your First ADF Pipeline',
        description: 'Build a simple Copy Data pipeline',
        estimatedTime: '5 minutes',
        steps: [
            {
                id: 'welcome',
                title: 'Welcome to ADF Mode!',
                message: 'Let\'s build your first Azure Data Factory pipeline. We will create a simple data movement task. Click "Next" to start.',
                canSkip: false
            },
            {
                id: 'add-copy',
                title: 'Add Copy Data Activity',
                message: 'Drag a "Copy Data" activity from the "Data Movement" category in the toolbox to the canvas. This activity copies data between data stores.',
                action: {
                    type: 'drag',
                    target: 'CopyData',
                    description: 'Drag Copy Data to canvas'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'add-wait',
                title: 'Add Wait Activity',
                message: 'Now add a "Wait" activity from the "Control Flow" category. This simulates a delay or dependency.',
                action: {
                    type: 'drag',
                    target: 'Wait',
                    description: 'Drag Wait to canvas'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'connect',
                title: 'Connect Activities',
                message: 'Connect the "Copy Data" activity to the "Wait" activity. This defines the execution order: Copy Data runs first, then Wait.',
                action: {
                    type: 'connect',
                    description: 'Connect Copy Data to Wait'
                },
                highlight: {
                    area: 'canvas'
                },
                canSkip: true
            },
            {
                id: 'validate',
                title: 'Validate Pipeline',
                message: 'Check the validation panel. You might see warnings about missing properties (like Linked Services), which is expected in this simulation.',
                action: {
                    type: 'select',
                    description: 'Check validation'
                },
                canSkip: true
            },
            {
                id: 'complete',
                title: 'Pipeline Complete!',
                message: 'You have built a simple sequential pipeline. In ADF, you would now configure the Source and Sink datasets for the Copy activity.',
                canSkip: false
            }
        ]
    },
    {
        id: 'adf-control-flow',
        name: 'Control Flow Logic',
        description: 'Learn to use If Condition and ForEach',
        estimatedTime: '8 minutes',
        steps: [
            {
                id: 'intro',
                title: 'Control Flow Tutorial',
                message: 'ADF pipelines often require logic. We will use "If Condition" to branch execution.',
                canSkip: false
            },
            {
                id: 'add-if',
                title: 'Add If Condition',
                message: 'Drag an "If Condition" activity to the canvas. This evaluates an expression to decide which path to take.',
                action: {
                    type: 'drag',
                    target: 'IfCondition',
                    description: 'Drag If Condition to canvas'
                },
                canSkip: true
            },
            {
                id: 'add-activities',
                title: 'Add Branch Activities',
                message: 'Add two "Wait" activities. One will represent the "True" path, and the other the "False" path.',
                action: {
                    type: 'drag',
                    target: 'Wait',
                    description: 'Add two Wait activities'
                },
                canSkip: true
            },
            {
                id: 'connect-branches',
                title: 'Connect Branches',
                message: 'Connect the "If Condition" to both "Wait" activities. In a real ADF designer, you would put these activities *inside* the If Condition, but here we visualize flow with connections.',
                action: {
                    type: 'connect',
                    description: 'Connect If Condition to Wait activities'
                },
                canSkip: true
            },
            {
                id: 'complete',
                title: 'Logic Implemented',
                message: 'You have created a branching logic pipeline. You can also explore "ForEach" and "Switch" for more complex control flows.',
                canSkip: false
            }
        ]
    },
    {
        id: 'adf-data-flow',
        name: 'Mapping Data Flow',
        description: 'Design a visual data transformation',
        estimatedTime: '6 minutes',
        steps: [
            {
                id: 'intro',
                title: 'Mapping Data Flow',
                message: 'Mapping Data Flows allow you to build data transformation logic visually, similar to SSIS Data Flow.',
                canSkip: false
            },
            {
                id: 'add-dataflow',
                title: 'Add Data Flow Activity',
                message: 'Drag a "Data Flow" activity from the "Transformation" category.',
                action: {
                    type: 'drag',
                    target: 'MappingDataFlow',
                    description: 'Drag Data Flow to canvas'
                },
                canSkip: true
            },
            {
                id: 'explain',
                title: 'Data Flow Concept',
                message: 'In ADF, the Data Flow activity executes a separate transformation logic on a Spark cluster. It handles large-scale data processing.',
                canSkip: true
            },
            {
                id: 'complete',
                title: 'Transformation Ready',
                message: 'You can chain multiple Data Flow activities or combine them with Control Flow activities like "Execute Pipeline".',
                canSkip: false
            }
        ]
    },
    {
        id: 'adf-error-handling',
        name: 'Error Handling and Retries',
        description: 'Build resilient pipelines with error handling',
        estimatedTime: '7 minutes',
        steps: [
            {
                id: 'intro',
                title: 'Error Handling in ADF',
                message: 'ADF provides multiple ways to handle failures: retry policies, conditional paths, and failure dependencies. Let\'s explore these patterns.',
                canSkip: false
            },
            {
                id: 'add-copy',
                title: 'Add Copy Data Activity',
                message: 'Add a \"Copy Data\" activity. This represents a data movement task that could fail.',
                action: {
                    type: 'drag',
                    target: 'CopyData',
                    description: 'Drag Copy Data to canvas'
                },
                canSkip: true
            },
            {
                id: 'add-success',
                title: 'Add Success Path',
                message: 'Add a \"Web Activity\" that will run on successful completion. This could send a success notification.',
                action: {
                    type: 'drag',
                    target: 'WebActivity',
                    description: 'Drag Web Activity for success path'
                },
                canSkip: true
            },
            {
                id: 'add-failure',
                title: 'Add Failure Path',
                message: 'Add a \"Set Variable\" activity that will run on failure. This could log the error or set a failure flag.',
                action: {
                    type: 'drag',
                    target: 'SetVariable',
                    description: 'Drag Set Variable for failure path'
                },
                canSkip: true
            },
            {
                id: 'connect-success',
                title: 'Connect Success Path',
                message: 'Connect the Copy Data\'s SUCCESS handle (green) to the Web Activity. Use the middle green handle on the right side.',
                action: {
                    type: 'connect',
                    description: 'Connect via Success handle'
                },
                canSkip: true
            },
            {
                id: 'connect-failure',
                title: 'Connect Failure Path',
                message: 'Connect the Copy Data\'s FAILURE handle (red) to the Set Variable. Use the bottom red handle on the right side.',
                action: {
                    type: 'connect',
                    description: 'Connect via Failure handle'
                },
                canSkip: true
            },
            {
                id: 'explain-retry',
                title: 'Retry Policies',
                message: 'In real ADF, you can configure retry count and timeout in the policy settings. Activities can retry automatically before triggering the failure path.',
                canSkip: true
            },
            {
                id: 'complete',
                title: 'Robust Pipeline Created',
                message: 'You have created a pipeline with proper error handling. Both success and failure scenarios are covered, making your pipeline production-ready.',
                canSkip: false
            }
        ]
    },
    {
        id: 'adf-parameterization',
        name: 'Parameterization and Variables',
        description: 'Create dynamic pipelines with parameters',
        estimatedTime: '8 minutes',
        steps: [
            {
                id: 'intro',
                title: 'Dynamic Pipelines',
                message: 'Parameters and variables make your pipelines reusable and dynamic. Let\'s build a pipeline that uses them.',
                canSkip: false
            },
            {
                id: 'concept',
                title: 'Parameters vs Variables',
                message: 'PARAMETERS: Passed when triggering the pipeline (read-only). VARIABLES: Set and modified during pipeline execution (read-write).',
                canSkip: false
            },
            {
                id: 'add-setvariable',
                title: 'Add Set Variable',
                message: 'Add a \"Set Variable\" activity. This will initialize a variable at the start of the pipeline.',
                action: {
                    type: 'drag',
                    target: 'SetVariable',
                    description: 'Drag Set Variable'
                },
                canSkip: true
            },
            {
                id: 'add-foreach',
                title: 'Add ForEach Loop',
                message: 'Add a \"ForEach\" activity. This will iterate over a collection (like file names or database tables).',
                action: {
                    type: 'drag',
                    target: 'ForEach',
                    description: 'Drag ForEach'
                },
                canSkip: true
            },
            {
                id: 'add-copy',
                title: 'Add Copy Inside Loop',
                message: 'Add a \"Copy Data\" activity. In a real scenario, this would copy each file or table found in the loop.',
                action: {
                    type: 'drag',
                    target: 'CopyData',
                    description: 'Drag Copy Data'
                },
                canSkip: true
            },
            {
                id: 'connect-flow',
                title: 'Connect Activities',
                message: 'Connect Set Variable -> ForEach -> Copy Data. This represents: initialize variable, loop through items, process each item.',
                action: {
                    type: 'connect',
                    description: 'Connect in sequence'
                },
                canSkip: true
            },
            {
                id: 'explain-usage',
                title: 'Real-World Example',
                message: 'Example: Parameter \'FolderPath\' = \'/data/2024\', Variable \'FileCount\' = 0. ForEach processes all files in FolderPath, incrementing FileCount for each file copied.',
                canSkip: true
            },
            {
                id: 'complete',
                title: 'Dynamic Pipeline Complete',
                message: 'You have learned to use variables and loops. This pattern is essential for processing multiple files, tables, or any dynamic datasets in ADF.',
                canSkip: false
            }
        ]
    }
];
