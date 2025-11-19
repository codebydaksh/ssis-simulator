# SSIS Data Flow Simulator

A fully interactive SSIS Data Flow Simulator that helps developers learn SSIS concepts through hands-on visual design. Build pipelines, see data flow, get real-time validation, and learn from 50+ real-world templates.

## What This Does

Think of this as a visual playground for learning SSIS. Instead of installing SQL Server and Visual Studio, you can build and test SSIS data flow pipelines right in your browser. Drag components, connect them, see sample data flow through, and get instant feedback on what works and what doesn't.

## Features

### Core Functionality
- **Visual Pipeline Builder**: Drag and drop SSIS components onto a canvas, connect them, and build complete ETL pipelines
- **Real-time Validation**: Get instant feedback on connection compatibility, data type mismatches, and best practices
- **50+ Templates**: Pre-built pipelines covering Healthcare, Finance, E-commerce, and advanced patterns like CDC, SCD Type 3, Data Vault, and more
- **Data Flow Preview**: Click the Preview button to see sample data flowing through your pipeline at each component
- **Performance Simulation**: Estimate how your pipeline will perform with different data volumes and identify bottlenecks

### Learning Features
- **Interactive Tutorials**: Step-by-step guided tutorials that walk you through building your first pipeline
- **Component Comparison**: Compare any two components side-by-side to understand when to use each one
- **Enhanced Error Tooltips**: Click any validation error to see detailed explanations, why it matters, and step-by-step fix guides
- **40+ Validation Rules**: Comprehensive validation covering performance, best practices, and data quality

### Productivity Features
- **Dark Mode**: Toggle between light and dark themes
- **Copy/Paste**: Duplicate components with Ctrl+C/Ctrl+V
- **Shareable Links**: Generate shareable URLs that encode your entire pipeline
- **Editable Properties**: Configure component properties directly in the UI
- **Undo/Redo**: Full history management with Ctrl+Z/Ctrl+Y
- **Auto-save**: Automatically saves your work to localStorage every 30 seconds
- **Export/Import**: Save pipelines as JSON files and load them back

## Getting Started

### Prerequisites

You'll need Node.js 18 or higher. If you don't have it, download it from [nodejs.org](https://nodejs.org/).

### Clone and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/codebydaksh/ssis-simulator.git
   cd ssis-simulator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

That's it! You should see the SSIS Simulator interface.

### Building for Production

If you want to build a production version:

```bash
npm run build
npm start
```

## How to Use

### Your First Pipeline

1. **Start a Tutorial**: Click the "Tutorials" button in the header and choose "Your First Pipeline". This will guide you step-by-step.

2. **Or Build Manually**:
   - Drag an "OLE DB Source" from the Toolbox (left sidebar) onto the canvas
   - Drag a "Derived Column" transformation next to it
   - Drag an "OLE DB Destination" to the right
   - Connect them by clicking the output handle (right side) of the source and dragging to the input handle (left side) of the transformation
   - Connect the transformation to the destination the same way

3. **Check Validation**: Look at the Validation Results panel at the bottom. It will show any errors or warnings.

4. **Preview Data**: Click the "Preview" button to see sample data flowing through your pipeline.

### Exploring Templates

Click the "Templates" button to browse 50+ pre-built pipelines:
- Filter by category (Healthcare, Finance, E-commerce, Advanced Patterns)
- Search by name, description, or tags
- Click any template to load it onto your canvas

### Learning More

- **Compare Components**: Click "Compare" to see side-by-side comparisons of components like Lookup vs Merge Join
- **Understand Errors**: Click any error in the validation panel to see detailed explanations and fix guides
- **Try Tutorials**: Complete all three tutorials to learn the fundamentals

## Keyboard Shortcuts

- `Ctrl+Z` - Undo
- `Ctrl+Y` or `Ctrl+Shift+Z` - Redo
- `Ctrl+S` - Save (also auto-saves every 30 seconds)
- `Ctrl+C` - Copy selected component
- `Ctrl+V` - Paste component
- `Delete` - Remove selected component
- `Escape` - Deselect component

## Project Structure

```
ssis-simulator/
├── app/
│   ├── canvas/              # Main canvas page
│   ├── layout.tsx           # Root layout with theme provider
│   └── globals.css          # Global styles with dark mode
├── components/
│   ├── canvas/              # Canvas UI components
│   │   ├── Canvas.tsx       # Main canvas with React Flow
│   │   ├── Toolbox.tsx      # Component palette
│   │   ├── PropertiesPanel.tsx  # Component properties editor
│   │   ├── ErrorPanel.tsx  # Validation results
│   │   ├── DataPreviewModal.tsx  # Data flow preview
│   │   ├── ComponentComparisonModal.tsx  # Component comparison
│   │   ├── TutorialDialog.tsx  # Interactive tutorials
│   │   └── ...
│   └── ssis/                # SSIS component node types
├── lib/
│   ├── dataGenerator.ts    # Sample data generation for preview
│   ├── validationEngine.ts  # 40+ validation rules
│   ├── templates.ts         # 50+ pipeline templates
│   ├── tutorials.ts         # Tutorial definitions
│   ├── performanceSimulator.ts  # Performance estimation
│   └── ...
├── store/
│   └── canvasStore.ts       # Zustand state management
└── public/                  # Static assets
```

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling with dark mode support
- **React Flow** - Node-based diagram library for the canvas
- **Zustand** - Lightweight state management
- **Lucide React** - Icon library

## Deployment

### Vercel (Recommended)

This project is already configured for Vercel. If you've connected your GitHub repo to Vercel, it will automatically deploy when you push to main.

**Manual deployment:**
```bash
npm i -g vercel
vercel --prod
```

The `vercel.json` file handles the configuration automatically.

### Other Platforms

Since this is a Next.js app, you can deploy it anywhere Next.js is supported:
- Netlify
- AWS Amplify
- Railway
- Your own server with Node.js

Just make sure to run `npm run build` and serve the output.

## What's Included

### Templates (50+)
- **Healthcare**: Patient data integration, HIPAA-compliant ETL, medical records, lab results, claims processing
- **Finance**: Transaction reconciliation, regulatory reporting, risk aggregation, financial statements, audit trails
- **E-commerce**: Order processing, inventory management, customer segmentation, sales analytics, catalog sync
- **Advanced Patterns**: CDC, SCD Type 3, Data Vault, Star Schema, incremental loads, data quality frameworks, master data management, data lineage, metadata management

### Validation Rules (40+)
- **Connection Rules**: Data type compatibility, circular dependency detection
- **Performance Rules**: Sort optimization, lookup patterns, aggregate efficiency
- **Best Practices**: Error output configuration, logging, connection strings, incremental loads
- **Data Quality**: Null handling, precision warnings, data cleansing, duplicate detection

### Components
All standard SSIS data flow components:
- **Sources**: OLE DB, Flat File, Excel, JSON, XML
- **Transformations**: Data Conversion, Derived Column, Lookup, Merge Join, Sort, Aggregate, Union All, Conditional Split, Multicast, Row Count
- **Destinations**: OLE DB, Flat File, Excel

## Contributing

This is currently a private project for internal use. If you're part of the team and want to contribute, feel free to submit pull requests or open issues.

## License

Private - Internal use only

## Support

If you run into issues or have questions, check the validation errors panel for helpful guidance, or explore the templates to see working examples of common patterns.
