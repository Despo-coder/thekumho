# Project Overview

## Introduction

The Restaurant Application is a full-featured web platform for restaurants to manage their online presence, menu, reservations, and orders. It provides a seamless experience for customers to browse the menu, make reservations, place orders, and leave reviews, while giving restaurant staff the tools they need to manage all aspects of their business.

## Tech Stack

This application is built using modern web technologies:

- **Frontend**:
  - Next.js 15.3 (React 19)
  - TypeScript
  - TailwindCSS
  - shadcn/ui components
  - Framer Motion for animations

- **Backend**:
  - Next.js API routes
  - Prisma ORM
  - PostgreSQL database
  - NextAuth.js for authentication

- **Development Tools**:
  - ESLint & TypeScript for code quality
  - npm for package management

## Key Features

- **User Authentication**: Secure login and registration system with role-based access
- **Menu Management**: Digital menu with categories, dietary preferences, and images
- **Reservation System**: Table booking system with availability checking
- **Order System**: Online food ordering with checkout and payment processing
- **Review System**: Customer reviews and ratings for menu items
- **Admin Dashboard**: Comprehensive admin interface for restaurant staff

## Project Setup

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- PostgreSQL database

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### Installation Steps

1. Clone the repository
   ```
   git clone <repository-url>
   cd restaurant
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up the database
   ```
   npx prisma migrate dev
   ```

4. Seed the database with initial data
   ```
   npm run prisma:seed
   ```

5. Start the development server
   ```
   npm run dev
   ```

6. Access the application at `http://localhost:3000`

## Test Accounts

After seeding, the following accounts are available for testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@restaurant.com | Admin123! |
| Chef | chef@restaurant.com | Admin123! |
| Waiter | waiter@restaurant.com | Admin123! |
| Customer | customer@example.com | User123! |

## Project Structure

```
restaurant/
├── app/                 # Next.js app directory
│   ├── api/             # API routes
│   ├── admin/           # Admin dashboard
│   ├── menu/            # Menu pages
│   ├── orders/          # Order pages
│   └── reservation/     # Reservation pages
├── components/          # React components
│   ├── ui/              # UI components
│   └── ...              # Feature components
├── lib/                 # Utility libraries
├── prisma/              # Prisma schema and migrations
│   ├── schema.prisma    # Database schema
│   └── seed.js          # Database seeding script
├── public/              # Static assets
├── types/               # TypeScript type definitions
└── utils/               # Helper functions
```

## Roadmap

See the [Development Checklist](./development-checklist.md) for the detailed implementation roadmap. 