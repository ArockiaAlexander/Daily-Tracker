# 📊 Daily Status Tracker CBPET

A modern, responsive web application for CBPET team performers to **log daily work status**, **monitor performance targets**, and **export reports** — all from the browser with no backend required.

---

## ✨ Features

- **📝 Status Entry Form** — Log tasks with performer name, title, task type, completed work, estimated & actual time
- **📈 Live Preview Metrics** — Instantly see target achievement % and time efficiency % as you fill out the form
- **📋 Submission History** — View all logged entries in a sortable table with date filtering
- **🎯 Standard Targets** — Built-in benchmarks for 8 task types (Prestyle, Preedit, FL Validation, Revises Validation, Normalisation, Cast-off XML Conversion, Ref Edit, Style Editing)
- **✅ Daily Summary** — Complete your day and get a cumulative performance summary with achievement status
- **📥 CSV Export** — Download all entries as a detailed CSV report with cumulative totals
- **🌗 Dark Mode** — Toggle between light and dark themes with persistent preference
- **💾 Local Storage** — All data persists in your browser — no server or database needed
- **🗑️ Entry Management** — Delete individual entries or clear all history with confirmation modals
- **📱 Responsive Design** — Works seamlessly on desktop and mobile devices

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI library |
| **Vite 6** | Build tool & dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **PostCSS + Autoprefixer** | CSS processing |
| **localStorage** | Client-side data persistence |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ArockiaAlexander/Daily-Tracker.git
   cd Daily-Tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open in your browser**

   Navigate to the URL shown in the terminal (typically `http://localhost:5173`)

---

## 📦 Build for Production

```bash
npm run build
```

The optimized output will be in the `dist/` directory. Preview the production build with:

```bash
npm run preview
```

---

## 🎯 Standard Targets Reference

| Task Type | Target (8-hour day) | Unit |
|---|---|---|
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
├── index.html              # App entry point
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── src/
│   ├── main.jsx            # React root mount
│   ├── App.jsx             # Main application component
│   ├── index.css           # Global styles
│   └── components/
│       ├── Modal.jsx       # Reusable modal dialog
│       └── Toast.jsx       # Toast notification component
└── .gitignore
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private. All rights reserved.
