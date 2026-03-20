"""
简单的入口文件，重定向到ai-analyzer的main模块
"""
import sys
import os

# 添加ai-analyzer到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai-analyzer'))

# 导入并运行FastAPI应用
from src.api.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
