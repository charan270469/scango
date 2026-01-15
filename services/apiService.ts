import { supabase, isSupabaseConfigured } from './supabase';
import { dbEngine, SQL_ReceiptStatus } from '../data/sqlDb'; // Keep as offline fallback
import { Product, Counter, PaymentMethod, Order, OrderStatus, CartItem, Store, Employee } from '../types';
import { API_CONFIG } from './config';

// --- MOCK DATA FOR UI ---
export const mockStores: Store[] = [
  { id: 'store-001', name: 'ScanGo Malad West', address: 'Link Road, Malad West, Mumbai', location: { lat: 19.1860, lng: 72.8485 } },
  { id: 'store-002', name: 'ScanGo Powai (Premium)', address: 'Hiranandani Gardens, Powai, Mumbai', location: { lat: 19.1197, lng: 72.9051 } },
  { id: 'store-003', name: 'ScanGo Thane (Wholesale)', address: 'Ghodbunder Road, Thane West', location: { lat: 19.2183, lng: 72.9781 } }
];

let counters: Counter[] = [
  { id: 'c1', number: 1, queueSize: 8, isActive: true },
  { id: 'c2', number: 2, queueSize: 3, isActive: true },
  { id: 'c3', number: 3, queueSize: 12, isActive: true },
  { id: 'c4', number: 4, queueSize: 1, isActive: true },
];

// --- API SERVICES ---

// New OTP API Service with Robust Error Handling
export const otpApi = {
  sendOtp: async (mobileNumber: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Short timeout to detect backend down quickly
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${API_CONFIG.BASE_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        // If server responds with error (e.g. 500 from Twilio), try to read message
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn("Backend Unreachable or Error:", error);
      // Fallback for demo when backend is offline or network fails
      await new Promise(r => setTimeout(r, 800)); 
      return { success: true, message: "OTP sent (Offline Mode)" };
    }
  },

  verifyOtp: async (mobileNumber: string, otp: string): Promise<{ success: boolean; message: string }> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${API_CONFIG.BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, otp }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn("Backend Unreachable or Error:", error);
      await new Promise(r => setTimeout(r, 800));
      
      // Offline Validation Logic
      if (otp === '123456') {
        return { success: true, message: "Verified (Offline Mode)" };
      }
      return { success: false, message: "Invalid OTP (Simulation: Try 123456)" };
    }
  }
};

export const authApi = {
  login: async (employeeId: string, password: string): Promise<Employee | null> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('password', password) // Note: In production, hash passwords!
        .single();
      
      if (data) {
        return { id: data.employee_id, name: data.name, role: 'CASHIER' };
      }
    } 
    
    // Fallback Mock Login
    if (employeeId === 'admin' && password === '1234') {
      return { id: 'emp-001', name: 'Demo Employee', role: 'CASHIER' };
    }

    return null;
  }
};

export const storeApi = {
  getNearestStore: async (lat: number, lng: number): Promise<Store> => {
    // For now, return mock stores as geolocation logic is usually client-side calculation
    // or requires a geospatial PostGIS query which is advanced.
    await new Promise(r => setTimeout(r, 600));
    return mockStores[0]; 
  },
  getStores: async (): Promise<Store[]> => {
    return mockStores;
  }
};

export const productApi = {
  fetchByBarcode: async (barcode: string, storeId: string): Promise<Product | null> => {
    // 1. Check if Supabase is set up
    if (!isSupabaseConfigured()) {
      console.warn("⚠️ Supabase keys missing. Using Offline Data.");
      return dbEngine.queryProductByBarcode(barcode, storeId);
    }

    try {
      // 2. Query Master Table
      const { data: masterData, error: masterError } = await supabase
        .from('product_master')
        .select('*')
        .eq('barcode', barcode)
        .single();

      if (masterError || !masterData) {
        console.log("Product not found in master");
        return null;
      }

      // 3. Query Store Price (Inventory)
      const { data: storeData, error: storeError } = await supabase
        .from('store_inventory')
        .select('store_price, store_discount')
        .eq('store_id', storeId)
        .eq('barcode', barcode)
        .single();

      // Default to MRP if not in specific store inventory
      const price = storeData ? storeData.store_price : masterData.base_mrp;
      const discount = storeData ? storeData.store_discount : 0;

      return {
        id: masterData.id,
        barcode: masterData.barcode,
        name: masterData.name,
        brand: masterData.brand,
        weight: masterData.weight,
        category: masterData.category,
        imageUrl: masterData.image_url,
        mrp: masterData.base_mrp,
        price: Number(price),
        discount: Number(discount)
      };

    } catch (err) {
      console.error("Supabase Error:", err);
      return null;
    }
  }
};

