// AI分析服务
// 用于与后端AI分析系统交互
import { ShopifyProduct } from '../types/shopify';

// 分析结果类型
export interface AnalysisResult {
  product_id: string;
  sku: string;
  platform: string;
  url: string;
  overall_score: number;
  analysis: {
    title: {
      score: number;
      issues: string[];
    };
    images: {
      count: number;
      diversity_score: number;
    };
    parameters: {
      completeness: number;
      missing: string[];
    };
  };
  priority_suggestions: {
    priority: number;
    category: string;
    issue: string;
    recommendation: string;
    expected_impact: string;
  }[];
}

// 分析状态类型
export interface AnalysisStatus {
  last_analysis: string;
  next_analysis: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
}

// 产品平台链接分析请求
export interface ProductAnalysisRequest {
  product_id: string;
  sku: string;
  platforms: {
    platform: string;
    url: string;
  }[];
}

// 分析结果存储项（带ID和保存状态）
export interface StoredAnalysisResult extends AnalysisResult {
  analysis_id: string;
  created_at: string;
  is_saved: boolean;
  product_name: string;
}

// 模拟分析数据（实际项目中从后端获取）
const mockAnalysisResults: AnalysisResult[] = [
  {
    product_id: '1',
    sku: 'ABC123',
    platform: 'amazon',
    url: 'https://amazon.com/product/123',
    overall_score: 87.33,
    analysis: {
      title: {
        score: 80.0,
        issues: []
      },
      images: {
        count: 4,
        diversity_score: 100.0
      },
      parameters: {
        completeness: 70.0,
        missing: ['size', 'bulb_type', 'certification']
      }
    },
    priority_suggestions: [
      {
        priority: 1,
        category: '参数',
        issue: '缺少核心参数: size, bulb_type',
        recommendation: '补充size和bulb_type等关键参数信息',
        expected_impact: '减少客户咨询，提升购买信心'
      }
    ]
  },
  {
    product_id: '2',
    sku: 'DEF456',
    platform: 'wayfair',
    url: 'https://wayfair.com/product/456',
    overall_score: 32.56,
    analysis: {
      title: {
        score: 6.67,
        issues: ['标题过短 (4字符)，建议至少30字符', '标题缺少规格信息']
      },
      images: {
        count: 1,
        diversity_score: 25.0
      },
      parameters: {
        completeness: 10.0,
        missing: ['dimensions', 'size', 'material', 'finish', 'color', 'weight', 'wattage', 'voltage', 'bulb_type', 'certification']
      }
    },
    priority_suggestions: [
      {
        priority: 1,
        category: '标题',
        issue: '标题过短 (4字符)',
        recommendation: '增加标题长度至80字符左右，包含品牌名、核心关键词和规格信息',
        expected_impact: '提升搜索排名，增加点击率'
      },
      {
        priority: 1,
        category: '图片',
        issue: '图片数量不足 (1张)',
        recommendation: '添加至少3-5张图片，包括主图、细节图、场景图',
        expected_impact: '帮助客户全面了解产品'
      },
      {
        priority: 1,
        category: '参数',
        issue: '缺少核心参数: dimensions, size',
        recommendation: '补充dimensions和size等关键参数信息',
        expected_impact: '减少客户咨询，提升购买信心'
      }
    ]
  }
];

// 模拟分析状态
const mockAnalysisStatus: AnalysisStatus = {
  last_analysis: '2026-03-15T10:00:00Z',
  next_analysis: '2026-03-22T10:00:00Z',
  status: 'completed'
};

