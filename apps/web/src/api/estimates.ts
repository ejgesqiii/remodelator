import { get, post, put, del } from './client';
import type {
    Estimate, CreateEstimateRequest, UpdateEstimateRequest,
    LineItem, AddLineItemRequest, UpdateLineItemRequest,
} from './types';

// ─── Estimates ───
export function listEstimates(): Promise<Estimate[]> {
    return get<Estimate[]>('/estimates');
}

export function getEstimate(id: string): Promise<Estimate> {
    return get<Estimate>(`/estimates/${id}`);
}

export function createEstimate(data: CreateEstimateRequest): Promise<Estimate> {
    return post<Estimate>('/estimates', data);
}

export function updateEstimate(id: string, data: UpdateEstimateRequest): Promise<Estimate> {
    return put<Estimate>(`/estimates/${id}`, data);
}

export function setEstimateStatus(id: string, status: string): Promise<Estimate> {
    return post<Estimate>(`/estimates/${id}/status`, { status });
}

export function unlockEstimate(id: string): Promise<Estimate> {
    return post<Estimate>(`/estimates/${id}/unlock`);
}

export function duplicateEstimate(id: string): Promise<Estimate> {
    return post<Estimate>(`/estimates/${id}/duplicate`);
}

export function versionEstimate(id: string): Promise<Estimate> {
    return post<Estimate>(`/estimates/${id}/version`);
}

export function recalcEstimate(id: string): Promise<Estimate> {
    return post<Estimate>(`/estimates/${id}/recalc`);
}

export function quickstartEstimate(id: string, data: { catalog_node_name: string; max_items?: number }): Promise<Estimate> {
    return post<Estimate>(`/estimates/${id}/quickstart`, data);
}

export function exportEstimate(id: string, outputPath?: string): Promise<{ path: string }> {
    return post<{ path: string }>(`/estimates/${id}/export`, outputPath ? { output_path: outputPath } : {});
}

// ─── Line Items ───
export function addLineItem(estimateId: string, data: AddLineItemRequest): Promise<LineItem> {
    return post<LineItem>(`/estimates/${estimateId}/line-items`, data);
}

export function updateLineItem(estimateId: string, lineItemId: string, data: UpdateLineItemRequest): Promise<LineItem> {
    return put<LineItem>(`/estimates/${estimateId}/line-items/${lineItemId}`, data);
}

export function deleteLineItem(estimateId: string, lineItemId: string): Promise<void> {
    return del<void>(`/estimates/${estimateId}/line-items/${lineItemId}`);
}

export function reorderLineItem(estimateId: string, lineItemId: string, newIndex: number): Promise<void> {
    return post<void>(`/estimates/${estimateId}/line-items/${lineItemId}/reorder`, { new_index: newIndex });
}

export function groupLineItems(estimateId: string, data: { group_name: string; line_item_id?: string }): Promise<void> {
    return post<void>(`/estimates/${estimateId}/line-items/group`, data);
}
