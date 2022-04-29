import { verify, validate, decode } from "https://deno.land/x/djwt@v2.4/mod.ts";

const encoder = new TextEncoder()
var keyBuf = encoder.encode(Deno.env.get('JWT_SECRET'));

var key = await crypto.subtle.importKey(
  "raw",
  keyBuf,
  {name: "HMAC", hash: "SHA-256"},
  true,
  ["sign", "verify"],
);

export default async (req, context) => {
  const url = new URL(req.url);
  const protectedRoutes = new URLPattern({pathname: '/protected/:img'});
  const match = protectedRoutes.exec(url);

  const jwt = context?.cookies?.get('jwt') ?? '';
  if(match) {
    try {
      console.log(1, 'verifying')
      const p = await verify(jwt, key);
      console.log(2, 'YES!', p)
      // await validate(decode(jwt));
      return;
    } catch(e) {
      console.log(3, 'nope');
      return new Response(null, {status: 403});
    }
  }

  return;
};
