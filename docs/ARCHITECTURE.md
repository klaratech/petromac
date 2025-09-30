# Architecture Overview

This document explains the high-level architecture of the Petromac website and intranet application.

---

## System Architecture

The application is divided into three main sections:

```
┌─────────────────────────────────────────────────────────────┐
│                    Petromac Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │  Public Website │  │  Intranet Portal │  │    Kiosk   │ │
│  │                 │  │                  │  │            │ │
│  │  - Marketing    │  │  - Auth Required │  │  - Ops     │ │
│  │  - Product Info │  │  - Tool Links    │  │  - 3D      │ │
│  │  - Case Studies │  │  - Modules       │  │  - Data    │ │
│  └─────────────────┘  └──────────────────┘  └────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Application Layers

### 1. Public Website (/)

**Purpose:** Marketing and customer-facing content

**Routes:**
- `/` - Homepage with hero, problem areas, product teasers
- `/about` - Company information
- `/catalog` - Public product catalog
- `/case-studies` - Success stories showcase
- `/contact` - Contact form

**Components:**
- Located in `src/components/public/`
- Includes: Hero, Footer, ProblemSection, ProductTeaser

**Characteristics:**
- No authentication required
- SEO optimized
- Vercel Analytics enabled
- Static where possible

---

### 2. Intranet Portal (/intranet)

**Purpose:** Internal tools and external links hub

**Authentication:**
- Basic Auth via middleware
- Credentials: `INTRANET_USER` + `INTRANET_PASS`
- SEO protection: `noindex, nofollow` headers

**Structure:**

```
/intranet
├── Homepage (5 tiles)
│   ├── Athena (Production) → External link
│   ├── Athena (Test) → External link
│   ├── Kiosk → /intranet/kiosk
│   ├── Success Stories → /intranet/success-stories
│   └── Catalog → /intranet/catalog
│
├── Success Stories Module (/intranet/success-stories)
│   ├── Full-page filters and PDF builder
│   └── Uses SuccessStoriesPanel + PDFBuilderModal
│
├── Catalog Module (/intranet/catalog)
│   ├── Full-page 3D gallery with filters
│   └── Uses CatalogPanel + PDFBuilderModal
│
└── Kiosk Application (/intranet/kiosk)
    └── See Kiosk section below
```

---

### 3. Kiosk Application (/intranet/kiosk)

**Purpose:** Interactive dashboard for operations and product data

**Routes:**

```
/intranet/kiosk
├── /                      → Entry/menu page
├── /dashboard             → Operations map (D3.js)
├── /productlines          → Product line comparison charts
├── /catalog               → 3D product catalog
├── /successstories        → Success stories browser
├── /datacheck             → Data validation tools
└── /api/successstories    → PDF generation API
```

**Key Features:**
- Interactive D3 world map
- 3D product viewer (Three.js)
- Real-time data visualization
- PDF generation
- Responsive touch interface

---

## Module Architecture

### Feature Modules Pattern

Modules are self-contained features with standardized structure:

```
src/modules/[module-name]/
├── containers/          # Page & widget components
│   ├── [Module]Page.tsx        # Full standalone page
│   └── [Module]Widget.tsx      # Embeddable widget
├── hooks/              # Custom React hooks
│   └── use[Module]Filters.ts
├── services/           # Business logic & data access
│   └── [module].service.ts
├── types/              # TypeScript definitions
│   └── [module].types.ts
└── index.ts            # Public API exports
```

**Example: Success Stories Module**

```typescript
// Exported from src/modules/success-stories/index.ts
export { SuccessStoriesPage } from './containers/SuccessStoriesPage';
export { SuccessStoriesWidget } from './containers/SuccessStoriesWidget';
export type { SuccessStoriesFilters } from './types/successStories.types';
```

**Usage:**
```typescript
// In app page
import { SuccessStoriesPage } from '@/modules/success-stories';

