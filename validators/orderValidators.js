import {z} from 'zod';

export const updateOrderStatusSchema = z.object({
    status: z.enum([
        "Pending",
        "Confirmed",
        "Packed",
        "Shipped",
        "Delivered",
        "Cancelled"
    ])
})