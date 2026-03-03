import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from './useAuth';
import { forgotPasswordSchema, type ForgotPasswordFormData } from './schemas';

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { requestPasswordReset } = useAuth();
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = (data: ForgotPasswordFormData) => {
        requestPasswordReset.mutate(data.email, {
            onSuccess: (res) => {
                setInfoMessage(res.message);
                if (res.reset_token) {
                    navigate(`/reset-password?token=${encodeURIComponent(res.reset_token)}`);
                }
            },
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
                        <KeyRound size={20} />
                    </div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Forgot password</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Enter your account email to start reset.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
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

                    {requestPasswordReset.isError && (
                        <div className="rounded-xl border border-destructive/30 bg-destructive-muted px-4 py-3 text-sm text-destructive">
                            {requestPasswordReset.error instanceof Error ? requestPasswordReset.error.message : 'Failed to request reset'}
                        </div>
                    )}
                    {infoMessage && (
                        <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                            {infoMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={requestPasswordReset.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-50"
                    >
                        Send reset link
                    </button>
                </form>
            </div>
        </div>
    );
}
