// Cookie kezelő szolgáltatás - Felhasználói viselkedés követése és személyre szabott ajánlások
// Ez a fájl kezeli a cookie-kat és a felhasználói preferenciákat

// Cookie műveletek
export const cookieUtils = {
  // Cookie beállítása
  setCookie: (name, value, days = 30) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000)); // Napok milliszekundumban
    document.cookie = `${name}=${JSON.stringify(value)};expires=${expires.toUTCString()};path=/`;
  },

  // Cookie lekérése
  getCookie: (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        try {
          return JSON.parse(c.substring(nameEQ.length, c.length));
        } catch {
          return c.substring(nameEQ.length, c.length);
        }
      }
    }
    return null;
  },

  // Cookie törlése
  deleteCookie: (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  },

  // Cookie hozzáadása tömbhöz (keresések, nézett filmek)
  addToArrayCookie: (name, value, maxItems = 50) => {
    const existing = cookieUtils.getCookie(name) || [];
    const updated = [value, ...existing.filter(item => item !== value)].slice(0, maxItems);
    cookieUtils.setCookie(name, updated);
    return updated;
  },

  // Cookie érték növelése (filmek nézettsége)
  incrementCookie: (name, key) => {
    const existing = cookieUtils.getCookie(name) || {};
    existing[key] = (existing[key] || 0) + 1;
    cookieUtils.setCookie(name, existing);
    return existing;
  }
};

// Felhasználói viselkedés követése
export const userBehavior = {
  // Keresési előzmények mentése
  trackSearch: (query) => {
    if (!query || query.trim().length < 2) return;
    return cookieUtils.addToArrayCookie('searchHistory', query.trim().toLowerCase());
  },

  // Film nézettség követése
  trackMovieView: (movieId, movieTitle, genre) => {
    cookieUtils.incrementCookie('movieViews', movieId);
    cookieUtils.addToArrayCookie('viewedMovies', {
      id: movieId,
      title: movieTitle,
      genre: genre,
      timestamp: Date.now()
    });
  },

  // Műfaj preferenciák követése
  trackGenrePreference: (genre) => {
    if (!genre) return;
    cookieUtils.incrementCookie('genrePreferences', genre.toLowerCase());
  },

  // Keresési előzmények lekérése
  getSearchHistory: () => {
    return cookieUtils.getCookie('searchHistory') || [];
  },

  // Keresési előzmények tisztítása - csak a legutóbbi kereséseket tartjuk meg
  cleanSearchHistory: (keepCount = 20) => {
    const history = userBehavior.getSearchHistory();
    const cleanedHistory = history.slice(0, keepCount); // Csak az utolsó 20 keresést tartjuk meg
    cookieUtils.setCookie('searchHistory', cleanedHistory);
    return cleanedHistory;
  },

  // Nézett filmek lekérése
  getViewedMovies: () => {
    return cookieUtils.getCookie('viewedMovies') || [];
  },

  // Műfaj preferenciák lekérése
  getGenrePreferences: () => {
    return cookieUtils.getCookie('genrePreferences') || {};
  },

  // Film nézettség lekérése
  getMovieViews: () => {
    return cookieUtils.getCookie('movieViews') || {};
  },

  // Felhasználói adatok törlése
  clearUserData: () => {
    cookieUtils.deleteCookie('searchHistory');
    cookieUtils.deleteCookie('viewedMovies');
    cookieUtils.deleteCookie('genrePreferences');
    cookieUtils.deleteCookie('movieViews');
    cookieUtils.deleteCookie('cookieConsent');
  },

  // Cookie hozzájárulás ellenőrzése
  hasCookieConsent: () => {
    return cookieUtils.getCookie('cookieConsent') === true;
  },

  // Cookie hozzájárulás mentése
  setCookieConsent: (consent) => {
    cookieUtils.setCookie('cookieConsent', consent, 365); // 1 év
  }
};

