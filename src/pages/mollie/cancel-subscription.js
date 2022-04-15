import mongoose from 'mongoose';
import { isLoggedIn, createToken, createHeaders, Authorization } from '../utils/auth.js';
import { User } from '../db/User.js';

export async function get(_, req) {
  const user = await isLoggedIn(req);

  try {
    await mongoose.connect(import.meta.env.MONGODB_ADDON_URI);
  } catch {
    return new Response(null, {status: 302, headers: {'Location': '/error?code=DB_CON'}});
  }
  
  let mongoUser;
  try {
    mongoUser = await User.findOne({id: user.id});
  } catch {
    return new Response(null, {status: 302, headers: {'Location': '/error?code=FAILED_TO_FIND_USER'}});
  }
  

  if(mongoUser) {
    const cancelRequest = await fetch(`https://api.mollie.com/v2/customers/${mongoUser.mollieId}/subscriptions/${mongoUser.subscriptionId}`,
      {
        method: 'DELETE',
        headers: { ...Authorization },
      });
    
    if(cancelRequest.ok) {
      try {
        mongoUser.subscriptionActive = false;
        mongoUser.subscriptionId = '';
        await mongoUser.save();
        
        
        /** We have to update the jwt now */
        const jwt = createToken({
          name: mongoUser.username,
          email: mongoUser.email,
          picture: mongoUser.picture,
          id: mongoUser.id,
          active: false
        });


        const headers = createHeaders({jwt, location: '/mollie/cb?code=CANCEL_OK'});

        return new Response(null, {status: 302, headers});
      } catch(e) {
        return new Response(null, {status: 302, headers: {'Location': '/error?code=CANCEL_DB_USER_SAVE_FAILED'}});
      }
    } else {
      return new Response(null, {status: 302, headers: {'Location': '/error?code=CANCEL_FAILED'}});
    }
  } else {
    return new Response(null, {status: 302, headers: {'Location': '/error?code=NO_DB_USER_FOUND'}});
  }
}
