# TODO & Project Backlog

This document tracks ongoing tasks, future enhancements, and decisions to be made for the Petromac Kiosk project.

## 🚧 Immediate / High Priority

### Public/Intranet Split (NEW - Sept 2025)
- [ ] Add hero image to `/public/images/hero.jpg` for homepage
- [ ] Flesh out public About page with company information
- [ ] Complete public Catalog page with product listings
- [ ] Build out Case Studies page with customer stories
- [ ] Create Contact page with form functionality
- [ ] Test Basic Auth middleware for intranet protection
- [ ] Replace basic auth with NextAuth/OAuth (role-based access)
- [ ] Update all internal links in kiosk app to use `/intranet/kiosk/*` paths
- [ ] Verify all API routes work from `/intranet/kiosk/api/*`
- [ ] Test Athena portal URL configuration and tile link

### Data & Infrastructure
- [ ] Add JSON schema validation for sanitized outputs in `data/schemas/`
- [ ] Add unit tests for `scripts/python/generate_json.py`
- [ ] Test GitHub Actions workflow with actual data
- [ ] Document process for rotating GitHub tokens/credentials
- [ ] Add data quality checks and alerting for GitHub Actions failures

### Code Quality
- [ ] Add CI workflow for linting and type-checking
- [ ] Set up Jest for unit testing React components
- [ ] Add Playwright or Cypress for E2E testing
- [ ] Configure pre-commit hooks (husky + lint-staged)
- [ ] Add code coverage reporting

### Documentation
- [ ] Add API documentation for Next.js API routes
- [ ] Create deployment runbook for production issues
- [ ] Document kiosk hardware requirements and setup
- [ ] Add troubleshooting guide for common issues

## 📋 Medium Priority

### Features
- [ ] Add offline mode for kiosk (PWA enhancements)
- [ ] Implement analytics tracking (privacy-respecting)
- [ ] Add admin dashboard for content management
- [ ] Create export functionality for filtered data
- [ ] Add search functionality across all pages

### Performance
- [ ] Optimize 3D model loading (lazy loading, LOD)
- [ ] Implement image optimization pipeline
- [ ] Add service worker caching strategies
- [ ] Profile and optimize D3.js visualizations
- [ ] Reduce bundle size (code splitting analysis)

### Data Management
- [ ] Evaluate moving private data to Vercel KV or S3
- [ ] Consider adding PostgreSQL for structured queries
- [ ] Implement data versioning strategy
- [ ] Add data backup and recovery procedures
- [ ] Create data retention policies

### Security
- [ ] Add rate limiting to API routes
- [ ] Implement CORS policies for production
- [ ] Add CSP (Content Security Policy) headers
- [ ] Audit dependencies for vulnerabilities
- [ ] Add security headers (Vercel config)
- [ ] Replace Basic Auth with proper authentication (NextAuth/OAuth)
- [ ] Add audit logs for intranet access
- [ ] Implement session management for intranet users
- [ ] Add 2FA for intranet access
- [ ] Create role-based access control (RBAC) system

## 🔮 Future / Low Priority

### Public Website Enhancements
- [ ] Add SEO optimization (meta tags, structured data)
- [ ] Create blog/news section
- [ ] Add customer testimonials section
- [ ] Build interactive product demos
- [ ] Add video content to homepage
- [ ] Create resource/documentation center
- [ ] Add newsletter signup functionality

### Shared UI Components
- [ ] Centralize shared UI between public and intranet in `/components/shared`
- [ ] Create design system documentation
- [ ] Build component library with Storybook
- [ ] Add animation library for page transitions

### Enhancements
- [ ] Add multi-language support (i18n)
- [ ] Create mobile-responsive version
- [ ] Add dark mode theme
- [ ] Implement accessibility improvements (WCAG 2.1 AA)
- [ ] Add keyboard navigation for all interactions

### Integration
- [ ] Connect to CRM system for lead capture
- [ ] Integrate with marketing automation platform
- [ ] Add email notification system
- [ ] Create Slack/Teams integration for alerts
- [ ] Build REST API for third-party integrations

### Data Pipeline
- [ ] Add incremental data updates (delta processing)
- [ ] Implement real-time data sync
- [ ] Create data validation dashboard
- [ ] Add automated anomaly detection
- [ ] Build data quality metrics dashboard

### DevOps
- [ ] Set up staging environment
- [ ] Add blue-green deployment strategy
- [ ] Implement feature flags
- [ ] Create disaster recovery plan
- [ ] Add monitoring and alerting (Sentry, Datadog, etc.)

## 🐛 Known Issues

### Minor
- [ ] Console warnings in production build (see build output)
- [ ] Some ESLint warnings to address
- [ ] Success stories modal ARIA attributes incomplete

### To Investigate
- [ ] Occasional 3D model loading delays
- [ ] Map rendering performance on older devices
- [ ] PDF generation timeout for large filters

