// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login", // 👈 반드시 명시해줘야 함
  },
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ["/", "/editor"],
};
