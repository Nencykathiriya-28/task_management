import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js';
import { getIO } from '../utils/socket.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'user',
        });
        
        getIO().emit('userAdded', {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });
        
        sendTokenResponse(user, 201, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
};

// @desc    Get current logged in user
// @route   POST /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all users (for task assignment)
// @route   GET /api/auth/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({ role: 'user' }).select('name email');

        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (err) {
        next(err);
    }
};
// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res, next) => {
    try {
        console.log(`Forgot password request for: ${req.body.email}`);
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            console.log(`User not found: ${req.body.email}`);
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        console.log(`User found: ${user.name}. Generating OTP...`);
        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();
        console.log('OTP saved to user document.');

        const message = `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`;
        const html = `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:16px;">
                <h2 style="color:#333;margin-bottom:8px;">Password Reset OTP</h2>
                <p style="color:#666;margin-bottom:24px;">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
                <div style="background:#f4f4f4;border-radius:12px;padding:24px;text-align:center;letter-spacing:8px;font-size:36px;font-weight:bold;color:#5C59D9;">
                    ${otp}
                </div>
                <p style="color:#999;margin-top:24px;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        `;

        try {
            console.log(`Attempting to send OTP email to: ${user.email}`);
            await sendEmail({
                email: user.email,
                subject: 'Your Password Reset OTP — TaskDashboard',
                message,
                html,
            });

            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (err) {
            console.error('EMAIL ERROR:', err.message);
            user.resetPasswordOTP = undefined;
            user.resetPasswordOTPExpire = undefined;

            await user.save();

            return res.status(500).json({ success: false, error: `Email error: ${err.message}` });
        }
    } catch (err) {
        next(err);
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verifyotp
// @access  Public
export const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
        }

        res.status(200).json({ success: true, data: 'OTP verified' });
    } catch (err) {
        next(err);
    }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword
// @access  Public
export const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, password } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
        }

        // Set new password
        user.password = password;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpire = undefined;

        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};
