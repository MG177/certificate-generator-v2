# Component Breakdown for Layout Redesign

## New Components to Create

### 1. Layout Components

```
components/layout/
├── sidebar.tsx              # Main sidebar component
├── main-content.tsx         # Main content wrapper
├── page-header.tsx          # Page title component
└── responsive-layout.tsx    # Responsive layout wrapper
```

### 2. Sidebar Components

```
components/sidebar/
├── logo.tsx                 # LumenDev logo component
├── search-bar.tsx           # Event search functionality
├── event-list.tsx           # List of events with diamond icons
├── event-item.tsx           # Individual event item
└── create-event-button.tsx  # Event creation button
```

### 3. Template Adjustment Components

```
components/template-adjustment/
├── certificate-preview.tsx  # Large certificate preview
├── font-controls.tsx        # Font customization controls
├── position-indicators.tsx  # X, Y position display
└── text-selector.tsx        # Name/ID radio button selector
```

### 4. Participant Manager Components

```
components/participant-manager/
├── participant-table.tsx    # Main participant table
├── participant-row.tsx      # Individual participant row
├── csv-actions.tsx          # Download/Upload CSV buttons
├── participant-actions.tsx  # Row action buttons
└── bulk-actions.tsx         # Bulk selection actions
```

## Component Specifications

### Sidebar Component

```typescript
interface SidebarProps {
  events: IEvent[];
  selectedEvent: IEvent | null;
  onEventSelect: (event: IEvent) => void;
  onEventCreate: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}
```

**Features:**

- LumenDev logo at top
- Search bar with magnifying glass icon
- Event list with diamond icons
- Active event highlighting
- Create event button

### Main Content Component

```typescript
interface MainContentProps {
  selectedEvent: IEvent | null;
  onEventUpdate: (event: IEvent) => void;
}
```

**Features:**

- Page title "Generate Certificate"
- Template adjustment section
- Participant manager section
- Responsive layout

### Certificate Preview Component

```typescript
interface CertificatePreviewProps {
  templateUrl: string;
  nameConfig: ITextConfig;
  idConfig: ITextConfig;
  onPositionChange: (
    type: 'name' | 'id',
    position: Partial<ITextConfig>
  ) => void;
  selectedTextType: 'name' | 'id';
  onTextTypeChange: (type: 'name' | 'id') => void;
}
```

**Features:**

- Large preview area (left side)
- Click-to-position functionality
- Visual text indicators
- Real-time updates

### Font Controls Component

```typescript
interface FontControlsProps {
  selectedTextType: 'name' | 'id';
  onTextTypeChange: (type: 'name' | 'id') => void;
  nameConfig: ITextConfig;
  idConfig: ITextConfig;
  onConfigChange: (config: ITextConfig) => void;
}
```

**Features:**

- Name/ID radio button selector
- Font family dropdown
- Text alignment dropdown
- Color picker
- Font size slider
- Position indicators (X, Y)

### Participant Table Component

```typescript
interface ParticipantTableProps {
  participants: IRecipientData[];
  selectedParticipants: string[];
  onSelectionChange: (selected: string[]) => void;
  onParticipantAction: (action: string, participantId: string) => void;
  onBulkAction: (action: string, participantIds: string[]) => void;
}
```

**Features:**

- Checkbox column for selection
- Name, Email, Certificate ID, Last Email columns
- Row action buttons (download, send, menu)
- Bulk actions for selected participants
- Responsive table design

## Updated Existing Components

### 1. Update page.tsx

- Remove tab-based layout
- Implement sidebar + main content structure
- Update state management for selected event
- Add search functionality

### 2. Update layout-customization-tab.tsx

- Rename to template-adjustment-section.tsx
- Implement new layout with preview + controls
- Add text type selector (Name/ID)
- Update font controls layout

### 3. Update recipients-upload-tab.tsx

- Rename to participant-manager-section.tsx
- Implement table-based participant display
- Add row actions and bulk actions
- Update CSV management buttons

### 4. Update event-list-tab.tsx

- Move to sidebar component
- Update styling to match sidebar design
- Add search functionality
- Implement diamond icons

## State Management Updates

### New State Variables

```typescript
interface AppState {
  events: IEvent[];
  selectedEvent: IEvent | null;
  searchQuery: string;
  selectedTextType: 'name' | 'id';
  selectedParticipants: string[];
  isSidebarCollapsed: boolean;
}
```

### State Management Functions

```typescript
const useAppState = () => {
  const [state, setState] = useState<AppState>({
    events: [],
    selectedEvent: null,
    searchQuery: '',
    selectedTextType: 'name',
    selectedParticipants: [],
    isSidebarCollapsed: false,
  });

  const updateState = (updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return { state, updateState };
};
```

## Styling Guidelines

### Color Scheme

- Primary: Blue (#3B82F6)
- Secondary: Green (#10B981)
- Background: Light gray (#F9FAFB)
- Sidebar: White with subtle border
- Text: Dark gray (#111827)

### Typography

- Headings: Inter font, bold weights
- Body text: Inter font, regular weight
- Code: Monospace font

### Spacing

- Consistent 4px grid system
- Sidebar width: 280px (desktop), collapsible (mobile)
- Main content padding: 24px
- Component spacing: 16px, 24px, 32px

### Responsive Breakpoints

- Mobile: < 768px (collapsible sidebar)
- Tablet: 768px - 1024px
- Desktop: > 1024px (fixed sidebar)

## Integration Points

### Server Actions

- Maintain all existing server actions
- No changes to API endpoints
- Preserve data persistence logic

### Type Definitions

- Extend existing interfaces as needed
- Add new component prop types
- Maintain backward compatibility

### UI Components

- Use existing shadcn/ui components
- Extend with custom styling
- Maintain accessibility standards
