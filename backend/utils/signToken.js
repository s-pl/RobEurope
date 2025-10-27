import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET;

export function signToken  (payload)  {
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
  return token
}