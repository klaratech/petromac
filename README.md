# Petromac Website & Internal Kiosk

A Next.js-based application featuring a public-facing website for Petromac and a protected internal kiosk application for showcasing operations data, success stories, and product catalog.

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15.5+ (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4 with Petromac brand theme
- **Typography**: Inter (body), IBM Plex Sans (headings)
- **3D Visualization**: Three.js, React Three Fiber
- **Data Visualization**: D3.js
- **Data Processing**: Python 3.11+ (pandas, openpyxl)
- **API Services**: Next.js API Routes, FastAPI (Python)
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

> **📁 For detailed repository structure, see [REPO_STRUCTURE.md](REPO_STRUCTURE.md)**  
> **🎨 For brand theme specifications, see [docs/TAILWIND_THEME.md](docs/TAILWIND_THEME.md)**  
> **📝 For success stories management, see [docs/README-successstories.md](docs/README-successstories.md)**

## 🌐 Application Structure

### Public Website (/)

The public-facing website is accessible at the root URL and includes:

- **Homepage** (`/`) - Hero section, problem areas, product teaser
- **About** (`/about`) - Company information (stub)
- **Catalog** (`/catalog`) - Product catalog (stub)
- **Case Studies** (`/case-studies`) - Customer success stories (stub)
- **Contact** (`/contact`) - Contact form (stub)

### Intranet (/intranet/*)

**Protected by Basic Authentication** - requires credentials set in environment variables.

- **Intranet Homepage** (`/intranet`) - Two tiles:
  - **Athena** - Link to external Athena portal
  - **Kiosk** - Link to internal kiosk application
  
- **Kiosk Application** (`/intranet/kiosk/*`) - Interactive kiosk with:
  - Operations dashboard with global map visualization
  - Product catalog with 3D models
  - Success stories management
  - Data check tools

### Security Features

- **Basic Authentication**: All `/intranet/*` routes require username/password
- **SEO Protection**: `X-Robots-Tag: noindex, nofollow` headers on intranet routes
- **Environment-based**: Credentials configured via environment variables

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 20.x or higher
- **Python**: 3.11 or higher
- **pnpm/npm/yarn**: Package manager
- **Git**: Version control

### Local Development Setup

#### 1. Clone Repository

```bash
git clone https://github.com/Klaratech/petromac-kiosk.git
cd petromac-kiosk
```

#### 2. Install Node.js Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

#### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Intranet Authentication (REQUIRED for /intranet/* access)
INTRANET_USER=your-username
INTRANET_PASS=your-password

# Athena Portal URL (displayed on intranet homepage)
NEXT_PUBLIC_ATHENA_URL=https://your-athena-url.com

# Other variables as needed...
```

**Important**: Change the default credentials from `changeme` to secure values!

#### 4. Set Up Python Environment (for data processing)

```bash
cd scripts/python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

#### 5. Ensure Private Data Exists

Place your raw Excel file at:
```
data/private/raw/jobhistory.xlsx
```

This file is gitignored and will not be committed.

#### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
```

## 📊 Data Pipeline

### Overview

```
┌─────────────────────────────────────┐
│ Raw Excel (Private)                 │
│ data/private/raw/jobhistory.xlsx    │
└──────────────┬──────────────────────┘
               │
               │ Manual or GitHub Actions
               ▼
    ┌──────────────────────┐
    │  Python Script       │
    │  generate_json.py    │
    │                      │
    │  - Normalizes data   │
    │  - Validates records │
    │  - Sanitizes output  │
    │  - No PII/secrets    │
    └──────────┬───────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Sanitized JSON (Public)              │
│ public/data/operations_data.json     │
│ Served by Vercel CDN                 │
└──────────────────────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Next.js App         │
    │  D3.js Visualizations│
    └──────────────────────┘
```

### Running Data Processing Locally

```bash
cd scripts/python
source venv/bin/activate
python generate_json.py
```

The script will:
1. Read from `data/private/raw/jobhistory.xlsx`
2. Normalize country names, locations, and system names
3. Validate data quality
4. Output sanitized JSON to `public/data/operations_data.json`
5. Generate processing logs

See [`scripts/python/README.md`](scripts/python/README.md) for detailed documentation.

### Automated Processing (GitHub Actions)

The data processing pipeline runs automatically:

- **Trigger**: Manual dispatch or weekly schedule (Sunday 2 AM UTC)
- **Workflow**: `.github/workflows/data-build.yaml`
- **Output**: Commits sanitized JSON back to repository

To run manually:
1. Go to GitHub repository → **Actions** tab
2. Select **Data Build Pipeline**
3. Click **Run workflow**
4. Choose options and confirm

## 🌐 Deployment

### Vercel Deployment

#### Initial Setup

1. **Import Project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select the GitHub repository

2. **Configure Build Settings**
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Set Environment Variables**
   
   Navigate to Project Settings → Environment Variables:
   
   ```
   # Add production environment variables
   NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
   # Add other secrets as needed
   ```

#### Preview Deployments

- Every push to a branch creates a preview deployment
- Preview URL: `https://petromac-kiosk-<hash>.vercel.app`

#### Production Deployment

- Push to `main` branch triggers production deployment
- Production URL: `https://your-domain.vercel.app`

### Static Assets

All files in `public/` are served via Vercel's global CDN:
- `public/data/*.json` - Data files
- `public/images/*` - Images
- `public/videos/*` - Videos
- `public/models/*` - 3D models

## 🔐 Environment Variables & Secrets

### Required Environment Variables

#### Intranet Authentication

```env
INTRANET_USER=your-username          # Username for /intranet/* access
INTRANET_PASS=your-secure-password   # Password for /intranet/* access
```

#### Athena Portal Configuration

```env
NEXT_PUBLIC_ATHENA_URL=https://athena.example.com  # URL for Athena tile
```

### Development (.env.local)

```env
NODE_ENV=development
INTRANET_USER=dev-user
INTRANET_PASS=dev-password
NEXT_PUBLIC_ATHENA_URL=https://athena-dev.example.com
```

### Production (Vercel Dashboard)

Set in Vercel Project Settings → Environment Variables:

- `INTRANET_USER` - Production intranet username
- `INTRANET_PASS` - Production intranet password (use strong password!)
- `NEXT_PUBLIC_ATHENA_URL` - Production Athena portal URL
- `GITHUB_TOKEN` - For GitHub Actions data push (if used)
- Add other secrets as needed

### GitHub Actions Secrets

Set in GitHub Repository Settings → Secrets:

- `GITHUB_TOKEN` - Automatically provided by GitHub
- Add custom secrets as needed

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Structure

- **App Router** (`src/app/`) - Next.js 13+ App Router with server/client components
- **Components** (`src/components/`) - Reusable React components
- **Hooks** (`src/hooks/`) - Custom React hooks
- **Lib** (`lib/`) - Utility functions (moved from `src/utils/`)
- **Types** (`src/types/`) - TypeScript type definitions

### Import Aliases

TypeScript path aliases are configured in `tsconfig.json`:

```typescript
import { Component } from '@/components/Component'
import { useHook } from '@/hooks/useHook'
import { util } from '@/lib/util'
```

### Brand Theme

The public website uses Petromac's brand identity:

- **Colors**: Brand Blue (#1E4A9A), Slate neutrals
- **Typography**: IBM Plex Sans (headings), Inter (body)
- **Buttons**: Primary (brand), Secondary (slate-800)
- **Defined in**: `tailwind.config.ts`

See `docs/TAILWIND_THEME.md` for complete specifications and usage guidelines.

### Adding New Pages

#### Public Pages
```bash
# Create new public page (will use brand theme)
src/app/newpage/page.tsx
```

#### Intranet/Kiosk Pages
```bash
# Create new intranet page (protected by Basic Auth)
src/app/intranet/newpage/page.tsx

# Create new kiosk page (within intranet)
src/app/intranet/kiosk/newpage/page.tsx
```

### Adding API Routes

```bash
# Create API route
src/app/api/endpoint/route.ts
```

## 📝 Code Conventions

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: bug fix
docs: documentation changes
chore: maintenance tasks
refactor: code refactoring
style: formatting changes
test: add tests
```

### TypeScript

- Use strict mode
- Define types for all props and functions
- Avoid `any` type
- Use type inference where appropriate

### React

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Handle loading and error states

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and colors

## 🧪 Testing

```bash
# Run tests (when configured)
npm test

# Run tests in watch mode
npm test -- --watch
```

## 🔍 Troubleshooting

### Authentication Issues

**Problem**: Cannot access `/intranet/*` routes

**Solutions**:
1. Ensure `INTRANET_USER` and `INTRANET_PASS` are set in `.env.local`
2. Check browser console for 401/403 errors
3. Clear browser cache and cookies
4. Verify credentials match exactly (case-sensitive)

### Build Failures

1. Clear Next.js cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check for TypeScript errors: `npm run lint`
4. Ensure middleware.ts is in the project root (not in src/)

### Python Script Issues

See [`scripts/python/README.md`](scripts/python/README.md) for Python-specific troubleshooting.

### Deployment Issues

1. Check Vercel build logs
2. Verify environment variables are set
3. Ensure all dependencies are in `package.json`

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [D3.js Documentation](https://d3js.org)
- [Three.js Documentation](https://threejs.org/docs)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit with conventional commit message
5. Push and create a pull request

## 📄 License

Proprietary - Petromac/Klaratech

## 🆘 Support

For issues or questions:
- Create a GitHub issue
- Contact the development team

---

**Last Updated**: September 2025
**Maintainers**: Klaratech Development Team
