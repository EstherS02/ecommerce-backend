import { z } from "zod";

export const cartSchema = z.object({
    productId: z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        "Invalid Product ID"
    ),
    quantity: z.coerce
        .number()
        .int("Quantity must be an interger")
        .min(1, "Quantity must be at least 1")
        .max(100, "Maximum quantity is 100")
})

export const deleteCartSchema = z.object({
    productId: z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        "Invalid Product ID"
    )
})

export const checkoutSchema = z.object({
    shippingAddress: z.object({
        name: z.string().min(3),
        phone: z.string().min(10),
        address: z.string().min(5),
        city: z.string(),
        state: z.string(),
        postalCode: z.string(),
        country: z.string()
    })
})