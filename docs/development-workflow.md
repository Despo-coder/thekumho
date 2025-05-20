# Development Workflow

This document outlines the development workflow and processes for the Restaurant Application.

## Development Environment Setup

### Prerequisites

1. **Node.js**: v18.0.0 or higher
2. **npm**: v9.0.0 or higher
3. **PostgreSQL**: v14 or higher
4. **Git**: For version control

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd restaurant
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Create a `.env` file in the project root
   - Add required environment variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_db"
   NEXTAUTH_SECRET="your-development-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Initialize the database**:
   ```bash
   # Create the database
   createdb restaurant_db
   
   # Push the schema
   npx prisma db push
   
   # Generate Prisma client
   npx prisma generate
   
   # Seed the database
   npm run prisma:seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   - Open [http://localhost:3000](http://localhost:3000) in your browser

## Git Workflow

We follow a feature branch workflow:

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Individual feature branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Emergency fixes for production

### Creating a New Feature

1. **Start from the latest develop branch**:
   ```bash
   git checkout develop
   git pull
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/feature-name
   ```

3. **Make changes and commit regularly**:
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   ```

4. **Push your branch**:
   ```bash
   git push -u origin feature/feature-name
   ```

5. **Create a pull request**:
   - Go to the repository on GitHub/GitLab/etc.
   - Create a new pull request from your feature branch to `develop`
   - Fill out the pull request template
   - Request reviews from team members

### Code Review Process

1. **Reviewers should check for**:
   - Code quality and adherence to standards
   - Test coverage
   - Performance considerations
   - Security implications
   - Documentation

2. **After approval**:
   - Merge the pull request
   - Delete the feature branch

## Database Management

### Schema Changes

1. **Update the Prisma schema**:
   - Edit `prisma/schema.prisma` with your changes

2. **Apply changes to development database**:
   ```bash
   # For development
   npx prisma db push
   
   # For production-ready migrations
   npx prisma migrate dev --name descriptive_migration_name
   ```

3. **Update the Prisma client**:
   ```bash
   npx prisma generate
   ```

### Seeding Data

1. **Edit the seed file**:
   - Modify `prisma/seed.js` with the seed data

2. **Run the seed command**:
   ```bash
   npm run prisma:seed
   ```

### Database Inspection

Use Prisma Studio to inspect and modify the database:

```bash
npx prisma studio
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific tests
npm test -- -t "authentication"
```

### Writing Tests

1. **Unit tests**:
   - Place tests next to the code they test
   - Name them with `.test.ts` or `.test.tsx` suffix
   - Focus on testing isolated functionality

2. **Integration tests**:
   - Place in `__tests__` directory
   - Test interactions between components or services
   - Mock external dependencies as needed

3. **End-to-end tests**:
   - Create Cypress tests in `cypress/e2e` directory
   - Test complete user flows

## Common Development Tasks

### Adding a New API Endpoint

1. **Create the route handler**:
   - Create a file in `app/api/[resource]/route.ts`
   - Implement the appropriate HTTP methods

   ```tsx
   // app/api/resource/route.ts
   import { prisma } from "@/lib/prisma";
   import { getServerSession } from "next-auth";
   import { authOptions } from "@/app/api/auth/auth";
   
   export async function GET(request: Request) {
     const session = await getServerSession(authOptions);
     
     if (!session) {
       return Response.json({ message: "Unauthorized" }, { status: 401 });
     }
     
     try {
       const data = await prisma.resource.findMany();
       return Response.json(data);
     } catch (error) {
       console.error("API error:", error);
       return Response.json(
         { message: "An error occurred" },
         { status: 500 }
       );
     }
   }
   
   export async function POST(request: Request) {
     const session = await getServerSession(authOptions);
     
     if (!session) {
       return Response.json({ message: "Unauthorized" }, { status: 401 });
     }
     
     try {
       const json = await request.json();
       const data = await prisma.resource.create({
         data: json,
       });
       return Response.json(data, { status: 201 });
     } catch (error) {
       console.error("API error:", error);
       return Response.json(
         { message: "An error occurred" },
         { status: 500 }
       );
     }
   }
   ```

