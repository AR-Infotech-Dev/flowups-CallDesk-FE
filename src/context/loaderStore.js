let pendingRequests = 0;
const listeners = new Set();

function notify() {
  const isLoading = pendingRequests > 0;
  listeners.forEach((listener) => listener(isLoading));
}

export function showGlobalLoader() {
  pendingRequests += 1;
  notify();
}

export function hideGlobalLoader() {
  pendingRequests = Math.max(0, pendingRequests - 1);
  notify();
}

export function subscribeLoader(listener) {
  listeners.add(listener);
  listener(pendingRequests > 0);

  return () => {
    listeners.delete(listener);
  };
}
