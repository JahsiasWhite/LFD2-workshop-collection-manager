# Left 4 Dead 2 Mod Manager

A comprehensive tool for organizing and managing Left 4 Dead 2 mod collections with an intuitive web interface.

## Project Structure

- **Backend** (`db/`): Node.js/Express API server with MongoDB
- **Frontend** (`website/`): React application
- **Scripts** (`script.py`): Python script for fetching Steam Workshop data

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
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
   # Create .env file in root directory
   MONGODB_URI=mongodb://localhost:27017/lfd2-manager
   REACT_APP_API_URL=http://localhost:3000/api/db
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
- `npm run start:dev` - Start both backend and frontend concurrently
- `npm run build` - Build frontend for production
- `npm run import` - Import JSON data to MongoDB
- `npm run install:all` - Install all dependencies

### Backend (`db/`)

- `npm run start:backend` - Start Express server
- `npm run dev` - Start with nodemon for development

### Frontend (`website/`)

- `npm run start:frontend` - Start React development server
- `npm run build:frontend` - Build for production

## Development

### Backend Development

The backend is located in the `db/` directory and provides:

- REST API endpoints for mod data
- MongoDB integration
- Steam API proxy
- CORS configuration

### Frontend Development

The frontend is a React application in the `website/` directory featuring:

- Modern React hooks and context
- Virtualized scrolling for performance
- Lazy loading images
- Toast notifications
- Error boundaries
- Responsive design

### Data Management

- Use `script.py` to fetch latest mod data from Steam Workshop
- Import data with `npm run import`
- Data is stored in MongoDB with automatic deduplication

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/lfd2-manager

# API Configuration
REACT_APP_API_URL=http://localhost:3000/api/db

# Steam API (for script.py)
STEAM_API_KEY=your_steam_api_key_here
```

## API Endpoints

- `GET /api/db/mods` - Get paginated mod list
- `POST /api/db/mods/batch` - Get mods by IDs
- `GET /api/steam/*` - Proxy to Steam API
