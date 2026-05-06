import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

// ✅ This properly extends Express Request
export interface AuthRequest extends Request {
  user?: AuthUser;
  params: Request['params'];
  body: Request['body'];
  headers: Request['headers'];
}

// Rest of your types
export interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: 'admin' | 'customer';
  created_at: string;
  phone?: string;
  location?: string;
  bio?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  original_price: number | null;
  category: string;
  brand: string;
  rating: number;
  reviews: number;
  description: string | null;
  image_url: string | null;
  in_stock: boolean;
  created_at: string;
}

export interface Order {
  id: number;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: any;
  created_at: string;
}