from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from core.utils.gemini import generate_ai_summary



from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone

from core.utils.gemini import generate_ai_summary


class Media(models.Model):
    #media types
    movie = "movie"
    tv_show = "tv_show"

    media_type_choices = [
        (movie, "Movie"),
        (tv_show, "TV Show"),
    ]

    #watch status
    watching = "watching"
    completed = "completed"
    watchlist = "watchlist"

    status_choices = [
        (watching, "Watching"),
        (completed, "Completed"),
        (watchlist, "Watchlist"),
    ]

    #relations
    genres = models.ManyToManyField(
        "Genre",
        through="MediaGenre",
        related_name="media"
    )

    #core fields
    title = models.CharField(max_length=200)
    media_type = models.CharField(max_length=10, choices=media_type_choices)
    director = models.CharField(max_length=200, null=True, blank=True)
    platform = models.CharField(max_length=100, null=True, blank=True)

    status = models.CharField(
        max_length=15,
        choices=status_choices,
        default=watchlist
    )

    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        null=True,
        blank=True,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)]
    )

    review = models.TextField(null=True, blank=True)
    ai_review_summary = models.TextField(null=True, blank=True)

    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["platform"]),
        ]

    def clean(self):
        #rating is allowed only after completion
        if self.rating is not None and self.status != self.completed:
            raise ValidationError(
                "you can only rate a movie or TV show after completing it."
            )

    def save(self, *args, **kwargs):
        self.full_clean()

        #generate ai summary only once
        if self.review and not self.ai_review_summary:
            self.ai_review_summary = generate_ai_summary(
                title=self.title,
                media_type=self.media_type,
                platform=self.platform,
                director=self.director,
                status=self.status,
                rating=self.rating,
                review=self.review,
            )

        #handle completion timestamp
        if self.status == self.completed and self.completed_at is None:
            self.completed_at = timezone.now()
        elif self.status != self.completed:
            self.completed_at = None

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Genre(models.Model):
    name = models.CharField(max_length=50, unique=True)
    def __str__(self):
        return self.name

class MediaGenre(models.Model):
    media = models.ForeignKey(
        Media,
        on_delete=models.CASCADE,
        related_name="media_genres"
    )
    genre = models.ForeignKey(
        Genre,
        on_delete=models.CASCADE,
        related_name="genre_medias"
    )
    class Meta:
        unique_together = ("media", "genre")


class TVShowDetails(models.Model):
    media = models.OneToOneField(
        Media,
        on_delete=models.CASCADE,
        related_name = "tv_details"
    )

    def clean(self):
        if self.media.media_type != Media.tv_show:
            raise ValidationError("TVShowDetails can only be linked to tv_show content")
    @property
    def total_seasons(self):
        return self.seasons.count()
    @property
    def total_episodes(self):
        return sum(season.total_episodes for season in self.seasons.all())
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.media.title} ({self.total_seasons} seasons,{self.total_episodes} episodes)"
    

class Season(models.Model):
    tv_details =models.ForeignKey(
        TVShowDetails,
        on_delete = models.CASCADE,
        related_name = "seasons"
    )

    season_number = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )
    total_episodes = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    class Meta:
        unique_together = ("tv_details", "season_number")
        ordering = ["season_number"]
    def __str__(self):
        return f"{self.tv_details.media.title} - Season {self.season_number}"
    

class SeasonProgress(models.Model):
    season = models.OneToOneField(
    Season,
    on_delete=models.CASCADE,
    related_name="season_progress")
    episodes_watched= models.PositiveIntegerField(default=0)
    def clean(self):
        if self.episodes_watched > self.season.total_episodes:
            raise ValidationError("watched episodes exceed season total")
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        #if all episodes across all seasons are watched, mark media as completed
        media = self.season.tv_details.media
        watch_progress, _ = WatchProgress.objects.get_or_create(media=media)

        if watch_progress.episodes_watched == watch_progress.total_episodes:
            media.status = Media.completed
            media.completed_at = timezone.now()
            media.save()

class WatchProgress(models.Model):
    media = models.OneToOneField(
        Media,
        on_delete=models.CASCADE,
        related_name="watch_progress"
    )
    last_watched_at = models.DateTimeField(auto_now=True)
    def clean(self):
        if self.media.media_type != Media.tv_show:
            raise ValidationError("WatchProgress only valid for TV shows")
    @property
    def episodes_watched(self):
        return sum(
            sp.episodes_watched
            for sp in SeasonProgress.objects.filter(
                season__tv_details=self.media.tv_details
            )
        )
    @property
    def total_episodes(self):
        return self.media.tv_details.total_episodes
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
