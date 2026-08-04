# CallsChat - Web Application Frontend 💬🚀

Welcome to the **CallsChat Web Application Frontend** repository! CallsChat is a modern, real-time communication platform designed for seamless personal and business messaging, voice/video calling, group huddles, and interactive team collaboration.

Built with **Next.js 16** (App Router), **React 19**, **TypeScript**, and **Tailwind CSS v4**, this project delivers a highly responsive, premium, and multilingual user experience.

---

## ✨ Key Features

- **💬 Real-Time Messaging**: Instant 1-on-1 and group messaging powered by **Socket.IO**. Supports rich media sharing, file uploads, message pinning, and emoji reactions.
- **📞 HD Voice & Video Calls**: High-quality WebRTC audio and video calling, group outgoing/incoming calls, and live huddles powered by **LiveKit**.
- **🏢 Personal & Business Workspaces**: Dedicated business dashboards, team collaboration tools, and workspace management.
- **🌍 Multilingual Support (i18n)**: Fully localized interface using **next-intl**, supporting English, Bangla, Portuguese, Hindi, and German.
- **🔔 Push Notifications**: Integrated with **Firebase Cloud Messaging (FCM)** for background push notifications and real-time alerts.
- **🎨 Premium UI/UX**: Designed with **Tailwind CSS v4**, **Shadcn UI**, and **Framer Motion** for smooth animations, glassmorphism, and responsive dark/light themes.
- **☁️ Cloud Media Management**: Fast and reliable image and file uploads using **Cloudinary**.

---

## 🛠️ Technology Stack

