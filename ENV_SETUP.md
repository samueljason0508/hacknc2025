# Environment Variables Setup

This project uses environment variables to securely store API keys and configuration.

## Setup Instructions

1. Copy the `.env.example` file to create your `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual API keys in the `.env` file

## Required Environment Variables

### Firebase (Frontend)
- `VITE_FIREBASE_API_KEY` - Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Your Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Your Firebase measurement ID

### Supabase (Frontend)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

### Google Gemini AI (Backend)
- `GEMINI_API_KEY` - Your Google Gemini API key

## Important Notes

- **Frontend variables** (used in Vite/React) must be prefixed with `VITE_`
- **Backend variables** (used in Node.js/Express) don't need the prefix
- The `.env` file is already in `.gitignore` and will NOT be committed to git
- Never share your `.env` file or commit it to version control
- Use `.env.example` as a template for other developers

## Running the Application

After setting up your `.env` file, you can run:
```bash
npm run dev:full  # Runs both frontend and backend
```

The backend server will automatically load environment variables from `.env` using dotenv.
The frontend will load `VITE_*` prefixed variables automatically through Vite.
