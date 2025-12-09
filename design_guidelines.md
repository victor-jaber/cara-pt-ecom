# CARA E-Commerce Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based (Premium Medical E-commerce + Modern SaaS)  
**Primary Inspirations:** Stripe's clean professionalism, Apple's minimalism, pharmaceutical-grade credibility  
**Key Principle:** Clinical precision meets sophisticated commerce - balancing medical authority with seamless user experience

---

## Core Design Elements

### A. Typography System

**Primary Font:** Inter or DM Sans (Google Fonts CDN)  
**Secondary Font:** System UI for data-heavy interfaces  

**Hierarchy:**
- Hero Headings: 48-64px, font-weight 700, tracking tight (-0.02em)
- Section Headings: 32-40px, font-weight 600
- Product Titles: 24-28px, font-weight 600
- Body Text: 16-18px, font-weight 400, line-height 1.6
- Technical Specs: 14-15px, font-weight 500, tabular numbers
- UI Labels: 13-14px, font-weight 500, uppercase tracking (0.05em)

### B. Layout System

**Spacing Units:** Tailwind scale limited to 2, 4, 6, 8, 12, 16, 20, 24, 32  
**Container:** max-w-7xl for main content, max-w-6xl for text-heavy sections  
**Grid System:** 
- Product grids: 4 columns desktop (lg:grid-cols-4), 2 tablet (md:grid-cols-2), 1 mobile
- Admin tables: Full-width responsive with horizontal scroll
- Forms: Single column max-w-md for focused completion

**Vertical Rhythm:** py-16 to py-24 for sections (desktop), py-12 mobile

---

## Component Library

### Navigation
- **Public Header:** Logo left, minimal navigation center, "Solicitar Acesso" CTA right
- **Authenticated Header:** Logo, Product Categories, Search, Cart icon, Account dropdown
- **Admin Navigation:** Sidebar with collapsible sections (Pedidos, Clientes, Aprovações, Produtos)

### Product Components
- **Product Card:** Image (1:1 ratio), product name, key specs preview, "Ver Detalhes" button
- **Product Detail:** Large product image, technical specifications table, application zones diagram, registration badges (INFARMED), quantity selector, "Adicionar ao Carrinho" CTA
- **Comparison Table:** Side-by-side specs for SOFT/MILD/HARD/ULTRA with particle size, injection depth, needle gauge

### Access Control UI
- **Registration Form:** Multi-step wizard (3 steps: Personal Info → Professional Credentials → Document Upload)
- **Approval Pending State:** Full-page message with status indicator, estimated review time
- **Restricted Content Overlay:** Blurred product grid with "Conta Pendente de Aprovação" message

### Admin Dashboard
- **Approval Queue:** Card-based layout with professional details, document preview, Approve/Reject buttons
- **Order Management:** Table with filters (status, date range), expandable rows for order details
- **Client List:** Searchable table with status badges (Aprovado, Pendente, Rejeitado)

### Forms & Inputs
- **Text Inputs:** Border design with focus ring, floating labels
- **File Upload:** Drag-and-drop zone with preview thumbnails
- **Selects:** Custom styled dropdowns with search capability
- **Status Badges:** Rounded-full pills with subtle backgrounds (aprovado, pendente, rejeitado)

---

## Page Structures

### Landing Page (Public)
1. **Hero Section:** Full-width image of professional medical setting, headline "Ácido Hialurónico Premium para Profissionais Médicos", CTA "Solicitar Acesso"
2. **Product Showcase:** 4-column grid of CARA variants with hover effects
3. **Technical Advantages:** 3-column grid (Pureza, Segurança, Tecnologia) with icons
4. **Certifications:** INFARMED registration, KGMP, ISO badges horizontal display
5. **Professional Access CTA:** Centered section explaining approval process

### Product Catalog (Authenticated)
- Filter sidebar: By type, application zone, particle size
- 4-column product grid with detailed cards
- Quick-add to cart functionality

### Admin Panel
- **Dashboard:** Metrics cards (Pedidos Pendentes, Novos Registos, Vendas do Mês) + recent activity feed
- **Approval Interface:** Two-column layout (applicant details left, documents preview right)
- **Order Management:** Full-width table with status workflow visualization

---

## Images

### Required Images
1. **Hero Image:** Professional medical practitioner in clinical setting with CARA product (blurred background with focused product detail)
2. **Product Images:** High-resolution photos of each CARA variant (SOFT, MILD, HARD, ULTRA) on white background
3. **Application Zone Diagrams:** Medical illustrations showing injection areas for each product type
4. **Trust Badges:** INFARMED logo, GENOSS laboratory logo, certification seals
5. **Admin Placeholder:** Generic avatar for users without photos

---

## Accessibility & Quality Standards

- Minimum touch target: 44x44px for all interactive elements
- Form validation with inline error messages and success states
- Loading states for all async operations (skeleton screens for product grids)
- Empty states with helpful guidance (e.g., "Nenhum pedido pendente")
- Responsive tables with horizontal scroll on mobile
- ARIA labels for icon-only buttons
- Keyboard navigation support throughout admin panel

---

## Animation Guidelines

**Use sparingly:**
- Micro-interactions: Button hover states (subtle scale/opacity)
- Page transitions: Fade-in for content sections (300ms ease-out)
- Form validation: Shake animation for errors (one-time, 400ms)
- Admin notifications: Slide-in toast messages (bottom-right, 200ms)

**Avoid:** Parallax scrolling, excessive scroll-triggered animations, auto-playing carousels