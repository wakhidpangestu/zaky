/**
 * Clears what this browser remembers about Zaky (keys prefixed `zaky_`): chosen view mode,
 * profile name, dashboard layout. Institution records live on the server and are untouched.
 */
export function clearBrowserCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('zaky_')) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();
    window.dispatchEvent(new Event('zaky_profile_updated'));
  } catch {
    // storage blocked (private mode): nothing to clear
  }
}
