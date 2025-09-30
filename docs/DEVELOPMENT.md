# Development Guide

This guide covers local development setup, workflows, and best practices for the Petromac website and intranet.

---

## Prerequisites

### Required Software

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **Python** 3.11+ (for data processing scripts)
- **Git** 2.x or higher

### Optional Tools

- **VSCode** (recommended IDE)
- **Homebrew** (macOS package manager)
- **Docker** (for containerized workflows)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/Klaratech/petromac.git
cd petromac
```

### 2. Install Node Dependencies

```bash
npm install
```

This will install all frontend dependencies including:
- Next.js 15
- React 19
- Tailwind CSS v4
- D3.js, Three.js
- TypeScript, ESLint

### 3. Environment Variables

Create your local environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Required: Intranet Authentication
INTRANET_USER=admin
INTRANET_PASS=your-secure-password

# Optional: External Links
NEXT_PUBLIC_ATHENA_URL=https://athena.petromac.co.nz/

# Optional: Feature Flags
# NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

**Important:**
- Never commit `.env.local` to Git
- Use strong passwords for production
- `NEXT_PUBLIC_` prefix exposes variables to the browser

### 4. Python Environment (Optional)

Only needed if you'll be running data processing scripts:

```bash
cd scripts/python
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

cd ../..
```

---

## Development Workflow

### Running the Dev Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at:
- **Local**: http://localhost:3000
- **Network**: http://192.168.x.x:3000

Features in dev mode:
- Hot Module Replacement (HMR)
- Fast Refresh for React components
- Detailed error messages
- Source maps

### Project Structure Overview

```
petromac/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── modules/          # Feature modules
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── types/            # TypeScript definitions
│   └── constants/        # App constants
├── public/               # Static assets
├── docs/                 # Documentation
├── scripts/              # Build/data scripts
└── tests/                # Test files (future)
```

### Building for Production

Create an optimized production build:

```bash
npm run build
```

This will:
1. Compile TypeScript
2. Run ESLint checks
3. Optimize bundles
4. Generate static pages
5. Create optimized assets

**Build Output:**
```
Route (app)                    Size    First Load JS
┌ ○ /                         177 B   106 kB
├ ○ /about                    177 B   106 kB
├ ○ /intranet                 801 B   112 kB
└ ...
```

Legend:
- `○` = Static (pre-rendered)
- `ƒ` = Dynamic (server-rendered on demand)

### Running Production Build Locally

After building, test the production build:

```bash
npm run start
```

This runs the optimized build at http://localhost:3000

**Use this to:**
- Verify production performance
- Test bundle sizes
- Check build optimization
- Validate before deployment

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

Auto-fix issues where possible:

```bash
npm run lint -- --fix
```

---

## Python Data Pipeline

### Overview

The Python scripts process raw Excel data into sanitized JSON for the web app.

### Pipeline Structure

```
scripts/python/
├── generate_json.py           # Main pipeline (Excel → JSON)
├── successstories.py          # Success stories processing
├── validate_data.py           # Data validation
├── normalization_config.py    # Config for data normalization
└── requirements.txt           # Python dependencies
```

### Running the Pipeline Locally

1. **Activate Python environment:**

```bash
cd scripts/python
source venv/bin/activate  # or venv\Scripts\activate on Windows
```

2. **Place source data:**

Ensure you have the source Excel file:
```
data/private/raw/jobhistory.xlsx
```

3. **Run the pipeline:**

```bash
python generate_json.py
```

This will:
- Read the Excel file
- Validate and normalize data
- Generate JSON output
- Save to `public/data/operations_data.json`

4. **Validate output:**

```bash
python validate_data.py
```

### Success Stories Processing

Process success stories PDF and CSV:

```bash
python successstories.py
```

This extracts data from:
- `public/successstories.pdf`
- `public/successstories-summary.csv`

### Pipeline via GitHub Actions

The pipeline can also run automatically via GitHub Actions:

- **Workflow**: `.github/workflows/data-build.yaml`
- **Trigger**: Manual or scheduled
- **Result**: Commits JSON to repository

---

## Development Best Practices

### Code Organization

#### Component Structure

```typescript
// Good: Named export with clear types
interface MyComponentProps {
  title: string;
  onClose: () => void;
}

export default function MyComponent({ title, onClose }: MyComponentProps) {
  // Component logic
}
```

#### Module Exports

```typescript
// src/modules/my-module/index.ts
export { MyModulePage } from './containers/MyModulePage';
export { MyModuleWidget } from './containers/MyModuleWidget';
export type { MyModuleFilters } from './types/myModule.types';
```

### TypeScript Guidelines

1. **Explicit Types**: Always define prop interfaces
2. **No `any`**: Use `unknown` and type guards instead
3. **Strict Mode**: Enabled in `tsconfig.json`
4. **Type Imports**: Use `import type` for type-only imports

### Styling Guidelines

#### Tailwind CSS Best Practices

```tsx
// Good: Use Tailwind classes
<div className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
  Button
</div>

