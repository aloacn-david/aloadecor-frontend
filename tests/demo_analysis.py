"""
演示脚本 - 展示完整的产品分析流程
包括生成3条最高优先级建议
"""
import sys
import os

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from src.analyzers.rule_based_analyzer import RuleBasedAnalyzer
from src.models.product_analysis import Suggestion
from typing import List
import json


def generate_priority_suggestions(analysis_results: dict) -> List[Suggestion]:
    """
    基于分析结果生成3条最高优先级建议
    
    优先级规则：
    1. 缺失核心信息（标题、主图、关键参数）- 优先级1
    2. 质量改进（长度、数量、完整性）- 优先级2
    3. 优化建议（格式、可读性）- 优先级3
    """
    suggestions = []
    
    # 标题分析建议
    title_analysis = analysis_results.get("title_analysis")
    if title_analysis:
        if title_analysis.length < 30:
            suggestions.append(Suggestion(
                priority=1,
                category="标题",
                issue=f"标题过短 ({title_analysis.length}字符)",
                recommendation="增加标题长度至80字符左右，包含品牌名、核心关键词和规格信息",
                expected_impact="提升搜索排名，增加点击率"
            ))
        elif not title_analysis.has_keywords:
            suggestions.append(Suggestion(
                priority=2,
                category="标题",
                issue="标题缺少核心关键词",
                recommendation="添加产品类型关键词，如：chandelier、pendant、wall sconce等",
                expected_impact="提高搜索可见性"
            ))
    
    # 图片分析建议
    image_analysis = analysis_results.get("image_analysis")
    if image_analysis:
        if not image_analysis.has_main_image:
            suggestions.append(Suggestion(
                priority=1,
                category="图片",
                issue="缺少主图",
                recommendation="添加高质量主图，展示产品整体外观，背景简洁",
                expected_impact="提升产品吸引力，增加转化率"
            ))
        elif image_analysis.total_count < 3:
            suggestions.append(Suggestion(
                priority=1,
                category="图片",
                issue=f"图片数量不足 ({image_analysis.total_count}张)",
                recommendation="添加至少3-5张图片，包括主图、细节图、场景图",
                expected_impact="帮助客户全面了解产品"
            ))
        elif not image_analysis.has_scene_images:
            suggestions.append(Suggestion(
                priority=2,
                category="图片",
                issue="缺少场景图",
                recommendation="添加产品在实际环境中的场景图",
                expected_impact="帮助客户想象产品效果"
            ))
    
    # 参数分析建议
    parameter_analysis = analysis_results.get("parameter_analysis")
    if parameter_analysis:
        if parameter_analysis.missing_core:
            missing = parameter_analysis.missing_core[:2]
            suggestions.append(Suggestion(
                priority=1,
                category="参数",
                issue=f"缺少核心参数: {', '.join(missing)}",
                recommendation=f"补充{'和'.join(missing)}等关键参数信息",
                expected_impact="减少客户咨询，提升购买信心"
            ))
        elif parameter_analysis.completeness_score < 60:
            suggestions.append(Suggestion(
                priority=2,
                category="参数",
                issue=f"参数完整性较低 ({parameter_analysis.completeness_score}%)",
                recommendation="完善产品规格参数，确保包含尺寸、材质、功率等",
                expected_impact="提升专业度和客户信任"
            ))
    
    # 按优先级排序，取前3条
    suggestions.sort(key=lambda x: x.priority)
    return suggestions[:3]


