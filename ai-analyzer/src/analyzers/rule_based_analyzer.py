"""
规则分析模块
基于规则的产品质量分析
不需要AI模型，计算速度快
"""
import re
from typing import List, Dict, Optional
from bs4 import BeautifulSoup

from ..models.product_analysis import (
    TitleAnalysis, ImageAnalysis, ImageInfo, ImageType,
    ParameterAnalysis, CoreFacts, CoreFact,
    PlatformType
)


class TitleAnalyzer:
    """标题分析器"""
    
    # 标题长度标准
    MIN_LENGTH = 30
    MAX_LENGTH = 200
    OPTIMAL_LENGTH = 80
    
    # 关键词列表（可以根据产品类型扩展）
    KEYWORDS = [
        "light", "lamp", "chandelier", "pendant", "sconce", 
        "fixture", "ceiling", "wall", "table", "floor"
    ]
    
    # 规格关键词
    SPEC_KEYWORDS = [
        "inch", '"', "cm", "mm", "watt", "w", "voltage", "v",
        "material", "finish", "color", "size"
    ]
    
    def analyze(self, title: str) -> TitleAnalysis:
        """分析标题质量"""
        length = len(title)
        
        # 长度评分
        if length < self.MIN_LENGTH:
            length_score = max(0, (length / self.MIN_LENGTH) * 50)
        elif length > self.MAX_LENGTH:
            length_score = max(0, 100 - ((length - self.MAX_LENGTH) / 10) * 5)
        else:
            # 在合理范围内，越接近最优长度分数越高
            diff = abs(length - self.OPTIMAL_LENGTH)
            length_score = max(60, 100 - diff)
        
        # 检查品牌名（简单规则：首字母大写的单词）
        has_brand = self._check_brand(title)
        
        # 检查关键词
        has_keywords = any(kw in title.lower() for kw in self.KEYWORDS)
        
        # 检查规格信息
        has_specifications = any(spec in title.lower() for spec in self.SPEC_KEYWORDS)
        
        # 可读性评分
        readability_score = self._calculate_readability(title)
        
        # 收集问题
        issues = []
        if length < self.MIN_LENGTH:
            issues.append(f"标题过短 ({length}字符)，建议至少{self.MIN_LENGTH}字符")
        if length > self.MAX_LENGTH:
            issues.append(f"标题过长 ({length}字符)，建议不超过{self.MAX_LENGTH}字符")
        if not has_keywords:
            issues.append("标题缺少核心产品关键词")
        if not has_specifications:
            issues.append("标题缺少规格信息")
        
        # 生成建议
        suggestions = self._generate_suggestions(title, length, has_brand, has_keywords, has_specifications)
        
        return TitleAnalysis(
            title=title,
            length=length,
            length_score=round(length_score, 2),
            has_brand=has_brand,
            has_keywords=has_keywords,
            has_specifications=has_specifications,
            readability_score=round(readability_score, 2),
            issues=issues,
            suggestions=suggestions
        )
    
    def _check_brand(self, title: str) -> bool:
        """检查是否包含品牌名"""
        # 简单规则：检查是否有首字母大写的单词在开头
        words = title.split()
        if words and words[0][0].isupper():
            return True
        return False
    
    def _calculate_readability(self, title: str) -> float:
        """计算可读性评分"""
        score = 100
        
        # 检查全大写
        if title.isupper():
            score -= 30
        
        # 检查特殊字符过多
        special_chars = len(re.findall(r'[^\w\s]', title))
        if special_chars > 5:
            score -= 20
        
        # 检查数字和文字比例
        numbers = len(re.findall(r'\d', title))
        if numbers > len(title) * 0.3:
            score -= 15
        
        return max(0, score)
    
    def _generate_suggestions(self, title: str, length: int, 
                             has_brand: bool, has_keywords: bool, 
                             has_specifications: bool) -> List[str]:
        """生成改进建议"""
        suggestions = []
        
        if length < self.MIN_LENGTH:
            suggestions.append(f"增加标题长度至{self.OPTIMAL_LENGTH}字符左右，添加产品特性和规格信息")
        elif length > self.MAX_LENGTH:
            suggestions.append("精简标题，保留核心信息，移除冗余词汇")
        
        if not has_brand:
            suggestions.append("在标题开头添加品牌名")
        
        if not has_keywords:
            suggestions.append(f"添加核心产品关键词，如：{', '.join(self.KEYWORDS[:3])}")
        
        if not has_specifications:
            suggestions.append("添加关键规格信息（尺寸、材质、功率等）")
        
        return suggestions


