// Cloudflare Pages Function to proxy API requests
const BACKEND_URL = 'http://72.61.174.204:8301';

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': url.origin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Frappe-CSRF-Token',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // Build the backend URL
    const backendUrl = BACKEND_URL + url.pathname + url.search;

    // Forward request to backend
    const backendRequest = new Request(backendUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    });

    try {
        const response = await fetch(backendRequest);

        // Clone response and add CORS headers
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', url.origin);
        newHeaders.set('Access-Control-Allow-Credentials', 'true');

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