// Avoid: Inline styles (use only when dynamic)
<div style={{ color: dynamicColor }}>
```

#### Brand Colors

Use defined brand colors from config:

```tsx
// Good: Use brand utilities
<div className="bg-brand text-white">

// Avoid: Hardcoded hex values
<div className="bg-[#1E4A9A]">
```

### File Naming Conventions

- **Components**: PascalCase (`MyComponent.tsx`)
- **Utilities**: camelCase (`myUtil.ts`)
- **Types**: PascalCase (`MyTypes.ts`)
- **Constants**: UPPER_CASE or camelCase

### Git Workflow

#### Branch Naming

```bash
feat/add-new-module          # New features
fix/correct-color-scheme     # Bug fixes
docs/update-readme           # Documentation
refactor/reorganize-components  # Code improvements
```

#### Commit Messages

Follow conventional commits:

```bash
git commit -m "feat: add success stories widget"
git commit -m "fix: correct header color scheme"
git commit -m "docs: update architecture guide"
git commit -m "refactor: move MultiSelect to inputs"
```

---

## Testing

### Manual Testing Checklist

Before committing:

- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] Test on localhost:3000
- [ ] Test intranet authentication
- [ ] Verify responsive design
- [ ] Check console for errors

### Browser Testing

Test in:
- Chrome/Edge (Chromium)
- Safari
- Firefox
- Mobile browsers (iOS/Android)

### Test Routes

- Public: `/`, `/about`, `/catalog`, `/case-studies`, `/contact`
- Intranet: `/intranet`, `/intranet/success-stories`, `/intranet/catalog`
- Kiosk: `/intranet/kiosk/dashboard`, `/intranet/kiosk/catalog`

---

## Common Development Tasks

### Adding a New Page

1. Create page file:
```bash
# src/app/my-page/page.tsx
```

2. Implement component:
```typescript
export default function MyPage() {
  return <div>My Page Content</div>;
}
```

3. Add navigation (if needed)

### Adding a New Component

1. Choose location:
   - Public: `src/components/public/`
   - Shared: `src/components/shared/`
   - Feature: `src/components/`

2. Create component file:
```typescript
// src/components/MyComponent.tsx
interface MyComponentProps {
  // Props definition
}

export default function MyComponent(props: MyComponentProps) {
  // Implementation
}
```

3. Export from index (if in shared):
```typescript
// src/components/shared/index.ts
export { default as MyComponent } from './MyComponent';
```

### Adding a New Module

1. Create module structure:
```bash
mkdir -p src/modules/my-module/{containers,hooks,services,types}
```

2. Create containers, hooks, services, types

3. Add module exports:
```typescript
// src/modules/my-module/index.ts
export { MyModulePage } from './containers/MyModulePage';
export type { MyModuleTypes } from './types/myModule.types';
```

4. Create app route:
```typescript
// src/app/intranet/my-module/page.tsx
import { MyModulePage } from '@/modules/my-module';

export default function Page() {
  return <MyModulePage />;
}
```

### Updating Brand Styles

Edit `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      brand: {
        DEFAULT: "#1E4A9A",
        light: "#2563eb",
        dark: "#1e3a8a",
      },
    },
  },
},
```

---

## Debugging

### Common Issues

#### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

#### Import Errors

Check path aliases in `tsconfig.json`:
```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

#### Environment Variables Not Loading

1. Restart dev server after changing `.env.local`
2. Ensure variable names start with `NEXT_PUBLIC_` for client-side access
3. Check file is named `.env.local` (not `.env.local.txt`)

#### Tailwind Styles Not Applying

1. Check `tailwind.config.ts` includes correct content paths
2. Verify class names (no typos)
3. Restart dev server

### Debug Mode

Enable verbose logging:

```bash
# Next.js debug mode
DEBUG=* npm run dev

# Specific module
DEBUG=next:* npm run dev
```

---

## Performance Optimization

### Bundle Analysis

Analyze bundle sizes:

```bash
npm run build

# Check output for large bundles
# Consider code splitting for modules >100KB
```

### Image Optimization

Use Next.js Image component:

```tsx
import Image from 'next/image';

<Image
  src="/images/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority
/>
```

### Dynamic Imports

For heavy components:

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />,
});
```

---

## Deployment

### Vercel Deployment

The project auto-deploys via Vercel:

- **Production**: Commits to `main` branch
- **Preview**: Pull requests and feature branches

### Environment Variables in Vercel

1. Go to Project Settings → Environment Variables
2. Add:
   - `INTRANET_USER`
   - `INTRANET_PASS`
   - `NEXT_PUBLIC_ATHENA_URL`
3. Select environments (Production, Preview, Development)

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Internal Docs
- `docs/ARCHITECTURE.md` - System architecture
- `docs/REPO_STRUCTURE.md` - Directory structure
- `docs/TAILWIND_THEME.md` - Brand theme guide
- `docs/TODO.md` - Backlog and tasks

### Support

For questions or issues:
- Check existing documentation
- Review Git history for similar changes
- Contact Klaratech development team