export const queueApi = {
  getOptimalCounter: async (): Promise<Counter> => {
    // Simple client-side logic for now
    const active = counters.filter(c => c.isActive);
    return active.reduce((prev, curr) => (prev.queueSize < curr.queueSize ? prev : curr));
  }
};

export const historyApi = {
  getOrders: (): Order[] => {
    // Reads from LocalStorage for the current user's history
    try {
      const stored = localStorage.getItem('dmart_orders_db');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }
};

export const checkoutApi = {
  createOrder: async (items: CartItem[], paymentMethod: PaymentMethod, storeName: string): Promise<Order> => {
    const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalDiscount = items.reduce((acc, item) => acc + ((item.mrp - item.price) * item.quantity), 0);
    const receiptNumber = `RCP-${Math.floor(100000 + Math.random() * 900000)}`;
    const storeId = mockStores.find(s => s.name === storeName)?.id || 'store-001';
    
    // CASH = PENDING, UPI/CARD = PAID
    const status = paymentMethod === PaymentMethod.CASH ? OrderStatus.PENDING : OrderStatus.PAID;

    // --- 1. INSERT INTO SUPABASE (Real DB) ---
    if (isSupabaseConfigured()) {
       const { error } = await supabase
        .from('receipts')
        .insert([
          {
            receipt_number: receiptNumber,
            store_id: storeId,
            total_amount: totalAmount,
            payment_status: status,
            items_json: items, // Storing full cart for record
            exit_verification: false // Set to false when payment completes
          }
        ]);
        
        if (error) console.error("Failed to save to Cloud DB", error);
    } else {
       // Fallback for simulation
       dbEngine.insertReceiptStatus({
         receipt_number: receiptNumber,
         store_id: storeId,
         total_amount: totalAmount,
         payment_status: status,
         created_at: new Date().toISOString(),
         exit_verification: false // Set to false when payment completes
       });
    }

    // --- 2. Create Local Order Object (For UI) ---
    // Note: We don't assign specific counter ID anymore per requirement
    const orderId = `DM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const order: Order = {
      id: orderId,
      receiptNumber,
      storeName,
      items,
      totalAmount,
      totalDiscount,
      paymentMethod,
      status: status,
      timestamp: Date.now(),
      // Include receipt_number in QR payload so guards can query directly without local history
      qrPayload: JSON.stringify({ id: orderId, receipt: receiptNumber, v: 1, ts: Date.now(), sig: 'DMART_VALID' })
    };

    // Save to Local History
    const existingHistory = historyApi.getOrders();
    localStorage.setItem('dmart_orders_db', JSON.stringify([order, ...existingHistory]));

    return order;
  }
};

export const cashierApi = {
  // Cashier searches for a receipt (Real-time DB lookup)
  getReceiptStatus: async (receiptNumber: string): Promise<SQL_ReceiptStatus | null> => {
    
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('receipt_number', receiptNumber)
        .single();
      
      if (data) {
        return {
          receipt_number: data.receipt_number,
          store_id: data.store_id,
          total_amount: data.total_amount,
          payment_status: data.payment_status as OrderStatus,
          created_at: data.created_at,
          exit_verification: data.exit_verification ?? false
        };
      }
    } else {
       // Mock latency
       await new Promise(r => setTimeout(r, 200));
       return dbEngine.selectReceipt(receiptNumber);
    }
    return null;
  },

  // Cashier updates status to PAID (Updates Real DB)
  updatePaymentStatus: async (receiptNumber: string, status: OrderStatus): Promise<boolean> => {
    
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('receipts')
        .update({ payment_status: status })
        .eq('receipt_number', receiptNumber);
      
      return !error;
    } else {
      await new Promise(r => setTimeout(r, 500));
      return dbEngine.updateReceiptStatus(receiptNumber, status);
    }
  },

  // Guard updates exit_verification to true (Prevents bill reuse)
  updateExitVerification: async (receiptNumber: string): Promise<boolean> => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('receipts')
        .update({ exit_verification: true })
        .eq('receipt_number', receiptNumber);
      
      return !error;
    } else {
      await new Promise(r => setTimeout(r, 500));
      return dbEngine.updateExitVerification(receiptNumber);
    }
  }
};