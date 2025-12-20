# MovieMate

MovieMate is a full-stack web application for tracking movies and TV shows across multiple platforms. It allows users to manage watchlists, track TV show progress season-wise, rate completed content, and view personalized viewing statistics.

## Demo Video - *Click the thumbnail below to watch the full demo*

[![MovieMate Demo](https://img.youtube.com/vi/zI7gaiIxuKY/maxresdefault.jpg)](https://www.youtube.com/watch?v=zI7gaiIxuKY)



## Features

- Add movies and TV shows with metadata (title, platform, genres, status)
- Track TV shows with season-wise episode progress
- Automatic completion detection when all episodes are watched
- Rate and review completed media (rating restricted until completion)
- AI-generated review summaries using Google Gemini
- Filter media by status (watchlist, watching, completed)
- Dashboard analytics for viewing habits

## Setup Steps

### Prerequisites

- Python 3.10+
- Node.js 16+
- Git

### Backend Setup (Django REST Framework)

```bash
git clone https://github.com/ansoncodes/moviemate.git
cd moviemate/backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

Create a `.env` file:

```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=allowed hosts
DATABASE_URL=database url
GEMINI_API_KEY=api key
FRONTEND_URL=http://localhost:5173
```

Run migrations and start server:

```bash
python manage.py migrate
python manage.py runserver
```

Backend runs at: http://localhost:8000

### Frontend Setup (React)

```bash
cd ../frontend
npm install
```

Create `.env`:

```
VITE_API_URL=http://localhost:8000
```

Start frontend:

```bash
npm run dev
```

Frontend runs at: http://localhost:5173

## Live Links

- GitHub Repository: https://github.com/ansoncodes/moviemate
- Live Application: https://moviemate-front.vercel.app/dashboard

## Author

M A Anson  
Full Stack Developer (Django · React)
