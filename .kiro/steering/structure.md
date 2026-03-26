# Project Structure

## Directory Organization

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components (auto-generated)
│   ├── AppHeader.tsx   # Main navigation header
│   ├── AppSidebar.tsx  # Navigation sidebar
│   ├── DashboardLayout.tsx # Main layout wrapper
│   └── *.tsx           # Custom business components
├── pages/              # Route components (one per page)
├── store/              # Zustand state management
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── test/               # Test setup and utilities
├── App.tsx             # Main app component with routing
├── main.tsx            # React app entry point
└── index.css           # Global styles and theme
```

## Naming Conventions

- **Components**: PascalCase (e.g., `CustomerFormModal.tsx`)
- **Pages**: PascalCase with "Page" suffix (e.g., `LeadsPage.tsx`)
- **Stores**: camelCase with "Store" suffix (e.g., `leadsStore.ts`)
- **Hooks**: camelCase with "use" prefix (e.g., `use-mobile.tsx`)
- **Types**: PascalCase for interfaces/types (e.g., `Lead`, `LeadStatus`)

## Component Architecture

- **Layout Components**: Handle page structure and navigation
- **Page Components**: Route-level components in `/pages`
- **UI Components**: Reusable components in `/components/ui` (shadcn/ui)
- **Business Components**: Domain-specific components in `/components`

## State Management Pattern

- **Zustand Stores**: One store per domain (leads, customers, employees, etc.)
- **Persistence**: Stores use `persist` middleware for local storage
- **Store Structure**: Actions and state in single store object
- **Type Safety**: Full TypeScript integration with proper typing

## Routing Structure

- **Layout Route**: `DashboardLayout` wraps all authenticated pages
- **Public Routes**: `/login` (outside layout)
- **Protected Routes**: All other routes within `DashboardLayout`
- **Dynamic Routes**: `/customers/:id` for detail pages

## Import Conventions

- **Path Alias**: Use `@/` for all internal imports
- **Component Imports**: Import from specific component files
- **UI Imports**: Import shadcn/ui components from `@/components/ui`
- **Store Imports**: Import stores with destructured actions/state

## File Organization Rules

- Keep components focused and single-responsibility
- Co-locate related types with their components
- Use index files sparingly (only for re-exports)
- Place shared utilities in `/lib`
- Keep test files adjacent to source files when possible