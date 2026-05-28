import React, { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

declare var AMap: any;

interface AmapMapProps {
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    title?: string;
    content?: string;
  }>;
  height?: string;
  onMapClick?: (lnglat: { lng: number; lat: number }) => void;
}

export const AmapMap: React.FC<AmapMapProps> = ({
  center = [116.397428, 39.90923], // 默认北京天安门
  zoom = 11,
  markers = [],
  height = '400px',
  onMapClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    AMapLoader.load({
      key: '2b0de73a5952b1cf7353e17e7256dc20', // 高德地图API Key
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.InfoWindow'],
    })
      .then((AMap) => {
        if (!mapRef.current) return;

        mapInstance.current = new AMap.Map(mapRef.current, {
          center: center,
          zoom: zoom,
          resizeEnable: true,
        });

        // 添加工具条和比例尺
        mapInstance.current.addControl(new AMap.Scale());
        mapInstance.current.addControl(new AMap.ToolBar());

        // 添加标记点
        markers.forEach((marker) => {
          const mapMarker = new AMap.Marker({
            position: marker.position,
            title: marker.title,
          });

          if (marker.content) {
            mapMarker.setLabel({
              direction: 'top',
              content: marker.content,
            });
          }

          mapInstance.current.add(mapMarker);
        });

        // 地图点击事件
        if (onMapClick) {
          mapInstance.current.on('click', (e: any) => {
            onMapClick({ lng: e.lnglat.getLng(), lat: e.lnglat.getLat() });
          });
        }

        setLoaded(true);
      })
      .catch((err) => {
        console.error('高德地图加载失败:', err);
      });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, []);

  // 更新标记点
  useEffect(() => {
    if (!loaded || !mapInstance.current) return;

    // 清除现有标记
    mapInstance.current.clearMap();

    // 添加新标记
    markers.forEach((marker) => {
      const mapMarker = new AMap.Marker({
        position: marker.position,
        title: marker.title,
      });

      if (marker.content) {
        mapMarker.setLabel({
          direction: 'top',
          content: marker.content,
        });
      }

      mapInstance.current.add(mapMarker);
    });
  }, [markers, loaded]);

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-[var(--border)]">
      <div ref={mapRef} style={{ height, width: '100%' }} />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-secondary)]">
          <div className="text-[var(--text-muted)]">地图加载中...</div>
        </div>
      )}
    </div>
  );
};

export default AmapMap;
