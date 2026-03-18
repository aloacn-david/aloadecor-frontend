"""
抓取器工厂
根据平台类型创建对应的抓取器实例
"""
from typing import Optional

from .base_scraper import BaseScraper, ScrapingConfig
from .amazon_scraper import AmazonScraper
from .wayfair_scraper import WayfairScraper
from ..models.product_analysis import PlatformType


class ScraperFactory:
    """抓取器工厂类"""
    
    # 平台到抓取器的映射
    _scrapers = {
        PlatformType.AMAZON: AmazonScraper,
        PlatformType.WAYFAIR: WayfairScraper,
        # 可以添加其他平台的抓取器
    }
    
    @classmethod
    def get_scraper(cls, platform: PlatformType, 
                   config: Optional[ScrapingConfig] = None) -> BaseScraper:
        """
        根据平台类型获取抓取器实例
        
        Args:
            platform: 平台类型
            config: 抓取配置
            
        Returns:
            对应的抓取器实例
            
        Raises:
            ValueError: 如果平台类型不支持
        """
        if platform not in cls._scrapers:
            raise ValueError(f"Unsupported platform: {platform}")
        
        scraper_class = cls._scrapers[platform]
        return scraper_class(config)
    
    @classmethod
    def is_platform_supported(cls, platform: PlatformType) -> bool:
        """
        检查平台是否支持
        
        Args:
            platform: 平台类型
            
        Returns:
            是否支持
        """
        return platform in cls._scrapers
    
    @classmethod
    def get_supported_platforms(cls) -> list:
        """
        获取支持的平台列表
        
        Returns:
            支持的平台列表
        """
        return list(cls._scrapers.keys())