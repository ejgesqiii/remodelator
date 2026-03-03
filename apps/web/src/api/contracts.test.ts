import { beforeEach, describe, expect, it, vi } from 'vitest';

import { simulateRefund } from './billing';
import * as client from './client';
import { confirmPasswordReset, requestPasswordReset } from './auth';
import { exportEstimate, reorderLineItem } from './estimates';
import { generateProposalPdf } from './proposals';

vi.mock('./client', () => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
}));

describe('api contract payloads', () => {
    const postMock = vi.mocked(client.post);

    beforeEach(() => {
        postMock.mockReset();
        postMock.mockResolvedValue({} as never);
    });

    it('sends output_path when exporting an estimate', async () => {
        await exportEstimate('est-123', 'exports/estimate_est-123.json');
        expect(postMock).toHaveBeenCalledWith('/estimates/est-123/export', {
            output_path: 'exports/estimate_est-123.json',
        });
    });

    it('sends output_path when generating proposal pdf', async () => {
        await generateProposalPdf('est-123', 'exports/proposal_est-123.pdf');
        expect(postMock).toHaveBeenCalledWith('/proposals/est-123/pdf', {
            output_path: 'exports/proposal_est-123.pdf',
        });
    });

    it('sends new_index for line-item reorder payload', async () => {
        await reorderLineItem('est-123', 'line-1', 2);
        expect(postMock).toHaveBeenCalledWith('/estimates/est-123/line-items/line-1/reorder', {
            new_index: 2,
        });
    });

    it('always sends amount for refunds', async () => {
        await simulateRefund({ amount: 10, details: 'test-refund' });
        expect(postMock).toHaveBeenCalledWith('/billing/simulate-refund', {
            amount: 10,
            details: 'test-refund',
        });
    });

    it('sends email when requesting password reset', async () => {
        await requestPasswordReset({ email: 'reset@example.com' });
        expect(postMock).toHaveBeenCalledWith('/auth/password-reset/request', {
            email: 'reset@example.com',
        });
    });

    it('sends token and new password when confirming password reset', async () => {
        await confirmPasswordReset({ token: 'abc123tokenvalue', new_password: 'pw123456' });
        expect(postMock).toHaveBeenCalledWith('/auth/password-reset/confirm', {
            token: 'abc123tokenvalue',
            new_password: 'pw123456',
        });
    });
});
