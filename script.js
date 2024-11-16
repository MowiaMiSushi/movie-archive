const TMDB_API_KEY = '45918179a58278fb2d1356ca66eb55a3';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Globalne zmienne
let reviews = [];

// ID kategorii
const GENRE_IDS = {
    action: 28,
    comedy: 35,
    drama: 18,
    horror: 27,
    scifi: 878
};

// Funkcje pomocnicze
function isLocalStorageAvailable() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch (e) {
        return false;
    }
}

// Funkcje obsługi recenzji
function saveReview(movieData, reviewText, rating) {
    console.log('Zapisywanie recenzji:', { movieData, reviewText, rating }); // Debugging

    const review = {
        id: Date.now(),
        movieId: movieData.id,
        movieTitle: movieData.title,
        posterPath: movieData.poster_path,
        review: reviewText,
        rating: rating,
        date: new Date().toISOString()
    };

    reviews.push(review);

    if (isLocalStorageAvailable()) {
        try {
            localStorage.setItem('movieReviews', JSON.stringify(reviews));
            console.log('Recenzja zapisana w localStorage'); // Debugging
        } catch (error) {
            console.error('Błąd zapisu w localStorage:', error);
        }
    }

    displayReviews();
    displaySuggestions();
}

function displayReviews() {
    const moviesGrid = document.getElementById('movies-grid');
    if (!moviesGrid) return;

    moviesGrid.innerHTML = reviews
        .map(review => `
            <div class="movie-card">
                <div class="delete-button" onclick="deleteReview(${review.id})">
                    <i class="fas fa-times"></i>
                </div>
                <img src="${TMDB_IMAGE_BASE_URL + review.posterPath}" alt="${review.movieTitle}">
                <div class="movie-info">
                    <h3>${review.movieTitle}</h3>
                    <p>Ocena: ${review.rating}/10</p>
                    <p>${review.review.substring(0, 100)}${review.review.length > 100 ? '...' : ''}</p>
                </div>
            </div>
        `).join('');
}

// Funkcje obsługi modalu
function openReviewModal(movieData) {
    console.log('Otwieranie modalu dla filmu:', movieData); // Debugging

    const modal = document.getElementById('movie-modal');
    const movieDetails = modal.querySelector('.movie-details');
    const form = document.getElementById('review-form');

    movieDetails.innerHTML = `
        <div class="modal-movie-info">
            <img src="${TMDB_IMAGE_BASE_URL + movieData.poster_path}" alt="${movieData.title}">
            <div>
                <h2>${movieData.title}</h2>
                <p>${movieData.release_date?.split('-')[0] || 'Brak daty'}</p>
                <p>${movieData.overview || 'Brak opisu'}</p>
            </div>
        </div>
    `;

    modal.style.display = 'block';

    // Obsługa zamykania modalu
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        form.reset();
    };

    // Obsługa formularza
    form.onsubmit = function (e) {
        e.preventDefault();
        console.log('Formularz wysłany'); // Debugging

        const reviewText = document.getElementById('review-text').value;
        const rating = document.getElementById('rating').value;

        console.log('Dane formularza:', { reviewText, rating }); // Debugging

        if (reviewText && rating) {
            try {
                saveReview(movieData, reviewText, parseInt(rating));
                modal.style.display = 'none';
                form.reset();
            } catch (error) {
                console.error('Błąd podczas zapisywania recenzji:', error);
            }
        } else {
            alert('Proszę wypełnić wszystkie pola formularza');
        }
    };
}

// Funkcje obsługi filmów
window.selectMovie = async function (movieId) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pl-PL`
        );
        const movieData = await response.json();
        openReviewModal(movieData);
    } catch (error) {
        console.error('Błąd pobierania szczegółów filmu:', error);
    }
};

window.handleMovieSelection = async function (movieId) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pl-PL`
        );
        const movieData = await response.json();
        openReviewModal(movieData);

        const searchResults = document.getElementById('search-results');
        const searchInput = document.getElementById('search-input');
        if (searchResults) searchResults.innerHTML = '';
        if (searchInput) searchInput.value = '';
    } catch (error) {
        console.error('Błąd pobierania szczegółów filmu:', error);
    }
};

// Funkcja usuwania recenzji
window.deleteReview = function (reviewId) {
    if (confirm('Czy na pewno chcesz usunąć tę recenzję?')) {
        reviews = reviews.filter(review => review.id !== reviewId);
        if (isLocalStorageAvailable()) {
            localStorage.setItem('movieReviews', JSON.stringify(reviews));
        }
        displayReviews();
        displaySuggestions();
    }
};

