import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import Admin from '@/models/Admin';
import { connectToDatabase } from '@/lib/mongodb';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-super-secret-admin-jwt-key';
const COOKIE_NAME = 'admin_token';

export interface AdminAuthPayload {
  adminId: string;
  email: string;
  role: string;
  permissions: string[];
}

export class AdminAuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  static generateToken(admin: any): string {
    const payload: AdminAuthPayload = {
      adminId: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      permissions: admin.getAllPermissions()
    };

    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: '7d',
      issuer: 'admin-dashboard'
    });
  }

  // Verify JWT token
  static verifyToken(token: string): AdminAuthPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AdminAuthPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Authenticate admin login
  static async authenticate(email: string, password: string): Promise<{ admin: any; token: string } | null> {
    await connectToDatabase();
    
    const admin = await Admin.findOne({ 
      email: email.toLowerCase(), 
      isActive: true 
    });

    if (!admin) {
      return null;
    }

    const isValidPassword = await this.verifyPassword(password, admin.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = this.generateToken(admin);
    return { admin, token };
  }

  // Get admin from request
  static async getAdminFromRequest(request: NextRequest): Promise<any | null> {
    const token = request.cookies.get(COOKIE_NAME)?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    const payload = this.verifyToken(token);
    if (!payload) {
      return null;
    }

    await connectToDatabase();
    const admin = await Admin.findById(payload.adminId);
    
    if (!admin || !admin.isActive) {
      return null;
    }

    return admin;
  }

  // Check if admin has permission
  static async hasPermission(request: NextRequest, permission: string): Promise<boolean> {
    const admin = await this.getAdminFromRequest(request);
    if (!admin) {
      return false;
    }

    return admin.hasPermission(permission);
  }

  // Middleware helper for API routes
  static async requireAuth(request: NextRequest): Promise<{ admin: any } | { error: string; status: number }> {
    const admin = await this.getAdminFromRequest(request);
    
    if (!admin) {
      return { error: 'Unauthorized', status: 401 };
    }

    return { admin };
  }

  // Middleware helper for API routes with permission check
  static async requirePermission(
    request: NextRequest, 
    permission: string
  ): Promise<{ admin: any } | { error: string; status: number }> {
    const authResult = await this.requireAuth(request);
    
    if ('error' in authResult) {
      return authResult;
    }

    const { admin } = authResult;
    
    if (!admin.hasPermission(permission)) {
      return { error: 'Forbidden: Insufficient permissions', status: 403 };
    }

    return { admin };
  }

  // Create first admin (for initial setup)
  static async createFirstAdmin(
    email: string, 
    password: string, 
    name: string
  ): Promise<any> {
    await connectToDatabase();
    
    // Check if any admin exists
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      throw new Error('Admin already exists');
    }

    const passwordHash = await this.hashPassword(password);
    
    const admin = new Admin({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'super_admin',
      isActive: true
    });

    await admin.save();
    return admin;
  }

  // Initialize default system settings
  static async initializeDefaultSettings(): Promise<void> {
    const SystemSettings = require('@/models/SystemSettings').default;
    await connectToDatabase();

    const defaultSettings = [
      {
        key: 'assistant_base_cost',
        value: 20,
        type: 'number',
        category: 'pricing',
        description: 'Base cost for creating an assistant ($)',
        isPublic: true
      },
      {
        key: 'cost_per_minute_payg',
        value: 0.07,
        type: 'number',
        category: 'pricing',
        description: 'Cost per minute for pay-as-you-go users ($)',
        isPublic: true
      },
      {
        key: 'cost_per_minute_overage',
        value: 0.05,
        type: 'number',
        category: 'pricing',
        description: 'Cost per minute for subscription overage ($)',
        isPublic: true
      },
      {
        key: 'minimum_topup_amount',
        value: 5,
        type: 'number',
        category: 'pricing',
        description: 'Minimum credit top-up amount ($)',
        isPublic: true
      },
      {
        key: 'initial_payg_charge',
        value: 25,
        type: 'number',
        category: 'pricing',
        description: 'Initial charge for pay-as-you-go activation ($)',
        isPublic: true
      },
      {
        key: 'payg_initial_credits',
        value: 5,
        type: 'number',
        category: 'pricing',
        description: 'Initial credits included with PAYG activation ($)',
        isPublic: true
      }
    ];

    // Create first admin account
    const adminId = 'system-init';

    for (const setting of defaultSettings) {
      await SystemSettings.setSetting(
        setting.key,
        setting.value,
        adminId,
        {
          type: setting.type,
          category: setting.category,
          description: setting.description,
          isPublic: setting.isPublic
        }
      );
    }
  }
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;