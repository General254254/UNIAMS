/**
 * Unregister all service workers in development.
 * Prevents cached SW from intercepting API requests and breaking the app.
 */
export function unregisterServiceWorkers() {
  if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then(() => {
          console.log('[SW] Unregistered:', registration.scope);
        });
      }
    });
  }
}
