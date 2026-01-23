import { v } from "convex/values";
import { query } from "./_generated/server";

// Query to list all versions for a prompt
export const list = query({
  args: { promptId: v.id("prompts") },
  handler: async (ctx, args) => {
    const versions = await ctx.db
      .query("prompt_versions")
      .withIndex("by_prompt_id", (q) => q.eq("prompt_id", args.promptId))
      .collect();

    // Sort by creation date (newest first)
    return versions.sort((a, b) => b.created_at - a.created_at);
  },
});

// Query to get a specific version by prompt ID and version number
export const get = query({
  args: {
    promptId: v.id("prompts"),
    version: v.string()
  },
  handler: async (ctx, args) => {
    const versions = await ctx.db
      .query("prompt_versions")
      .withIndex("by_prompt_id", (q) => q.eq("prompt_id", args.promptId))
      .filter((q) => q.version_number === args.version)
      .collect();

    return versions[0] || null;
  },
});