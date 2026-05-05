import { Response } from 'express';

import { AuthRequest } from '../types';
import { supabase } from '../service/supabase';

export const userController = {
  async getProfile(req: AuthRequest, res: Response) {
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

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const { first_name, last_name, phone, location, bio } = req.body;
      
      const { error } = await supabase
        .from('users')
        .update({ first_name, last_name, phone, location, bio })
        .eq('id', req.user!.id);
      
      if (error) throw error;
      res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async deleteAccount(req: AuthRequest, res: Response) {
    try {
      const { error } = await supabase.auth.admin.deleteUser(req.user!.id);
      if (error) throw error;
      res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};