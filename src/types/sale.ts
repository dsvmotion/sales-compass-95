// Real sale data from WooCommerce
export interface Sale {
  id: string;
  orderId: string;
  customerName: string;
  customerType: 'pharmacy' | 'client';
  address: string;
  city: string;
  province: string;
  country: string;
  lat: number;
  lng: number;
  amount: number;
  date: string;
  products: string[];
}
