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
*   **Workflow Management** ✨: Organize teams into workflows, assign users to workflows, and track performance within workflow contexts (admins only).
*   **Enterprise Team Hierarchy** ✨: Create teams with managers, organize users by team, multi-team oversight for managers.

### 5. 🔄 Workflow-Wise Access Control
*   **Workflow Creation**: Admins create named workflows (e.g., "Q1 2026 Tracking", "Project Alpha").
*   **User Assignment**: Dynamically assign/unassign users to workflows.
*   **Workflow-Scoped Data**: RLS policies automatically restrict status entries visibility based on workflow membership.
*   **Role-Based Workflow Access**: Admins manage all workflows, workflow members see their assigned workflows.

### 6. 📈 Enterprise RBAC (5-Role Hierarchy) ✨
*   **5 Distinct Roles**: Super Admin, General Manager, Assistant Manager, Team Lead, Performer.
*   **Role-Based Access**: Different data visibility and features for each role level.
*   **Performance Leaderboards**: Monthly, Quarterly, and Yearly rankings with role-based filtering.
*   **Team Scoping**: Managers see only their assigned teams, performers see only their team.
*   **Database-Level Security**: RLS policies enforce permissions at the PostgreSQL level.
*   **Real-Time Metrics**: Automatic aggregation of performance data into team and organizational metrics.

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

**Step 1: Run AUTH_SETUP.sql (Foundation)**
1.  Navigate to your Supabase Project -> **SQL Editor**.
2.  Copy the contents of `AUTH_SETUP.sql` from this repository and run it.
3.  This will create the `profiles` and `status_entries` tables, enums, and all RLS policies.

**Step 2: Run WORKFLOW_SETUP.sql (Workflow Management - NEW!)**
1.  In the same Supabase SQL Editor, create a **New Query**.
2.  Copy the contents of `WORKFLOW_SETUP.sql` from this repository and run it.
3.  This will create:
    - `workflows` table for workflow metadata
    - `workflow_assignments` table for user-to-workflow mappings
    - Performance indexes and RLS policies
    - Helper views for workflow queries

⚠️ **Important**: Run both SQL files in order. `WORKFLOW_SETUP.sql` depends on tables created by `AUTH_SETUP.sql`.

### Using Workflow Management ✨

Once both SQL migrations are complete:

1. **Login as Admin** to the Daily-Tracker application
2. **Navigate to System Administration** → **📋 Workflows** tab
3. **Create Workflows**: Click "New Workflow" and enter a name (e.g., "Q1 2026 Performance Tracking")
4. **Assign Users**: Click on a workflow to expand it, then click "Assign" to add users
5. **View Assignments**: All assigned users will see this workflow and can filter status entries by workflow
6. **Manage Access**: RLS policies automatically restrict data visibility based on workflow membership

📚 **See [WORKFLOW_IMPLEMENTATION.md](./WORKFLOW_IMPLEMENTATION.md) for detailed feature documentation.**

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
├── .github/workflows/deploy.yml              # CI/CD Build Pipeline
├── src/
│   ├── components/
│   │   ├── LandingPage.jsx                   # Enterprise Splash Screen
│   │   ├── Dashboard.jsx                     # Multi-role Analytics
│   │   ├── WorkflowManager.jsx               # Workflow Management (Admin) ✨
│   │   ├── TeamManagement.jsx                # Team Management (Admin) ✨
│   │   ├── Leaderboard.jsx                   # Performance Rankings ✨
│   │   ├── Signup.jsx                        # Performer Registration
│   │   ├── Login.jsx                         # Secure Portal Entrance
│   │   └── Modal.jsx                         # System Dialogs
│   ├── lib/
│   │   └── supabase.js                       # Backend Connectivity
│   ├── App.jsx                               # Core Routing & State
│   └── main.jsx                              # Framework Entry
├── AUTH_SETUP.sql                            # Database Schema & RLS Policies (Foundation)
├── WORKFLOW_SETUP.sql                        # Workflow Tables & RLS Policies ✨
├── RBAC_MIGRATION.sql                        # Enterprise RBAC & Team Structure ✨
├── WORKFLOW_IMPLEMENTATION.md                # Workflow Feature Documentation ✨
├── RBAC_IMPLEMENTATION.md                    # Enterprise RBAC Documentation ✨
├── RBAC_OVERVIEW.md                          # RBAC System Summary ✨
├── DEPLOYMENT_CHECKLIST.md                   # Deployment & Testing Guide ✨
└── vite.config.js                            # Build Configurations
```

---

## 📄 License
This project is private and proprietary. Developed for the CBPET Team.
&copy; 2024 CBPET Engine Alpha.
