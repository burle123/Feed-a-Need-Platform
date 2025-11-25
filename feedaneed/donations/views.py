from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
import time

from .models import Donation, DonationRequest
from .serializers import DonationSerializer, DonationRequestSerializer


class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.all()
    serializer_class = DonationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'donor':
            return Donation.objects.filter(donor=user).order_by('-created_at')

        if user.role == 'recipient':
            return Donation.objects.filter(status='approved').order_by('-created_at')

        return Donation.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(donor=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        donation = self.get_object()
        donation.status = 'approved'
        donation.approved_at = timezone.now()
        donation.invoice_number = f"INV-{int(time.time())}"
        donation.save()

        return Response({
            'message': 'Donation approved',
            'invoice': donation.invoice_number
        })


class DonationRequestViewSet(viewsets.ModelViewSet):
    queryset = DonationRequest.objects.all()
    serializer_class = DonationRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'recipient':
            return DonationRequest.objects.filter(recipient=user)

        if user.role == 'donor':
            return DonationRequest.objects.filter(donation__donor=user)

        return DonationRequest.objects.all()

    def perform_create(self, serializer):
        serializer.save(recipient=self.request.user)
