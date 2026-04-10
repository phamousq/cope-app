# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [26.04.02] - 2026-04-10

### Added
- Dark mode with light/dark/system theme toggle
- Orange/amber gradient design palette
- Landing page with cursor-following gradient buttons
- Responsive mobile navigation with hamburger menu
- Theme persistence across sessions (localStorage)

### Fixed
- Dark mode styling for all UI components (Card, Input, Select, Checkbox)
- Dark mode text colors for all PatientForm sections
- Tailwind v4 class-based dark mode configuration

## [26.04.01] - 2026-04-09

### Added
- Voice transcription via Browser Web Speech API
- AssemblyAI REST API as alternative transcription provider
- Voice input page with click-to-record interface
- Global transcript context for sharing across pages
- PDF generation for prognosis reports
- Copy to clipboard functionality

### Features
- Demographics section (sex, age group, ethnicity)
- Diagnosis section (cancer type, stage, spread)
- Treatment plan section (goals, treatments)
- Prognosis section with multiple data sources
