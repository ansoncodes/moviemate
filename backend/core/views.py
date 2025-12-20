from rest_framework import generics, filters, status
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError
from .models import Media, Genre, Season, SeasonProgress, TVShowDetails
from .serializers import(
    MediaCreateSerializer,
    MediaListSerializer,
    MediaDetailSerializer,
    MediaUpdateSerializer,
    GenreSerializer,
    SeasonCreateSerializer,
    SeasonUpdateSerializer,
    SeasonReadSerializer,
    SeasonProgressSerializer,
    TVShowDetailSerializer,
    TVShowDetailsCreateSerializer)


class MediaListCreateView(generics.ListCreateAPIView):
    queryset = Media.objects.all().prefetch_related('media_genres__genre')
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['media_type', 'platform', 'status']
    ordering_fields = ['title', 'rating', 'created_at', 'completed_at']
    ordering = ['-created_at']

    search_fields = ['title', 'director']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MediaCreateSerializer
        return MediaListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        genre = self.request.query_params.get('genre', None)
        if genre:
            queryset = queryset.filter(media_genres__genre__name__icontains=genre).distinct()

        return queryset


class GenreListCreateView(generics.ListCreateAPIView):
    queryset = Genre.objects.all().order_by('name')
    serializer_class = GenreSerializer


class GenreDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset=Genre.objects.all()
    serializer_class = GenreSerializer


class SeasonListCreateView(generics.ListCreateAPIView):
    def get_queryset(self):
        queryset = Season.objects.all().select_related(
            'tv_details__media'
        ).prefetch_related('season_progress')

        tv_details_id = self.request.query_params.get('tv_details')
        if tv_details_id:
            queryset = queryset.filter(tv_details_id = tv_details_id)


        media_id = self.request.query_params.get('media')
        if media_id:
            queryset = queryset.filter(tv_details__media_id=media_id)

        return queryset.order_by('season_number')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SeasonCreateSerializer
        return SeasonReadSerializer
    
class SeasonDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Season.objects.all().select_related('tv_details__media').prefetch_related('season_progress')

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return  SeasonUpdateSerializer
        return SeasonReadSerializer
    

class SeasonProgressUpdateView(generics.UpdateAPIView):
    queryset = SeasonProgress.objects.all().select_related('season__tv_details__media')
    serializer_class = SeasonProgressSerializer
    http_method_names =['patch', 'options', 'head']

    def get_object(self):
        season_id = self.kwargs.get('season_id')
        try:
            return SeasonProgress.objects.select_related('season__tv_details__media').get(season_id = season_id)
        except SeasonProgress.DoesNotExist:
            season = get_object_or_404(Season, id=season_id)
            return SeasonProgress.objects.create(season = season, episodes_watched = 0)
        


class SeasonProgressDetailView(generics.RetrieveAPIView):
    serializer_class = SeasonProgressSerializer

    def get_object(self):
        season_id = self.kwargs.get('season_id')
        try:
            return SeasonProgress.objects.select_related('season__tv_details__media').get(season_id=season_id)
        except SeasonProgress.DoesNotExist:
            season = get_object_or_404(Season, id=season_id)
            return SeasonProgress.objects.create(season=season, episodes_watched=0)


        

class MediaStatsView(generics.GenericAPIView):
    def get(self, request, *args, **kwargs):
        stats ={
            'total_media': Media.objects.count(),
            'total_movies': Media.objects.filter(media_type=Media.movie).count(),
            'total_tv_shows': Media.objects.filter(media_type=Media.tv_show).count(),
            'completed': Media.objects.filter(status = Media.completed).count(),
            'watching': Media.objects.filter(status= Media.watching).count(),
            'watchlist': Media.objects.filter(status= Media.watchlist).count(),
            'by_platform': self._get_platform_stats(),
            'top_rated': self._get_top_rated()
        }

        return Response(stats)
    
    def _get_platform_stats(self):
        from django.db.models import Count
        platforms = Media.objects.values('platform').annotate(
            count = Count('id')
        ).order_by('-count')
        return list(platforms)
    
    def _get_top_rated(self):
        top_media = Media.objects.filter(rating__isnull = False).order_by('-rating')[:5]

        return[{'id': m.id, 'title': m.title, 'rating': float(m.rating), 'media_type': m.media_type} for m in top_media]

class MediaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Media.objects.all().prefetch_related(
        'media_genres__genre',
        'tv_details__seasons__season_progress'
    )

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return MediaUpdateSerializer
        return MediaDetailSerializer


class TVShowDetailsCreateView(generics.CreateAPIView):
    queryset = TVShowDetails.objects.all()
    serializer_class = TVShowDetailsCreateSerializer
    
    def create(self, request, *args, **kwargs):
        media_id = request.data.get('media')
        
        if not media_id:
            return Response(
                {"error": "media id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            media = Media.objects.get(id=media_id)
        except Media.DoesNotExist:
            return Response(
                {"error": "Media not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if media.media_type != Media.tv_show:
            return Response(
                {"error": "Can only create TV details for TV shows"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        #check if TV details already exist. if so, return them
        if hasattr(media, 'tv_details'):
            return Response(
                {"id": media.tv_details.id, "media": media.id}, 
                status=status.HTTP_200_OK
            )
        
        #create new TV details
        try:
            tv_details = TVShowDetails.objects.create(media=media)
            return Response(
                {"id": tv_details.id, "media": media.id}, 
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )