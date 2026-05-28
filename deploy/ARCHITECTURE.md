# 客流诊断与预警系统 — 技术架构评估

> 日期：2026-05-12

## 清单评审结论

| 中间件 | 清单建议 | 实际决策 | 原因 |
|--------|---------|---------|------|
| Docker 26.0+ | ✅ 必选 | ✅ 保留 | 容器化基础 |
| Kubernetes 1.29+ | ✅ 必选 | ❌ 推迟 | 单台 CVM 无需编排，Docker Compose 足矣。10,000 门店规模时上 K8s |
| Nginx 1.26+ | ✅ 必选 | ✅ 保留 | 反向代理 + 静态资源 |
| MySQL 8.0.37+ | ✅ 必选 | ✅ 保留 | 替换 SQLite，业务数据主库 |
| InfluxDB 2.7.5+ | ✅ 必选 | ⚠️ 推迟 | 当前 400 条时序数据 MySQL 完全能扛。日均 1 万门店 × 365 天后再上 |
| Redis 7.2.5+ | ✅ 必选 | ✅ 保留 | 缓存 + 会话，轻量 |
| MinIO 2024 | ✅ 必选 | ⚠️ 推迟 | 报告 PDF / 图片需求出现后接入 |
| RabbitMQ 3.13.3+ | ✅ 必选 | ⚠️ 推迟 | 有实时大模型调用、批量报告生成时再引入 |
| Celery 5.4.0+ | ✅ 必选 | ⚠️ 推迟 | 与 RabbitMQ 同步推迟 |
| Celery Beat | ✅ 必选 | ⚠️ 推迟 | 定时任务用 Linux cron + FastAPI BackgroundTasks 先顶着 |
| DB-GPT 0.6.1 | ✅ 必选 | ❌ 推迟 | 需要 GPU，单台 CVM 不具备。AI 诊断走规则引擎 |
| FastAPI 0.112.0+ | ✅ 必选 | ✅ 保留 | 后端框架 |
| Uvicorn 0.30.1+ | ✅ 必选 | ✅ 保留 | ASGI 服务器 |
| Gunicorn | ✅ 必选 | ⚠️ 可选 | Uvicorn 单机够用，多 worker 需要时再加 |
| React/Tailwind/ECharts | ✅ 必选 | ✅ 保留 | 前端三件套 |
| Zustand 4.5.4 | ✅ 必选 | ⚠️ 可选 | 有复杂全局状态时再加 |
| Ant Design 6.0 | ✅ 推荐 | ❌ 不用 | 现有 Tailwind 自建 UI 体系完整，引入 Ant Design 会样式冲突、体积膨胀 |
| Prometheus/Grafana/Loki | ✅ 必选 | ⚠️ 推迟 | 单机先用 Docker logs + htop，集群化时接入监控全家桶 |

## 当前 MVP 架构（Docker Compose）

```
┌──────────────────────────────────────────────┐
│                  CVM (4C8G)                   │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │           Nginx :80/:443             │    │
│  │    /flow-profile/ → React 静态文件    │    │
│  │    /api/          → backend:8000     │    │
│  └──────────┬───────────────────────────┘    │
│             │                                 │
│  ┌──────────▼──────────┐                     │
│  │  FastAPI :8000      │                     │
│  │  (uvicorn 2 workers)│                     │
│  └────┬──────────┬─────┘                     │
│       │          │                            │
│  ┌────▼───┐ ┌───▼────┐                      │
│  │ MySQL  │ │ Redis  │                      │
│  │ :3306  │ │ :6379  │                      │
│  │ (512MB │ │ (256MB │                      │
│  │  BP)   │ │  LRU)  │                      │
│  └────────┘ └────────┘                      │
│                                              │
│  容器数: 4  |  内存占用: ~3GB                 │
│  磁盘: MySQL数据 + Redis备份 ~5GB            │
└──────────────────────────────────────────────┘
```

## 生产架构演进路径

```
MVP                          V1.0                          V2.0
(100 门店, 1 台 CVM)  →  (5,000 门店, 3 台)  →  (10,000 门店, K8s 集群)
                                                   
Docker Compose            Docker Compose                Kubernetes
MySQL                     MySQL + InfluxDB              MySQL 主从 + InfluxDB 集群
Redis 单机                Redis Sentinel               Redis Cluster
Nginx 单机                Nginx × 2 (keepalived)       Nginx Ingress
FastAPI 单实例            FastAPI × 3                  FastAPI HPA 自动扩缩
-                          MinIO 单机                   MinIO 分布式
-                          RabbitMQ + Celery            RabbitMQ 集群
-                          DB-GPT (GPU 机器)            DB-GPT 多实例
-                          -                            Prometheus + Grafana + Loki
```

## 部署文件说明

```
deploy/
├── .env                  ← 环境变量（密码、IP，部署前修改）
├── docker-compose.yml    ← 服务编排（MySQL + Redis + FastAPI + Nginx）
├── Dockerfile            ← FastAPI 镜像构建
├── init.sql              ← MySQL 建表脚本（自动执行）
├── requirements.txt      ← Python 依赖
├── deploy.sh             ← 一键部署脚本
├── nginx/
│   └── default.conf      ← Nginx 反向代理配置
└── dist/                 ← 前端构建产物（npm run build 后生成）
```

## 在 CVM 上部署

```bash
# 1. 把 deploy/ 目录上传到 CVM
scp -r deploy/ root@your-server-ip:/opt/flow-profile/

# 2. 修改环境变量
cd /opt/flow-profile/deploy
vim .env   # 改 MYSQL_ROOT_PASSWORD, REDIS_PASSWORD, APP_SECRET_KEY

# 3. 执行一键部署
chmod +x deploy.sh
./deploy.sh

# 4. 导入 Excel 数据
docker compose exec backend python init_db.py
```

## 腾讯云 CVM 推荐配置

| 阶段 | 规格 | 系统盘 | 数据盘 | 带宽 | 月费（参考） |
|------|------|--------|--------|------|-------------|
| MVP | 4C8G | 50GB SSD | 100GB 云盘 | 5Mbps | ~¥300-400 |
| V1.0 | 8C16G | 50GB SSD | 200GB 云盘 | 10Mbps | ~¥600-800 |
