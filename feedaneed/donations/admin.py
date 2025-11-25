
from django.contrib import admin
from .models import Donation, DonationRequest

@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('id', 'donor', 'type', 'status', 'created_at')

@admin.register(DonationRequest)
class DonationRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'donation', 'recipient', 'status', 'created_at')
