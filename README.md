<div align="center">
  <h1>🏙️ CitySense AI</h1>
  <p><strong>Actionable Civic Intelligence Platform</strong></p>
  <p>Turning scattered citizen reports into prioritized, AI-driven city insights.</p>
</div>

<hr>

## 🚨 The Problem
Modern cities face a constant barrage of infrastructure degradation—from water leaks to potholes and broken streetlights. Citizens often report these issues across various disconnected channels, resulting in a fragmented data landscape. City authorities struggle to triage thousands of scattered, duplicate complaints, making it difficult to identify the true scope, root cause, or urgency of systemic problems. 

## 💡 The Solution
**CitySense AI** acts as an intelligent command center for urban infrastructure management. It provides a seamless mobile-responsive web portal where citizens can submit geo-tagged, photo-verified reports of local issues. 

The core innovation lies in the AI-powered backend processing engine. Rather than leaving authorities with a raw list of complaints, CitySense AI utilizes Generative AI, Natural Language Processing, and geolocation clustering to automatically consolidate related reports into distinct **"Problem Clusters."**

## ✨ Key Features & Methodology
- **Automated Triage & Prioritization:** The AI evaluates each cluster against four metrics—Severity, Impact, Frequency, and Duration—generating a unified Priority Score (1-100).
- **Root Cause Hypothesis:** By analyzing the text and pattern of clustered citizen reports, the AI attempts to diagnose the underlying failure (e.g., recognizing that multiple reports of "low pressure" and "standing water" likely point to a main pipeline leak).
- **Admin Command Center:** Authorities access a clean, dashboard-driven interface to visualize heatmaps, track timelines, and seamlessly update the status of clustered issues.
- **Citizen Progress Tracking:** Citizens can log in and view a visual timeline of their report, tracking its status from "Submitted" all the way to "Resolved".
- **Automated Issue Generation:** A built-in daily CRON job dynamically generates mock civic issues based on real-world Indian urban problems to simulate active civic engagement.

## 🛠️ Technology Stack
- **Frontend:** HTML5, CSS3 (Custom Design System), Vanilla JS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ORM)
- **AI Integration:** Generative AI for semantic clustering, summarization, and mock data generation.
- **Mapping:** Leaflet.js, OpenStreetMap
- **Data Visualization:** Chart.js
- **Hosting / Deployment:** Vercel (Edge-optimized architecture)

## 🏗️ Architecture Flow
```
Citizen Submits Report (with Image & Geo-tag)
   ↓
Express.js Backend API handles multipart/form-data
   ↓
AI Analysis Engine (Extracts severity, summary, category)
   ↓
Clustering Engine (Groups spatially and semantically similar complaints in MongoDB)
   ↓
Priority Engine (Calculates Severity, Impact, Frequency, Duration)
   ↓
Root Cause Diagnosis (AI hypothesizes underlying infrastructure failure)
   ↓
Admin Command Center Dashboard (Visualizes clusters and heatmaps)
```

## 🚀 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/akarshakmishra47-afk/civicpulse-ai.git
   cd civicpulse-ai
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and add the following:
   ```env
   # Your MongoDB Connection String
   DATABASE_URL="mongodb+srv://..."
   
   # JWT Authentication Secret
   JWT_SECRET="your_secure_secret_key"
   
   # Generative AI API Key
   GEMINI_API_KEY="your_api_key"
   ```

4. **Seed the Database (Optional for Demo Data):**
   ```bash
   npm run seed
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

6. **Access the Application:**
   Open `http://localhost:3000` in your browser.

## 🔐 Demo Credentials
If the database has been seeded, you can use the following credentials to explore the platform:
- **Admin (Command Center):** `admin@123` / `123456`
- **Citizen (Reporting Portal):** `citizen@123` / `123456`

---
*Built for SU HACKS 2026 - Open Innovation Challenge*
