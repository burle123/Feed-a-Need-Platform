from django.db import models
from django.conf import settings

class Donation(models.Model):
    TYPE_CHOICES = (
        ('food', 'Food'),
        ('fund', 'Fund'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('completed', 'Completed'),
    )

    donor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='donations'
    )

    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    description = models.TextField(blank=True)
    quantity = models.CharField(max_length=200, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2,
                                 blank=True, null=True)

    payment_id = models.CharField(max_length=200, blank=True, null=True)

    method = models.CharField(max_length=20, default='pickup')
    location = models.TextField(blank=True, null=True)
    lat = models.FloatField(blank=True, null=True)
    lng = models.FloatField(blank=True, null=True)

    status = models.CharField(max_length=20,
                              choices=STATUS_CHOICES,
                              default='pending')

    invoice_number = models.CharField(max_length=64,blank=True, null=True)
    invoice_pdf = models.FileField(upload_to='invoices/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.type} by {self.donor.username} ({self.status})"


class DonationRequest(models.Model):
    donation = models.ForeignKey(
        Donation,
        on_delete=models.CASCADE,
        related_name='requests'
    )

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='donation_requests'
    )

    status = models.CharField(max_length=20, default='requested')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request {self.id} - {self.recipient.username}"
