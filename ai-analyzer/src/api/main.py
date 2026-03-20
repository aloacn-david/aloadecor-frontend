"""
API接口模块
提供RESTful API接口
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..analyzers.rule_based_analyzer import RuleBasedAnalyzer
from ..analyzers.ai_analyzer import AIAnalyzer
from ..tasks.task_scheduler import TaskScheduler
from ..models.product_analysis import AnalysisStatus, PlatformType
from ..db.mongodb import connect_to_mongo, close_mongo_connection
from .content_management import router as content_router
from .unified import router as unified_router
from ..utils.monitoring import monitor_middleware, get_metrics

# 创建应用
app = FastAPI(
    title="ALOA DECOR API",
    description="Unified API for ALOA DECOR ecommerce platform",
    version="3.0.0"
)

# 添加监控中间件
app.middleware("http")(monitor_middleware)

# 注册路由
app.include_router(unified_router)
app.include_router(content_router)

# 事件处理
@app.on_event("startup")
async def startup_event():
    """启动时连接MongoDB"""
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    """关闭时断开MongoDB连接"""
    await close_mongo_connection()

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 简单的健康检查端点（不依赖MongoDB）
@app.get("/health")
async def health_check():
    """健康检查"""
    import os
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "shopifyStore": os.getenv("SHOPIFY_STORE", "not configured")
    }

# 初始化分析器和调度器
rule_analyzer = RuleBasedAnalyzer()
try:
    ai_analyzer = AIAnalyzer()
except ValueError:
    ai_analyzer = None  # 如果没有API密钥，禁用AI分析
task_scheduler = TaskScheduler(rule_analyzer, ai_analyzer)

# 数据模型
class ProductRequest(BaseModel):
    """产品分析请求"""
    product_id: str
    platform: str
    url: str
    run_ai: bool = False

class BatchRequest(BaseModel):
    """批量分析请求"""
    products: List[ProductRequest]

class TaskResponse(BaseModel):
    """任务响应"""
    task_id: str
    product_id: str
    platform: str
    status: str
    created_at: datetime

class AnalysisResult(BaseModel):
    """分析结果"""
    product_id: str
    platform: str
    url: str
    overall_score: float
    status: str
    priority_suggestions: List[Dict[str, Any]]
    analysis_timestamp: datetime

# API接口
@app.post("/api/analyze", response_model=TaskResponse)
async def analyze_product(request: ProductRequest, background_tasks: BackgroundTasks):
    """分析单个产品"""
    try:
        # 创建任务
        task = await task_scheduler.create_task(
            product_id=request.product_id,
            platform=request.platform,
            url=request.url,
            trigger_type="manual"
        )
        
        # 后台运行任务
        background_tasks.add_task(task_scheduler.run_task, task, request.run_ai)
        
        return TaskResponse(
            task_id=task.task_id,
            product_id=task.product_id,
            platform=task.platform,
            status=task.status.value,
            created_at=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze/batch", response_model=List[TaskResponse])
async def analyze_batch(request: BatchRequest, background_tasks: BackgroundTasks):
    """批量分析产品"""
    try:
        tasks = []
        for product in request.products:
            task = await task_scheduler.create_task(
                product_id=product.product_id,
                platform=product.platform,
                url=product.url,
                trigger_type="manual"
            )
            tasks.append(task)
        
        # 后台运行批量任务
        background_tasks.add_task(task_scheduler.run_batch_tasks, tasks, any(p.run_ai for p in request.products))
        
        return [
            TaskResponse(
                task_id=task.task_id,
                product_id=task.product_id,
                platform=task.platform,
                status=task.status.value,
                created_at=datetime.now()
            )
            for task in tasks
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/task/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """获取任务状态"""
    task = task_scheduler.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskResponse(
        task_id=task.task_id,
        product_id=task.product_id,
        platform=task.platform,
        status=task.status.value,
        created_at=datetime.now()
    )

@app.get("/api/tasks", response_model=List[TaskResponse])
async def get_tasks(status: Optional[str] = None, product_id: Optional[str] = None):
    """获取任务列表"""
    if status:
        try:
            status_enum = AnalysisStatus(status)
            tasks = task_scheduler.get_tasks_by_status(status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")
    elif product_id:
        tasks = task_scheduler.get_tasks_by_product(product_id)
    else:
        tasks = list(task_scheduler.tasks.values())
    
    return [
        TaskResponse(
            task_id=task.task_id,
            product_id=task.product_id,
            platform=task.platform,
            status=task.status.value,
            created_at=datetime.now()
        )
        for task in tasks
    ]

@app.get("/api/summary")
async def get_summary():
    """获取分析摘要"""
    # 这里应该从数据库或缓存中获取分析报告
    # 为了演示，返回模拟数据
    return {
        "total_products": 100,
        "total_listings": 300,
        "listings_with_issues": 45,
        "healthy_listings": 255,
        "platform_health": {
            "amazon": {
                "total": 100,
                "healthy": 85,
                "average_score": 82.5
            },
            "wayfair": {
                "total": 100,
                "healthy": 75,
                "average_score": 78.2
            },
            "homedepot": {
                "total": 100,
                "healthy": 95,
                "average_score": 88.7
            }
        },
        "issue_distribution": {
            "Missing Specs": 15,
            "Low Image Count": 10,
            "Title Issues": 12,
            "Cross Platform Conflict": 8
        },
        "average_score": 83.1
    }

@app.get("/api/platforms")
async def get_platforms():
    """获取支持的平台列表"""
    return {
        "platforms": [platform.value for platform in PlatformType]
    }

@app.get("/metrics")
async def metrics():
    """Prometheus指标端点"""
    metrics_content, content_type = get_metrics()
    return Response(content=metrics_content, media_type=content_type)


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "ALOA DECOR Unified API",
        "version": "3.0.0",
        "endpoints": [
            "/api/shopify/products - 获取Shopify产品",
            "/api/platform-links - 平台链接管理",
            "/api/content/status - 内容状态管理",
            "/api/health - 健康检查",
            "/metrics - Prometheus指标"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)