from django.db import migrations


OMAHA_LAT = 41.2565
OMAHA_LNG = -95.9345

SEED_PROVIDERS = [
    {
        "username": "omaha_provider_1",
        "first_name": "Marcus",
        "last_name": "Hill",
        "email": "marcus.hill@example.com",
        "profile_picture": "profile_pictures/picture1.png",
        "city": "Omaha",
        "country": "United States",
        "role": "provider",
    },
    {
        "username": "omaha_provider_2",
        "first_name": "Danielle",
        "last_name": "Torres",
        "email": "danielle.torres@example.com",
        "profile_picture": "profile_pictures/picture2.png",
        "city": "Omaha",
        "country": "United States",
        "role": "provider",
    },
    {
        "username": "omaha_provider_3",
        "first_name": "Kevin",
        "last_name": "Osei",
        "email": "kevin.osei@example.com",
        "profile_picture": "profile_pictures/picture3.jpg",
        "city": "Omaha",
        "country": "United States",
        "role": "provider",
    },
    {
        "username": "omaha_provider_4",
        "first_name": "Sofia",
        "last_name": "Reyes",
        "email": "sofia.reyes@example.com",
        "profile_picture": "profile_pictures/picture4.jpg",
        "city": "Omaha",
        "country": "United States",
        "role": "provider",
    },
]

# All services use background.png as the hero banner image (shown in the detail view)
# provider_index maps each service to one of the 4 providers (0-based)
OMAHA_SERVICES = [
    {
        "provider_index": 0,
        "title": "Lawn Mowing & Yard Cleanup",
        "description": "Weekly or one-time lawn mowing, edging, and debris cleanup for Omaha residential properties. Serving Dundee, Midtown, and surrounding neighborhoods.",
        "category": "home_services",
        "price": "45.00",
        "rate_type": "flat",
        "service_area": "Omaha, NE",
        "is_remote": False,
        "image": "service_images/background.png",
    },
    {
        "provider_index": 0,
        "title": "Snow Removal – Driveway & Walkways",
        "description": "Reliable snow and ice removal for driveways, sidewalks, and steps throughout the Omaha metro. Available same-day during winter storms.",
        "category": "home_services",
        "price": "60.00",
        "rate_type": "flat",
        "service_area": "Omaha, NE",
        "is_remote": False,
        "image": "service_images/background.png",
    },
    {
        "provider_index": 1,
        "title": "Personal Training – Benson & Midtown",
        "description": "Certified personal trainer offering 1-on-1 fitness sessions at your home or a local Omaha gym. Specializing in strength and weight loss programs.",
        "category": "health_wellness",
        "price": "55.00",
        "rate_type": "hour",
        "service_area": "Omaha, NE",
        "is_remote": False,
        "image": "service_images/background.png",
    },
    {
        "provider_index": 1,
        "title": "ACT/SAT Tutoring – Omaha Students",
        "description": "Experienced tutor helping Omaha-area high school students prep for ACT and SAT. Proven strategies for boosting scores in math and reading.",
        "category": "education",
        "price": "50.00",
        "rate_type": "hour",
        "service_area": "Omaha, NE",
        "is_remote": False,
        "image": "service_images/background.png",
    },
    {
        "provider_index": 2,
        "title": "Home Painting – Interior & Exterior",
        "description": "Professional interior and exterior painting for Omaha homes. Clean work, quality materials, competitive rates. Free estimates in the metro area.",
        "category": "home_services",
        "price": "35.00",
        "rate_type": "hour",
        "service_area": "Omaha, NE",
        "is_remote": False,
        "image": "service_images/background.png",
    },
    {
        "provider_index": 2,
        "title": "Bookkeeping for Small Omaha Businesses",
        "description": "Part-time bookkeeping and QuickBooks support for small businesses in Omaha. Monthly reconciliation, invoicing, and expense tracking.",
        "category": "financial_services",
        "price": "40.00",
        "rate_type": "hour",
        "service_area": "Omaha, NE",
        "is_remote": True,
        "image": "service_images/background.png",
    },
    {
        "provider_index": 3,
        "title": "Photography – Events & Portraits",
        "description": "Omaha-based photographer available for family portraits, graduation sessions, and small events. Editing included, quick turnaround.",
        "category": "creative_services",
        "price": "150.00",
        "rate_type": "flat",
        "service_area": "Omaha, NE",
        "is_remote": False,
        "image": "service_images/background.png",
    },
    {
        "provider_index": 3,
        "title": "Web Development for Local Businesses",
        "description": "Building clean, mobile-friendly websites for Omaha small businesses and nonprofits. WordPress and React builds available.",
        "category": "tech_services",
        "price": "75.00",
        "rate_type": "hour",
        "service_area": "Omaha, NE",
        "is_remote": True,
        "image": "service_images/background.png",
    },
    {
        "provider_index": 0,
        "title": "Dog Walking – Aksarben & Dundee",
        "description": "Daily dog walking and pet check-ins for dogs of all sizes in the Aksarben, Dundee, and Midtown neighborhoods of Omaha.",
        "category": "other",
        "price": "20.00",
        "rate_type": "flat",
        "service_area": "Omaha, NE",
        "is_remote": False,
        "image": "service_images/background.png",
    },
    {
        "provider_index": 1,
        "title": "Resume & LinkedIn Writing",
        "description": "Professional resume writing and LinkedIn profile optimization tailored for the Omaha job market. IT, finance, and healthcare sectors welcome.",
        "category": "business_services",
        "price": "85.00",
        "rate_type": "flat",
        "service_area": "Omaha, NE",
        "is_remote": True,
        "image": "service_images/background.png",
    },
]


def seed_omaha_services(apps, schema_editor):
    User = apps.get_model("users", "User")
    Service = apps.get_model("services", "Service")

    providers = []
    for data in SEED_PROVIDERS:
        provider, _ = User.objects.get_or_create(
            username=data["username"],
            defaults={**data, "is_active": True},
        )
        providers.append(provider)

    for data in OMAHA_SERVICES:
        idx = data.pop("provider_index")
        Service.objects.get_or_create(
            provider=providers[idx],
            title=data["title"],
            defaults={
                **data,
                "latitude": OMAHA_LAT,
                "longitude": OMAHA_LNG,
                "is_active": True,
            },
        )
        data["provider_index"] = idx  # restore for idempotency


def unseed_omaha_services(apps, schema_editor):
    User = apps.get_model("users", "User")
    Service = apps.get_model("services", "Service")
    for p_data in SEED_PROVIDERS:
        try:
            provider = User.objects.get(username=p_data["username"])
            Service.objects.filter(provider=provider).delete()
            provider.delete()
        except User.DoesNotExist:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0005_add_rate_type_to_service"),
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(migrations.RunPython.noop, reverse_code=migrations.RunPython.noop),
    ]
