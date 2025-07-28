// types/next-auth.d.ts or any global .d.ts file
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
  }
}
