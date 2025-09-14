## Project Requirements Document (PRD)

This PRD outlines the requirements for a web application that serves as a certificate distribution tool. The application will allow users to upload a certificate template, define anchor positions for personalized data, upload recipient information, and generate certificates in bulk for download.

---

### 1\. Introduction

#### 1.1 Project Goals

- **Enable efficient certificate creation**: Simplify the process of generating multiple certificates from a single template.
- **Provide customization**: Allow users to customize the font style, size, and position of personalized text.
- **Offer real-time preview**: Give users immediate visual feedback on their customizations.
- **Support bulk generation**: Facilitate the creation and download of a large number of certificates.

---

### 2\. Functional Requirements

#### 2.1 User Interface & Workflow

1.  **Event Creation**: The user can create a new event with a title, description, and date. Each event serves as a container for certificate configurations and participant data.
2.  **Template Upload**: The user can upload a certificate template in **PNG** format, which gets stored in base64 format in the database.
3.  **Anchor Position Selection**: After uploading the template, the user can select and define **two anchor positions** on the image for the **recipient's name** and the **certificate ID**. This should be done via a click-and-drag interface or a similar intuitive method.
4.  **Font & Style Customization**: For each anchor point, the user can customize:
    - **Font Family**: A dropdown menu of common web-safe fonts (e.g., Arial, Times New Roman, Calibri, etc.).
    - **Font Size**: An input field or slider to adjust the font size.
    - **Font Color**: A color picker to choose the text color.
5.  **Real-Time Preview**: The web app must render a real-time preview of the certificate with the customized font styles and an example name and certificate ID.
6.  **CSV Data Upload**: The user can upload a CSV file containing the recipient's information.
7.  **Auto-Save Configuration**: All configuration changes (template, layout, participants) are automatically saved to the database using Next.js Server Actions.
8.  **Event Management**: Users can view, edit, and delete previously created events.
9.  **Certificate Generation & Download**: After all configurations are set, the user can generate and download a ZIP file containing all the personalized certificates as separate PNG files.
10. **Historical Access**: Users can revisit any previously created event to regenerate certificates or modify configurations.

---

### 3\. Data Requirements

#### 3.1 Event Data Structure

Each event will contain the following information:

- **Event Details**: Title, description, date, status
- **Template Configuration**: Base64 encoded PNG template image
- **Layout Configuration**: Text positioning and styling for name and certificate ID
- **Participant Data**: Array of recipient information

#### 3.2 CSV Template

The CSV file for recipient data must follow a specific template. It must have exactly two columns with the following headers:

- `name`: The full name of the certificate recipient.
- `certification_id`: The unique identifier for the certificate.

**Example CSV File (`certificates.csv`):**

```csv
name,certification_id
John Doe,CERT-2025-001
Jane Smith,CERT-2025-002
Peter Jones,CERT-2025-003
```

---

### 4\. Technical Requirements

#### 4.1 Technology Stack

- **Frontend & Backend**: **Next.js** (App Router) for a full-stack, server-rendered application.
- **Server Actions**: **Next.js Server Actions** for all database operations and data persistence.
- **Database**: **MongoDB** for storing event configurations, templates, and participant data.
- **Styling**: **Tailwind CSS** for utility-first styling.
- **UI Components**: **Shadcn UI** for pre-built, accessible, and customizable components.
- **Type Safety**: **TypeScript** will be used throughout the entire stack to ensure type safety.

#### 4.2 Type Interfaces

All data models, objects, functions, and components must be strongly typed with TypeScript interfaces.

**Database Models (`lib/types.ts`):**

```typescript
import { ObjectId } from 'mongodb';

export interface IEvent {
  _id?: ObjectId;
  title: string;
  description?: string;
  eventDate: Date;
  status: 'draft' | 'completed' | 'archived';
  template: {
    base64: string; // Base64 encoded PNG template
    originalName: string;
    uploadedAt: Date;
  };
  nameConfig: ITextConfig;
  idConfig: ITextConfig;
  participants: IRecipientData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITextConfig {
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  color: string;
}

export interface IRecipientData {
  name: string;
  certification_id: string;
  email: string;
}
```

