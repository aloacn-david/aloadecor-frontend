"""
AI分析模块
使用LLM对产品Listing进行语义分析并生成改进建议
"""
import os
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from openai import OpenAI

from ..models.product_analysis import ScrapedProductData


@dataclass
class AIAnalysisResult:
    """AI分析结果"""
    summary: str
    issues: List[str]
    suggestions: List[str]
    confidence: float
    needs_manual_review: bool


class AIAnalyzer:
    """AI分析器"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        初始化AI分析器
        
        Args:
            api_key: OpenAI API密钥
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-3.5-turbo"
    
    def analyze_product(self, product_data: ScrapedProductData, 
                       rule_analysis: Dict[str, Any],
                       platform: str, category: str = "lighting") -> AIAnalysisResult:
        """
        分析产品数据
        
        Args:
            product_data: 抓取的产品数据
            rule_analysis: 规则分析结果
            platform: 平台名称
            category: 产品类别
            
        Returns:
            AI分析结果
        """
        # 构建提示
        prompt = self._build_prompt(product_data, rule_analysis, platform, category)
        
        # 调用OpenAI API
        response = self._call_openai(prompt)
        
        # 解析响应
        result = self._parse_response(response)
        
        return result
    
    def _build_prompt(self, product_data: ScrapedProductData, 
                     rule_analysis: Dict[str, Any],
                     platform: str, category: str) -> str:
        """
        构建分析提示
        
        Args:
            product_data: 抓取的产品数据
            rule_analysis: 规则分析结果
            platform: 平台名称
            category: 产品类别
            
        Returns:
            提示文本
        """
        # 提取关键信息
        title = product_data.title or ""
        bullets = product_data.bullets or []
        description = product_data.description or ""
        specifications = product_data.specifications or {}
        reviews = product_data.reviews or []
        
        # 提取规则分析结果
        overall_score = rule_analysis.get("overall_score", 0)
        title_issues = rule_analysis.get("title_analysis", {}).get("issues", [])
        image_issues = rule_analysis.get("image_analysis", {}).get("issues", [])
        parameter_issues = rule_analysis.get("parameter_analysis", {}).get("issues", [])
        
        # 构建提示
        prompt = f"""
You are an expert ecommerce product listing analyst. Your task is to analyze the following product listing from {platform} and provide detailed feedback and improvement suggestions.

Product Category: {category}

Product Information:
- Title: {title}
- Bullets: {bullets}
- Description: {description}
- Specifications: {specifications}
- Reviews: {[review.get('content', '') for review in reviews[:3]]}

Rule-Based Analysis Results:
- Overall Score: {overall_score}
- Title Issues: {title_issues}
- Image Issues: {image_issues}
- Parameter Issues: {parameter_issues}

Please provide:
1. A concise summary of the listing's overall quality (2-3 sentences)
2. A list of specific issues found in the listing (focus on content, keywords, and information gaps)
3. Exactly 3 high-priority improvement suggestions
4. A confidence score (0-100) for your analysis
5. Whether the listing needs manual review (true/false)

Format your response as JSON with the following keys:
- summary
- issues
- suggestions
- confidence
- needs_manual_review
"""
        
        return prompt
    
    def _call_openai(self, prompt: str) -> str:
        """
        调用OpenAI API
        
        Args:
            prompt: 提示文本
            
        Returns:
            API响应
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert ecommerce product listing analyst. Provide detailed and actionable feedback."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            # 处理API调用异常
            print(f"Error calling OpenAI API: {e}")
            # 返回默认结果
            return json.dumps({
                "summary": "AI analysis failed due to API error",
                "issues": ["API error prevented analysis"],
                "suggestions": ["Fix API connection to get detailed suggestions"],
                "confidence": 0,
                "needs_manual_review": True
            })
    
    def _parse_response(self, response: str) -> AIAnalysisResult:
        """
        解析API响应
        
        Args:
            response: API响应
            
        Returns:
            AI分析结果
        """
        try:
            # 提取JSON部分
            import re
            json_match = re.search(r'\{[^\}]*\}', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                data = json.loads(json_str)
            else:
                # 尝试直接解析整个响应
                data = json.loads(response)
            
            return AIAnalysisResult(
                summary=data.get("summary", ""),
                issues=data.get("issues", []),
                suggestions=data.get("suggestions", []),
                confidence=data.get("confidence", 0),
                needs_manual_review=data.get("needs_manual_review", False)
            )
            
        except json.JSONDecodeError:
            # 解析失败，返回默认结果
            return AIAnalysisResult(
                summary="Failed to parse AI response",
                issues=["AI response format error"],
                suggestions=["Check AI response format"],
                confidence=0,
                needs_manual_review=True
            )
    
    def analyze_batch(self, batch_data: List[Dict[str, Any]]) -> List[AIAnalysisResult]:
        """
        批量分析产品
        
        Args:
            batch_data: 批量数据列表，每个元素包含product_data、rule_analysis、platform等
            
        Returns:
            批量分析结果
        """
        results = []
        
        for item in batch_data:
            try:
                result = self.analyze_product(
                    product_data=item["product_data"],
                    rule_analysis=item["rule_analysis"],
                    platform=item["platform"],
                    category=item.get("category", "lighting")
                )
                results.append(result)
            except Exception as e:
                # 处理异常
                print(f"Error analyzing product: {e}")
                results.append(AIAnalysisResult(
                    summary="Analysis failed",
                    issues=[f"Error: {str(e)}"],
                    suggestions=["Fix error to get detailed suggestions"],
                    confidence=0,
                    needs_manual_review=True
                ))
        
        return results