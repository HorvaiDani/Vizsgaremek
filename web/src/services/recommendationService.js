// Ajánlási szolgáltatás - Cookie adatok alapján személyre szabott filmajánlások
// Ez a fájl kezeli az ajánlási logikát és az OMDb API-val való integrációt

import { searchMovies, getMovieDetails, transformMovieData } from './omdbApi';
import { userBehavior, recommendationEngine, personalizedSearch } from './cookieService';

// Közvetlenül hasonló filmek keresése
const getDirectSimilarMovies = async (searchTerm) => {
  try {
    console.log('🔍 Getting direct similar movies for:', searchTerm);
    
    // Keresési kifejezés alapján hasonló filmek keresése
    const searchResults = await searchMovies(searchTerm);
    console.log('Initial search results:', searchResults.Search?.length || 0, 'movies');
    
    if (!searchResults.Search || searchResults.Search.length === 0) {
      console.log('❌ No search results found');
      return [];
    }
    
    // Az első találat részletes adatainak lekérése
    const firstMovie = searchResults.Search[0];
    console.log('First movie:', firstMovie.Title);
    
    const detailedMovie = await getMovieDetails(firstMovie.Title);
    console.log('Detailed movie:', detailedMovie?.Title, 'Genre:', detailedMovie?.Genre);
    
    if (!detailedMovie) {
      console.log('❌ No detailed movie found');
      return [];
    }
    
    // Műfaj alapján hasonló filmek keresése
    const genre = detailedMovie.Genre;
    if (!genre) {
      console.log('❌ No genre found');
      return [];
    }
    
    // Műfaj szavak szétválasztása
    const genres = genre.split(',').map(g => g.trim());
    const primaryGenre = genres[0]; // Elsődleges műfaj
    
    console.log('🎭 Primary genre for similar movies:', primaryGenre);
    
    // Műfaj alapján keresés
    const genreSearchResults = await searchMovies(primaryGenre);
    console.log('Genre search results:', genreSearchResults.Search?.length || 0, 'movies');
    
    if (!genreSearchResults.Search || genreSearchResults.Search.length === 0) {
      console.log('❌ No genre search results found');
      return [];
    }
    
    // Műfaj alapú filmek részletes adatainak lekérése
    const genreMovies = genreSearchResults.Search.slice(0, 8); // Maximum 8 film
    console.log('Processing', genreMovies.length, 'genre movies...');
    
    const detailedMovies = await Promise.all(
      genreMovies.map(async (movie) => {
        try {
          const detailedMovie = await getMovieDetails(movie.Title);
          return transformMovieData(detailedMovie);
        } catch (error) {
          console.error(`Error fetching details for ${movie.Title}:`, error);
          return null;
        }
      })
    );
    
    // Csak a sikeres eredményeket visszaadjuk
    const validMovies = detailedMovies.filter(movie => 
      movie !== null && 
      movie.poster !== null && 
      movie.id !== firstMovie.imdbID // Az eredeti filmet kizárjuk
    );
    
    console.log('✅ Found direct similar movies:', validMovies.length);
    console.log('Similar movies:', validMovies.map(m => m.title));
    return validMovies;
    
  } catch (error) {
    console.error('❌ Error getting direct similar movies:', error);
    return [];
  }
};

