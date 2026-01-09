# NovusMesh Web Dashboard - Developer Guide

## Overview
The **NovusMesh Web Dashboard** is the modern, responsive user interface for managing your WireGuard mesh network. It communicates with the NovusMesh Server via REST API to visualize network topography, manage peers (nodes), and configure network settings.

## Architecture

### Tech Stack
- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (with Dark Mode support)
- **Icons:** Lucide React
- **State Management & Data Fetching:** TanStack Query (React Query)
- **Routing:** React Router v6

### Directory Structure
```
web/
├── src/
│   ├── api/           # API client and types (generated or manual)
│   ├── components/    # Reusable UI components (Modals, Forms, Layout)
│   ├── pages/         # Page views (Dashboard, Nodes, Settings)
│   ├── store/         # Global client state (Zustand or Context)
│   ├── App.tsx        # Main application entry & Routing
│   └── main.tsx       # React DOM rendering
├── public/            # Static assets
└── index.html         # HTML entry point
```

## Core Features

### 1. Dashboard (`src/pages/Dashboard.tsx`)
`StatCard` components provide a high-level overview.
- Displays online vs total nodes.
- Shows a list of recent active nodes.

### 2. Node Management (`src/pages/Nodes.tsx`)
- **List:** Displays status, IPs, Transfer rates, and Expiration time.
- **Creation:** `CreateNodeModal` handles peer generation.
  - Inputs: Name, Expiration.
  - Role: Hardcoded to 'client' in the API call (hidden from UI).
- **Editing:** `EditNodeModal` allows modification of:
  - Name
  - Status (Active/Disabled)
  - Expiration Date extension
  - Metadata (OS, Arch, Hostname)

### 3. Settings (`src/pages/Settings.tsx`)
Focused purely on user account management for the dashboard.
- **Change Password:** Updates credentials for the logged-in user.
- **User Management:** Admin panel to Create (`UserPlus`) or Delete (`Trash2`) other dashboard access accounts.
- **Note:** Server-side configurations (like ports/keys) are managed via the Backend API or `.env` files, not exposed here for editing.

## Development Setup

### Prerequisites
- Node.js 18+ installed.

### Running Locally
1. **Install Dependencies:**
   ```bash
   cd web
   npm install
   ```

2. **Configure Data Access:**
   Create a `.env` file to point to your local API server:
   ```bash
   VITE_API_URL=http://localhost:8080
   ```

3. **Start Dev Server:**
   ```bash
   npm run dev
   ```
   Access at `http://localhost:5173`.

### Building for Production
The build command generates static files in `dist/`, which are then served by Nginx or the Go binary directly.
```bash
npm run build
```

## Styling Guidelines
- Use **Tailwind CSS** utility classes for all styling.
- Ensure **Dark Mode** compatibility (`dark:` prefix).
- Maintain responsiveness (`sm:`, `md:`, `lg:` breakpoints).
- Use **NovusMesh Blue** (`bg-blue-600`) for primary actions.

## Contributing
- **Components:** Keep components small and focused.
- **Types:** Use strict TypeScript interfaces for all props and API responses.
- **Branding:** Ensure the "NovusMesh" name and "Developed by Ali Zeynalli" attribution remain visible.
