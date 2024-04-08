"use server"

import * as z from "zod"
import { db } from "@/lib/db"
import { SettingSchema } from "@/schemas"
import { getUserByEmail, getUserById } from "@/data/user"
import { currentUser } from "@/lib/auth"
import { generateVerificationToken } from "@/lib/tokens"
import { sendVerificationEmail } from "@/lib/mail"
import bcrypt from "bcryptjs"

export const settings = async (values: z.infer<typeof SettingSchema>) => {
    const user = await currentUser()
    if (!user) {
        return { error: "Unauthorized!"}
    }

    const dbUser = await getUserById(user.id)
    if (!dbUser) {
        return { error: "Unauthorized!"}
    }

    if (user.isOAuth) {
        values.email = undefined
        values.password = undefined as any
        values.newPassword = undefined as any
        values.isTwoFactorEnabled = undefined
    }

    if (values.email && values.email !== user.email) {
        const existingUser = await getUserByEmail(values.email)
        if (existingUser && existingUser !== user.id) {
            return { error: "Email already exists!"}
        }

        const verificationToken = await generateVerificationToken(values.email)
        await sendVerificationEmail(
            verificationToken.email,
            verificationToken.token
            )
        return { success: "Verification email sent!"}
    }

    if (values.password && values.newPassword && dbUser.password) {
        const passwordMatch = await bcrypt.compare(
            values.password,
            dbUser.password
        )

        if (!passwordMatch) {
            return { error: "Incorrect password!"}
        }

        const hashedPassoword = await bcrypt.hash(values.newPassword, 10)
        values.password = hashedPassoword
        values.newPassword = undefined as any
    }

    await db.user.update({
        where: { id: dbUser.id },
        data: {
            ...values
        }
    })

    await db.user.update({
        where: { id: dbUser.id},
        data: {
            ...values
        }
    })

    return { success: "Settings updated!"}
}