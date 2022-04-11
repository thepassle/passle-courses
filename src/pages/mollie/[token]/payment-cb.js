import mongoose from 'mongoose';
import { User } from '../../db/User.js';
import { ActivationToken } from '../../db/ActivationToken.js';
import { isLoggedIn, createToken, createHeaders } from '../../utils/auth.js';

export async function get({token}, req) {
	const user = await isLoggedIn(req);

	await mongoose.connect(import.meta.env.MONGODB_ADDON_URI);

	const activationToken = await ActivationToken.findOne({token});
	if(!!activationToken) {
		const mongoUser = await User.findOne({id: user.id});
		mongoUser.subscriptionActive = true;
		await mongoUser.save();
		await ActivationToken.deleteOne({_id: activationToken._id});
	
		/** Create jwt */
		const jwt = createToken({
			name: mongoUser.username,
			email: mongoUser.email,
			picture: mongoUser.picture,
			id: mongoUser.id,
			active: true
		});
	
		/** Set headers */
		const headers = createHeaders({
			jwt, 
			active: true, 
			location: '/mollie/cb?code=FIRST_PAYMENT_OK'
		});
	
		return new Response(null, {
			status: 302,
			headers,
		});
	} else {
		return new Response(null, {status: 302, headers: {'Location': '/error?code=INVALID_ACTIVATION_TOKEN'}});
	}
}