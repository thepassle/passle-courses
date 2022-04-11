import mongoose from 'mongoose';
import { User } from '../db/User.js';
import { Authorization, ContentType } from '../utils/auth.js';

export async function post(_, req) {
  const body = await req.json();

  const transactionRequest = await fetch(`https://api.mollie.com/v2/payments/${body.id}`,
    { headers: { 'Authorization': `Bearer ${import.meta.env.MOLLIE_API_KEY}` } }
  );

  if (transactionRequest.ok) {
    const transaction = await transactionRequest.json();

    /**
     * This is only for development purposes, because Mollie can't reach
     * the webhook url if its running locally. This way, I can do some tests in webhook-test.astro
     * 
     * Make sure this check ONLY passes during local dev! 
     */
    if (import.meta.env.ENV === 'dev' && body.mock) {
      transaction.status = body.status;
      transaction.sequenceType = body.sequenceType;
    }

    const { status, customerId } = transaction;

    try {
      await mongoose.connect(import.meta.env.MONGODB_ADDON_URI);
    } catch {
      throw new Error('Failed to connect to db.');
    }

    const mollieId = customerId;

    let mongoUser;
    try {
      mongoUser = await User.findOne({ mollieId });
    } catch {
      throw new Error('Failed to find db user.');
    }

    /**
     * Payment === canceled OR failed
     * 
     * If a recurring payment is canceled or failed, we want to cancel the subscription
     * In dutch we say "voor niks gaat de zon op"
     */
    if (status === 'canceled' || status === 'failed') {
      if (transaction.sequenceType === 'recurring') {
        const cancelRequest = await fetch(`https://api.mollie.com/v2/customers/${mongoUser.mollieId}/subscriptions/${mongoUser.subscriptionId}`,
          {
            method: 'DELETE',
            headers: { ...Authorization },
          });
        if (cancelRequest.ok) {
          try {
            mongoUser.subscriptionActive = false;
            mongoUser.subscriptionId = '';
            await mongoUser.save();
          } catch (e) {
            throw new Error('Failed to save user to db after cancelling subscription.');
          }
        } else {
          throw new Error('Failed to call cancel subscription endpoint after cancelled payment.');
        }
      }
    }

    /**
     * Payment === paid
     */
    if (status === 'paid') {
      if (transaction.sequenceType === 'first') {
        try {
          const mandatesRequest = await fetch(`https://api.mollie.com/v2/customers/${mollieId}/mandates`,
            {
              headers: { ...Authorization }
            });

          if (mandatesRequest.ok) {
            const mandates = await mandatesRequest.json();
            const mandate = mandates._embedded.mandates.find(({ status }) => status === 'pending' || status === 'valid');

            if (!mandate) {
              throw new Error('No valid or pending mandate found. Set up first payment for customer.');
            } else {
              const createSubscriptionRequest = await fetch(`https://api.mollie.com/v2/customers/${mollieId}/subscriptions`,
                {
                  method: 'POST',
                  headers: {
                    ...Authorization,
                    ...ContentType,
                  },
                  body: JSON.stringify({
                    amount: {
                      value: '10.00',
                      currency: 'EUR',
                    },
                    interval: '1 month',
                    description: import.meta.env.MOLLIE_SUBSCRIPTION_DESCRIPTION,
                    ...(import.meta.env.ENV !== 'dev' ? { webhookUrl: `${import.meta.env.APP_URL}/mollie/webhook` } : {}),
                  })
                });

              if (createSubscriptionRequest.ok) {
                const subscription = await createSubscriptionRequest.json();
                try {
                  mongoUser.subscriptionActive = true;
                  mongoUser.subscriptionId = subscription.id;
                  await mongoUser.save();
                } catch {
                  throw new Error('Failed to save subscription id on the db user.');
                }
              } else {
                throw new Error('Failed to create subscription.');
              }
            }
          } else {
            throw new Error('Mandates request failed.');
          }
        } catch {
          throw new Error(`Failed to get mongo user for id "${mollieId}" and payment id "${body.id}"`);
        }
      }
    }
  } else {
    throw new Error(`Failed to get transaction ${body.id}`);
  }

  return new Response(null, { status: 200 });
}