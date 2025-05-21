# Restaurant Application Documentation

This folder contains comprehensive documentation for the Restaurant Application.

## Contents

1. [Project Overview](./project-overview.md) - Overview of the project, tech stack, and setup instructions
2. [API Documentation](./api-documentation.md) - Details on all API endpoints
3. [Database Schema](./database-schema.md) - Database structure and relationships
4. [Component Documentation](./component-documentation.md) - UI component details
5. [Authentication & Authorization](./auth-documentation.md) - User roles and authentication flows
6. [Testing Instructions](./testing-instructions.md) - How to test the application
7. [Feature Documentation](./feature-documentation.md) - Major features documentation
8. [Deployment Guide](./deployment-guide.md) - How to deploy the application
9. [Troubleshooting Guide](./troubleshooting-guide.md) - Common issues and solutions
10. [Development Workflow](./development-workflow.md) - Development process and guidelines
11. [Development Checklist](./development-checklist.md) - Project development checklist
12. [Admin Action Points](./admin-action-points.md) - Priority tasks for admin feature development
13. [UploadThing Setup](./uploadthing-setup.md) - Integration guide for image uploads
14. [Lessons Learned](./lessons.md) - Development challenges and solutions

## Key Technical Information

1. **Next.js 15 Dynamic Routes** - Dynamic route parameters are Promise-based and must be handled correctly in both client and server components (see [Lessons Learned](./lessons.md)).
2. **React Performance** - Use useCallback for functions in useEffect dependencies to prevent unnecessary renders.
3. **Image Handling** - Always specify width and height when using Next.js Image components to avoid layout shifts.

## How to Use This Documentation

These documents are designed to provide a complete understanding of the application for developers, testers, and other stakeholders. They can be read in sequence to get a full picture of the application, or you can jump to specific sections as needed. 