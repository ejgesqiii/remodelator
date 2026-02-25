import { get, post } from './client';

export function renderProposal(estimateId: string): Promise<{ rendered: string }> {
    return get<{ rendered: string }>(`/proposals/${estimateId}/render`);
}

export function generateProposalPdf(estimateId: string): Promise<{ path: string }> {
    return post<{ path: string }>(`/proposals/${estimateId}/pdf`);
}
