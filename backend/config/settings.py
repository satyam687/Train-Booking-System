"""
Django settings for RailBook AI project.
"""
from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv(
    'SECRET_KEY',
    'django-insecure-railbook-ai-smart-super-secret-key-change-in-production-2026'
)

DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = [host.strip() for host in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,*').split(',') if host.strip()]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'django_filters',
    'drf_spectacular',

    # Local RailBook AI apps
    'apps.accounts.apps.AccountsConfig',
    'apps.stations.apps.StationsConfig',
    'apps.trains.apps.TrainsConfig',
    'apps.bookings.apps.BookingsConfig',
    'apps.payments.apps.PaymentsConfig',
    'apps.machine_learning.apps.MachineLearningConfig',
    'apps.notifications.apps.NotificationsConfig',
    'apps.dashboard.apps.DashboardConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Database configuration: SQLite3
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
        'OPTIONS': {
            'timeout': 20,  # SQLite transaction lock timeout
        }
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 6},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = []

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=120),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# drf-spectacular OpenAPI 3.0 configuration
SPECTACULAR_SETTINGS = {
    'TITLE': 'RailBook AI — Smart Train Booking API',
    'DESCRIPTION': 'Production-ready REST API for intelligent train reservations, real-time tracking, ML demand forecasts, and recommendations.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# External Train Status API Integration settings
TRAIN_API_PROVIDER = os.getenv('TRAIN_API_PROVIDER', 'mock')
TRAIN_API_BASE_URL = os.getenv('TRAIN_API_BASE_URL', 'https://api.railway-sample-provider.internal/v1')
TRAIN_API_KEY = os.getenv('TRAIN_API_KEY', '')
TRAIN_API_CACHE_TTL_SECONDS = int(os.getenv('TRAIN_API_CACHE_TTL_SECONDS', '300'))

# Authorized Railway Fare API Configuration
RAILWAY_FARE_API_KEY = os.getenv('RAILWAY_FARE_API_KEY', '')
RAILWAY_FARE_API_URL = os.getenv('RAILWAY_FARE_API_URL', 'https://api.railway-fare-provider.internal/v1')
RAILWAY_FARE_API_PROVIDER = os.getenv('RAILWAY_FARE_API_PROVIDER', '')
FARE_CACHE_TTL_MINUTES = int(os.getenv('FARE_CACHE_TTL_MINUTES', '60'))

# Apify IRCTC Train Data Scraper Actor (scrapingshark/irctc-train-data-scraper)
APIFY_API_TOKEN = os.getenv('APIFY_API_TOKEN', '')
APIFY_ACTOR_ID = os.getenv('APIFY_ACTOR_ID', 'scrapingshark/irctc-train-data-scraper')

# ML Artifacts Directory
ML_MODEL_DIR = BASE_DIR / 'ml' / 'artifacts'
os.makedirs(ML_MODEL_DIR, exist_ok=True)
DEMO_MODE = os.getenv('DEMO_MODE', 'True').lower() in ('true', '1', 'yes')
