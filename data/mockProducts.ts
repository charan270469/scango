
import { Product } from '../types';

/**
 * These products correspond directly to the barcode images provided.
 * 1. 8901088136945 (Tata Salt)
 * 2. 8901296038567 (Bru Coffee)
 * 3. 8904256023283 (Dabur Red)
 * 4. 9556781001107 (Maggi)
 * 5. 8902519002983 (Parle-G)
 * 6. 8901725013745 (Lizol)
 */
export const mockProducts: Product[] = [
  {
    id: 'dm-001',
    barcode: '8901088136945',
    name: 'Tata Salt Vacuum Evaporated',
    brand: 'Tata Consumer Products',
    weight: '1kg',
    mrp: 28,
    discount: 10,
    price: 25.2,
    category: 'Staples',
    imageUrl: 'https://images.unsplash.com/photo-1518110903427-0ac99672692e?auto=format&fit=crop&w=200&h=200'
  },
  {
    id: 'dm-002',
    barcode: '8901296038567',
    name: 'Bru Instant Coffee Powder',
    brand: 'Hindustan Unilever',
    weight: '100g',
    mrp: 245,
    discount: 15,
    price: 208.25,
    category: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=200&h=200'
  },
  {
    id: 'dm-003',
    barcode: '8904256023283',
    name: 'Dabur Red Ayurvedic Paste',
    brand: 'Dabur India',
    weight: '200g',
    mrp: 125,
    discount: 12,
    price: 110,
    category: 'Personal Care',
    imageUrl: 'https://images.unsplash.com/photo-1559591937-e68214c549b2?auto=format&fit=crop&w=200&h=200'
  },
  {
    id: 'dm-004',
    barcode: '9556781001107',
    name: 'Maggi 2-Minute Masala Noodles',
    brand: 'Nestle',
    weight: '70g',
    mrp: 14,
    discount: 0,
    price: 14,
    category: 'Instant Food',
    imageUrl: 'https://images.unsplash.com/photo-1612927335702-582178379c2e?auto=format&fit=crop&w=200&h=200'
  },
  {
    id: 'dm-005',
    barcode: '8902519002983',
    name: 'Parle-G Glucose Biscuits',
    brand: 'Parle Products',
    weight: '800g',
    mrp: 90,
    discount: 5,
    price: 85.5,
    category: 'Biscuits',
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=200&h=200'
  },
  {
    id: 'dm-006',
    barcode: '8901725013745',
    name: 'Lizol Disinfectant Surface Cleaner',
    brand: 'Reckitt Benckiser',
    weight: '500ml',
    mrp: 115,
    discount: 8,
    price: 105.8,
    category: 'Household',
    imageUrl: 'https://images.unsplash.com/photo-1584622781564-1d9876a13d00?auto=format&fit=crop&w=200&h=200'
  }
];
