import { z } from "zod";

export const productSchema = z.object({
    title: z
        .string()
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title cannot exceed 100 characters"),
    description: z
        .string()
        .min(10, "Description must be at least 10 characters")
        .max(1000, "Description cannot exceed 1000 characters"),
    price: z.coerce
        .number()
        .positive("Price must be greater than 0"),
    category: z
        .string()
        .min(1, "Category is required"),
    stock: z.coerce
        .number()
        .int("Stock must be an integer")
        .min(0, "Stock cannot be negative"),
})