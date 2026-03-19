"""
统一数据模型定义
使用Pydantic进行数据验证和序列化
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


class AnalysisStatus(str, Enum):
    """分析状态枚举"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"


class PlatformType(str, Enum):
    """平台类型枚举"""
    AMAZON = "amazon"
    WAYFAIR = "wayfair"
    OVERSTOCK = "overstock"
    HOME_DEPOT = "homedepot"
    LOWES = "lowes"
    TARGET = "target"
    WALMART = "walmart"
    EBAY = "ebay"
    KOHLS = "kohls"


class ImageType(str, Enum):
    """图片类型枚举"""
    MAIN = "main"
    DETAIL = "detail"
    SCENE = "scene"
    SIZE = "size"
    FEATURE = "feature"
    UNKNOWN = "unknown"


class TitleAnalysis(BaseModel):
    """标题分析结果"""
    title: str = Field(description="原始标题")
    length: int = Field(description="标题长度")
    length_score: float = Field(ge=0, le=100, description="长度评分")
    has_brand: bool = Field(description="是否包含品牌名")
    has_keywords: bool = Field(description="是否包含关键词")
    has_specifications: bool = Field(description="是否包含规格信息")
    readability_score: float = Field(ge=0, le=100, description="可读性评分")
    issues: List[str] = Field(default_factory=list, description="发现的问题")
    suggestions: List[str] = Field(default_factory=list, description="改进建议")


class ImageInfo(BaseModel):
    """单张图片信息"""
    url: str = Field(description="图片URL")
    image_type: ImageType = Field(default=ImageType.UNKNOWN, description="图片类型")
    resolution: Optional[str] = Field(None, description="分辨率")
    file_size: Optional[int] = Field(None, description="文件大小(字节)")


class ImageAnalysis(BaseModel):
    """图片分析结果"""
    total_count: int = Field(description="图片总数")
    type_distribution: Dict[ImageType, int] = Field(default_factory=dict, description="类型分布")
    images: List[ImageInfo] = Field(default_factory=list, description="图片列表")
    has_main_image: bool = Field(description="是否有主图")
    has_detail_images: bool = Field(description="是否有细节图")
    has_scene_images: bool = Field(description="是否有场景图")
    has_size_image: bool = Field(description="是否有尺寸图")
    diversity_score: float = Field(ge=0, le=100, description="多样性评分")
    issues: List[str] = Field(default_factory=list, description="发现的问题")
    suggestions: List[str] = Field(default_factory=list, description="改进建议")
    # 第二阶段字段
    visual_quality_ready: bool = Field(default=False, description="视觉质量分析是否就绪")


class ParameterInfo(BaseModel):
    """单个参数信息"""
    name: str = Field(description="参数名")
    value: str = Field(description="参数值")
    is_complete: bool = Field(description="是否完整")


class ParameterAnalysis(BaseModel):
    """参数分析结果"""
    total_parameters: int = Field(description="参数总数")
    core_parameters: Dict[str, Optional[str]] = Field(default_factory=dict, description="核心参数")
    missing_core: List[str] = Field(default_factory=list, description="缺失的核心参数")
    completeness_score: float = Field(ge=0, le=100, description="完整性评分")
    format_issues: List[str] = Field(default_factory=list, description="格式问题")
    issues: List[str] = Field(default_factory=list, description="发现的问题")
    suggestions: List[str] = Field(default_factory=list, description="改进建议")


class ReviewSummary(BaseModel):
    """评论摘要"""
    total_reviews: int = Field(description="总评论数")
    negative_reviews: int = Field(description="差评数(1-2星)")
    negative_percentage: float = Field(description="差评占比")
    main_themes: List[str] = Field(default_factory=list, description="主要问题主题")
    keywords: List[str] = Field(default_factory=list, description="高频关键词")
    top_issues: List[str] = Field(default_factory=list, description="主要问题")


class CoreFact(BaseModel):
    """核心事实"""
    fact_type: str = Field(description="事实类型")
    value: str = Field(description="事实值")
    confidence: float = Field(ge=0, le=100, description="置信度")


class CoreFacts(BaseModel):
    """核心事实一致性分析"""
    facts: Dict[str, CoreFact] = Field(default_factory=dict, description="提取的核心事实")
    consistency_score: float = Field(ge=0, le=100, description="一致性评分")
    inconsistencies: List[str] = Field(default_factory=list, description="不一致项")
    missing_facts: List[str] = Field(default_factory=list, description="缺失的事实")


