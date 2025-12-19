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
    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("title cannot be empty or whitespaces")
        return value.strip()
    
    def validate_genre_ids(self, value):
        if value:
            existing_genres = Genre.objects.filter(id__in=value)
            if len(existing_genres) != len(value):
                invalid_ids = set(value) - set(existing_genres.values_list('id', flat=True))
                raise serializers.ValidationError("invalid genre ids")
        return value
        
    def create(self, validated_data):
        genre_ids = validated_data.pop("genre_ids",[])
        media = Media.objects.create(**validated_data)
        genres = Genre.objects.filter(id__in=genre_ids)
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
    
    def validate_season_number(self,value):
        if value<1:
            raise serializers.ValidationError("season number must be at least 1")
        return value
    
    def validate_total_episodes(self, value):
        if value<1:
            raise serializers.ValidationError("total episodes must be atleast 1")
        return value
    def validate(self, data):
        tv_details = data.get("tv_details")
        season_number = data.get("season_number")

        if Season.objects.filter(tv_details = tv_details,season_number = season_number).exists():
            raise serializers.ValidationError("season already exists for this TV show")
        return data
    
    def create(self, validated_data):
        season = super().create(validated_data)
        SeasonProgress.objects.create(season=season, episodes_watched =0)
        return season
    


class SeasonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeasonProgress
        fields = ["season", "episodes_watched"]

    

class SeasonReadSerializer(serializers.ModelSerializer):
    episodes_watched = serializers.IntegerField(
        source="season_progress.episodes_watched",
        default=0,
        read_only = True
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
        fields = ["id", "title", "media_type", "director", "platform", "status", "rating", "review", "completed_at", "genres", "tv_details",]

    def get_genres(self, obj):
        return [
            mg.genre.name
            for mg in obj.media_genres.select_related("genre")
        ]
    
class MediaUpdateSerializer(serializers.ModelSerializer):
    genre_ids = serializers.ListField(
        child = serializers.IntegerField(),
        write_only = True,
        required = False
    )

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("title cant be empty or whitespace")
        return value.strip()
    def validate_genre_ids(self, value):
        if value:
            existing_genres = Genre.objects.filter(id__in=value)
            if len(existing_genres) != len(value):
                invalid_ids = set(value) - set(existing_genres.values_list('id', flat=True))
                raise serializers.ValidationError("invalid genre ids")
        return value

    class Meta:
        model = Media
        fields =["title", "director", "platform", "status","rating","review", "genre_ids"]

    def update(self, instance, validated_data):
        genre_ids= validated_data.pop("genre_ids", None)

        instance = super().update(instance, validated_data)
        if genre_ids is not None:
            MediaGenre.objects.filter(media=instance).delete()
            for genre in Genre.objects.filter(id__in = genre_ids):
                MediaGenre.objects.create(media=instance, genre=genre)

        return instance
    

class SeasonUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Season
        fields = ["season_number", "total_episodes"]
    
    def validate_season_number(self, value):
        if value < 1:
            raise serializers.ValidationError("Season number should be at least 1")
        return value
    
    def validate_total_episodes(self, value):
        if value < 1:
            raise serializers.ValidationError("total episodes should be at least 1")
        return value
    
    def validate(self, data):
        season_number = data.get('season_number')
        
        if season_number and self.instance:
            #check if another season with this number exists
            if Season.objects.filter(
                tv_details=self.instance.tv_details,
                season_number=season_number
            ).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("season number already exists")
        
        return data