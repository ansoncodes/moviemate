from rest_framework import serializers
from .models import  Media, Genre, MediaGenre, TVShowDetails, Season, SeasonProgress, WatchProgress

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["id", "name"]


class MediaCreateSerializer(serializers.ModelSerializer):
    #take genre ids from client instead of revealing the table
    genre_ids = serializers.ListField(
        child = serializers.IntegerField(),
        write_only = True,
        required = False
    )
    class Meta:
        model = Media
        fields = ["id", "title", "media_type", "director", "platform", "status", "genre_ids"]

    def create(self, validated_data):
        #get genre ids before creating media
        genre_ids = validated_data.pop("genre_ids",[])
        media = Media.objects.create(**validated_data)
        #checking if all genre ids exist
        genres = Genre.objects.filter(id__in=genre_ids)
        if len(genres) != len(genre_ids):
            raise serializers.ValidationError("one or more genre IDs are invalid")
        #create media-genre relationships
        for genre in genres:
            MediaGenre.objects.create(media=media, genre=genre)
        
        if media.media_type == media.tv_show:
            TVShowDetails.objects.create(media=media)
            WatchProgress.objects.create(media=media)

        return media
    

class MediaListSerializer(serializers.ModelSerializer):
    genres=serializers.SerializerMethodField()

    class Meta:
        model = Media
        fields = ["id", "title", "media_type", "platform", "status", "rating", "genres"]

    def get_genres(self, obj):
        return[
            mg.genre.name
            for mg in obj.media_genres.select_related("genre")
        ]


class SeasonCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Season
        fields = ["id", "tv_details", "season_number", "total_episodes"]


class SeasonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeasonProgress
        fields = ["season", "episodes_watched"]


class SeasonReadSerializer(serializers.ModelSerializer):
    episodes_watched = serializers.IntegerField(
        source="season_progress.episodes_watched",
        default=0
    )

    class Meta:
        model = Season
        fields = ["id", "season_number", "total_episodes", "episodes_watched"]


class TVShowDetailSerializer(serializers.ModelSerializer):
    seasons = SeasonReadSerializer(many=True)

    class Meta:
        model = TVShowDetails
        fields = ["total_seasons", "total_episodes", "seasons"]


class MediaDetailSerializer(serializers.ModelSerializer):
    genres = serializers.SerializerMethodField()
    tv_details = TVShowDetailSerializer(read_only =True)

    class Meta:
        model = Media
        fields = [
            "id",
            "title",
            "media_type",
            "director",
            "platform",
            "status",
            "rating",
            "review",
            "completed_at",
            "genres",
            "tv_details",
        ]

    def get_genres(self, obj):
        return [
            mg.genre.name
            for mg in obj.media_genres.select_related("genre")
        ]