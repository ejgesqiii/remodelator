import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from './useAuth';
import { registerSchema, type RegisterFormData } from './schemas';
import { UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function RegisterPage() {
    const { register: registerMutation } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = (data: RegisterFormData) => {
        registerMutation.mutate(data);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            {/* Background gradient orbs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl" />
                <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <span className="font-heading text-2xl font-bold">R</span>
                    </div>
                    <h1 className="font-heading text-3xl font-bold tracking-tight">Create your account</h1>
                    <p className="mt-2 text-muted-foreground">Get started with Remodelator today</p>
                </div>

                {/* Form card */}
                <div className="rounded-2xl border border-border bg-surface/80 p-8 shadow-lg backdrop-blur-xl">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <label htmlFor="full_name" className="text-sm font-medium text-foreground">
                                Full name
                            </label>
                            <input
                                id="full_name"
                                type="text"
                                autoComplete="name"
                                placeholder="John Smith"
                                className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                                {...register('full_name')}
                            />
                            {errors.full_name && (
                                <p className="flex items-center gap-1.5 text-xs text-destructive">
                                    <AlertCircle size={12} />
                                    {errors.full_name.message}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-foreground">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@company.com"
                                className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="flex items-center gap-1.5 text-xs text-destructive">
                                    <AlertCircle size={12} />
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-foreground">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Min. 8 characters"
                                    className="w-full rounded-xl border border-input-border bg-input px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent p-0 text-muted shadow-none transition-colors hover:text-foreground"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="flex items-center gap-1.5 text-xs text-destructive">
                                    <AlertCircle size={12} />
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Error */}
                        {registerMutation.isError && (
                            <div className="rounded-xl border border-destructive/30 bg-destructive-muted px-4 py-3 text-sm text-destructive">
                                {registerMutation.error instanceof Error ? registerMutation.error.message : 'Registration failed.'}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={registerMutation.isPending}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-50"
                        >
                            {registerMutation.isPending ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    Create account
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary transition-colors hover:text-primary-hover">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
