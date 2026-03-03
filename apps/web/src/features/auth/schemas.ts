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

export const forgotPasswordSchema = z.object({
    email: z.string().email('Enter a valid email').min(5).max(255),
});

export const resetPasswordSchema = z
    .object({
        token: z.string().min(10, 'Reset token is required').max(512),
        new_password: z.string().min(8, 'Password must be at least 8 characters').max(128),
        confirm_password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    })
    .refine((data) => data.new_password === data.confirm_password, {
        path: ['confirm_password'],
        message: 'Passwords must match',
    });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