// Funkcje wyszukiwania
async function searchMovies(query) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${query}&language=pl-PL`
        );
        const data = await response.json();
        displaySearchResults(data.results.slice(0, 5));
    } catch (error) {
        console.error('Błąd wyszukiwania:', error);
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.innerHTML = '<p>Wystąpił błąd podczas wyszukiwania.</p>';
        }
    }
}

function displaySearchResults(movies) {
    const searchResults = document.getElementById('search-results');
    if (!searchResults) return;

    searchResults.innerHTML = movies
        .map(movie => `
            <div class="search-result" onclick="handleMovieSelection('${movie.id}')">
                <img src="${movie.poster_path ? TMDB_IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/50x75'}" 
                     alt="${movie.title}"
                     onerror="this.src='https://via.placeholder.com/50x75'">
                <div>
                    <h3>${movie.title}</h3>
                    <p>${movie.release_date?.split('-')[0] || 'Brak daty'}</p>
                </div>
            </div>
        `).join('');
}

// Funkcje sugestii
async function getSuggestedMovies(movieId) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=pl-PL`
        );
        const data = await response.json();
        return data.results.slice(0, 6);
    } catch (error) {
        console.error('Błąd pobierania sugestii:', error);
        return [];
    }
}

async function displaySuggestions() {
    const suggestionsGrid = document.getElementById('suggestions-grid');
    if (!suggestionsGrid) return;

    if (reviews.length === 0) {
        suggestionsGrid.innerHTML = '<p>Dodaj recenzje, aby zobaczyć sugestie filmów.</p>';
        return;
    }

    const lastReview = reviews[reviews.length - 1];
    const suggestions = await getSuggestedMovies(lastReview.movieId);

    suggestionsGrid.innerHTML = suggestions
        .map(movie => `
            <div class="movie-card" onclick="selectMovie('${movie.id}')">
                <img src="${TMDB_IMAGE_BASE_URL + movie.poster_path}" alt="${movie.title}">
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <p>${movie.release_date?.split('-')[0] || 'Brak daty'}</p>
                    <p class="movie-rating">Ocena TMDB: ${movie.vote_average.toFixed(1)}/10</p>
                </div>
            </div>
        `).join('');
}

// Funkcje do obsługi kategorii
async function fetchMoviesByGenre(genreId) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&language=pl-PL&sort_by=popularity.desc`
        );
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Błąd pobierania filmów z kategorii:', error);
        return [];
    }
}

async function displayMoviesByCategory(category) {
    const moviesContainer = document.getElementById('movies-container');
    if (!moviesContainer) return;

    let movies = [];

    if (category === 'all') {

        const response = await fetch(
            `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=pl-PL`
        );
        const data = await response.json();
        movies = data.results;
    } else {

        movies = await fetchMoviesByGenre(GENRE_IDS[category]);
    }

    moviesContainer.innerHTML = movies
        .map(movie => `
            <div class="movie-card" onclick="selectMovie('${movie.id}')">
                <img src="${TMDB_IMAGE_BASE_URL + movie.poster_path}" 
                     alt="${movie.title}"
                     onerror="this.src='https://via.placeholder.com/300x450'">
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <p>${movie.release_date?.split('-')[0] || 'Brak daty'}</p>
                    <p class="movie-rating">Ocena: ${movie.vote_average.toFixed(1)}/10</p>
                </div>
            </div>
        `).join('');
}

// Inicjalizacja przy załadowaniu strony
document.addEventListener('DOMContentLoaded', function () {

    if (isLocalStorageAvailable()) {
        reviews = JSON.parse(localStorage.getItem('movieReviews')) || [];
        displayReviews();
        displaySuggestions();
    }

    // Zarządzanie motywem
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme') || 'light';
        body.classList.add(`${savedTheme}-theme`);

        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-theme');
            body.classList.toggle('light-theme');
            const currentTheme = body.classList.contains('dark-theme') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
        });
    }

    // Wyszukiwanie filmów
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value;

            if (query.length > 2) {
                searchTimeout = setTimeout(() => {
                    searchMovies(query);
                }, 500);
            } else {
                const searchResults = document.getElementById('search-results');
                if (searchResults) searchResults.innerHTML = '';
            }
        });
    }

    // Obsługa kliknięcia poza modalem
    window.onclick = (event) => {
        const modal = document.getElementById('movie-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    // Dodaj inicjalizację formularza
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Formularz przechwycony przez event listener'); // Debugging
        });
    }

    // Obsługa zakładek
    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {

            tabButtons.forEach(btn => btn.classList.remove('active'));

            button.classList.add('active');

            const category = button.dataset.category;
            displayMoviesByCategory(category);
        });
    });

    // Wyświetl domyślną kategorię (wszystkie)
    displayMoviesByCategory('all');
});