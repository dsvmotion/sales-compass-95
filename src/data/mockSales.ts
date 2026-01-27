// Demo sales data - when WooCommerce API is not available
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

// Spanish cities with their approximate coordinates
const spanishLocations = [
  { city: 'Madrid', province: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { city: 'Barcelona', province: 'Barcelona', lat: 41.3851, lng: 2.1734 },
  { city: 'Valencia', province: 'Valencia', lat: 39.4699, lng: -0.3763 },
  { city: 'Seville', province: 'Seville', lat: 37.3891, lng: -5.9845 },
  { city: 'Bilbao', province: 'Vizcaya', lat: 43.263, lng: -2.935 },
  { city: 'Málaga', province: 'Málaga', lat: 36.7213, lng: -4.4214 },
  { city: 'Zaragoza', province: 'Zaragoza', lat: 41.6488, lng: -0.8891 },
  { city: 'Murcia', province: 'Murcia', lat: 37.9922, lng: -1.1307 },
  { city: 'Palma', province: 'Balearic Islands', lat: 39.5696, lng: 2.6502 },
  { city: 'Las Palmas', province: 'Las Palmas', lat: 28.1235, lng: -15.4366 },
  { city: 'Alicante', province: 'Alicante', lat: 38.3452, lng: -0.4815 },
  { city: 'Córdoba', province: 'Córdoba', lat: 37.8882, lng: -4.7794 },
  { city: 'Valladolid', province: 'Valladolid', lat: 41.6523, lng: -4.7245 },
  { city: 'Granada', province: 'Granada', lat: 37.1773, lng: -3.5986 },
  { city: 'Oviedo', province: 'Asturias', lat: 43.3614, lng: -5.8493 },
];

const pharmacyNames = [
  'Farmacia Central', 'Farmacia del Sol', 'Farmacia San Miguel',
  'Farmacia Nueva', 'Farmacia Plus', 'Farmacia Moderna',
  'Farmacia del Carmen', 'Farmacia Santa Ana', 'Farmacia Europa',
  'Farmacia Universal', 'Farmacia del Mar', 'Farmacia Salud',
];

const clientNames = [
  'Hospital Universitario', 'Clínica San José', 'Centro Médico Regional',
  'Residencia de Ancianos Sol', 'Centro de Salud Municipal',
  'Clínica Dental Sonrisa', 'Centro Veterinario Plus',
];

const products = [
  'Vitamins', 'Pain Relief', 'Antibiotics', 'Allergy Meds',
  'Diabetes Supplies', 'First Aid', 'Skin Care', 'Eye Care',
];

// Generate random sales data
export function generateMockSales(count: number = 50): Sale[] {
  const sales: Sale[] = [];
  
  for (let i = 0; i < count; i++) {
    const location = spanishLocations[Math.floor(Math.random() * spanishLocations.length)];
    const isPharmacy = Math.random() > 0.3;
    const customerName = isPharmacy
      ? pharmacyNames[Math.floor(Math.random() * pharmacyNames.length)]
      : clientNames[Math.floor(Math.random() * clientNames.length)];
    
    // Add some variance to coordinates
    const latVariance = (Math.random() - 0.5) * 0.1;
    const lngVariance = (Math.random() - 0.5) * 0.1;
    
    // Random date in last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    // Random products (1-4 items)
    const numProducts = Math.floor(Math.random() * 4) + 1;
    const selectedProducts: string[] = [];
    for (let j = 0; j < numProducts; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      if (!selectedProducts.includes(product)) {
        selectedProducts.push(product);
      }
    }
    
    sales.push({
      id: `sale-${i + 1}`,
      orderId: `ORD-${1000 + i}`,
      customerName: `${customerName} ${location.city}`,
      customerType: isPharmacy ? 'pharmacy' : 'client',
      address: `Calle Principal ${Math.floor(Math.random() * 100) + 1}`,
      city: location.city,
      province: location.province,
      country: 'Spain',
      lat: location.lat + latVariance,
      lng: location.lng + lngVariance,
      amount: Math.floor(Math.random() * 2000) + 100,
      date: date.toISOString(),
      products: selectedProducts,
    });
  }
  
  return sales;
}

export const mockSales = generateMockSales(50);
