"""
Amazon平台抓取器
专门用于抓取Amazon商品页面
"""
import re
from typing import Dict, Any, Optional
from playwright.async_api import Page

from .base_scraper import BaseScraper, ScrapingConfig
from ..models.product_analysis import PlatformType


class AmazonScraper(BaseScraper):
    """Amazon平台抓取器"""
    
    def __init__(self, config: Optional[ScrapingConfig] = None):
        super().__init__(config)
        self.platform = PlatformType.AMAZON
    
    async def scrape_product(self, url: str, product_id: str) -> Dict[str, Any]:
        """
        抓取Amazon产品页面
        
        Args:
            url: Amazon产品URL
            product_id: 产品ID
            
        Returns:
            抓取的产品数据
        """
        try:
            # 抓取页面
            page = await self.fetch_page(
                url,
                wait_for="#productTitle"
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
            page, "#productTitle", default=""
        )
    
    async def _extract_price(self, page: Page) -> Optional[float]:
        """提取价格"""
        # 尝试多个价格选择器
        price_selectors = [
            "#priceblock_ourprice",
            "#priceblock_dealprice",
            "#priceblock_saleprice",
            ".a-offscreen"
        ]
        
        for selector in price_selectors:
            price_text = await self.safe_extract(page, selector)
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
        price_text = await self.safe_extract(page, "#priceblock_ourprice")
        if price_text:
            currency_match = re.search(r"([^0-9.,\s]+)", price_text)
            if currency_match:
                return currency_match.group(1)
        return "USD"
    
    async def _extract_rating(self, page: Page) -> Optional[float]:
        """提取评分"""
        rating_text = await self.safe_extract(
            page, "#acrCustomerReviewText"
        )
        if rating_text:
            rating_match = re.search(r"([0-9.]+) out of 5", rating_text)
            if rating_match:
                try:
                    return float(rating_match.group(1))
                except ValueError:
                    pass
        return None
    
    async def _extract_review_count(self, page: Page) -> Optional[int]:
        """提取评论数"""
        review_text = await self.safe_extract(
            page, "#acrCustomerReviewText"
        )
        if review_text:
            review_match = re.search(r"([0-9,]+) customer reviews", review_text)
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
            page, "#landingImage", attribute="src"
        )
        if main_image:
            images.append({"url": main_image, "type": "main"})
        
        # 提取其他图片
        thumbnails = await page.query_selector_all(
            "#altImages img"
        )
        
        for i, thumbnail in enumerate(thumbnails):
            try:
                img_url = await thumbnail.get_attribute("src")
                if img_url:
                    # 替换缩略图为高清图
                    img_url = img_url.replace("_SX300_", "_SX1200_")
                    images.append({"url": img_url, "type": "detail"})
            except Exception as e:
                continue
        
        return images
    
    async def _extract_bullets(self, page: Page) -> list:
        """提取要点"""
        return await self.extract_multiple(
            page, "#feature-bullets li span"
        )
    
    async def _extract_description(self, page: Page) -> Optional[str]:
        """提取描述"""
        return await self.safe_extract(
            page, "#productDescription", default=""
        )
    
    async def _extract_specifications(self, page: Page) -> Dict[str, str]:
        """提取规格参数"""
        specs = {}
        
        # 提取产品信息表格
        rows = await page.query_selector_all(
            "#productDetailsTable tr"
        )
        
        for row in rows:
            try:
                label = await row.query_selector("th")
                value = await row.query_selector("td")
                
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
            ".review"
        )
        
        for i, review in enumerate(review_elements[:5]):  # 只提取前5条
            try:
                rating = await self.safe_extract(
                    review, ".review-rating", default=""
                )
                title = await self.safe_extract(
                    review, ".review-title", default=""
                )
                content = await self.safe_extract(
                    review, ".review-text", default=""
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