"""
URL configuration for feedaneed project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from donations.views import DonationViewSet, DonationRequestViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from dashboard.views import home


router = routers.DefaultRouter()
router.register(r'donations', DonationViewSet)
router.register(r'requests', DonationRequestViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Accounts App Routes
    path('api/accounts/', include('accounts.urls')),

    # Donation + DonationRequest Routes
    path('api/', include(router.urls)),

    # Payments App Routes
    path('api/payments/', include('payments.urls')),

    # Dashboard Home
    path('', home, name='home'),
 
]

from django.conf import settings
from django.conf.urls.static import static

# Serve media files (invoices, images, etc.)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


