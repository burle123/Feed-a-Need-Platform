from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
import razorpay
from urllib3 import request
from .models import Payment
from donations.models import Donation
import hmac, hashlib
from donations.utils import generate_invoice_pdf
import uuid


# initialize razorpay client with secret from settings
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    """
    Request payload: { "amount": 100.50, "donation_id": optional }
    Returns: order dict from razorpay (id, amount, currency, etc.)
    """
    # --------------------------
# DEMO ORDER (No Razorpay)
# --------------------------
    amount = request.data.get("amount")
    donation_id = request.data.get("donation_id")

    return Response({
    "order": {
        "id": "demo_order",
        "amount": int(amount) * 100,  # keep Razorpay format
        "currency": "INR"
    }
})




    # data = request.data
    # try:
    #     amount = float(data.get('amount', 0))
    # except (TypeError, ValueError):
    #     return Response({'error': 'Invalid amount'}, status=400)

    # if amount <= 0:
    #     return Response({'error': 'Amount must be > 0'}, status=400)

    # amount_paise = int(amount * 100)  # razorpay expects integer paise
    # try:
    #     order = client.order.create({
    #         'amount': amount_paise,
    #         'currency': 'INR',
    #         'payment_capture': 1
    #     })
    # except Exception as e:
    #     return Response({'error': 'Razorpay order creation failed', 'details': str(e)}, status=500)

    # # optionally attach order_id to Donation on server if donation_id present
    # donation_id = data.get('donation_id')
    # if donation_id:
    #     try:
    #         donation = Donation.objects.get(pk=donation_id)
    #         # temporarily store order id in donation.payment_id or custom field if you want
    #         donation.payment_id = order.get('id')
    #         donation.save()
    #     except Donation.DoesNotExist:
    #         pass

    # return Response({'order': order})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """
    Handles DEMO payments (no Razorpay) AND real payments.
    Also generates invoice PDF after payment success.
    """

    # --------------------------
    # DEMO PAYMENT (NO RAZORPAY)
    # --------------------------
    if request.data.get("razorpay_payment_id") == "demo_payment":
        donation_id = request.data.get("donation_id")
        amount = request.data.get("amount")

        try:
            donation = Donation.objects.get(id=donation_id)
        except Donation.DoesNotExist:
            return Response({"error": "Donation not found"}, status=400)

        donation.payment_id = "DEMO_PAYMENT"
        donation.status = "paid"
        donation.amount = amount
        donation.save()

        
        pdf_path = generate_invoice_pdf(donation)
        donation.invoice_pdf = pdf_path
        donation.save()

        # -------- Generate Invoice PDF --------
        invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
        pdf_path = generate_invoice_pdf(donation, invoice_number)

        donation.invoice_pdf = pdf_path
        donation.invoice_number = invoice_number
        donation.save()

        return Response({
            "message": "Demo Payment Successful",
            "payment_id": "DEMO_PAYMENT",
            "invoice_pdf_url": donation.invoice_pdf.url if donation.invoice_pdf else None,
            "invoice_number": invoice_number
        })

    # --------------------------
    # REAL RAZORPAY PAYMENT FLOW
    # --------------------------
    payload = request.data
    order_id = payload.get('razorpay_order_id')
    payment_id = payload.get('razorpay_payment_id')
    signature = payload.get('razorpay_signature')
    donation_id = payload.get('donation_id')
    amount = payload.get('amount')

    if not order_id or not payment_id or not signature:
        return Response({'error': 'Missing parameters'}, status=400)

    # verify signature
    generated_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{order_id}|{payment_id}".encode(),
        hashlib.sha256
    ).hexdigest()

    if generated_signature != signature:
        return Response({'error': 'Signature verification failed'}, status=400)

    # save successful payment
    payment = Payment.objects.create(
        user=request.user,
        amount=amount or 0,
        razorpay_payment_id=payment_id,
        razorpay_order_id=order_id,
        razorpay_signature=signature
    )

    # link donation
    donation = Donation.objects.get(id=donation_id)
    donation.payment_id = payment_id
    donation.status = "paid"
    donation.amount = amount
    donation.save()

    # -------- Generate Invoice PDF --------
    invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
    pdf_path = generate_invoice_pdf(donation, invoice_number)

    donation.invoice_pdf = pdf_path
    donation.invoice_number = invoice_number
    donation.save()

    return Response({
        "status": "ok",
        "payment_id": payment.razorpay_payment_id,
        "invoice_pdf_url": donation.invoice_pdf.url if donation.invoice_pdf else None,
        "invoice_number": invoice_number
    })
