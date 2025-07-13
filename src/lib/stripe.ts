import Stripe from 'stripe';
// import 'dotenv/config';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-06-30.basil',
});
