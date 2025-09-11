import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: 'super_admin' | 'admin' | 'support';
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Admin ID who created this admin
}

const adminSchema = new Schema<IAdmin>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'support'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: [
      'view_users',
      'manage_users',
      'add_credits',
      'remove_credits',
      'view_pricing',
      'manage_pricing',
      'view_contacts',
      'manage_contacts',
      'view_support',
      'manage_support',
      'view_analytics',
      'manage_admins'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: String // Admin ID who created this admin
  }
}, {
  timestamps: true
});

// Add indexes
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });

// Virtual for default permissions based on role
adminSchema.virtual('defaultPermissions').get(function() {
  switch(this.role) {
    case 'super_admin':
      return [
        'view_users', 'manage_users', 'add_credits', 'remove_credits',
        'view_pricing', 'manage_pricing', 'view_contacts', 'manage_contacts',
        'view_support', 'manage_support', 'view_analytics', 'manage_admins'
      ];
    case 'admin':
      return [
        'view_users', 'manage_users', 'add_credits', 'remove_credits',
        'view_pricing', 'manage_pricing', 'view_contacts', 'manage_contacts',
        'view_support', 'manage_support', 'view_analytics'
      ];
    case 'support':
      return [
        'view_users', 'view_contacts', 'view_support', 'manage_support'
      ];
    default:
      return [];
  }
});

// Method to check if admin has permission
adminSchema.methods.hasPermission = function(permission: string): boolean {
  return this.permissions.includes(permission) || this.defaultPermissions.includes(permission);
};

// Method to get all permissions (explicit + default)
adminSchema.methods.getAllPermissions = function(): string[] {
  return [...new Set([...this.permissions, ...this.defaultPermissions])];
};

export default mongoose.models.Admin || mongoose.model<IAdmin>('Admin', adminSchema);