2. **Document the API endpoint**:
   - Update the API documentation
   - Include request/response examples

### Creating a New UI Component

1. **Plan the component**:
   - Determine props and behavior
   - Consider accessibility requirements
   - Plan for responsiveness

2. **Implement the component**:
   - Create a new file in `components/` directory
   - Use TypeScript for type safety
   - Follow existing component patterns

   ```tsx
   // components/feature-component.tsx
   'use client';
   
   import { useState } from 'react';
   import { Button } from "@/components/ui/button";
   
   interface FeatureComponentProps {
     title: string;
     onAction: () => void;
   }
   
   export default function FeatureComponent({
     title,
     onAction,
   }: FeatureComponentProps) {
     const [isActive, setIsActive] = useState(false);
     
     const handleClick = () => {
       setIsActive(true);
       onAction();
     };
     
     return (
       <div className="feature-component">
         <h3 className="text-lg font-medium">{title}</h3>
         <Button 
           onClick={handleClick}
           variant={isActive ? "default" : "outline"}
         >
           {isActive ? "Active" : "Activate"}
         </Button>
       </div>
     );
   }
   ```

3. **Use the component**:
   - Import and use in page or other components
   - Pass required props

### Adding a New Page

1. **Create the page file**:
   - Add a file in the appropriate directory under `app/`
   - Use `page.tsx` filename for route pages

   ```tsx
   // app/feature/page.tsx
   import { prisma } from "@/lib/prisma";
   
   export default async function FeaturePage() {
     const data = await prisma.someModel.findMany();
     
     return (
       <div className="container mx-auto py-12">
         <h1 className="text-3xl font-bold mb-6">Feature Page</h1>
         
         <div className="grid gap-4">
           {data.map((item) => (
             <div key={item.id} className="p-4 border rounded">
               {item.name}
             </div>
           ))}
         </div>
       </div>
     );
   }
   ```

2. **Add to navigation**:
   - Update navbar or other navigation components
   - Consider access control requirements

## Code Standards

### TypeScript Guidelines

- Use TypeScript for all files
- Define interfaces for props and data structures
- Avoid using `any` type
- Use proper type imports and exports

### React Best Practices

- Use functional components with hooks
- Separate concerns (UI, data fetching, state management)
- Follow Next.js patterns for data fetching
- Use client components only when necessary

### Code Formatting

We use ESLint and Prettier for code formatting:

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

Configuration is in:
- `.eslintrc.js`
- `.prettierrc`

### Naming Conventions

- **Files**:
  - React components: `PascalCase.tsx`
  - Utilities: `camelCase.ts`
  - Constants: `CONSTANT_CASE.ts`
  - Pages: `page.tsx`
  - API routes: `route.ts`

- **Variables/Functions**:
  - Use camelCase
  - Be descriptive
  - Boolean variables should have "is", "has", or "should" prefix

- **Components**:
  - Use PascalCase
  - Name should reflect purpose

## Performance Considerations

### Optimizing React Components

- Use memoization (useMemo, useCallback) for expensive operations
- Avoid unnecessary re-renders
- Split large components into smaller ones
- Use React DevTools to identify performance issues

### Image Optimization

- Use Next.js Image component for automatic optimization
- Specify appropriate sizes and loading strategies
- Use WebP format when possible

### Data Fetching Strategies

- Use SSR for initial page load data
- Consider SWR or React Query for client-side data fetching
- Implement pagination for large datasets
- Cache data where appropriate

## Deployment Process

### Staging Deployment

1. Merge feature branches into `develop`
2. Automatic deployment to staging environment
3. Run automated tests in staging
4. Perform manual QA

### Production Deployment

1. Create a pull request from `develop` to `main`
2. Complete code review
3. Run automated tests
4. Merge to `main`
5. Automatic deployment to production
6. Verify deployment

## Documentation Updates

When making significant changes:

1. Update the relevant documentation file in `docs/`
2. Include:
   - What changed
   - Why it changed
   - How to use the new feature
   - Any breaking changes

## Getting Help

- Check existing documentation first
- Ask in the team chat/forum
- For complex issues, schedule a discussion
- Document solutions for future reference 