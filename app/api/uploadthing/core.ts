import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define a route for menu item images
  menuItemImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      // Run auth checks on the server before upload
      const session = await getServerSession(authOptions);
      
      if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
        throw new Error("Unauthorized");
      }
      
      // If authorized, return metadata to be used in onUploadComplete
      return { 
        userId: session.user.id,
        userRole: session.user.role,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on your server after upload is complete
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      // Return the file URL so we can use it in the frontend
      return { 
        fileUrl: file.url,
        fileName: file.name,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 