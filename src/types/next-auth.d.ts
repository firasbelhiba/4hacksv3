import NextAuth from 'next-auth';
import { UserRole } from '@/generated/prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}