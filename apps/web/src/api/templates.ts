import { get, post } from './client';
import type { TemplateSummary } from './types';

export function listTemplates(): Promise<TemplateSummary[]> {
    return get<TemplateSummary[]>('/templates');
}

export function saveTemplate(data: { estimate_id: string; name: string }): Promise<TemplateSummary> {
    return post<TemplateSummary>('/templates/save', data);
}

export function applyTemplate(data: { template_id: string; estimate_id: string }): Promise<unknown> {
    return post('/templates/apply', data);
}
