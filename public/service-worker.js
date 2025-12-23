/* eslint-disable no-restricted-globals */
// client/public/service-worker.js

self.addEventListener("push", (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || "New Message";
    const options = {
        body: data.body || "You have a new message on BlueChat",
        icon: data.icon || "/logo192.png",
        badge: "/logo192.png",
        data: data.data || {},
        vibrate: [100, 50, 100],
        actions: [
            { action: "open", title: "Open App" },
            { action: "close", title: "Close" }
        ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    if (event.action === "close") return;

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return self.clients.openWindow("/");
        })
    );
});
