var cacheName = "pwa-pos_0.20.27"
var filesToCache = [
  '/pos/',
  '/pos/index.html',
  '/pos/pos.js',
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

var currentUser = null;

var k = Array.apply(null, { length: 64 }).map((v, i) => (0 | (Math.abs(Math.sin(i + 1)) * 4294967296)));

function encrypt(str) {
  var b, c, d, j, x = [], str2 = unescape(encodeURI(str)),
    a = str2.length, h = [b = 1732584193, c = -271733879, ~b, ~c],
    i = 0;
  for (; i <= a;) x[i >> 2] |= (str2.charCodeAt(i) || 128) << 8 * (i++ % 4);
  x[str = (a + 8 >> 6) * 16 + 14] = a * 8;
  i = 0;
  for (; i < str; i += 16) {
    a = h; j = 0;
    for (; j < 64;) {
      a = [
        d = a[3],
        ((b = a[1] | 0) +
          ((d = (
            (a[0] +
              [
                b & (c = a[2]) | ~b & d,
                d & b | ~d & c,
                b ^ c ^ d,
                c ^ (b | ~d)
              ][a = j >> 4]
            ) +
            (k[j] +
              (x[[
                j,
                5 * j + 1,
                3 * j + 5,
                7 * j
              ][a] % 16 + i] | 0)
            )
          )) << (a = [
            7, 12, 17, 22,
            5, 9, 14, 20,
            4, 11, 16, 23,
            6, 10, 15, 21
          ][4 * a + j++ % 4]) | d >>> 32 - a)
        ),
        b,
        c
      ];
    }
    for (j = 4; j;) h[--j] = h[j] + a[j];
  }
  str = '';
  for (; j < 32;) str += ((h[j >> 3] >> ((1 ^ j++ & 7) * 4)) & 15).toString(16);
  return str;
}

self.addEventListener('install', function (e) {
  console.log('[ServiceWorker] Install' + JSON.stringify(e));
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      console.log('[ServiceWorker] Caching ' + filesToCache.length + ' files to cache=' + cacheName);
      return Promise.all(
        filesToCache.map(function (url) {
          console.log(url + " cached");
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

self.addEventListener('message', function (e) {
  if (e.data.action) {
    let action = e.data.action;
    console.log("SW received message action="+action);
    switch (action) {
      case "signin":
        //let encryptedUsername = encrypt(username);
        //let encryptedPassword = encrypt(password);
        //if(encryptedUsername.substring(encryptedUsername.length-2)!=encryptedPassword.substring(encryptedPassword.length-2)){
        //  alert("invalid username or password");
        //}
        currentUser = {};
        currentUser.username=e.data.username;
        currentUser.password=e.data.password;
        currentUser.admin=(e.data.password.length==40);
        console.log("logged in user "+JSON.stringify(currentUser)+" event="+JSON.stringify(e));
        e.ports[0].postMessage("signedIn");
        break;
      case "signout":
        currentUser = null;
        break;
      default: console.log("unknown action");
    }
  }
});

self.addEventListener('fetch', function (e) {
  console.log('[' + cacheName + '] Fetch '+ e.request.url+' currentUser='+currentUser);
  if((currentUser==null) && (e.request.url.indexOf(".html")!=-1)
  && (e.request.url.indexOf("unregister.html")==-1) && (e.request.url.indexOf("signin.html")==-1)){
    console.log("user not logged in, redirecting to signin.html");
    e.respondWith(Response.redirect('/pos/signin.html'));
  } else 
  if (e.request.url.indexOf("/pos/userInfo")!=-1){
    console.log("userinfo requested");
    e.respondWith(new Response(currentUser==null?"{}":JSON.stringify(currentUser)));
  } else {
    e.respondWith(
      caches.match(e.request).then(function (response) {
       console.log(e.request.headers);
       return response || fetch(e.request);
      })
    );
  }
});