class ImageAnalyzer:
    """图片分析器（第一阶段）"""
    
    # 图片类型识别规则
    TYPE_RULES = {
        ImageType.MAIN: ["main", "primary", "hero", "default"],
        ImageType.DETAIL: ["detail", "closeup", "zoom", "texture"],
        ImageType.SCENE: ["scene", "room", "lifestyle", "installed"],
        ImageType.SIZE: ["size", "dimension", "measurement", "scale"],
        ImageType.FEATURE: ["feature", "spec", "detail"]
    }
    
    def analyze(self, images: List[Dict[str, any]]) -> ImageAnalysis:
        """分析图片质量"""
        total_count = len(images)
        
        # 分析每张图片
        image_infos = []
        type_distribution = {t: 0 for t in ImageType}
        
        for img in images:
            info = self._analyze_single_image(img)
            image_infos.append(info)
            type_distribution[info.image_type] += 1
        
        # 检查各类图片是否存在
        has_main = type_distribution[ImageType.MAIN] > 0
        has_detail = type_distribution[ImageType.DETAIL] > 0
        has_scene = type_distribution[ImageType.SCENE] > 0
        has_size = type_distribution[ImageType.SIZE] > 0
        
        # 多样性评分
        diversity_score = self._calculate_diversity(type_distribution, total_count)
        
        # 收集问题
        issues = []
        if total_count < 3:
            issues.append(f"图片数量过少 ({total_count}张)，建议至少3-5张")
        if not has_main:
            issues.append("缺少主图")
        if not has_detail:
            issues.append("缺少细节图")
        if not has_scene:
            issues.append("缺少场景图")
        
        # 生成建议
        suggestions = self._generate_suggestions(
            total_count, has_main, has_detail, has_scene, has_size
        )
        
        return ImageAnalysis(
            total_count=total_count,
            type_distribution=type_distribution,
            images=image_infos,
            has_main_image=has_main,
            has_detail_images=has_detail,
            has_scene_images=has_scene,
            has_size_image=has_size,
            diversity_score=round(diversity_score, 2),
            issues=issues,
            suggestions=suggestions,
            visual_quality_ready=False  # 第二阶段才进行
        )
    
    def _analyze_single_image(self, img: Dict[str, any]) -> ImageInfo:
        """分析单张图片"""
        url = img.get("url", "")
        alt_text = img.get("alt", "").lower()
        
        # 识别图片类型
        image_type = self._identify_image_type(alt_text, url)
        
        return ImageInfo(
            url=url,
            image_type=image_type,
            resolution=img.get("resolution"),
            file_size=img.get("file_size")
        )
    
    def _identify_image_type(self, alt_text: str, url: str) -> ImageType:
        """识别图片类型"""
        combined_text = f"{alt_text} {url}".lower()
        
        for img_type, keywords in self.TYPE_RULES.items():
            if any(kw in combined_text for kw in keywords):
                return img_type
        
        return ImageType.UNKNOWN
    
    def _calculate_diversity(self, type_distribution: Dict[ImageType, int], 
                            total: int) -> float:
        """计算多样性评分"""
        if total == 0:
            return 0
        
        # 计算有多少种不同类型的图片
        type_count = sum(1 for count in type_distribution.values() if count > 0)
        
        # 理想情况下应该有4种类型
        return min(100, (type_count / 4) * 100)
    
    def _generate_suggestions(self, total: int, has_main: bool, 
                             has_detail: bool, has_scene: bool, 
                             has_size: bool) -> List[str]:
        """生成改进建议"""
        suggestions = []
        
        if total < 5:
            suggestions.append(f"增加图片数量至5-8张，当前只有{total}张")
        
        if not has_main:
            suggestions.append("添加高质量主图，展示产品整体外观")
        if not has_detail:
            suggestions.append("添加细节图，展示材质、工艺等细节")
        if not has_scene:
            suggestions.append("添加场景图，展示产品在实际环境中的效果")
        if not has_size:
            suggestions.append("添加尺寸图或比例参照图")
        
        return suggestions


