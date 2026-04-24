const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { exec } = require('child_process');
const User = require('../models/User');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
        is_onboarded: user.is_onboarded,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
        is_onboarded: user.is_onboarded,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Utility function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'is_onboarded']
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    // Generate Alphanumeric "Mixture" Code
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let resetCode = '';
    for (let i = 0; i < 8; i++) {
      resetCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    user.resetCode = resetCode;
    user.resetCodeExpires = expiry;
    await user.save();

    // SIMULATION: Log the code
    console.log(`\n🔑 [FLOW PASS RESET] Mixture Code for ${email}: ${resetCode}\n`);
    
    // NODEMAILER IMPLEMENTATION
    try {
      let testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });

      let info = await transporter.sendMail({
        from: '"Flow Support" <support@flow.com>', // sender address
        to: email, // list of receivers
        subject: 'Your Flow Password Reset Code', // Subject line
        html: `<div style="font-family: sans-serif; padding: 2rem;">
                 <h2>Flow Security</h2>
                 <p>Your 8-character verification code is: <b style="font-size: 1.2rem; background: #eee; padding: 4px 8px; border-radius: 4px;">${resetCode}</b></p>
                 <p style="color: #888;">This code is valid for 24 hours. If you did not request this, please ignore this email.</p>
               </div>`, // html body
      });

      console.log('Message sent: %s', info.messageId);
      console.log('--- EMAIL URL PREVIEW LINK ---');
      const testUrl = nodemailer.getTestMessageUrl(info);
      console.log('Preview URL: %s', testUrl);
      console.log('------------------------------');
      
      // Auto-open browser for developer ease
      exec(`start "" "${testUrl}"`);
    } catch (mailError) {
      console.error('Error sending email:', mailError);
    }

    res.json({ message: 'An alphanumeric reset code has been sent to your email (Valid for 24h)' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || user.resetCode !== code || newPassword === undefined) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    if (new Date() > user.resetCodeExpires) {
      return res.status(400).json({ message: 'Reset code has expired' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, loginUser, getMe, forgotPassword, resetPassword };
