import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (
          email === "admin@freightquote.in" &&
          password === "Freight@2026"
        ) {
          return {
            id: "1",
            name: "Admin",
            email: "admin@freightquote.in",
            image: null,
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ request: { nextUrl }, auth: session }) {
      const isLoggedIn = !!session?.user;
      const { pathname } = nextUrl;

      const publicPaths = [
        "/",
        "/login",
        "/api/quote",
        "/_next",
      ];

      const isPublic = publicPaths.some(
        (p) => pathname === p || pathname.startsWith(p)
      );

      if (isPublic) return true;
      if (isLoggedIn) return true;

      if (pathname.includes(".") || pathname === "/favicon.ico") return true;

      return false;
    },
  },
});
