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

const API_BASE_URL =
    "https://api.magictouchdesigns.com";


/*
|--------------------------------------------------------------------------
| API Request
|--------------------------------------------------------------------------
*/

/**
 * Sends a request to the Magic Touch Designs API.
 *
 * The authentication token is automatically included
 * when it exists in localStorage.
 */
export async function apiRequest<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {

    const token =
        localStorage.getItem(
            "auth_token"
        );


    /*
    |--------------------------------------------------------------------------
    | Headers
    |--------------------------------------------------------------------------
    */

    const headers =
        new Headers(
            options.headers
        );


    if (
        !headers.has(
            "Content-Type"
        ) &&
        options.body
    ) {

        headers.set(
            "Content-Type",
            "application/json"
        );

    }


    if (
        token &&
        !headers.has(
            "Authorization"
        )
    ) {

        headers.set(
            "Authorization",
            `Bearer ${token}`
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Request
    |--------------------------------------------------------------------------
    */

    let response: Response;


    try {

        response =
            await fetch(

                `${API_BASE_URL}${endpoint}`,

                {

                    ...options,

                    headers,

                }

            );

    } catch (error) {

        console.error(
            "API network error:",
            error
        );


        throw new Error(
            "Unable to connect to the server."
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Response Body
    |--------------------------------------------------------------------------
    */

    const contentType =
        response.headers.get(
            "content-type"
        );


    const isJson =
        contentType?.includes(
            "application/json"
        );


    const data =
        isJson
            ? await response.json()
            : null;


    /*
    |--------------------------------------------------------------------------
    | Error Response
    |--------------------------------------------------------------------------
    */

    if (!response.ok) {

        const message =
            data &&
            typeof data === "object" &&
            "message" in data
                ? String(
                    data.message
                )
                : (
                    response.status === 401
                        ? "Your session has expired. Please log in again."
                        : "API request failed."
                );


        if (
            response.status === 401
        ) {

            localStorage.removeItem(
                "auth_token"
            );

        }


        throw new Error(
            message
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Successful Response
    |--------------------------------------------------------------------------
    */

    return data as T;

}


/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

export async function checkApiHealth() {

    return apiRequest<{

        status: string;

        project: string;

        author: string;

        database?: string;

    }>(

        "/api/health"

    );

}