def demo_product_analysis():
    """演示产品分析"""
    print("=" * 60)
    print("AI产品分析演示")
    print("=" * 60)
    
    analyzer = RuleBasedAnalyzer()
    
    # 案例1：需要改进的产品
    print("\n【案例1】需要改进的产品")
    print("-" * 60)
    
    product_data_1 = {
        "title": "Lamp",
        "images": [
            {"url": "https://example.com/main.jpg", "alt": "Main product image"},
        ],
        "parameters": {
            "Color": "Black",
        }
    }
    
    results_1 = analyzer.analyze_product(product_data_1)
    overall_score_1 = analyzer.calculate_overall_score(results_1)
    suggestions_1 = generate_priority_suggestions(results_1)
    
    print(f"产品标题: {product_data_1['title']}")
    print(f"总体评分: {overall_score_1}/100")
    print(f"\n分析摘要:")
    
    if results_1.get("title_analysis"):
        title = results_1["title_analysis"]
        print(f"  - 标题长度: {title.length}字符 (评分: {title.length_score})")
    
    if results_1.get("image_analysis"):
        img = results_1["image_analysis"]
        print(f"  - 图片数量: {img.total_count}张 (多样性: {img.diversity_score})")
    
    if results_1.get("parameter_analysis"):
        param = results_1["parameter_analysis"]
        print(f"  - 参数完整性: {param.completeness_score}%")
    
    print(f"\n🎯 最高优先级改进建议:")
    for i, suggestion in enumerate(suggestions_1, 1):
        print(f"\n  {i}. 【优先级{ suggestion.priority}】{suggestion.category}")
        print(f"     问题: {suggestion.issue}")
        print(f"     建议: {suggestion.recommendation}")
        print(f"     预期效果: {suggestion.expected_impact}")
    
    # 案例2：较好的产品
    print("\n" + "=" * 60)
    print("【案例2】较好的产品")
    print("-" * 60)
    
    product_data_2 = {
        "title": "Modern Black Iron Chandelier 24 inch 3-Light Ceiling Fixture",
        "images": [
            {"url": "https://example.com/main.jpg", "alt": "Main product image"},
            {"url": "https://example.com/detail1.jpg", "alt": "Detail view"},
            {"url": "https://example.com/scene.jpg", "alt": "Room scene"},
            {"url": "https://example.com/size.jpg", "alt": "Size dimensions"},
        ],
        "parameters": {
            "Dimensions": '24" x 12" x 8"',
            "Material": "Iron",
            "Finish": "Matte Black",
            "Color": "Black",
            "Weight": "5 lbs",
            "Wattage": "60W",
            "Voltage": "120V",
        }
    }
    
    results_2 = analyzer.analyze_product(product_data_2)
    overall_score_2 = analyzer.calculate_overall_score(results_2)
    suggestions_2 = generate_priority_suggestions(results_2)
    
    print(f"产品标题: {product_data_2['title']}")
    print(f"总体评分: {overall_score_2}/100")
    print(f"\n分析摘要:")
    
    if results_2.get("title_analysis"):
        title = results_2["title_analysis"]
        print(f"  - 标题长度: {title.length}字符 (评分: {title.length_score})")
    
    if results_2.get("image_analysis"):
        img = results_2["image_analysis"]
        print(f"  - 图片数量: {img.total_count}张 (多样性: {img.diversity_score})")
    
    if results_2.get("parameter_analysis"):
        param = results_2["parameter_analysis"]
        print(f"  - 参数完整性: {param.completeness_score}%")
    
    if suggestions_2:
        print(f"\n🎯 优化建议:")
        for i, suggestion in enumerate(suggestions_2, 1):
            print(f"\n  {i}. 【优先级{suggestion.priority}】{suggestion.category}")
            print(f"     问题: {suggestion.issue}")
            print(f"     建议: {suggestion.recommendation}")
    else:
        print(f"\n✅ 产品信息完整，暂无高优先级改进建议")
    
    # 输出JSON格式结果
    print("\n" + "=" * 60)
    print("JSON格式输出示例")
    print("-" * 60)
    
    output = {
        "product_id": "demo_product_001",
        "overall_score": overall_score_2,
        "analysis": {
            "title": {
                "score": results_2["title_analysis"].length_score if results_2.get("title_analysis") else 0,
                "issues": results_2["title_analysis"].issues if results_2.get("title_analysis") else []
            },
            "images": {
                "count": results_2["image_analysis"].total_count if results_2.get("image_analysis") else 0,
                "diversity_score": results_2["image_analysis"].diversity_score if results_2.get("image_analysis") else 0
            },
            "parameters": {
                "completeness": results_2["parameter_analysis"].completeness_score if results_2.get("parameter_analysis") else 0,
                "missing": results_2["parameter_analysis"].missing_core if results_2.get("parameter_analysis") else []
            }
        },
        "priority_suggestions": [
            {
                "priority": s.priority,
                "category": s.category,
                "issue": s.issue,
                "recommendation": s.recommendation,
                "expected_impact": s.expected_impact
            }
            for s in suggestions_2
        ]
    }
    
    print(json.dumps(output, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    print("AI产品分析系统演示\n")
    
    try:
        demo_product_analysis()
        
        print("\n" + "=" * 60)
        print("演示完成！")
        print("=" * 60)
        print("\n系统功能:")
        print("  ✓ 标题质量分析（长度、关键词、可读性）")
        print("  ✓ 图片分析（数量、类型、多样性）")
        print("  ✓ 参数完整性分析")
        print("  ✓ 核心事实提取")
        print("  ✓ 智能优先级建议生成")
        print("\n下一步:")
        print("  1. 集成Playwright抓取真实产品数据")
        print("  2. 添加评论分析功能")
        print("  3. 实现跨平台一致性检查")
        print("  4. 集成到Admin Panel前端")
        
    except Exception as e:
        print(f"\n演示过程中出现错误: {e}")
        import traceback
        traceback.print_exc()
