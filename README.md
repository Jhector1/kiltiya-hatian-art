# Haitian Digital Online Market

An immersive, interactive platform empowering Haitian artists to showcase, sell, and deliver both digital and print artwork to a global audience. Leveraging modern web technologies, this project combines a performant front-end, robust back-end, and seamless payment and delivery integrations to create a professional, user-friendly marketplace experience.

---

## Table of Contents

1. [Features](#features)
2. [Technology Stack](#technology-stack)
3. [Architecture & Folder Structure](#architecture--folder-structure)
4. [Installation & Setup](#installation--setup)
5. [Configuration](#configuration)
6. [Usage](#usage)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Contributing](#contributing)
10. [License](#license)
11. [Contact](#contact)

---

## Features

* **Digital & Print Variants**: Offer artworks in multiple formats (JPG, PNG, SVG, PDF) and customizable print options (size, material, framing).
* **Dynamic Pricing**: Real-time price calculation based on variant selections, dimensions, materials, frames, and licensing options.
* **Secure Checkout**: Stripe integration for one-time purchases, supporting guest and authenticated flows, with digital download links and ZIP bundling.
* **Media Management**: Cloudinary storage for high-performance image delivery, on-the-fly optimization, watermark overlays, and format conversions.
* **SVG & PNG Editors**: In-browser tools for users to customize stroke, fill, gradients, and transparency, with live previews and downloadable assets.
* **Responsive Design**: Mobile-first UI built with Tailwind CSS and Framer Motion for smooth animations and interactive elements.
* **User Accounts & Sessions**: NextAuth for OAuth and email/password authentication, session-based carts, and order histories.
* **Admin Dashboard**: CRUD operations for products, variants, and orders, with role-based access controls.
* **Analytics & Logging**: Integration with Prisma ORM and PostgreSQL for data modeling, plus structured logging for performance monitoring.

## Technology Stack

* **Framework**: Next.js (App Router, Server & Client Components)
* **Language**: TypeScript & React
* **Styling**: Tailwind CSS, CSS Modules
* **State Management**: React Context & React Query
* **Database**: PostgreSQL (hosted on Render/Heroku) via Prisma ORM
* **Storage**: Cloudinary for images and asset management
* **Payments**: Stripe API (Stripe Checkout + Webhooks)
* **Authentication**: NextAuth.js
* **Testing**: Jest & React Testing Library
* **Deployment**: Vercel / Render.com

## Architecture & Folder Structure

```bash
├── src/
│   ├── app/               # Next.js routes & Server Components
│   │   ├── api/            # API endpoints (Stripe, cart, downloads)
│   │   ├── store/          # Store pages (product listings, detail pages)
│   │   └── cart/           # Cart & checkout flows
│   ├── components/        # Reusable UI & business logic components
│   │   ├── SvgEditor.tsx   # SVG customization tool
│   │   └── PriceCalculator # Hook for dynamic pricing
│   ├── lib/               # Third‑party integrations (Stripe, Prisma client)
│   ├── contexts/          # React Context providers (Cart, Auth)
│   ├── hooks/             # Custom React hooks (usePriceCalculator)
│   └── styles/            # Global styles & Tailwind config
├── prisma/                # Prisma schema & migrations
├── public/                # Static assets & favicon
├── tests/                 # Test suites
├── .env.example           # Environment variables template
└── README.md              # Project overview (you’re here!)
```

## Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/haitian-digital-market.git
   cd haitian-digital-market
   ```
2. **Install dependencies**

   ```bash
   npm install
   ```
3. **Set up environment variables**

   * Copy `.env.example` to `.env.local` and fill in your keys:

     ```ini
     NEXTAUTH_SECRET=your_nextauth_secret
     DATABASE_URL=postgresql://user:pass@host:port/dbname
     CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
     STRIPE_SECRET_KEY=sk_test_...
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```
4. **Run database migrations**

   ```bash
   npx prisma migrate dev
   ```
5. **Start the development server**

   ```bash
   npm run dev
   ```

## Configuration

* **Prisma**: Adjust `prisma/schema.prisma` for additional models or relations.
* **Cloudinary**: Configure upload presets and transformation rules in your Cloudinary dashboard.
* **Stripe**: Define product prices and metadata in your Stripe dashboard to match variant IDs.

## Usage

* **Browse**: View collections on `/store` and individual products at `/store/[id]`.
* **Customize & Preview**: Use the built-in SVG/PNG editor on product detail pages to tweak colors, gradients, and transparency before purchase.
* **Cart & Checkout**: Add items to cart, review order details, and complete payment via Stripe.
* **Admin**: Access protected `/admin` routes for product and order management (requires `ADMIN` role).

## Testing

* **Unit & Integration**: Run Jest suites:

  ```bash
  npm test
  ```
* **End-to-End**: (Future) Playwright tests for critical user flows.

## Deployment

* **Vercel**: Connect the GitHub repo, set environment variables, and deploy via the Vercel dashboard.
* **Render**: Use the `render.yaml` for automated build & deploy.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m "feat: Add ..."`)
4. Push to your fork (`git push origin feature/YourFeature`)
5. Open a Pull Request

Please follow the [Contributing Guidelines](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

* **Project Maintainer**: Jean Hector ([youremail@example.com](mailto:youremail@example.com))
* **GitHub**: [https://github.com/your-org/haitian-digital-market](https://github.com/Jhector1/kiltiya-hatian-art)
* **Live Site**: [https://haitian-digital-market.com](https://ziledigital.com)

---

Thank you for supporting Haitian artists and contributing to our vibrant digital marketplace!