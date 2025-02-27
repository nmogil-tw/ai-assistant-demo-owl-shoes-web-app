export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  smsOptIn: boolean;
  isStorePickup: boolean;
  storeId?: string;
  storeName?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  [key: string]: any;
}

// Updated to match database column names
export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  created_at?: string;
}

export interface OrderResponse {
  success: boolean;
  data: {
    id: string;
    [key: string]: any;
  };
  error?: string;
}

export interface StoreLocation {
  id: string;
  storeId: string;
  storeName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  hoursMonday: string;
  hoursTuesday: string;
  hoursWednesday: string;
  hoursThursday: string;
  hoursFriday: string;
  hoursSaturday: string;
  hoursSunday: string;
  hasParking: string;
  isWheelchairAccessible: string;
  storeManager: string;
  latitude: number;
  longitude: number;
}