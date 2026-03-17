/**
 * 产品内容管理类型定义
 */

// 内容类型
export type ContentType = 
  | '全美国杰西'
  | '全计价表'
  | '新品product sheet'
  | '新品调研'
  | '上传价核价'
  | '主图'
  | '白底图'
  | '细节图'
  | '尺寸图'
  | '安装视频'
  | '场景视频/网红视频'
  | '文字'
  | '新品上架';

// 内容类型配置
export interface ContentTypeConfig {
  type: ContentType;
  label: string;
  icon: string;
  color: string;
  order: number;
}

// 产品内容状态
export interface ProductContentStatus {
  product_id: string;
  sku?: string;
  status: Record<ContentType, boolean>;
  completed_count: number;
  completion_rate: number;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

// 更新请求
export interface ContentStatusUpdate {
  status_updates: Partial<Record<ContentType, boolean>>;
  updated_by?: string;
}
