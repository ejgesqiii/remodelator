import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { FileText, ArrowLeft, Download, Link2 } from 'lucide-react';
import * as proposalsApi from '@/api/proposals';
import { toast } from 'sonner';

export function ProposalPage() {
    const { id } = useParams<{ id: string }>();

    const { data, isLoading } = useQuery({
        queryKey: ['proposal', id],
        queryFn: () => proposalsApi.renderProposal(id!),
        enabled: !!id,
    });

    const shareMutation = useMutation({
        mutationFn: async () => proposalsApi.createProposalShareLink(id!),
        onSuccess: async (result) => {
            const fullUrl = `${window.location.origin}${result.path}`;
            try {
                await navigator.clipboard.writeText(fullUrl);
                toast.success('Public proposal link copied');
            } catch {
                toast.success(`Public proposal link: ${fullUrl}`);
            }
        },
        onError: (err) => {
            toast.error(err instanceof Error ? err.message : 'Failed to create public link');
        },
    });

    const handleExportPdf = async () => {
        try {
            await proposalsApi.downloadProposalPdf(id!);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'PDF download failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link to={`/estimates/${id}`} className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground">
                    <ArrowLeft size={20} />
                </Link>
                <PageHeader
                    title="Proposal"
                    icon={FileText}
                    actions={
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => shareMutation.mutate()}
                                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
                            >
                                <Link2 size={15} /> Copy Public Link
                            </button>
                            <button
                                onClick={handleExportPdf}
                                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
                            >
                                <Download size={16} /> Download PDF
                            </button>
                        </div>
                    }
                />
            </div>

            <div className="rounded-2xl border border-border bg-surface/80 p-8 backdrop-blur-sm">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => <div key={i} className="animate-skeleton h-5 rounded bg-border" style={{ width: `${70 + i * 5}%` }} />)}
                    </div>
                ) : data?.rendered ? (
                    <div
                        className="max-w-none text-foreground"
                        dangerouslySetInnerHTML={{ __html: data.rendered }}
                    />
                ) : (
                    <p className="text-center text-muted-foreground">No proposal content available</p>
                )}
            </div>

            <div className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-muted-foreground">
                Client view is available via a secure public link from <span className="font-medium text-foreground">Copy Public Link</span>. The same layout is used for both browser and PDF.
            </div>
        </div>
    );
}
