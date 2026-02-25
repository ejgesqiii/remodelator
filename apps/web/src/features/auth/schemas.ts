import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Enter a valid email').min(5).max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const registerSchema = z.object({
    full_name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Enter a valid email').min(5).max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
