/* eslint-disable */
/**
 * Generated API types for Convex.
 * This file is auto-generated and should not be edited manually.
 */

import type { FunctionReference, OptionalRestArgs } from "convex/server";
import type { Id } from "./dataModel";

export const api = {
  prompts: {
    list: null as any as FunctionReference<"query", "public", any, any>,
    get: null as any as FunctionReference<"query", "public", { id: Id<"prompts"> }, any>,
    create: null as any as FunctionReference<"mutation", "public", any, any>,
    update: null as any as FunctionReference<"mutation", "public", any, any>,
    updateStatus: null as any as FunctionReference<"mutation", "public", any, any>,
    deletePrompt: null as any as FunctionReference<"mutation", "public", any, any>,
  },
  versions: {
    list: null as any as FunctionReference<"query", "public", any, any>,
    get: null as any as FunctionReference<"query", "public", any, any>,
    create: null as any as FunctionReference<"mutation", "public", any, any>,
    rollback: null as any as FunctionReference<"mutation", "public", any, any>,
  },
  events: {
    list: null as any as FunctionReference<"query", "public", any, any>,
    get: null as any as FunctionReference<"query", "public", any, any>,
  },
  http: null as any,
};
