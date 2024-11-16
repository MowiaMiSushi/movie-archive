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
                <div class="delete-button" onclick="event.stopPropagation(); deleteReview(${review.id})">
                    <i class="fas fa-times"></i>
                </div>
                <div class="movie-card-content" onclick="openReviewDetails(${review.id})">
                    <img src="${TMDB_IMAGE_BASE_URL + review.posterPath}" alt="${review.movieTitle}">
                    <div class="movie-info">
                        <h3>${review.movieTitle}</h3>
                        <p>Ocena: ${review.rating}/10</p>
                        <p class="review-preview">${review.review.slice(0, 100).trim()}${review.review.length > 100 ? '...' : ''}</p>
                    </div>
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
    document.body.style.overflow = 'hidden'; // Blokuje scrollowanie body

    // Obsługa zamykania
    const closeModal = () => {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Przywraca scrollowanie
        form.reset();
    };

    // Zamykanie przez przycisk
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
    });

    // Zamykanie przez kliknięcie poza modalem
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

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

    const reviewText = document.getElementById('review-text');
    reviewText.maxLength = 300; // Dodanie limitu znaków
    
    // Dodanie licznika znaków
    const container = reviewText.parentElement;
    const counter = document.createElement('div');
    counter.className = 'character-counter';
    counter.textContent = '0/300 znaków';
    container.appendChild(counter);

    reviewText.addEventListener('input', function() {
        counter.textContent = `${this.value.length}/300 znaków`;
    });
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
    const icon = themeToggle.querySelector('i');

    // Wczytaj zapisany motyw
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${savedTheme}-theme`);
    
    // Ustaw odpowiednią ikonę
    icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

    themeToggle.addEventListener('click', () => {
        const isDark = body.classList.contains('dark-theme');
        
        // Przełącz klasy
        body.classList.remove('light-theme', 'dark-theme');
        body.classList.add(isDark ? 'light-theme' : 'dark-theme');
        
        // Przełącz ikonę
        icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
        
        // Zapisz preferencję
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    });

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

    // Dodaj na początku pliku obsługę dotykową
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('touchmove', (e) => {
            if (e.target === modal) {
                e.preventDefault();
            }
        }, { passive: false });
    });
});

// Dodaj nową funkcję do otwierania szczegółów recenzji
function openReviewDetails(reviewId) {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    const modal = document.getElementById('review-details-modal');
    const movieDetails = modal.querySelector('.movie-details');
    const reviewText = modal.querySelector('.review-text');
    const ratingDisplay = modal.querySelector('.rating-display');
    const reviewDate = modal.querySelector('.review-date');

    movieDetails.innerHTML = `
        <div class="modal-movie-info">
            <img src="${TMDB_IMAGE_BASE_URL + review.posterPath}" alt="${review.movieTitle}">
            <div>
                <h2>${review.movieTitle}</h2>
            </div>
        </div>
    `;

    ratingDisplay.innerHTML = `
        <div class="rating-stars">
            <span class="rating-number">Ocena: ${review.rating}/10</span>
            ${generateStars(review.rating)}
        </div>
    `;

    reviewText.textContent = review.review;
    reviewDate.textContent = `Data recenzji: ${new Date(review.date).toLocaleDateString('pl-PL')}`;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Blokuje scrollowanie body

    // Obsługa zamykania
    const closeModal = () => {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Przywraca scrollowanie
    };

    // Zamykanie przez przycisk
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
    });

    // Zamykanie przez kliknięcie poza modalem
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Funkcja pomocnicza do generowania gwiazdek
function generateStars(rating) {
    const fullStars = Math.floor(rating / 2);
    const halfStar = rating % 2 >= 1;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return `
        ${Array(fullStars).fill('<i class="fas fa-star"></i>').join('')}
        ${halfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
        ${Array(emptyStars).fill('<i class="far fa-star"></i>').join('')}
    `;
}

// Konfiguracja TMDB API
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_API_KEY = '24d863d54c86392e6e1df55b9a328755';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyNGQ4NjNkNTRjODYzOTJlNmUxZGY1NWI5YTMyODc1NSIsInN1YiI6IjY1ZTg3NmM5OTYzODY0MDE4NmI4OWZhZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.BgD5J6KwXSzwjw0bH6TLjQQ-veMexE2-YyYBb-8Iy4U';

// Funkcja pomocnicza do wykonywania zapytań do TMDB API
async function fetchFromTMDB(endpoint) {
    try {
        const url = `${TMDB_BASE_URL}${endpoint}`;
        const finalUrl = endpoint.includes('?') ? 
            `${url}&api_key=${TMDB_API_KEY}` : 
            `${url}?api_key=${TMDB_API_KEY}`;
            
        const response = await fetch(finalUrl, {
            headers: {
                'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Błąd podczas pobierania danych z TMDB:', error);
        throw error;
    }
}

// Przykład użycia w funkcji wyszukiwania
async function searchMovies(query) {
    try {
        const data = await fetchFromTMDB(`/search/movie?query=${encodeURIComponent(query)}&language=pl-PL`);
        displaySearchResults(data.results.slice(0, 5));
    } catch (error) {
        console.error('Błąd wyszukiwania:', error);
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.innerHTML = '<p>Wystąpił błąd podczas wyszukiwania.</p>';
        }
    }
}

async function getSuggestedMovies(movieId) {
    try {
        const data = await fetchFromTMDB(`/movie/${movieId}/recommendations?language=pl-PL`);
        return data.results.slice(0, 6);
    } catch (error) {
        console.error('Błąd pobierania sugestii:', error);
        return [];
    }
}

async function fetchMoviesByGenre(genreId) {
    try {
        const data = await fetchFromTMDB(`/discover/movie?with_genres=${genreId}&language=pl-PL&sort_by=popularity.desc`);
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

    try {
        if (category === 'all') {
            const data = await fetchFromTMDB('/movie/popular?language=pl-PL');
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
    } catch (error) {
        console.error('Błąd wyświetlania filmów:', error);
        moviesContainer.innerHTML = '<p>Wystąpił błąd podczas ładowania filmów.</p>';
    }
}