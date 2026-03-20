import { ShopifyProduct } from '../types/shopify';
import { mockProducts } from '../data/mockProducts';

export class ShopifyService {
  private useMockData = false; // 默认使用API，API失败才用mock
  private apiTimeout = 30000; // 30秒超时

  async fetchProducts(): Promise<ShopifyProduct[]> {
    if (this.useMockData) {
      console.log('Using mock data for testing');
      return mockProducts.slice(0, 20); // 只加载前20个产品，避免性能问题
    }

    try {
      console.log('Fetching products from backend proxy...');
      // Use environment variable for API URL or fallback to production backend
      const apiUrl = import.meta.env.VITE_API_URL || 'https://aloadecor-backend-production.up.railway.app';
      
      // 添加超时控制器
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.apiTimeout);
      
      const response = await fetch(`${apiUrl}/api/shopify/products`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Backend proxy error: ${response.status} ${response.statusText}`);
      }
      
      const products = await response.json();
      console.log(`Successfully fetched ${products.length} products from Shopify`);
      return products; // 返回所有产品
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to mock data if API fails
      return mockProducts.slice(0, 20);
    }
  }
}
