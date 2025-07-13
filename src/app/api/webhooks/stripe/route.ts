import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const secret = process.env.NEXT_STRIPE_WEBHOOK_SECRET!;
  const sig = req.headers.get('stripe-signature')!;
  const rawBody = await req.arrayBuffer();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(Buffer.from(rawBody), sig, secret);
  } catch (err: any) {
    console.error('❌ Webhook error:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = session.metadata?.customerId;

    console.log('✅ Stripe Checkout Completed for:', customerId);

    try {
      const user = await prisma.user.findUnique({ where: { id: customerId } });
      if (!user) throw new Error('User not found');

      const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: true,
              digitalVariant: true,
              printVariant: true,
            },
          },
        },
      });

      if (!cart) throw new Error('Cart not found');

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          total: session.amount_total! / 100,
          status: 'COMPLETED',
        },
      });

      for (const item of cart.items) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            type: item.digitalVariant ? 'DIGITAL' : 'PRINT',
            price: item.price,
            quantity: item.quantity,
          },
        });
      }

      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

      console.log('✅ Order created and cart cleared');
    } catch (err: any) {
      console.error('❌ DB error:', err.message);
      return NextResponse.json({ error: 'Order processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
