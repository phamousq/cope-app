# COPE — Cancer Outcomes & Prognosis Evaluation

A HIPAA-compliant, client-side web application for generating patient-friendly cancer prognosis documents.

**Live:** [cope-app](https://github.com/phamousq/cope-app)

---

## Overview

COPE helps patients and providers have honest, clear conversations about cancer prognosis. It generates a structured, readable report from form inputs — including diagnosis details, treatment goals, and survival estimates from multiple data sources.

- **100% client-side** — no server, no data persistence
- **Session-only state** — data lives in browser memory only
- **Client-side PDF generation** — PDFs are created in-browser with `@react-pdf/renderer`

---

## Getting Started

```bash
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

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
| PDF | @react-pdf/renderer |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Language | TypeScript (strict) |

---

## Project Structure

```
src/
├── components/
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
├── constants/
│   └── clinicalBins.ts              # Age groups, cancer stages, treatment options
├── services/
│   └── api.ts                       # SEER API contract + mock data
├── types/
│   └── index.ts                     # TypeScript interfaces
├── App.tsx
├── main.tsx
└── index.css
```
