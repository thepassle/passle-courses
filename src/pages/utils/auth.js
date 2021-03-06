import { parse } from 'lightcookie';
import jwt from 'jsonwebtoken';

export const createToken = ({id, name, admin, email, active, picture}) => jwt.sign({id, name, admin, email, active, picture}, import.meta.env.JWT_SECRET, {expiresIn: '7d'});

export async function isLoggedIn(req) {
	let authed = false;
	let user = {};
	const cookie = req.headers.get('cookie');

	if(cookie) {
    const parsed = parse(cookie);
    if(parsed.jwt) {
      jwt.verify(parsed.jwt, import.meta.env.JWT_SECRET, (e, decoded) => {
        if(!e && !!decoded) {
          user = {
            name: decoded.name,
            email: decoded.email,
            picture: decoded.picture,
            active: decoded.active,
            id: decoded.id,
            admin: decoded.admin
          }
          authed = true;
        }
      });
    }
	}

	return {
		authed,
		...user
	}
}

function sevenDaysFromNow() {
  const d = new Date();
  const time = 7 * 24 * 60 * 60 * 1000
  d.setTime(d.getTime() + (time));
  return d.toUTCString();
}

export function createHeaders({jwt, location}) {
  const expires = sevenDaysFromNow();
  const headers = new Headers();
  
  headers.append('Set-Cookie', `jwt=${jwt}; Expires=${expires}; Path=/; HttpOnly; Secure;`);
  headers.append('Location', location);
  
  return headers;
}

export const Authorization = {'Authorization': `Bearer ${import.meta.env.MOLLIE_API_KEY}`};
export const ContentType = {'Content-Type': 'application/json'};