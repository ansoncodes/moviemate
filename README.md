# MovieMate

A full-stack movie and TV show tracking application built with Django REST Framework and React. Track your watchlist, rate content, and manage your viewing history.

##Features

- Add movies and TV shows with detailed information
- Track seasons and episodes for TV shows
- Rate and review your watched content
- View statistics and insights about your viewing habits
- Filter and search through your collection
- Fully responsive design

## Tech Stack

**Frontend:**
- React
- Axios for API calls
- CSS3 for styling

**Backend:**
- Django 6.0
- Django REST Framework
- PostgreSQL
- django-cors-headers
- django-filters

## Prerequisites

Before you begin, ensure you have the following installed:
- Python 3.8+
- Node.js 16+
- Git

##Getting Started

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ansoncodes/moviemate-backend.git
   cd moviemate-backend
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create a `.env` file in the project root**
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   DATABASE_URL=postgresql://username:password@localhost:5432/moviemate_db
   FRONTEND_URL=http://localhost:5173
   ```

5. **Set up the database**
   ```bash
   # Create PostgreSQL database
   psql -U postgres
   CREATE DATABASE moviemate_db;
   \q
   
   # Run migrations
   python manage.py migrate
   ```

6. **Create a superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the development server**
   ```bash
   python manage.py runserver
   ```

   Backend will be running at `http://localhost:8000`

### Frontend Setup

1. **Clone the frontend repository**
   ```bash
   git clone https://github.com/ansoncodes/moviemate-front.git
   cd moviemate-front
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file in the project root**
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Frontend will be running at `http://localhost:5173`

## 🌐 Deployment

### Backend Deployment (Render)

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select "Python" as the environment

2. **Configure Build & Start Commands**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn moviemate.wsgi:application`

3. **Set Environment Variables**
   ```
   SECRET_KEY=your-production-secret-key
   DEBUG=False
   ALLOWED_HOSTS=your-app.onrender.com
   DATABASE_URL=your-postgres-connection-string
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

4. **Database**
   - Create a PostgreSQL database on Render
   - Copy the connection string to `DATABASE_URL`

### Frontend Deployment (Vercel)

1. **Import your repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your frontend repository

2. **Configure Environment Variables**
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```

3. **Add `vercel.json` to handle SPA routing**
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

4. **Deploy**
   - Vercel will automatically build and deploy your app
   - Get your production URL

## 📁 Project Structure

### Backend
```
moviemate-backend/
├── moviemate/          # Main project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── core/               # Main app
│   ├── models.py       # Database models
│   ├── serializers.py  # DRF serializers
│   ├── views.py        # API views
│   └── urls.py         # App URLs
├── manage.py
├── requirements.txt
└── .env
```

### Frontend
```
moviemate-front/
├── src/
│   ├── components/     # React components
│   ├── services/       # API service files
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── public/
├── index.html
├── package.json
├── vercel.json
└── .env
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 👨‍💻 Author

**Anson**
- GitHub: [@ansoncodes](https://github.com/ansoncodes)

## 🙏 Acknowledgments

- Django REST Framework documentation
- React documentation
- Vercel & Render for hosting

---

⭐ Star this repo if you find it helpful!
