import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import { db } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: 'user-login',
      name: 'User Login',
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const identifier = (credentials.username as string).trim();
        const password = credentials.password as string;

        if (identifier.length > 100 || password.length > 100) return null;

        const user = await db.user.findFirst({
          where: {
            OR: [
              { username: identifier },
              { email: identifier },
            ],
          },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        if (user.status === -1) throw new Error('account_deleted');
        if (user.status === 0) return null; // banned
        if (user.ev === 0) return null; // email not verified

        return {
          id: String(user.id),
          name: `${user.firstname} ${user.lastname}`,
          email: user.email,
          image: user.image,
          role: 'user',
        };
      },
    }),
    Credentials({
      id: 'admin-login',
      name: 'Admin Login',
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const identifier = (credentials.username as string).trim();
        const password = credentials.password as string;

        if (identifier.length > 100 || password.length > 100) return null;

        const admin = await db.admin.findFirst({
          where: {
            OR: [
              { username: identifier },
              { email: identifier },
            ],
          },
          include: { role: true },
        });

        if (!admin) return null;

        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) return null;

        return {
          id: String(admin.id),
          name: admin.name,
          email: admin.email,
          image: admin.image,
          role: 'admin',
          roleId: admin.role_id,
          roleSlug: admin.role?.slug || 'super-admin',
          roleName: admin.role?.name || 'Admin',
        };
      },
    }),
    Credentials({
      id: 'impersonate-login',
      name: 'Impersonate',
      credentials: {
        token: {},
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        try {
          if (!process.env.NEXTAUTH_SECRET) return null;
          const decoded = jsonwebtoken.verify(credentials.token as string, process.env.NEXTAUTH_SECRET) as any;
          if (decoded.type !== 'impersonate') return null;

          const user = await db.user.findUnique({ where: { id: decoded.userId } });
          if (!user) return null;

          return {
            id: String(user.id),
            name: `${user.firstname} ${user.lastname}`,
            email: user.email,
            image: user.image,
            role: 'user',
            impersonatedBy: decoded.adminId,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.userId = user.id;
        token.roleId = (user as any).roleId;
        token.roleSlug = (user as any).roleSlug;
        if ((user as any).impersonatedBy) token.impersonatedBy = (user as any).impersonatedBy;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.userId;
        (session.user as any).roleId = token.roleId;
        (session.user as any).roleSlug = token.roleSlug;
        if (token.impersonatedBy) (session.user as any).impersonatedBy = token.impersonatedBy;

        // Check if user is still active (ban/delete check)
        if (token.role === 'user' && token.userId) {
          try {
            const user = await db.user.findUnique({ where: { id: Number(token.userId) }, select: { status: true } });
            if (user && user.status === 0) {
              (session.user as any).banned = true;
            }
            if (user && user.status === -1) {
              (session.user as any).deleted = true;
            }
          } catch {}
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30 for financial platform)
  },
  trustHost: true,
});
