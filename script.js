const TMDB_API_KEY = '45918179a58278fb2d1356ca66eb55a3';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Najpierw zdefiniujmy funkcje w globalnym zakresie
function openReviewModal(movieData) {
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
    
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };
    
    form.onsubmit = (e) => {
        e.preventDefault();
        const reviewText = document.getElementById('review-text').value;
        const rating = document.getElementById('rating').value;
        
        if (reviewText && rating) {
            saveReview(movieData, reviewText, rating);
            modal.style.display = 'none';
            form.reset();
        }
    };
}

// Funkcja do sprawdzania dostępności localStorage
function isLocalStorageAvailable() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch(e) {
        return false;
    }
}

// Globalne funkcje do obsługi wyboru filmu
window.selectMovie = async function(movieId) {
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

window.handleMovieSelection = async function(movieId) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pl-PL`
        );
        const movieData = await response.json();
        openReviewModal(movieData);
        
        const searchResults = document.getElementById('search-results');
        const searchInput = document.getElementById('search-input');
        searchResults.innerHTML = '';
        searchInput.value = '';
    } catch (error) {
        console.error('Błąd pobierania szczegółów filmu:', error);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded'); // debugging

    // Zarządzanie motywem
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    if (!themeToggle) {
        console.error('Theme toggle button not found!');
        return;
    }

    // Wczytaj zapisany motyw
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.classList.add(`${savedTheme}-theme`);
    console.log('Current theme:', savedTheme); // debugging

    themeToggle.addEventListener('click', () => {
        console.log('Theme toggle clicked'); // debugging
        body.classList.toggle('dark-theme');
        body.classList.toggle('light-theme');
        const currentTheme = body.classList.contains('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        console.log('Theme changed to:', currentTheme); // debugging
    });

    // Wyszukiwanie filmów
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (!searchInput || !searchResults) {
        console.error('Search elements not found!');
        return;
    }

    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        console.log('Search input:', e.target.value); // debugging
        clearTimeout(searchTimeout);
        const query = e.target.value;
        
        if (query.length > 2) {
            searchTimeout = setTimeout(() => {
                searchMovies(query);
            }, 500);
        } else {
            searchResults.innerHTML = '';
        }
    });

    async function searchMovies(query) {
        console.log('Searching for:', query); // debugging
        try {
            const response = await fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}&language=pl-PL`,
                {
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );
            console.log('Search response status:', response.status); // debugging
            const data = await response.json();
            console.log('Search results:', data); // debugging
            displaySearchResults(data.results.slice(0, 5));
        } catch (error) {
            console.error('Błąd wyszukiwania:', error);
            searchResults.innerHTML = '<p>Wystąpił błąd podczas wyszukiwania.</p>';
        }
    }

    function displaySearchResults(movies) {
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

    // Funkcja do obsługi wyboru filmu
    async function handleMovieSelection(movieId) {
        try {
            const response = await fetch(
                `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pl-PL`
            );
            const movieData = await response.json();
            
            openReviewModal(movieData);
            
            searchResults.innerHTML = '';
            searchInput.value = '';
        } catch (error) {
            console.error('Błąd pobierania szczegółów filmu:', error);
        }
    }

    // Obsługa płynnego przewijania dla linków nawigacji
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            targetElement.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Zarządzanie recenzjami
    let reviews = [];
    if (isLocalStorageAvailable()) {
        reviews = JSON.parse(localStorage.getItem('movieReviews')) || [];
    }

    function saveReview(movieData, reviewText, rating) {
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
            localStorage.setItem('movieReviews', JSON.stringify(reviews));
        }
        displayReviews();
        displaySuggestions();
    }

    function displayReviews() {
        const moviesGrid = document.getElementById('movies-grid');
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
                        <p>${review.review.substring(0, 100)}...</p>
                    </div>
                </div>
            `).join('');
    }

    // Funkcja do pobierania sugerowanych filmów
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

    // Funkcja do wyświetlania sugerowanych filmów
    async function displaySuggestions() {
        const suggestionsGrid = document.getElementById('suggestions-grid');
        if (reviews.length === 0) {
            suggestionsGrid.innerHTML = '<p>Dodaj recenzje, aby zobaczyć sugestie filmów.</p>';
            return;
        }

        // Pobiera sugestie na podstawie ostatnio ocenionego filmu
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

    // Obsługa kliknięcia poza modalem
    window.onclick = (event) => {
        const modal = document.getElementById('movie-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    // Inicjalizacja strony
    displayReviews();
    displaySuggestions();

    // Funkcja usuwania recenzji
    function deleteReview(reviewId) {
        if (confirm('Czy na pewno chcesz usunąć tę recenzję?')) {
            reviews = reviews.filter(review => review.id !== reviewId);
            if (isLocalStorageAvailable()) {
                localStorage.setItem('movieReviews', JSON.stringify(reviews));
            }
            displayReviews();
            displaySuggestions();
        }
    }
});