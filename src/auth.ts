import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import {
  exposeUserIdOnSession,
  withGoogleUserId,
} from "@/lib/auth/user-id";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    jwt({ token, account, profile }) {
      const profileSub =
        profile && typeof profile === "object" && "sub" in profile
          ? profile.sub
          : undefined;

      return withGoogleUserId(token, {
        sub: profileSub,
        providerAccountId: account?.providerAccountId,
      });
    },
    session({ session, token }) {
      return exposeUserIdOnSession(session, token.sub);
    },
  },
});
