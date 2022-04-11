import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid'
import { isLoggedIn, Authorization, ContentType } from '../utils/auth.js';
import { User } from '../db/User.js';
import { ActivationToken } from '../db/ActivationToken.js';

export async function get(_, req) {
  const user = await isLoggedIn(req);

  if(!user.authed) {
    return new Response(null, {status: 302, headers: {'Location': '/error?code=AUTH'}});
  }
  
  try {
    await mongoose.connect(import.meta.env.MONGODB_ADDON_URI);
  } catch {
    return new Response(null, {status: 302, headers: {'Location': '/error?code=DB_CON'}});
  }

  /** First try to see if the mongo user has a mollie ID */
  let hasMollieId = false;
  let mongoUser = false
  try {
    mongoUser = await User.findOne({id: user.id});
  } catch {
    /** No mongoUser found */
  }

  hasMollieId = !!mongoUser?.mollieId;

  /** No mollie id exists yet, and we have a mongoUser, we need to create a mollie user */
  let mollieUser;
  if(!hasMollieId && !!mongoUser) {
    try {
      const mollieUserRequest = await fetch('https://api.mollie.com/v2/customers', 
        {
          method: 'POST',
          headers: {
            ...Authorization,
            ...ContentType
          },
          body: JSON.stringify({
            ...({email: user?.email} || {}),
            ...({name: user?.name} || {}),
          })
        });
      
      if(mollieUserRequest.ok) {
        mollieUser = await mollieUserRequest.json();
        
        try {
          mongoUser.mollieId = mollieUser.id;
          await mongoUser.save();
        } catch(e) {
          throw new Error('SAVE_MOLLIE_ID_DB');
        }
      } else {
        throw new Error('CREATE_MOLLIE_FAILED');
      }
    } catch(e) {
      return new Response(null, {status: 302, headers: {'Location': `/error?code=${e.message}`}});
    }
  }

  let mollieId;
  if(hasMollieId) {
    mollieId = mongoUser.mollieId;
  } else {
    mollieId = mollieUser.id;
  }

  /**
   * We don't want anyone to just navigate to the `/mollie/payment-cb` and have a subscription activated
   * So we store a token, and in the `/mollie/[token]/payment-cb` we check to see if the token exists/is valid
   */
  const token = uuid();
  await ActivationToken.create({token});

  const createPaymentRequest = await fetch('https://api.mollie.com/v2/payments', 
    {
      method: 'POST',
      headers: {
        ...Authorization,
        ...ContentType
      },
      body: JSON.stringify({
        amount: {
          currency: 'EUR',
          value: '10.00'
        },
        customerId: mollieId,
        sequenceType: 'first',
        description: import.meta.env.MOLLIE_FIRST_DESCRIPTION,
        // @TODO deployment url
        ...(import.meta.env.ENV !== 'dev' ? {webhookUrl: `${import.meta.env.APP_URL}/mollie/webhook`} : {}),
        redirectUrl: `${import.meta.env.APP_URL}/mollie/${token}/payment-cb`,
      }),
    });
  
  if(createPaymentRequest.ok) {
    const payment = await createPaymentRequest.json();
    const redirectUrl = payment._links.checkout.href;
    return new Response(null, {status: 302, headers: {'Location': redirectUrl}});
  } else {
    return new Response(null, {status: 302, headers: {'Location': `/error?code=CREATE_PAYMENT_FAILED`}});
  }
}
