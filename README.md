# Bicol University Polangui Internship & Practicum (OJT) Tracker

A web-based OJT Management System that streamlines coordination, tracking, and approval of student internships at **Bicol University Polangui**.

Built by **SPIKE PLANTED**.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Features](#features)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Collections](#database-collections)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Expected Benefits](#expected-benefits)
- [Team](#team)
- [License](#license)

---

## Problem Statement

Tracking and managing student internships (OJT) currently involves fragmented, manual procedures. Coordinating between university administrators, company supervisors, and student interns often leads to communication gaps, delayed submissions, and difficulty in verifying work hours and required documents.

## Objectives

**General Objective**

- Develop a web-based OJT Management System to streamline coordination, tracking, and approval for student internships at Bicol University Polangui.

**Specific Objectives**

- Enable students to easily log hours, upload documents, and submit weekly reports.
- Allow supervisors to view, monitor, and digitally sign off on intern hours and journals.
- Provide OJT coordinators and deans with system-wide reporting and partner management tools.

## Features

### Admin (OJT Coordinator / Dean)
- Generate system-wide reports on how many students are placed
- Approve final grades and completions
- Manage partner companies

### Staff (Company Supervisor) — *optional role*
- View assigned intern's hours and journals
- Digitally sign off on hours and journals

### Customer (Student Intern)
- Log daily hours
- Submit weekly reports
- Upload required documents (MOA, insurance)
- View total hours completed

## User Roles

| Role | Who | Group |
|------|-----|-------|
| Admin | OJT Coordinator / Dean | Primary |
| Customer | Student Intern | Primary |
| Staff | Company Supervisor of a partner company | Secondary |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Tailwind CSS, Vite, React Router, Axios, Recharts, date-fns, Lucide React |
| Backend | Node.js, Express.js, Mongoose, JWT (jsonwebtoken), bcryptjs, Multer, CORS, dotenv |
| Database | MongoDB |
| Tools & Deployment | Git, GitHub, Render |

## System Architecture

```
 Student Intern · Company Supervisor · OJT Coordinator / Dean
                          │
                          ▼
┌──────────────────────────────────────────────┐
│ Frontend — React.js, Tailwind CSS, Vite      │
│ Dashboards · Time logs · Weekly journals ·   │
│ Document uploads · Reports                   │
└──────────────────────────────────────────────┘
                          ▲▼
┌──────────────────────────────────────────────┐
│ Backend — Node.js / Express.js               │
│ Authentication · Hour tracking · Approval    │
│ workflows · Company management · Reporting   │
└──────────────────────────────────────────────┘
                          ▲▼
┌──────────────────────────────────────────────┐
│ MongoDB                                      │
│ Users · Companies · TimeLogs ·               │
│ WeeklyJournals · Documents                   │
└──────────────────────────────────────────────┘

Development & deployment: Git · GitHub · Render
```

## Database Collections

- `Users`
- `Companies`
- `TimeLogs`
- `WeeklyJournals`
- `Documents`

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (recent LTS, v20.19+ or v22.12+ recommended for Vite)
- npm
- [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas)
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/zuniegamarial/Spike-Planted.git
cd Spike-Planted

# 2. Install backend dependencies
cd server
npm install

# 3. Install frontend dependencies
cd ../client
npm install
```

### Environment Variables

Create a `.env` file in the `server/` folder:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@<cluster-address>/spike_planted?retryWrites=true&w=majority
JWT_SECRET=<a-long-random-string>
```

| Variable | Description |
|----------|-------------|
| `PORT` | Port the API listens on (default `5000`) |
| `MONGODB_URI` | MongoDB Atlas connection string for the `spike_planted` database. Get it from Atlas under **Connect > Drivers** |
| `JWT_SECRET` | Secret used to sign login tokens. Generate one with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |

Ask the project maintainers for the real values. They are shared privately and never committed to the repository.

> **Never commit your `.env` file.** Keep it listed in `.gitignore` and share real values with teammates privately.

### Running the App

```bash
# Start the backend in watch mode (from /server)
npm run dev

# Or start it normally (e.g., in production)
npm start

# Start the frontend (from /client)
npm run dev
```

The frontend runs at `http://localhost:5173` by default (Vite), and the API at `http://localhost:5000`.

Backend scripts (from `/server`):

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the API with auto-restart on file changes (`node --watch server.js`) |
| `npm start` | Start the API (`node server.js`) |

Other frontend scripts (from `/client`):

| Command | Description |
|---------|-------------|
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

### Deployment

The system is deployed on **Render**. Link: `<add-live-url-here>`

## Project Structure

```
Spike-Planted/
├── client/          # React + Vite + Tailwind frontend
├── server/          # Node.js + Express backend
├── .gitignore
└── README.md
```

## Expected Benefits

- **Optimized Tracking & Placements** — Eliminates manual record-keeping errors through real-time progress, log tracking, and automated total hour calculations.
- **Streamlined Document Submission** — Speeds up collection and compliance checks for essential student files like MOAs and insurance.
- **Improved Verification** — Allows on-site supervisors to easily review hours and submit digital sign-offs, reducing friction in completion approvals.
- **Effective Administration** — Empowers OJT coordinators and deans with system-wide visibility to oversee placements and verify student completions.

## Team

**SPIKE PLANTED**

| Member | Role |
|--------|------|
| Zuniega, Marial Angel | Project Manager / Data Administrator |
| Arcenal, Gabriel Angelo | Frontend Lead |
| Baltasar, Rafael Salvador | Tester / QA |
| Baldano, Christofer B. | Backend Lead |

Bicol University Polangui · Polangui, Albay · bupc-dean@bicol-u.edu.ph

## License

<!-- Add your license here (e.g., MIT) or remove this section. -->
This project is developed for academic purposes at Bicol University Polangui.
