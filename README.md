# MyWellbeingToday

## Overview

MyWellbeingToday is a wellbeing web application designed to help users track daily activities, symptoms, and mood, while also connecting them with healthcare professionals. The platform leverages AI to analyze wellbeing data, provide personalized recommendations, and manage medical certificates. It supports individual users, healthcare providers, and administrators, aiming to enhance overall wellbeing management and access to health services. The project's vision is to be a comprehensive digital wellbeing companion.

## User Preferences

Preferred communication style: Simple, everyday language.
Backend: JavaScript (not TypeScript) with MongoDB

## System Architecture

### Frontend

The frontend is built with React and TypeScript, using Vite for development and optimized production builds. Styling is managed with Tailwind CSS, custom theme variables, and shadcn/ui components (New York style) based on Radix UI. Wouter handles client-side routing across public, user dashboard, and provider/admin dashboard contexts. State management utilizes TanStack Query for server state and local React state for UI. The architecture emphasizes reusable components, a service layer for API interactions, and path aliases for clean imports.

### Backend

The backend is developed with Node.js and Express, written in JavaScript (ES modules). It follows a REST API design with a `/api` prefix for all routes, covering authentication, activity/mood logging, wellbeing reports, provider directory, appointments, and admin management. Key components include MongoDB integration via Mongoose, dedicated models for various data entities (User, ActivityLog, MoodLog, etc.), controllers for route handling, and middleware for authentication, validation, and error management.

### Database

MongoDB is used as the database, accessed via Mongoose ODM. It's configured to connect to a MongoDB Atlas cluster. Core collections include `users` (with roles like user, provider, admin, super_admin), `activitylogs`, `moodlogs`, `wellbeingreports`, `providers`, `appointments`, and `auditlogs`.

### Authentication & Authorization

The system employs JWT-based authentication with both access and refresh tokens. Role-Based Access Control (RBAC) is implemented, supporting `user`, `provider`, `admin`, and `super_admin` roles. Security features include bcryptjs for password hashing, email verification, password reset flows, and audit logging for sensitive actions, ensuring a secure environment.

## External Dependencies

### Third-Party Services

- **AI Integration:** Google Gemini AI (gemini-1.5-flash) for wellbeing analysis and personalized recommendations.
- **Email Service:** Resend for sending verification, password reset, and appointment confirmation emails.
- **Maps:** Leaflet, utilizing OpenStreetMap tiles, for interactive maps in the health professional directory.
- **Charts:** Recharts for visualizing wellbeing trends and data.

### Key NPM Packages

- **Frontend:** `@tanstack/react-query`, `framer-motion`, `date-fns`, `react-day-picker`, `embla-carousel-react`, `zod`.
- **Backend:** `mongoose`, `jsonwebtoken`, `bcryptjs`, `@google/generative-ai`, `resend`, `express-validator`.

## Recent Changes (January 2026)

### Legal & Compliance
- Privacy Policy page at `/privacy` with clear, professional content
- Terms of Service page at `/terms` with medical disclaimer
- Registration form includes clickable Terms and Privacy links
- Legal section added to Settings page
- Footer includes Privacy and Terms links

### PDF Report Improvements
- Calmer design with softer header (white background, subtle accent line)
- Updated tagline: "Supporting your wellness journey"
- Improved table styling and visual hierarchy

### Dashboard & History
- Personalized suggestions based on user activity (mood logging, activities, appointments)
- AI suggestions section on Wellbeing History page with insights on trends

### AI Chat Improvements
- Larger, more readable text on all devices (text-base/text-lg)
- Improved message spacing and action button visibility
- Auto-generated meaningful chat titles

### Directory & Booking
- Click provider address to zoom map and show popup
- Default consultation type set to In-Person
- Booking button disabled after booking until accepted/declined

### Provider Settings
- Consultation type management (In-Person, Video Call, Phone Call toggles)

### Contact Support
- Support ticket system for users in Settings
- Admin support dashboard at `/admin/support` with ticket management
- Ticket status tracking (open, in_progress, resolved)
- Admin response functionality

### Subscription System
- Subscription model with trial, monthly ($19.99), yearly ($191.88) plans
- Subscription page at `/subscription` with pricing display
- 15-day free trial support
- Ready for Stripe integration when API key is configured

### Admin Features
- Admin login portal at `/auth/admin-login`
- Super admin can create new admins at `/admin/manage-admins`
- Admin management with role selection (admin/super_admin)

### Messages & Directory
- Messages page shows provider names and profile pictures instead of emails
- Emergency services added to directory specialty filter
- "Other" specialty filter shows all unlisted specialties
- PDF reports now show "Built by Airfns" branding

### Legal Updates (Based on Policy Document)
- Privacy Policy updated with HIPAA notice, data security details (TLS 1.3, AES-256)
- Terms of Service updated with subscription pricing, crisis resources
- Contact emails: privacy@wellbeinghelp.com, legal@wellbeinghelp.com

### Provider Registration (January 2026)
- Fixed certificate/license file upload with drag-and-drop support
- Added confirm password field with validation
- Added "Other" specialty option with custom input field for unlisted specialties
- Form fields properly mapped to Provider model schema
- Certificate files converted to base64 and stored in verification.documents

### AI Assistant Voice Input (January 2026)
- Added voice input (speech-to-text) for mood and activity logging notes
- Uses Web Speech API with browser support detection
- Visual feedback when recording (pulsing mic icon)
- Transcribed text appends to existing notes