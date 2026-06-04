import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseConfig,
  getSupabaseServiceRoleKey,
  hasSupabaseServiceRoleConfig
} from "./config";

const LOCAL_ADMIN_WRITE_LIMIT_MESSAGE =
  "Local admin tren may dev dang dung quyen doc. Hay dang nhap admin va thuc hien thao tac qua API admin de tao/sua/xoa du lieu.";

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
