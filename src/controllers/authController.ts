// import { Request, Response } from 'express';
// import { supabase } from '../service/supabase';
// import jwt from 'jsonwebtoken';
// import { AuthRequest } from '../types';

// export const authController = {
//   // Register new user
//   async register(req: Request, res: Response) {
//     try {
//       const { email, password, firstName, lastName } = req.body;
      
//       const { data, error } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
//           data: {
//             first_name: firstName,
//             last_name: lastName,
//           }
//         }
//       });
      
//       if (error) throw error;
      
//       res.status(201).json({
//         success: true,
//         message: 'User registered successfully',
//         user: data.user
//       });
//     } catch (error: any) {
//       res.status(400).json({ success: false, error: error.message });
//     }
//   },

//   // Login user
//   async login(req: Request, res: Response) {
//     try {
//       const { email, password } = req.body;
      
//       const { data, error } = await supabase.auth.signInWithPassword({
//         email,
//         password
//       });
      
//       if (error) throw error;
      
//       // Get user role from database
//       const { data: userData } = await supabase
//         .from('users')
//         .select('role')
//         .eq('id', data.user.id)
//         .single();
      
//       // Create JWT token
//       const token = jwt.sign(
//         { 
//           id: data.user.id, 
//           email: data.user.email,
//           role: userData?.role 
//         },
//         process.env.JWT_SECRET!,
//         { expiresIn: '7d' }
//       );
      
//       res.json({
//         success: true,
//         message: 'Login successful',
//         token,
//         user: {
//           id: data.user.id,
//           email: data.user.email,
//           role: userData?.role
//         }
//       });
//     } catch (error: any) {
//       res.status(401).json({ success: false, error: error.message });
//     }
//   },

//   // Get current user
//   async getMe(req: AuthRequest, res: Response) {
//     try {
//       const { data, error } = await supabase
//         .from('users')
//         .select('*')
//         .eq('id', req.user!.id)
//         .single();
      
//       if (error) throw error;
      
//       res.json({ success: true, user: data });
//     } catch (error: any) {
//       res.status(500).json({ success: false, error: error.message });
//     }
//   },

//   // Reset password
//   async resetPassword(req: Request, res: Response) {
//     try {
//       const { email } = req.body;
      
//       const { error } = await supabase.auth.resetPasswordForEmail(email, {
//         redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
//       });
      
//       if (error) throw error;
      
//       res.json({ success: true, message: 'Password reset email sent' });
//     } catch (error: any) {
//       res.status(400).json({ success: false, error: error.message });
//     }
//   },

//   // Logout
//   async logout(req: Request, res: Response) {
//     try {
//       const { error } = await supabase.auth.signOut();
//       if (error) throw error;
//       res.json({ success: true, message: 'Logged out successfully' });
//     } catch (error: any) {
//       res.status(500).json({ success: false, error: error.message });
//     }
//   },

//   // Change password
//   async changePassword(req: AuthRequest, res: Response) {
//     try {
//       const { currentPassword, newPassword } = req.body;
      
//       // First verify current password by signing in
//       const { error: signInError } = await supabase.auth.signInWithPassword({
//         email: req.user!.email,
//         password: currentPassword
//       });
      
//       if (signInError) throw new Error('Current password is incorrect');
      
//       // Update password
//       const { error } = await supabase.auth.updateUser({
//         password: newPassword
//       });
      
//       if (error) throw error;
      
//       res.json({ success: true, message: 'Password changed successfully' });
//     } catch (error: any) {
//       res.status(400).json({ success: false, error: error.message });
//     }
//   }
// };



import { Request, Response } from 'express';
import { supabase } from '../service/supabase';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

