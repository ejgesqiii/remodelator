import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Upload, AlertCircle, Check, Database, X } from 'lucide-react';
import * as activityApi from '@/api/activity';
import { toast } from 'sonner';

export function BackupSection() {
    const queryClient = useQueryClient();
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [showRestore, setShowRestore] = useState(false);

    const exportMutation = useMutation({
        mutationFn: activityApi.exportBackup,
        onSuccess: (data) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `remodelator-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Backup exported');
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Export failed'),
    });

    const restoreMutation = useMutation({
        mutationFn: async () => {
            if (!restoreFile) throw new Error('No file selected');
            const text = await restoreFile.text();
            const data = JSON.parse(text);
            return activityApi.restoreBackup(data);
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries();
            toast.success(`Restored ${result.estimates_restored} estimates, ${result.line_items_restored} line items`);
            setShowRestore(false);
            setRestoreFile(null);
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Restore failed'),
    });

    return (
        <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold">
                <Database size={18} className="text-muted" />
                Data Backup
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
                {/* Export */}
                <div className="rounded-xl border border-border bg-background/50 p-4">
                    <h3 className="mb-2 text-sm font-semibold">Export Snapshot</h3>
                    <p className="mb-3 text-xs text-muted-foreground">
                        Download a JSON backup of all your estimates and line items.
                    </p>
                    <button
                        onClick={() => exportMutation.mutate()}
                        disabled={exportMutation.isPending}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary-hover disabled:opacity-50"
                    >
                        {exportMutation.isPending ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                        ) : (
                            <Download size={16} />
                        )}
                        Export
                    </button>
                </div>

                {/* Restore */}
                <div className="rounded-xl border border-border bg-background/50 p-4">
                    <h3 className="mb-2 text-sm font-semibold">Restore from Backup</h3>
                    {!showRestore ? (
                        <>
                            <p className="mb-3 text-xs text-muted-foreground">
                                Upload a previously exported snapshot to restore data.
                            </p>
                            <button
                                onClick={() => setShowRestore(true)}
                                className="flex items-center gap-2 rounded-xl border border-border bg-surface-hover px-4 py-2.5 text-sm font-medium text-foreground shadow-none transition-colors hover:bg-surface-active"
                            >
                                <Upload size={16} /> Restore
                            </button>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <input
                                type="file"
                                accept=".json"
                                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                                className="w-full text-sm text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary"
                            />
                            {restoreFile && (
                                <p className="flex items-center gap-1.5 text-xs text-success">
                                    <Check size={12} /> {restoreFile.name}
                                </p>
                            )}
                            <div className="flex items-center gap-1.5 rounded-xl border border-warning/30 bg-warning-muted px-3 py-2 text-xs text-warning">
                                <AlertCircle size={12} className="shrink-0" />
                                This will merge data — existing records will not be deleted.
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => restoreMutation.mutate()}
                                    disabled={!restoreFile || restoreMutation.isPending}
                                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary-hover disabled:opacity-50"
                                >
                                    {restoreMutation.isPending ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                                    ) : (
                                        <Upload size={14} />
                                    )}
                                    Confirm Restore
                                </button>
                                <button
                                    onClick={() => {
                                        setShowRestore(false);
                                        setRestoreFile(null);
                                    }}
                                    className="rounded-xl bg-transparent px-3 py-2 text-sm text-muted-foreground shadow-none hover:text-foreground"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
