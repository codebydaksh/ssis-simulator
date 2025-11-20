import { SSISComponent, Connection } from './types';

export interface SampleRow {
    [key: string]: string | number | boolean | null;
}

export interface ComponentDataPreview {
    componentId: string;
    componentName: string;
    rows: SampleRow[];
    rowCount: number;
}

// Generate sample data based on component type and category
export function generateSampleData(
    component: SSISComponent,
    upstreamData?: SampleRow[]
): SampleRow[] {
    const sampleSize = 5; // Show 5 sample rows

    // Generate data based on component type
    if (component.type === 'data-movement' || component.type === 'control-flow' || component.type === 'transformation') {
        return generateADFSampleData(component, upstreamData);
    }

    // If we have upstream data, transform it based on component type
    if (upstreamData && upstreamData.length > 0) {
        return transformData(component, upstreamData, sampleSize);
    }

    // Generate initial data for sources
    return generateSourceData(component, sampleSize);
}

function generateADFSampleData(component: SSISComponent, upstreamData?: SampleRow[]): SampleRow[] {
    const count = 5;
    // For ADF, we simulate data based on activity type
    switch (component.category) {
        case 'CopyData':
            return [
                { Source: 'Blob Storage', Destination: 'SQL Database', RowsCopied: 1000, Status: 'Succeeded' },
                { Source: 'Blob Storage', Destination: 'SQL Database', RowsCopied: 2500, Status: 'Succeeded' },
                { Source: 'Blob Storage', Destination: 'SQL Database', RowsCopied: 500, Status: 'Succeeded' }
            ];
        case 'MappingDataFlow':
            return upstreamData ? upstreamData.map(r => ({ ...r, Transformed: true })) : [
                { ID: 1, Value: 'Transformed Data 1' },
                { ID: 2, Value: 'Transformed Data 2' }
            ];
        case 'WebActivity':
            return [
                { Response: '200 OK', Body: '{ "status": "success" }', Duration: '120ms' }
            ];
        case 'GetMetadata':
            return [
                { ItemName: 'file1.csv', ItemType: 'File', Size: 1024, LastModified: '2024-01-01' },
                { ItemName: 'file2.csv', ItemType: 'File', Size: 2048, LastModified: '2024-01-02' }
            ];
        case 'ForEach':
            return [
                { Item: 'file1.csv', Index: 0 },
                { Item: 'file2.csv', Index: 1 }
            ];
        case 'Wait':
            return [
                { Status: 'Waiting...', Duration: '5s' }
            ];
        default:
            return [{ Status: 'Executed', Activity: component.name }];
    }
}

function generateSourceData(component: SSISComponent, count: number): SampleRow[] {
    const rows: SampleRow[] = [];

    // Generate data based on source type
    if (component.category === 'OLEDBSource') {
        // Simulate database table data
        for (let i = 1; i <= count; i++) {
            rows.push({
                CustomerID: 1000 + i,
                FirstName: `John${i}`,
                LastName: `Doe${i}`,
                Email: `john${i}.doe@example.com`,
                Phone: `555-000${i}`,
                CreatedDate: `2024-01-${String(i).padStart(2, '0')}`,
                IsActive: i % 2 === 0,
                Balance: (100.50 + i * 10).toFixed(2)
            });
        }
    } else if (component.category === 'FlatFileSource') {
        // Simulate CSV data
        for (let i = 1; i <= count; i++) {
            rows.push({
                OrderID: `ORD-${String(i).padStart(4, '0')}`,
                ProductName: `Product ${i}`,
                Quantity: i * 2,
                UnitPrice: (9.99 + i).toFixed(2),
                OrderDate: `2024-01-${String(i).padStart(2, '0')}`
            });
        }
    } else if (component.category === 'ExcelSource') {
        // Simulate Excel data
        for (let i = 1; i <= count; i++) {
            rows.push({
                EmployeeID: `EMP${i}`,
                Name: `Employee ${i}`,
                Department: ['Sales', 'IT', 'HR', 'Finance', 'Marketing'][i % 5],
                Salary: 50000 + i * 1000,
                HireDate: `2023-${String((i % 12) + 1).padStart(2, '0')}-15`
            });
        }
    } else if (component.category === 'JSONSource') {
        // Simulate JSON data
        for (let i = 1; i <= count; i++) {
            rows.push({
                id: i,
                name: `Item ${i}`,
                category: ['Electronics', 'Clothing', 'Food', 'Books', 'Toys'][i % 5],
                price: 19.99 + i * 5,
                inStock: i % 3 !== 0
            });
        }
    } else if (component.category === 'XMLSource') {
        // Simulate XML data
        for (let i = 1; i <= count; i++) {
            rows.push({
                TransactionID: `TXN-${i}`,
                Amount: (100 + i * 25).toFixed(2),
                Currency: 'USD',
                Timestamp: `2024-01-${String(i).padStart(2, '0')}T10:00:00Z`
            });
        }
    } else {
        // Default generic data
        for (let i = 1; i <= count; i++) {
            rows.push({
                ID: i,
                Name: `Record ${i}`,
                Value: i * 10,
                Status: i % 2 === 0 ? 'Active' : 'Inactive'
            });
        }
    }

    return rows;
}

