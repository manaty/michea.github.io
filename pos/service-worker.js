var cacheName="pwa-pos_0.16.17";
var filesToCache=[];
var filesToCache2 = [
    '/',
    '/index.html',
    '/pos.js',
    '/catalog.html',
    '/catalog.js',
    '/newPurchase.html',
    '/newPurchase.js',
    '/orders.html',
    '/orders.js',
    '/productCategories.html',
    '/productCategories.js',
    '/purchases.html',
    '/purchases.js',
    '/lib/DataStore.js',
    '/lib/InventoryStore.js',
    '/lib/JsBarcode.min.js',
    '/lib/OrderStore.js',
    '/lib/papaparse.min.js',
    '/lib/ProductCategoryStore.js',
    '/lib/ProductStore.js',
    '/lib/PurchaseStore.js',
    '/lib/vanilla-datatables.js',
    '/lib/xls-export.js',
    '/css/bootstrap.min.css',
    '/css/pricetags.css',
    '/css/receipt.css',
    '/img/.01coin.jpg',
    '/img/.05coin.jpg',
    '/img/.25coin.jpg',
    '/img/10coin.jpg',
    '/img/20php.jpg',
    '/img/50php.jpeg',
    '/img/100php.jpg',
    '/img/200php.jpeg',
    '/img/500php.jpeg',
    '/img/1000php.jpg',
    '/img/logo.png',
    '/img/1000php.jpg'
  ];

  self.addEventListener('install', function(e) {
    console.log('[ServiceWorker] Install');
    //e.waitUntil(
      caches.open(cacheName).then(function(cache) {
        console.log('[ServiceWorker] Caching '+filesToCache.length+' files to cache='+cacheName);
        return cache.addAll(filesToCache);
      })
    //);
  });

  self.addEventListener('activate', function(e) {
    console.log('[ServiceWorker] Activate');
    e.waitUntil(
      caches.keys().then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
          if (key !== cacheName) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
    );
    return self.clients.claim();
  });
  
  self.addEventListener('fetch', function(e) {
    console.log('[ServiceWorker] Fetch', e.request.url);
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  });
  