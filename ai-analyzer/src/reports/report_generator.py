"""
分析报告生成模块
整合规则分析和AI分析结果，生成结构化报告
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass

from ..models.product_analysis import ProductAnalysis, PlatformType
from ..analyzers.rule_based_analyzer import RuleBasedAnalyzer
from ..analyzers.ai_analyzer import AIAnalyzer, AIAnalysisResult


@dataclass
class AnalysisReport:
    """分析报告"""
    product_id: str
    sku: str
    platform: str
    url: str
    overall_score: float
    rule_analysis: Dict[str, Any]
    ai_analysis: Optional[AIAnalysisResult]
    priority_suggestions: List[Dict[str, Any]]
    analysis_timestamp: datetime
    status: str


class ReportGenerator:
    """报告生成器"""
    
    def __init__(self, rule_analyzer: RuleBasedAnalyzer, 
                 ai_analyzer: Optional[AIAnalyzer] = None):
        """
        初始化报告生成器
        
        Args:
            rule_analyzer: 规则分析器
            ai_analyzer: AI分析器（可选）
        """
        self.rule_analyzer = rule_analyzer
        self.ai_analyzer = ai_analyzer
    
    def generate_report(self, product_data: Dict[str, Any], 
                       product_id: str, sku: str, 
                       platform: str, url: str, 
                       run_ai: bool = False, 
                       category: str = "lighting") -> AnalysisReport:
        """
        生成分析报告
        
        Args:
            product_data: 产品数据
            product_id: 产品ID
            sku: 产品SKU
            platform: 平台名称
            url: 产品URL
            run_ai: 是否运行AI分析
            category: 产品类别
            
        Returns:
            分析报告
        """
        # 运行规则分析
        rule_analysis = self.rule_analyzer.analyze_product(product_data)
        overall_score = rule_analysis.get("overall_score", 0)
        
        # 运行AI分析（如果需要）
        ai_analysis = None
        if run_ai and self.ai_analyzer:
            try:
                from ..models.product_analysis import ScrapedProductData, PlatformType
                # 构建ScrapedProductData对象
                scraped_data = ScrapedProductData(
                    product_id=product_id,
                    platform=PlatformType(platform.lower()),
                    url=url,
                    title=product_data.get("title"),
                    price=product_data.get("price"),
                    currency=product_data.get("currency"),
                    rating=product_data.get("rating"),
                    review_count=product_data.get("review_count"),
                    images=product_data.get("images", []),
                    bullets=product_data.get("bullets", []),
                    description=product_data.get("description"),
                    specifications=product_data.get("specifications", {}),
                    reviews=product_data.get("reviews", []),
                    region=product_data.get("region", "US"),
                    scraped_at=datetime.now()
                )
                ai_analysis = self.ai_analyzer.analyze_product(
                    scraped_data, rule_analysis, platform, category
                )
            except Exception as e:
                print(f"AI analysis failed: {e}")
        
        # 生成优先级建议
        priority_suggestions = self._generate_priority_suggestions(
            rule_analysis, ai_analysis
        )
        
        # 确定状态
        status = self._determine_status(overall_score, ai_analysis)
        
        return AnalysisReport(
            product_id=product_id,
            sku=sku,
            platform=platform,
            url=url,
            overall_score=overall_score,
            rule_analysis=rule_analysis,
            ai_analysis=ai_analysis,
            priority_suggestions=priority_suggestions,
            analysis_timestamp=datetime.now(),
            status=status
        )
    
    def _generate_priority_suggestions(self, rule_analysis: Dict[str, Any], 
                                      ai_analysis: Optional[AIAnalysisResult]) -> List[Dict[str, Any]]:
        """
        生成优先级建议
        
        Args:
            rule_analysis: 规则分析结果
            ai_analysis: AI分析结果
            
        Returns:
            优先级建议列表
        """
        suggestions = []
        priority_counter = 1
        
        # 从规则分析中提取建议
        if "title_analysis" in rule_analysis:
            title_suggestions = rule_analysis["title_analysis"].get("suggestions", [])
            for suggestion in title_suggestions[:2]:  # 最多取2个
                suggestions.append({
                    "priority": priority_counter,
                    "category": "Title",
                    "issue": "Title optimization needed",
                    "recommendation": suggestion,
                    "expected_impact": "High"
                })
                priority_counter += 1
        
        if "image_analysis" in rule_analysis:
            image_suggestions = rule_analysis["image_analysis"].get("suggestions", [])
            for suggestion in image_suggestions[:2]:  # 最多取2个
                suggestions.append({
                    "priority": priority_counter,
                    "category": "Images",
                    "issue": "Image optimization needed",
                    "recommendation": suggestion,
                    "expected_impact": "Medium"
                })
                priority_counter += 1
        
        if "parameter_analysis" in rule_analysis:
            param_suggestions = rule_analysis["parameter_analysis"].get("suggestions", [])
            for suggestion in param_suggestions[:2]:  # 最多取2个
                suggestions.append({
                    "priority": priority_counter,
                    "category": "Specifications",
                    "issue": "Specifications incomplete",
                    "recommendation": suggestion,
                    "expected_impact": "Medium"
                })
                priority_counter += 1
        
        # 从AI分析中提取建议
        if ai_analysis:
            ai_suggestions = ai_analysis.suggestions[:3]  # 最多取3个
            for suggestion in ai_suggestions:
                suggestions.append({
                    "priority": priority_counter,
                    "category": "AI Suggestion",
                    "issue": "Content improvement needed",
                    "recommendation": suggestion,
                    "expected_impact": "High"
                })
                priority_counter += 1
        
        # 按优先级排序并限制数量
        suggestions = sorted(suggestions, key=lambda x: x["priority"])[:5]  # 最多5个建议
        
        return suggestions
    
    def _determine_status(self, overall_score: float, 
                         ai_analysis: Optional[AIAnalysisResult]) -> str:
        """
        确定分析状态
        
        Args:
            overall_score: 总体评分
            ai_analysis: AI分析结果
            
        Returns:
            状态
        """
        if overall_score >= 80:
            return "Excellent"
        elif overall_score >= 70:
            return "Good"
        elif overall_score >= 60:
            return "Average"
        else:
            return "Poor"
    
    def generate_batch_reports(self, batch_data: List[Dict[str, Any]], 
                              run_ai: bool = False, 
                              category: str = "lighting") -> List[AnalysisReport]:
        """
        批量生成分析报告
        
        Args:
            batch_data: 批量数据列表
            run_ai: 是否运行AI分析
            category: 产品类别
            
        Returns:
            分析报告列表
        """
        reports = []
        
        for item in batch_data:
            try:
                report = self.generate_report(
                    product_data=item["product_data"],
                    product_id=item["product_id"],
                    sku=item["sku"],
                    platform=item["platform"],
                    url=item["url"],
                    run_ai=run_ai,
                    category=category
                )
                reports.append(report)
            except Exception as e:
                print(f"Error generating report: {e}")
                # 生成错误报告
                error_report = AnalysisReport(
                    product_id=item.get("product_id", ""),
                    sku=item.get("sku", ""),
                    platform=item.get("platform", ""),
                    url=item.get("url", ""),
                    overall_score=0,
                    rule_analysis={"error": str(e)},
                    ai_analysis=None,
                    priority_suggestions=[{"priority": 1, "category": "Error", "issue": "Analysis failed", "recommendation": f"Fix error: {e}", "expected_impact": "Critical"}],
                    analysis_timestamp=datetime.now(),
                    status="Error"
                )
                reports.append(error_report)
        
        return reports
    
    def generate_summary_report(self, reports: List[AnalysisReport]) -> Dict[str, Any]:
        """
        生成摘要报告
        
        Args:
            reports: 分析报告列表
            
        Returns:
            摘要报告
        """
        if not reports:
            return {
                "total_products": 0,
                "total_listings": 0,
                "listings_with_issues": 0,
                "healthy_listings": 0,
                "platform_health": {},
                "issue_distribution": {},
                "average_score": 0
            }
        
        # 计算统计数据
        total_listings = len(reports)
        healthy_listings = sum(1 for r in reports if r.status in ["Excellent", "Good"])
        listings_with_issues = total_listings - healthy_listings
        average_score = sum(r.overall_score for r in reports) / total_listings if total_listings > 0 else 0
        
        # 平台健康度
        platform_health = {}
        for report in reports:
            if report.platform not in platform_health:
                platform_health[report.platform] = {
                    "total": 0,
                    "healthy": 0,
                    "average_score": 0,
                    "score_sum": 0
                }
            platform_health[report.platform]["total"] += 1
            platform_health[report.platform]["score_sum"] += report.overall_score
            if report.status in ["Excellent", "Good"]:
                platform_health[report.platform]["healthy"] += 1
        
        # 计算平台平均分数
        for platform, data in platform_health.items():
            data["average_score"] = data["score_sum"] / data["total"] if data["total"] > 0 else 0
            del data["score_sum"]
        
        # 问题分布
        issue_distribution = {
            "Missing Specs": 0,
            "Low Image Count": 0,
            "Title Issues": 0,
            "Cross Platform Conflict": 0
        }
        
        for report in reports:
            rule_analysis = report.rule_analysis
            
            # 检查标题问题
            if "title_analysis" in rule_analysis:
                title_issues = rule_analysis["title_analysis"].get("issues", [])
                if title_issues:
                    issue_distribution["Title Issues"] += 1
            
            # 检查图片问题
            if "image_analysis" in rule_analysis:
                image_issues = rule_analysis["image_analysis"].get("issues", [])
                if image_issues:
                    issue_distribution["Low Image Count"] += 1
            
            # 检查规格问题
            if "parameter_analysis" in rule_analysis:
                param_issues = rule_analysis["parameter_analysis"].get("issues", [])
                if param_issues:
                    issue_distribution["Missing Specs"] += 1
        
        return {
            "total_products": len(set(r.product_id for r in reports)),
            "total_listings": total_listings,
            "listings_with_issues": listings_with_issues,
            "healthy_listings": healthy_listings,
            "platform_health": platform_health,
            "issue_distribution": issue_distribution,
            "average_score": round(average_score, 2)
        }