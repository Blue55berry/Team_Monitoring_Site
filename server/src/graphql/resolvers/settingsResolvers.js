import { Settings } from '../../models/index.js';
import { requireAdminOrHR } from '../../middleware/rbac.js';

const settingsResolvers = {
  Query: {
    settings: async () => {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = await Settings.create({});
      }
      return settings;
    }
  },
  Mutation: {
    updateSettings: async (_, { input }, { user }) => {
      requireAdminOrHR(user);
      let settings = await Settings.findOne();
      if (!settings) {
        settings = new Settings();
      }
      if ('globalLocation' in input) {
        settings.globalLocation = input.globalLocation;
      }
      await settings.save();
      return settings;
    }
  }
};

export default settingsResolvers;