function transformData(
    component: SSISComponent,
    inputData: SampleRow[],
    maxRows: number
): SampleRow[] {
    if (inputData.length === 0) return [];

    const sampleData = inputData.slice(0, maxRows);
    const firstRow = sampleData[0];
    const keys = Object.keys(firstRow);

    switch (component.category) {
        case 'DataConversion':
            // Simulate type conversion
            return sampleData.map(row => {
                const converted: SampleRow = { ...row };
                // Convert numeric strings to numbers
                keys.forEach(key => {
                    if (typeof row[key] === 'string' && !isNaN(Number(row[key])) && row[key] !== '') {
                        converted[key] = Number(row[key]);
                    }
                });
                return converted;
            });

        case 'DerivedColumn':
            // Simulate derived column calculation
            return sampleData.map((row) => {
                const derived: SampleRow = { ...row };
                // Add a calculated column
                if (keys.includes('FirstName') && keys.includes('LastName')) {
                    derived['FullName'] = `${row.FirstName} ${row.LastName}`;
                } else if (keys.includes('Quantity') && keys.includes('UnitPrice')) {
                    derived['Total'] = Number(row.Quantity) * Number(row.UnitPrice);
                } else {
                    derived['CalculatedValue'] = (Number(row[keys[0]]) || 0) * 1.1;
                }
                return derived;
            });

        case 'ConditionalSplit':
            // Simulate conditional split - show filtered data
            return sampleData.filter((row, idx) => {
                // Simple condition: keep even-indexed rows
                return idx % 2 === 0;
            });

        case 'Sort':
            // Simulate sorting - return sorted by first numeric or string key
            const sorted = [...sampleData];
            const sortKey = keys.find(k => typeof firstRow[k] === 'number') || keys[0];
            sorted.sort((a, b) => {
                const aVal = a[sortKey];
                const bVal = b[sortKey];
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return aVal - bVal;
                }
                return String(aVal).localeCompare(String(bVal));
            });
            return sorted;

        case 'Aggregate':
            // Simulate aggregation - return summary rows
            if (keys.includes('Department')) {
                const grouped: { [key: string]: SampleRow } = {};
                sampleData.forEach(row => {
                    const dept = String(row.Department || 'Unknown');
                    if (!grouped[dept]) {
                        grouped[dept] = {
                            Department: dept,
                            Count: 0,
                            TotalSalary: 0
                        };
                    }
                    grouped[dept].Count = (grouped[dept].Count as number) + 1;
                    grouped[dept].TotalSalary = (grouped[dept].TotalSalary as number) + (Number(row.Salary) || 0);
                });
                return Object.values(grouped).slice(0, maxRows);
            }
            // Generic aggregation
            return [{
                TotalRecords: sampleData.length,
                Sum: sampleData.reduce((sum, row) => sum + (Number(row[keys.find(k => typeof row[k] === 'number') || keys[0]]) || 0), 0),
                Average: sampleData.reduce((sum, row) => sum + (Number(row[keys.find(k => typeof row[k] === 'number') || keys[0]]) || 0), 0) / sampleData.length
            }];

        case 'Lookup':
            // Simulate lookup - add lookup columns
            return sampleData.map(row => {
                const lookedUp: SampleRow = { ...row };
                lookedUp['LookupValue'] = `Lookup-${row[keys[0]]}`;
                lookedUp['LookupStatus'] = 'Found';
                return lookedUp;
            });

        case 'UnionAll':
            // Simulate union - combine data (in real scenario, would merge multiple inputs)
            return sampleData;

        case 'MergeJoin':
            // Simulate merge join - combine columns from two sources
            return sampleData.map(row => {
                const merged: SampleRow = { ...row };
                merged['JoinedValue'] = `Joined-${row[keys[0]]}`;
                return merged;
            });

        case 'Multicast':
            // Multicast just passes data through
            return sampleData;

        case 'RowCount':
            // RowCount passes data through but tracks count
            return sampleData;

        default:
            // Default: pass through
            return sampleData;
    }
}

// Generate data preview for entire pipeline
export function generatePipelineDataPreview(
    components: SSISComponent[],
    connections: Connection[]
): ComponentDataPreview[] {
    const previews: ComponentDataPreview[] = [];
    const dataCache: Map<string, SampleRow[]> = new Map();

    // Process components in topological order (sources first)
    const processed = new Set<string>();
    const queue: string[] = [];

    // Start with sources
    components.forEach(comp => {
        if (comp.type === 'source' || comp.type === 'data-movement' || (comp.type === 'control-flow' && !connections.some(c => c.target === comp.id))) {
            queue.push(comp.id);
        }
    });

    while (queue.length > 0) {
        const compId = queue.shift()!;
        if (processed.has(compId)) continue;

        const component = components.find(c => c.id === compId);
        if (!component) continue;

        // Get upstream data
        const inputConnections = connections.filter(c => c.target === compId);
        let upstreamData: SampleRow[] | undefined;

        if (inputConnections.length > 0) {
            // Get data from first upstream component
            const upstreamId = inputConnections[0].source;
            upstreamData = dataCache.get(upstreamId);
        }

        // Generate data for this component
        const componentData = generateSampleData(component, upstreamData);
        dataCache.set(compId, componentData);

        previews.push({
            componentId: compId,
            componentName: component.name,
            rows: componentData,
            rowCount: componentData.length
        });

        processed.add(compId);

        // Add downstream components to queue
        const outputConnections = connections.filter(c => c.source === compId);
        outputConnections.forEach(conn => {
            const targetComp = components.find(c => c.id === conn.target);
            if (targetComp && !processed.has(conn.target)) {
                // Check if all inputs are processed
                const allInputsProcessed = connections
                    .filter(c => c.target === conn.target)
                    .every(c => processed.has(c.source));
                if (allInputsProcessed) {
                    queue.push(conn.target);
                }
            }
        });
    }

    return previews;
}

