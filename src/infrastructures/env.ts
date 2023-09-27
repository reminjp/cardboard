export function getRequiredEnv(key: string): string {
  const value = Deno.env.get(key);

  if (!value) throw new Error(`Missing environment variable: ${key}`);

  return value;
}
