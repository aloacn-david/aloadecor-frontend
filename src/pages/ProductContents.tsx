import React, { useState, useEffect } from 'react';
import { ShopifyProduct } from '../types/shopify';
import { ContentTypeConfig, ProductContentStatus } from '../types/productContent';
import { contentService } from '../services/contentService';
import './ProductContents.css';

// 预定义内容配置
import { ContentType } from '../types/productContent';

const DEFAULT_CONTENT_CONFIGS = [
  { type: '全美国杰西' as ContentType, label: '全美国杰西', icon: '🇺🇸', color: '#4CAF50', order: 1 },
  { type: '全计价表' as ContentType, label: '全计价表', icon: '📊', color: '#2196F3', order: 2 },
  { type: '新品product sheet' as ContentType, label: '新品product sheet', icon: '📋', color: '#FF9800', order: 3 },
  { type: '新品调研' as ContentType, label: '新品调研', icon: '🔍', color: '#9C27B0', order: 4 },
  { type: '上传价核价' as ContentType, label: '上传价核价', icon: '💰', color: '#F44336', order: 5 },
  { type: '主图' as ContentType, label: '主图', icon: '🖼️', color: '#00BCD4', order: 6 },
  { type: '白底图' as ContentType, label: '白底图', icon: '⬜', color: '#795548', order: 7 },
  { type: '细节图' as ContentType, label: '细节图', icon: '🔍', color: '#607D8B', order: 8 },
  { type: '尺寸图' as ContentType, label: '尺寸图', icon: '📏', color: '#3F51B5', order: 9 },
  { type: '安装视频' as ContentType, label: '安装视频', icon: '🎬', color: '#E91E63', order: 10 },
  { type: '场景视频/网红视频' as ContentType, label: '场景视频/网红视频', icon: '🎥', color: '#FF5722', order: 11 },
  { type: '文字' as ContentType, label: '文字', icon: '📝', color: '#8BC34A', order: 12 },
  { type: '新品上架' as ContentType, label: '新品上架', icon: '✅', color: '#4CAF50', order: 13 },
];

// Mock产品数据 - 保底显示
const MOCK_PRODUCTS = [
  {
    id: 1,
    title: 'Modern Pendant Light',
    description: 'Elegant modern pendant light',
    images: [{ src: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400' }],
    variants: [{ title: 'Chrome', price: '129.99', sku: 'PEND-001-CHR' }],
    category: 'Pendant Lights',
    collections: [{ id: 1, title: 'Modern Lighting', handle: 'modern-lighting' }],
    platformLinks: {}
  },
  {
    id: 2,
    title: 'Crystal Chandelier',
    description: 'Stunning crystal chandelier',
    images: [{ src: 'https://images.unsplash.com/photo-1540932296774-3ed6915e7e64?w=400' }],
    variants: [{ title: 'Clear Crystal', price: '499.99', sku: 'CHAND-001-CLR' }],
    category: 'Chandeliers',
    collections: [{ id: 2, title: 'Luxury Lighting', handle: 'luxury-lighting' }],
    platformLinks: {}
  },
  {
    id: 3,
    title: 'Table Lamp',
    description: 'Modern table lamp for bedroom',
    images: [{ src: 'https://images.unsplash.com/photo-1507473885869-98d848b97677?w=400' }],
    variants: [{ title: 'White', price: '89.99', sku: 'TABLE-001-WHT' }],
    category: 'Table Lamps',
    collections: [{ id: 3, title: 'Bedroom Lighting', handle: 'bedroom-lighting' }],
    platformLinks: {}
  }
];

interface ProductContentsProps {
  products: ShopifyProduct[];
}

const ProductContents: React.FC<ProductContentsProps> = ({ products }) => {
  // 使用传入的产品，如果没有就用mock数据
  const displayProducts = products.length > 0 ? products.slice(0, 50) : MOCK_PRODUCTS;
  const [contentStatus, setContentStatus] = useState<Record<string, ProductContentStatus>>({});
  const [contentConfigs, setContentConfigs] = useState<ContentTypeConfig[]>(DEFAULT_CONTENT_CONFIGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, [products]);

  const initializeData = async () => {
    setIsLoading(true);
    try {
      // 先使用默认配置显示页面
      setContentConfigs(DEFAULT_CONTENT_CONFIGS);
      
      // 默认所有内容未完成
      const defaultStatus: Record<string, any> = {};
      displayProducts.forEach(product => {
        const statusObj: any = { status: {} };
        DEFAULT_CONTENT_CONFIGS.forEach(config => {
          statusObj.status[config.type] = false;
        });
        defaultStatus[String(product.id)] = statusObj;
      });
      setContentStatus(defaultStatus);

      // 后台异步加载真实状态，不阻塞页面
      setTimeout(async () => {
        try {
          // 尝试从API加载真实状态
          const [statusData, configs] = await Promise.all([
            contentService.getAllContentStatus(),
            contentService.getContentTypeConfigs()
          ]);
          
          // 合并真实状态
          const statusMap: Record<string, ProductContentStatus> = { ...defaultStatus };
          statusData.forEach(status => {
            statusMap[status.product_id] = status;
          });
          setContentStatus(statusMap);
          
          // 按order排序配置
          configs.sort((a, b) => a.order - b.order);
          setContentConfigs(configs);
          
          console.log('Content status loaded from API');
        } catch (apiError) {
          console.log('API unavailable, using default status (all incomplete)');
          // API不可用时保持默认状态，所有内容灰色显示
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to initialize data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="product-contents-page">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="product-contents-page">
      <div className="page-header">
        <h1>Product Contents</h1>
        <p className="page-description">产品上架内容状态总览</p>
      </div>

      {/* 产品网格 */}
      <div className="product-grid">
        {displayProducts.map(product => {
          const status = contentStatus[String(product.id)];
          
          return (
            <div key={product.id} className="product-card">
              <div className="product-image-container">
                {product.images[0]?.src && (
                  <img 
                    src={product.images[0].src} 
                    alt={product.title} 
                    className="product-image"
                    onError={(e) => {
                      // 图片加载失败时用默认图
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Product+Image';
                    }}
                  />
                )}
              </div>
              
              <div className="product-details">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-sku">SKU: {product.variants[0]?.sku || 'N/A'}</p>
                <p className="product-completion">
                  完成度: {status?.completed_count || 0}/13 ({status?.completion_rate || 0}%)
                </p>
                
                {/* 内容图标网格 */}
                <div className="content-icons-grid">
                  {contentConfigs.map(config => {
                    // 从数据库读取状态，true显示彩色，false显示灰色
                    const isCompleted = status?.status?.[config.type] || false;
                    
                    return (
                      <div
                        key={config.type}
                        className={`content-icon-item ${isCompleted ? 'completed' : 'incomplete'}`}
                        title={config.label}
                      >
                        <span 
                          className="icon"
                          style={isCompleted ? { color: config.color } : {}}
                        >
                          {config.icon}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayProducts.length === 0 && (
        <div className="empty-state">
          <p>没有找到产品数据</p>
        </div>
      )}
    </div>
  );
};

export default ProductContents;