class ParameterAnalyzer:
    """参数分析器"""
    
    # 核心参数列表
    CORE_PARAMETERS = [
        "dimensions", "size", "material", "finish", "color",
        "weight", "wattage", "voltage", "bulb_type", "certification"
    ]
    
    def analyze(self, parameters: Dict[str, str]) -> ParameterAnalysis:
        """分析参数完整性"""
        total_params = len(parameters)
        
        # 检查核心参数
        core_params = {}
        missing_core = []
        
        for core_param in self.CORE_PARAMETERS:
            # 查找匹配的参数（支持模糊匹配）
            value = self._find_parameter(parameters, core_param)
            core_params[core_param] = value
            
            if value is None:
                missing_core.append(core_param)
        
        # 完整性评分
        completeness_score = self._calculate_completeness(
            core_params, self.CORE_PARAMETERS
        )
        
        # 检查格式问题
        format_issues = self._check_format_issues(parameters)
        
        # 收集问题
        issues = []
        if missing_core:
            issues.append(f"缺少核心参数: {', '.join(missing_core[:3])}")
        if format_issues:
            issues.extend(format_issues[:3])
        
        # 生成建议
        suggestions = self._generate_suggestions(missing_core, format_issues)
        
        return ParameterAnalysis(
            total_parameters=total_params,
            core_parameters=core_params,
            missing_core=missing_core,
            completeness_score=round(completeness_score, 2),
            format_issues=format_issues,
            issues=issues,
            suggestions=suggestions
        )
    
    def _find_parameter(self, parameters: Dict[str, str], 
                       target: str) -> Optional[str]:
        """查找参数（支持模糊匹配）"""
        target_lower = target.lower()
        
        # 精确匹配
        if target in parameters:
            return parameters[target]
        
        # 模糊匹配
        for key, value in parameters.items():
            key_lower = key.lower()
            if target_lower in key_lower or key_lower in target_lower:
                return value
        
        return None
    
    def _calculate_completeness(self, core_params: Dict[str, Optional[str]], 
                               core_list: List[str]) -> float:
        """计算完整性评分"""
        if not core_list:
            return 100
        
        found = sum(1 for v in core_params.values() if v is not None)
        return (found / len(core_list)) * 100
    
    def _check_format_issues(self, parameters: Dict[str, str]) -> List[str]:
        """检查格式问题"""
        issues = []
        
        for key, value in parameters.items():
            # 检查空值
            if not value or value.strip() == "":
                issues.append(f"参数 '{key}' 值为空")
            
            # 检查单位一致性
            if "size" in key.lower() or "dimension" in key.lower():
                if not any(unit in value for unit in ['"', "inch", "cm", "mm"]):
                    issues.append(f"参数 '{key}' 缺少单位标识")
        
        return issues
    
    def _generate_suggestions(self, missing_core: List[str], 
                             format_issues: List[str]) -> List[str]:
        """生成改进建议"""
        suggestions = []
        
        if missing_core:
            suggestions.append(f"补充缺失的核心参数: {', '.join(missing_core[:3])}")
        
        if format_issues:
            suggestions.append("统一参数格式，确保所有参数都有明确的单位和值")
        
        suggestions.append("使用标准参数名称，便于跨平台对比")
        
        return suggestions


