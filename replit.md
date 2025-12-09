# CARA E-Commerce Platform

## Overview

CARA is a B2B e-commerce platform for premium medical-grade hyaluronic acid products (dermal fillers) targeting healthcare professionals in Portugal. The platform features a professional approval workflow where medical professionals must be verified before accessing the product catalog and making purchases. The system includes a complete admin panel for managing user approvals, orders, products, and customers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens, supporting light/dark themes
- **Forms**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful JSON APIs under `/api/*` prefix
- **Authentication**: Replit OpenID Connect (OIDC) authentication with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL via connect-pg-simple

### Data Layer
- **Database**: PostgreSQL (provisioned via Replit)
- **ORM**: Drizzle ORM with Zod schema validation (drizzle-zod)
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization

### Key Design Patterns
- **Monorepo Structure**: Client code in `client/`, server in `server/`, shared types in `shared/`
- **Path Aliases**: `@/*` maps to client source, `@shared/*` maps to shared code
- **User Approval System**: Three-state workflow (pending → approved/rejected) for B2B access control
- **Role-Based Access**: Customer and admin roles with middleware guards

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds static assets to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Key Dependencies Bundled**: Database drivers, auth libraries, and API utilities are bundled to reduce cold start time

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Schema Tables**: users, products, orders, order_items, cart_items, sessions

### Authentication
- **Replit Auth**: OpenID Connect integration via `ISSUER_URL` and `REPL_ID`
- **Session Secret**: Requires `SESSION_SECRET` environment variable

### Third-Party Services (configured but usage varies)
- **Stripe**: Payment processing integration (in dependencies)
- **Nodemailer**: Email notifications for order confirmations and approvals
- **OpenAI/Google AI**: AI integrations available in dependencies

### UI/UX Dependencies
- **Radix UI**: Accessible component primitives (dialog, dropdown, toast, etc.)
- **Lucide React**: Icon library
- **Framer Motion**: Animation library for landing page
- **Embla Carousel**: Product image carousels
- **date-fns**: Date formatting and manipulation

### Development Tools
- **TypeScript**: Strict mode enabled
- **Drizzle Kit**: Database migration tooling
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner