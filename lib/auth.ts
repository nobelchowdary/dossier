import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const providers = [
  Credentials({
    id: "password",
    name: "Password Login",
    credentials: {
      email: {},
      password: {},
    },
    async authorize(credentials) {
      const email = credentials?.email as string;
      const password = credentials?.password as string;

      if (!email || !password) return null;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.password) return null;

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      };
    },
  }),

  Credentials({
    id: "otp",
    name: "OTP Login",
    credentials: {
      email: {},
      otp: {},
    },
    async authorize(credentials) {
      const email = credentials?.email as string;
      const otp = credentials?.otp as string;

      const record = await prisma.loginOTP.findFirst({
        where: {
          email,
          code: otp,
          expiresAt: { gt: new Date() },
        },
      });

      if (!record) return null;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) return null;

      await prisma.loginOTP.delete({
        where: { id: record.id },
      });

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      };
    },
  }),

  Google({
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = user.role ?? "MEMBER";
        token.organizationId = user.organizationId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
        });
        session.user.id = token.id as string;
        session.user.role = dbUser?.role ?? "MEMBER";
        session.user.organizationId = dbUser?.organizationId ?? null;
      }
      return session;
    },
  },
});