import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
}

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

export async function POST(request: NextRequest) {
    const stripe = getStripe();
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!,
        );
    } catch {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.user_id;
            if (userId) {
                await supabaseAdmin
                    .from("profiles")
                    .update({
                        plan: "pro",
                        stripe_customer_id: session.customer as string,
                    })
                    .eq("id", userId);
            }
            break;
        }

        case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            const customerId = sub.customer as string;
            await supabaseAdmin
                .from("profiles")
                .update({ plan: "free" })
                .eq("stripe_customer_id", customerId);
            break;
        }

        case "customer.subscription.updated": {
            const sub = event.data.object as Stripe.Subscription;
            const customerId = sub.customer as string;
            const plan = sub.status === "active" ? "pro" : "free";
            await supabaseAdmin
                .from("profiles")
                .update({ plan })
                .eq("stripe_customer_id", customerId);
            break;
        }
    }

    return NextResponse.json({ received: true });
}
