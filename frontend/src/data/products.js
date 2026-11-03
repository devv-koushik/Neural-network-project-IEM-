// Centralized mock product catalog. Replace with GET /api/products when Flask backend is ready.
import { Headphones, Watch, Shirt, Footprints, Sofa, Sparkles, Smartphone, Camera, Laptop, Backpack, Glasses, Gamepad2 } from 'lucide-react';

export const CATEGORIES = ['Electronics', 'Fashion', 'Shoes', 'Accessories', 'Home', 'Beauty'];

export const PRODUCTS = [
  { id: 'p1', name: 'Aurora Wireless ANC Headphones', category: 'Electronics', price: 179.99, rating: 4.7, reviews: 812, stock: 34, image: Headphones, color: '#5B6EF5', description: 'Adaptive noise cancellation with 40-hour battery life and spatial audio tuning for immersive listening on the move.', featured: true, tags: ['audio', 'wireless'] },
  { id: 'p2', name: 'Pulse Fitness Smartwatch', category: 'Electronics', price: 229.0, rating: 4.5, reviews: 634, stock: 21, image: Watch, color: '#2BD9A8', description: 'Continuous heart-rate and sleep tracking with a 10-day battery and always-on AMOLED display.', featured: true, tags: ['wearable'] },
  { id: 'p3', name: 'Nimbus Merino Wool Sweater', category: 'Fashion', price: 89.5, rating: 4.6, reviews: 245, stock: 58, image: Shirt, color: '#F5A623', description: 'Ultra-fine merino wool knit that regulates temperature and resists odor across seasons.', featured: false, tags: ['knitwear'] },
  { id: 'p4', name: 'Strato Trail Running Shoes', category: 'Shoes', price: 134.0, rating: 4.8, reviews: 921, stock: 12, image: Footprints, color: '#F5566B', description: 'Responsive foam midsole with a grippy lugged outsole built for mixed-terrain runs.', featured: true, tags: ['running'] },
  { id: 'p5', name: 'Voyage Leather Backpack', category: 'Accessories', price: 149.99, rating: 4.4, reviews: 388, stock: 44, image: Backpack, color: '#5B6EF5', description: 'Full-grain leather daypack with a padded 15" laptop sleeve and brass hardware.', featured: false, tags: ['bag'] },
  { id: 'p6', name: 'Haven Bouclé Accent Chair', category: 'Home', price: 349.0, rating: 4.3, reviews: 156, stock: 9, image: Sofa, color: '#2BD9A8', description: 'Curved bouclé upholstery on a solid oak frame — a statement seat for any reading corner.', featured: false, tags: ['furniture'] },
  { id: 'p7', name: 'Lumen Vitamin C Serum', category: 'Beauty', price: 42.0, rating: 4.6, reviews: 1204, stock: 87, image: Sparkles, color: '#F5A623', description: '15% stabilized vitamin C with ferulic acid to brighten tone and soften fine lines.', featured: true, tags: ['skincare'] },
  { id: 'p8', name: 'Halo 5G Smartphone', category: 'Electronics', price: 799.0, rating: 4.7, reviews: 2033, stock: 17, image: Smartphone, color: '#5B6EF5', description: '6.7" OLED display, triple-lens camera system, and all-day battery with fast charging.', featured: true, tags: ['phone'] },
  { id: 'p9', name: 'Aperture Mirrorless Camera', category: 'Electronics', price: 1099.0, rating: 4.9, reviews: 402, stock: 6, image: Camera, color: '#F5566B', description: '26MP sensor with in-body stabilization and 4K60 video for creators.', featured: false, tags: ['camera'] },
  { id: 'p10', name: 'Compile 14" Ultrabook', category: 'Electronics', price: 1299.0, rating: 4.5, reviews: 289, stock: 15, image: Laptop, color: '#5B6EF5', description: 'Fanless aluminum chassis, 18-hour battery, and a 2.8K touch display.', featured: false, tags: ['laptop'] },
  { id: 'p11', name: 'Meridian Polarized Sunglasses', category: 'Accessories', price: 68.0, rating: 4.2, reviews: 511, stock: 63, image: Glasses, color: '#F5A623', description: 'Acetate frame with polarized lenses that cut glare without distorting color.', featured: false, tags: ['eyewear'] },
  { id: 'p12', name: 'Sequence Pro Controller', category: 'Electronics', price: 74.99, rating: 4.6, reviews: 745, stock: 52, image: Gamepad2, color: '#2BD9A8', description: 'Hall-effect analog sticks and remappable back paddles for competitive play.', featured: false, tags: ['gaming'] },
  { id: 'p13', name: 'Drift Canvas Sneakers', category: 'Shoes', price: 79.0, rating: 4.3, reviews: 667, stock: 0, image: Footprints, color: '#5B6EF5', description: 'Low-profile canvas sneaker with a recycled-rubber sole for everyday wear.', featured: false, tags: ['casual'] },
  { id: 'p14', name: 'Solace Weighted Blanket', category: 'Home', price: 89.0, rating: 4.7, reviews: 933, stock: 28, image: Sofa, color: '#2BD9A8', description: 'Glass-bead filled 15lb blanket with a breathable cotton shell for deeper sleep.', featured: false, tags: ['bedding'] },
  { id: 'p15', name: 'Quartz Mineral Sunscreen', category: 'Beauty', price: 28.0, rating: 4.5, reviews: 1560, stock: 120, image: Sparkles, color: '#F5A623', description: 'SPF 50 mineral formula that leaves no white cast, reef-safe and fragrance-free.', featured: false, tags: ['skincare'] },
  { id: 'p16', name: 'Alpine Tailored Wool Coat', category: 'Fashion', price: 259.0, rating: 4.8, reviews: 198, stock: 14, image: Shirt, color: '#F5566B', description: 'Double-breasted wool-blend coat with a tailored silhouette for cold-weather layering.', featured: true, tags: ['outerwear'] },
];

export function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

export function getRelatedProducts(product, count = 4) {
  if (!product) return [];
  return PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category).slice(0, count);
}
