import express, { Request, Response } from "express";
import cors from "cors";
import { createClient } from "pexels";
import "dotenv/config";

/**
* HTTP server to expose endpoints that query the Pexels API.
* - GET / => Healthcheck
* - GET /videos/popular => List of popular videos (per_page = 3)
*/
const app = express();

/**
* CORS configuration.
* If ORIGIN exists, it is parsed as a comma-separated list.
* If it doesn't, consider using cors() without 'origin' in development to allow all.
*/
const allowedOrigins = process.env.ORIGIN?.split(",").map(s => s.trim()).filter(Boolean);
app.use(
  // allowedOrigins && allowedOrigins.length > 0
  //   ? cors({ origin: allowedOrigins })
  //   : cors() 

  cors({ origin: allowedOrigins })
);

app.use(express.json());

/** Listening port. */
const PORT = Number(process.env.PORT);

/** Official Pexels client initialized with the API key. */
const client = createClient(process.env.PEXELS_API_KEY as string);

/**
* GET /videos/popular
* Returns the Pexels JSON of popular videos.
* Currently fixed at per_page: 3.
*
* Responses:
* - 200 OK: JSON object as returned by Pexels.
* - 500 : { error: "Failed to fetch popular videos" }
*/
app.get("/videos/popular", async (req: Request, res: Response) => {
  try {
    const data = await client.videos.popular({ per_page: 3 });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch popular videos" });
  }
});

/**
* GET /
* Simple healthcheck to verify that the server is up.
*/
app.get("/", (_req: Request, res: Response) => {
  res.send("Server running");
});

/** Server start. */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
