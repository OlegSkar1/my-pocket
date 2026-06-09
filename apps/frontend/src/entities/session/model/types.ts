import type { AuthResponse, User } from "@my-pocket/shared-types";

export type SessionUser = Pick<User, "id" | "name" | "email">;

export interface SessionState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  setSession: (response: AuthResponse) => void;
  clear: () => void;
}
