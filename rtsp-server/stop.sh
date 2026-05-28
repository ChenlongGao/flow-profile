#!/bin/bash
echo "Stopping RTSP streams..."
pkill -9 -f "ffmpeg.*rtsp://localhost:8554" 2>/dev/null
echo "Stopping MediaMTX..."
pkill -9 mediamtx 2>/dev/null
echo "Cleaning HLS temp files..."
rm -rf /tmp/rtsp-streams/*
echo "All stopped."
