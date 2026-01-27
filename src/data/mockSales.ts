export type CustomerType = 'pharmacy' | 'client';

export interface Sale {
  id: string;
  customerName: string;
  customerType: CustomerType;
  address: string;
  city: string;
  lat: number;
  lng: number;
  amount: number;
  date: string;
  products: number;
  orderId: string;
}

// Mock sales data - centered around Spain for demo
export const mockSales: Sale[] = [
  {
    id: '1',
    customerName: 'Farmacia Central',
    customerType: 'pharmacy',
    address: 'Calle Gran Vía 45',
    city: 'Madrid',
    lat: 40.4200,
    lng: -3.7050,
    amount: 1250.00,
    date: '2024-01-25',
    products: 15,
    orderId: 'WC-001234',
  },
  {
    id: '2',
    customerName: 'María García',
    customerType: 'client',
    address: 'Paseo de Gracia 78',
    city: 'Barcelona',
    lat: 41.3920,
    lng: 2.1649,
    amount: 89.99,
    date: '2024-01-24',
    products: 2,
    orderId: 'WC-001235',
  },
  {
    id: '3',
    customerName: 'Farmacia San Juan',
    customerType: 'pharmacy',
    address: 'Avenida de la Constitución 12',
    city: 'Sevilla',
    lat: 37.3886,
    lng: -5.9823,
    amount: 2100.50,
    date: '2024-01-24',
    products: 28,
    orderId: 'WC-001236',
  },
  {
    id: '4',
    customerName: 'Carlos Rodríguez',
    customerType: 'client',
    address: 'Calle Colón 33',
    city: 'Valencia',
    lat: 39.4702,
    lng: -0.3768,
    amount: 156.00,
    date: '2024-01-23',
    products: 4,
    orderId: 'WC-001237',
  },
  {
    id: '5',
    customerName: 'Farmacia Europa',
    customerType: 'pharmacy',
    address: 'Plaza del Pilar 5',
    city: 'Zaragoza',
    lat: 41.6561,
    lng: -0.8773,
    amount: 890.00,
    date: '2024-01-23',
    products: 12,
    orderId: 'WC-001238',
  },
  {
    id: '6',
    customerName: 'Ana Martínez',
    customerType: 'client',
    address: 'Calle Mayor 89',
    city: 'Bilbao',
    lat: 43.2630,
    lng: -2.9350,
    amount: 45.50,
    date: '2024-01-22',
    products: 1,
    orderId: 'WC-001239',
  },
  {
    id: '7',
    customerName: 'Farmacia del Mar',
    customerType: 'pharmacy',
    address: 'Paseo Marítimo 23',
    city: 'Málaga',
    lat: 36.7213,
    lng: -4.4214,
    amount: 1567.80,
    date: '2024-01-22',
    products: 20,
    orderId: 'WC-001240',
  },
  {
    id: '8',
    customerName: 'Pedro Sánchez',
    customerType: 'client',
    address: 'Calle Real 56',
    city: 'Murcia',
    lat: 37.9922,
    lng: -1.1307,
    amount: 210.00,
    date: '2024-01-21',
    products: 5,
    orderId: 'WC-001241',
  },
  {
    id: '9',
    customerName: 'Farmacia Santa María',
    customerType: 'pharmacy',
    address: 'Avenida de Portugal 78',
    city: 'A Coruña',
    lat: 43.3623,
    lng: -8.4115,
    amount: 678.90,
    date: '2024-01-21',
    products: 9,
    orderId: 'WC-001242',
  },
  {
    id: '10',
    customerName: 'Laura Fernández',
    customerType: 'client',
    address: 'Calle San Fernando 12',
    city: 'Alicante',
    lat: 38.3452,
    lng: -0.4815,
    amount: 320.00,
    date: '2024-01-20',
    products: 7,
    orderId: 'WC-001243',
  },
  {
    id: '11',
    customerName: 'Farmacia Plus',
    customerType: 'pharmacy',
    address: 'Gran Vía 123',
    city: 'Madrid',
    lat: 40.4250,
    lng: -3.7100,
    amount: 3200.00,
    date: '2024-01-20',
    products: 45,
    orderId: 'WC-001244',
  },
  {
    id: '12',
    customerName: 'José López',
    customerType: 'client',
    address: 'Rambla Catalunya 45',
    city: 'Barcelona',
    lat: 41.3880,
    lng: 2.1620,
    amount: 78.50,
    date: '2024-01-19',
    products: 2,
    orderId: 'WC-001245',
  },
  {
    id: '13',
    customerName: 'Farmacia Nueva',
    customerType: 'pharmacy',
    address: 'Calle Sierpes 67',
    city: 'Sevilla',
    lat: 37.3900,
    lng: -5.9900,
    amount: 1890.00,
    date: '2024-01-19',
    products: 25,
    orderId: 'WC-001246',
  },
  {
    id: '14',
    customerName: 'Elena Ruiz',
    customerType: 'client',
    address: 'Calle Larios 34',
    city: 'Málaga',
    lat: 36.7190,
    lng: -4.4200,
    amount: 145.00,
    date: '2024-01-18',
    products: 3,
    orderId: 'WC-001247',
  },
  {
    id: '15',
    customerName: 'Farmacia Vida',
    customerType: 'pharmacy',
    address: 'Plaza España 8',
    city: 'Valencia',
    lat: 39.4680,
    lng: -0.3750,
    amount: 2450.00,
    date: '2024-01-18',
    products: 32,
    orderId: 'WC-001248',
  },
];

export const getStats = (sales: Sale[]) => {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalOrders = sales.length;
  const pharmacySales = sales.filter(s => s.customerType === 'pharmacy');
  const clientSales = sales.filter(s => s.customerType === 'client');
  const pharmacyRevenue = pharmacySales.reduce((sum, sale) => sum + sale.amount, 0);
  const clientRevenue = clientSales.reduce((sum, sale) => sum + sale.amount, 0);
  
  return {
    totalRevenue,
    totalOrders,
    pharmacyCount: pharmacySales.length,
    clientCount: clientSales.length,
    pharmacyRevenue,
    clientRevenue,
    avgOrderValue: totalRevenue / totalOrders,
  };
};
