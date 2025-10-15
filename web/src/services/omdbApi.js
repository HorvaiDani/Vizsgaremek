// OMDb API Szolgáltatás - Ez a fájl kezeli az OMDb API-val való kommunikációt
// Ez a fájl tartalmazza az összes API hívást és adatkezelést

// API kulcs és alap URL-ek
const API_KEY = '5cb23594'; // Az OMDb API kulcsunk
const BASE_URL = 'http://www.omdbapi.com'; // Az API alap URL-je
const POSTER_URL = 'http://img.omdbapi.com'; // A plakát képek URL-je

// Népszerű filmek listája - ezeket fogjuk lekérni az oldal betöltésekor
const POPULAR_MOVIES = [
  'The Dark Knight',
  'Inception',
  'Pulp Fiction',
  'The Godfather',
  'Forrest Gump',
  'The Matrix',
  'Goodfellas',
  'The Lord of the Rings: The Fellowship of the Ring',
  'Fight Club',
  'The Shawshank Redemption',
  'Interstellar',
  'The Avengers'
];

// Filmek keresése cím alapján
// Ez a függvény a keresési API-t használja, amely több filmet ad vissza
export const searchMovies = async (query, page = 1) => {
  try {
    // API hívás elkészítése a keresési paraméterekkel
    const response = await fetch(
      `${BASE_URL}/?apikey=${API_KEY}&s=${encodeURIComponent(query)}&page=${page}&type=movie`
    );
    
    // HTTP hiba ellenőrzése
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // JSON válasz feldolgozása
    const data = await response.json();
    
    // API válasz ellenőrzése (sikeres volt-e a keresés)
    if (data.Response === 'False') {
      throw new Error(data.Error || 'Film nem található');
    }
    
    return data;
  } catch (error) {
    console.error('Hiba a filmek keresésekor:', error);
    throw error;
  }
};

// Részletes film információ lekérése cím alapján
// Ez a függvény egy konkrét film teljes adatait kéri le
export const getMovieDetails = async (title) => {
  try {
    // API hívás egy konkrét filmre
    const response = await fetch(
      `${BASE_URL}/?apikey=${API_KEY}&t=${encodeURIComponent(title)}&plot=short`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.Response === 'False') {
      throw new Error(data.Error || 'Film nem található');
    }
    
    return data;
  } catch (error) {
    console.error('Hiba a film részleteinek lekérésekor:', error);
    throw error;
  }
};

// Film adatok lekérése IMDb ID alapján
// Ez akkor hasznos, ha már van IMDb ID-nk
export const getMovieById = async (imdbId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/?apikey=${API_KEY}&i=${imdbId}&plot=short`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.Response === 'False') {
      throw new Error(data.Error || 'Film nem található');
    }
    
    return data;
  } catch (error) {
    console.error('Hiba a film lekérésekor ID alapján:', error);
    throw error;
  }
};

// Plakát kép URL generálása
// Ez a függvény létrehozza a plakát kép URL-jét az IMDb ID alapján
export const getPosterUrl = (imdbId, size = 'S') => {
  return `${POSTER_URL}/?apikey=${API_KEY}&i=${imdbId}&h=${size}`;
};

// Népszerű filmek lekérése
// Ez a fő függvény, amely az oldal betöltésekor fut le
export const getPopularMovies = async () => {
  try {
    // Minden népszerű filmre külön API hívást indítunk
    // Promise.allSettled használjuk, hogy ha egy film nem található, a többi még működjön
    const moviePromises = POPULAR_MOVIES.map(title => getMovieDetails(title));
    const movies = await Promise.allSettled(moviePromises);
    
    // Sikeres hívások szűrése és adatok átalakítása
    const successfulMovies = movies
      .filter(result => result.status === 'fulfilled') // Csak a sikeres hívások
      .map(result => result.value) // Az eredmények kinyerése
      .map(movie => ({
        // Adatok átalakítása az alkalmazásunk formátumára
        id: movie.imdbID,
        title: movie.Title,
        year: movie.Year,
        rating: movie.imdbRating !== 'N/A' ? parseFloat(movie.imdbRating) : 0,
        genre: movie.Genre ? movie.Genre.split(',')[0].trim() : 'Unknown', // Csak az első műfaj
        poster: movie.Poster !== 'N/A' ? movie.Poster : null,
        plot: movie.Plot,
        director: movie.Director,
        actors: movie.Actors,
        runtime: movie.Runtime,
        imdbId: movie.imdbID
      }))
      .filter(movie => movie.poster !== null); // Csak azok a filmek, amelyeknek van plakátja
    
    return successfulMovies;
  } catch (error) {
    console.error('Hiba a népszerű filmek lekérésekor:', error);
    throw error;
  }
};

// OMDb film adatok átalakítása az alkalmazásunk formátumára
// Ez a függvény standardizálja az API válaszokat
export const transformMovieData = (omdbMovie) => {
  return {
    id: omdbMovie.imdbID,
    title: omdbMovie.Title,
    year: omdbMovie.Year,
    rating: omdbMovie.imdbRating !== 'N/A' ? parseFloat(omdbMovie.imdbRating) : 0,
    genre: omdbMovie.Genre ? omdbMovie.Genre.split(',')[0].trim() : 'Unknown',
    poster: omdbMovie.Poster !== 'N/A' ? omdbMovie.Poster : null,
    plot: omdbMovie.Plot,
    director: omdbMovie.Director,
    actors: omdbMovie.Actors,
    runtime: omdbMovie.Runtime,
    imdbId: omdbMovie.imdbID
  };
};