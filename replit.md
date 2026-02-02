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

The system uses JWT-based authentication with access and refresh tokens. Role-Based Access Control (RBAC) is implemented with the following hierarchy (highest to lowest):
- `admin` (full system access, can manage other admins, system settings)
- `manager` (can manage users and providers, view analytics)
- `provider` (healthcare provider access)
- `user` (standard user access)

Security features include bcryptjs for password hashing, email verification, password reset flows, and audit logging. Admin-only operations (create admin, permanent delete, system settings) require the `admin` role specifically.

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

## Recent Changes (February 2026)

### AI-Powered Mood Suggestions
- **Activity to Mood Flow**: After logging an activity, AI (Gemini) now analyzes the activity and suggests an appropriate mood
- AI generates mood suggestions with rationale based on activity category, title, description, time of day
- Shows "AI Generated" badge instead of "Rule-based" in success dialog
- Suggested mood is highlighted with "AI Pick" badge in the Quick Mood Check
- When user selects a mood, navigates to mood tracking page with prefilled selections

### Emergency Services Tab
- **New Emergency Tab in Provider Directory**: Prominent red/alert colored tab for urgent access
- **Location-based Emergency Numbers**: Uses browser geolocation with IP fallback to detect country
- Comprehensive emergency number mapping for 20+ countries (911, 999, 112, 000, etc.)
- Large click-to-dial buttons with tel: links for immediate calling
- Shows verified emergency service providers with contact info

### Admin Portal Fixes
- **Fixed Authentication Sync**: Admin login now properly uses AuthContext login function
- User and provider management pages now correctly display data
- Provider verification workflow works properly
- All admin dashboard sections functioning correctly
- **Fixed URL Parameter Encoding Bug**: API client now filters out undefined/null/empty values before creating URLSearchParams to prevent "undefined" string from being passed as search regex

### Version-Based Session Invalidation
- **App Version Endpoint**: Added `/api/version` endpoint returning current app version
- **Automatic Session Refresh**: Frontend checks version on app load, clears session if version changed
- **Force Re-login**: Increment `APP_VERSION` in `server/index.js` to force all users to re-authenticate
- Ensures users always have fresh data after deployments

### Dashboard UX Improvements
- **Reduced Repetition**: "How are you feeling right now?" card is hidden when daily prompt is showing
- **Consistent Terminology**: "Log Activity" and "Track Mood" button labels throughout
- Weekly mood chart Y-axis fixed to 0-10 scale for proper mood score display
- Voice input hints added to activity and mood logging forms ("Voice available" label)
- Mood API endpoint fixed (singular to plural routing issue)

## Previous Changes (January 2026)

### UI/UX Enhancements
- **Heart Icon Animation**: Landing page heart icon beside "Your personal wellness companion" now pulses smoothly from filled to outline (2.5s animation cycle)
- **Dashboard Mobile View**: User profile avatar hidden on mobile for cleaner greeting text display
- **Country Code Phone Input**: New PhoneInput component with country code selector using REST Countries API
  - Searchable dropdown with 250+ countries and dial codes
  - Flags displayed using Unicode emoji
  - Applied to: User settings, Provider settings, Provider registration
  - Falls back to common countries (UK, US, Canada, Australia, etc.) until full API loads
- **Mobile Responsiveness Improvements**:
  - Larger hero section fonts (text-3xl for headline, text-lg for description on mobile)
  - Improved landing page spacing with better vertical rhythm (space-y-5 to space-y-10)
  - Larger key point chips with better touch targets
  - Dashboard quick actions using hover-elevate utility instead of custom hover states
  - Removed all custom hover effects (scale, shadow, border changes) to comply with design system
  - Better card padding and section spacing throughout dashboard
- **Dashboard Mobile Layout (iPhone 15 optimized)**:
  - Greeting and date section now appears FIRST before alerts and daily prompt
  - X button on daily prompt now has visible white background with border for clarity
  - Firstname displays fully without truncation (reduced font sizes on mobile)
  - Tighter spacing on mobile (space-y-4) for less cluttered feel
- **Mobile Navigation Improvements**:
  - Navigation menu is now scrollable on small screens
  - Logout button fixed at bottom with prominent styling (always visible)
  - Narrower sheet width on mobile (280px) for better fit
- **Notification System**:
  - Read/unread status now persists across page refreshes using localStorage
- **AI Assistant Voice Input**:
  - Voice input microphone button added to both user and provider AI assistant chat interfaces
  - Uses Web Speech API for speech-to-text transcription
  - Shows pulsing red animation when actively listening
  - Appends transcribed text to current message input
- **Footer Mobile Alignment**:
  - Footer now properly centered on mobile with stacked layout
  - Copyright and disclaimer text centered with proper gaps
  - Links use flex-wrap for better text wrapping on small screens
- **AI Assistant Mobile Chat**:
  - Chat area uses dynamic viewport height (100dvh) for better mobile keyboard handling
  - Input stays visible above keyboard when typing on iOS/mobile
- **AI Assistant Analytics Display** (February 2026):
  - Wellbeing analytics grid now shows actual numeric scores (averageMoodScore, totalActivityMinutes, averageEnergyLevel, averageStressLevel) instead of just trend text
  - Each metric displays score with units (/10 or mins) alongside trend indicators (improving/stable/declining)
  - Added ReportDownloadButton to analytics section for PDF report download
  - Energy label updated (was previously labeled "Sleep")