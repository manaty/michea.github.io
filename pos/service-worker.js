var cacheName = "pwa-pos_0.23.31"
var filesToCache = [
  '/pos/',
  '/pos/index.html',
  '/pos/pos.js', 
  '/pos/printReceipt.js',
  '/pos/catalog.html',
  '/pos/catalog.js',
  '/pos/configuration.html',
  '/pos/configuration.js',
  '/pos/newPurchase.html',
  '/pos/newPurchase.js',
  '/pos/orders.html',
  '/pos/orders.js',
  '/pos/productCategories.html',
  '/pos/productCategories.js',
  '/pos/purchases.html',
  '/pos/purchases.js',
  '/pos/signin.html',
  '/pos/lib/auth.js',
  '/pos/lib/ConfigurationStore.js',
  '/pos/lib/DataStore.js',
  '/pos/lib/dateformat.js',
  '/pos/lib/InventoryStore.js',
  '/pos/lib/JsBarcode.min.js',
  '/pos/lib/OrderStore.js',
  '/pos/lib/papaparse.min.js',
  '/pos/lib/ProductCategoryStore.js',
  '/pos/lib/ProductStore.js',
  '/pos/lib/PurchaseStore.js',
  '/pos/lib/vanilla-datatables.js',
  '/pos/lib/sha1.js',
  '/pos/lib/xls-export.js',
  '/pos/lib/GithubContentsApiV3.js',
  '/pos/css/bootstrap.min.css',
  '/pos/css/bootstrap.min.css.map',
  '/pos/css/pricetags.css',
  '/pos/css/receipt.css',
  '/pos/css/vanilla-dataTables.css',
  '/pos/css/materialdesignicons.min.css',
  '/pos/css/materialdesignicons.min.css.map',
  '/pos/css/reboot.scss',
  '/pos/img/0.01coin.jpg',
  '/pos/img/0.05coin.jpg',
  '/pos/img/0.25coin.jpg',
  '/pos/img/1coin.jpg',
  '/pos/img/5coin.jpg',
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
  '/pos/img/receipt.png',
  '/pos/fonts/materialdesignicons-webfont.eot',
  '/pos/fonts/materialdesignicons-webfont.svg',
  '/pos/fonts/materialdesignicons-webfont.ttf',
  '/pos/fonts/materialdesignicons-webfont.woff',
  '/pos/fonts/materialdesignicons-webfont.woff2'
];

self.addEventListener('install', function (e) {
  console.log('[ServiceWorker] Install' + JSON.stringify(e));
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      //console.log('[ServiceWorker] Caching ' + filesToCache.length + ' files to cache=' + cacheName);
      return Promise.all(
        filesToCache.map(function (url) {
          //console.log(url + " cached");
          return cache.add(url).catch(function (reason) {
            return console.log(url + "failed: " + String(reason));
          })
        })
      );
    }).then(function(){
      console.log('[ServiceWorker] skipWait');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(keyList.map(function (key) {
        if (key !== cacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
    .then(response => {
      console.log("req :"+event.request.url);
        return response || fetch(event.request);
    })
  );
});