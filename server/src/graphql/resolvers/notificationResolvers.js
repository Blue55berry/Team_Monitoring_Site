import { Notification } from '../../models/index.js';
import { requireAuth } from '../../middleware/rbac.js';

const notificationResolvers = {
  Query: {
    notifications: async (_, { unreadOnly }, { user }) => {
      requireAuth(user);
      const filter = { recipient: user._id };
      if (unreadOnly) filter.isRead = false;
      return Notification.find(filter).populate('recipient').sort({ createdAt: -1 }).limit(50);
    },
    unreadNotificationCount: async (_, __, { user }) => {
      requireAuth(user);
      return Notification.countDocuments({ recipient: user._id, isRead: false });
    }
  },
  Mutation: {
    markNotificationRead: async (_, { id }, { user }) => {
      requireAuth(user);
      return Notification.findByIdAndUpdate(id, { isRead: true }, { new: true }).populate('recipient');
    },
    markAllNotificationsRead: async (_, __, { user }) => {
      requireAuth(user);
      await Notification.updateMany({ recipient: user._id, isRead: false }, { isRead: true });
      return true;
    }
  }
};

export default notificationResolvers;
