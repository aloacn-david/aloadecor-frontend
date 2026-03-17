"""
数据标准化模块
将不同平台抓取的数据统一为标准格式
"""
from typing import Dict, Any, Optional, List
from datetime import datetime

from ..models.product_analysis import ScrapedProductData, PlatformType


class DataNormalizer:
    """数据标准化器"""
    
    def normalize(self, raw_data: Dict[str, Any], product_id: str, 
                 platform: PlatformType, url: str) -> ScrapedProductData:
        """
        标准化数据
        
        Args:
            raw_data: 原始抓取数据
            product_id: 产品ID
            platform: 平台类型
            url: 产品URL
            
        Returns:
            标准化的产品数据
        """
        # 处理错误情况
        if 'error' in raw_data:
            return ScrapedProductData(
                product_id=product_id,
                platform=platform,
                url=url,
                errors=[{
                    "error_type": "SCRAPING_ERROR",
                    "message": raw_data['error'],
                    "context": {"url": url}
                }],
                scraped_at=datetime.now()
            )
        
        # 标准化各个字段
        return ScrapedProductData(
            product_id=product_id,
            platform=platform,
            url=url,
            title=self._normalize_title(raw_data.get('title')),
            price=self._normalize_price(raw_data.get('price')),
            currency=self._normalize_currency(raw_data.get('currency')),
            rating=self._normalize_rating(raw_data.get('rating')),
            review_count=self._normalize_review_count(raw_data.get('review_count')),
            images=self._normalize_images(raw_data.get('images', [])),
            bullets=self._normalize_bullets(raw_data.get('bullets', [])),
            description=self._normalize_description(raw_data.get('description')),
            specifications=self._normalize_specifications(raw_data.get('specifications', {})),
            reviews=self._normalize_reviews(raw_data.get('reviews', [])),
            region=self._normalize_region(raw_data.get('region')),
            scraped_at=datetime.now()
        )
    
    def _normalize_title(self, title: Optional[str]) -> str:
        """
        标准化标题
        
        Args:
            title: 原始标题
            
        Returns:
            标准化的标题
        """
        if not title:
            return ""
        return title.strip()
    
    def _normalize_price(self, price: Optional[float]) -> Optional[float]:
        """
        标准化价格
        
        Args:
            price: 原始价格
            
        Returns:
            标准化的价格
        """
        if price is None:
            return None
        try:
            return float(price)
        except (ValueError, TypeError):
            return None
    
    def _normalize_currency(self, currency: Optional[str]) -> str:
        """
        标准化货币
        
        Args:
            currency: 原始货币
            
        Returns:
            标准化的货币
        """
        if not currency:
            return "USD"
        # 标准化货币代码
        currency_map = {
            "$": "USD",
            "€": "EUR",
            "£": "GBP",
            "¥": "JPY"
        }
        return currency_map.get(currency, currency.upper())
    
    def _normalize_rating(self, rating: Optional[float]) -> Optional[float]:
        """
        标准化评分
        
        Args:
            rating: 原始评分
            
        Returns:
            标准化的评分
        """
        if rating is None:
            return None
        try:
            rating_float = float(rating)
            # 确保评分在0-5之间
            return max(0.0, min(5.0, rating_float))
        except (ValueError, TypeError):
            return None
    
    def _normalize_review_count(self, review_count: Optional[int]) -> Optional[int]:
        """
        标准化评论数
        
        Args:
            review_count: 原始评论数
            
        Returns:
            标准化的评论数
        """
        if review_count is None:
            return None
        try:
            return max(0, int(review_count))
        except (ValueError, TypeError):
            return None
    
    def _normalize_images(self, images: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        标准化图片
        
        Args:
            images: 原始图片列表
            
        Returns:
            标准化的图片列表
        """
        normalized_images = []
        
        for img in images:
            if isinstance(img, dict) and 'url' in img:
                normalized_images.append({
                    "url": img['url'],
                    "type": img.get('type', 'unknown'),
                    "alt": img.get('alt', '')
                })
        
        return normalized_images
    
    def _normalize_bullets(self, bullets: List[str]) -> List[str]:
        """
        标准化要点
        
        Args:
            bullets: 原始要点列表
            
        Returns:
            标准化的要点列表
        """
        normalized_bullets = []
        
        for bullet in bullets:
            if bullet and isinstance(bullet, str):
                bullet_text = bullet.strip()
                if bullet_text:
                    normalized_bullets.append(bullet_text)
        
        return normalized_bullets
    
    def _normalize_description(self, description: Optional[str]) -> str:
        """
        标准化描述
        
        Args:
            description: 原始描述
            
        Returns:
            标准化的描述
        """
        if not description:
            return ""
        return description.strip()
    
    def _normalize_specifications(self, specifications: Dict[str, Any]) -> Dict[str, str]:
        """
        标准化规格参数
        
        Args:
            specifications: 原始规格参数
            
        Returns:
            标准化的规格参数
        """
        normalized_specs = {}
        
        if isinstance(specifications, dict):
            for key, value in specifications.items():
                if key and value:
                    normalized_key = key.strip()
                    normalized_value = str(value).strip()
                    if normalized_key and normalized_value:
                        # 标准化常见字段名
                        normalized_key = self._normalize_spec_key(normalized_key)
                        normalized_specs[normalized_key] = normalized_value
        
        return normalized_specs
    
    def _normalize_spec_key(self, key: str) -> str:
        """
        标准化规格字段名
        
        Args:
            key: 原始字段名
            
        Returns:
            标准化的字段名
        """
        key_map = {
            "material": "Material",
            "color": "Color",
            "dimension": "Dimensions",
            "size": "Dimensions",
            "bulb base": "Bulb Base",
            "bulb count": "Bulb Count",
            "voltage": "Voltage",
            "installation type": "Installation Type",
            "weight": "Weight",
            "warranty": "Warranty"
        }
        
        lower_key = key.lower()
        return key_map.get(lower_key, key)
    
    def _normalize_reviews(self, reviews: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        标准化评论
        
        Args:
            reviews: 原始评论列表
            
        Returns:
            标准化的评论列表
        """
        normalized_reviews = []
        
        for review in reviews:
            if isinstance(review, dict) and 'content' in review:
                normalized_reviews.append({
                    "rating": str(review.get('rating', '')),
                    "title": review.get('title', ''),
                    "content": review.get('content', '')
                })
        
        return normalized_reviews
    
    def _normalize_region(self, region: Optional[str]) -> str:
        """
        标准化地区
        
        Args:
            region: 原始地区
            
        Returns:
            标准化的地区
        """
        if not region:
            return "US"
        return region.upper()
    
    def normalize_batch(self, batch_data: List[Dict[str, Any]]) -> List[ScrapedProductData]:
        """
        批量标准化数据
        
        Args:
            batch_data: 批量原始数据
            
        Returns:
            批量标准化的产品数据
        """
        normalized_data = []
        
        for item in batch_data:
            try:
                normalized_item = self.normalize(
                    raw_data=item['raw_data'],
                    product_id=item['product_id'],
                    platform=item['platform'],
                    url=item['url']
                )
                normalized_data.append(normalized_item)
            except Exception as e:
                # 处理异常情况
                normalized_data.append(ScrapedProductData(
                    product_id=item.get('product_id', ''),
                    platform=item.get('platform'),
                    url=item.get('url', ''),
                    errors=[{
                        "error_type": "NORMALIZATION_ERROR",
                        "message": str(e),
                        "context": item
                    }],
                    scraped_at=datetime.now()
                ))
        
        return normalized_data