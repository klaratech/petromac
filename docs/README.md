# Petromac Website & Intranet

Welcome to the Petromac repository. This monorepo contains the public marketing website, internal intranet portal, and trade show kiosk application.

## Quick Start

```bash
# Clone and install
git clone https://github.com/Klaratech/petromac.git
cd petromac
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
# Open http://localhost:3000
```

## What's Inside

### Public Website (/)
Marketing site with product information, case studies, and contact form.

### Intranet (/intranet)
Protected portal with:
- **Athena Links** — Production and test environment access
- **Success Stories** — Filterable PDF library with preview, download, and email
- **Catalog** — Product catalog
- **Kiosk** — Trade show dashboard application

### Key Features

#### Success Stories Module
- Multi-select filters (area, country, WL Co, categories, devices)
- Live PDF preview with filtered results
- Download filtered PDFs
- Email PDFs via SMTP
- Routes:
  - `/intranet/success-stories` — Full page
  - `/intranet/kiosk/successstories-embed` — Kiosk embed

#### Technologies
- **Next.js 15** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **pdf-lib** for PDF manipulation
- **Nodemailer** for email delivery
- **D3.js** for data visualizations
- **Three.js** for 3D product models

## Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** — Setup, workflows, testing
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — System design, data flow
- **[REPO_STRUCTURE.md](./REPO_STRUCTURE.md)** — Directory layout, conventions
- **[TAILWIND_THEME.md](./TAILWIND_THEME.md)** — Design system, colors, tokens

## Environment Variables

Required for production:
```env
# Base URL
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Intranet Auth
INTRANET_USER=username
INTRANET_PASS=password

# SMTP (Success Stories email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CONTACT_FROM_EMAIL=your-email@gmail.com
CONTACT_TO_EMAIL=recipient@example.com

# Contact Form (Resend)
RESEND_API_KEY=your-resend-key
```

See `.env.example` for complete list.

## Deployment

The app is designed for Vercel:
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main

## Data Pipeline

Convert Excel data to JSON:
```bash
cd scripts/python
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python generate_json.py
```

Outputs: `public/data/operations_data.json`

## Contributing

1. Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
2. React components use PascalCase filenames
3. No raw hex colors — use Tailwind tokens
4. Keep secrets in `.env.local` (gitignored)

## Support

For questions or issues, contact the development team or open an issue on GitHub.

---

**Built with ❤️ by Klaratech for Petromac**
