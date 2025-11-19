export interface TutorialStep {
    id: string;
    title: string;
    message: string;
    action?: {
        type: 'click' | 'drag' | 'connect' | 'select';
        target?: string;
        description: string;
    };
    highlight?: {
        componentId?: string;
        area?: 'toolbox' | 'canvas' | 'properties';
    };
    canSkip: boolean;
}

export interface Tutorial {
    id: string;
    name: string;
    description: string;
    estimatedTime: string;
    steps: TutorialStep[];
}

export const TUTORIALS: Tutorial[] = [
    {
        id: 'first-pipeline',
        name: 'Your First Pipeline',
        description: 'Learn to build a basic ETL pipeline from scratch',
        estimatedTime: '5 minutes',
        steps: [
            {
                id: 'welcome',
                title: 'Welcome to SSIS Simulator!',
                message: 'Let\'s build your first data pipeline. This tutorial will guide you through creating a simple ETL (Extract, Transform, Load) process. Click "Next" to continue.',
                canSkip: false
            },
            {
                id: 'add-source',
                title: 'Step 1: Add a Data Source',
                message: 'First, we need a source of data. Drag an "OLE DB Source" component from the Toolbox on the left and drop it onto the canvas. This represents reading data from a database.',
                action: {
                    type: 'drag',
                    target: 'OLEDBSource',
                    description: 'Drag OLE DB Source to canvas'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'add-transform',
                title: 'Step 2: Add a Transformation',
                message: 'Now let\'s add a transformation. Drag a "Derived Column" component to the canvas. This will allow us to create calculated columns or modify data.',
                action: {
                    type: 'drag',
                    target: 'DerivedColumn',
                    description: 'Drag Derived Column to canvas'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'connect',
                title: 'Step 3: Connect Components',
                message: 'Connect the source to the transformation. Click on the output handle (right side) of the OLE DB Source, then drag to the input handle (left side) of the Derived Column.',
                action: {
                    type: 'connect',
                    description: 'Connect source to transformation'
                },
                highlight: {
                    area: 'canvas'
                },
                canSkip: true
            },
            {
                id: 'add-destination',
                title: 'Step 4: Add a Destination',
                message: 'Now add a destination to store the transformed data. Drag an "OLE DB Destination" component to the canvas.',
                action: {
                    type: 'drag',
                    target: 'OLEDBDestination',
                    description: 'Drag OLE DB Destination to canvas'
                },
                highlight: {
                    area: 'toolbox'
                },
                canSkip: true
            },
            {
                id: 'connect-destination',
                title: 'Step 5: Connect to Destination',
                message: 'Connect the Derived Column to the OLE DB Destination. This completes your data flow: Source → Transform → Destination.',
                action: {
                    type: 'connect',
                    description: 'Connect transformation to destination'
                },
                highlight: {
                    area: 'canvas'
                },
                canSkip: true
            },
            {
                id: 'validate',
                title: 'Step 6: Validate Your Pipeline',
                message: 'Great! Check the Validation Results panel at the bottom. It will show any errors or warnings. A valid pipeline should have no errors.',
                action: {
                    type: 'select',
                    description: 'Check validation results'
                },
                highlight: {
                    area: 'canvas'
                },
                canSkip: true
            },
            {
                id: 'complete',
                title: 'Congratulations!',
                message: 'You\'ve built your first SSIS pipeline! You can now explore more components, try templates, or build more complex pipelines. Click "Finish" to close this tutorial.',
                canSkip: false
            }
        ]
    },
    {
        id: 'data-transformation',
        name: 'Data Transformation Basics',
        description: 'Learn how to transform and clean data',
        estimatedTime: '7 minutes',
        steps: [
            {
                id: 'intro',
                title: 'Data Transformation Tutorial',
                message: 'In this tutorial, you\'ll learn how to transform data using various transformation components. Let\'s start!',
                canSkip: false
            },
            {
                id: 'add-source',
                title: 'Add a Source',
                message: 'Start by adding a Flat File Source to the canvas. This represents reading data from a CSV file.',
                action: {
                    type: 'drag',
                    target: 'FlatFileSource',
                    description: 'Drag Flat File Source to canvas'
                },
                canSkip: true
            },
            {
                id: 'add-conversion',
                title: 'Add Data Conversion',
                message: 'CSV files contain text data. Add a Data Conversion component to convert text to proper data types (numbers, dates, etc.).',
                action: {
                    type: 'drag',
                    target: 'DataConversion',
                    description: 'Drag Data Conversion to canvas'
                },
                canSkip: true
            },
            {
                id: 'add-derived',
                title: 'Add Derived Column',
                message: 'Add a Derived Column to create calculated fields or clean data. For example, you could concatenate first and last names.',
                action: {
                    type: 'drag',
                    target: 'DerivedColumn',
                    description: 'Drag Derived Column to canvas'
                },
                canSkip: true
            },
            {
                id: 'connect-all',
                title: 'Connect the Pipeline',
                message: 'Connect: Flat File Source → Data Conversion → Derived Column → Destination. This shows a typical data cleaning pipeline.',
                action: {
                    type: 'connect',
                    description: 'Connect all components'
                },
                canSkip: true
            },
            {
                id: 'complete',
                title: 'Well Done!',
                message: 'You\'ve learned the basics of data transformation. Try exploring other transformations like Sort, Aggregate, or Conditional Split!',
                canSkip: false
            }
        ]
    },
    {
        id: 'error-handling',
        name: 'Error Handling',
        description: 'Learn how to handle errors in your pipeline',
        estimatedTime: '6 minutes',
        steps: [
            {
                id: 'intro',
                title: 'Error Handling Tutorial',
                message: 'Learn how to handle data quality issues and errors gracefully in your pipelines.',
                canSkip: false
            },
            {
                id: 'add-lookup',
                title: 'Add Lookup Component',
                message: 'Add a Lookup component. Lookups can fail if reference data is missing. We\'ll show you how to handle this.',
                action: {
                    type: 'drag',
                    target: 'Lookup',
                    description: 'Drag Lookup to canvas'
                },
                canSkip: true
            },
            {
                id: 'add-split',
                title: 'Add Conditional Split',
                message: 'Add a Conditional Split component. This allows you to route rows based on conditions - perfect for separating valid and invalid data.',
                action: {
                    type: 'drag',
                    target: 'ConditionalSplit',
                    description: 'Drag Conditional Split to canvas'
                },
                canSkip: true
            },
            {
                id: 'explain',
                title: 'Error Handling Pattern',
                message: 'The pattern: Source → Lookup → Conditional Split → [Valid Data Destination] and [Error Log Destination]. This routes errors to a separate destination for review.',
                canSkip: true
            },
            {
                id: 'complete',
                title: 'Error Handling Complete',
                message: 'You now understand error handling patterns. Always configure error outputs for robust pipelines!',
                canSkip: false
            }
        ]
    }
];

export function getTutorial(id: string): Tutorial | undefined {
    return TUTORIALS.find(t => t.id === id);
}

export function getTutorialStep(tutorialId: string, stepId: string): TutorialStep | undefined {
    const tutorial = getTutorial(tutorialId);
    return tutorial?.steps.find(s => s.id === stepId);
}

