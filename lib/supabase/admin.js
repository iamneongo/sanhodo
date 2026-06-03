import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseConfig,
  getSupabaseServiceRoleKey,
  hasSupabaseServiceRoleConfig
} from "./config";

const LOCAL_ADMIN_WRITE_LIMIT_MESSAGE =
  "Local admin tren may dev chi doc duoc du lieu. De tao/sua/xoa du lieu, hay them SUPABASE_SERVICE_ROLE_KEY vao moi truong local.";

export function createAdminClient() {
  if (!hasSupabaseServiceRoleConfig()) {
    return null;
  }

  const { url } = getSupabaseConfig();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function createLocalAdminGuardedClient(client) {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop !== "from") {
        return Reflect.get(target, prop, receiver);
      }

      return (table) => {
        const queryBuilder = target.from(table);

        return new Proxy(queryBuilder, {
          get(queryTarget, queryProp, queryReceiver) {
            if (["insert", "update", "upsert", "delete"].includes(String(queryProp))) {
              return () => {
                throw new Error(LOCAL_ADMIN_WRITE_LIMIT_MESSAGE);
              };
            }

            const value = Reflect.get(queryTarget, queryProp, queryReceiver);
            return typeof value === "function" ? value.bind(queryTarget) : value;
          }
        });
      };
    }
  });
}

export function getLocalAdminWriteLimitMessage() {
  return LOCAL_ADMIN_WRITE_LIMIT_MESSAGE;
}
