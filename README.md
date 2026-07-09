# One Point Day

Aplikacja do codziennego skupienia na jednym najważniejszym celu dnia.

Wersja online: https://one-point-day.netlify.app/

## Idea

One Point Day pomaga ograniczyć chaos codziennych zadań do jednej najważniejszej rzeczy. Użytkownik wybiera główny cel dnia, może dodać mniej ważne misje poboczne, a wieczorem oznacza, co zostało wykonane.

Aplikacja pokazuje streak, statystyki, historię postępów, kalendarz aktywności oraz osiągnięcia. Dane są przechowywane lokalnie w przeglądarce, więc projekt działa bez backendu i bez konta użytkownika.

## Funkcje

- Cel dnia z oznaczeniem: wykonany, niewykonany albo brak decyzji.
- Misje poboczne jako prosta checklista.
- Historia dni w formie activity feedu.
- Statystyki skuteczności.
- Wykresy kołowe, tygodniowe i miesięczne.
- Kalendarz aktywności w stylu GitHub Contributions.
- Osiągnięcia liczone dynamicznie z postępów.
- Wielu lokalnych użytkowników.
- Import i eksport danych do pliku JSON.
- Ekran powitalny i dane demonstracyjne.
- Tryb jasny i ciemny.

## Technologie

- HTML
- CSS
- JavaScript
- localStorage
- GitHub
- Netlify

## Jak uruchomić lokalnie

1. Pobierz albo sklonuj repozytorium.
2. Otwórz plik `index.html` w przeglądarce.

Aplikacja nie wymaga instalowania zależności, backendu, bundlera ani komend `npm`.

## Jak działa zapis danych

Dane są zapisywane lokalnie w `localStorage` przeglądarki. Oznacza to, że cele, historia, statystyki i użytkownicy są dostępni na tym urządzeniu i w tej konkretnej przeglądarce.

Dane nie synchronizują się jeszcze automatycznie między urządzeniami. Do przenoszenia danych można użyć importu i eksportu pliku JSON w aplikacji.

## Status projektu

Projekt w aktywnym rozwoju.

Aktualna wersja: `v0.1.1`

## Roadmapa

- Supabase i synchronizacja danych.
- Logowanie użytkowników.
- Migracja z `localStorage` do kont użytkowników.
- Rozbudowany panel postępów.
- Dalsze poprawki UI/UX.

## Supabase

Ręczna synchronizacja danych korzysta z tabeli `daily_goals`. Do poprawnego działania `upsert` tabela powinna mieć unikalne ograniczenie dla pary `user_id` i `date`.

Przykładowy SQL:

```sql
alter table public.daily_goals
add constraint daily_goals_user_id_date_key unique (user_id, date);
```

## Publikacja

Projekt jest statyczną aplikacją webową. Można go publikować na Netlify, GitHub Pages albo innym hostingu statycznym.

Na Netlify nie trzeba ustawiać komendy buildowania. Wystarczy opublikować główny katalog projektu zawierający pliki `index.html`, `style.css` i `app.js`.
