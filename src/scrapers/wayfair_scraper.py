"""
Wayfair平台抓取器
专门用于抓取Wayfair商品页面
"""
import re
from typing import Dict, Any, Optional
from playwright.async_api import Page

from .base_scraper import BaseScraper, ScrapingConfig
from ..models.product_analysis import PlatformType


class WayfairScraper(BaseScraper):
    """Wayfair平台抓取器"""
    
    def __init__(self, config: Optional[ScrapingConfig] = None):
        super().__init__(config)
        self.platform = PlatformType.WAYFAIR
    
    async def scrape_product(self, url: str, product_id: str) -> Dict[str, Any]:
        """
        抓取Wayfair产品页面
        
        Args:
            url: Wayfair产品URL
            product_id: 产品ID
            
        Returns:
            抓取的产品数据
        """
        try:
            # 抓取页面
            page = await self.fetch_page(
                url,
                wait_for=".Breadcrumbs"
            )
            
            # 检查是否被限制访问
            if await self.check_rate_limit(page):
                return {
                    "error": "Rate limited",
                    "url": url
                }
            
            # 提取数据
            data = {
                "title": await self._extract_title(page),
                "price": await self._extract_price(page),
                "currency": await self._extract_currency(page),
                "rating": await self._extract_rating(page),
                "review_count": await self._extract_review_count(page),
                "images": await self._extract_images(page),
                "bullets": await self._extract_bullets(page),
                "description": await self._extract_description(page),
                "specifications": await self._extract_specifications(page),
                "reviews": await self._extract_reviews(page),
                "platform": self.platform.value
            }
            
            await page.close()
            return data
            
        except Exception as e:
            raise
    
    async def _extract_title(self, page: Page) -> Optional[str]:
        """提取标题"""
        return await self.safe_extract(
            page, ".ProductDetailsHeader-title", default=""
        )
    
    async def _extract_price(self, page: Page) -> Optional[float]:
        """提取价格"""
        price_text = await self.safe_extract(
            page, ".Price price", default=""
        )
        
        if price_text:
            # 提取数字
            price_match = re.search(r"\$([0-9,.]+)", price_text)
            if price_match:
                price_str = price_match.group(1).replace(",", "")
                try:
                    return float(price_str)
                except ValueError:
                    pass
        
        return None
    
    async def _extract_currency(self, page: Page) -> Optional[str]:
        """提取货币"""
        price_text = await self.safe_extract(
            page, ".Price price", default=""
        )
        if price_text:
            currency_match = re.search(r"([^0-9.,\s]+)", price_text)
            if currency_match:
                return currency_match.group(1)
        return "USD"
    
    async def _extract_rating(self, page: Page) -> Optional[float]:
        """提取评分"""
        rating_text = await self.safe_extract(
            page, ".ReviewStars", default=""
        )
        if rating_text:
            rating_match = re.search(r"([0-9.]+)", rating_text)
            if rating_match:
                try:
                    return float(rating_match.group(1))
                except ValueError:
                    pass
        return None
    
    async def _extract_review_count(self, page: Page) -> Optional[int]:
        """提取评论数"""
        review_text = await self.safe_extract(
            page, ".ReviewStars-reviews", default=""
        )
        if review_text:
            review_match = re.search(r"([0-9,]+)", review_text)
            if review_match:
                review_str = review_match.group(1).replace(",", "")
                try:
                    return int(review_str)
                except ValueError:
                    pass
        return None
    
    async def _extract_images(self, page: Page) -> list:
        """提取图片"""
        images = []
        
        # 提取主图
        main_image = await self.safe_extract(
            page, ".MediaGallery-heroImage img", attribute="src"
        )
        if main_image:
            images.append({"url": main_image, "type": "main"})
        
        # 提取其他图片
        thumbnails = await page.query_selector_all(
            ".MediaGallery-thumbnails img"
        )
        
        for i, thumbnail in enumerate(thumbnails):
            try:
                img_url = await thumbnail.get_attribute("src")
                if img_url:
                    images.append({"url": img_url, "type": "detail"})
            except Exception as e:
                continue
        
        return images
    
    async def _extract_bullets(self, page: Page) -> list:
        """提取要点"""
        return await self.extract_multiple(
            page, ".Features-list li"
        )
    
    async def _extract_description(self, page: Page) -> Optional[str]:
        """提取描述"""
        return await self.safe_extract(
            page, ".ProductDescription", default=""
        )
    
    async def _extract_specifications(self, page: Page) -> Dict[str, str]:
        """提取规格参数"""
        specs = {}
        
        # 提取规格表格
        rows = await page.query_selector_all(
            ".Specifications-tableRow"
        )
        
        for row in rows:
            try:
                label = await row.query_selector(".Specifications-tableLabel")
                value = await row.query_selector(".Specifications-tableValue")
                
                if label and value:
                    label_text = await label.text_content()
                    value_text = await value.text_content()
                    
                    if label_text and value_text:
                        specs[label_text.strip()] = value_text.strip()
            except Exception as e:
                continue
        
        return specs
    
    async def _extract_reviews(self, page: Page) -> list:
        """提取评论"""
        reviews = []
        
        # 提取前几条评论
        review_elements = await page.query_selector_all(
            ".ReviewCard"
        )
        
        for i, review in enumerate(review_elements[:5]):  # 只提取前5条
            try:
                rating = await self.safe_extract(
                    review, ".ReviewCard-rating", default=""
                )
                title = await self.safe_extract(
                    review, ".ReviewCard-title", default=""
                )
                content = await self.safe_extract(
                    review, ".ReviewCard-content", default=""
                )
                
                if content:
                    reviews.append({
                        "rating": rating,
                        "title": title,
                        "content": content
                    })
            except Exception as e:
                continue
        
        return reviews