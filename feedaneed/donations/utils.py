from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import mm
import os
from django.conf import settings

def generate_invoice_pdf(donation):
    """
    Generates professional invoice and returns file path.
    """

    # Directory to store invoices
    invoice_dir = os.path.join(settings.MEDIA_ROOT, "invoices")
    os.makedirs(invoice_dir, exist_ok=True)

    file_name = f"invoice_{donation.id}.pdf"
    file_path = os.path.join(invoice_dir, file_name)

    c = canvas.Canvas(file_path, pagesize=A4)
    width, height = A4

    # Header
    c.setFillColor(colors.HexColor("#0A7E8C"))
    c.rect(0, height - 80, width, 80, fill=True, stroke=False)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(30, height - 50, "FEED A NEED – INVOICE")

    # Body
    y = height - 130
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(30, y, "Invoice Details")
    y -= 20

    c.setFont("Helvetica", 12)
    c.drawString(30, y, f"Invoice No: INV-{donation.id:06d}")
    y -= 20
    c.drawString(30, y, f"Donor Name: {donation.donor.first_name}")
    y -= 20
    c.drawString(30, y, f"Donation Type: {donation.type}")
    y -= 20
    c.drawString(30, y, f"Amount: ₹{donation.amount}")
    y -= 20
    c.drawString(30, y, f"Payment ID: {donation.payment_id}")
    y -= 20
    c.drawString(30, y, f"Status: {donation.status}")
    y -= 40

    c.setFont("Helvetica-Oblique", 10)
    c.drawString(30, y, "Thank you for making a difference.")

    c.save()
    return f"invoices/{file_name}"
