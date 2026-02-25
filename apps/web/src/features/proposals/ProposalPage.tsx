import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { FileText, ArrowLeft, Download } from 'lucide-react';
import * as proposalsApi from '@/api/proposals';
import { toast } from 'sonner';

export function ProposalPage() {
    const { id } = useParams<{ id: string }>();

    const { data, isLoading } = useQuery({
        queryKey: ['proposal', id],
        queryFn: () => proposalsApi.renderProposal(id!),
        enabled: !!id,
    });

    const handleExportPdf = async () => {
        try {
            const result = await proposalsApi.generateProposalPdf(id!);
            toast.success(`PDF generated: ${result.path}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'PDF generation failed');
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
                        <button
                            onClick={handleExportPdf}
                            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
                        >
                            <Download size={16} /> Export PDF
                        </button>
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
                        className="prose prose-invert max-w-none text-foreground [&_p]:leading-relaxed [&_h1]:font-heading [&_h2]:font-heading [&_h3]:font-heading"
                        dangerouslySetInnerHTML={{ __html: data.rendered }}
                    />
                ) : (
                    <p className="text-center text-muted-foreground">No proposal content available</p>
                )}
            </div>
        </div>
    );
}
