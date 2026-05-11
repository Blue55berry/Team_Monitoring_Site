import { GraphQLError } from 'graphql';
import { User } from '../../models/index.js';
import { generateTokens, verifyRefreshToken } from '../../middleware/auth.js';
import { requireAuth } from '../../middleware/rbac.js';

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
    }
  }
};

export default authResolvers;
