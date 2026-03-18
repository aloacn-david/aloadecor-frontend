"""
基础抓取模块
使用Playwright进行页面抓取
包含重试机制和异常处理
"""
import asyncio
from typing import Optional, Dict, Any, Callable
from dataclasses import dataclass
from playwright.async_api import async_playwright, Page, Browser, BrowserContext
import logging

from ..utils.exceptions import (
    PageLoadException, ElementNotFoundException, 
    RateLimitException, RetryableException
)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ScrapingConfig:
    """抓取配置"""
    headless: bool = True
    timeout: int = 30000  # 30秒
    retry_count: int = 3
    retry_delay: float = 2.0  # 重试间隔（秒）
    user_agent: str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    viewport: Dict[str, int] = None
    
    def __post_init__(self):
        if self.viewport is None:
            self.viewport = {"width": 1920, "height": 1080}


class BaseScraper:
    """基础抓取器"""
    
    def __init__(self, config: Optional[ScrapingConfig] = None):
        self.config = config or ScrapingConfig()
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.playwright = None
        
    async def __aenter__(self):
        """异步上下文管理器入口"""
        await self.initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器出口"""
        await self.close()
    
    async def initialize(self):
        """初始化浏览器"""
        try:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=self.config.headless
            )
            self.context = await self.browser.new_context(
                viewport=self.config.viewport,
                user_agent=self.config.user_agent
            )
            logger.info("Browser initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize browser: {e}")
            raise
    
    async def close(self):
        """关闭浏览器"""
        try:
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            logger.info("Browser closed successfully")
        except Exception as e:
            logger.error(f"Error closing browser: {e}")
    
    async def fetch_page(self, url: str, 
                        wait_for: Optional[str] = None,
                        timeout: Optional[int] = None) -> Page:
        """
        抓取页面
        
        Args:
            url: 页面URL
            wait_for: 等待加载的选择器
            timeout: 超时时间（毫秒）
            
        Returns:
            Page对象
        """
        timeout = timeout or self.config.timeout
        last_exception = None
        
        for attempt in range(self.config.retry_count):
            try:
                page = await self.context.new_page()
                
                # 设置超时
                page.set_default_timeout(timeout)
                
                # 导航到页面
                logger.info(f"Fetching {url} (attempt {attempt + 1}/{self.config.retry_count})")
                response = await page.goto(url, wait_until="networkidle")
                
                # 检查响应状态
                if response.status >= 400:
                    raise PageLoadException(
                        f"HTTP {response.status} error",
                        url=url,
                        retry_count=attempt
                    )
                
                # 等待特定元素（如果指定）
                if wait_for:
                    try:
                        await page.wait_for_selector(wait_for, timeout=timeout)
                    except Exception as e:
                        raise ElementNotFoundException(
                            f"Element not found: {wait_for}",
                            selector=wait_for,
                            url=url
                        )
                
                logger.info(f"Successfully fetched {url}")
                return page
                
            except (PageLoadException, ElementNotFoundException) as e:
                last_exception = e
                logger.warning(f"Attempt {attempt + 1} failed: {e.message}")
                
                if attempt < self.config.retry_count - 1:
                    logger.info(f"Waiting {self.config.retry_delay}s before retry...")
                    await asyncio.sleep(self.config.retry_delay)
                
                if page:
                    await page.close()
            
            except Exception as e:
                last_exception = e
                logger.error(f"Unexpected error: {e}")
                if page:
                    await page.close()
                raise
        
        # 所有重试都失败
        raise last_exception or PageLoadException(
            "All retry attempts failed",
            url=url,
            retry_count=self.config.retry_count
        )
    
    async def safe_extract(self, page: Page, 
                          selector: str, 
                          attribute: Optional[str] = None,
                          default: Any = None) -> Any:
        """
        安全提取元素内容
        
        Args:
            page: Page对象
            selector: CSS选择器
            attribute: 要提取的属性（None表示提取文本）
            default: 默认值
            
        Returns:
            提取的内容或默认值
        """
        try:
            element = await page.query_selector(selector)
            if not element:
                return default
            
            if attribute:
                return await element.get_attribute(attribute)
            else:
                return await element.text_content()
                
        except Exception as e:
            logger.warning(f"Failed to extract {selector}: {e}")
            return default
    
    async def extract_multiple(self, page: Page, 
                              selector: str,
                              attribute: Optional[str] = None) -> list:
        """
        提取多个元素
        
        Args:
            page: Page对象
            selector: CSS选择器
            attribute: 要提取的属性
            
        Returns:
            提取的内容列表
        """
        try:
            elements = await page.query_selector_all(selector)
            results = []
            
            for element in elements:
                try:
                    if attribute:
                        value = await element.get_attribute(attribute)
                    else:
                        value = await element.text_content()
                    
                    if value:
                        results.append(value.strip())
                except Exception as e:
                    logger.warning(f"Failed to extract element: {e}")
                    continue
            
            return results
            
        except Exception as e:
            logger.warning(f"Failed to extract multiple {selector}: {e}")
            return []
    
    async def check_rate_limit(self, page: Page) -> bool:
        """
        检查是否被限制访问
        
        Args:
            page: Page对象
            
        Returns:
            是否被限制
        """
        # 检查常见的限制页面特征
        rate_limit_indicators = [
            "rate limit",
            "too many requests",
            "access denied",
            "please verify you are a human",
            "captcha"
        ]
        
        try:
            page_content = await page.content()
            page_content_lower = page_content.lower()
            
            for indicator in rate_limit_indicators:
                if indicator in page_content_lower:
                    return True
            
            return False
            
        except Exception as e:
            logger.warning(f"Failed to check rate limit: {e}")
            return False
