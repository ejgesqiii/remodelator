import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Settings, Save, AlertCircle } from 'lucide-react';
import * as profileApi from '@/api/profile';
import { toast } from 'sonner';
import { BackupSection } from './BackupSection';

const profileSchema = z.object({
    full_name: z.string().min(1, 'Name is required'),
    labor_rate: z.number().min(0).optional(),
    item_markup_pct: z.number().min(0).optional(),
    estimate_markup_pct: z.number().min(0).optional(),
    tax_rate_pct: z.number().min(0).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function SettingsPage() {
    const queryClient = useQueryClient();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: profileApi.getProfile,
    });

    const updateMutation = useMutation({
        mutationFn: profileApi.updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Profile updated');
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Update failed'),
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        values: profile
            ? {
                full_name: profile.full_name,
                labor_rate: parseFloat(profile.labor_rate) || 0,
                item_markup_pct: parseFloat(profile.default_item_markup_pct) || 0,
                estimate_markup_pct: parseFloat(profile.default_estimate_markup_pct) || 0,
                tax_rate_pct: parseFloat(profile.tax_rate_pct) || 0,
            }
            : undefined,
    });

    const onSubmit = (data: ProfileFormData) => {
        updateMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-skeleton h-10 w-1/3 rounded-xl bg-border" />
                <div className="animate-skeleton h-64 rounded-2xl bg-border" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Settings" description="Manage your profile and defaults" icon={Settings} />

            <div className="max-w-2xl">
                <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
                    <h2 className="mb-4 font-heading text-base font-semibold">Profile & Defaults</h2>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <input
                                {...register('full_name')}
                                className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                            {errors.full_name && <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle size={12} />{errors.full_name.message}</p>}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Default Labor Rate ($/hr)</label>
                                <input type="number" step="0.01" {...register('labor_rate', { valueAsNumber: true })} className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Default Item Markup %</label>
                                <input type="number" step="0.01" {...register('item_markup_pct', { valueAsNumber: true })} className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Default Estimate Markup %</label>
                                <input type="number" step="0.01" {...register('estimate_markup_pct', { valueAsNumber: true })} className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tax Rate %</label>
                                <input type="number" step="0.01" {...register('tax_rate_pct', { valueAsNumber: true })} className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={!isDirty || updateMutation.isPending}
                                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-50"
                            >
                                {updateMutation.isPending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <Save size={16} />}
                                Save Changes
                            </button>
                            {profile && (
                                <span className="text-xs text-muted-foreground">
                                    {profile.email} • {profile.role}
                                </span>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Backup */}
            <BackupSection />
        </div>
    );
}
