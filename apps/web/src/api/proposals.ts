import { get, post } from './client';
import { API_BASE } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

export function renderProposal(estimateId: string): Promise<{ rendered: string }> {
    return get<{ rendered: string }>(`/proposals/${estimateId}/render`);
}

export function createProposalShareLink(estimateId: string): Promise<{ token: string; path: string }> {
    return post<{ token: string; path: string }>(`/proposals/${estimateId}/share`);
}

export function renderPublicProposal(token: string): Promise<{ rendered: string }> {
    return get<{ rendered: string }>(`/proposals/public/${token}/render`);
}

export function generateProposalPdf(estimateId: string, outputPath?: string): Promise<{ path: string }> {
    return post<{ path: string }>(`/proposals/${estimateId}/pdf`, outputPath ? { output_path: outputPath } : {});
}

export function proposalPublicPdfUrl(token: string): string {
    return `${API_BASE}/proposals/public/${token}/pdf`;
}

export async function downloadProposalPdf(estimateId: string): Promise<void> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_BASE}/proposals/${estimateId}/pdf/download`, {
        method: 'GET',
        headers: token ? { 'x-session-token': token } : {},
    });
    if (!response.ok) {
        throw new Error('Failed to download proposal PDF');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `proposal_${estimateId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}
