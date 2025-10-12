import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

const credentialsSchema = z.object({
  email: z.string().email({ message: "メールアドレスの形式が正しくありません" }),
  password: z
    .string()
    .min(8, { message: "パスワードは8文字以上で入力してください" })
    .max(128),
});

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      async authorize(rawCredentials) {
        const parseResult = credentialsSchema.safeParse(rawCredentials);
        if (!parseResult.success) {
          return null;
        }

        const { email, password } = parseResult.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        } satisfies {
          id: string;
          email: string;
          name: string | null | undefined;
          role: UserRole;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }

      return session;
    },
  },
});
