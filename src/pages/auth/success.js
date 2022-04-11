import { OAuth2Client } from 'google-auth-library';
import mongoose from 'mongoose';
import { User } from '../db/User.js';
import { createToken, createHeaders } from '../utils/auth.js';

const CLIENT_ID=import.meta.env.SIGN_IN_WITH_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

export async function post(_, req) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const token = params.get('credential');

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  });
  const payload = ticket.getPayload();

  /** Find user, or create one if its a new sign in */
  await mongoose.connect(import.meta.env.MONGODB_ADDON_URI);
  const user = await User.findOneOrCreate(
    {
      id: payload.sub
    }, 
    {
      id: payload.sub,
      username: payload.name,
      email: payload.email,
      picture: payload.picture,
      subscriptionActive: false,
    }
  );

  const active = !!user?.subscriptionActive;

  const jwt = createToken({ ...payload, id: payload.sub, active });

  /** Set headers */
  const headers = createHeaders({active, jwt, location: '/'});

  return new Response(null, {
    status: 302,
    headers,
  });
}
