// Cloudflare Pages Function to proxy file/asset requests to Frappe backend
const BACKEND_URL = 'http://rentalgenie.srshti.co.in:8301';

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // Build the backend URL
    const backendUrl = BACKEND_URL + url.pathname + url.search;

    try {
        const response = await fetch(backendUrl);

        // Clone response headers
        const newHeaders = new Headers(response.headers);

        // Add cache headers for assets
        newHeaders.set('Cache-Control', 'public, max-age=31536000');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
        });
    } catch (error) {
        return new Response('Asset not found', { status: 404 });
    }
}
