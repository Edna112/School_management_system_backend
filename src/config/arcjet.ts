import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

// Validate that the ARCJET_KEY env variable is set, unless running in test mode
const ARCJET_KEY = process.env.ARCJET_KEY;
const isTest = process.env.NODE_ENV === "test";

// Type for either a real Arcjet instance or a dummy/test implementation
type ArcjetLike =
  | ReturnType<typeof arcjet>
  | {
      withRule: () => {
        protect: () => Promise<{
          isDenied: () => boolean;
          reason: {
            isBot: () => boolean;
            isShield: () => boolean;
            isRateLimit: () => boolean;
          };
        }>;
      };
    };

// Creating a new instance of arcjet by passing some additional options to it,
// but only if a real key is present. Otherwise, provide a safe fallback for tests.
let aj: ArcjetLike;
if (ARCJET_KEY) {
  aj = arcjet({
    // Defining the rules for arcjet
    key: ARCJET_KEY,
    rules: [
      // Shield protects your app from common attacks e.g. SQL injection
      shield({ mode: "LIVE" }),
      // Create a bot detection rule
      detectBot({
        mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
        // Block all bots except the following
        allow: ["CATEGORY:SEARCH_ENGINE"], // Google, Bing, etc
      }),
      // Create rate limiter using sliding window. Other algorithms are supported.
      slidingWindow({
        mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
        interval: "2s", // 2 seconds
        max: 5, // Max 5 requests per interval
      }),
    ],
  });
} else if (isTest) {
  // Provide a dummy/test implementation for tests
  aj = {
    withRule: () => ({
      protect: async () => ({
        isDenied: () => false,
        reason: {
          isBot: () => false,
          isShield: () => false,
          isRateLimit: () => false,
        },
      }),
    }),
  };
} else {
  // If not in test mode and no key is present, throw an error
  throw new Error("ARCJET_KEY.env is required");
}

export default aj;
