// API Proxy - forwards all requests to backend
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

async function proxyRequest(req: NextRequest, method: string) {
  try {
    // Extract path after /api/
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api\//, '');
    const backendUrl = `${BACKEND_URL}/api/${path}${url.search}`;

    console.log(`[Proxy] ${method} ${path} -> ${backendUrl}`);

    // Forward headers (excluding host and connection headers)
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Get request body if present
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      body = await req.text();
    }

    // Make request to backend
    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
    });

    // Forward response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Return response
    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  return proxyRequest(req, 'GET');
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, 'POST');
}

export async function PUT(req: NextRequest) {
  return proxyRequest(req, 'PUT');
}

export async function PATCH(req: NextRequest) {
  return proxyRequest(req, 'PATCH');
}

export async function DELETE(req: NextRequest) {
  return proxyRequest(req, 'DELETE');
}
