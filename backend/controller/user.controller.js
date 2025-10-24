// import models from '../models/index.js';
// const { User, Role, UserProfile } = models;
// import bcrypt from 'bcryptjs';
// const saltRounds = 10;
// import jwt from 'jsonwebtoken';
// import dotenv from 'dotenv';
// dotenv.config();
// const SECRET_KEY = process.env.JWT_SECRET; // Store this in an environment variable for security


// export const registerUser = async (req, res, next) => {
//   try {
//     const { username, password, email } = req.body;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);
//     const newUser = await User.create({ username, passwordHash: hashedPassword, email });
//     res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
    
//   } catch (error) {
//     res.status(500).json({ message: 'Error registering user', error: error.message });
//   }
// };


// export const loginUser = async (req, res, next) => {
//   try {
//     const { username, password } = req.body;
//     const user = await User.findOne({ where: { username } });
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid username or password' });
//     }
//     const isMatch = await bcrypt.compare(password, user.passwordHash);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Invalid username or password' });
//     }
//     const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
//     res.status(200).json({ message: 'Login successful', token });
//   } catch (error) {
//     res.status(500).json({ message: 'Error logging in', error: error.message });
//   }
// };


