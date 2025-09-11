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

1.  **Template Upload**: The user can upload a certificate template in **PNG** format.
2.  **Anchor Position Selection**: After uploading the template, the user can select and define **two anchor positions** on the image for the **recipient's name** and the **certificate ID**. This should be done via a click-and-drag interface or a similar intuitive method.
3.  **Font & Style Customization**: For each anchor point, the user can customize:
    - **Font Family**: A dropdown menu of common web-safe fonts (e.g., Arial, Times New Roman, Calibri, etc.).
    - **Font Size**: An input field or slider to adjust the font size.
    - **Font Color**: A color picker to choose the text color.
4.  **Real-Time Preview**: The web app must render a real-time preview of the certificate with the customized font styles and an example name and certificate ID.
5.  **CSV Data Upload**: The user can upload a CSV file containing the recipient's information.
6.  **Bulk Download**: After all configurations are set, the user can click a button to generate and download a ZIP file containing all the personalized certificates as separate PNG or PDF files.

---

### 3\. Data Requirements

#### 3.1 CSV Template

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
- **Database**: **MongoDB** for storing project configurations and user data.
- **Styling**: **Tailwind CSS** for utility-first styling.
- **UI Components**: **Shadcn UI** for pre-built, accessible, and customizable components.
- **Type Safety**: **TypeScript** will be used throughout the entire stack to ensure type safety.

#### 4.2 Type Interfaces

All data models, objects, functions, and components must be strongly typed with TypeScript interfaces.

**Database Models (`models/project.ts`):**

```typescript
import { ObjectId } from 'mongodb';

export interface IProject {
  _id?: ObjectId;
  userId: ObjectId;
  templateUrl: string; // URL of the uploaded PNG template
  namePosition: ITextConfig;
  idPosition: ITextConfig;
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
```

**Function Interfaces:**

```typescript
export type TGenerateCertificates = (
  templateUrl: string,
  recipients: IRecipientData[],
  config: IProjectConfig
) => Promise<ArrayBuffer>; // Returns a ZIP file as ArrayBuffer

export type TUploadFile = (file: File) => Promise<string>; // Returns URL of the uploaded file
```

**Component Props:**

```typescript
interface CertificateEditorProps {
  project: IProject;
  onConfigChange: (newConfig: Partial<IProject>) => void;
  onSave: () => Promise<void>;
}
```

#### 4.3 Image Processing

- A serverless function or a dedicated API route will handle the image generation.
- It will use a library like **`node-canvas`** to load the base PNG template and then draw the recipient's name and ID at the specified coordinates with the correct font, size, and color.
- The final generated certificates will be compressed into a ZIP file for a single-click download.

#### 4.4 Data Validation

- **CSV Upload**: Validate that the uploaded CSV file contains the `name` and `certification_id` columns and that the data is correctly formatted.
- **User Input**: Sanitize and validate all user inputs for font size, color, and coordinates to prevent malicious data.

---

### 5\. Appendix

#### 5.1 Success Metrics

- **User Adoption**: The number of users who successfully generate and download certificates.
- **Efficiency**: Average time taken for a user to configure and download 100 certificates.
- **User Satisfaction**: Positive feedback and ratings from users.
