import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemSettings extends Document {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: 'pricing' | 'features' | 'limits' | 'integrations' | 'notifications' | 'general';
  description?: string;
  isPublic: boolean; // Can be accessed by frontend
  updatedBy: string; // Admin ID
  updatedAt: Date;
  createdAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json', 'array'],
    required: true
  },
  category: {
    type: String,
    enum: ['pricing', 'features', 'limits', 'integrations', 'notifications', 'general'],
    default: 'general'
  },
  description: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Add indexes
systemSettingsSchema.index({ key: 1 });
systemSettingsSchema.index({ category: 1 });
systemSettingsSchema.index({ isPublic: 1 });

// Static method to get setting value
systemSettingsSchema.statics.getSetting = async function(key: string, defaultValue?: any) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Static method to set setting value
systemSettingsSchema.statics.setSetting = async function(
  key: string, 
  value: any, 
  adminId: string, 
  options?: { 
    type?: string; 
    category?: string; 
    description?: string; 
    isPublic?: boolean; 
  }
) {
  const setting = await this.findOneAndUpdate(
    { key },
    {
      value,
      type: options?.type || typeof value,
      category: options?.category || 'general',
      description: options?.description,
      isPublic: options?.isPublic || false,
      updatedBy: adminId
    },
    { 
      upsert: true, 
      new: true 
    }
  );
  return setting;
};

// Static method to get all public settings
systemSettingsSchema.statics.getPublicSettings = async function() {
  const settings = await this.find({ isPublic: true });
  const result: Record<string, any> = {};
  settings.forEach((setting: any) => {
    result[setting.key] = setting.value;
  });
  return result;
};

// Static method to get settings by category
systemSettingsSchema.statics.getSettingsByCategory = async function(category: string) {
  const settings = await this.find({ category });
  const result: Record<string, any> = {};
  settings.forEach((setting: any) => {
    result[setting.key] = setting.value;
  });
  return result;
};

export default mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);