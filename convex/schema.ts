import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const promptStatus = v.union(
  v.literal("draft"),
  v.literal("in_review"),
  v.literal("testing"),
  v.literal("active"),
  v.literal("deprecated"),
  v.literal("archived"),
);

const eventType = v.union(
  v.literal("created"),
  v.literal("version_created"),
  v.literal("status_changed"),
  v.literal("metadata_updated"),
  v.literal("rollback"),
);

export default defineSchema({
  prompts: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    purpose: v.string(),
    tags: v.array(v.string()),
    status: promptStatus,
    owner: v.optional(v.string()),
    current_version_id: v.optional(v.id("prompt_versions")),
    created_at: v.number(),
    updated_at: v.number(),
    search_text: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_purpose", ["purpose"])
    .index("by_tags", ["tags"])
    .index("by_created_at", ["created_at"])
    .index("by_updated_at", ["updated_at"])
    .index("by_current_version_id", ["current_version_id"])
    .searchIndex("search_prompts", {
      searchField: "search_text",
      filterFields: ["status", "purpose"],
    }),
  prompt_versions: defineTable({
    prompt_id: v.id("prompts"),
    version_number: v.string(),
    change_description: v.string(),
    content: v.string(),
    system_prompt: v.optional(v.string()),
    models: v.array(v.string()),
    model_config: v.any(),
    author: v.optional(v.string()),
    created_at: v.number(),
    previous_version_id: v.optional(v.id("prompt_versions")),
  })
    .index("by_prompt_id", ["prompt_id"])
    .index("by_created_at", ["created_at"]),
  prompt_events: defineTable({
    prompt_id: v.id("prompts"),
    event_type: eventType,
    comment: v.optional(v.string()),
    metadata: v.any(),
    created_at: v.number(),
    created_by: v.optional(v.string()),
  })
    .index("by_prompt_id", ["prompt_id"])
    .index("by_created_at", ["created_at"]),
});
