import { Request, Response } from 'express';
import { supabase } from '../service/supabase';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

export const authController = {
  // Register new user
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });
      
      if (error) throw error;
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: data.user
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // Login user
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Get user role from database
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
      
      // Create JWT token
      const token = jwt.sign(
        { 
          id: data.user.id, 
          email: data.user.email,
          role: userData?.role 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      
      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: userData?.role
        }
      });
    } catch (error: any) {
      res.status(401).json({ success: false, error: error.message });
    }
  },

  // Get current user
  async getMe(req: AuthRequest, res: Response) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.user!.id)
        .single();
      
      if (error) throw error;
      
      res.json({ success: true, user: data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Reset password
  async resetPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });
      
      if (error) throw error;
      
      res.json({ success: true, message: 'Password reset email sent' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // Logout
  async logout(req: Request, res: Response) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Change password
  async changePassword(req: AuthRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // First verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: req.user!.email,
        password: currentPassword
      });
      
      if (signInError) throw new Error('Current password is incorrect');
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
};