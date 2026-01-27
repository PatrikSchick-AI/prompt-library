import { v } from "convex/values";
import { query } from "./_generated/server";

// Query to list events for a prompt
export const list = query({
  args: {
    promptId: v.id("prompts"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 50, 100);
    const offset = args.offset || 0;

    const events = await ctx.db
      .query("prompt_events")
      .withIndex("by_prompt_id", (q) => q.eq("prompt_id", args.promptId))
      .collect();

    // Sort by creation date (newest first)
    const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);

    // Apply pagination
    const paginatedEvents = sortedEvents.slice(offset, offset + limit);

    return {
      events: paginatedEvents,
      total: events.length,
      hasMore: offset + limit < events.length,
    };
  },
});

// Query to get a single event
export const get = query({
  args: { id: v.id("prompt_events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
