const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// In-memory movie data (could be replaced with a real DB later)
// Expanded with more genres like Horror, Comedy, etc.
const movies = [
  {
    id: 1,
    title: "Midnight Echoes",
    year: 2023,
    genre: ["Sci-Fi", "Drama"],
    rating: 4.7,
    posterUrl: "",
    overview:
      "A reclusive sound engineer discovers a hidden signal in late-night broadcasts that seems to predict the future.",
    tags: ["slow-burn", "atmospheric", "futuristic"]
  },
  {
    id: 2,
    title: "Neon Alley",
    year: 2021,
    genre: ["Thriller", "Crime"],
    rating: 4.3,
    posterUrl: "",
    overview:
      "In a city that never sleeps, a freelance hacker gets pulled into a conspiracy that blurs the line between real and virtual.",
    tags: ["neo-noir", "cyberpunk", "stylish"]
  },
  {
    id: 3,
    title: "Quiet Orbit",
    year: 2020,
    genre: ["Sci-Fi"],
    rating: 4.1,
    posterUrl: "",
    overview:
      "A lone astronaut stationed on a failing orbital station starts receiving messages from someone claiming to be their future self.",
    tags: ["minimal", "space", "psychological"]
  },
  {
    id: 4,
    title: "Blackout City",
    year: 2019,
    genre: ["Action", "Thriller"],
    rating: 3.9,
    posterUrl: "",
    overview:
      "A city-wide power failure traps a getaway driver, a detective, and a mysterious stranger on the same dark streets.",
    tags: ["high-energy", "dark", "urban"]
  },
  {
    id: 5,
    title: "Glass Horizon",
    year: 2018,
    genre: ["Drama", "Romance"],
    rating: 4.0,
    posterUrl: "",
    overview:
      "Two strangers share nightly conversations through the glass walls of neighboring skyscrapers.",
    tags: ["intimate", "character-driven", "cityscape"]
  },
  {
    id: 6,
    title: "Afterimage",
    year: 2017,
    genre: ["Mystery", "Drama"],
    rating: 4.4,
    posterUrl: "",
    overview:
      "A photographer begins to notice people disappearing from their old photos—and from real life.",
    tags: ["mind-bending", "mystery", "slow-burn"]
  },
  {
    id: 7,
    title: "Midnight Laughs",
    year: 2024,
    genre: ["Comedy"],
    rating: 4.2,
    posterUrl: "",
    overview:
      "Three tired roommates decide to watch one terrible horror movie every night—and accidentally become viral critics.",
    tags: ["funny", "found-footage", "meta"]
  },
  {
    id: 8,
    title: "Neon Panic",
    year: 2022,
    genre: ["Horror", "Thriller"],
    rating: 4.1,
    posterUrl: "",
    overview:
      "A power outage traps a group of friends inside an old multiplex where the horror movie on screen starts bleeding into reality.",
    tags: ["horror", "urban-legend", "ensemble"]
  },
  {
    id: 9,
    title: "Echo Park Nights",
    year: 2020,
    genre: ["Comedy", "Romance"],
    rating: 3.9,
    posterUrl: "",
    overview:
      "Two rival food-truck owners are forced to share a late-night parking spot and accidentally build a following together.",
    tags: ["feel-good", "funny", "cityscape"]
  },
  {
    id: 10,
    title: "Static Creek",
    year: 2019,
    genre: ["Horror", "Mystery"],
    rating: 4.0,
    posterUrl: "",
    overview:
      "In a small town where the radio never quite tunes in, a group of teens investigate a broadcast that only plays after midnight.",
    tags: ["slow-burn", "folk-horror", "teen"]
  },
  {
    id: 11,
    title: "Soft Reset",
    year: 2022,
    genre: ["Sci-Fi", "Thriller"],
    rating: 4.3,
    posterUrl: "",
    overview:
      "A customer success agent realizes the same callers reset their lives every 24 hours—and she's the only one who remembers.",
    tags: ["time-loop", "high-concept", "office"]
  },
  {
    id: 12,
    title: "Sunset Queue",
    year: 2021,
    genre: ["Drama"],
    rating: 3.8,
    posterUrl: "",
    overview:
      "Strangers waiting overnight for a movie premiere share stories that change how they see each other—and their own lives.",
    tags: ["ensemble", "talky", "character-driven"]
  },
  {
    id: 13,
    title: "Laugh Track",
    year: 2023,
    genre: ["Comedy"],
    rating: 4.0,
    posterUrl: "",
    overview:
      "A stand-up comic discovers their new special has a mysterious laugh track that reacts to jokes they didn't tell.",
    tags: ["surreal", "funny", "standup"]
  },
  {
    id: 14,
    title: "Dark Window",
    year: 2018,
    genre: ["Horror"],
    rating: 3.7,
    posterUrl: "",
    overview:
      "A night security guard in an empty office tower starts seeing people reflected in the windows who aren't really there.",
    tags: ["minimal", "one-location", "creepy"]
  },
  {
    id: 15,
    title: "Skyline Loop",
    year: 2019,
    genre: ["Sci-Fi", "Action"],
    rating: 4.1,
    posterUrl: "",
    overview:
      "A bike courier stuck in a time loop must deliver one package perfectly to break out of the reset.",
    tags: ["high-energy", "time-loop", "chase"]
  }
];