// Ajánlási algoritmus
export const recommendationEngine = {
  // Keresési előzmények alapján ajánlások generálása
  getRecommendationsFromSearch: (searchHistory) => {
    if (!searchHistory || searchHistory.length === 0) return [];

    // Gyakori keresési kifejezések azonosítása
    const searchCounts = {};
    searchHistory.forEach(search => {
      searchCounts[search] = (searchCounts[search] || 0) + 1;
    });

    // Legnépszerűbb keresések
    const popularSearches = Object.entries(searchCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([search]) => search);

    return popularSearches;
  },

  // Műfaj preferenciák alapján ajánlások
  getRecommendationsFromGenres: (genrePreferences) => {
    if (!genrePreferences || Object.keys(genrePreferences).length === 0) return [];

    // Legnépszerűbb műfajok
    const popularGenres = Object.entries(genrePreferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    return popularGenres;
  },

  // Nézett filmek alapján hasonló filmek keresése
  getSimilarMovies: (viewedMovies) => {
    if (!viewedMovies || viewedMovies.length === 0) return [];

    // Gyakori műfajok a nézett filmekből
    const genreCounts = {};
    viewedMovies.forEach(movie => {
      if (movie.genre) {
        genreCounts[movie.genre] = (genreCounts[movie.genre] || 0) + 1;
      }
    });

    // Legnépszerűbb műfajok
    const popularGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    return popularGenres;
  },

  // Kombinált ajánlási stratégia
  getCombinedRecommendations: () => {
    const searchHistory = userBehavior.getSearchHistory();
    const genrePreferences = userBehavior.getGenrePreferences();
    const viewedMovies = userBehavior.getViewedMovies();

    const searchRecs = recommendationEngine.getRecommendationsFromSearch(searchHistory);
    const genreRecs = recommendationEngine.getRecommendationsFromGenres(genrePreferences);
    const similarRecs = recommendationEngine.getSimilarMovies(viewedMovies);

    // Ajánlások kombinálása és súlyozása
    const allRecommendations = [...searchRecs, ...genreRecs, ...similarRecs];
    const uniqueRecommendations = [...new Set(allRecommendations)];

    return uniqueRecommendations.slice(0, 10); // Top 10 ajánlás
  }
};

// Személyre szabott keresési javaslatok
export const personalizedSearch = {
  // Keresési javaslatok generálása
  getSearchSuggestions: (currentQuery) => {
    const searchHistory = userBehavior.getSearchHistory();
    const genrePreferences = userBehavior.getGenrePreferences();
    
    // Keresési előzményekből javaslatok
    const historySuggestions = searchHistory
      .filter(search => search.toLowerCase().includes(currentQuery.toLowerCase()))
      .slice(0, 3);

    // Műfaj alapú javaslatok
    const genreSuggestions = Object.keys(genrePreferences)
      .filter(genre => genre.toLowerCase().includes(currentQuery.toLowerCase()))
      .slice(0, 2);

    return [...historySuggestions, ...genreSuggestions];
  },

  // Intelligens keresési kifejezés javaslatok
  getSmartSuggestions: () => {
    const searchHistory = userBehavior.getSearchHistory();
    const genrePreferences = userBehavior.getGenrePreferences();
    const viewedMovies = userBehavior.getViewedMovies();

    const suggestions = [];

    // Legnépszerűbb keresések
    if (searchHistory.length > 0) {
      suggestions.push({
        type: 'search',
        text: `Hasonló keresések: ${searchHistory.slice(0, 3).join(', ')}`,
        searches: searchHistory.slice(0, 3)
      });
    }

    // Kedvenc műfajok
    if (Object.keys(genrePreferences).length > 0) {
      const topGenres = Object.entries(genrePreferences)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([genre]) => genre);
      
      suggestions.push({
        type: 'genre',
        text: `Kedvenc műfajok: ${topGenres.join(', ')}`,
        genres: topGenres
      });
    }

    // Nézett filmek alapján
    if (viewedMovies.length > 0) {
      suggestions.push({
        type: 'similar',
        text: `Hasonló filmek a nézettekhez`,
        movies: viewedMovies.slice(0, 3)
      });
    }

    return suggestions;
  }
};