class Suggestion(BaseModel):
    """改进建议"""
    priority: int = Field(ge=1, le=3, description="优先级(1=最高)")
    category: str = Field(description="问题类别")
    issue: str = Field(description="问题描述")
    recommendation: str = Field(description="改进建议")
    expected_impact: str = Field(description="预期效果")


class ScrapingError(BaseModel):
    """抓取错误记录"""
    error_type: str = Field(description="错误类型")
    message: str = Field(description="错误信息")
    timestamp: datetime = Field(default_factory=datetime.now, description="发生时间")
    context: Optional[Dict[str, Any]] = Field(None, description="上下文信息")


class ProductLink(BaseModel):
    """产品链接模型"""
    product_id: str = Field(description="产品ID")
    platform: PlatformType = Field(description="平台")
    url: str = Field(description="产品链接")
    last_checked: Optional[datetime] = Field(None, description="上次检查时间")
    
    model_config = {
        "arbitrary_types_allowed": True
    }


class ScrapedProductData(BaseModel):
    """抓取的产品数据"""
    product_id: str = Field(description="产品ID")
    platform: PlatformType = Field(description="平台")
    url: str = Field(description="产品链接")
    
    # 基本信息
    title: Optional[str] = Field(None, description="产品标题")
    price: Optional[float] = Field(None, description="价格")
    currency: Optional[str] = Field(None, description="货币")
    
    # 评分和评论
    rating: Optional[float] = Field(None, ge=0, le=5, description="评分")
    review_count: Optional[int] = Field(None, ge=0, description="评论数")
    
    # 内容
    images: List[Dict[str, Any]] = Field(default_factory=list, description="图片列表")
    bullets: List[str] = Field(default_factory=list, description="要点列表")
    description: Optional[str] = Field(None, description="描述")
    
    # 规格
    specifications: Dict[str, str] = Field(default_factory=dict, description="规格参数")
    
    # 评论
    reviews: List[Dict[str, Any]] = Field(default_factory=list, description="评论列表")
    
    # 元数据
    scraped_at: datetime = Field(default_factory=datetime.now, description="抓取时间")
    region: Optional[str] = Field(None, description="地区")
    
    model_config = {
        "arbitrary_types_allowed": True
    }


class ProductAnalysis(BaseModel):
    """产品分析完整结果"""
    # 基本信息
    product_id: str = Field(description="产品ID")
    sku: str = Field(description="SKU")
    platform: PlatformType = Field(description="平台")
    url: str = Field(description="产品链接")
    
    # 分析结果
    title_analysis: Optional[TitleAnalysis] = Field(None, description="标题分析")
    image_analysis: Optional[ImageAnalysis] = Field(None, description="图片分析")
    parameter_analysis: Optional[ParameterAnalysis] = Field(None, description="参数分析")
    review_analysis: Optional[ReviewSummary] = Field(None, description="评论分析")
    core_facts: Optional[CoreFacts] = Field(None, description="核心事实一致性")
    
    # 优先级建议
    priority_suggestions: List[Suggestion] = Field(default_factory=list, description="优先建议")
    
    # 元数据
    analysis_timestamp: datetime = Field(default_factory=datetime.now, description="分析时间")
    status: AnalysisStatus = Field(default=AnalysisStatus.PENDING, description="分析状态")
    errors: List[ScrapingError] = Field(default_factory=list, description="错误记录")
    
    # 规则分析评分
    rule_based_score: Optional[float] = Field(None, ge=0, le=100, description="规则分析评分")
    
    model_config = {
        "arbitrary_types_allowed": True
    }


class AnalysisTask(BaseModel):
    """分析任务模型"""
    task_id: str = Field(description="任务ID")
    product_id: str = Field(description="产品ID")
    platform: Optional[PlatformType] = Field(None, description="平台")
    trigger_type: str = Field(description="触发类型(manual/scheduled)")
    status: AnalysisStatus = Field(default=AnalysisStatus.PENDING, description="任务状态")
    retry_count: int = Field(default=0, description="重试次数")
    started_at: Optional[datetime] = Field(None, description="开始时间")
    finished_at: Optional[datetime] = Field(None, description="结束时间")
    error_message: Optional[str] = Field(None, description="错误信息")
    
    model_config = {
        "arbitrary_types_allowed": True
    }
