import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
    try {
        const { priceId } = await request.json();
        if (!priceId) {
            return NextResponse.json({ error: "priceId required" }, { status: 400 });
        }

        // 현재 로그인 유저 확인
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
                },
            }
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: user.email,
            metadata: { user_id: user.id },
            success_url: `${origin}/dashboard?upgraded=true`,
            cancel_url: `${origin}/pricing`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err) {
        console.error("Stripe checkout error:", err);
        return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }
}
