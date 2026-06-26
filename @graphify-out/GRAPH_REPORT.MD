# Graph Report - MedflowX Initialization

This report tracks the components and code symbols added during the project initialization.

## System Graph Overview

```mermaid
graph TD
  subgraph Frontend [Next.js App Router]
    F_Home["/ (Home Page)"]
    F_Auth["/auth (Authentication)"]
    F_Reception["/reception (Reception Panel)"]
    F_Doctor["/doctor (Doctor Dashboard)"]
    F_Pharmacy["/pharmacy (Pharmacy Panel)"]
    F_Admin["/admin (Admin Dashboard)"]
  end

  subgraph Backend [Node.js + Express + TS]
    B_Server["index.ts (Server Entry)"]
    B_Health["/api/health (Health check)"]
    B_Socket["Socket.io Connection Handler"]
  end

  F_Reception -->|API / WebSockets| B_Server
  F_Doctor -->|API / WebSockets| B_Server
  F_Pharmacy -->|API / WebSockets| B_Server
  F_Admin -->|API / WebSockets| B_Server
```

## Initialized Folders & Files

### Frontend
- `/frontend`
  - `/src/app/layout.tsx` - Root layout
  - `/src/app/page.tsx` - App home page
  - `/src/app/globals.css` - Global CSS with Tailwind CSS v4 directives
  - `/src/app/auth/page.tsx` - Auth module placeholder
  - `/src/app/reception/page.tsx` - Reception module placeholder
  - `/src/app/doctor/page.tsx` - Doctor module placeholder
  - `/src/app/pharmacy/page.tsx` - Pharmacy module placeholder
  - `/src/app/admin/page.tsx` - Admin module placeholder

### Backend
- `/backend`
  - `/src/index.ts` - Setup Express, Socket.io, middleware, and `/api/health`
  - `/package.json` - Backend dependency configuration
  - `/tsconfig.json` - Backend TypeScript compiler options
  - `/.env` - Backend environment settings
