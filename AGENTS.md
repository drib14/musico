# Musico - Platform Documentation

Musico is a static web application built to stream music. It utilizes the Spotify API for fetching public catalogs to stream 30-second previews and a dedicated backend for custom user uploads, playlists, and user management.

## Tech Stack

### Frontend
- **Framework**: React.js
- **Styling**: Vanilla CSS (`index.css`), leveraging extensive custom variables for themes, responsive design (desktop + mobile drawer patterns), and glassmorphism UI elements.
- **Icons**: `lucide-react`
- **Build Tool**: Vite

### Backend
- **Framework**: Node.js + Express
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary (for storing audio tracks and cover images)
- **Deployment**: Vercel

## Key Features

1. **Music Discovery & Playback**
   - Stream 30-second song previews fetched directly from the Spotify API via Client Credentials Flow.
   - Note: Users do not need a Spotify account to log in.

2. **User Library & Playlists**
   - Save tracks to "Liked Songs".
   - Create and manage custom playlists.
   - Custom Modal and Drawer UI for transaction flows (creating, editing, and deleting content).

3. **Artist Uploads (Self-Distribution)**
   - Registered users can upload their own tracks (.mp3, .wav) and custom cover arts.
   - Uploads are saved via the backend into Cloudinary.
   - **CRUD for Uploads**: Users can create, read, update, and delete their own tracks from the "My Uploads" tab in the Library.

4. **Premium Tier Features**
   - Free tier users are limited to 3 direct track uploads.
   - An upgrade flow is integrated to prompt users to unlock unlimited uploads and premium profile badges.

5. **Analytics**
   - Basic geo-location and playback statistics are gathered for artist uploads to showcase trending and local data.

## Deployment Setup

The application is configured as a monorepo for Vercel deployment:
- The backend API runs as Serverless Functions (`/api/*`) mapped to `server/server.js`.
- The frontend static build is served from `client/dist/` (`/*`).
- `vercel.json` is located in the root directory to handle the static-build and node environment configurations seamlessly.