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
    "https://api.jqydesigns.com";


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
 *
 * Supports both JSON and FormData requests.
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


    const isFormData =
        options.body instanceof FormData;


    /*
    |--------------------------------------------------------------------------
    | CONTENT TYPE
    |--------------------------------------------------------------------------
    |
    | FormData must NOT have Content-Type
    | manually configured.
    |
    | The browser automatically adds the correct
    | multipart boundary.
    |
    */

    if (
        !isFormData &&
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


    /*
    |--------------------------------------------------------------------------
    | AUTHORIZATION
    |--------------------------------------------------------------------------
    */

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
    | REQUEST
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
    | RESPONSE BODY
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
    | ERROR RESPONSE
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

            localStorage.removeItem(
                "auth_user"
            );

        }


        throw new Error(
            message
        );

    }


    /*
    |--------------------------------------------------------------------------
    | SUCCESSFUL RESPONSE
    |--------------------------------------------------------------------------
    */

    return data as T;

}


/*
|--------------------------------------------------------------------------
| HEALTH CHECK
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