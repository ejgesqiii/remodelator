import { get, post } from './client';
import type { CatalogTreeNode, CatalogItem } from './types';

export function getCatalogTree(): Promise<CatalogTreeNode[]> {
    return get<CatalogTreeNode[]>('/catalog/tree');
}

export function searchCatalog(query: string): Promise<CatalogItem[]> {
    return get<CatalogItem[]>(`/catalog/search?q=${encodeURIComponent(query)}`);
}

export function upsertCatalogItem(data: Record<string, unknown>): Promise<CatalogItem> {
    return post<CatalogItem>('/catalog/upsert', data);
}

export function importCatalog(data: Record<string, unknown>): Promise<{ imported: number }> {
    return post<{ imported: number }>('/catalog/import', data);
}
