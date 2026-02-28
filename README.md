# MyWellbeingToday

## Overview

MyWellbeingToday is a web application designed to help users track daily activities, symptoms, and mood, and connect with healthcare professionals. It leverages AI for personalized recommendations and manages medical certificates. The platform supports individual users, healthcare providers, and administrators, aiming to be a comprehensive digital wellbeing companion by enhancing wellbeing management and access to health services. The project's vision includes business growth through subscription models and expanding market reach by offering robust health management tools.

## User Preferences

Preferred communication style: Simple, everyday language.
Backend: JavaScript (not TypeScript) with MongoDB

## System Architecture

### Frontend

The frontend is built with React and TypeScript, utilizing Vite for development. Styling is managed with Tailwind CSS, custom themes, and shadcn/ui components (New York style) based on Radix UI. Wouter handles client-side routing, and state management uses TanStack Query for server state. The architecture emphasizes reusable components, a service layer for API interactions, and path aliases.

### Backend

The backend is developed with Node.js and Express, written in JavaScript (ES modules). It implements a REST API with a `/api` prefix, covering authentication, data logging, reports, provider directory, appointments, and admin management. It integrates with MongoDB via Mongoose and includes dedicated models, controllers, and middleware for authentication, validation, and error handling.

### Database

MongoDB is used as the database, accessed via Mongoose ODM, and connects to a MongoDB Atlas cluster. Key collections include `users` (with roles like user, provider, admin), `activitylogs`, `moodlogs`, `wellbeingreports`, `providers`, `appointments`, and `auditlogs`.

### Authentication & Authorization

The system uses JWT-based authentication with access and refresh tokens. Role-Based Access Control (RBAC) is implemented with roles including `admin`, `manager`, `provider`, and `user`. Security features include bcryptjs for password hashing, email verification, password reset flows, and audit logging.

### UI/UX Decisions

The application features a calm design with a focus on user-friendly interfaces. It includes a responsive header, personalized suggestions based on user activity, improved PDF report styling, and enhanced chat interfaces. Mobile responsiveness has been comprehensively audited across all pages. The UI includes a new PhoneInput component with country code selector, and a dashboard optimized for mobile viewing.

### Technical Implementations

The project includes a 6-tier subscription system with trial, monthly, and yearly plans, ready for Stripe integration. A robust support ticket system is available. Provider features include an AI Assistant with conversation history persistence. Admin functionalities include system settings, maintenance mode, content management, and AI fraud detection. Provider registration has been enhanced with detailed fields, document upload capabilities, and a voice input feature for notes. Certification type selection is available during provider registration. File uploads leverage Cloudinary for storage. A version-based session invalidation mechanism is in place to force re-login after deployments. Strong password policies with real-time strength indicators are implemented. An appointments page allows users to view and manage their appointments.

### Subscription Awareness

Comprehensive subscription awareness is built into the app:
- `useSubscription` hook (`client/src/hooks/useSubscription.ts`) fetches and exposes plan, usage, limits, and helper functions. Exports `CLIENT_PLAN_LIMITS` as a definitive client-side fallback matching server `PLAN_LIMITS`.
- Subscription dialog (`client/src/components/subscription-dialog.tsx`) opened via `useSubscriptionDialog()` hook from `SubscriptionDialogContext`. Shows plan cards, usage section, and handles trial/upgrade flows.
- Dashboard banners for trial/free/paid status at `client/src/pages/dashboard.tsx`.
- Usage gates on activity, mood, and AI pages with `UpgradePrompt` component (`client/src/components/upgrade-prompt.tsx`).
- Settings subscription tab at `client/src/pages/settings.tsx`.
- Plan limits (per PDF): Free: 2/2/1/2/2, Starter: 10/10/3/10/10, Pro/Premium/Team/Franchise: unlimited (-1).

### System Design Choices

The project structure separates frontend (`client/`) and backend (`server/`) for independent deployment. The backend runs pure JavaScript, requiring no build step. Environment variables manage frontend-backend connections, and CORS is configured for cross-origin requests. Health check endpoints maintain backend availability.

## External Dependencies

### Third-Party Services

-   **AI Integration:** Google Gemini AI (gemini-1.5-flash) for wellbeing analysis and personalized recommendations.
-   **Email Service:** Resend for sending verification, password reset, and appointment confirmation emails.
-   **Maps:** Leaflet, utilizing OpenStreetMap tiles, for interactive maps in the health professional directory.
-   **Charts:** Recharts for visualizing wellbeing trends and data.
-   **Cloud Storage:** Cloudinary for file uploads (profile pictures, documents, attachments).

### Key NPM Packages

-   **Frontend:** `@tanstack/react-query`, `framer-motion`, `date-fns`, `react-day-picker`, `embla-carousel-react`, `zod`.
-   **Backend:** `mongoose`, `jsonwebtoken`, `bcryptjs`, `@google/generative-ai`, `resend`, `express-validator`.