class CoreFactsAnalyzer:
    """核心事实一致性分析器"""
    
    # 核心事实类型
    CORE_FACT_TYPES = [
        "brand", "model", "material", "color", "dimensions",
        "bulb_base", "bulb_count", "voltage", "installation_type"
    ]
    
    def extract_core_facts(self, title: str, parameters: Dict[str, str]) -> CoreFacts:
        """提取核心事实"""
        facts = {}
        
        # 从标题提取产品名称
        product_name = self._extract_product_name(title)
        facts["product_name"] = CoreFact(
            fact_type="product_name",
            value=product_name,
            confidence=80 if product_name else 50
        )
        
        # 提取品牌信息
        brand = self._extract_brand(title, parameters)
        if brand:
            facts["brand"] = CoreFact(
                fact_type="brand",
                value=brand,
                confidence=90
            )
        
        # 提取型号信息
        model = self._extract_model(parameters)
        if model:
            facts["model"] = CoreFact(
                fact_type="model",
                value=model,
                confidence=95
            )
        
        # 提取尺寸信息
        dimensions = self._extract_dimensions(title, parameters)
        if dimensions:
            facts["dimensions"] = CoreFact(
                fact_type="dimensions",
                value=dimensions,
                confidence=90
            )
        
        # 提取材质信息
        material = self._extract_material(title, parameters)
        if material:
            facts["material"] = CoreFact(
                fact_type="material",
                value=material,
                confidence=85
            )
        
        # 提取颜色信息
        color = self._extract_color(title, parameters)
        if color:
            facts["color"] = CoreFact(
                fact_type="color",
                value=color,
                confidence=85
            )
        
        # 提取灯泡底座信息
        bulb_base = self._extract_bulb_base(parameters)
        if bulb_base:
            facts["bulb_base"] = CoreFact(
                fact_type="bulb_base",
                value=bulb_base,
                confidence=90
            )
        
        # 提取灯泡数量信息
        bulb_count = self._extract_bulb_count(parameters)
        if bulb_count:
            facts["bulb_count"] = CoreFact(
                fact_type="bulb_count",
                value=bulb_count,
                confidence=90
            )
        
        # 提取电压信息
        voltage = self._extract_voltage(parameters)
        if voltage:
            facts["voltage"] = CoreFact(
                fact_type="voltage",
                value=voltage,
                confidence=90
            )
        
        # 提取安装类型信息
        installation_type = self._extract_installation_type(parameters)
        if installation_type:
            facts["installation_type"] = CoreFact(
                fact_type="installation_type",
                value=installation_type,
                confidence=85
            )
        
        return CoreFacts(
            facts=facts,
            consistency_score=0,  # 单平台分析时为0
            inconsistencies=[],
            missing_facts=[]
        )
    
    def analyze_cross_platform_consistency(self, facts_list: List[CoreFacts]) -> CoreFacts:
        """
        分析跨平台一致性
        
        Args:
            facts_list: 不同平台的核心事实列表
            
        Returns:
            一致性分析结果
        """
        if not facts_list or len(facts_list) < 2:
            return CoreFacts(
                facts={},
                consistency_score=0,
                inconsistencies=[],
                missing_facts=[]
            )
        
        # 收集所有平台的事实
        all_facts = {}
        for i, facts in enumerate(facts_list):
            for fact_type, fact in facts.facts.items():
                if fact_type not in all_facts:
                    all_facts[fact_type] = []
                all_facts[fact_type].append((i, fact))
        
        # 分析一致性
        inconsistencies = []
        missing_facts = []
        total_consistent = 0
        total_checked = 0
        
        for fact_type, platform_facts in all_facts.items():
            if len(platform_facts) < len(facts_list):
                # 有些平台缺少该事实
                missing_platforms = [i for i in range(len(facts_list)) if i not in [pf[0] for pf in platform_facts]]
                missing_facts.append(f"Fact '{fact_type}' missing on platforms: {missing_platforms}")
            
            # 检查值的一致性
            values = [pf[1].value for pf in platform_facts]
            unique_values = set(values)
            
            if len(unique_values) > 1:
                inconsistencies.append(f"Fact '{fact_type}' has inconsistent values: {unique_values}")
            else:
                total_consistent += 1
            total_checked += 1
        
        # 计算一致性评分
        consistency_score = (total_consistent / total_checked * 100) if total_checked > 0 else 0
        
        # 构建结果
        result_facts = {}
        for fact_type in self.CORE_FACT_TYPES:
            if fact_type in all_facts:
                # 使用第一个平台的值作为参考
                result_facts[fact_type] = all_facts[fact_type][0][1]
        
        return CoreFacts(
            facts=result_facts,
            consistency_score=round(consistency_score, 2),
            inconsistencies=inconsistencies,
            missing_facts=missing_facts
        )
    
    def _extract_brand(self, title: str, parameters: Dict[str, str]) -> Optional[str]:
        """提取品牌信息"""
        # 从参数中查找
        for key, value in parameters.items():
            if "brand" in key.lower():
                return value
        
        # 从标题中提取（假设品牌在开头）
        words = title.split()
        if words and words[0][0].isupper():
            # 检查是否是常见品牌词
            return words[0]
        
        return None
    
    def _extract_model(self, parameters: Dict[str, str]) -> Optional[str]:
        """提取型号信息"""
        for key, value in parameters.items():
            if "model" in key.lower() or "sku" in key.lower():
                return value
        return None
    
    def _extract_bulb_base(self, parameters: Dict[str, str]) -> Optional[str]:
        """提取灯泡底座信息"""
        for key, value in parameters.items():
            if "bulb" in key.lower() and "base" in key.lower():
                return value
        return None
    
    def _extract_bulb_count(self, parameters: Dict[str, str]) -> Optional[str]:
        """提取灯泡数量信息"""
        for key, value in parameters.items():
            if "bulb" in key.lower() and "count" in key.lower():
                return value
        return None
    
    def _extract_voltage(self, parameters: Dict[str, str]) -> Optional[str]:
        """提取电压信息"""
        for key, value in parameters.items():
            if "voltage" in key.lower():
                return value
        return None
    
    def _extract_installation_type(self, parameters: Dict[str, str]) -> Optional[str]:
        """提取安装类型信息"""
        for key, value in parameters.items():
            if "installation" in key.lower() or "mount" in key.lower():
                return value
        return None
    
    def _extract_product_name(self, title: str) -> str:
        """提取产品名称"""
        # 简单规则：取前3-5个单词
        words = title.split()[:5]
        return " ".join(words)
    
    def _extract_dimensions(self, title: str, parameters: Dict[str, str]) -> Optional[str]:
        """提取尺寸信息"""
        # 从参数中查找
        for key, value in parameters.items():
            if "size" in key.lower() or "dimension" in key.lower():
                return value
        
        # 从标题中提取
        import re
        patterns = [
            r'(\d+["\']?\s*[xX]\s*\d+["\']?\s*[xX]?\s*\d*["\']?)',
            r'(\d+\s*(?:inch|in|"|cm|mm))'
        ]
        for pattern in patterns:
            match = re.search(pattern, title)
            if match:
                return match.group(1)
        
        return None
    
    def _extract_material(self, title: str, parameters: Dict[str, str]) -> Optional[str]:
        """提取材质信息"""
        materials = ["iron", "steel", "brass", "copper", "glass", "crystal", 
                    "fabric", "wood", "plastic", "aluminum"]
        
        # 从参数中查找
        for key, value in parameters.items():
            if "material" in key.lower():
                return value
        
        # 从标题中查找
        title_lower = title.lower()
        for material in materials:
            if material in title_lower:
                return material.capitalize()
        
        return None
    
    def _extract_color(self, title: str, parameters: Dict[str, str]) -> Optional[str]:
        """提取颜色信息"""
        colors = ["black", "white", "gold", "silver", "bronze", "chrome",
                 "brass", "copper", "nickel", "matte", "polished"]
        
        # 从参数中查找
        for key, value in parameters.items():
            if "color" in key.lower() or "finish" in key.lower():
                return value
        
        # 从标题中查找
        title_lower = title.lower()
        for color in colors:
            if color in title_lower:
                return color.capitalize()
        
        return None


