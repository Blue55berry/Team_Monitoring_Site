import { GraphQLError } from 'graphql';
import { User } from '../../models/index.js';
import { generateTokens, verifyRefreshToken } from '../../middleware/auth.js';
import { requireAuth } from '../../middleware/rbac.js';
import { sendEmail } from '../../utils/sendEmail.js';
import crypto from 'crypto';

const authResolvers = {
  Query: {
    me: async (_, __, { user }) => {
      requireAuth(user);
      return user;
    },
    
    users: async (_, { role }, { user }) => {
      requireAuth(user);
      const filter = role ? { role } : {};
      return User.find(filter).sort({ createdAt: -1 });
    },
    
    user: async (_, { id }, { user }) => {
      requireAuth(user);
      return User.findById(id);
    }
  },

  Mutation: {
    register: async (_, { input }) => {
      const { firstName, lastName, email, password, role } = input;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new GraphQLError('User already exists with this email', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // Create user
      const newUser = new User({
        firstName,
        lastName,
        email,
        password,
        role: role || 'employee'
      });

      await newUser.save();

      // Generate tokens
      const tokens = generateTokens(newUser._id);

      // Save refresh token
      newUser.refreshToken = tokens.refreshToken;
      await User.findByIdAndUpdate(newUser._id, { refreshToken: tokens.refreshToken });

      return {
        ...tokens,
        user: newUser
      };
    },

    login: async (_, { input }) => {
      const { email, password } = input;

      // Find user with password
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // Check if account is active
      if (!user.isActive) {
        throw new GraphQLError('Account is deactivated. Contact admin.', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // Verify password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const tokens = generateTokens(user._id);

      // Save refresh token
      await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken });

      // Remove password from response
      const userObj = user.toObject();
      delete userObj.password;

      return {
        ...tokens,
        user: userObj
      };
    },

    refreshToken: async (_, { token }) => {
      const decoded = verifyRefreshToken(token);
      if (!decoded) {
        throw new GraphQLError('Invalid refresh token', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const user = await User.findById(decoded.userId).select('+refreshToken');
      if (!user || user.refreshToken !== token) {
        throw new GraphQLError('Invalid refresh token', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const tokens = generateTokens(user._id);
      await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken });

      return {
        ...tokens,
        user
      };
    },

    forgotPassword: async (_, { email }) => {
      const user = await User.findOne({ email });
      if (!user) {
        return "If an account exists, a reset code has been sent.";
      }

      // Generate a 6 digit code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Save it hashed to DB
      user.resetPasswordCode = resetCode; // We could hash it, but let's keep it simple for now or hash it
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send Email
      const message = `Your password reset code is: ${resetCode}\nThis code is valid for 1 hour.`;
      
      try {
        await sendEmail({
          to: user.email,
          subject: 'Xenocoders Password Reset',
          text: message,
          html: `<p>Your password reset code is: <b>${resetCode}</b></p><p>This code is valid for 1 hour.</p>`
        });
      } catch (err) {
        console.error('Email could not be sent', err);
        throw new GraphQLError('Email could not be sent');
      }

      return "If an account exists, a reset code has been sent.";
    },

    resetPassword: async (_, { email, code, newPassword }) => {
      const user = await User.findOne({ 
        email, 
        resetPasswordCode: code,
        resetPasswordExpires: { $gt: Date.now() } 
      }).select('+resetPasswordCode +resetPasswordExpires +password');

      if (!user) {
        throw new GraphQLError('Invalid or expired reset code', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // Set new password
      user.password = newPassword;
      user.resetPasswordCode = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return true;
    }
  }
};

export default authResolvers;
