import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt-ts";
import { prisma } from "@/libs/prisma";
import { getAuthUserPayload } from "@/libs/auth/userPayload";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "NIM Password",

      credentials: {
        nim: {
          label: "NIM",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const nim = String(credentials?.nim || "").trim();
        const password = String(credentials?.password || "");

        if (!nim || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            nim,
          },
          select: {
            id: true,
            password: true,
          },
        });

        if (!user) {
          return null;
        }

        const passwordValid = await compare(password, user.password);

        if (!passwordValid) {
          return null;
        }

        // NextAuth's augmented User type is used by the Credentials provider.
        // This payload is cached and removed from the JWT in the jwt callback.
        return (await getAuthUserPayload(user.id)) ?? null;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub ?? token.id;
      if (!userId) {
        return token;
      }

      token.sub = String(userId);

      // Retain only the stable subject in the JWT. Names, profile data, role
      // labels, and permissions are loaded from the short-lived server cache.
      delete token.id;
      delete token.name;
      delete token.email;
      delete token.picture;
      delete token.nim;
      delete token.roles;
      delete token.roleIds;
      delete token.permissions;

      const freshUser = await getAuthUserPayload(String(userId));

      if (!freshUser) {
        token.isActive = false;
        return token;
      }

      token.isActive = true;

      return token;
    },

    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      const userId = token.sub ?? token.id;
      if (!userId) {
        session.user.id = "";
        session.user.nim = "";
        session.user.roles = [];
        session.user.roleIds = [];
        session.user.permissions = [];
        session.user.isActive = false;
        session.user.image = null;
        return session;
      }

      const freshUser = await getAuthUserPayload(String(userId));

      if (!freshUser) {
        session.user.id = String(userId);
        session.user.nim = "";
        session.user.roles = [];
        session.user.roleIds = [];
        session.user.permissions = [];
        session.user.isActive = false;
        session.user.image = null;
        return session;
      }

      session.user.id = freshUser.id;
      session.user.name = freshUser.name || "";
      session.user.email = freshUser.email || "";
      session.user.image = freshUser.image;
      session.user.nim = freshUser.nim;
      session.user.roles = freshUser.roles;
      session.user.roleIds = freshUser.roleIds;
      session.user.permissions = freshUser.permissions;
      session.user.isActive = true;

      return session;
    },
  },
});
