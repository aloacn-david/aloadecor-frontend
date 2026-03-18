"""
HTML解析模块
使用BeautifulSoup解析HTML内容
提供通用的HTML解析功能
"""
from typing import Dict, Any, Optional, List
from bs4 import BeautifulSoup
import re


class HTMLParser:
    """HTML解析器"""
    
    def __init__(self, html: str):
        """
        初始化解析器
        
        Args:
            html: HTML内容
        """
        self.soup = BeautifulSoup(html, 'html.parser')
    
    def extract_text(self, selector: str) -> Optional[str]:
        """
        提取指定选择器的文本内容
        
        Args:
            selector: CSS选择器
            
        Returns:
            提取的文本内容
        """
        element = self.soup.select_one(selector)
        if element:
            return element.get_text(strip=True)
        return None
    
    def extract_attribute(self, selector: str, attribute: str) -> Optional[str]:
        """
        提取指定选择器的属性值
        
        Args:
            selector: CSS选择器
            attribute: 属性名
            
        Returns:
            提取的属性值
        """
        element = self.soup.select_one(selector)
        if element and element.has_attr(attribute):
            return element[attribute]
        return None
    
    def extract_all_text(self, selector: str) -> List[str]:
        """
        提取所有匹配选择器的文本内容
        
        Args:
            selector: CSS选择器
            
        Returns:
            提取的文本内容列表
        """
        elements = self.soup.select(selector)
        return [element.get_text(strip=True) for element in elements]
    
    def extract_all_attributes(self, selector: str, attribute: str) -> List[str]:
        """
        提取所有匹配选择器的属性值
        
        Args:
            selector: CSS选择器
            attribute: 属性名
            
        Returns:
            提取的属性值列表
        """
        elements = self.soup.select(selector)
        return [
            element[attribute] for element in elements 
            if element.has_attr(attribute)
        ]
    
    def extract_table(self, selector: str) -> Dict[str, str]:
        """
        提取表格数据
        
        Args:
            selector: 表格的CSS选择器
            
        Returns:
            表格数据字典
        """
        table = self.soup.select_one(selector)
        if not table:
            return {}
        
        data = {}
        rows = table.find_all('tr')
        
        for row in rows:
            th = row.find('th')
            td = row.find('td')
            
            if th and td:
                key = th.get_text(strip=True)
                value = td.get_text(strip=True)
                if key:
                    data[key] = value
        
        return data
    
    def extract_price(self, selector: str) -> Optional[float]:
        """
        提取价格
        
        Args:
            selector: 价格元素的CSS选择器
            
        Returns:
            提取的价格
        """
        price_text = self.extract_text(selector)
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
    
    def extract_rating(self, selector: str) -> Optional[float]:
        """
        提取评分
        
        Args:
            selector: 评分元素的CSS选择器
            
        Returns:
            提取的评分
        """
        rating_text = self.extract_text(selector)
        if rating_text:
            rating_match = re.search(r"([0-9.]+)", rating_text)
            if rating_match:
                try:
                    return float(rating_match.group(1))
                except ValueError:
                    pass
        return None
    
    def extract_review_count(self, selector: str) -> Optional[int]:
        """
        提取评论数
        
        Args:
            selector: 评论数元素的CSS选择器
            
        Returns:
            提取的评论数
        """
        review_text = self.extract_text(selector)
        if review_text:
            review_match = re.search(r"([0-9,]+)", review_text)
            if review_match:
                review_str = review_match.group(1).replace(",", "")
                try:
                    return int(review_str)
                except ValueError:
                    pass
        return None
    
    def extract_images(self, selector: str) -> List[Dict[str, str]]:
        """
        提取图片
        
        Args:
            selector: 图片元素的CSS选择器
            
        Returns:
            图片列表
        """
        images = []
        img_elements = self.soup.select(selector)
        
        for img in img_elements:
            img_url = img.get('src')
            if img_url:
                images.append({
                    "url": img_url,
                    "alt": img.get('alt', '')
                })
        
        return images
    
    def has_element(self, selector: str) -> bool:
        """
        检查是否存在指定元素
        
        Args:
            selector: CSS选择器
            
        Returns:
            是否存在
        """
        return bool(self.soup.select_one(selector))
    
    def get_page_title(self) -> Optional[str]:
        """
        获取页面标题
        
        Returns:
            页面标题
        """
        title = self.soup.find('title')
        if title:
            return title.get_text(strip=True)
        return None
    
    def get_meta_description(self) -> Optional[str]:
        """
        获取页面描述
        
        Returns:
            页面描述
        """
        meta = self.soup.find('meta', {'name': 'description'})
        if meta and meta.has_attr('content'):
            return meta['content']
        return None
    
    def check_rate_limit(self) -> bool:
        """
        检查是否被限制访问
        
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
        
        page_content = self.soup.get_text().lower()
        
        for indicator in rate_limit_indicators:
            if indicator in page_content:
                return True
        
        return False