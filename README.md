# 📊 Daily Status Tracker CBPET (Enterprise)

A premium, enterprise-grade performance tracking system designed for the **CBPET** team. This application features a robust **Role-Based Access Control (RBAC)** system, real-time analytics, and persistent cloud synchronization via Supabase.

[![Deploy to GitHub Pages](https://github.com/ArockiaAlexander/Daily-Tracker/actions/workflows/deploy.yml/badge.svg)](https://github.com/ArockiaAlexander/Daily-Tracker/actions/workflows/deploy.yml)

---

## 🔥 Key Pillars

### 1. 🚀 Modern Architecture
*   **Landing Experience**: Beautifully designed project overview and role-clarity splash screen.
*   **React + Vite**: High-performance frontend engine with optimized bundling.
*   **Supabase Auth & DB**: Secure authentication and real-time data persistence with Row Level Security (RLS).

### 2. 🛡️ Role-Based Access Control (RBAC)
*   **👑 Admin**: Full system control, role assignment, and user profile management (including deletion).
*   **📋 Manager**: Global analytical oversight, client-wise performance grouping, and user team management.
*   **🏢 Client Lead**: Access to all performer data under a specific `client_id` with performer-wise comparisons.
*   **👤 Performer**: Personal dashboard, daily logging, and monthly performance ranking (gamification).

### 3. 📉 Intelligent Analytics
*   **Neural Dashboard**: Dynamic charts (Pie/Line/Bar) that adapt their data scope based on the user's role.
*   **Ranking System**: Monthly performance scores and leaderboards for performers.
*   **Client Benchmarking**: Group-level metrics for managers to identify high-performing units.

### 4. 🛠️ Team Management
*   **User Provisioning**: Generate professional invite links and copy-to-clipboard invitation messages.
*   **Neural Search**: Instantly find any user by name, role, or ID within the administration panel.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 18** | UI Framework |
| **Vite 6** | Build & Dev Tooling |
| **Tailwind CSS 3** | Utility-first Styling |
| **Supabase** | Authentication, Postgres Database & RLS |
| **Chart.js 4** | Advanced Data Visualization |
| **Lucide React** | Premium Iconography |
| **GitHub Actions** | Automated CI/CD for GitHub Pages |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Supabase Account](https://supabase.com/)

### Database Setup
1.  Navigate to your Supabase Project -> **SQL Editor**.
2.  Copy the contents of `AUTH_SETUP.sql` from this repository and run it.
3.  This will create the `profiles` and `status_entries` tables, enums, and all RLS policies.

### Environment Setup
1.  Create a `.env` file from `.env.example`:
    ```bash
    cp .env.example .env
    ```
2.  Fill in your Supabase project details:
    ```env
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    ```

### Installation & Run
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

---

## 🎯 Target Benchmarks (8-Hour Day)

| Process | Target | Unit |
| :--- | :--- | :--- |
| **Prestyle** | 900 | Pages |
| **Preedit** | 300 | Pages |
| **FL Validation** | 600 | Pages |
| **Revises Validation** | 1,200 | Pages |
| **Normalisation** | 300 | Pages |
| **Cast-off XML** | 4 | Titles |
| **Ref Edit** | 400 | References |
| **Style Editing** | 80 | Pages |

---

## 📂 Project Structure

```text
Daily-Tracker/
├── .github/workflows/deploy.yml # CI/CD Build Pipeline
├── src/
│   ├── components/
│   │   ├── LandingPage.jsx     # Enterprise Splash Screen
│   │   ├── Dashboard.jsx       # Multi-role Analytics
│   │   ├── Signup.jsx          # Performer Registration
│   │   ├── Login.jsx           # Secure Portal Entrance
│   │   └── Modal.jsx           # System Dialogs
│   ├── lib/
│   │   └── supabase.js         # Backend Connectivity
│   ├── App.jsx                 # Core Routing & State
│   └── main.jsx                # Framework Entry
├── AUTH_SETUP.sql              # Database Schema & RLS Policies
└── vite.config.js              # Build Configurations
```

---

## 📄 License
This project is private and proprietary. Developed for the CBPET Team.
&copy; 2024 CBPET Engine Alpha.
