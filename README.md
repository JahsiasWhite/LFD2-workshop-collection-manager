# Left 4 Dead 2 Mod Manager

A comprehensive tool for organizing and managing Left 4 Dead 2 mod collections with an intuitive web interface.

## Building

### Project Structure

The script.py is set to run every day. This downloads LFD2 workshop data from the last 48 hours. The script will upload the new data to the Supabase PostgreSQL database.

`website/` runs the frontend React
`db/` connects to the database and provides an API for the frontend with Node.js

- **Backend** (`db/`): Node.js API server with Supabase
- **Frontend** (`website/`): React application
- **Scripts** (`script.py`): Python script for fetching Steam Workshop data

### Prerequisites

- Node.js (v16 or higher)
- Supabase
- Python 3.7+ (for data fetching)

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd LFD2-manager
   npm run install:all
   ```

2. **Set up environment variables:**

   ```bash
   # Supbase configuration
   # Used by the backend to load the database and used by the script to upload data
   SUPABASE_URL=
   SUPABASE_KEY=

   # For downloading the workshop data from Steam
   STEAM_API_KEY=

   # For the React frontend to connect to the backend API
   API_URL=
   ```

3. **Fetch mod data (optional):**

   ```bash
   # Run the Python script to fetch latest mod data
   python script.py

   # Import data to database
   npm run import
   ```

4. **Start the application:**

   ```bash
   # Start both backend and frontend
   npm run start:dev

   # Or start individually:
   npm run start:backend  # Backend only
   npm run start:frontend # Frontend only
   ```

## Available Scripts

### Root Level

- `npm start` - Start backend server
- `npm run build` - Build frontend for production
- `npm run install:all` - Install all dependencies
- `python script.py` - Installs and uploads workshop data into the database

### Backend (`db/`)

- `npm run start:backend` - Start Express server
- `npm run dev` - Start with nodemon for development

### Frontend (`website/`)

- `npm run start:frontend` - Start React development server
- `npm run build:frontend` - Build for production
