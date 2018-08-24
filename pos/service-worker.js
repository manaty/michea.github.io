var cacheName="pwa-pos_0.16.32"
var filesToCache = [
    '/pos/',
    '/pos/index.html',
    '/pos/pos.js',
    '/pos/catalog.html',
    '/pos/catalog.js',
    '/pos/newPurchase.html',
    '/pos/newPurchase.js',
    '/pos/orders.html',
    '/pos/orders.js',
    '/pos/productCategories.html',
    '/pos/productCategories.js',
    '/pos/purchases.html',
    '/pos/purchases.js',
    '/pos/lib/DataStore.js',
    '/pos/lib/InventoryStore.js',
    '/pos/lib/JsBarcode.min.js',
    '/pos/lib/OrderStore.js',
    '/pos/lib/papaparse.min.js',
    '/pos/lib/ProductCategoryStore.js',
    '/pos/lib/ProductStore.js',
    '/pos/lib/PurchaseStore.js',
    '/pos/lib/vanilla-datatables.js',
    '/pos/lib/xls-export.js',
    '/pos/css/bootstrap.min.css',
    '/pos/css/pricetags.css',
    '/pos/css/receipt.css',
    '/pos/img/0.01coin.jpg',
    '/pos/img/0.05coin.jpg',
    '/pos/img/0.25coin.jpg',
    '/pos/img/10coin.jpg',
    '/pos/img/20php.jpg',
    '/pos/img/50php.jpeg',
    '/pos/img/100php.jpg',
    '/pos/img/200php.jpeg',
    '/pos/img/500php.jpeg',
    '/pos/img/1000php.jpg',
    '/pos/img/logo.png',
    '/pos/img/logo512.png',
    '/pos/img/1000php.jpg',
    '/pos/img/receipt.png'
  ];

  self.addEventListener('install', function(e) {
    console.log('[ServiceWorker] Install');
    e.waitUntil(
      caches.open(cacheName).then(function(cache) {
        console.log('[ServiceWorker] Caching '+filesToCache.length+' files to cache='+cacheName);
        return Promise.all(
          filesToCache.map(function (url) {
              console.log(url + " cached");
              return cache.add(url).catch(function (reason) {
                  return console.log(url + "failed: " + String(reason));
              })
          })
      );
      })
    );
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
  