## 💡 Ideas & Considerations

### Architecture
- Consider moving to monorepo structure (Turborepo/Nx)
- Evaluate GraphQL for API layer
- Consider using tRPC for type-safe APIs
- Evaluate Prisma for database ORM (if adding database)

### Dependencies
- Monitor Next.js 15 stable release and upgrade path
- Watch for Tailwind CSS 4 stable release
- Keep React 19 for latest features
- Consider migrating from next-pwa to native PWA APIs

### Data Processing
- Evaluate Dask for larger dataset processing
- Consider Apache Airflow for complex data pipelines
- Look into dbt for data transformations
- Evaluate Parquet format for data storage

## 📝 Decision Log

### Decided
- ✅ Use Vercel for hosting (simplicity, CDN, preview deployments)
- ✅ Python for data processing (pandas ecosystem)
- ✅ Next.js App Router (latest approach, better DX)
- ✅ Tailwind CSS v4 (utility-first, performance)
- ✅ GitHub Actions for CI/CD (free, integrated)

### Under Consideration
- 🤔 Add database layer (PostgreSQL vs. Vercel KV vs. Firebase)
- 🤔 Implement caching strategy (Redis, Vercel KV)
- 🤔 Use TypeScript strict mode everywhere
- 🤔 Add Storybook for component development
- 🤔 Implement micro-frontends architecture

### Rejected
- ❌ Server-side rendering for all pages (unnecessary for kiosk)
- ❌ Complex state management library (React Context sufficient)
- ❌ Custom webpack config (Next.js defaults work well)

## 🔄 Maintenance Schedule

### Weekly
- Review GitHub Actions logs
- Check for dependency updates
- Monitor error rates in production
- Review TODO items and prioritize

### Monthly
- Update dependencies (patch versions)
- Review and rotate credentials
- Backup critical data
- Performance audit

### Quarterly
- Major dependency updates
- Security audit
- Architecture review
- Capacity planning

## 📌 Notes from Reorganization (Sept 2025)

### Phase 1: File Structure (Completed)
- ✅ Moved `/src/utils/` → `/lib/`
- ✅ Moved Python scripts to `/scripts/python/`
- ✅ Moved Node scripts to `/scripts/node/`
- ✅ Created `/data/private/` for raw files
- ✅ Updated all import paths
- ✅ Created GitHub Actions workflow
- ✅ Added comprehensive documentation
- ✅ Updated Python dependencies to latest stable
- ✅ Added `.env.example`, `.editorconfig`

### Phase 2: Public/Intranet Split (Completed)
- ✅ Moved existing app to `/app/intranet/kiosk/*`
- ✅ Created new public homepage at `/app/page.tsx`
- ✅ Added public components (`Hero`, `ProblemSection`, `ProductTeaser`, `Footer`)
- ✅ Created intranet homepage with Athena + Kiosk tiles
- ✅ Added stub pages (`/about`, `/catalog`, `/case-studies`, `/contact`)
- ✅ Implemented Basic Auth middleware for `/intranet/*`
- ✅ Updated `.env.example` with `INTRANET_USER`, `INTRANET_PASS`, `NEXT_PUBLIC_ATHENA_URL`
- ✅ Updated README.md with new structure documentation
- ✅ Fixed kiosk navigation paths to use `/intranet/kiosk/*`

### Deferred Updates
- Basic auth needs to be replaced with proper OAuth/NextAuth (future enhancement)
- Public pages are stubs and need content
- Hero image needs to be added

### Follow-up Items
- [ ] Test build process with new structure
- [ ] Verify all routes work correctly
- [ ] Test Basic Auth middleware locally and on Vercel
- [ ] Add actual content to public stub pages
- [ ] Create hero image for public homepage
- [ ] Test data pipeline still works with new structure
- [ ] Update navigation in kiosk to use new paths
- [ ] Confirm Vercel deployment works with middleware
- [ ] Set production environment variables for auth
- [ ] Test GitHub Actions workflow with new structure

## 🎯 Sprint Planning

### Current Sprint
- Focus: Public/Intranet Split Validation
- Duration: 1 week
- Goals:
  - [ ] Test build process with new structure
  - [ ] Verify all intranet routes work correctly
  - [ ] Test Basic Auth middleware
  - [ ] Validate public homepage displays correctly
  - [ ] Confirm API routes work from new location
  - [ ] Test deployment to Vercel

### Next Sprint
- Focus: Content Development
- Goals:
  - [ ] Create public page content (About, Catalog, Case Studies, Contact)
  - [ ] Design and add hero image
  - [ ] Optimize public site for SEO
  - [ ] Plan OAuth/NextAuth migration

---

**Last Updated**: September 2025  
**Maintained by**: Development Team

_This is a living document. Update regularly and archive completed items._
