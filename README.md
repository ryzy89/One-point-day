# Cel dnia

Prosta statyczna aplikacja do zapisywania jednego głównego celu dnia, misji pobocznych i śledzenia postępów.

## Co zawiera aplikacja

- główny cel dnia,
- zapis danych wielu użytkowników w `localStorage` pod kluczem `onePointAppData`,
- oznaczanie celu jako zrobiony albo niezrobiony,
- streak, czyli licznik dni z rzędu z wykonanym głównym celem,
- statystyki skuteczności i wykresy,
- kalendarz aktywności,
- misje poboczne,
- motyw jasny i ciemny.

## Jak uruchomić lokalnie

Otwórz plik `index.html` w przeglądarce.

Aplikacja nie wymaga backendu, bazy danych ani instalowania zależności. Wszystkie dane zapisują się lokalnie w przeglądarce.

Dane starszej wersji zapisane pod kluczem `dailyGoals` są automatycznie przenoszone do użytkownika Łukasz. Aplikacja po migracji korzysta z `onePointAppData`.

## Publikacja na GitHub Pages

1. Utwórz nowe repozytorium na GitHubie.
2. Dodaj do repozytorium pliki:
   - `index.html`
   - `style.css`
   - `app.js`
   - `README.md`
3. Wejdź w `Settings` repozytorium.
4. Otwórz sekcję `Pages`.
5. Wybierz źródło publikacji:
   - `Deploy from a branch`
   - branch: `main`
   - folder: `/root`
6. Zapisz ustawienia.
7. Po chwili GitHub pokaże adres strony.

## Publikacja na Netlify

1. Wejdź na Netlify i utwórz nową stronę.
2. Wybierz opcję ręcznego uploadu albo połącz repozytorium z GitHubem.
3. Jeśli robisz upload ręczny, wrzuć cały folder z plikami aplikacji.
4. Nie ustawiaj komendy buildowania.
5. Jako katalog publikacji wybierz folder główny projektu.

## Ważne

Dane są zapisane w `localStorage`, więc są lokalne dla danej przeglądarki i urządzenia. Po opublikowaniu aplikacji online każdy użytkownik będzie miał swoje własne dane w swojej przeglądarce.
