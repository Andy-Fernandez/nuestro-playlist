// Register only the built app. The browser installs updates in the background;
// a waiting worker activates naturally after all app windows close. Never reload
// or send SKIP_WAITING while a cassette may be playing.
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
  const register = () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
      updateViaCache: 'none',
    }).catch(() => {
      // Browsers can disable service workers/storage; online playback still works.
    });
  };

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
