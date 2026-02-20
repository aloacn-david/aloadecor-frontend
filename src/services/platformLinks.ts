import { PlatformLinks } from '../types/shopify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// 获取所有平台链接
export async function getAllPlatformLinks(): Promise<Record<string, PlatformLinks>> {
  try {
    const response = await fetch(`${API_URL}/api/platform-links`);
    if (!response.ok) {
      throw new Error('Failed to fetch platform links');
    }
    return await response.json();
  } catch (error) {
    console.error('[PlatformLinks] Error fetching all links:', error);
    return {};
  }
}

// 获取单个产品的平台链接
export async function getProductPlatformLinks(productId: string | number): Promise<PlatformLinks> {
  try {
    const response = await fetch(`${API_URL}/api/platform-links/${productId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product platform links');
    }
    return await response.json();
  } catch (error) {
    console.error(`[PlatformLinks] Error fetching links for product ${productId}:`, error);
    return {
      amazon1: '',
      amazon2: '',
      wf1: '',
      wf2: '',
      os1: '',
      os2: '',
      hd1: '',
      hd2: '',
      lowes: '',
      target: '',
      walmart: '',
      ebay: '',
      kohls: ''
    };
  }
}

// 更新单个产品的平台链接
export async function updateProductPlatformLinks(
  productId: string | number, 
  links: PlatformLinks
): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/platform-links/${productId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(links),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update platform links');
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`[PlatformLinks] Error updating links for product ${productId}:`, error);
    return false;
  }
}

// 批量更新平台链接
export async function bulkUpdatePlatformLinks(
  links: Record<string, PlatformLinks>
): Promise<{ success: boolean; updatedCount: number }> {
  try {
    const response = await fetch(`${API_URL}/api/platform-links/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ links }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to bulk update platform links');
    }
    
    const result = await response.json();
    return {
      success: result.success,
      updatedCount: result.updatedCount || 0
    };
  } catch (error) {
    console.error('[PlatformLinks] Error bulk updating links:', error);
    return { success: false, updatedCount: 0 };
  }
}
