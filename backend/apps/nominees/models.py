"""
Nominees app — Nominee records linked to members.
"""

from django.db import models


class Nominee(models.Model):
    RELATIONSHIP_CHOICES = [
        ('spouse', 'Spouse'), ('son', 'Son'), ('daughter', 'Daughter'),
        ('father', 'Father'), ('mother', 'Mother'), ('brother', 'Brother'),
        ('sister', 'Sister'), ('other', 'Other'),
    ]
    ID_TYPES = [
        ('aadhaar', 'Aadhaar'), ('pan', 'PAN'),
        ('voter', 'Voter ID'), ('passport', 'Passport'), ('other', 'Other'),
    ]

    member = models.ForeignKey(
        'members.Member',
        on_delete=models.CASCADE,
        related_name='nominees',
    )
    name = models.CharField(max_length=150)
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    id_type = models.CharField(max_length=20, choices=ID_TYPES, blank=True)
    id_number = models.CharField(max_length=50, blank=True)
    share_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_primary', 'name']
        db_table = 'nominees_nominee'

    def __str__(self):
        return f"{self.name} ({self.get_relationship_display()}) — {self.member.member_no}"
