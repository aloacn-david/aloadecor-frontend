"""
测试脚本 - 验证AI分析功能
"""
import sys
import os

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from src.analyzers.rule_based_analyzer import RuleBasedAnalyzer
from src.models.product_analysis import ProductAnalysis, PlatformType
import json


def test_title_analysis():
    """测试标题分析"""
    print("=" * 50)
    print("测试标题分析")
    print("=" * 50)
    
    analyzer = RuleBasedAnalyzer()
    
    # 测试案例1：良好的标题
    good_title = "Modern Black Iron Chandelier 24 inch 3-Light Ceiling Fixture"
    result = analyzer.title_analyzer.analyze(good_title)
    
    print(f"\n标题: {result.title}")
    print(f"长度: {result.length} 字符")
    print(f"长度评分: {result.length_score}")
    print(f"可读性评分: {result.readability_score}")
    print(f"包含品牌: {result.has_brand}")
    print(f"包含关键词: {result.has_keywords}")
    print(f"包含规格: {result.has_specifications}")
    print(f"问题: {result.issues}")
    print(f"建议: {result.suggestions}")
    
    # 测试案例2：较差的标题
    bad_title = "Lamp"
    result2 = analyzer.title_analyzer.analyze(bad_title)
    
    print(f"\n标题: {result2.title}")
    print(f"长度: {result2.length} 字符")
    print(f"问题: {result2.issues}")
    print(f"建议: {result2.suggestions}")


def test_image_analysis():
    """测试图片分析"""
    print("\n" + "=" * 50)
    print("测试图片分析")
    print("=" * 50)
    
    analyzer = RuleBasedAnalyzer()
    
    # 模拟图片数据
    images = [
        {"url": "https://example.com/main.jpg", "alt": "Main product image"},
        {"url": "https://example.com/detail1.jpg", "alt": "Detail view"},
        {"url": "https://example.com/scene.jpg", "alt": "Room scene"},
        {"url": "https://example.com/size.jpg", "alt": "Size dimensions"},
    ]
    
    result = analyzer.image_analyzer.analyze(images)
    
    print(f"\n图片总数: {result.total_count}")
    print(f"类型分布: {result.type_distribution}")
    print(f"有主图: {result.has_main_image}")
    print(f"有细节图: {result.has_detail_images}")
    print(f"有场景图: {result.has_scene_images}")
    print(f"有尺寸图: {result.has_size_image}")
    print(f"多样性评分: {result.diversity_score}")
    print(f"问题: {result.issues}")
    print(f"建议: {result.suggestions}")


def test_parameter_analysis():
    """测试参数分析"""
    print("\n" + "=" * 50)
    print("测试参数分析")
    print("=" * 50)
    
    analyzer = RuleBasedAnalyzer()
    
    # 模拟参数数据
    parameters = {
        "Dimensions": '24" x 12" x 8"',
        "Material": "Iron",
        "Finish": "Matte Black",
        "Color": "Black",
        "Weight": "5 lbs",
        "Wattage": "60W",
        "Voltage": "120V",
    }
    
    result = analyzer.parameter_analyzer.analyze(parameters)
    
    print(f"\n参数总数: {result.total_parameters}")
    print(f"核心参数:")
    for key, value in result.core_parameters.items():
        print(f"  {key}: {value}")
    print(f"缺失核心参数: {result.missing_core}")
    print(f"完整性评分: {result.completeness_score}")
    print(f"格式问题: {result.format_issues}")
    print(f"建议: {result.suggestions}")


def test_core_facts():
    """测试核心事实提取"""
    print("\n" + "=" * 50)
    print("测试核心事实提取")
    print("=" * 50)
    
    analyzer = RuleBasedAnalyzer()
    
    title = "Modern Black Iron Chandelier 24 inch 3-Light Ceiling Fixture"
    parameters = {
        "Dimensions": '24" x 12"',
        "Material": "Iron",
        "Finish": "Matte Black",
    }
    
    result = analyzer.core_facts_analyzer.extract_core_facts(title, parameters)
    
    print(f"\n提取的核心事实:")
    for fact_type, fact in result.facts.items():
        print(f"  {fact_type}: {fact.value} (置信度: {fact.confidence}%)")


def test_full_analysis():
    """测试完整分析流程"""
    print("\n" + "=" * 50)
    print("测试完整分析流程")
    print("=" * 50)
    
    analyzer = RuleBasedAnalyzer()
    
    # 模拟完整产品数据
    product_data = {
        "title": "Modern Black Iron Chandelier 24 inch 3-Light Ceiling Fixture",
        "images": [
            {"url": "https://example.com/main.jpg", "alt": "Main product image"},
            {"url": "https://example.com/detail1.jpg", "alt": "Detail view"},
            {"url": "https://example.com/scene.jpg", "alt": "Room scene"},
        ],
        "parameters": {
            "Dimensions": '24" x 12" x 8"',
            "Material": "Iron",
            "Finish": "Matte Black",
            "Color": "Black",
            "Weight": "5 lbs",
        }
    }
    
    results = analyzer.analyze_product(product_data)
    overall_score = analyzer.calculate_overall_score(results)
    
    print(f"\n总体评分: {overall_score}/100")
    print(f"\n分析结果:")
    
    # 安全地获取分析结果
    title_analysis = results.get("title_analysis")
    image_analysis = results.get("image_analysis")
    parameter_analysis = results.get("parameter_analysis")
    
    summary = {
        "title_score": title_analysis.length_score if title_analysis else None,
        "image_diversity": image_analysis.diversity_score if image_analysis else None,
        "parameter_completeness": parameter_analysis.completeness_score if parameter_analysis else None,
    }
    
    print(json.dumps(summary, indent=2, default=str))


if __name__ == "__main__":
    print("开始测试AI分析功能...\n")
    
    try:
        test_title_analysis()
        test_image_analysis()
        test_parameter_analysis()
        test_core_facts()
        test_full_analysis()
        
        print("\n" + "=" * 50)
        print("所有测试完成！")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()
