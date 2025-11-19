# SSIS Data Flow Simulator

A production-ready, fully interactive SSIS Data Flow Simulator that teaches developers SSIS concepts through hands-on visual design and real-time validation.

## Features

- **Drag & Drop Interface**: Build SSIS pipelines visually with drag-and-drop components
- **Real-time Validation**: Get instant feedback on connection compatibility and best practices
- **25+ Templates**: Pre-built templates covering common ETL patterns
- **Performance Simulation**: Estimate pipeline performance with different data volumes
- **Optimization Suggestions**: AI-powered suggestions for improving your pipelines
- **Undo/Redo**: Full history management with keyboard shortcuts
- **Export/Import**: Save and share your pipelines as JSON files
- **Auto-save**: Automatic saving to localStorage every 30 seconds

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Deploy on Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
cd ssis-simulator
vercel
```

3. For production deployment:
```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Set the root directory to `ssis-simulator`
6. Click "Deploy"

The `vercel.json` file is already configured for optimal deployment.

## Project Structure

```
ssis-simulator/
├── app/                    # Next.js app directory
│   ├── canvas/            # Main canvas page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── canvas/           # Canvas-related components
│   ├── ssis/             # SSIS component nodes
│   └── ui/               # UI components
├── lib/                   # Core logic
│   ├── performanceSimulator.ts  # Performance simulation engine
│   ├── validationEngine.ts      # Validation rules
│   ├── optimizationSuggestions.ts # AI suggestions
│   └── templates.ts       # Template library
├── store/                 # Zustand state management
└── public/                # Static assets
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS
- **Diagram Library**: React Flow (@xyflow/react)
- **State Management**: Zustand
- **Icons**: Lucide React

## License

Private - Internal use only
