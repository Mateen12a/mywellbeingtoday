# MyWellbeingToday

## Overview

MyWellbeingToday is a web application designed to help users track daily activities, symptoms, and mood, and connect with healthcare professionals. It leverages AI for personalized recommendations and manages medical certificates. The platform supports individual users, healthcare providers, and administrators, aiming to be a comprehensive digital wellbeing companion by enhancing wellbeing management and access to health services. The project's vision includes business growth through subscription models and expanding market reach by offering robust health management tools.

## User Preferences

Preferred communication style: Simple, everyday language.
Backend: JavaScript (not TypeScript) with MongoDB

## System Architecture

### Frontend

The frontend is built with React and TypeScript, utilizing Vite for development and optimized production builds. Styling is managed with Tailwind CSS, custom themes, and shadcn/ui components (New York style) based on Radix UI. Wouter handles client-side routing, and state management uses TanStack Query for server state. The architecture emphasizes reusable components, a service layer for API interactions, and path aliases.

### Backend

The backend is developed with Node.js and Express, written in JavaScript (ES modules). It implements a REST API with a `/api` prefix, covering authentication, data logging, reports, provider directory, appointments, and admin management. It integrates with MongoDB via Mongoose and includes dedicated models, controllers, and middleware for authentication, validation, and error handling.

### Database

MongoDB is used as the database, accessed via Mongoose ODM, and connects to a MongoDB Atlas cluster. Key collections include `users` (with roles like user, provider, admin), `activitylogs`, `moodlogs`, `wellbeingreports`, `providers`, `appointments`, and `auditlogs`.

### Authentication & Authorization

The system uses JWT-based authentication with access and refresh tokens. Role-Based Access Control (RBAC) is implemented for `user`, `provider`, `admin`, and `super_admin` roles. Security features include bcryptjs for password hashing, email verification, password reset flows, and audit logging.

### UI/UX Decisions

The application features a calm design with a focus on user-friendly interfaces. It includes a responsive header, personalized suggestions based on user activity, improved PDF report styling, and enhanced chat interfaces with larger, readable text and auto-generated titles. Mobile responsiveness has been comprehensively audited across all pages, ensuring elements fit properly on various devices, including iPhone 15, and all interactive elements meet minimum touch target standards.

### Technical Implementations

The project includes a subscription system with trial, monthly, and yearly plans, ready for Stripe integration. A robust support ticket system is available for users and administrators. Provider features include an AI Assistant for auto-responses and health-related tasks, with conversation history persistence. Admin functionalities include system settings, maintenance mode, content management, and AI fraud detection with risk badges. Provider registration has been enhanced with detailed fields and document upload capabilities, and a voice input feature for notes uses the Web Speech API. Certificate issuing is limited to connected patients.

### System Design Choices

The project structure separates frontend (`client/`) and backend (`server/`) for independent deployment. The backend runs pure JavaScript, requiring no build step. Environment variables manage frontend-backend connections, and CORS is configured for cross-origin requests. Health check endpoints and frontend health pings maintain backend availability.

## External Dependencies

### Third-Party Services

-   **AI Integration:** Google Gemini AI (gemini-1.5-flash) for wellbeing analysis and personalized recommendations.
-   **Email Service:** Resend for sending verification, password reset, and appointment confirmation emails.
-   **Maps:** Leaflet, utilizing OpenStreetMap tiles, for interactive maps in the health professional directory.
-   **Charts:** Recharts for visualizing wellbeing trends and data.

### Key NPM Packages

-   **Frontend:** `@tanstack/react-query`, `framer-motion`, `date-fns`, `react-day-picker`, `embla-carousel-react`, `zod`.
-   **Backend:** `mongoose`, `jsonwebtoken`, `bcryptjs`, `@google/generative-ai`, `resend`, `express-validator`.