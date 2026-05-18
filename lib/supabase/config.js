export class SupabaseEnvMissingError extends Error {
  constructor(name) {
    super(`Missing environment variable: ${name}`);
    this.name = "SupabaseEnvMissingError";
    this.envName = name;
  }
}

export function getMissingSupabaseEnvNames() {
  return ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"].filter(
    (name) => !process.env[name]
  );
}

export function hasSupabaseConfig() {
  return getMissingSupabaseEnvNames().length === 0;
}

export function isSupabaseEnvMissingError(error) {
  const message = error?.message || "";
  return (
    error instanceof SupabaseEnvMissingError ||
    message.includes("Missing environment variable: NEXT_PUBLIC_SUPABASE_")
  );
}

export function getSupabaseEnvMissingMessage() {
  const missingNames = getMissingSupabaseEnvNames();
  if (!missingNames.length) {
    return "Thiếu biến môi trường Supabase trên môi trường deploy.";
  }

  return `Thiếu biến môi trường Supabase trên môi trường deploy: ${missingNames.join(", ")}.`;
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new SupabaseEnvMissingError(name);
  }
  return value;
}

export function getSupabaseConfig() {
  return {
    url: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    publishableKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  };
}
