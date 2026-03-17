"""
任务调度模块
管理分析任务的调度和执行
"""
import asyncio
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field

from ..models.product_analysis import AnalysisTask, AnalysisStatus
from ..scrapers.scraper_factory import ScraperFactory
from ..normalizers.data_normalizer import DataNormalizer
from ..analyzers.rule_based_analyzer import RuleBasedAnalyzer
from ..analyzers.ai_analyzer import AIAnalyzer
from ..reports.report_generator import ReportGenerator


@dataclass
class TaskScheduler:
    """任务调度器"""
    rule_analyzer: RuleBasedAnalyzer
    ai_analyzer: Optional[AIAnalyzer] = None
    tasks: Dict[str, AnalysisTask] = field(default_factory=dict)
    max_concurrent_tasks: int = 5
    
    def __post_init__(self):
        """初始化任务调度器"""
        self.data_normalizer = DataNormalizer()
        self.scraper_factory = ScraperFactory()
        self.report_generator = ReportGenerator(self.rule_analyzer, self.ai_analyzer)
        self.active_tasks = set()
    
    async def create_task(self, product_id: str, platform: str, 
                        url: str, trigger_type: str = "manual") -> AnalysisTask:
        """
        创建分析任务
        
        Args:
            product_id: 产品ID
            platform: 平台名称
            url: 产品URL
            trigger_type: 触发类型（manual/scheduled）
            
        Returns:
            分析任务
        """
        task_id = str(uuid.uuid4())
        task = AnalysisTask(
            task_id=task_id,
            product_id=product_id,
            platform=platform,
            trigger_type=trigger_type,
            status=AnalysisStatus.PENDING,
            retry_count=0,
            started_at=None,
            finished_at=None,
            error_message=None
        )
        
        self.tasks[task_id] = task
        return task
    
    async def run_task(self, task: AnalysisTask, run_ai: bool = False) -> AnalysisTask:
        """
        运行分析任务
        
        Args:
            task: 分析任务
            run_ai: 是否运行AI分析
            
        Returns:
            更新后的分析任务
        """
        if task.task_id in self.active_tasks:
            return task
        
        # 等待直到有可用的并发任务槽
        while len(self.active_tasks) >= self.max_concurrent_tasks:
            await asyncio.sleep(0.1)
        
        self.active_tasks.add(task.task_id)
        
        try:
            # 更新任务状态
            task.status = AnalysisStatus.RUNNING
            task.started_at = datetime.now()
            
            # 1. 抓取页面
            scraped_data = await self._scrape_product(task.product_id, task.platform, task.url)
            
            # 2. 数据标准化
            normalized_data = self.data_normalizer.normalize(
                raw_data=scraped_data,
                product_id=task.product_id,
                platform=task.platform,
                url=task.url
            )
            
            # 3. 规则分析
            rule_analysis = self.rule_analyzer.analyze_scraped_product(normalized_data)
            
            # 4. 生成报告
            product_data = {
                "title": normalized_data.title,
                "images": normalized_data.images,
                "specifications": normalized_data.specifications,
                "bullets": normalized_data.bullets,
                "description": normalized_data.description,
                "reviews": normalized_data.reviews
            }
            
            report = self.report_generator.generate_report(
                product_data=product_data,
                product_id=task.product_id,
                sku="",  # 假设SKU可以从其他地方获取
                platform=task.platform,
                url=task.url,
                run_ai=run_ai
            )
            
            # 5. 更新任务状态
            task.status = AnalysisStatus.COMPLETED
            task.finished_at = datetime.now()
            
        except Exception as e:
            # 处理异常
            task.status = AnalysisStatus.FAILED
            task.error_message = str(e)
            task.finished_at = datetime.now()
            task.retry_count += 1
            
            # 重试逻辑
            if task.retry_count < 3:
                await asyncio.sleep(2 ** (task.retry_count - 1))  # 指数退避
                return await self.run_task(task, run_ai)
        
        finally:
            self.active_tasks.remove(task.task_id)
        
        return task
    
    async def _scrape_product(self, product_id: str, platform: str, url: str) -> Dict[str, Any]:
        """
        抓取产品数据
        
        Args:
            product_id: 产品ID
            platform: 平台名称
            url: 产品URL
            
        Returns:
            抓取的原始数据
        """
        from ..models.product_analysis import PlatformType
        
        try:
            platform_type = PlatformType(platform.lower())
            scraper = self.scraper_factory.get_scraper(platform_type)
            
            async with scraper:
                await scraper.initialize()
                result = await scraper.scrape_product(url, product_id)
                return result
        except Exception as e:
            return {"error": str(e)}
    
    async def run_batch_tasks(self, tasks: List[AnalysisTask], run_ai: bool = False) -> List[AnalysisTask]:
        """
        批量运行分析任务
        
        Args:
            tasks: 任务列表
            run_ai: 是否运行AI分析
            
        Returns:
            更新后的任务列表
        """
        results = []
        
        # 并发运行任务
        for task in tasks:
            results.append(self.run_task(task, run_ai))
        
        return await asyncio.gather(*results)
    
    def get_task(self, task_id: str) -> Optional[AnalysisTask]:
        """
        获取任务
        
        Args:
            task_id: 任务ID
            
        Returns:
            分析任务
        """
        return self.tasks.get(task_id)
    
    def get_tasks_by_status(self, status: AnalysisStatus) -> List[AnalysisTask]:
        """
        根据状态获取任务
        
        Args:
            status: 任务状态
            
        Returns:
            任务列表
        """
        return [task for task in self.tasks.values() if task.status == status]
    
    def get_tasks_by_product(self, product_id: str) -> List[AnalysisTask]:
        """
        根据产品ID获取任务
        
        Args:
            product_id: 产品ID
            
        Returns:
            任务列表
        """
        return [task for task in self.tasks.values() if task.product_id == product_id]
    
    def cleanup_tasks(self, days: int = 7):
        """
        清理旧任务
        
        Args:
            days: 保留天数
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        
        tasks_to_remove = []
        for task_id, task in self.tasks.items():
            if task.finished_at and task.finished_at < cutoff_date:
                tasks_to_remove.append(task_id)
        
        for task_id in tasks_to_remove:
            del self.tasks[task_id]
    
    async def schedule_task(self, product_id: str, platform: str, 
                          url: str, delay: int = 0) -> AnalysisTask:
        """
        调度任务
        
        Args:
            product_id: 产品ID
            platform: 平台名称
            url: 产品URL
            delay: 延迟时间（秒）
            
        Returns:
            分析任务
        """
        task = await self.create_task(product_id, platform, url, "scheduled")
        
        # 延迟执行
        if delay > 0:
            await asyncio.sleep(delay)
        
        await self.run_task(task)
        return task
    
    async def schedule_recurring_task(self, product_id: str, platform: str, 
                                   url: str, interval: int):
        """
        调度重复任务
        
        Args:
            product_id: 产品ID
            platform: 平台名称
            url: 产品URL
            interval: 重复间隔（秒）
        """
        while True:
            await self.schedule_task(product_id, platform, url)
            await asyncio.sleep(interval)