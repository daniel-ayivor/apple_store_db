import { Request, Response } from 'express';
import { supabase } from '../service/supabase';
import { AuthRequest } from '../types';

export const productController = {
  // Get all products
  async getAllProducts(req: Request, res: Response) {
    try {
      const { category, brand, minPrice, maxPrice, search, limit = 50, page = 1 } = req.query;
      
      let query = supabase.from('products').select('*', { count: 'exact' });
      
      // Apply filters
      if (category) query = query.eq('category', category);
      if (brand) query = query.eq('brand', brand);
      if (minPrice) query = query.gte('price', minPrice);
      if (maxPrice) query = query.lte('price', maxPrice);
      if (search) query = query.ilike('name', `%${search}%`);
      
      // Pagination
      const from = (Number(page) - 1) * Number(limit);
      const to = from + Number(limit) - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      res.json({
        success: true,
        products: data,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil((count || 0) / Number(limit))
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get single product with details
  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Get product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (productError) throw productError;
      
      // Get product images
      const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id);
      
      // Get product colors
      const { data: colors } = await supabase
        .from('product_colors')
        .select('*')
        .eq('product_id', id);
      
      // Get product variants
      const { data: variants } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id);
      
      // Get product specs
      const { data: specs } = await supabase
        .from('product_specs')
        .select('*')
        .eq('product_id', id);
      
      res.json({
        success: true,
        product: {
          ...product,
          images,
          colors,
          variants,
          specs
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Create product (admin only)
  async createProduct(req: AuthRequest, res: Response) {
    try {
      const { 
        name, price, original_price, category, brand, 
        description, in_stock, images, colors, variants, specs 
      } = req.body;
      
      // Insert product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name,
          price,
          original_price,
          category,
          brand,
          description,
          in_stock: in_stock ?? true
        })
        .select()
        .single();
      
      if (productError) throw productError;
      
      // Insert images
      if (images && images.length > 0) {
        const imagesData = images.map((url: string) => ({
          product_id: product.id,
          image_url: url
        }));
        await supabase.from('product_images').insert(imagesData);
      }
      
      // Insert colors
      if (colors && colors.length > 0) {
        await supabase.from('product_colors').insert(
          colors.map((color: any) => ({ ...color, product_id: product.id }))
        );
      }
      
      // Insert variants
      if (variants && variants.length > 0) {
        await supabase.from('product_variants').insert(
          variants.map((name: string) => ({ product_id: product.id, variant_name: name }))
        );
      }
      
      // Insert specs
      if (specs && specs.length > 0) {
        await supabase.from('product_specs').insert(
          specs.map((spec: any) => ({ ...spec, product_id: product.id }))
        );
      }
      
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update product (admin only)
  async updateProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      res.json({
        success: true,
        message: 'Product updated successfully',
        product: data
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Delete product (admin only)
  async deleteProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get products by category
  async getProductsByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('in_stock', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      res.json({
        success: true,
        products: data,
        category
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get featured products
  async getFeaturedProducts(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('rating', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      res.json({
        success: true,
        products: data
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};