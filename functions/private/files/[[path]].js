// Cloudflare Pages Function to proxy /private/files requests to Frappe backend
const BACKEND_URL = 'http://rentalgenie.srshti.co.in:8301';

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // Build the backend URL
    const backendUrl = BACKEND_URL + url.pathname + url.search;

    // Forward cookies for private files
    const headers = new Headers();
    const cookie = request.headers.get('Cookie');
    if (cookie) {
        headers.set('Cookie', cookie);
    }

    try {
        const response = await fetch(backendUrl, { headers });

        const newHeaders = new Headers(response.headers);

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
        });
    } catch (error) {
        return new Response('Asset not found', { status: 404 });
    }
}
