# Technology Stack

## Build System & Framework

- **Vite**: Modern build tool with fast HMR and optimized production builds
- **React 18**: Frontend framework with hooks and modern patterns
- **TypeScript**: Strict typing with relaxed configuration for rapid development
- **React Router DOM**: Client-side routing with nested layouts

## UI & Styling

- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Radix UI**: Accessible, unstyled UI primitives for complex components
- **Lucide React**: Icon library for consistent iconography
- **Plus Jakarta Sans**: Primary font family

## State Management & Data

- **Zustand**: Lightweight state management with persistence
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation for forms and data

## Development Tools

- **ESLint**: Code linting with TypeScript and React rules
- **Vitest**: Unit testing framework with jsdom environment
- **Testing Library**: React component testing utilities

## Common Commands

```bash
# Development
npm run dev              # Start development server (port 8080)
npm run build           # Production build
npm run build:dev       # Development build
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run test            # Run tests once
npm run test:watch      # Run tests in watch mode
```

## Configuration Notes

- **Path Aliases**: `@/` maps to `src/` directory
- **TypeScript**: Relaxed configuration with `noImplicitAny: false` for rapid prototyping
- **Vite Server**: Configured for host `::` on port 8080 with HMR overlay disabled
- **Component Tagger**: Lovable development tool integration