// Cloudflare Worker to proxy API requests to Frappe backend
// Deploy this as a Cloudflare Worker and route /api/* to it

const BACKEND_URL = 'http://72.61.174.204:8301';

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Only handle /api requests
        if (!url.pathname.startsWith('/api')) {
            return new Response('Not Found', { status: 404 });
        }

        // Build the backend URL
        const backendUrl = BACKEND_URL + url.pathname + url.search;

        // Clone the request with the new URL
        const modifiedRequest = new Request(backendUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body,
            redirect: 'follow',
        });

        // Forward the request to the backend
        const response = await fetch(modifiedRequest);

        // Create a new response with CORS headers
        const modifiedResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });

        // Add CORS headers for the frontend
        modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
        modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Frappe-CSRF-Token');
        modifiedResponse.headers.set('Access-Control-Allow-Credentials', 'true');

        return modifiedResponse;
    },
};
