import type { RequestHandler } from "msw";
import { http, HttpResponse } from "msw";

const successSessionId = "cs_test_success";

export const stripeHandlers: RequestHandler[] = [
  http.post("https://api.stripe.com/v1/checkout/sessions", async ({ request }) => {
    const body = await request.formData();
    const successUrl = body.get("success_url") as string;
    const responseUrl = successUrl.replace("{CHECKOUT_SESSION_ID}", successSessionId);

    return HttpResponse.json({
      id: successSessionId,
      url: responseUrl,
      mode: "payment",
    });
  }),
  http.get("https://api.stripe.com/v1/checkout/sessions/:id", ({ params }) => {
    const id = params.id as string;
    if (id !== successSessionId) {
      return new HttpResponse(JSON.stringify({ error: { message: "Not found" } }), { status: 404 });
    }

    return HttpResponse.json({
      id,
      mode: "payment",
      payment_status: "paid",
      metadata: {
        postId: "",
        userId: "",
      },
    });
  }),
];
