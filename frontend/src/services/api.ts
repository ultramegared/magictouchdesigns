/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: api.ts
 * Module: Frontend / Services
 * Language: TypeScript
 * Description:
 * Central API client for communication with the Magic Touch Designs
 * backend.
 * ================================================================
 */

const API_BASE_URL = "https://api.magictouchdesigns.com";

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.message ||
            "API request failed"
        );
    }

    return data as T;
}

export async function checkApiHealth() {

    return apiRequest<{
        status: string;
        project: string;
        author: string;
    }>("/api/health");

}