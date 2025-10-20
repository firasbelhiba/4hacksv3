import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { UserLoginSchema } from '@/types/database';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          // Validate input
          const validatedFields = UserLoginSchema.safeParse(credentials);
          if (!validatedFields.success) {
            return null;
          }

          const { email, password } = validatedFields.data;

          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user || !user.password) {
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            return null;
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          });

          // Return user object for session
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Include user role in JWT token
      if (user) {
        token.role = user.role as any;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Include user role and ID in session
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };