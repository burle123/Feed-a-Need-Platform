from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DonationViewSet, DonationRequestViewSet

router = DefaultRouter()
router.register('donations', DonationViewSet, basename='donations')
router.register('requests', DonationRequestViewSet, basename='requests')

urlpatterns = router.urls