// Személyre szabott filmajánlások szolgáltatása
export const recommendationService = {
  // Felhasználói keresési előzmények alapján ajánlások
  getPersonalizedRecommendations: async () => {
    try {
      const recommendations = recommendationEngine.getCombinedRecommendations();
      
      if (recommendations.length === 0) {
        return [];
      }

      // Ajánlások alapján filmek keresése
      const moviePromises = recommendations.map(async (recommendation) => {
        try {
          // Először keresési eredményeket próbálunk
          const searchResults = await searchMovies(recommendation);
          
          if (searchResults.Search && searchResults.Search.length > 0) {
            // Az első találatot választjuk és részletes adatokat kérünk
            const firstResult = searchResults.Search[0];
            const detailedMovie = await getMovieDetails(firstResult.Title);
            return transformMovieData(detailedMovie);
          }
          
          return null;
        } catch (error) {
          console.error(`Error fetching recommendation for ${recommendation}:`, error);
          return null;
        }
      });

      // Minden ajánlást párhuzamosan lekérünk
      const movies = await Promise.allSettled(moviePromises);
      
      // Csak a sikeres eredményeket visszaadjuk
      const successfulMovies = movies
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value)
        .filter(movie => movie.poster !== null) // Csak azok a filmek, amelyeknek van plakátja
        .slice(0, 12); // Maximum 12 ajánlás

      return successfulMovies;
    } catch (error) {
      console.error('Hiba a személyre szabott ajánlások lekérésekor:', error);
      return [];
    }
  },

  // Keresési előzmények alapján hasonló filmek
  getSimilarMoviesFromSearch: async (searchTerm) => {
    try {
      console.log('=== STARTING SIMILAR MOVIES SEARCH ===');
      console.log('Search term:', searchTerm);
      
      // Töröljük a keresési előzményeket hogy friss eredményeket kapjunk
      console.log('🧹 Clearing search history for fresh results...');
      userBehavior.clearUserData();
      
      // Először próbáljuk meg közvetlenül a keresési kifejezéshez hasonló filmeket keresni
      console.log('Trying direct similar movies...');
      const directSimilarMovies = await getDirectSimilarMovies(searchTerm);
      console.log('Direct similar movies result:', directSimilarMovies.length, 'movies');
      
      if (directSimilarMovies.length >= 4) {
        console.log('✅ Using direct similar movies:', directSimilarMovies.length);
        return directSimilarMovies.slice(0, 8);
      }
      
      console.log('❌ Not enough direct similar movies, trying alternative approach...');
      
      // Alternatív megközelítés: több keresési kifejezést próbálunk
      const alternativeSearches = [
        searchTerm,
        searchTerm + ' movie',
        searchTerm + ' film',
        searchTerm + ' biography'
      ];
      
      console.log('Alternative searches to try:', alternativeSearches);
      
      // Próbáljuk meg az alternatív kereséseket
      for (const altSearch of alternativeSearches) {
        console.log('Trying alternative search:', altSearch);
        const altMovies = await getDirectSimilarMovies(altSearch);
        if (altMovies.length >= 4) {
          console.log('✅ Found movies with alternative search:', altSearch);
          return altMovies.slice(0, 8);
        }
      }
      
      console.log('❌ No alternative searches worked, returning empty array');
      return [];
      
    } catch (error) {
      console.error('❌ Error in getSimilarMoviesFromSearch:', error);
      return [];
    }
  },

  // Műfaj alapú ajánlások
  getGenreBasedRecommendations: async () => {
    try {
      const genrePreferences = userBehavior.getGenrePreferences();
      
      if (Object.keys(genrePreferences).length === 0) {
        return [];
      }

      // Legnépszerűbb műfajok
      const topGenres = Object.entries(genrePreferences)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([genre]) => genre);

      // Műfajok alapján filmek keresése
      const moviePromises = topGenres.map(async (genre) => {
        try {
          const searchResults = await searchMovies(genre);
          if (searchResults.Search && searchResults.Search.length > 0) {
            // Minden műfajból 2-2 filmet választunk
            const movies = searchResults.Search.slice(0, 2);
            const detailedMovies = await Promise.all(
              movies.map(async (movie) => {
                try {
                  const detailedMovie = await getMovieDetails(movie.Title);
                  return transformMovieData(detailedMovie);
                } catch (error) {
                  return null;
                }
              })
            );
            return detailedMovies.filter(movie => movie !== null);
          }
          return [];
        } catch (error) {
          console.error(`Hiba a filmek lekérésekor ${genre} műfajhoz:`, error);
          return [];
        }
      });

      const genreMovies = await Promise.allSettled(moviePromises);
      
      const allMovies = genreMovies
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value)
        .filter(movie => movie.poster !== null)
        .slice(0, 10);

      return allMovies;
    } catch (error) {
      console.error('Hiba a műfaj alapú ajánlások lekérésekor:', error);
      return [];
    }
  },

  // Nézett filmek alapján hasonló filmek
  getSimilarMoviesFromViewed: async () => {
    try {
      const viewedMovies = userBehavior.getViewedMovies();
      
      if (viewedMovies.length === 0) {
        return [];
      }

      // Legutóbb nézett filmek műfajai
      const recentGenres = viewedMovies
        .slice(0, 5)
        .map(movie => movie.genre)
        .filter(genre => genre && genre !== 'Unknown');

      if (recentGenres.length === 0) {
        return [];
      }

      // Műfajok gyakorisága
      const genreCounts = {};
      recentGenres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });

      // Legnépszerűbb műfajok
      const topGenres = Object.entries(genreCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([genre]) => genre);

      // Hasonló filmek keresése
      const moviePromises = topGenres.map(async (genre) => {
        try {
          const searchResults = await searchMovies(genre);
          if (searchResults.Search && searchResults.Search.length > 0) {
            const movies = searchResults.Search.slice(0, 3);
            const detailedMovies = await Promise.all(
              movies.map(async (movie) => {
                try {
                  const detailedMovie = await getMovieDetails(movie.Title);
                  return transformMovieData(detailedMovie);
                } catch (error) {
                  return null;
                }
              })
            );
            return detailedMovies.filter(movie => movie !== null);
          }
          return [];
        } catch (error) {
          console.error(`Hiba a hasonló filmek lekérésekor ${genre} műfajhoz:`, error);
          return [];
        }
      });

      const similarMovies = await Promise.allSettled(moviePromises);
      
      const allMovies = similarMovies
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value)
        .filter(movie => movie.poster !== null)
        .slice(0, 8);

      return allMovies;
    } catch (error) {
      console.error('Hiba a nézett filmek alapján történő hasonló filmek lekérésekor:', error);
      return [];
    }
  },

  // Kombinált ajánlási stratégia - minden adatforrásból
  getAllRecommendations: async () => {
    try {
      // Párhuzamosan lekérjük az összes ajánlást
      const [
        personalizedRecs,
        genreRecs,
        similarRecs
      ] = await Promise.all([
        recommendationService.getPersonalizedRecommendations(),
        recommendationService.getGenreBasedRecommendations(),
        recommendationService.getSimilarMoviesFromViewed()
      ]);

      // Ajánlások kombinálása és duplikátumok eltávolítása
      const allRecommendations = [...personalizedRecs, ...genreRecs, ...similarRecs];
      const uniqueRecommendations = allRecommendations.filter((movie, index, self) => 
        index === self.findIndex(m => m.id === movie.id)
      );

      return uniqueRecommendations.slice(0, 15); // Maximum 15 ajánlás
    } catch (error) {
      console.error('Hiba az összes ajánlás lekérésekor:', error);
      return [];
    }
  },

  // Keresési javaslatok személyre szabása
  getPersonalizedSearchSuggestions: (currentQuery) => {
    return personalizedSearch.getSearchSuggestions(currentQuery);
  },

  // Intelligens keresési javaslatok
  getSmartSearchSuggestions: () => {
    return personalizedSearch.getSmartSuggestions();
  }
};
