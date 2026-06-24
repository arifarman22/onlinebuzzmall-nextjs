import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'user' | 'admin';
    } & DefaultSession['user'];
  }
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  mobile: string | null;
  balance: number;
  freeze_amount: number;
  image: string | null;
  status: number;
  ev: number;
  sv: number;
  plan_id: number;
  total_invest: number;
  total_ref_com: number;
  total_binary_com: number;
  commission: number;
  daily_order_limit: number;
  created_at: Date;
}

export interface OrderCompleteItem {
  id: number;
  order_set_id: number | null;
  user_id: number;
  order_id: number;
  order_no: string | null;
  price: number;
  profit: number;
  balance: number;
  order_count: number;
  evaluation: string | null;
  type: string | null;
  status: number;
  end_at: Date | null;
  created_at: Date;
}

export interface TransactionItem {
  id: number;
  user_id: number;
  amount: number;
  charge: number;
  post_balance: number;
  trx_type: string | null;
  trx: string | null;
  details: string | null;
  remark: string | null;
  created_at: Date;
}

export interface PlatformItem {
  id: number;
  name: string;
  image: string | null;
  description: string | null;
  status: number;
}

export interface ProductItem {
  id: number;
  platform_id: number;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  status: number;
}

export interface DepositItem {
  id: number;
  user_id: number;
  method_code: number | null;
  amount: number;
  charge: number;
  final_amo: number;
  trx: string | null;
  status: number;
  created_at: Date;
}

export interface WithdrawalItem {
  id: number;
  user_id: number;
  method_id: number | null;
  amount: number;
  charge: number;
  final_amount: number;
  trx: string | null;
  status: number;
  created_at: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
