# 📊 Daily Status Tracker CBPET

A modern, responsive web application for CBPET team performers to **log daily work status**, **monitor performance targets**, **visualize metrics**, and **sync data to the cloud**.

---

## ✨ Features

-   **📝 Status Entry Form** — Log tasks with performer name, title, task type, completed work, estimated & actual time.
-   **📈 Visual Dashboard** — Modern dashboard with Pie charts for task distribution and Line charts for performance trends over time.
-   **☁️ Supabase Cloud Sync** — Real-time data synchronization. Your entries are saved locally AND synced to a Supabase database for multi-device access.
-   **📉 Live Preview Metrics** — Instantly see target achievement % and time efficiency % as you fill out the form.
-   **📋 Submission History** — View all logged entries in a sortable table with date filtering.
-   **🎯 Standard Targets** — Built-in benchmarks for 8 task types (Prestyle, Preedit, FL Validation, Revises Validation, Normalisation, Cast-off XML Conversion, Ref Edit, Style Editing).
-   **✅ Daily Summary** — Complete your day and get a cumulative performance summary with achievement status.
-   **📥 CSV Export** — Download all entries as a detailed CSV report with cumulative totals.
-   **🌗 Dark Mode** — Toggle between light and dark themes with persistent preference.
-   **📱 Responsive Design** — Works seamlessly on desktop and mobile devices.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 18** | UI library |
| **Vite 6** | Build tool & dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **Supabase** | Backend-as-a-Service for data storage and auth |
| **Chart.js** | Data visualization for performance metrics |
| **Lucide React** | Consistent and beautiful iconography |
| **localStorage** | Client-side preference persistence |

---

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher recommended)
-   npm (comes with Node.js)
-   A [Supabase](https://supabase.com/) project

### Environment Setup

1.  Copy `.env.example` to a new file named `.env`:
    ```bash
    cp .env.example .env
    ```
2.  Fill in your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ArockiaAlexander/Daily-Tracker.git
    cd Daily-Tracker
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Open in your browser**
    Navigate to `http://localhost:5173`

---

## 📦 Build for Production

```bash
npm run build
```
The optimized output will be in the `dist/` directory.

---

## 🎯 Standard Targets Reference

| Task Type | Target (8-hour day) | Unit |
| :--- | :--- | :--- |
| Prestyle | 900 | pages/day |
| Preedit | 300 | pages/day |
| FL Validation | 600 | pages/day |
| Revises Validation | 1,200 | pages/day |
| Normalisation | 300 | pages/day |
| Cast-off XML Conversion | 4 | titles/day |
| Ref Edit | 400 | references/day |
| Style Editing | 80 | pages/day |

---

## 📂 Project Structure

```
Daily-Tracker/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx   # Data visualization charts
│   │   ├── Modal.jsx       # Reusable modal dialog
│   │   └── Toast.jsx       # Toast notifications
│   ├── lib/
│   │   └── supabase.js     # Supabase client configuration
│   ├── App.jsx             # Main application logic
│   └── main.jsx            # Entry point
├── .env.example            # Template for env variables
├── package.json            # Dependencies & scripts
└── tailwind.config.js      # Styling configuration
```

---

## 🤝 Contributing

1.  Fork the repository
2.  Create a feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

---

## 📄 License

This project is private. All rights reserved.
