# strato 🌊🌍☁️🌕

A minimalist, swipe-driven weather web app that visualizes environmental data in vertical *layers* and lets you scroll through time horizontally.

Inspired by [hightide.earth](https://hightide.earth), this app aims to deliver just the right weather data — no ads, no clutter, just signal.

## 🧭 Navigation

- **→ / ← Horizontal scroll**  
  Move forward or backward in time (hour-by-hour or day-by-day).

- **↑ / ↓ Vertical scroll**  
  Navigate through environmental layers:
  - 🌕 **Astro Layer**: Moon phase, visibility, sunrise/sunset
  - ☁️ **Sky Layer**: Wind, rain, clouds
  - 🌍 **Ground Layer** (default): Temperature, humidity, pressure
  - 🌊 **Sea Layer**: Tide level, water temperature

## 📁 Project Structure

```txt
project/
│
├── src/                      # All source code (backend + frontend)
│   ├── public/               # Static frontend files
│   │   ├── index.html        # Main page
│   │   ├── style.css         # Mobile-first CSS
│   │   ├── app.js            # Frontend JS
│   │   ├── manifest.json     # Web app manifest (PWA)
│   │   ├── service-worker.js # Service worker (PWA)
│   │   └── icons/            # App icons for PWA
│   └── server.js             # Node.js server (Express-style)
│
├── Dockerfile                # Docker container setup
└── README.md                 # Project documentation
```

## 🛠️ Tech Stack

| Layer         | Tech                                    |
||--|
| Frontend      | React, Vite, Tailwind CSS, Framer Motion |
| Data          | OpenWeatherMap, WorldTides, Moon API     |
| Hosting       | Vercel or Netlify                        |

## 🧱 Requirements

- Node.js >= 18 (for local development)
- Docker (optional, for containerized deployment)

## 🚀 Run Locally (Dev Mode)

```bash
# From project root
npm install
npm start
```

Visit [http://localhost:8080](http://localhost:8080)

## 🐳 Docker Usage

Build the image and run the container:

```bash
docker build -t demo-pwa .
docker run --rm -it -p 8080:8080 demo-pwa
```

Then open [http://localhost:8080](http://localhost:8080)
