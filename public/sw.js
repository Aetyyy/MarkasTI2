const CACHE_VERSION = "markasti-notifications-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith("markasti-notifications-") && key !== CACHE_VERSION)
              .map((key) => caches.delete(key)),
          ),
        ),
    ]),
  );
});

self.addEventListener("push", (event) => {
  let data = {
    type: "notification",
    title: "MarkasTI",
    body: "Ada pembaruan baru.",
    url: "/",
    tag: "markasti-notification",
  };

  try {
    data = { ...data, ...event.data.json() };
  } catch {
    // Payload kosong tetap menampilkan notifikasi default.
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const isAppleWebPush = /iPhone|iPad|iPod|Macintosh/i.test(
          self.navigator.userAgent,
        );
        const visibleWindows = windows.filter(
          (client) => client.visibilityState === "visible",
        );

        if (!isAppleWebPush && visibleWindows.length > 0) {
          visibleWindows.forEach((client) =>
            client.postMessage({ type: "MARKASTI_PUSH", payload: data }),
          );
          return undefined;
        }

        return self.registration.showNotification(data.title, {
          body: data.body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: data.tag || data.referenceId || "markasti-notification",
          data: { url: data.url || "/" },
          vibrate: [160, 80, 160],
          renotify: true,
        });
      }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || "/",
    self.location.origin,
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windows) => {
        for (const client of windows) {
          if ("focus" in client) {
            if ("navigate" in client) await client.navigate(target);
            return client.focus();
          }
        }
        return self.clients.openWindow(target);
      }),
  );
});
