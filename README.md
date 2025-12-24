# Rental Portal - React Frontend

Modern React application for the Rental Management Portal, built with Vite, TypeScript, and Tailwind CSS.

## Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **React Query** - Data Fetching
- **Zustand** - State Management
- **Axios** - HTTP Client
- **Lucide React** - Icons

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file:
```
VITE_API_URL=http://localhost:8000
```

## Project Structure

```
src/
├── api/          # API client functions
├── components/   # Reusable UI components
├── pages/        # Page components
├── stores/       # Zustand state stores
├── types/        # TypeScript interfaces
└── utils/        # Utility functions
```

## Deployment

### Cloudflare Pages

1. Push to GitHub
2. Connect to Cloudflare Pages
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
