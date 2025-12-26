// Cloudflare Pages Function to proxy API requests to Frappe backend
const BACKEND_URL = 'http://72.61.174.204:8301';

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': url.origin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Frappe-CSRF-Token, Cookie',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // Build the backend URL
    const backendUrl = BACKEND_URL + url.pathname + url.search;

    // Create headers for backend request
    const headers = new Headers();

    // Forward essential headers
    for (const [key, value] of request.headers.entries()) {
        // Skip host header as we're changing the destination
        if (key.toLowerCase() !== 'host') {
            headers.set(key, value);
        }
    }

    // Set the correct host for the backend
    headers.set('Host', '72.61.174.204:8301');
    headers.set('Origin', 'http://72.61.174.204:8301');
    headers.set('Referer', 'http://72.61.174.204:8301/');

    // Forward request to backend
    const backendRequest = new Request(backendUrl, {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    });

    try {
        const response = await fetch(backendRequest);

        // Clone response and add CORS headers
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', url.origin);
        newHeaders.set('Access-Control-Allow-Credentials', 'true');

        // Forward Set-Cookie headers properly
        const cookies = response.headers.get('Set-Cookie');
        if (cookies) {
            newHeaders.set('Set-Cookie', cookies);
        }

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
