#!/bin/bash
# MediaMTX RTSP Server Startup Script
# 启动 RTSP 服务器 + 推送本地视频流

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VIDEOS_DIR="$SCRIPT_DIR/videos"
RTSP_PORT=8554
HOST="localhost"

echo "=== MediaMTX RTSP Server ==="

# 1. 启动 MediaMTX 服务器（后台运行）
echo "[1/3] Starting MediaMTX server on port $RTSP_PORT..."
cd "$SCRIPT_DIR"
./mediamtx &
MTX_PID=$!
sleep 2

# 2. 推送本地视频文件为 RTSP 流
echo "[2/3] Publishing local videos as RTSP streams..."

for video in "$VIDEOS_DIR"/*.mp4; do
    if [ -f "$video" ]; then
        name=$(basename "$video" .mp4)
        rtsp_url="rtsp://${HOST}:${RTSP_PORT}/${name}"
        echo "  → Publishing: $name → $rtsp_url"
        ffmpeg -re -stream_loop -1 -i "$video" \
            -c:v copy -c:a aac -ar 44100 -ac 1 \
            -f rtsp "$rtsp_url" \
            -loglevel error &
    fi
done

echo "[3/3] Done! RTSP server running at rtsp://${HOST}:${RTSP_PORT}"
echo ""
echo "Available streams:"
for video in "$VIDEOS_DIR"/*.mp4; do
    if [ -f "$video" ]; then
        name=$(basename "$video" .mp4)
        echo "  rtsp://${HOST}:${RTSP_PORT}/${name}"
    fi
done
echo ""
echo "Press Ctrl+C to stop all services"

# 等待 MediaMTX 进程
wait $MTX_PID