- **Core Framework**: [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Framer Motion](https://www.framer.com/motion/)
- **State Management & Forms**: [Zustand](https://docs.pmnd.rs/zustand/), [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **Real-Time Communication**: [Socket.IO Client](https://socket.io/), [LiveKit WebRTC](https://livekit.io/)
- **Services & Storage**: [Firebase](https://firebase.google.com/) (Auth & FCM), [Cloudinary](https://cloudinary.com/)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)

---

## 📋 Prerequisites

Before setting up the project locally, ensure you have the following installed and running:

- **Node.js**: Version **20.x** or higher ([Download Node.js](https://nodejs.org/))
- **Package Manager**: `npm` (v9+), `yarn`, `pnpm`, or `bun`
- **Backend API & Socket Server**: Ensure the CallsChat backend server is running locally (default: `http://localhost:8000`) or accessible via a remote URL.
- **Third-Party Accounts**:
  - [LiveKit Cloud](https://livekit.io/) (for WebRTC audio/video calls)
  - [Cloudinary](https://cloudinary.com/) (for media and file uploads)
  - [Firebase Console](https://console.firebase.google.com/) (for push notifications and authentication)

---

## 🚀 Getting Started & Setup Guide

Follow these steps to set up and run the project on your local machine:

### 1. Clone the Repository

```bash
git clone <repository-url>
cd callschat-web-application-frontend
```

### 2. Install Dependencies

Install the required packages using your preferred package manager:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Configure Environment Variables

Create an environment configuration file in the root directory. You can copy the provided example:

```bash
cp .env.example .env.local
```

Open `.env.local` (or `.env`) in your editor and fill in your API endpoints and service credentials. See the [Environment Variables Example](#-environment-variables-example) section below for detailed descriptions of each variable.

### 4. Start the Development Server

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to see the application in action.

---

## 🔐 Environment Variables Example

Below is the complete list of environment variables required to run the application. Copy this block into your `.env.local` (or `.env`) file and replace the placeholder values with your actual credentials:

```env
# ==========================================
# 1. BACKEND API & SOCKET CONFIGURATION
# ==========================================
# The base URL for REST API requests (CallsChat backend)
NEXT_PUBLIC_BASE_URL="http://localhost:8000/api/v1"
BASE_URL="http://localhost:8000/api/v1"

# The base URL for WebSocket / Socket.IO connections
NEXT_PUBLIC_SOCKET_URL="http://localhost:8000"


# ==========================================
# 2. LIVEKIT WEBRTC CALLS & HUDDLES
# ==========================================
# LiveKit Cloud WebSocket URL for real-time audio/video communication
NEXT_PUBLIC_LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_URL="wss://your-project.livekit.cloud"

# LiveKit API credentials (required for token generation and server-side calls)
LIVEKIT_API_KEY="your_livekit_api_key"
LIVEKIT_API_SECRET="your_livekit_api_secret"


# ==========================================
# 3. RUSTFS & IMGPROXY MEDIA STORAGE
# ==========================================
# Self-hosted S3-compatible storage (RustFS) and Imgproxy for dynamic resizing
NEXT_PUBLIC_RUSTFS_URL="http://localhost:9100"
NEXT_PUBLIC_S3_BUCKET="calls-chat-media"
NEXT_PUBLIC_IMGPROXY_URL="http://localhost:8080"
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"


# ==========================================
# 4. FIREBASE CONFIGURATION (FCM & AUTH)
# ==========================================
# Firebase client SDK configuration (from Firebase Console -> Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="1:your_sender_id:web:your_app_id"

# Firebase Cloud Messaging (FCM) Web Push Certificate VAPID Key
NEXT_PUBLIC_FIREBASE_VAPID_KEY="your_firebase_vapid_key"

# Firebase Admin / Server Service Account Credentials (optional/if used server-side)
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
```

> [!TIP]
> **Local Development Note**: If you are running the backend server locally on port `8000`, keep `NEXT_PUBLIC_BASE_URL="http://localhost:8000/api/v1"` and `NEXT_PUBLIC_SOCKET_URL="http://localhost:8000"`. Ensure your backend server has CORS configured to allow requests from `http://localhost:3000`.

---

## 📁 Project Structure

Here is a high-level overview of the codebase organization:

```text
callschat-web-application-frontend/
├── app/                  # Next.js App Router pages and layouts
│   ├── (dashboard)/      # Authenticated dashboard routes (chats, calls, contacts, groups, profile)
│   └── (auth)/           # Authentication screens (login, register, personal/business signup)
├── components/           # Reusable UI components
│   ├── auth/             # Authentication & onboarding forms
│   ├── business/         # Business workspace & huddle overlays
│   ├── call/             # Incoming/outgoing call modals & controls
│   ├── chat/             # Message bubbles, input area, modals
│   ├── providers/        # Context providers (Socket, Theme, Intl, LiveKit)
│   └── ui/               # Shadcn UI base components
├── hooks/                # Custom React hooks (useSocket, useFCM, useAllMedia, etc.)
├── i18n/                 # Internationalization configuration & locale routing
├── lib/                  # Third-party SDK initializations (Firebase, Sodium, etc.)
├── messages/             # i18n translation JSON files (en, bn, pt, hi, de)
├── public/               # Static assets, audio notifications, service workers
├── services/             # API client wrappers and backend service integrations
├── types/                # TypeScript interfaces and type definitions
└── utils/                # Helper functions and formatting utilities
```

---

## 📜 Available Scripts

In the project directory, you can run:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with hot-reloading on port `3000`. |
| `npm run build` | Compiles and optimizes the application for production deployment. |
| `npm start` | Starts the production server (requires running `npm run build` first). |
| `npm run lint` | Runs ESLint to check for code quality and formatting errors. |

---

## 🚀 Production Deployment

There are two primary ways to deploy this application for production: using **Docker** (recommended) or deploying directly via **Node.js**.

### Option A: Deploy using Docker & Docker Compose (Recommended)

This repository includes a multi-stage `Dockerfile` and a `docker-compose.yml` optimized for Next.js standalone builds. This is the easiest way to deploy to any VPS (AWS EC2, DigitalOcean, etc.).

1. **Prepare your environment**:
   Create your `.env` file in the root directory (refer to the Environment Variables section).
   
2. **Build and start the container**:
   ```bash
   docker-compose up -d --build
   ```
3. **Access the application**:
   The frontend will be running on `http://localhost:3000`. You can map this port to a reverse proxy (like Nginx or Traefik) to serve it over HTTPS.

### Option B: Deploy using Node.js / PM2

If you prefer deploying directly to a Node.js server without Docker:

1. **Install dependencies and build**:
   ```bash
   npm install
   npm run build
   ```
2. **Start the server**:
   You can start it natively using:
   ```bash
   npm start
   ```
   *Note: For production, we highly recommend using a process manager like [PM2](https://pm2.keymetrics.io/) to keep the application alive:*
   ```bash
   npm install -g pm2
   pm2 start npm --name "callschat-frontend" -- start
   ```

*(Note: If you plan to deploy to Vercel, simply import the repository into Vercel and paste your environment variables. Vercel will automatically detect the Next.js framework.)*

---

## ❓ Troubleshooting & Common Issues

### 1. Socket.IO Connection Failed or CORS Error
- Verify that your CallsChat backend server is running and accessible at `NEXT_PUBLIC_SOCKET_URL` (e.g., `http://localhost:8000`).
- Ensure the backend CORS configuration allows `http://localhost:3000` as an allowed origin with credentials enabled.

### 2. LiveKit Audio/Video Not Connecting
- Check that `NEXT_PUBLIC_LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` are correctly set in your environment file.
- Verify that your browser permissions allow microphone and camera access.

### 3. Push Notifications Not Working
- Ensure `NEXT_PUBLIC_FIREBASE_VAPID_KEY` matches the Web Push Certificate key generated in your Firebase Console under **Cloud Messaging**.
- Check that `/firebase-messaging-sw.js` is accessible in your browser's Network tab and that notification permissions are granted.

---



## 📄 License

This project is proprietary and confidential. All rights reserved.
