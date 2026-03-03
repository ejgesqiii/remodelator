import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useAuth } from './useAuth';
import { resetPasswordSchema, type ResetPasswordFormData } from './schemas';

export function ResetPasswordPage() {
    const { confirmPasswordReset } = useAuth();
    const [searchParams] = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const tokenFromUrl = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            token: tokenFromUrl,
            new_password: '',
            confirm_password: '',
        },
    });

    const onSubmit = (data: ResetPasswordFormData) => {
        confirmPasswordReset.mutate({
            token: data.token,
            new_password: data.new_password,
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface/80 p-8 shadow-lg backdrop-blur-xl">
                <Link to="/login" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft size={15} /> Back to sign in
                </Link>

                <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <LockKeyhole size={20} />
                    </div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Reset password</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Set a new password for your account.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="token" className="text-sm font-medium text-foreground">Reset token</label>
                        <input
                            id="token"
                            type="text"
                            placeholder="Paste reset token"
                            className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                            {...register('token')}
                        />
                        {errors.token && (
                            <p className="flex items-center gap-1.5 text-xs text-destructive">
                                <AlertCircle size={12} />
                                {errors.token.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="new_password" className="text-sm font-medium text-foreground">New password</label>
                        <div className="relative">
                            <input
                                id="new_password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                placeholder="Min. 8 characters"
                                className="w-full rounded-xl border border-input-border bg-input px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                                {...register('new_password')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent p-0 text-muted shadow-none transition-colors hover:text-foreground"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.new_password && (
                            <p className="flex items-center gap-1.5 text-xs text-destructive">
                                <AlertCircle size={12} />
                                {errors.new_password.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirm_password" className="text-sm font-medium text-foreground">Confirm password</label>
                        <input
                            id="confirm_password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="Re-enter password"
                            className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                            {...register('confirm_password')}
                        />
                        {errors.confirm_password && (
                            <p className="flex items-center gap-1.5 text-xs text-destructive">
                                <AlertCircle size={12} />
                                {errors.confirm_password.message}
                            </p>
                        )}
                    </div>

                    {confirmPasswordReset.isError && (
                        <div className="rounded-xl border border-destructive/30 bg-destructive-muted px-4 py-3 text-sm text-destructive">
                            {confirmPasswordReset.error instanceof Error ? confirmPasswordReset.error.message : 'Password reset failed'}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={confirmPasswordReset.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-50"
                    >
                        {confirmPasswordReset.isPending ? 'Updating...' : 'Reset password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
