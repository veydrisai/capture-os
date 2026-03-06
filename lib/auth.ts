import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
    async signIn({ user, account }) {
      // Persist access token to the accounts table so calendar can use it
      if (account?.access_token && user.id) {
        await db
          .update(accounts)
          .set({
            access_token: account.access_token,
            refresh_token: account.refresh_token ?? null,
            expires_at: account.expires_at ?? null,
          })
          .where(
            and(
              eq(accounts.userId, user.id),
              eq(accounts.provider, "google")
            )
          );
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
});
