import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

// Helper function to increment version number
function incrementVersion(currentVersion: string, type: "major" | "minor" | "patch"): string {
  const [major, minor, patch] = currentVersion.split(".").map(Number);

  if (type === "major") {
    return `${major + 1}.0.0`;
  } else if (type === "minor") {
    return `${major}.${minor + 1}.0`;
  } else {
    return `${major}.${minor}.${patch + 1}`;
  }
}

// Mutation to create a new version
export const create = mutation({
  args: {
    promptId: v.id("prompts"),
    versionType: v.union(v.literal("major"), v.literal("minor"), v.literal("patch")),
    changeDescription: v.string(),
    content: v.string(),
    system_prompt: v.optional(v.string()),
    models: v.array(v.string()),
    model_config: v.optional(v.any()),
    author: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) {
      throw new Error("Prompt not found");
    }

    // Get current version to determine next version number
    const currentVersion = prompt.current_version_id
      ? await ctx.db.get(prompt.current_version_id)
      : null;

    if (!currentVersion) {
      throw new Error("No current version found");
    }

    const newVersionNumber = incrementVersion(currentVersion.version_number, args.versionType);

    // Create new version
    const versionId = await ctx.db.insert("prompt_versions", {
      prompt_id: args.promptId,
      version_number: newVersionNumber,
      change_description: args.changeDescription,
      content: args.content,
      system_prompt: args.system_prompt,
      models: args.models,
      model_config: args.model_config || currentVersion.model_config,
      author: args.author,
      created_at: now,
      previous_version_id: prompt.current_version_id,
    });

    // Update prompt to reference the new current version
    await ctx.db.patch(args.promptId, {
      current_version_id: versionId,
      updated_at: now,
    });

    // Update search text with new content
    const searchText = [
      prompt.name,
      prompt.description,
      prompt.purpose,
      prompt.tags.join(" "),
      args.content.slice(0, 500),
    ].filter(Boolean).join(" ");

    await ctx.db.patch(args.promptId, {
      search_text: searchText,
    });

    // Create event log
    await ctx.db.insert("prompt_events", {
      prompt_id: args.promptId,
      event_type: "version_created",
      metadata: {
        version: newVersionNumber,
        previous_version: currentVersion.version_number,
        type: args.versionType,
      },
      created_at: now,
      created_by: args.author,
    });

    return { id: versionId, version: newVersionNumber };
  },
});

// Mutation to rollback to a previous version
export const rollback = mutation({
  args: {
    promptId: v.id("prompts"),
    versionId: v.id("prompt_versions"),
    comment: v.optional(v.string()),
    author: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) {
      throw new Error("Prompt not found");
    }

    const targetVersion = await ctx.db.get(args.versionId);
    if (!targetVersion || targetVersion.prompt_id !== args.promptId) {
      throw new Error("Version not found or does not belong to this prompt");
    }

    const currentVersion = prompt.current_version_id
      ? await ctx.db.get(prompt.current_version_id)
      : null;

    // Update prompt to reference the rolled-back version
    await ctx.db.patch(args.promptId, {
      current_version_id: args.versionId,
      updated_at: now,
    });

    // Update search text with rolled-back content
    const searchText = [
      prompt.name,
      prompt.description,
      prompt.purpose,
      prompt.tags.join(" "),
      targetVersion.content.slice(0, 500),
    ].filter(Boolean).join(" ");

    await ctx.db.patch(args.promptId, {
      search_text: searchText,
    });

    // Create event log
    await ctx.db.insert("prompt_events", {
      prompt_id: args.promptId,
      event_type: "rollback",
      comment: args.comment,
      metadata: {
        from_version: currentVersion?.version_number,
        to_version: targetVersion.version_number,
      },
      created_at: now,
      created_by: args.author,
    });

    return { success: true, version: targetVersion.version_number };
  },
});