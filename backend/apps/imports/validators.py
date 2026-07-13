"""
Import validators for Excel data.
"""

import re
from datetime import datetime


def parse_date(value, fmt='%d/%m/%Y'):
    """Parse a date string; return None on failure."""
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date()
    try:
        return datetime.strptime(str(value).strip(), fmt).date()
    except ValueError:
        return None


def validate_member_row(row, row_num, existing_member_nos):
    """
    Validate a single member row from Excel import.
    Returns (cleaned_data, errors_list).
    """
    errors = []
    data = {}

    member_no = str(row.get('member_no', '')).strip()
    if not member_no:
        errors.append(f"Row {row_num}: member_no is required.")
    elif member_no in existing_member_nos:
        errors.append(f"Row {row_num}: member_no '{member_no}' already exists in database.")
    else:
        data['member_no'] = member_no

    full_name = str(row.get('full_name', '')).strip()
    if not full_name:
        errors.append(f"Row {row_num}: full_name is required.")
    else:
        data['full_name'] = full_name

    data['full_name_ml'] = str(row.get('full_name_ml', '')).strip()

    gender = str(row.get('gender', '')).strip().upper()
    if gender not in ('M', 'F', 'O'):
        errors.append(f"Row {row_num}: gender must be M, F, or O. Got: '{gender}'")
    else:
        data['gender'] = gender

    phone = re.sub(r'\D', '', str(row.get('phone', '')).strip())
    if not phone or len(phone) != 10:
        errors.append(f"Row {row_num}: phone must be 10 digits. Got: '{phone}'")
    else:
        data['phone'] = phone

    data['alternate_phone'] = str(row.get('alternate_phone', '')).strip()
    data['email'] = str(row.get('email', '')).strip()
    data['address'] = str(row.get('address', '')).strip() or 'Not provided'
    data['ward'] = str(row.get('ward', '')).strip()
    data['panchayat'] = str(row.get('panchayat', '')).strip()
    data['district'] = str(row.get('district', '')).strip() or 'Kannur'
    data['pin_code'] = str(row.get('pin_code', '')).strip()

    aadhaar = str(row.get('aadhaar_number', '')).strip()
    if aadhaar and not re.fullmatch(r'\d{12}', aadhaar):
        errors.append(f"Row {row_num}: aadhaar_number must be 12 digits. Got: '{aadhaar}'")
    else:
        data['aadhaar_number'] = aadhaar

    pan = str(row.get('pan_number', '')).strip().upper()
    if pan and not re.fullmatch(r'[A-Z]{5}[0-9]{4}[A-Z]{1}', pan):
        errors.append(f"Row {row_num}: pan_number format invalid. Got: '{pan}'")
    else:
        data['pan_number'] = pan

    membership_type = str(row.get('membership_type', 'regular')).strip().lower()
    if membership_type not in ('regular', 'associate', 'honorary'):
        errors.append(f"Row {row_num}: membership_type must be regular/associate/honorary. Got: '{membership_type}'")
    else:
        data['membership_type'] = membership_type

    joining_date = parse_date(row.get('joining_date'))
    if not joining_date:
        errors.append(f"Row {row_num}: joining_date is required and must be DD/MM/YYYY.")
    else:
        from django.utils import timezone
        if joining_date > timezone.localdate():
            errors.append(f"Row {row_num}: joining_date cannot be in the future.")
        else:
            data['joining_date'] = joining_date

    dob = parse_date(row.get('date_of_birth'))
    data['date_of_birth'] = dob  # optional

    # Parse and validate masavari_paid_till (supports DD/MM/YYYY, MM/YYYY, and different casings)
    paid_till_raw = row.get('masavari_paid_till') or row.get('Masavari Paid Till') or row.get('massavari paid till') or row.get('Masavari Paid Till (DD/MM/YYYY)')
    paid_till = None
    if paid_till_raw:
        paid_till_str = str(paid_till_raw).strip()
        if paid_till_str:
            paid_till = parse_date(paid_till_str)
            if not paid_till:
                # Try parsing MM/YYYY
                try:
                    parts = paid_till_str.split('/')
                    if len(parts) == 2:
                        month = int(parts[0])
                        year = int(parts[1])
                        from datetime import date
                        paid_till = date(year, month, 1)
                except ValueError:
                    pass
            if not paid_till:
                errors.append(f"Row {row_num}: masavari_paid_till format invalid. Must be DD/MM/YYYY or MM/YYYY. Got: '{paid_till_raw}'")
            elif joining_date and paid_till < joining_date:
                errors.append(f"Row {row_num}: masavari_paid_till cannot be before joining_date.")
            else:
                data['masavari_paid_till'] = paid_till

    data['remarks'] = str(row.get('remarks', '')).strip()

    return data, errors
