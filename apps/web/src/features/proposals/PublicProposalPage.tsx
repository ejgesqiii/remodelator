import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import * as proposalsApi from '@/api/proposals';

export function PublicProposalPage() {
    const { token } = useParams<{ token: string }>();

    const { data, isLoading } = useQuery({
        queryKey: ['proposal-public', token],
        queryFn: () => proposalsApi.renderPublicProposal(token!),
        enabled: !!token,
    });

    const handlePdf = async () => {
        if (!token) return;
        try {
            const url = proposalsApi.proposalPublicPdfUrl(token);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
        } catch {
            toast.error('Failed to open PDF');
        }
    };

    return (
        <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-5xl space-y-4">
                <div className="flex items-center justify-end">
                    <button
                        onClick={handlePdf}
                        className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
                    >
                        <Download size={15} /> Open PDF
                    </button>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-10">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="animate-skeleton h-5 rounded bg-border" style={{ width: `${66 + i * 6}%` }} />
                            ))}
                        </div>
                    ) : data?.rendered ? (
                        <div className="max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: data.rendered }} />
                    ) : (
                        <p className="text-center text-muted-foreground">Proposal not available</p>
                    )}
                </div>
            </div>
        </div>
    );
}
