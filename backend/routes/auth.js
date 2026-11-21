const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'india-book-house-secret-key-2026';

// Register a new user account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, address, mobile_no, message_email } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required', 400);
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email is already taken
    const existingUser = await User.findOne({ where: { email: cleanEmail } });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists', 409);
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userRole = role ? role.toLowerCase() : 'admin';

    // Create user record in database
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: userRole,
      address: address ? address.trim() : null,
      mobile_no: mobile_no ? mobile_no.trim() : null,
      message_email: message_email ? message_email.trim() : cleanEmail
    });

    // Generate JWT token valid for 7 days
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return sendSuccess(res, {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      address: newUser.address,
      mobile_no: newUser.mobile_no,
      message_email: newUser.message_email,
      token
    }, 'User registered successfully', 201);
  } catch (error) {
    return sendError(res, 'Failed to register user', 500, error.message);
  }
});

// Authenticate user credentials and return JWT token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ where: { email: cleanEmail } });
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Verify hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Generate authentication token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return sendSuccess(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      mobile_no: user.mobile_no,
      message_email: user.message_email,
      token
    }, 'Login successful', 200);
  } catch (error) {
    return sendError(res, 'Server error during login', 500, error.message);
  }
});

// Generate password reset code valid for 15 minutes
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 'Please provide your registered email', 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: cleanEmail } });
    if (!user) {
      return sendError(res, 'No account found with this email', 404);
    }

    // Generate 6-digit verification code
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await user.update({
      reset_token: resetOtp,
      reset_token_expiry: expiry
    });

    return sendSuccess(res, {
      resetCode: resetOtp,
      email: cleanEmail,
      expiresIn: '15 minutes'
    }, 'Password reset code generated successfully. Valid for 15 minutes.', 200);
  } catch (error) {
    return sendError(res, 'Failed to generate reset code', 500, error.message);
  }
});

// Verify reset code and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return sendError(res, 'Email, resetCode, and newPassword are required', 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: cleanEmail } });

    if (!user || !user.reset_token) {
      return sendError(res, 'No active password reset request found', 400);
    }

    if (user.reset_token !== resetCode.toString().trim()) {
      return sendError(res, 'Invalid reset code', 400);
    }

    if (new Date() > new Date(user.reset_token_expiry)) {
      return sendError(res, 'Reset code has expired', 400);
    }

    // Hash new password and clear reset tokens
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null
    });

    return sendSuccess(res, null, 'Password reset successfully. You can now login.', 200);
  } catch (error) {
    return sendError(res, 'Failed to reset password', 500, error.message);
  }
});

// Fetch authenticated profile using Bearer JWT token
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Bearer token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role', 'address', 'mobile_no', 'message_email', 'createdAt']
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, user, 'User profile fetched successfully', 200);
  } catch (err) {
    return sendError(res, 'Invalid or expired token', 401, err.message);
  }
});

module.exports = router;
