import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true
  },
  username: {
    type: String,
  },
  subscriptionActive: {
    type: Boolean,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
  },
  mollieId: {
    type: String
  },
  subscriptionId: {
    type: String
  },
  picture: {
    type: String
  }
});

userSchema.statics.findOneOrCreate = async function findOneOrCreate(condition, doc) {
  let one;
  try {
    one = await this.findOne(condition);
  } catch {

  }

  return one || this.create(doc);
};

let User;
try {
  User = mongoose.model('user');
} catch {
  User = mongoose.model('user', userSchema);
}

export { User };