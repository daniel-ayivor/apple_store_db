import { Response } from 'express';
import { supabase } from '../service/supabase';
import { AuthRequest } from '../types';

export const orderController = {
  // Get user's orders
  async getUserOrders(req: AuthRequest, res: Response) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', req.user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      res.json({
        success: true,
        orders: data
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get single order
  async getOrderById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Check if user owns this order or is admin
      if (data.user_id !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
      
      res.json({
        success: true,
        order: data
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Create order
  async createOrder(req: AuthRequest, res: Response) {
    try {
      const { items, shipping_address } = req.body;
      
      // Calculate total amount
      let total_amount = 0;
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('price')
          .eq('id', item.product_id)
          .single();
        
        total_amount += (product?.price || 0) * item.quantity;
      }
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: req.user!.id,
          total_amount,
          shipping_address
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.price
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Clear user's cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', req.user!.id);
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update order status (admin only)
  async updateOrderStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      res.json({
        success: true,
        message: 'Order status updated',
        order: data
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};