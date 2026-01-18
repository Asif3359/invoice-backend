const { validationResult } = require("express-validator");
const User = require("../models/User");
const SubUser = require("../models/SubUser");
const Session = require("../models/Session");
const {
  generateTokenPair,
  verifyRefreshToken,
} = require("../utils/tokenGenerator");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/emailService");
const crypto = require("crypto");

/**
 * Register a new main user
 */
const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password, fullName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      phone,
      verificationToken,
    });

    await user.save();

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      userType: "main",
    };
    const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

    // Save session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const session = new Session({
      userId: user._id,
      userType: "main",
      refreshToken,
      deviceInfo: req.body.deviceInfo || {},
      ipAddress: req.ip,
      expiresAt,
    });
    await session.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.fullName);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email.",
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          emailVerified: user.emailVerified,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

/**
 * Login (main user or sub-user)
 */
const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password, userType = "main" } = req.body;

    // Find user based on type
    let user;
    if (userType === "sub") {
      user = await SubUser.findOne({ email: email.toLowerCase() }).populate(
        "parentUserId",
        "email fullName"
      );
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
    } else {
      user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact administrator.",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      userType: userType,
    };
    const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

    // Save session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const session = new Session({
      userId: user._id,
      userType: userType,
      refreshToken,
      deviceInfo: req.body.deviceInfo || {},
      ipAddress: req.ip,
      expiresAt,
    });
    await session.save();

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user:
          userType === "sub"
          ? { ...user.toJSON(), parentUser: user.parentUserId }
          : user.toJSON(),
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Check if session exists
    const session = await Session.findOne({ refreshToken: token });
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    // Verify user still exists and is active
    let user;
    if (decoded.userType === "sub") {
      user = await SubUser.findById(decoded.userId);
    } else {
      user = await User.findById(decoded.userId);
    }

    if (!user || !user.isActive) {
      // Delete session
      await Session.deleteOne({ refreshToken: token });
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    // Generate new access token
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      userType: decoded.userType,
    };
    const { accessToken } = generateTokenPair(tokenPayload);

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Token refresh failed",
    });
  }
};

/**
 * Logout (delete session)
 */
const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await Session.deleteOne({ refreshToken: token });
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    let user;
    if (req.userType === "sub") {
      user = await SubUser.findById(req.userId).populate(
        "parentUserId",
        "email fullName"
      );
    } else {
      user = await User.findById(req.userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        user:
          req.userType === "sub"
          ? { ...user.toJSON(), parentUser: user.parentUserId }
            : user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
};

/**
 * Request password reset
 */
const requestPasswordReset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, userType = "main" } = req.body;

    let user;
    if (userType === "sub") {
      user = await SubUser.findOne({ email: email.toLowerCase() });
    } else {
      user = await User.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: "If the email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpires = resetTokenExpires;
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(
        user.email,
        resetToken,
        user.fullName || user.name
      );
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Don't reveal if email failed for security
    }

    res.json({
      success: true,
      message: "If the email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset request failed",
    });
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { token, password, userType = "main" } = req.body;

    let user;
    if (userType === "sub") {
      user = await SubUser.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: new Date() },
      });
    } else {
      user = await User.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: new Date() },
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Hash new password
    const passwordHash = await User.hashPassword(password);

    // Update password and clear reset token
    user.passwordHash = passwordHash;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    // Delete all sessions for security
    await Session.deleteMany({ userId: user._id });

    res.json({
      success: true,
      message:
        "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};

/**
 * Verify email
 * Supports both GET (with token in URL) and POST (with token in body)
 */
const verifyEmail = async (req, res) => {
  try {
    // Support both URL params (GET) and body (POST) for mobile apps
    const token = req.params.token || req.body.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    const user = await User.findOne({
      verificationToken: token,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token",
      });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully",
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          emailVerified: user.emailVerified,
        },
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed",
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
};
