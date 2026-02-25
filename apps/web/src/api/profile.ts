import { get, put } from './client';
import type { UserProfile, UpdateProfileRequest } from './types';

export function getProfile(): Promise<UserProfile> {
    return get<UserProfile>('/profile');
}

export function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    return put<UserProfile>('/profile', data);
}
