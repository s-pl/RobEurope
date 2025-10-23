import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET; // Store this in an environment variable for security


export function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract the token from the Authorization header


  if (!token) return res.status(403).send('A token is required for authentication'); // Return error if no token


  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).send('Invalid Token'); // Return error if token is invalid


    req.user = user; // Attach user data to request object for use in route handlers
    next(); // Pass control to the next middleware or route handler
  });
}