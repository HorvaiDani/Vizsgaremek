// Ajánlási szolgáltatás – Steam játékok, cookie alapú személyre szabás
// Keresés és műfaj alapú ajánlások Steam API-val

import {
  searchGames,
  getGameDetails,
  transformStoreData,
} from './steamApi';
import { userBehavior, recommendationEngine, personalizedSearch } from './cookieService';

const getDirectSimilarGames = async (searchTerm) => {
  try {
    const searchResults = await searchGames(searchTerm);
    if (!Array.isArray(searchResults) || searchResults.length === 0) return [];

    const first = searchResults[0];
    const primaryGenre = first.genre || first.genres?.[0] || 'Action';
    const genreSearchResults = await searchGames(primaryGenre);
    if (!Array.isArray(genreSearchResults) || genreSearchResults.length === 0)
      return [];

    const similar = genreSearchResults
      .filter((g) => g.id !== first.id)
      .slice(0, 8);
    return similar;
  } catch (error) {
    console.error('Hasonló játékok lekérése sikertelen:', error);
    return [];
  }
};

export const recommendationService = {
  getPersonalizedRecommendations: async () => {
    try {
      const recommendations = recommendationEngine.getCombinedRecommendations();
      if (recommendations.length === 0) return [];

      const gamePromises = recommendations.map(async (term) => {
        try {
          const results = await searchGames(term);
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
        .filter((g) => g.poster != null)
        .slice(0, 12);
      return games;
    } catch (error) {
      console.error('Személyre szabott ajánlások lekérése sikertelen:', error);
      return [];
    }
  },

  getSimilarMoviesFromSearch: async (searchTerm) => {
    try {
      userBehavior.clearUserData();
      const direct = await getDirectSimilarGames(searchTerm);
      if (direct.length >= 4) return direct.slice(0, 8);

      const altSearches = [searchTerm, searchTerm + ' game', searchTerm + ' játék'];
      for (const alt of altSearches) {
        const altGames = await getDirectSimilarGames(alt);
        if (altGames.length >= 4) return altGames.slice(0, 8);
      }
      return [];
    } catch (error) {
      console.error('Kereséshez hasonló játékok sikertelen:', error);
      return [];
    }
  },

  getGenreBasedRecommendations: async () => {
    try {
      const prefs = userBehavior.getGenrePreferences();
      if (Object.keys(prefs).length === 0) return [];

      const topGenres = Object.entries(prefs)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([g]) => g);

      const all = [];
      for (const genre of topGenres) {
        try {
          const results = await searchGames(genre);
          if (Array.isArray(results)) all.push(...results.slice(0, 2));
        } catch {}
      }
      return all.filter((g) => g.poster != null).slice(0, 10);
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
          const results = await searchGames(genre);
          if (Array.isArray(results)) all.push(...results.slice(0, 3));
        } catch {}
      }
      return all.filter((g) => g.poster != null).slice(0, 8);
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
      return unique.slice(0, 15);
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
