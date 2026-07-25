# Sprinkles

Sprinkles is a responsive weather dashboard that turns current conditions and a
seven-day forecast into a calm, editorial experience.

## Features

- Current conditions, feels-like temperature, wind, humidity, precipitation, and sunset
- Nine-hour outlook and seven-day forecast
- City search and browser geolocation
- Fahrenheit and Celsius support with a remembered preference
- Responsive, accessible interface with weather-aware visual themes
- No API key required; forecast data is provided by Open-Meteo

## Run locally

This is a static site, so any local web server will work:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Deployment

Netlify publishes the repository root. No build command is required.
