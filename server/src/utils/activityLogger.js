import Activity from '../models/Activity.js';

export const logActivity = async ({ type, action, message, userId, metadata = {} }) => {
  try {
    const activity = new Activity({
      type,
      action,
      message,
      user: userId,
      metadata
    });
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Activity logging failed:', error);
  }
};
