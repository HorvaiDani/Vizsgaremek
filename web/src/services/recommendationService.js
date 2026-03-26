// Ajánlási szolgáltatás – Steam játékok, cookie alapú személyre szabás
// Keresés és műfaj alapú ajánlások Steam API-val

import {
  searchGames,
} from './steamApi';
import { userBehavior, recommendationEngine, personalizedSearch } from './cookieService';

const getDirectSimilarGames = async (searchTerm) => {
  try {
    const searchResults = await searchGames(searchTerm, { limit: 20 });
    if (!Array.isArray(searchResults) || searchResults.length === 0) return [];

    const seedGenres = searchResults
      .slice(0, 3)
      .flatMap((g) => [g.genre, ...(g.genres || [])])
      .filter(Boolean)
      .map((g) => String(g));

    const uniqGenres = [...new Set(seedGenres)].slice(0, 3);
    if (uniqGenres.length === 0) return [];

    const buckets = await Promise.allSettled(uniqGenres.map((genre) => searchGames(genre, { limit: 20 })));
    const combined = buckets
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value || []);

    const seedIds = new Set(searchResults.map((g) => g.id));
    const unique = combined.filter((g, i, arr) => arr.findIndex((x) => x.id === g.id) === i);
    return unique.filter((g) => !seedIds.has(g.id)).slice(0, 18);
  } catch (error) {
    console.error('Hasonló játékok lekérése sikertelen:', error);
    return [];
  }
};

export const recommendationService = {
  getPersonalizedRecommendations: async () => {
    // Prefer server-side recommendations when a user is logged in
    try {
      const userName = window.__CURRENT_USER_NAME__ || '';
      if (userName) {
        try {
          const res = await fetch('/api/recommendations', { headers: { 'x-user': userName } });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) return data.slice(0, 18);
          }
        } catch (e) {
          // fall back to client-side
        }
      }

      // Fallback: client-side combined recommendations (cookie-based)
      const recommendations = recommendationEngine.getCombinedRecommendations();
      if (recommendations.length === 0) return [];

      const gamePromises = recommendations.map(async (term) => {
        try {
          const results = await searchGames(term, { limit: 10 });
          if (Array.isArray(results) && results.length > 0) return results[0];
          return null;
        } catch {
          return null;
        }
      });

      const settled = await Promise.allSettled(gamePromises);
      const games = settled
        .filter((r) => r.status === 'fulfilled' && r.value != null)
        .map((r) => r.value)
        .filter((g) => g.poster != null || g.isCensored)
        .slice(0, 18);
      return games;
    } catch (error) {
      console.error('Személyre szabott ajánlások lekérése sikertelen:', error);
      return [];
    }
  },

  getSimilarMoviesFromSearch: async (searchTerm) => {
    try {
      const direct = await getDirectSimilarGames(searchTerm);
      if (direct.length >= 4) return direct.slice(0, 18);

      const altSearches = [searchTerm, searchTerm + ' game', searchTerm + ' játék'];
      for (const alt of altSearches) {
        const altGames = await getDirectSimilarGames(alt);
        if (altGames.length >= 4) return altGames.slice(0, 18);
      }
      return [];
    } catch (error) {
      console.error('Kereséshez hasonló játékok sikertelen:', error);
      return [];
    }
  },

  getGenreBasedRecommendations: async () => {
    try {
      // If user is logged in, request top genres from server; otherwise fallback to cookie
      let topGenres = [];
      try {
        const { getRecommendationGenres } = await import('./trackingApi');
        const genres = await getRecommendationGenres(window.__CURRENT_USER_NAME__ || '');
        topGenres = Array.isArray(genres) ? genres.map((g) => g.genre) : [];
      } catch {
        const prefs = userBehavior.getGenrePreferences();
        topGenres = Object.entries(prefs)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([g]) => g);
      }

      if (!topGenres || topGenres.length === 0) return [];

      const all = [];
      for (const genre of topGenres.slice(0, 3)) {
        try {
          const results = await searchGames(genre, { limit: 15 });
          if (Array.isArray(results)) all.push(...results.slice(0, 5));
        } catch {
          // ignore
        }
      }
      return all.filter((g) => g.poster != null || g.isCensored).slice(0, 18);
    } catch (error) {
      console.error('Műfaj alapú ajánlások sikertelen:', error);
      return [];
    }
  },

  getSimilarMoviesFromViewed: async () => {
    try {
      const viewed = userBehavior.getViewedMovies();
      if (viewed.length === 0) return [];

      const recentGenres = viewed
        .slice(0, 5)
        .map((m) => m.genre)
        .filter((g) => g && g !== 'Unknown');

      if (recentGenres.length === 0) return [];

      const counts = {};
      recentGenres.forEach((g) => { counts[g] = (counts[g] || 0) + 1; });
      const top = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([g]) => g);

      const all = [];
      for (const genre of top) {
        try {
          const results = await searchGames(genre, { limit: 15 });
          if (Array.isArray(results)) all.push(...results.slice(0, 6));
        } catch {
          // ignore
        }
      }
      return all.filter((g) => g.poster != null || g.isCensored).slice(0, 18);
    } catch (error) {
      console.error('Nézett játékokhoz hasonló sikertelen:', error);
      return [];
    }
  },

  getAllRecommendations: async () => {
    try {
      const [personalized, genreRecs, similarRecs] = await Promise.all([
        recommendationService.getPersonalizedRecommendations(),
        recommendationService.getGenreBasedRecommendations(),
        recommendationService.getSimilarMoviesFromViewed(),
      ]);

      const combined = [...personalized, ...genreRecs, ...similarRecs];
      const unique = combined.filter(
        (game, i, arr) => arr.findIndex((g) => g.id === game.id) === i
      );
      return unique.slice(0, 24);
    } catch (error) {
      console.error('Összes ajánlás lekérése sikertelen:', error);
      return [];
    }
  },

  getPersonalizedSearchSuggestions: (currentQuery) => {
    return personalizedSearch.getSearchSuggestions(currentQuery);
  },

  getSmartSearchSuggestions: () => {
    return personalizedSearch.getSmartSuggestions();
  },
};
