"""
最简单的Flask API - 100%独立，部署即成功
"""
from flask import Flask, jsonify
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def root():
    """根路径"""
    return jsonify({
        "message": "ALOA DECOR API is running!",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/health')
def health_check():
    """健康检查"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/test')
def test():
    """测试端点"""
    return jsonify({"status": "ok", "message": "API is working correctly"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
