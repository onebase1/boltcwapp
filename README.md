# BoltCW - Healthcare Staffing App

BoltCW is a mobile application designed for temporary staffing agencies in the UK that supply nurses, care assistants, and support workers to care homes.

## Authentication Fix

The authentication issue has been resolved by:

1. Creating a proper authentication flow in sign-in.tsx and sign-up.tsx
2. Adding a comprehensive database setup script
3. Creating test users for easy login during development

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI

### Installing

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Setup the database in Supabase:

- Create a new Supabase project
- Run the database initialization script in `supabase/migrations/20250325000000_auth_fix.sql`
- Copy your Supabase URL and anon key to `.env` file (or use the existing ones)

### Running the app

```bash
npx expo start
```

## Test Credentials

For testing the application, you can use these credentials:

- Admin: admin@boltcw.com / SecureAdminPassword!
- Test Manager: test@boltcw.com / Testing123!

## Project Structure

- `/app` - The main app routes using Expo Router
- `/contexts` - Context providers like AuthProvider
- `/lib` - Utilities like the Supabase client
- `/types` - TypeScript type definitions
- `/supabase` - Supabase configuration and migrations

## Key Features

- Multi-tenant architecture for agencies, care homes, and staff
- Staff profile management with training tracking
- Shift management with geofencing
- Real-time notifications and updates
- Comprehensive dashboard for managers and staff

## Database Schema

The database follows a multi-tenant structure with the following key tables:

- agencies - The staffing agencies
- profiles - User profiles (staff, managers, admins)
- care_homes - The care homes where staff work
- shifts - The work shifts that need staffing
- staff_trainings - Training records with expiry dates
- staff_documents - Verification documents

## Authentication Flow

1. Users sign in with email/password via Supabase Auth
2. Their profile is loaded from the profiles table
3. They are redirected to the appropriate dashboard based on their role
4. JWT tokens are stored securely for future requests

## Development Notes

- Use the admin account to test administrative features
- Use the test manager account to test care home management features
- The auth system is configured to not require email confirmation during development
