# Repository Reorganization Plan

## Current Structure Analysis

### Existing Layout
```
/src/
  /app/           - Next.js App Router pages & API routes
  /components/    - UI components
  /hooks/         - React hooks
  /types/         - TypeScript type definitions
  /data/          - Static data files (region_data.json, deviceSpecs.ts, etc.)
  /config/        - Config files (featuredSystems.ts)
  /constants/     - Constants (app.ts, mapConstants.ts, etc.)
  /utils/         - Utility functions
/public/
  /data/          - JSON data files served publicly
  /images/        - Static images
  /videos/        - Video files
  /models/        - 3D models (.glb)
/scripts/        - Python data processing scripts
```

### Dependencies Status
**package.json:**
- Next.js: 15.5.4 (latest stable ✓)
- React: 19.0.0 (latest stable ✓)
- Most dependencies are recent/latest

**requirements.txt:**
- pandas: 2.2.2 (check for updates)
- openpyxl: 3.1.2 (check for updates)
- Other Python packages

## Target Structure Mapping

### File Moves Required

1. **Keep as-is (no moves needed):**
   - `/app/` - Already correct
   - `/public/` - Already correct
   - `/components/` - Already correct (at root level per target)
   - `/hooks/` - Already correct
   
2. **Create new directories:**
   - `/.github/workflows/` - For GitHub Actions
   - `/data/private/raw/` - For private Excel files (gitignored)
   - `/data/private/intermediate/` - For temp outputs
   - `/data/schemas/` - For JSON schemas (optional)
   - `/scripts/python/` - Move Python scripts here
   - `/scripts/node/` - For Node.js scripts (if any)
   - `/config/` - Consolidate all config files
   - `/lib/` - Move from `/src/utils/` for consistency
   - `/styles/` - If global styles exist

3. **Files to move:**
   - `/src/utils/*` → `/lib/*`
   - `/src/config/*` → `/config/*`
   - `/src/constants/*` → `/lib/constants/*` or keep as `/constants/`
   - `/src/data/*` → Keep in `/src/data/` (static TS/JS data modules)
   - `/scripts/*.py` → `/scripts/python/`
   - `/scripts/*.js` → `/scripts/node/`
   - `scripts/jobhistory.xlsx` → `/data/private/raw/` (gitignore)

4. **Import path updates needed:**
   - Any imports from `@/utils/` → `@/lib/`
   - Any imports from `@/config/` → `@/config/`

## Action Items

### Phase 1: Directory Structure
- [x] Analyze current structure
- [ ] Create `.github/workflows/` directory
- [ ] Create `/data/private/raw/` directory
- [ ] Create `/data/private/intermediate/` directory
- [ ] Create `/scripts/python/` directory
- [ ] Create `/scripts/node/` directory (if needed)
- [ ] Create `/lib/` directory

### Phase 2: File Moves
- [ ] Move `/src/utils/*` to `/lib/`
- [ ] Move Python scripts to `/scripts/python/`
- [ ] Move Node scripts to `/scripts/node/`
- [ ] Move `jobhistory.xlsx` to `/data/private/raw/`
- [ ] Update `.gitignore` for `/data/private/`

### Phase 3: Import Updates
- [ ] Search and update all imports from `@/utils/` to `@/lib/`
- [ ] Update script references in configs
- [ ] Update path references in Python scripts

### Phase 4: Configuration
- [ ] Update/create `tsconfig.json` path aliases
- [ ] Create/update `vercel.json` (minimal)
- [ ] Update `.gitignore`
- [ ] Create `.env.example`
- [ ] Create `.editorconfig`

### Phase 5: Dependencies
- [ ] Update `package.json` to latest stable versions
- [ ] Update `scripts/python/requirements.txt` to latest stable
- [ ] Document any updates skipped in TODO.md

### Phase 6: GitHub Actions
- [ ] Create `.github/workflows/data-build.yaml`
- [ ] Configure workflow triggers (dispatch, cron)
- [ ] Set up Python environment
- [ ] Configure output commit or artifact upload

### Phase 7: Documentation
- [ ] Create comprehensive `README.md`
- [ ] Create `TODO.md`
- [ ] Create `/scripts/python/README.md`

### Phase 8: Validation
- [ ] Run `npm install`
- [ ] Run `npm run build`
- [ ] Run `npm run dev`
- [ ] Test data processing script locally
- [ ] Validate GitHub Actions workflow

## Import Patterns to Update

### Current Patterns
```typescript
import { something } from '@/utils/dataValidation';
import { something } from '@/utils/mapUtils';
import { APP_NAME } from '@/constants/app';
```

### New Patterns
```typescript
import { something } from '@/lib/dataValidation';
import { something } from '@/lib/mapUtils';
import { APP_NAME } from '@/constants/app'; // OR @/lib/constants/app
```

## Risk Assessment

### Low Risk
- Moving utility files to `/lib/`
- Creating new directories
- Updating gitignore
- Creating documentation

### Medium Risk
- Updating all import statements (many files)
- Moving config files
- Dependency updates

### High Risk (Not Doing)
- Refactoring app logic (explicitly forbidden)
- Major Next.js config changes
- Breaking runtime behavior

## Notes
- This is a structure-only reorganization
- NO business logic changes
- NO UI refactoring
- Import paths updated automatically via search/replace
- All moves tracked for reversibility
