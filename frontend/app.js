const state = {
  movies: [],
  recommended: [],
  genres: [],
  filters: {
    q: "",
    genre: "",
    minRating: 3.5
  }
};
const API_BASE = "https://midnight-recs-backend.onrender.com";


const elements = {};

function cacheElements() {
  elements.search = document.getElementById("search");
  elements.genre = document.getElementById("genre");
  elements.minRating = document.getElementById("minRating");
  elements.minRatingValue = document.getElementById("minRatingValue");
  elements.moviesGrid = document.getElementById("moviesGrid");
  elements.recommendedGrid = document.getElementById("recommendedGrid");
  elements.resultsMeta = document.getElementById("resultsMeta");
  elements.shuffleBtn = document.getElementById("shuffleBtn");
  elements.cardTemplate = document.getElementById("movieCardTemplate");
}

async function fetchJSON(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

async function loadInitialData() {
  const [genres, movies, recommended] = await Promise.all([
    fetchJSON(`${API_BASE}/api/genres`),
    fetchJSON(`${API_BASE}/api/movies`),
    fetchJSON(`${API_BASE}/api/recommendations?limit=4`)

  ]);

  state.genres = genres;
  state.movies = movies;
  state.recommended = recommended;
}

function populateGenreSelect() {
  elements.genre.innerHTML = '<option value="">Any</option>';
  state.genres.forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    elements.genre.appendChild(opt);
  });
}

function renderMovies(list, container) {
  container.innerHTML = "";

  if (!list.length) {
    const empty = document.createElement("p");
    empty.className = "meta-text";
    empty.textContent = "Nothing here yet. Try relaxing the filters.";
    container.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();

  list.forEach((movie) => {
    const card = elements.cardTemplate.content.firstElementChild.cloneNode(true);

    card.dataset.id = movie.id;
    card.querySelector(".movie-title").textContent = movie.title;
    card.querySelector(".movie-year").textContent = movie.year;
    card.querySelector(".pill-rating").textContent = movie.rating.toFixed(1);
    card.querySelector(".pill-genres").textContent = movie.genre.join(" • ");
    card.querySelector(".movie-overview").textContent = movie.overview;

    const tagsRow = card.querySelector(".tags-row");
    tagsRow.innerHTML = "";
    movie.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.className = "tag-chip";
      span.textContent = tag;
      tagsRow.appendChild(span);
    });

    // Rating buttons
    const ratingButtons = card.querySelectorAll(".rating-actions button");
    ratingButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const rating = Number(btn.dataset.rate);
        rateMovie(movie.id, rating);
      });
    });

    // More like this
    const moreBtn = card.querySelector(".recommend-like");
    moreBtn.addEventListener("click", () => {
      loadRecommendations({ basedOnId: movie.id });
    });

    frag.appendChild(card);
  });

  container.appendChild(frag);
}

function updateResultsMeta(list) {
  const total = list.length;
  const { q, genre, minRating } = state.filters;

  const bits = [];
  if (q) bits.push(`matching “${q}”`);
  if (genre) bits.push(genre);
  bits.push(`rated ≥ ${minRating.toFixed(1)}`);

  elements.resultsMeta.textContent =
    total === 0
      ? `No movies ${bits.join(", ")}.`
      : `${total} movie${total === 1 ? "" : "s"} ${bits.join(", ")}.`;
}

async function applyFilters() {
  const params = new URLSearchParams();
  if (state.filters.q) params.set("q", state.filters.q);
  if (state.filters.genre) params.set("genre", state.filters.genre);
  if (state.filters.minRating > 0) {
    params.set("minRating", String(state.filters.minRating));
  }

  const list = await fetchJSON(`${API_BASE}/api/movies?${params.toString()}`);
  state.movies = list;
  renderMovies(list, elements.moviesGrid);
  updateResultsMeta(list);
}

async function loadRecommendations(opts = {}) {
  const params = new URLSearchParams();
  if (opts.basedOnId) params.set("basedOnId", String(opts.basedOnId));
  if (state.filters.genre) params.set("genre", state.filters.genre);
  params.set("limit", "4");

  const recs = await fetchJSON(`${API_BASE}/api/recommendations?${params.toString()}`);
  state.recommended = recs;
  renderMovies(recs, elements.recommendedGrid);
}

async function rateMovie(id, rating) {
  try {
    const updated = await fetchJSON(`${API_BASE}/api/rate`, {
      method: "POST",
      body: JSON.stringify({ id, rating })
    });

    // Optimistically update rating in current state
    const applyRating = (list) =>
      list.map((m) => (m.id === updated.id ? { ...m, rating: updated.rating } : m));

    state.movies = applyRating(state.movies);
    state.recommended = applyRating(state.recommended);

    renderMovies(state.movies, elements.moviesGrid);
    renderMovies(state.recommended, elements.recommendedGrid);
    updateResultsMeta(state.movies);
  } catch (err) {
    console.error(err);
  }
}

function wireEvents() {
  elements.search.addEventListener("input", (e) => {
    state.filters.q = e.target.value.trim();
    applyFilters();
  });

  elements.genre.addEventListener("change", (e) => {
    state.filters.genre = e.target.value;
    applyFilters();
    loadRecommendations();
  });

  elements.minRating.addEventListener("input", (e) => {
    const value = Number(e.target.value);
    state.filters.minRating = value;
    elements.minRatingValue.textContent = value.toFixed(1);
  });

  elements.minRating.addEventListener("change", () => {
    applyFilters();
  });

  elements.shuffleBtn.addEventListener("click", () => {
    loadRecommendations();
  });
}

async function init() {
  cacheElements();
  wireEvents();
  elements.minRatingValue.textContent = state.filters.minRating.toFixed(1);

  try {
    await loadInitialData();
    populateGenreSelect();
    renderMovies(state.movies, elements.moviesGrid);
    renderMovies(state.recommended, elements.recommendedGrid);
    updateResultsMeta(state.movies);
  } catch (err) {
    console.error(err);
    elements.moviesGrid.innerHTML =
      '<p class="meta-text">Could not load movies. Is the backend running?</p>';
  }
}

document.addEventListener("DOMContentLoaded", init);

