/**
 * 内容管理服务
 * 与后端API交互
 */
import { ContentTypeConfig, ProductContentStatus, ContentStatusUpdate } from '../types/productContent';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class ContentService {
  /**
   * 获取所有产品内容状态
   */
  async getAllContentStatus(): Promise<ProductContentStatus[]> {
    const response = await fetch(`${API_BASE_URL}/api/content/status`);
    if (!response.ok) {
      throw new Error('Failed to fetch content status');
    }
    return response.json();
  }

  /**
   * 获取单个产品内容状态
   */
  async getProductContentStatus(productId: string): Promise<ProductContentStatus> {
    const response = await fetch(`${API_BASE_URL}/api/content/status/${productId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product content status');
    }
    return response.json();
  }

  /**
   * 更新产品内容状态
   */
  async updateProductContentStatus(
    productId: string, 
    updates: ContentStatusUpdate
  ): Promise<ProductContentStatus> {
    const response = await fetch(`${API_BASE_URL}/api/content/status/${productId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update content status');
    }
    return response.json();
  }

  /**
   * 获取内容类型配置
   */
  async getContentTypeConfigs(): Promise<ContentTypeConfig[]> {
    const response = await fetch(`${API_BASE_URL}/api/content/config/types`);
    if (!response.ok) {
      throw new Error('Failed to fetch content type configs');
    }
    return response.json();
  }

  /**
   * 批量更新内容状态
   */
  async batchUpdate(updates: Array<{product_id: string; status_updates: any}>, updatedBy?: string): Promise<ProductContentStatus[]> {
    const response = await fetch(`${API_BASE_URL}/api/content/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updates,
        updated_by: updatedBy
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to batch update content status');
    }
    return response.json();
  }

  /**
   * 删除产品内容状态
   */
  async deleteContentStatus(productId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/content/status/${productId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete content status');
    }
    const result = await response.json();
    return result.success;
  }
}

export const contentService = new ContentService();
