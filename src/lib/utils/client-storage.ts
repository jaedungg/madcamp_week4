export const getClientStorage = () => {
  if (typeof window !== 'undefined') {
    return localStorage;
  }
  // On the server, return a no-op storage or undefined
  return undefined;
};