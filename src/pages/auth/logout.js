export async function get() {
  const headers = new Headers();

  headers.append('Set-Cookie', 'jwt=""; Max-Age=1; Path=/; HttpOnly; Secure;');
  headers.append('Location', '/');

  return new Response(null, {
    status: 302,
    headers,
  });
}
