

import { Response } from 'express';
import { supabase } from '../service/supabase';
import { AuthRequest } from '../types';

export const adminController = {
  // Get all users
  async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      res.json({ 
        success: true, 
        users: data, 
        total: data?.length 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get user by ID - FIXED
  async getUserById(req: AuthRequest, res: Response) {
    try {
      // ✅ Fix: Ensure id is a string
      const id = req.params.id as string;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      res.json({ success: true, user: data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Create admin user
  async createAdmin(req: AuthRequest, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName
        }
      });
      
      if (authError) throw authError;
      
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role: 'admin'
        });
      
      if (userError) throw userError;
      
      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        user: authUser.user
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // Promote user to admin - FIXED
  async promoteToAdmin(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      
      const { error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', id);
      
      if (error) throw error;
      
      res.json({ 
        success: true, 
        message: 'User promoted to admin successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Demote admin to customer - FIXED
  async demoteToCustomer(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      
      const { error } = await supabase
        .from('users')
        .update({ role: 'customer' })
        .eq('id', id);
      
      if (error) throw error;
      
      res.json({ 
        success: true, 
        message: 'Admin demoted to customer successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Delete user - FIXED
  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      
      if (id === req.user!.id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete your own account' 
        });
      }
      
      const { error } = await supabase.auth.admin.deleteUser(id);
      
      if (error) throw error;
      
      res.json({ 
        success: true, 
        message: 'User deleted successfully' 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get dashboard stats
  async getStats(req: AuthRequest, res: Response) {
    try {
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
          *,
          users:user_id (email, first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered');
      
      const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      
      res.json({
        success: true,
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          pendingOrders,
          totalRevenue
        },
        recentOrders
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};