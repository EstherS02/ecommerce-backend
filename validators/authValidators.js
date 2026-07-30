import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(3, "Name must be atleast 3 characters"),
    email: z.email("Invalid email"),
    password: z.string().min(8, "Password mut be at least 8 characters"),
    role: z.enum(["user", "admin"]).optional()
})

export const loginSchema = z.object({
    email: z.email("Invalid email"),
    password: z.string().min(8, "Password mut be at least 8 characters")
})