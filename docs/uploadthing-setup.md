# UploadThing Setup for Restaurant App

UploadThing has been integrated to enable image uploads for menu items. This implementation allows admins and managers to upload images directly from the menu item creation/edit forms.

## Implementation Files

- **File Router**: `app/api/uploadthing/core.ts` - Defines upload endpoints and permissions
- **API Route Handler**: `app/api/uploadthing/route.ts` - Handles HTTP requests for uploads
- **Component Utilities**: `lib/uploadthing.ts` - Re-exports components with proper typing
- **SSR Plugin**: Added to `app/layout.tsx` for improved performance

## Environment Variables

Make sure the following environment variable is set in your `.env.local` file:

```
UPLOADTHING_SECRET=your_secret_key_here
```

## Usage

The upload functionality is available in the menu item creation form. The component supports:

- Drag and drop uploads
- File selection dialog
- Preview of uploaded images
- Ability to remove uploaded images
- Upload progress indicators

## Security

The implementation includes security checks to ensure only authenticated admin and manager users can upload files. The server-side middleware in the file router validates the session and user role before allowing uploads.

## Styling

UploadThing components are styled to match the restaurant app's design system using Tailwind CSS. Custom styles are applied through the `className` prop.

## Troubleshooting

If uploads fail, check:
1. Environment variables are properly set
2. User is properly authenticated 
3. The UPLOADTHING_SECRET key is valid
4. File size doesn't exceed the 4MB limit 