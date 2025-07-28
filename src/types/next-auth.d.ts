<<<<<<< HEAD
// types/next-auth.d.ts or any global .d.ts file
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
=======
// src/types/next-auth.d.ts
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
>>>>>>> cm
    }
  }

  interface User {
    id: string
<<<<<<< HEAD
    email: string
    name: string
  }
}
=======
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
  }
}
>>>>>>> cm
