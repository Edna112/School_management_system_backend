import arcjet, {shield, slidingWindow, detectBot} from "@arcjet/node"

//validate that the ARCJET_KEY env variable is set
if (!process.env.ARCJET_KEY && process.env.NODE_ENV !== "test") {
  throw new Error("ARCJET_KEY.env is required ");
}

//creating a new instance of arcjet by passing some additional options to it
const aj = arcjet({
  //defining the rules for arcjet 
  key: process.env.ARCJET_KEY!,
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: "LIVE" }),
    // Create a bot detection rule
    detectBot({
      mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
      ],
    }),
    // Create rate limiter using sliding window. Other algorithms are supported.
    slidingWindow({
        mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
        interval:'2s', // 2 seconds
        max: 5, // Max 5 requests per interval

    })
   
  ],
});
export default aj;
