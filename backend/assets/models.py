from django.db import models
from django.core.validators import FileExtensionValidator, MinValueValidator
from django.contrib.auth import get_user_model
import os
import uuid
import qrcode
from io import BytesIO
from django.core.files import File
from PIL import Image, ImageDraw
from django.conf import settings
import hashlib

User = get_user_model()

def asset_image_path(instance, filename):
    """Generate file path for new asset image"""
    ext = filename.split('.')[-1]
    filename = f"{instance.asset_code}_image.{ext}"
    return os.path.join('assets/images', filename)

def asset_invoice_path(instance, filename):
    """Generate file path for invoice PDF"""
    ext = filename.split('.')[-1]
    filename = f"{instance.asset_code}_invoice.{ext}"
    return os.path.join('assets/invoices', filename)

def asset_qr_path(instance, filename):
    """Generate file path for QR code"""
    return os.path.join('assets/qrcodes', f"{instance.asset_code}_qr.png")

class Category(models.Model):
    """Asset categories for better organization"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Asset(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        ASSIGNED = 'ASSIGNED', 'Assigned'
        UNDER_REPAIR = 'UNDER_REPAIR', 'Under Repair'
        DAMAGED = 'DAMAGED', 'Damaged'
        RETIRED = 'RETIRED', 'Retired'
        RETURN_REQUESTED = 'RETURN_REQUESTED', 'Return Requested'
    
    # Basic Information
    asset_code = models.CharField(max_length=50, unique=True, editable=False)
    name = models.CharField(max_length=200)
    serial_number = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='assets')
    description = models.TextField(blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE
    )
    
    # Purchase Information
    purchase_date = models.DateField(null=True, blank=True)
    purchase_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)]
    )
    warranty_expiry = models.DateField(null=True, blank=True)
    vendor = models.CharField(max_length=200, blank=True)
    
    # File Uploads - Local Storage
    image = models.ImageField(
        upload_to=asset_image_path,
        null=True,
        blank=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'gif'])]
    )
    invoice = models.FileField(
        upload_to=asset_invoice_path,
        null=True,
        blank=True,
        validators=[FileExtensionValidator(['pdf'])]
    )
    
    # QR Code Field
    qr_code = models.ImageField(
        upload_to=asset_qr_path,
        null=True,
        blank=True,
        editable=False  # Not editable in admin
    )
    
    # QR Metadata
    qr_scan_count = models.IntegerField(default=0, editable=False)
    last_scanned = models.DateTimeField(null=True, blank=True, editable=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='assets_created'
    )
    
    # Soft Delete
    is_active = models.BooleanField(default=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['asset_code']),
            models.Index(fields=['serial_number']),
            models.Index(fields=['status']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.asset_code} - {self.name}"
    
    def save(self, *args, **kwargs):
        # Generate asset code if not exists
        if not self.asset_code:
            self.asset_code = self.generate_asset_code()
        
        # Check if this is a new asset or asset_code changed
        is_new = not self.pk
        
        # Save first to get an ID if needed
        super().save(*args, **kwargs)
        
        # Generate QR code for new assets or if QR doesn't exist
        if is_new or not self.qr_code:
            self.generate_qr_code()
            # Save again with QR code
            super().save(update_fields=['qr_code'])
    
    def generate_asset_code(self):
        """Generate a unique asset code"""
        import random
        import string
        
        # Format: AST-YYYY-XXXXX
        year = self.purchase_date.year if self.purchase_date else '0000'
        year_prefix = f"AST-{year}"
        
        # Generate random alphanumeric
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        
        # Check uniqueness
        code = f"{year_prefix}-{random_part}"
        
        # Ensure uniqueness
        while Asset.objects.filter(asset_code=code).exists():
            random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
            code = f"{year_prefix}-{random_part}"
        
        return code
    
    def generate_qr_code(self):
        """Generate QR code for the asset"""
        # Create QR code instance
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        
        # Data to encode in QR - URL to asset detail page
        # Using frontend URL (adjust in production)
        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        qr_data = f"{base_url}/assets/{self.id}"
        
        # Add the data
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        # Create QR code image
        qr_image = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to PIL Image for enhancement
        qr_image = qr_image.convert('RGB')
        
        # Add a border with asset info (optional)
        img_with_border = self.add_info_to_qr(qr_image)
        
        # Save to BytesIO
        buffer = BytesIO()
        img_with_border.save(buffer, format='PNG', quality=90)
        buffer.seek(0)
        
        # Save to ImageField
        filename = f"{self.asset_code}_qr.png"
        self.qr_code.save(filename, File(buffer), save=False)
        
        return True
    
    def add_info_to_qr(self, qr_image):
        """Add asset information border around QR code (optional)"""
        # This creates a more professional QR with asset info
        width, height = qr_image.size
        new_height = height + 40  # Add space for text
        
        # Create new image with white background
        new_img = Image.new('RGB', (width, new_height), 'white')
        
        # Paste QR code
        new_img.paste(qr_image, (0, 0))
        
        # Add text (asset code and name)
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(new_img)
        
        # Try to use a font, fallback to default
        try:
            font = ImageFont.truetype("arial.ttf", 12)
        except:
            font = ImageFont.load_default()
        
        # Add asset code text
        text = f"{self.asset_code}"
        text_width = draw.textlength(text, font=font)
        text_x = (width - text_width) // 2
        draw.text((text_x, height + 10), text, fill='black', font=font)
        
        # Add asset name (truncated if too long)
        name_text = self.name[:30] + "..." if len(self.name) > 30 else self.name
        name_width = draw.textlength(name_text, font=font)
        name_x = (width - name_width) // 2
        draw.text((name_x, height + 25), name_text, fill='gray', font=font)
        
        return new_img
    
    def regenerate_qr_code(self):
        """Force regenerate QR code"""
        # Delete old QR file if exists
        if self.qr_code:
            self.qr_code.delete(save=False)
        
        # Generate new QR
        self.generate_qr_code()
        self.save(update_fields=['qr_code'])
    
    def get_qr_url(self):
        """Get absolute URL for QR code"""
        if self.qr_code:
            return self.qr_code.url
        return None
    
    def increment_scan_count(self):
        """Increment scan counter"""
        from django.utils import timezone
        self.qr_scan_count += 1
        self.last_scanned = timezone.now()
        self.save(update_fields=['qr_scan_count', 'last_scanned'])
    
    def soft_delete(self):
        """Soft delete the asset"""
        self.is_active = False
        from django.utils import timezone
        self.deleted_at = timezone.now()
        self.save()
    
    def restore(self):
        """Restore soft-deleted asset"""
        self.is_active = True
        self.deleted_at = None
        self.save()