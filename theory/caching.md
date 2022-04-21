# Caching strategies

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tincidunt eget nullam non nisi est sit amet. Commodo viverra maecenas accumsan lacus. Risus at ultrices mi tempus imperdiet nulla. Turpis egestas pretium aenean pharetra magna. Vestibulum lorem sed risus ultricies tristique nulla aliquet. Fermentum posuere urna nec tincidunt praesent. Sit amet cursus sit amet dictum sit amet justo. Dolor purus non enim praesent elementum. Morbi leo urna molestie at elementum eu facilisis sed. Ipsum suspendisse ultrices gravida dictum. Ante in nibh mauris cursus mattis. Curabitur vitae nunc sed velit dignissim. Nulla facilisi morbi tempus iaculis urna. Dolor sit amet consectetur adipiscing elit ut. Molestie a iaculis at erat pellentesque adipiscing commodo. Faucibus nisl tincidunt eget nullam. Habitasse platea dictumst quisque sagittis purus sit amet volutpat consequat. Magna eget est lorem ipsum dolor sit.

## Cache only

![cache only](./cacheonly1.png)

Tellus rutrum tellus pellentesque eu tincidunt tortor. Laoreet id donec ultrices tincidunt arcu non sodales neque sodales. Cursus eget nunc scelerisque viverra. Egestas pretium aenean pharetra magna ac placerat vestibulum. Sit amet facilisis magna etiam tempor orci eu lobortis. Diam maecenas sed enim ut sem viverra aliquet eget. Eu nisl nunc mi ipsum faucibus vitae aliquet. Quam pellentesque nec nam aliquam sem et tortor consequat. Egestas congue quisque egestas diam in. Ridiculus mus mauris vitae ultricies leo integer malesuada nunc. Ultricies leo integer malesuada nunc vel risus. Mauris augue neque gravida in fermentum et. Non enim praesent elementum facilisis leo. Quam pellentesque nec nam aliquam sem et tortor consequat id. Vitae ultricies leo integer malesuada nunc vel. Enim tortor at auctor urna. Dolor sed viverra ipsum nunc aliquet bibendum enim. Cras semper auctor neque vitae tempus quam pellentesque nec nam.

```js
// cache first
self.addEventListener(‘fetch’, function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
```

## Network first

![network first](./networkfirst.png)

Sit amet consectetur adipiscing elit pellentesque habitant morbi tristique senectus. Amet consectetur adipiscing elit pellentesque habitant. Et netus et malesuada fames ac turpis egestas integer. Ut consequat semper viverra nam libero justo laoreet sit. Tristique et egestas quis ipsum suspendisse ultrices gravida. Morbi tristique senectus et netus et malesuada fames. Massa massa ultricies mi quis hendrerit dolor magna eget. Quis commodo odio aenean sed adipiscing diam donec adipiscing tristique. Aenean vel elit scelerisque mauris pellentesque pulvinar pellentesque habitant. Pellentesque id nibh tortor id aliquet lectus proin nibh. Arcu vitae elementum curabitur vitae nunc sed velit dignissim.

```js
// network first
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});
```

## Stale while revalidate

![stale](./stale.png)

Eros donec ac odio tempor orci. Gravida dictum fusce ut placerat orci nulla pellentesque dignissim enim. Eu augue ut lectus arcu. Netus et malesuada fames ac turpis. Porttitor eget dolor morbi non arcu risus quis varius. Ultrices mi tempus imperdiet nulla malesuada pellentesque elit. A erat nam at lectus urna duis convallis convallis tellus. Bibendum at varius vel pharetra vel turpis nunc eget. Lacus suspendisse faucibus interdum posuere lorem ipsum dolor. Suspendisse ultrices gravida dictum fusce ut placerat orci. Ridiculus mus mauris vitae ultricies leo integer malesuada nunc. Leo a diam sollicitudin tempor id eu nisl. Viverra suspendisse potenti nullam ac tortor vitae purus.

```js
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open('my-app').then(function(cache) {
      return cache.match(event.request).then(function(response) {
        const fetchPromise = fetch(event.request).then(function(networkResponse) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        })
        return response || fetchPromise;
      })
    })
  );
});
```

Nunc sed blandit libero volutpat sed. Nisl suscipit adipiscing bibendum est ultricies integer quis. Ornare arcu dui vivamus arcu felis bibendum. Mattis aliquam faucibus purus in massa tempor nec feugiat nisl. Tempus quam pellentesque nec nam aliquam sem et tortor consequat. Lacinia quis vel eros donec ac odio tempor orci. Sociis natoque penatibus et magnis dis parturient montes nascetur. Lectus quam id leo in vitae turpis massa sed elementum. Pulvinar elementum integer enim neque. Tincidunt augue interdum velit euismod in.