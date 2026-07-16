import { createStart, createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// Server functions (calls made from the client via createServerFn, e.g.
// sendContactMessageAction) are POSTed to `/_serverFn/<id>` and expect their
// response to be a serialized success/error payload that TanStack Start's
// RPC client can parse back into the original thrown Error (so
// `onError: (e) => toast.error(e.message)` keeps working).
//
// This middleware used to swallow every thrown error — including ordinary,
// expected ones like "message required" or "Unauthorized" — and replace the
// response with an HTML error page. When that HTML page landed on a server
// function call, the client couldn't parse it as the expected RPC payload,
// so the mutation's onError handler received something without a usable
// `.message`, which is why the UI showed the unhelpful "[object Object]"
// error instead of the real message.
//
// Now we only render the HTML fallback page for actual page/document
// requests. Server function requests always get their real error rethrown
// so TanStack Start can serialize it properly for the client.
function isServerFnRequest(url: string) {
  return url.includes("/_serverFn/");
}

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    const request = getRequest();
    if (request?.url && isServerFnRequest(request.url)) {
      throw error;
    }
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