**Server Actions:**

```typescript
// Event Management
export async function createEvent(
  data: Omit<IEvent, '_id' | 'createdAt' | 'updatedAt'>
): Promise<IEvent>;
export async function updateEvent(
  eventId: string,
  data: Partial<IEvent>
): Promise<IEvent>;
export async function deleteEvent(eventId: string): Promise<boolean>;
export async function getEvent(eventId: string): Promise<IEvent | null>;
export async function getAllEvents(): Promise<IEvent[]>;

// Template Management
export async function saveTemplate(
  eventId: string,
  template: File
): Promise<boolean>;
export async function updateLayoutConfig(
  eventId: string,
  nameConfig: ITextConfig,
  idConfig: ITextConfig
): Promise<boolean>;

// Participant Management
export async function saveParticipants(
  eventId: string,
  participants: IRecipientData[]
): Promise<boolean>;

// Certificate Generation
export async function generateCertificates(
  eventId: string
): Promise<ArrayBuffer>; // Returns ZIP file
```

**Component Props:**

```typescript
interface EventEditorProps {
  event: IEvent;
  onConfigChange: (newConfig: Partial<IEvent>) => void;
  onSave: () => Promise<void>;
}

interface EventListProps {
  events: IEvent[];
  onEventSelect: (eventId: string) => void;
  onEventDelete: (eventId: string) => Promise<void>;
}
```

#### 4.3 Image Processing

- **Server Actions** will handle the image generation using **`node-canvas`**.
- Templates are stored as base64 strings in MongoDB for efficient retrieval.
- The system loads the base64 template, converts it to a buffer, and draws recipient names and IDs at specified coordinates with correct font, size, and color.
- Generated certificates are compressed into a ZIP file for download.

#### 4.4 Data Persistence Strategy

- **Auto-Save**: All configuration changes trigger immediate Server Action calls to save data.
- **Template Storage**: PNG files are converted to base64 and stored directly in MongoDB.
- **Event State Management**: Each event maintains its complete state including template, layout config, and participants.
- **Optimistic Updates**: UI updates immediately while Server Actions handle persistence in the background.

#### 4.5 Data Validation

- **CSV Upload**: Validate that the uploaded CSV file contains the `name` and `certification_id` columns and that the data is correctly formatted.
- **User Input**: Sanitize and validate all user inputs for font size, color, and coordinates to prevent malicious data.
- **Event Data**: Validate event title, description, and date fields before saving.
- **Template Validation**: Ensure uploaded templates are valid PNG files and within size limits.

---

### 5\. Updated User Workflow

#### 5.1 Event-Based Certificate Generation

1. **Create Event**: User creates a new event with title, description, and date.
2. **Upload Template**: User uploads PNG template which gets converted to base64 and saved to database.
3. **Configure Layout**: User positions text elements and customizes fonts - changes auto-save via Server Actions.
4. **Upload Participants**: User uploads CSV with participant data - automatically saved to event.
5. **Generate Certificates**: User generates and downloads ZIP file with all certificates.
6. **Event Management**: User can return to any previous event to regenerate certificates or modify settings.

#### 5.2 Data Flow

```
Event Creation → Template Upload (base64) → Layout Config → Participants Upload
     ↓                    ↓                      ↓                ↓
MongoDB Save ← Server Action ← Server Action ← Server Action ← Server Action
     ↓
Certificate Generation (on-demand)
```

---

### 6\. Appendix

#### 6.1 Success Metrics

- **User Adoption**: The number of users who successfully generate and download certificates.
- **Efficiency**: Average time taken for a user to configure and download 100 certificates.
- **User Satisfaction**: Positive feedback and ratings from users.
