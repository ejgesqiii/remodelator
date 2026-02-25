import { get, post } from './client';
import type { CatalogTreeNode, CatalogItem } from './types';

export function getCatalogTree(): Promise<CatalogTreeNode[]> {
    return get<CatalogTreeNode[]>('/catalog/tree');
}

export function searchCatalog(query: string): Promise<CatalogItem[]> {
    return get<CatalogItem[]>(`/catalog/search?query=${encodeURIComponent(query)}`);
}

export function upsertCatalogItem(data: Record<string, unknown>): Promise<CatalogItem> {
    return post<CatalogItem>('/catalog/upsert', data);
}

export function importCatalog(data: Record<string, unknown>): Promise<{ inserted: number; updated: number }> {
    return post<{ inserted: number; updated: number }>('/catalog/import', data);
}