// Utility: simple recommendation logic
function getRecommendations({ basedOnId, genre, limit = 6 }) {
  let baseMovie = null;
  if (basedOnId) {
    baseMovie = movies.find((m) => m.id === Number(basedOnId));
  }

  let pool = movies.slice();

  if (genre) {
    pool = pool.filter((m) => m.genre.includes(genre));
  }

  if (baseMovie) {
    // Rank by same genre first, then by rating
    pool = pool
      .filter((m) => m.id !== baseMovie.id)
      .map((m) => {
        const sharedGenres = m.genre.filter((g) =>
          baseMovie.genre.includes(g)
        ).length;
        const score = sharedGenres * 2 + m.rating;
        return { movie: m, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((x) => x.movie);
  } else {
    // Fallback: just sort by rating
    pool = pool.sort((a, b) => b.rating - a.rating);
  }

  return pool.slice(0, limit);
}

// Routes
app.get("/api/movies", (req, res) => {
  const { q, genre, minRating } = req.query;
  let result = movies.slice();

  if (q) {
    const term = q.toLowerCase();
    result = result.filter(
      (m) =>
        m.title.toLowerCase().includes(term) ||
        m.overview.toLowerCase().includes(term) ||
        m.tags.some((t) => t.toLowerCase().includes(term))
    );
  }

  if (genre) {
    result = result.filter((m) => m.genre.includes(genre));
  }

  if (minRating) {
    const threshold = Number(minRating);
    if (!Number.isNaN(threshold)) {
      result = result.filter((m) => m.rating >= threshold);
    }
  }

  res.json(result);
});

app.get("/api/genres", (_req, res) => {
  const genres = Array.from(
    new Set(movies.flatMap((m) => m.genre))
  ).sort();
  res.json(genres);
});

app.get("/api/recommendations", (req, res) => {
  const { basedOnId, genre, limit } = req.query;
  const recs = getRecommendations({
    basedOnId,
    genre,
    limit: limit ? Number(limit) : 6
  });
  res.json(recs);
});

app.post("/api/rate", (req, res) => {
  const { id, rating } = req.body || {};
  const movie = movies.find((m) => m.id === Number(id));
  const numericRating = Number(rating);

  if (!movie || Number.isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
    return res.status(400).json({ error: "Invalid movie id or rating" });
  }

  // Simple smoothing towards the new rating
  movie.rating = Number(
    (movie.rating * 0.7 + numericRating * 0.3).toFixed(1)
  );

  res.json(movie);
});

// Serve frontend statically from ../frontend
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// SPA-style fallback: always return index.html for non-API GETs
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Movie recommendation API running on http://localhost:${PORT}`);
});

