import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Status validation - mirrors the schema
const promptStatus = v.union(
  v.literal("draft"),
  v.literal("in_review"),
  v.literal("testing"),
  v.literal("active"),
  v.literal("deprecated"),
  v.literal("archived"),
);

// Query to list prompts with filters
export const list = query({
  args: {
    search: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    purpose: v.optional(v.string()),
    status: v.optional(v.array(promptStatus)),
    sort: v.optional(v.union(
      v.literal("name"),
      v.literal("created_at"),
      v.literal("updated_at"),
      v.literal("rank")
    )),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("prompts");

    // Apply filters
    if (args.status && args.status.length > 0) {
      query = query.filter((q) => args.status!.includes(q.status));
    }

    if (args.purpose) {
      query = query.filter((q) => q.purpose === args.purpose);
    }

    if (args.tags && args.tags.length > 0) {
      query = query.filter((q) => args.tags!.some(tag => q.tags.includes(tag)));
    }

    // Apply search
    if (args.search && args.search.trim()) {
      query = ctx.db.query("prompts").withSearchIndex("search_prompts", (q) =>
        q.search("search_text", args.search!)
      );

      // Reapply filters for search query
      if (args.status && args.status.length > 0) {
        query = query.filter((q) => args.status!.includes(q.status));
      }
      if (args.purpose) {
        query = query.filter((q) => q.purpose === args.purpose);
      }
    }

    // Apply sorting
    const sortField = args.sort || "updated_at";
    const sortOrder = args.order || "desc";

    if (sortField === "rank" && args.search) {
      // Keep search ranking
    } else {
      query = query.order(sortOrder === "desc" ? "desc" : "asc");
      if (sortField === "name") {
        query = (query as any).order("name", sortOrder);
      } else if (sortField === "created_at") {
        query = (query as any).order("created_at", sortOrder);
      } else if (sortField === "updated_at") {
        query = (query as any).order("updated_at", sortOrder);
      }
    }

    // Apply pagination
    const limit = Math.min(args.limit || 50, 100);
    const offset = args.offset || 0;

    const results = await query.paginate({
      numItems: limit,
      cursor: null, // For simplicity, we'll use offset-based pagination
    });

    // For now, convert to offset-based by taking slice
    const allResults = results.page;
    const paginatedResults = allResults.slice(offset, offset + limit);

    // Enhance with current version info
    const enhancedResults = await Promise.all(
      paginatedResults.map(async (prompt) => {
        let currentVersion = null;
        if (prompt.current_version_id) {
          currentVersion = await ctx.db.get(prompt.current_version_id);
        }

        return {
          ...prompt,
          current_version: currentVersion ? {
            version_number: currentVersion.version_number,
            models: currentVersion.models,
          } : undefined,
        };
      })
    );

    return enhancedResults;
  },
});

// Query to get a single prompt by ID
export const get = query({
  args: { id: v.id("prompts") },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.id);
    if (!prompt) return null;

    // Get current version
    let currentVersion = null;
    if (prompt.current_version_id) {
      currentVersion = await ctx.db.get(prompt.current_version_id);
    }

    // Get all versions for this prompt
    const versions = await ctx.db
      .query("prompt_versions")
      .withIndex("by_prompt_id", (q) => q.eq("prompt_id", args.id))
      .collect();

    return {
      ...prompt,
      current_version: currentVersion,
      version_count: versions.length,
    };
  },
});

// Mutation to create a new prompt with initial version
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    purpose: v.string(),
    tags: v.array(v.string()),
    owner: v.optional(v.string()),
    content: v.string(),
    system_prompt: v.optional(v.string()),
    models: v.array(v.string()),
    model_config: v.optional(v.any()),
    author: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create search text for full-text search
    const searchText = [
      args.name,
      args.description,
      args.purpose,
      args.tags.join(" "),
      args.content.slice(0, 500), // Include first 500 chars of content
    ].filter(Boolean).join(" ");

    // Create the prompt
    const promptId = await ctx.db.insert("prompts", {
      name: args.name,
      description: args.description,
      purpose: args.purpose,
      tags: args.tags,
      status: "draft",
      owner: args.owner,
      current_version_id: undefined, // Will be set after creating version
      created_at: now,
      updated_at: now,
      search_text: searchText,
    });

    // Create initial version
    const versionId = await ctx.db.insert("prompt_versions", {
      prompt_id: promptId,
      version_number: "1.0.0",
      change_description: "Initial version",
      content: args.content,
      system_prompt: args.system_prompt,
      models: args.models,
      model_config: args.model_config || {},
      author: args.author,
      created_at: now,
      previous_version_id: undefined,
    });

    // Update prompt to reference the current version
    await ctx.db.patch(promptId, {
      current_version_id: versionId,
    });

    // Create event log
    await ctx.db.insert("prompt_events", {
      prompt_id: promptId,
      event_type: "created",
      metadata: { initial_version: "1.0.0", source: "web" },
      created_at: now,
      created_by: args.author,
    });

    return { id: promptId };
  },
});