import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("paypal-transmission-sig");
    
    console.log("PayPal webhook received:", {
      signature,
      body: body.substring(0, 200) + "...",
    });

    const event = JSON.parse(body);
    
    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.CREATED":
        console.log("Subscription created:", event.resource);
        break;
      
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        console.log("Subscription activated:", event.resource);
        break;
      
      case "BILLING.SUBSCRIPTION.CANCELLED":
        console.log("Subscription cancelled:", event.resource);
        break;
      
      case "BILLING.SUBSCRIPTION.SUSPENDED":
        console.log("Subscription suspended:", event.resource);
        break;
      
      case "PAYMENT.SALE.COMPLETED":
        console.log("Payment completed:", event.resource);
        break;
      
      default:
        console.log("Unhandled event type:", event.event_type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}