import { ShopifyProduct } from '../types/shopify';
import { mockProducts } from '../data/mockProducts';

export class ShopifyService {
  private useMockData = false;

  async fetchProducts(): Promise<ShopifyProduct[]> {
    if (this.useMockData) {
      console.log('Using mock data for testing');
      return mockProducts;
    }

    try {
      console.log('Fetching products from backend proxy...');
      // Use environment variable for API URL or fallback to localhost
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/shopify/products`);
      
      if (!response.ok) {
        throw new Error(`Backend proxy error: ${response.status} ${response.statusText}`);
      }
      
      const products = await response.json();
      console.log(`Successfully fetched ${products.length} products from Shopify`);
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to mock data if API fails
      return mockProducts;
    }
  }
}
