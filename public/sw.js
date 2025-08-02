// TanaPOS V4-Mini Service Worker
const CACHE_NAME = 'tanapos-v4-mini-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-192x192.png',
  '/favicon-512x512.png'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker 安裝中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('快取已開啟');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('快取安裝失敗:', error);
      })
  );
});

// 攔截網路請求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果有快取，返回快取內容
        if (response) {
          return response;
        }
        
        // 否則發出網路請求
        return fetch(event.request)
          .then((response) => {
            // 檢查是否為有效回應
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆回應
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('網路請求失敗:', error);
            // 可以返回離線頁面或預設內容
            return new Response('離線模式 - 請檢查網路連線', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// 更新 Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker 啟動中...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 推送通知支援 (可選)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '新訂單通知',
    icon: '/favicon-192x192.png',
    badge: '/favicon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('TanaPOS 通知', options)
  );
});

// 後台同步支援 (可選)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('執行後台同步');
    event.waitUntil(
      // 這裡可以執行離線時的數據同步邏輯
      Promise.resolve()
    );
  }
});
