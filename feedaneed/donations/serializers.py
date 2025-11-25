from rest_framework import serializers
from .models import Donation, DonationRequest

class DonationSerializer(serializers.ModelSerializer):
    donor = serializers.StringRelatedField(read_only=True)
    invoice_pdf_url = serializers.SerializerMethodField()
 

    def get_invoice_pdf_url(self, obj):
        if obj.invoice_pdf:
            return obj.invoice_pdf.url
        return None

    
    class Meta:
        model = Donation
        fields =  [
            'id', 'type', 'description', 'quantity', 'amount',
            'status', 'donor', 'location', 'lat', 'lng',
            'invoice_number', 'invoice_pdf_url',
            'payment_id',
        ]
         


class DonationRequestSerializer(serializers.ModelSerializer):
    recipient = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = DonationRequest
        fields = '__all__'
        read_only_fields = ('recipient', 'created_at', 'status')
