from django.urls import path
from .views import (
    MediaListCreateView,
    MediaDetailView,
    GenreListCreateView,
    GenreDetailView,
    SeasonListCreateView,
    SeasonDetailView,
    SeasonProgressUpdateView,
    SeasonProgressDetailView,
    MediaStatsView,
)

urlpatterns = [
    #media
    path("media/", MediaListCreateView.as_view(), name="media-list-create"),
    path("media/<int:pk>/", MediaDetailView.as_view(), name="media-detail"),

    #genres
    path("genres/", GenreListCreateView.as_view(), name="genre-list-create"),
    path("genres/<int:pk>/", GenreDetailView.as_view(), name="genre-detail"),

    #seasons
    path("seasons/", SeasonListCreateView.as_view(), name="season-list-create"),
    path("seasons/<int:pk>/", SeasonDetailView.as_view(), name="season-detail"),

    #season progress
    path("seasons/<int:season_id>/progress/", SeasonProgressDetailView.as_view(), name="season-progress-detail"),
    path("seasons/<int:season_id>/progress/update/", SeasonProgressUpdateView.as_view(), name="season-progress-update",),

    #stats
    path("stats/", MediaStatsView.as_view(), name="media-stats"),
]
