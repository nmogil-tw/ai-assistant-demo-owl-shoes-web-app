/**
 * Generated TypeScript types for Talk Talk
 * Industry: telecommunications
 *
 * This file is auto-generated. Do not edit manually.
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  category: string;
  brand: string;
  speed: string;
  data_allowance: string;
  contract_months: number;
}

export interface Order {
  id: string;
  customer_id: string;
  email: string;
  phone: string;
  items: string;
  total_amount: number;
  shipping_status: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}