export const authController = {
  // Register new user - FIXED: Now inserts into users table
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      console.log('📝 Registration attempt:', { email, firstName, lastName });
      
      // 1. Create user in Supabase Auth
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
      
      if (!data.user) {
        throw new Error('User creation failed');
      }
      
      console.log('✅ Auth user created:', data.user.id);
      
      // 2. Insert into your public.users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          role: 'customer',
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('❌ Failed to insert into users table:', insertError);
        // Don't throw - user already created in auth
      } else {
        console.log('✅ User inserted into public.users table');
      }
      
      // 3. Create a cart for the user
      const { error: cartError } = await supabase
        .from('cart')
        .insert({
          user_id: data.user.id
        });
      
      if (cartError) {
        console.error('❌ Failed to create cart:', cartError);
      } else {
        console.log('✅ Cart created for user');
      }
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: data.user.id,
          email: data.user.email,
          role: 'customer'
        }
      });
      
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // Login user - FIXED: Creates user record if missing
  // async login(req: Request, res: Response) {
  //   try {
  //     const { email, password } = req.body;
      
  //     console.log('🔐 Login attempt:', email);
      
  //     // 1. Authenticate with Supabase
  //     const { data, error } = await supabase.auth.signInWithPassword({
  //       email,
  //       password
  //     });
      
  //     if (error) throw error;
      
  //     console.log('✅ Auth successful:', data.user.id);
      
  //     // 2. Get or create user in public.users table
  //     let userRole = 'customer';
  //     let { data: userData, error: userError } = await supabase
  //       .from('users')
  //       .select('role')
  //       .eq('id', data.user.id)
  //       .single();
      
  //     // 3. If user doesn't exist in public table, create them
  //     if (userError || !userData) {
  //       console.log('⚠️ User not in public table, creating now...');
        
  //       const { error: insertError } = await supabase
  //         .from('users')
  //         .insert({
  //           id: data.user.id,
  //           email: data.user.email,
  //           first_name: data.user.user_metadata?.first_name || null,
  //           last_name: data.user.user_metadata?.last_name || null,
  //           role: 'customer',
  //           created_at: new Date().toISOString()
  //         });
        
  //       if (insertError) {
  //         console.error('❌ Failed to create user record:', insertError);
  //       } else {
  //         console.log('✅ User created in public table during login');
  //         userRole = 'customer';
  //       }
  //     } else {
  //       userRole = userData.role;
  //     }
      
  //     // 4. Create JWT token
  //     const token = jwt.sign(
  //       { 
  //         id: data.user.id, 
  //         email: data.user.email,
  //         role: userRole 
  //       },
  //       process.env.JWT_SECRET!,
  //       { expiresIn: '7d' }
  //     );
      
  //     console.log('✅ Login successful, role:', userRole);
      
  //     res.json({
  //       success: true,
  //       message: 'Login successful',
  //       token,
  //       user: {
  //         id: data.user.id,
  //         email: data.user.email,
  //         role: userRole
  //       }
  //     });
      
  //   } catch (error: any) {
  //     console.error('❌ Login error:', error);
  //     res.status(401).json({ success: false, error: error.message });
  //   }
  // },


  async login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', email);
    
    // 1. Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    console.log('✅ Auth successful:', data.user.id);
    
    // 2. IMPORTANT: Fetch role from your users table (not from auth)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();
    
    // Get the role from database
    let userRole = 'customer';
    if (!userError && userData) {
      userRole = userData.role;
      console.log('📊 Role from database:', userRole);
    } else {
      console.log('⚠️ User not found in users table, creating...');
      
      // Create user if doesn't exist
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          first_name: data.user.user_metadata?.first_name || null,
          last_name: data.user.user_metadata?.last_name || null,
          role: 'customer',
          created_at: new Date().toISOString()
        });
      
      if (!insertError) {
        console.log('✅ User created in users table');
      }
      userRole = 'customer';
    }
    
    // 3. Create JWT token with the role from database
    const token = jwt.sign(
      { 
        id: data.user.id, 
        email: data.user.email,
        role: userRole  // THIS MUST BE FROM DATABASE
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    console.log('✅ Login successful, role returned:', userRole);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole
      }
    });
    
  } catch (error: any) {
    console.error('❌ Login error:', error);
    res.status(401).json({ success: false, error: error.message });
  }
},


// Add to authController.ts for debugging
async debugRole(req: Request, res: Response) {
  try {
    const { email } = req.query;
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email);
    
    res.json({
      success: true,
      users: data,
      error: error?.message
    });
  } catch (error: any) {
    res.json({ error: error.message });
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