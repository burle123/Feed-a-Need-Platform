from django.shortcuts import render
from django.conf import settings

def home(request):
    return render(request, "aa.html", {
        "RAZORPAY_KEY_ID": settings.RAZORPAY_KEY_ID
    })
