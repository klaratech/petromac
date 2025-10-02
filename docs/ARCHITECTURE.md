# Architecture

The Petromac platform combines a **public-facing website**, a **protected intranet portal**, and supporting **data processing pipelines**.

## Components

### Public Website
- Built with **Next.js 15.5+** (App Router) and **React 19**
- Styled with **Tailwind CSS 4** using Petromac brand theme
- Pages: Home, About, Catalog, Case Studies, Success Stories, Contact
- Flipbooks for **Catalog** and **Success Stories** provide interactive PDF viewing

### Intranet Portal
- Protected with **Basic Authentication**
- Homepage with tiles:
  - Athena (external portal)
  - Kiosk (internal dashboard app)
  - Catalog (flipbook)
  - Success Stories (flipbook + filters, reusing shared components)
- Kiosk app includes:
  - Operations dashboard with map visualization (D3.js)
  - Product lines explorer
  - Data validation tools

### Flipbook Module
- Replaces the old PDF viewer/builder modals
- Source PDFs:
  - `public/data/product-catalog.pdf`
  - `public/data/successstories.pdf`
- Converted into images with Python (`pdf_to_images.py` using pdf2image + pillow)
- Interactive flipbooks built with **page-flip**
- Routes:
  - `/catalog/flipbook`
  - `/success-stories/flipbook`

### Data Pipeline
- Python scripts process Excel data into JSON
- Stored in `public/data/operations_data.json` for visualization in kiosk

### Deployment
- Hosted on **Vercel**
- Static assets delivered via Vercel CDN
- Flipbooks generated automatically by **GitHub Actions** workflow `.github/workflows/pdf-flipbook-build.yml`
- Operations data pipeline also automated via GitHub Actions

