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
    const currentLang = localStorage.getItem('language') || 'pl';
    const apiLang = currentLang === 'pl' ? 'pl-PL' : 'en-US';
    
    fetch(`${TMDB_BASE_URL}/movie/${movieData.id}?api_key=${TMDB_API_KEY}&language=${apiLang}`)
        .then(response => response.json())
        .then(translatedMovieData => {
            const modal = document.getElementById('movie-modal');
            const movieDetails = modal.querySelector('.movie-details');
            const form = document.getElementById('review-form');
            const closeBtn = modal.querySelector('.close');

            movieDetails.innerHTML = `
                <div class="modal-movie-info">
                    <img src="${TMDB_IMAGE_BASE_URL + translatedMovieData.poster_path}" alt="${translatedMovieData.title}">
                    <div>
                        <h2>${translatedMovieData.title}</h2>
                        <p>${translatedMovieData.release_date?.split('-')[0] || translations[currentLang].noDate}</p>
                        <p>${translatedMovieData.overview || translations[currentLang].noDescription}</p>
                    </div>
                </div>
            `;

            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';

            const closeModal = () => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
                form.reset();
                const counter = document.querySelector('.character-counter');
                if (counter) counter.remove();
            };

            closeBtn.replaceWith(closeBtn.cloneNode(true));
            const newCloseBtn = modal.querySelector('.close');
            newCloseBtn.addEventListener('click', closeModal);

            modal.onclick = (e) => {
                if (e.target === modal) closeModal();
            };

            form.onsubmit = async function(e) {
                e.preventDefault();
                const reviewText = document.getElementById('review-text').value;
                const rating = document.getElementById('rating').value;

                if (reviewText && rating) {
                    await saveReview(movieData, reviewText, parseInt(rating));
                    closeModal();
                    displayWatchedMovies();
                } else {
                    alert('Proszę wypełnić wszystkie pola formularza');
                }
            };

            const reviewText = document.getElementById('review-text');
            reviewText.maxLength = 300;
            
            const container = reviewText.parentElement;
            const counter = document.createElement('div');
            counter.className = 'character-counter';
            counter.textContent = '0/300 znaków';
            container.appendChild(counter);

            reviewText.addEventListener('input', function() {
                counter.textContent = `${this.value.length}/300 znaków`;
            });
        })
        .catch(error => {
            console.error('Błąd podczas pobierania przetłumaczonych danych filmu:', error);
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
                    <p>${movie.release_date?.split('-')[0] || translations[currentLang].noDate}</p>
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
        const currentLang = localStorage.getItem('language') || 'pl';
        suggestionsGrid.innerHTML = `<p>${translations[currentLang].noReviewsYet}</p>`;
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
    const currentLang = localStorage.getItem('language') || 'pl';
    const apiLang = currentLang === 'pl' ? 'pl-PL' : 'en-US';
    
    const moviesContainer = document.getElementById('movies-container');
    if (!moviesContainer) return;

    let movies = [];

    try {
        if (category === 'all') {
            const data = await fetchFromTMDB(`/movie/popular?language=${apiLang}`);
            movies = data.results;
        } else {
            movies = await fetchMoviesByGenre(GENRE_IDS[category], apiLang);
        }

        moviesContainer.innerHTML = movies
            .map(movie => `
                <div class="movie-card" onclick="selectMovie('${movie.id}')">
                    <img src="${TMDB_IMAGE_BASE_URL + movie.poster_path}" 
                         alt="${movie.title}"
                         onerror="this.src='https://via.placeholder.com/300x450'">
                    <div class="movie-info">
                        <h3>${movie.title}</h3>
                        <p>${movie.release_date?.split('-')[0] || translations[currentLang].noDate}</p>
                        <p class="movie-rating">${translations[currentLang].tmdbRating} ${movie.vote_average.toFixed(1)}/10</p>
                    </div>
                </div>
            `).join('');
    } catch (error) {
        console.error('Błąd wyświetlania filmów:', error);
        moviesContainer.innerHTML = `<p>${translations[currentLang].loadingError}</p>`;
    }
}

// Dodaj na początku pliku słownik tłumaczeń
const translations = {
    pl: {
        reviews: "Recenzje",
        suggestions: "Sugestie",
        categories: "Kategorie",
        searchPlaceholder: "Wyszukaj film / serial...",
        watchedMovies: "Obejrzane Filmy i Seriale - Moje Recenzje",
        suggestedMovies: "Sugerowane Filmy i Seriale",
        all: "Wszystkie",
        action: "Akcja",
        comedy: "Komedia",
        drama: "Dramat",
        horror: "Horror",
        scifi: "Sci-Fi",
        saveReview: "Zapisz recenzję",
        yourReview: "Twoja recenzja...",
        rating: "Ocena (1-10)",
        myReview: "Moja recenzja:",
        reviewDate: "Data recenzji:",
        deleteConfirm: "Czy na pewno chcesz usunąć tę recenzję?",
        characters: "znaków",
        noReviews: "Dodaj recenzje, aby zobaczyć sugestie filmów.",
        footerTitle: "© 2024 Archiwum Filmowe tworzone przez Aleksander Wacławik. Wszystkie prawa zastrzeżone.",
        footerDescription: "Strona dla osób uwielbiających film i seriale. Strona ma ułatwić zapamiętanie filmów i seriali, które obejrzałeś oraz podpowiada podobne filmy względem tego co już obejrzałeś.",
        footerPowered: "Powered by TMDB API",
        tmdbRating: "Ocena TMDB:",
        searchError: "Wystąpił błąd podczas wyszukiwania.",
        noDate: "Brak daty",
        loadingError: "Wystąpił błąd podczas ładowania filmów.",
        addReview: "Twoja recenzja...",
        appTitle: "Moje Archiwum",
        noReviewsYet: "Dodaj recenzje, aby zobaczyć sugestie filmów.",
        noDescription: "Brak opisu",
        fillAllFields: "Proszę wypełnić wszystkie pola formularza",
        myReviewTitle: "Moja recenzja:",
        rating: "Ocena:",
        reviewDate: "Data recenzji:"
    },
    en: {
        reviews: "Reviews",
        suggestions: "Suggestions",
        categories: "Categories",
        searchPlaceholder: "Search movies / TV shows...",
        watchedMovies: "Watched Movies and TV Shows - My Reviews",
        suggestedMovies: "Suggested Movies and TV Shows",
        all: "All",
        action: "Action",
        comedy: "Comedy",
        drama: "Drama",
        horror: "Horror",
        scifi: "Sci-Fi",
        saveReview: "Save Review",
        yourReview: "Your review...",
        rating: "Rating (1-10)",
        myReview: "My Review:",
        reviewDate: "Review date:",
        deleteConfirm: "Are you sure you want to delete this review?",
        characters: "characters",
        noReviews: "Add reviews to see movie suggestions.",
        footerTitle: "© 2024 Movie Archive created by Aleksander Wacławik. All rights reserved.",
        footerDescription: "A website for movie and TV series enthusiasts. The site helps you remember the movies and series you've watched and suggests similar ones based on what you've already seen.",
        footerPowered: "Powered by TMDB API",
        tmdbRating: "TMDB Rating:",
        searchError: "An error occurred while searching.",
        noDate: "No date",
        loadingError: "An error occurred while loading movies.",
        addReview: "Your review...",
        appTitle: "My Archive",
        noReviewsYet: "Add reviews to see movie suggestions.",
        noDescription: "No description",
        fillAllFields: "Please fill in all form fields",
        myReviewTitle: "My review:",
        rating: "Rating:",
        reviewDate: "Review date:"
    }
};

// Dodaj w funkcji DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {

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

    // Obsługa burger menu
    const burgerMenu = document.querySelector('.burger-menu');
    const navLinks = document.querySelector('.nav-links');
    const navOverlay = document.querySelector('.nav-overlay');

    burgerMenu.addEventListener('click', () => {
        burgerMenu.classList.toggle('active');
        navLinks.classList.toggle('active');
        navOverlay.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    // Zamykanie menu po kliknięciu w link lub overlay
    const closeMenu = () => {
        burgerMenu.classList.remove('active');
        navLinks.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    navOverlay.addEventListener('click', closeMenu);

    // Obsługa zmiany języka
    const languageToggle = document.getElementById('language-toggle');
    const currentLang = languageToggle.querySelector('.current-lang');
    
    // Wczytaj zapisany język
    let currentLanguage = localStorage.getItem('language') || 'pl';
    updateLanguage(currentLanguage);

    languageToggle.addEventListener('click', () => {
        currentLanguage = currentLanguage === 'pl' ? 'en' : 'pl';
        localStorage.setItem('language', currentLanguage);
        updateLanguage(currentLanguage);
    });

    function updateLanguage(lang) {
        // Aktualizuj tekst przycisku
        currentLang.textContent = lang.toUpperCase();

        // Aktualizuj teksty w nawigacji
        document.querySelector('a[href="#movies-section"]').textContent = translations[lang].reviews;
        document.querySelector('a[href="#suggestions-section"]').textContent = translations[lang].suggestions;
        document.querySelector('a[href="#categories-section"]').textContent = translations[lang].categories;

        // Aktualizuj placeholder wyszukiwarki
        document.getElementById('search-input').placeholder = translations[lang].searchPlaceholder;

        // Aktualizuj nagłówki sekcji
        document.querySelector('#movies-section h2').textContent = translations[lang].watchedMovies;
        document.querySelector('#suggestions-section h2').textContent = translations[lang].suggestedMovies;

        // Aktualizuj przyciski kategorii
        document.querySelector('[data-category="all"]').textContent = translations[lang].all;
        document.querySelector('[data-category="action"]').textContent = translations[lang].action;
        document.querySelector('[data-category="comedy"]').textContent = translations[lang].comedy;
        document.querySelector('[data-category="drama"]').textContent = translations[lang].drama;
        document.querySelector('[data-category="horror"]').textContent = translations[lang].horror;
        document.querySelector('[data-category="scifi"]').textContent = translations[lang].scifi;

        // Aktualizuj teksty w modalach
        document.querySelector('#review-text').placeholder = translations[lang].addReview;
        document.querySelector('#rating').placeholder = translations[lang].rating;
        document.querySelector('#review-form button[type="submit"]').textContent = translations[lang].saveReview;
        document.querySelector('.full-review h3').textContent = translations[lang].myReview;
        document.querySelector('.logo-text').textContent = translations[lang].appTitle;

        // Aktualizuj footer
        document.querySelector('.footer-content p:nth-child(1)').textContent = translations[lang].footerTitle;
        document.querySelector('.footer-content p:nth-child(2)').textContent = translations[lang].footerDescription;
        document.querySelector('.footer-content p:nth-child(3)').textContent = translations[lang].footerPowered;

        // Aktualizuj komunikat o braku recenzji
        const suggestionsGrid = document.getElementById('suggestions-grid');
        if (reviews.length === 0 && suggestionsGrid) {
            suggestionsGrid.innerHTML = `<p>${translations[lang].noReviews}</p>`;
        }

        // Zaktualizuj język API dla zapytań
        const apiLang = lang === 'pl' ? 'pl-PL' : 'en-US';
        
        // Odśwież wyświetlanie wszystkich filmów z nowym językiem
        displayReviews();
        displaySuggestions();
        const activeCategory = document.querySelector('.tab-button.active')?.dataset.category;
        if (activeCategory) {
            displayMoviesByCategory(activeCategory);
        }
    }
});

// Dodaj nową funkcję do otwierania szczegółów recenzji
function openReviewDetails(reviewId) {
    const currentLang = localStorage.getItem('language') || 'pl';
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    const modal = document.getElementById('review-details-modal');
    const movieDetails = modal.querySelector('.movie-details');
    const reviewText = modal.querySelector('.review-text');
    const ratingDisplay = modal.querySelector('.rating-display');
    const reviewDate = modal.querySelector('.review-date');
    const reviewTitle = modal.querySelector('.full-review h3');

    movieDetails.innerHTML = `
        <div class="modal-movie-info">
            <img src="${TMDB_IMAGE_BASE_URL + review.posterPath}" alt="${review.movieTitle}">
            <div>
                <h2>${review.movieTitle}</h2>
            </div>
        </div>
    `;

    reviewTitle.textContent = translations[currentLang].myReviewTitle;
    
    ratingDisplay.innerHTML = `
        <div class="rating-stars">
            <span class="rating-number">${translations[currentLang].rating} ${review.rating}/10</span>
            ${generateStars(review.rating)}
        </div>
    `;

    reviewText.textContent = review.review;
    reviewDate.textContent = `${translations[currentLang].reviewDate} ${new Date(review.date).toLocaleDateString(currentLang === 'pl' ? 'pl-PL' : 'en-US')}`;

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
    const currentLang = localStorage.getItem('language') || 'pl';
    const apiLang = currentLang === 'pl' ? 'pl-PL' : 'en-US';
    
    const moviesContainer = document.getElementById('movies-container');
    if (!moviesContainer) return;

    let movies = [];

    try {
        if (category === 'all') {
            const data = await fetchFromTMDB(`/movie/popular?language=${apiLang}`);
            movies = data.results;
        } else {
            movies = await fetchMoviesByGenre(GENRE_IDS[category], apiLang);
        }

        moviesContainer.innerHTML = movies
            .map(movie => `
                <div class="movie-card" onclick="selectMovie('${movie.id}')">
                    <img src="${TMDB_IMAGE_BASE_URL + movie.poster_path}" 
                         alt="${movie.title}"
                         onerror="this.src='https://via.placeholder.com/300x450'">
                    <div class="movie-info">
                        <h3>${movie.title}</h3>
                        <p>${movie.release_date?.split('-')[0] || translations[currentLang].noDate}</p>
                        <p class="movie-rating">${translations[currentLang].tmdbRating} ${movie.vote_average.toFixed(1)}/10</p>
                    </div>
                </div>
            `).join('');
    } catch (error) {
        console.error('Błąd wyświetlania filmów:', error);
        moviesContainer.innerHTML = `<p>${translations[currentLang].loadingError}</p>`;
    }
}

// Dodaj nowe klucze do istniejącego obiektu translations
translations.pl = {
    ...translations.pl,  // zachowaj istniejące tłumaczenia
    yourReview: "Twoja recenzja...",
    rating: "Ocena (1-10)",
    saveReview: "Zapisz recenzję",
    characters: "znaków",
    noDescription: "Brak opisu",
    fillAllFields: "Proszę wypełnić wszystkie pola formularza",
    myReviewTitle: "Moja recenzja:"
};

translations.en = {
    ...translations.en,  // zachowaj istniejące tłumaczenia
    yourReview: "Your review...",
    rating: "Rating (1-10)",
    saveReview: "Save review",
    characters: "characters",
    noDescription: "No description",
    fillAllFields: "Please fill in all form fields",
    myReviewTitle: "My review:"
};

