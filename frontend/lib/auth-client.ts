import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.SERVER_URL as string,
});

export const { signIn, signUp, signOut, useSession } = authClient;