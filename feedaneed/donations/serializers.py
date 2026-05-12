from rest_framework import serializers
from .models import Donation, DonationRequest

class DonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source='donor.username', read_only=True)
    invoice_pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = [
            'id', 'type', 'description', 'quantity', 'amount',
            'status', 'donor_name', 'location', 'lat', 'lng',
            'invoice_number', 'invoice_pdf_url', 'payment_id',
        ]
    def get_invoice_pdf_url(self, obj):
        request = self.context.get('request')
        if obj.invoice_pdf and request:
            return request.build_absolute_uri(obj.invoice_pdf.url)
        return None 
    

         


class DonationRequestSerializer(serializers.ModelSerializer):
    donation_description = serializers.CharField(source='donation.description', read_only=True)
    donor_name = serializers.CharField(source='donation.donor.username', read_only=True)
    donation_type = serializers.CharField(source='donation.type', read_only=True)
    donation_amount = serializers.CharField(source='donation.amount', read_only=True)
    donation_quantity = serializers.CharField(source='donation.quantity', read_only=True)

    class Meta:
        model = DonationRequest
        fields = [
            'id',
            'status',
            'donation',

            # Added readable fields
            'donation_description',
            'donation_type',
            'donation_amount',
            'donation_quantity',
            'donor_name',
        ]
