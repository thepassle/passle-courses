import mongoose from 'mongoose';

const activationTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    unique: true
  },
  expireAt: { type: Date, default: Date.now, index: { expires: '15m' } },
});


let ActivationToken;
try {
  ActivationToken = mongoose.model('activationToken');
} catch {
  ActivationToken = mongoose.model('activationToken', activationTokenSchema);
}

export { ActivationToken };