class RuleBasedAnalyzer:
    """规则分析器主类"""
    
    def __init__(self):
        self.title_analyzer = TitleAnalyzer()
        self.image_analyzer = ImageAnalyzer()
        self.parameter_analyzer = ParameterAnalyzer()
        self.core_facts_analyzer = CoreFactsAnalyzer()
    
    def analyze_product(self, product_data: Dict[str, any]) -> Dict[str, any]:
        """
        分析产品数据
        
        Args:
            product_data: 包含title, images, specifications等字段的字典
            
        Returns:
            分析结果字典
        """
        results = {}
        
        # 标题分析
        if "title" in product_data:
            results["title_analysis"] = self.title_analyzer.analyze(
                product_data["title"]
            )
        
        # 图片分析
        if "images" in product_data:
            results["image_analysis"] = self.image_analyzer.analyze(
                product_data["images"]
            )
        
        # 参数分析
        if "specifications" in product_data:
            results["parameter_analysis"] = self.parameter_analyzer.analyze(
                product_data["specifications"]
            )
        
        # 核心事实提取
        if "title" in product_data:
            results["core_facts"] = self.core_facts_analyzer.extract_core_facts(
                product_data["title"],
                product_data.get("specifications", {})
            )
        
        # 计算总体评分
        results["overall_score"] = self.calculate_overall_score(results)
        
        return results
    
    def analyze_scraped_product(self, scraped_data) -> Dict[str, any]:
        """
        分析抓取的产品数据
        
        Args:
            scraped_data: ScrapedProductData对象
            
        Returns:
            分析结果字典
        """
        product_dict = {
            "title": scraped_data.title,
            "images": scraped_data.images,
            "specifications": scraped_data.specifications
        }
        return self.analyze_product(product_dict)
    
    def analyze_cross_platform_consistency(self, scraped_data_list) -> Dict[str, any]:
        """
        分析跨平台一致性
        
        Args:
            scraped_data_list: 不同平台的ScrapedProductData列表
            
        Returns:
            一致性分析结果
        """
        # 提取每个平台的核心事实
        facts_list = []
        for scraped_data in scraped_data_list:
            product_dict = {
                "title": scraped_data.title,
                "specifications": scraped_data.specifications
            }
            analysis = self.analyze_product(product_dict)
            if "core_facts" in analysis:
                facts_list.append(analysis["core_facts"])
        
        # 分析一致性
        consistency_result = self.core_facts_analyzer.analyze_cross_platform_consistency(facts_list)
        
        return {
            "core_facts_consistency": consistency_result,
            "platforms_analyzed": len(facts_list)
        }
    
    def calculate_overall_score(self, results: Dict[str, any]) -> float:
        """计算总体评分"""
        scores = []
        weights = {
            "title": 0.3,
            "image": 0.3,
            "parameter": 0.4
        }
        
        if "title_analysis" in results:
            title = results["title_analysis"]
            title_score = title.length_score * 0.4 + title.readability_score * 0.6
            scores.append(title_score * weights["title"])
        
        if "image_analysis" in results:
            img = results["image_analysis"]
            scores.append(img.diversity_score * weights["image"])
        
        if "parameter_analysis" in results:
            param = results["parameter_analysis"]
            scores.append(param.completeness_score * weights["parameter"])
        
        return round(sum(scores), 2) if scores else 0
