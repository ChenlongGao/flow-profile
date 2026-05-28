"""RTSP → HLS 转码代理"""
import subprocess, os, shutil, uuid, threading, time

STREAMS_DIR = "/tmp/rtsp-streams"
os.makedirs(STREAMS_DIR, exist_ok=True)
_active: dict[str, subprocess.Popen] = {}

def start_stream(rtsp_url: str) -> str:
    sid = uuid.uuid4().hex[:8]
    out_dir = os.path.join(STREAMS_DIR, sid)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "index.m3u8")
    
    cmd = [
        "ffmpeg", "-rtsp_transport", "tcp", "-i", rtsp_url,
        "-c:v", "libx264", "-preset", "ultrafast", "-tune", "zerolatency",
        "-an", "-f", "hls", "-hls_time", "2", "-hls_list_size", "5",
        "-hls_flags", "delete_segments", out_path
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    _active[sid] = proc
    return sid

def stop_stream(sid: str):
    if sid in _active:
        _active[sid].kill()
        del _active[sid]
    shutil.rmtree(os.path.join(STREAMS_DIR, sid), ignore_errors=True)

def get_stream_status(sid: str) -> str:
    if sid in _active and _active[sid].poll() is None:
        return "running"
    return "stopped"
