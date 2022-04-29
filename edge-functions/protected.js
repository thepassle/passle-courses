import { verify } from "https://deno.land/x/djwt@v2.4/mod.ts";

const encoder = new TextEncoder();
const keyBuf = encoder.encode(Deno.env.get('JWT_SECRET'));
const key = await crypto.subtle.importKey( "raw", keyBuf, {name: "HMAC", hash: "SHA-256"}, true, ["sign", "verify"]);

export default async (req, context) => {
  const url = new URL(req.url);
  const protectedRoutes = new URLPattern({pathname: '/protected/:img'});
  const match = protectedRoutes.exec(url);

  if(match) {
    try {
      const jwt = context?.cookies?.get('jwt') ?? '';
      await verify(jwt, key);
      return;
    } catch(e) {
      return new Response(null, {status: 403});
    }
  }

  return;
};
