export interface User {
  id: number;
  username: string;
  full_name: string;
  role: "admin" | "manager" | "cashier";
}

export interface Product {
  id: number;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  category_id: number;
  category_name?: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface Transaction {
  id: number;
  transaction_code: string;
  user_id: number;
  customer_id?: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  cashier_name?: string;
  customer_name?: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
