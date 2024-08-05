import { PaymentType } from '@/constants';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-hot-toast';

import clientConfig from '@/lib/config/clientConfig';

export const redirectToCheckout = async (
  userId: string,
  email: string,
  paymentType: PaymentType,
  discountCode?: string
) => {
  // Retrieve the price ID based on the payment type
  const priceId = paymentType === PaymentType.BASIC
    ? clientConfig().stripePriceIdBasic
    : paymentType === PaymentType.STANDARD
    ? clientConfig().stripePriceIdPlus
    : clientConfig().stripePriceIdPremium;

  // Load Stripe with the public key
  const stripe = await loadStripe(clientConfig().stripePublicKey);

  if (!stripe) {
    console.error('Stripe.js failed to load.');
    toast.error('Failed to load payment provider.');
    return;
  }

  // Make a POST request to your API endpoint to create a subscription
  try {
    const response = await fetch('/api/stripe/create_subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, priceId, email, discountCode, paymentType }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { sessionId } = await response.json();

    if (!sessionId) {
      throw new Error('No session ID received from server.');
    }

    // Redirect to Stripe checkout
    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
      console.error('Stripe Checkout Error:', error.message);
      toast.error('Checkout failed, please try again.');
    }
  } catch (error) {
    console.error('Error during checkout:', error);
    toast.error('An error occurred. Please try again.');
  }
};
