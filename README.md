# COPE — Cancer Outcomes & Prognosis Evaluation

A client-side web application for generating patient-friendly cancer prognosis documents.

**Live:** [cope-app](https://cope-app.pages.dev) — hosted on Cloudflare Pages (main branch)

---

## Overview

COPE helps patients and providers have honest, clear conversations about cancer prognosis. It generates a structured, readable report from form inputs — including diagnosis details, treatment goals, and survival estimates from multiple data sources.

- **100% client-side** — no server, no data persistence
- **Session-only state** — data lives in browser memory only
- **Client-side PDF generation** — PDFs are created in-browser with `@react-pdf/renderer`
- **Voice input** — dictation via browser Web Speech API or AssemblyAI transcription
- **Dark mode** — toggle between light, dark, and system theme

---

## Features

### Voice Input
Dictate clinical notes using your microphone. Transcriptions are processed via:
- **Browser Web Speech API** — native, no setup required
- **AssemblyAI** — alternative REST API transcription (configure via `VITE_ASSEMBLYAI_API_KEY`)

### Dark Mode
Toggle between light, dark, and system theme. Theme preference persists across sessions.

### Landing Page
Beautiful gradient landing page with orange/amber color palette and cursor-following effects.

### Responsive Design
Mobile-friendly with hamburger menu navigation and adaptive layouts.

---

## Getting Started

```bash
# Install dependencies (requires pnpm)
pnpm install

# Start development server
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview
```

Visit [http://localhost:5173](http://localhost:5173)

**Note:** This project uses [pnpm](https://pnpm.io/) for package management. Do not use npm or yarn — the lockfile (`pnpm-lock.yaml`) must be kept in sync with `package.json`. After adding dependencies, always run `pnpm install` to update the lockfile before committing.

---

## Form Sections

### Demographics
Patient information — sex, age group, and ethnicity.

### Diagnosis
Cancer details — type of cancer (primary site), cancer stage (localized/regional/metastatic), scientific/histological name, and where it has spread.

### Treatment Plan
Treatment goals (cure, remission, quality of life, longer life, comfort) and planned treatments (radiation, surgery, chemotherapy, immunotherapy, targeted therapy, hormone therapy).

### Prognosis
Survival estimates from three sources:
- **Provider Estimate** — manually editable by the physician
- **SEER Data** — fetched from SEER registry (button copies form data for API request)
- **CancerSurvivalRates** — external source (button copies form data for API request)
- **AI Analysis** — placeholder for future AI integration (button copies form data for API request)

---

## Export Options

### Generate PDF Report
Creates a formatted PDF document containing all form data plus the "A Message About Your Care" discussion section. PDF sections: Diagnosis → Treatment → Prognosis → Prognosis Discussion.

### Copy to Clipboard
Copies a plain text summary of the form (demographics, diagnosis, treatment) to the clipboard for pasting into notes, messages, or other systems.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router v7 |
| PDF | @react-pdf/renderer |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Language | TypeScript (strict) |
| Package Manager | pnpm |

## Development Workflow

All features are developed on **feature branches** and reviewed before merging to `main`.

**Standard workflow:**
1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit
3. Push and open a PR for review
4. Merge to `main` after approval

**CI/CD:**
- `main` branch auto-deploys to [Cloudflare Pages](https://cope-app.pages.dev)
- PR preview deployments available via Cloudflare Pages

---

## Project Structure

```
src/
├── components/
│   ├── NavBar/                      # Navigation bar component
│   │   └── NavBar.tsx
│   ├── PatientForm/
│   │   ├── PatientForm.tsx         # Main form container
│   │   ├── DemographicsSection.tsx
│   │   ├── DiagnosisSection.tsx
│   │   ├── TreatmentPlanSection.tsx
│   │   └── PrognosisSection.tsx
│   ├── PDF/
│   │   ├── COPEDocument.tsx         # Root PDF document
│   │   ├── DiagnosisSectionPDF.tsx
│   │   ├── TreatmentSectionPDF.tsx
│   │   ├── PrognosisSectionPDF.tsx
│   │   └── PrognosisDiscussion.tsx  # "A Message About Your Care"
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Checkbox.tsx
│       ├── Input.tsx
│       └── Select.tsx
├── hooks/
│   └── useSessionState.ts          # Auto-clearing session state hook
├── pages/                           # Route pages
│   ├── PatientView.tsx             # Main patient form (original)
│   ├── ProviderView.tsx           # Provider perspective view
│   ├── VoiceInput.tsx              # Voice input interface
│   ├── FormData.tsx                # Form data view
│   └── index.ts                   # Page exports
├── constants/
│   └── clinicalBins.ts              # Age groups, cancer stages, treatment options
├── services/
│   └── api.ts                       # SEER API contract + mock data
├── types/
│   └── index.ts                     # TypeScript interfaces
├── App.tsx                           # Main app with routing
├── main.tsx
└── index.css
```
