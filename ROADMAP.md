# SSIS Data Flow Simulator - Development Roadmap

## Phase 1: Core Functionality (Week 1) - CRITICAL FOR ADOPTION

### 1.1 Essential Controls
- [ ] Delete selected component (Delete key / trash icon)
- [ ] Delete selected connection (Delete key)
- [ ] Clear entire canvas (with confirmation)
- [ ] Undo/Redo (Ctrl+Z / Ctrl+Y)

### 1.2 Persistence
- [ ] Save to localStorage (auto-save every 30s)
- [ ] Load from localStorage on app start
- [ ] Export to JSON file (download)
- [ ] Import from JSON file (upload)

### 1.3 Complete Validation Rules (15 total)
Current: ~5 rules | Target: 15+

**Data Type Compatibility:**
- [x] 1. Text source → Structured destination requires Data Conversion
- [x] 2. Structured source → Text destination (allowed)
- [ ] 3. Mixed source → Any destination (validate column types)
- [ ] 4. Nested (JSON/XML) → Structured requires flattening

**Component-Specific:**
- [x] 5. Merge Join requires 2 sorted inputs
- [ ] 6. Merge Join must have same join columns
- [ ] 7. Lookup requires reference input defined
- [ ] 8. Conditional Split must have at least 2 outputs
- [ ] 9. Union All requires matching column counts
- [ ] 10. Aggregate requires GROUP BY columns

**Flow Rules:**
- [x] 11. Circular dependency detection
- [x] 12. Source components have no inputs
- [x] 13. Destination components must have inputs
- [ ] 14. All components except multicast have max 1 output
- [ ] 15. All transformations except conditionalSplit/multicast have exactly 1 output

**Advanced:**
- [ ] 16. Sort order must match join keys for Merge Join
- [ ] 17. Data Conversion duplicates not allowed
- [ ] 18. Orphaned components (no path to destination)

---

## Phase 2: Learning Features (Week 2) - ADOPTION BOOSTERS

### 2.1 Template Library (10+ examples)
Create `lib/templates.ts`:

```typescript
export const TEMPLATES = [
  {
    id: 'basic-etl',
    name: 'Basic ETL: Database to CSV',
    description: 'Extract from SQL, transform, load to Flat File',
    difficulty: 'Beginner',
    components: [...],
    connections: [...]
  },
  {
    id: 'data-cleansing',
    name: 'Data Cleansing Pipeline',
    description: 'Remove duplicates, fix formats, validate data',
    difficulty: 'Intermediate',
    // ...
  },
  // ... 8 more
];
```

Templates to include:
1. Basic ETL (DB → CSV)
2. Data Cleansing
3. Merge Multiple Sources
4. Slowly Changing Dimension (SCD)
5. Error Handling Pattern
6. Incremental Load
7. Lookup & Enrichment
8. Aggregation & Summary
9. Conditional Routing
10. Data Quality Checks

### 2.2 Interactive Tutorial
- [ ] First-time user overlay
- [ ] Step-by-step guide (5 steps):
  1. "Drag OLE DB Source from toolbox"
  2. "Drag Flat File Destination to canvas"
  3. "Connect source to destination"
  4. "See the validation error? Click to learn why"
  5. "Fix by inserting Data Conversion"
- [ ] Dismissable + "Show Tutorial" button

### 2.3 Enhanced Properties Panel
Current: Read-only info
Target: Editable configuration

**For Sources:**
- Connection string input
- Table/Query selector
- Column preview

**For Transformations:**
- Data Conversion: Map columns + types
- Derived Column: Expression builder
- Sort: Select columns + ASC/DESC
- Lookup: Define match columns
- Conditional Split: Define conditions

**For Destinations:**
- Connection string
- Target table

### 2.4 Better Error Messages
Current: "Invalid connection"
Target: "Flat File Source outputs TEXT data, but OLE DB Destination expects STRUCTURED. Insert a Data Conversion transformation."

Add `suggestion` field to ValidationResult:
```typescript
{
  message: "Data type incompatibility",
  suggestion: "Insert Data Conversion between these components",
  autoFixAvailable: true
}
```

---

## Phase 3: Advanced Features (Week 3) - POWER USER

### 3.1 Auto-Fix Engine
```typescript
// When invalid connection detected:
if (source.dataType === 'text' && target.dataType === 'structured') {
  showAutoFixButton({
    action: 'Insert Data Conversion',
    onClick: () => {
      // Automatically insert DataConversion node
      // Re-route connections
      // Update canvas
    }
  });
}
```

### 3.2 Export to SSIS (.dtsx)
Generate basic DTSX XML structure:
```xml
<?xml version="1.0"?>
<DTS:Executable xmlns:DTS="www.microsoft.com/SqlServer/Dts">
  <DTS:DataFlowTask>
    <!-- Components -->
    <!-- Paths -->
  </DTS:DataFlowTask>
</DTS:Executable>
```

### 3.3 Collaboration Features
- [ ] Share pipeline via URL (encode JSON in query param)
- [ ] Copy/Paste components
- [ ] Duplicate entire pipeline

### 3.4 Performance Insights
- [ ] Estimate data flow bottlenecks
- [ ] Show transformation complexity scores
- [ ] Suggest optimizations

---

## Phase 4: Polish & Deployment (Week 4)

### 4.1 UX Enhancements
- [ ] Smooth animations
- [ ] Loading states
- [ ] Toast notifications
- [ ] Keyboard shortcuts panel
- [ ] Dark mode refinements

### 4.2 Documentation
- [ ] README with screenshots
- [ ] API documentation
- [ ] Video tutorial (3-5 min)
- [ ] Blog post: "Learn SSIS in 10 minutes"

### 4.3 Deployment
- [ ] Deploy to Vercel
- [ ] Custom domain
- [ ] Analytics (track common errors, popular templates)
- [ ] Error tracking (Sentry)

### 4.4 Testing
- [ ] Unit tests for validation rules
- [ ] E2E tests (Playwright)
- [ ] Manual testing checklist
- [ ] User acceptance testing

---

## Success Metrics

**Definition of Learning Success:**
- [ ] A developer with ZERO SSIS knowledge can create a valid 3-component pipeline in < 5 minutes
- [ ] 80% of first-time users complete the tutorial
- [ ] < 3% error rate in production
- [ ] 10+ templates load successfully
- [ ] All 15+ validation rules functional

**Technical Success:**
- [ ] npm run build: 0 errors
- [ ] Lighthouse score: 90+
- [ ] No console errors
- [ ] Load time < 2 seconds

---

## Priority Queue (Do This Next)

1. **Delete & Clear** (1 day)
2. **Save/Load localStorage** (1 day)
3. **Complete validation rules** (2 days)
4. **Template library** (2 days)
5. **Interactive tutorial** (2 days)
6. **Enhanced properties** (3 days)
7. **Auto-fix** (2 days)
8. **Export DTSX** (3 days)
