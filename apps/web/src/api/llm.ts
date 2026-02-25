import { get, post } from './client';
import type { LlmProviderStatus, LlmSuggestion, LlmSuggestRequest, LlmApplyRequest } from './types';

export function getLlmStatus(): Promise<LlmProviderStatus> {
    return get<LlmProviderStatus>('/pricing/llm/status');
}

export function getLlmSuggestion(data: LlmSuggestRequest): Promise<LlmSuggestion> {
    return post<LlmSuggestion>('/pricing/llm/live', data);
}

export function applyLlmSuggestion(data: LlmApplyRequest): Promise<unknown> {
    return post('/pricing/llm/apply', data);
}
