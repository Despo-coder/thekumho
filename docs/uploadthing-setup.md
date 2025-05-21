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

# UploadThing Integration Guide

This document provides guidance on how to use UploadThing for image uploads in the restaurant application.

## Setup Overview

UploadThing is integrated for handling file uploads, particularly for menu item images. The implementation includes:

1. Core file router configuration
2. API route handlers
3. Client components for image upload
4. Image preview and display

## Key Files

- `app/api/uploadthing/core.ts` - Defines the file router and middleware auth
- `app/api/uploadthing/route.ts` - API route handler
- `lib/uploadthing.ts` - Client components and utilities

## Using the Upload Component

### Basic Upload Button

```tsx
import { UploadButton } from "@/lib/uploadthing";

// Inside your component
<UploadButton
  endpoint="menuItemImage"
  onClientUploadComplete={(res) => {
    if (res && res[0]) {
      setImage(res[0].url);
    }
  }}
  onUploadError={(error) => {
    console.error("Upload error:", error);
  }}
/>
```

### Image Preview with Next.js Image Component

When displaying uploaded images, use the Next.js Image component with proper width and height attributes:

```tsx
import Image from "next/image";

// Inside your component
{image ? (
  <div className="relative">
    <Image
      src={image}
      alt={name}
      width={400}  // Specify width
      height={400} // Specify height
      className="w-full h-48 object-cover rounded-md"
    />
    <button
      type="button"
      onClick={() => setImage("")}
      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
    >
      ✕
    </button>
  </div>
) : (
  // Upload button here
)}
```

### Using in Tables or Lists

For thumbnail display in tables or lists, use smaller dimensions:

```tsx
<Image
  src={item.image}
  alt={item.name}
  width={100}
  height={100}
  className="h-10 w-10 rounded-full object-cover"
/>
```

## Upload Progress Handling

```tsx
<UploadButton
  endpoint="menuItemImage"
  onBeforeUploadBegin={(files) => {
    setIsUploading(true);
    return files;
  }}
  onUploadProgress={() => {
    // Handle upload progress if needed
  }}
  onClientUploadComplete={(res) => {
    setIsUploading(false);
    if (res && res[0]) {
      setImage(res[0].url);
    }
  }}
  onUploadError={(error) => {
    setIsUploading(false);
    setErrorMessage(`Error uploading image: ${error.message}`);
  }}
  className="ut-button:bg-orange-500 ut-button:hover:bg-orange-600"
/>

{isUploading && (
  <div className="flex items-center justify-center">
    <Loader2 className="h-5 w-5 animate-spin text-orange-500 mr-2" />
    <span className="text-sm text-gray-500">Uploading image...</span>
  </div>
)}
```

## Important Notes

1. Always include proper error handling for upload failures
2. Show loading states during uploads
3. Add verification for file types and sizes in the core.ts configuration
4. Always specify width and height for Next.js Image components to avoid layout shifts
5. Use appropriate CSS classes for responsive sizing while maintaining proper aspect ratios

## Security Considerations

The UploadThing integration includes auth checks to ensure only authenticated users with appropriate roles (ADMIN or MANAGER) can upload images.

For more detailed information, visit [UploadThing Documentation](https://docs.uploadthing.com/). 