// In kiosk embed
import { SuccessStoriesWidget } from '@/modules/success-stories';
```

---

## Shared Components Architecture

### Component Organization

```
src/components/
├── public/              # Public-facing components
│   ├── Hero.tsx
│   ├── Footer.tsx
│   └── ...
│
├── shared/              # Reusable intranet components
│   ├── pdf/             # PDF generation
│   │   ├── PDFBuilderModal.tsx
│   │   └── index.ts
│   │
│   ├── panels/          # Filter panels
│   │   ├── SuccessStoriesPanel.tsx
│   │   ├── CatalogPanel.tsx
│   │   └── index.ts
│   │
│   └── inputs/          # Form inputs
│       ├── MultiSelect.tsx
│       └── index.ts
│
└── [feature].tsx        # Feature-specific components
```

### Panel vs Page vs Widget

**Panel:**
- Reusable filter UI
- No routing logic
- Can be embedded anywhere
- Example: `SuccessStoriesPanel`

**Page:**
- Full-page component
- May include multiple panels
- Has routing
- Example: `SuccessStoriesPage`

**Widget:**
- Embeddable component
- Compact layout
- For dashboard/kiosk use
- Example: `SuccessStoriesWidget`

---

## Data Flow Architecture

### Operations Data Pipeline

```
┌─────────────────────┐
│  Excel File         │ (private, gitignored)
│  jobhistory.xlsx    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Python Script      │
│  generate_json.py   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  JSON Output        │
│  operations_data    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Vercel CDN         │
│  /public/data/      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Next.js App        │
│  D3 Visualization   │
└─────────────────────┘
```

### Success Stories Pipeline

```
┌─────────────────────┐
│  PDF + CSV          │
│  successstories.*   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Python Script      │
│  successstories.py  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  API Route          │
│  /api/success...    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Panel UI           │
│  Filters + PDF Gen  │
└─────────────────────┘
```

---

## Authentication & Security

### Middleware Flow

```
Request → Middleware → Route Handler
             ↓
        Check Path
             ↓
    /intranet/* ?
       ╱        ╲
     YES         NO
      ↓           ↓
  Basic Auth   Allow
      ↓
  Valid?
   ╱   ╲
 YES    NO
  ↓     ↓
Allow  401
```

### Security Layers

1. **Basic Auth** - Protects all `/intranet/*` routes
2. **SEO Protection** - `noindex` headers on intranet
3. **Data Privacy** - Sensitive data in `data/private/` (gitignored)
4. **Sanitized Outputs** - Only processed JSON in `public/data/`

---

## State Management

### Client State

- **React State**: Component-local state
- **URL State**: Filters, selections (for bookmarking)
- **localStorage**: User preferences, cached data

### Server State

- **Static Generation**: Pre-rendered at build time
- **Server Components**: Fetch data on server
- **API Routes**: Dynamic data endpoints

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Data Viz**: D3.js
- **3D Graphics**: Three.js + React Three Fiber

### Backend
- **Runtime**: Node.js
- **API Routes**: Next.js API handlers
- **Data Processing**: Python scripts
- **PDF Generation**: pdf-lib

### Deployment
- **Platform**: Vercel
- **CDN**: Vercel Edge Network
- **Analytics**: Vercel Analytics

---

## Performance Considerations

### Optimization Strategies

1. **Static Generation**: Pre-render public pages
2. **Code Splitting**: Dynamic imports for heavy components
3. **Image Optimization**: Next.js Image component
4. **Data Caching**: localStorage for frequently accessed data
5. **Lazy Loading**: Defer loading of 3D models and charts

### Bundle Size Management

- Tree shaking for unused code
- Dynamic imports for visualization libraries
- Separate bundles for public vs intranet

---

## Extensibility

### Adding New Modules

1. Create module directory: `src/modules/[name]/`
2. Follow standard structure (containers, hooks, services, types)
3. Export public API via `index.ts`
4. Add route in `src/app/intranet/[name]/`
5. Update intranet homepage tile

### Adding New Components

1. Determine scope (public, shared, or feature-specific)
2. Place in appropriate directory
3. Export via barrel file (`index.ts`)
4. Document props with TypeScript

---

## Future Considerations

- Potential migration to server-side auth (NextAuth.js)
- Real-time data updates (WebSocket/SSE)
- Internationalization (i18n)
- Progressive Web App enhancements
- GraphQL API layer
