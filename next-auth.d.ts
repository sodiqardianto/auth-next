import { UserRole } from "@prisma/client";

export type ExtendedUser = DefaultSession["user"] & {
    role: UserRole
}

declare module "next-auth" {
    interface Session {
        user: ExtendedUser
    }
}