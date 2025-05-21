// Re-export authOptions from the original location
export { authOptions } from '@/app/api/auth/[...nextauth]/options';

// Add type definitions for next-auth
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
    };
  }
} 