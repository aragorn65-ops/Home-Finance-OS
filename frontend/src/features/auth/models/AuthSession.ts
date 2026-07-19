import type {
  AuthUser,
} from "./AuthUser";

export type AuthSessionStatus =
  | "disabled"
  | "signed-out"
  | "loading"
  | "signed-in";

export interface AuthSession {
  status: AuthSessionStatus;
  user?: AuthUser;
  expiresAt?: Date;
}
