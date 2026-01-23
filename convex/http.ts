import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Import awesome prompts endpoint
http.route({
  path: "/import/awesome",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Check admin key
    const adminKey = request.headers.get("X-Admin-Key") || request.headers.get("x-admin-key");
    const expectedKey = process.env.ADMIN_KEY;

    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    try {
      // Fetch CSV from GitHub
      const response = await fetch(
        "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv"
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch prompts.csv: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();

      // Parse CSV (simple implementation)
      const lines = csvText.trim().split('\n');
      let imported = 0;
      let failed = 0;
      const totalParsed = lines.length - 1; // Skip header

      // Process each line (skip header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          // Parse CSV line: act,prompt,for_devs
          const commaIndex = line.indexOf(',');
          if (commaIndex === -1) continue;

          const act = line.substring(0, commaIndex).replace(/^"|"$/g, '').trim();
          const rest = line.substring(commaIndex + 1);

          // Handle quoted prompt that might contain commas
          let prompt: string;
          let forDevs = false;

          if (rest.startsWith('"')) {
            // Find the closing quote
            const endQuoteIndex = rest.indexOf('",', 1);
            if (endQuoteIndex !== -1) {
              prompt = rest.substring(1, endQuoteIndex);
              const remaining = rest.substring(endQuoteIndex + 2).trim();
              forDevs = remaining.toLowerCase() === 'true';
            } else {
              prompt = rest.substring(1, rest.length - 1); // Remove quotes
            }
          } else {
            // No quotes, find next comma
            const nextCommaIndex = rest.indexOf(',');
            if (nextCommaIndex !== -1) {
              prompt = rest.substring(0, nextCommaIndex).trim();
              forDevs = rest.substring(nextCommaIndex + 1).trim().toLowerCase() === 'true';
            } else {
              prompt = rest.trim();
            }
          }

          if (!act || !prompt) continue;

          // Create tags based on whether it's for developers
          const tags = ['awesome-chatgpt-prompts', 'imported'];
          if (forDevs) {
            tags.push('for-devs', 'developer', 'technical');
          } else {
            tags.push('general');
          }

          // Create prompt via mutation
          await ctx.runMutation(api.prompts.create, {
            name: act,
            description: `Imported from awesome-chatgpt-prompts`,
            purpose: 'awesome-chatgpt-prompts',
            tags,
            content: prompt,
            models: ['gpt-3.5-turbo', 'gpt-4'],
            author: 'awesome-chatgpt-prompts',
          });

          imported++;
        } catch (error) {
          console.error(`Failed to import line ${i}:`, error);
          failed++;
        }
      }

      const result = {
        sourceUrl: "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv",
        totalParsed,
        existing: totalParsed - imported - failed, // Simplified
        imported,
        failed,
      };

      return new Response(JSON.stringify(result), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
        },
      });

    } catch (error) {
      console.error('Import error:', error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Import failed'
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
    }
  }),
});

// Handle OPTIONS for CORS
http.route({
  path: "/import/awesome",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

export default http;