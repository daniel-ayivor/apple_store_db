import { Response } from 'express';
import { supabase } from '../service/supabase';
import { AuthRequest } from '../types';

export const cartController = {
  // Get user's cart
  async getCart(req: AuthRequest, res: Response) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (*)
        `)
        .eq('cart_id', req.user!.id);
      
      if (error) throw error;
      
      // Calculate total
      const total = data?.reduce((sum, item) => {
        return sum + (item.products.price * item.quantity);
      }, 0) || 0;
      
      res.json({
        success: true,
        cart: {
          items: data,
          total,
          itemCount: data?.length || 0
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Add item to cart
  async addToCart(req: AuthRequest, res: Response) {
    try {
      const { product_id, quantity = 1 } = req.body;
      
      // Check if item already in cart
      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', req.user!.id)
        .eq('product_id', product_id)
        .single();
      
      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: req.user!.id,
            product_id,
            quantity
          });
        
        if (error) throw error;
      }
      
      res.json({
        success: true,
        message: 'Item added to cart'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update cart item quantity
  async updateCartItem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      } else {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', id);
        
        if (error) throw error;
      }
      
      res.json({
        success: true,
        message: 'Cart updated'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Remove item from cart
  async removeFromCart(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      res.json({
        success: true,
        message: 'Item removed from cart'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Clear cart
  async clearCart(req: AuthRequest, res: Response) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', req.user!.id);
      
      if (error) throw error;
      
      res.json({
        success: true,
        message: 'Cart cleared'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};