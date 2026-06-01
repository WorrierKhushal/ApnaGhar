# AapnaGhar (Aiap Powered Indian Homestays & Stays Platform)
## Deployment & Setup Guide

Welcome to the AapnaGhar deployment guide. Follow the instructions below to install, configure, seed, and launch the platform on your local machine or staging servers.

---

## 1. Prerequisites

Ensure you have the following packages installed on your host system:
- **Node.js**: `v18.x` or higher (tested on `v20.x`)
- **NPM**: `v9.x` or higher
- **MongoDB**: A locally running MongoDB instance (on port `27017`) or a MongoDB Atlas Cloud connection cluster link.
- **Ollama**: Locally installed (from [ollama.com](https://ollama.com)) to support AI features.

---

## 2. Server Configuration & Setup

1. Open your terminal and navigate to the `/server` directory:
   ```bash
   cd server
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file inside the `/server` directory and paste the following parameters:
   ```env
   # Network configuration
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173

   # MongoDB Connection parameters
   # For local: mongodb://127.0.0.1:27017/apnaghar
   # For cloud: mongodb+srv://<user>:<password>@cluster.mongodb.net/apnaghar
   MONGO_URI=mongodb://127.0.0.1:27017/apnaghar

   # Authentication Secrets (Generate secure random hashes for production)
   JWT_SECRET=aapnaghar_core_access_token_secret_hash_key_9918
   JWT_REFRESH_SECRET=aapnaghar_core_refresh_token_secret_hash_key_8827
   
   # Expirations parameters
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   ```

4. Launch the API server:
   - For developer live-reload mode (monitors source modifications):
     ```bash
     npm run dev
     ```
   - For standard startup mode:
     ```bash
     npm start
     ```

---

## 3. Database Seeding

To quickly populate the database with mock hosts, users, stay listings, reviews, and local experiences, run the seeder script.

1. Ensure the server is configured and the MongoDB daemon is active.
2. In the `/server` directory, execute:
   ```bash
   node seeder.js
   ```
3. **Verification**: You should see a success message: `Database seeded successfully with stays, experiences, and users.`

### Predefined User Accounts (Seeded)
Use these credentials to log in and test different system dashboards:
* **System Administrator**:
  - Email: `admin@apnaghar.com`
  - Password: `password123`
* **Property Host / Owner**:
  - Email: `host@apnaghar.com`
  - Password: `password123`
* **Traveler / Guest**:
  - Email: `guest@apnaghar.com`
  - Password: `password123`

---

## 4. Client Configuration & Setup

1. Navigate to the `/client` directory:
   ```bash
   cd ../client
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `/client` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Launch the frontend development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser to view the application.

5. Build the optimized production assets bundle:
   ```bash
   npm run build
   ```
   Compiled files will be generated in `/client/dist` utilizing manual code-splitting.

---

## 5. Ollama AI Setup

To enable the Llama 3 powered smart trip itinerary builder and the GharGyan travel assistant, configure a local Ollama server.

1. Download and install Ollama from [ollama.com](https://ollama.com).
2. Download the fast **Llama 3** (8B) model:
   ```bash
   ollama pull llama3
   ```
3. Set the `OLLAMA_ORIGINS` environment variable to allow connections from the Express API server (port `5000`):
   - **Windows PowerShell**:
     ```powershell
     $env:OLLAMA_ORIGINS="*"
     ollama serve
     ```
   - **Windows Command Prompt (CMD)**:
     ```cmd
     set OLLAMA_ORIGINS=*
     ollama serve
     ```
   - **macOS / Linux Terminal**:
     ```bash
     OLLAMA_ORIGINS="*" ollama serve
     ```
4. **Resilience Note**: If Ollama is offline or takes too long to respond, the AapnaGhar backend automatically falls back to a high-fidelity local rule-based generator, guaranteeing 100% feature availability.
