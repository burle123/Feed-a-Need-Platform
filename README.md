# 🍽️ Feed A Need — Food & Fund Donation Platform

A modern, production-ready web application for connecting food donors with local organisations and individuals in need. Built with **React 18**, **Vite**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

---

## ✨ Features

### Core Functionality
- **Role-based Authentication** — Admin, Donor, and Recipient accounts
- **Donation Management** — Create, track, and manage food & fund donations
- **Real-time Dashboard** — Live statistics, charts, and donation tracking
- **Analytics** — Comprehensive donation insights and metrics
- **Notifications** — In-app notification system
- **Settings** — User profile and preference management
- **Documentation** — Built-in help and documentation page

### UI / UX Highlights
- 🎨 Light mode with cream `#faf8f5`, deep purple `#4a1942`, and amber `#d4a574` palette
- 🎭 Smooth animations via **Framer Motion**
- 📱 Fully responsive — mobile, tablet, and desktop
- ⚡ Instant navigation with React Router v6
- 🖱️ Micro-interactions and hover effects throughout

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **npm** 9+

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# → http://localhost:5173
```

---

## 🔐 Demo Credentials

Use the **Quick Demo Sign In** buttons on the login page, or enter manually:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@feedaneed.com` | `admin123` |
| **Donor** | `donor@feedaneed.com` | `donor123` |
| **Recipient** | `recipient@feedaneed.com` | `recipient123` |

---

## 📁 Project Structure

```
feed-a-need/
├── public/                  # Static assets (logo, videos, images)
├── src/
│   ├── components/
│   │   ├── auth/            # Login, Register
│   │   ├── dashboard/       # Dashboard, Analytics, Settings, etc.
│   │   └── ui/              # Navbar, Sidebar, Button, shared UI
│   ├── hooks/               # useAuth, useDonations custom hooks
│   ├── services/            # mockApi — data layer
│   ├── types/               # TypeScript interfaces
│   ├── App.tsx              # Routes and app shell
│   ├── main.tsx             # Entry point
│   └── index.css            # Global Tailwind + custom styles
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite 5 | Build tool & dev server |
| TypeScript | Type safety |
| Tailwind CSS 3 | Utility-first styling |
| Framer Motion | Animations |
| React Router v6 | Client-side routing |
| React Context API | Auth & global state |

---

## 📦 Build for Production

```bash
# Build optimised bundle
npm run build

# Preview the production build locally
npm run preview
```

Built files are output to the **`dist/`** folder.

---

## 🌐 Hosting Guide

### Vercel (Recommended — Free)

1. Push your project to **GitHub**
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your repository
4. Framework preset: **Vite**
5. Click **Deploy** — done!

> Vercel automatically handles SPA routing.

### Netlify

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site**
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add a `public/_redirects` file with:
   ```
   /* /index.html 200
   ```

### GitHub Pages

```bash
npm install --save-dev gh-pages
```

Add to `package.json`:
```json
"homepage": "https://<username>.github.io/feed-a-need",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

```bash
npm run deploy
```

---

## 🔧 Scripts

```bash
npm run dev        # Start development server (localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

---

## 🐛 Troubleshooting

**Port in use:**
```bash
npm run dev -- --port 3001
```

**Blank page on hosted site (routing issue):**
→ Add a `_redirects` file (Netlify) or configure `vercel.json` rewrites (Vercel handles this automatically).

**TypeScript errors:**
```bash
npx tsc --noEmit
```

**Clean reinstall:**
```bash
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

## 📄 License

MIT — free to use for personal and commercial projects.

---

**Made with ❤️ — Shantanu Burle**
