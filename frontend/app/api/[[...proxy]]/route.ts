import { auth } from "@/lib/auth";

export const GET = async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  const baseUrl = process.env.SERVER_URL;

  const urlObj = new URL(req.url);
  const url = `${baseUrl}${urlObj.pathname}${urlObj.search}`;

  const contentType = req.headers.get("Content-Type");

  let body = undefined;
  try {
    if (req.method !== "GET") {
      if (contentType?.includes("multipart/form-data")) {
        body = await req.formData();
      } else {
        body = JSON.stringify(await req.json());
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {}

  const res = await fetch(url, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${session?.session?.token}`,
    },
    body,
  });

  const resContentType = res.headers.get("content-type");

  if (res.status == 204) {
    return new Response(null, { status: res.status });
  }

  if (resContentType?.includes("application/json")) {
    try {
      const data = await res.json();
      return Response.json(data, { status: res.status });
    } catch {
      return new Response(null, { status: res.status });
    }
  } else if (resContentType?.includes("text")) {
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": resContentType },
    });
  } else {
    const blob = await res.blob();
    return new Response(blob, {
      status: res.status,
      headers: { "Content-Type": resContentType || "application/octet-stream" },
    });
  }
};

export const POST = GET;
export const PUT = GET;
export const DELETE = GET;
export const PATCH = GET;