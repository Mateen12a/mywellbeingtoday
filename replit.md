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

### UI/UX Improvements (January 2026)
- File deletion feature for uploaded documents on registration forms
- Provider settings now uses provider sidebar layout consistently
- Fixed provider quick actions button alignment
- Password error messages now display on profile edit unlock failure
- Removed sparkle icon from AI insights on provider dashboard
- Improved 404 page with user-friendly design and navigation options
- Provider registration success popup explaining 24-48 hour verification process

### Provider Features (January 2026)
- AI Assistant chat in messaging section for auto-responses and health-related tasks
- Support ticket system for providers (create tickets, track status, view responses)
- Saved auto-response templates management

### Admin Features (January 2026)
- Secret system settings page at `/admin/system-settings` (super_admin only)
- Maintenance mode toggle with custom message and scheduling
- Admin bypass codes management
- Content management at `/admin/content` for articles, research, guides, announcements
- AI fraud detection indicators on user and provider management pages
- Risk badges for inactive accounts, incomplete profiles, missing documents
- Enhanced notifications system across all dashboards

### Authentication & Routing (January 2026)
- Logout properly redirects to landing page
- Logged-in users redirected from auth pages to their dashboard
- Admin routing prevents access to login/register pages when authenticated
- Fixed admin user/provider management pages to display data correctly

### Provider Registration Enhancements (January 2026)
- Replaced fullName with firstName and lastName fields
- Added experience selection dropdown (0-2, 3-5, 5-10, 10-15, 15-20, 20+ years)
- Expanded professional title options: Dr., Mr., Mrs., Ms., Miss., Prof., Nurse, Other (with custom input)
- Experience mapped to yearsOfExperience field in Provider model

### Certificate Issuing (January 2026)
- Patient selection limited to connected patients only (from appointments or messages)
- Search API gated to only run when certificate dialog is open
- Added custom certificate type field when "Other" is selected

### Branding Updates (January 2026)
- Corrected branding from "Aifns" to "Airfns Softwares" across all dashboards
- Fixed provider settings page header background color (bg-background)

### Provider AI Assistant (January 2026)
- Standalone AI Assistant page at `/provider-ai-assistant` for providers
- Full conversation history persistence with ProviderChatConversation and ProviderChatMessage models
- Conversation management: create new chats, rename, delete
- Platform-aware AI insights covering appointments, messaging, certificates, and wellbeing reports
- Formatted output support (bullets, numbered lists, bold text) with markdown rendering
- Voice input (speech-to-text) with browser support detection
- Mobile-responsive design with sidebar sheet for conversations
- Navigation link added to provider dashboard menu
- Copy response button on AI messages with clipboard fallback for all browsers
- Enhanced text visibility with larger font sizes and improved spacing
- Card-style AI message bubbles with borders and shadows
- Removed "AI-Powered" badges for cleaner appearance
- SidebarTrigger toggle visible on all screen sizes
- "Built by Airfns Softwares" footer below sidebar

### Provider Insights Improvements (January 2026)
- Insights now focus on platform features (Appointments, Messages, Patient Reports, Certificates)
- Action items reference specific platform sections for better guidance
- Unverified providers with no activity see helpful "under review" message
- Suggestions for unverified providers to complete profile and explore platform features

### Responsive Header Updates (January 2026)
- Provider dashboard header optimized for mobile and tablet devices
- Greeting text adapts: "Hi, [Name]" on mobile, full greeting on larger screens
- Verification badges and date display hidden on smaller screens to save space
- Notification button and padding adjusted for touch-friendly mobile use
- Provider settings page with responsive tab navigation
- AI assistant header with adaptive sizing for all screen sizes
- Logout redirects providers to landing page (`/`)

### Landing Page Enhancements (January 2026)
- New "Why Monitor Your Wellbeing?" section explaining platform benefits in simple language
- Interactive Q&A cards addressing common concerns ("I feel fine, why worry?")
- Faceless avatar icons with puzzle (thinking) and question mark symbols
- Three-step "How It Works" cards: Easy Setup, AI Insights, Connect with Care
- Prevention message with emphasis on early warning signs

### Separate Deployment Support (January 2026)
- Frontend and backend now have separate `package.json` files for independent deployment
- Frontend (`client/`) deploys as static site (Vercel, Render Static)
- Backend (`server/`) deploys as Node.js web service (Render, Railway)
- Backend runs pure JavaScript - no build step required (`node index.js`)
- VITE_API_URL environment variable for frontend-backend connection
- CORS configuration with ALLOWED_ORIGINS for cross-origin requests
- Health check endpoint at `/api/health` for backend monitoring
- Frontend health ping every 5 minutes to keep backend alive
- Vite proxy forwards `/api` requests to backend on port 3000 in development
- DEPLOYMENT.md with full instructions for Vercel/Render deployment
- User header navigation uses xl breakpoint (1280px+) for desktop menu

## Project Structure

```
/
├── client/                 # Frontend (React/Vite)
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.ts     # Vite config with API proxy
│   ├── tsconfig.json      # TypeScript config
│   └── src/               # React source files
│
├── server/                 # Backend (Express/Node.js)
│   ├── package.json       # Backend dependencies
│   ├── index.js           # Server entry point
│   ├── config/            # Database config
│   ├── controllers/       # Route handlers
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   └── services/          # Business logic
│
├── shared/                 # Shared code between frontend/backend
├── DEPLOYMENT.md          # Deployment instructions
└── replit.md              # This file
```

## Development Workflows

- **Backend Server**: Runs on port 3000 (`cd server && node index.js`)
- **Frontend Dev**: Runs on port 5000 with Vite, proxies /api to backend