export class AIAnalysisService {
  /**
   * 获取分析状态
   */
  async getAnalysisStatus(): Promise<AnalysisStatus> {
    // 实际项目中：从后端API获取
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockAnalysisStatus), 500);
    });
  }

  /**
   * 运行产品分析
   */
  async runAnalysis(productId: string): Promise<AnalysisResult> {
    // 实际项目中：调用后端API运行分析
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = mockAnalysisResults.find(r => r.product_id === productId) || mockAnalysisResults[0];
        resolve(result);
      }, 1000);
    });
  }

  /**
   * 获取分析报告列表
   */
  async getAnalysisReports(): Promise<Array<{
    date: string;
    id: string;
    status: string;
    product_count: number;
  }>> {
    // 实际项目中：从后端API获取
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            date: '2026-03-15',
            id: 'report-1',
            status: 'completed',
            product_count: 42
          },
          {
            date: '2026-03-01',
            id: 'report-2',
            status: 'completed',
            product_count: 38
          },
          {
            date: '2026-02-15',
            id: 'report-3',
            status: 'completed',
            product_count: 45
          }
        ]);
      }, 500);
    });
  }

  /**
   * 分析单个产品
   */
  async analyzeProduct(product: ShopifyProduct, platform: string, url: string): Promise<AnalysisResult> {
    // 实际项目中：调用后端API分析产品
    return new Promise((resolve) => {
      setTimeout(() => {
        const analysis: AnalysisResult = {
          product_id: String(product.id),
          sku: product.variants[0]?.sku || '',
          platform,
          url,
          overall_score: Math.floor(Math.random() * 40) + 60, // 60-100分
          analysis: {
            title: {
              score: Math.floor(Math.random() * 30) + 70, // 70-100分
              issues: []
            },
            images: {
              count: product.images.length,
              diversity_score: Math.floor(Math.random() * 20) + 80 // 80-100分
            },
            parameters: {
              completeness: Math.floor(Math.random() * 30) + 70, // 70-100分
              missing: []
            }
          },
          priority_suggestions: [
            {
              priority: 1,
              category: '图片',
              issue: `图片数量不足 (${product.images.length}张)`,
              recommendation: '添加更多高质量图片',
              expected_impact: '提升产品吸引力'
            }
          ]
        };
        resolve(analysis);
      }, 1500);
    });
  }

  /**
   * 分析产品的所有平台链接
   * 自动获取产品的平台链接并分析
   */
  async analyzeProductPlatforms(
    product: ShopifyProduct,
    onProgress?: (progress: number, currentPlatform: string) => void
  ): Promise<StoredAnalysisResult[]> {
    const platforms = this.extractPlatformsFromProduct(product);
    const results: StoredAnalysisResult[] = [];
    
    for (let i = 0; i < platforms.length; i++) {
      const { platform, url } = platforms[i];
      
      // 报告进度
      if (onProgress) {
        onProgress(Math.round((i / platforms.length) * 100), platform);
      }
      
      try {
        // 分析每个平台的链接
        const result = await this.analyzeProduct(product, platform, url);
        
        // 转换为存储格式
        const storedResult: StoredAnalysisResult = {
          ...result,
          analysis_id: `analysis_${Date.now()}_${i}`,
          created_at: new Date().toISOString(),
          is_saved: true, // 默认保存
          product_name: product.title
        };
        
        results.push(storedResult);
      } catch (error) {
        console.error(`Failed to analyze ${platform}:`, error);
      }
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 完成100%
    if (onProgress) {
      onProgress(100, 'completed');
    }
    
    return results;
  }

  /**
   * 从产品中提取平台链接
   */
  private extractPlatformsFromProduct(product: ShopifyProduct): { platform: string; url: string }[] {
    const platforms: { platform: string; url: string }[] = [];
    const links = product.platformLinks;
    
    // 平台映射
    const platformMap: Record<string, string> = {
      amazon1: 'amazon',
      amazon2: 'amazon',
      wf1: 'wayfair',
      wf2: 'wayfair',
      os1: 'overstock',
      os2: 'overstock',
      hd1: 'homedepot',
      hd2: 'homedepot',
      lowes: 'lowes',
      target: 'target',
      walmart: 'walmart',
      ebay: 'ebay',
      kohls: 'kohls'
    };
    
    // 提取所有非空的平台链接
    Object.entries(links).forEach(([key, url]) => {
      if (url && url.trim()) {
        platforms.push({
          platform: platformMap[key] || key,
          url: url.trim()
        });
      }
    });
    
    return platforms;
  }

  /**
   * 保存分析结果
   */
  async saveAnalysisResult(analysisId: string): Promise<boolean> {
    // 实际项目中：调用后端API保存
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 300);
    });
  }

  /**
   * 删除分析结果
   */
  async deleteAnalysisResult(analysisId: string): Promise<boolean> {
    // 实际项目中：调用后端API删除
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 300);
    });
  }

  /**
   * 批量删除分析结果
   */
  async deleteMultipleAnalysisResults(analysisIds: string[]): Promise<boolean> {
    // 实际项目中：调用后端API批量删除
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 500);
    });
  }

  /**
   * 获取已保存的分析结果
   */
  async getSavedAnalysisResults(): Promise<StoredAnalysisResult[]> {
    // 实际项目中：从后端API获取
    return new Promise((resolve) => {
      setTimeout(() => resolve([]), 500);
    });
  }
}

export const aiAnalysisService = new AIAnalysisService();
