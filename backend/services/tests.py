from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from users.models import User
from services.models import Service
from bookings.models import Booking
from reviews.models import Review
from services.serializers import annotate_ratings


def make_user(username, role="requester"):
    return User.objects.create_user(
        username=username,
        password="pass",
        first_name="A",
        last_name="B",
        city="NYC",
        country="US",
        role=role,
    )


def make_service(provider, title="Test Service", is_remote=True, lat=None, lng=None, area=""):
    return Service.objects.create(
        provider=provider,
        title=title,
        description="desc",
        category="tech_services",
        price="50.00",
        is_remote=is_remote,
        latitude=lat,
        longitude=lng,
        service_area=area,
    )


class AnnotateRatingsTest(TestCase):
    def setUp(self):
        self.provider = make_user("provider1", role="provider")
        self.client_user = make_user("client1")
        from django.utils import timezone
        self.service = make_service(self.provider)
        self.booking = Booking.objects.create(
            service=self.service,
            requester=self.client_user,
            scheduled_at=timezone.now(),
            status="completed",
        )

    def test_no_reviews_returns_none_and_zero(self):
        qs = annotate_ratings(Service.objects.filter(pk=self.service.pk))
        obj = qs.get()
        self.assertIsNone(obj._avg_rating)
        self.assertEqual(obj._review_count, 0)

    def test_with_review_returns_correct_values(self):
        Review.objects.create(booking=self.booking, reviewer=self.client_user, rating=4)
        qs = annotate_ratings(Service.objects.filter(pk=self.service.pk))
        obj = qs.get()
        self.assertAlmostEqual(obj._avg_rating, 4.0)
        self.assertEqual(obj._review_count, 1)

    def test_multiple_reviews_average(self):
        client2 = make_user("client2")
        from django.utils import timezone
        b2 = Booking.objects.create(
            service=self.service,
            requester=client2,
            scheduled_at=timezone.now(),
            status="completed",
        )
        Review.objects.create(booking=self.booking, reviewer=self.client_user, rating=4)
        Review.objects.create(booking=b2, reviewer=client2, rating=2)
        qs = annotate_ratings(Service.objects.filter(pk=self.service.pk))
        obj = qs.get()
        self.assertAlmostEqual(obj._avg_rating, 3.0)
        self.assertEqual(obj._review_count, 2)

    def test_no_extra_queries_for_multiple_services(self):
        make_service(self.provider, title="Service 2")
        make_service(self.provider, title="Service 3")
        Review.objects.create(booking=self.booking, reviewer=self.client_user, rating=5)
        with self.assertNumQueries(1):
            list(annotate_ratings(Service.objects.all()))


class ListServicesViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.provider = make_user("prov", role="provider")
        self.svc = make_service(self.provider)

    def test_list_returns_200(self):
        res = self.client.get("/api/services/")
        self.assertEqual(res.status_code, 200)

    def test_list_includes_rating_fields(self):
        res = self.client.get("/api/services/")
        data = res.json()
        self.assertTrue(len(data) > 0)
        item = data[0]
        self.assertIn("average_rating", item)
        self.assertIn("review_count", item)

    def test_filter_by_category(self):
        make_service(self.provider, title="Other", is_remote=True)
        Service.objects.filter(title="Other").update(category="home_services")
        res = self.client.get("/api/services/?category=tech_services")
        titles = [s["title"] for s in res.json()]
        self.assertIn("Test Service", titles)
        self.assertNotIn("Other", titles)

    def test_filter_by_keyword(self):
        make_service(self.provider, title="Unique Keyword Service")
        res = self.client.get("/api/services/?q=Unique+Keyword")
        titles = [s["title"] for s in res.json()]
        self.assertIn("Unique Keyword Service", titles)
        self.assertNotIn("Test Service", titles)

    def test_inactive_services_excluded(self):
        self.svc.is_active = False
        self.svc.save()
        res = self.client.get("/api/services/")
        self.assertEqual(len(res.json()), 0)


class ServiceDetailViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.provider = make_user("prov2", role="provider")
        self.svc = make_service(self.provider)

    def test_detail_returns_200(self):
        res = self.client.get(f"/api/services/{self.svc.pk}/")
        self.assertEqual(res.status_code, 200)

    def test_detail_404_uses_detail_key(self):
        res = self.client.get("/api/services/99999/")
        self.assertEqual(res.status_code, 404)
        self.assertIn("detail", res.json())
        self.assertNotIn("error", res.json())

    def test_detail_includes_rating_annotations(self):
        res = self.client.get(f"/api/services/{self.svc.pk}/")
        data = res.json()
        self.assertIn("average_rating", data)
        self.assertIn("review_count", data)


class LocationFilterTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.provider = make_user("prov3", role="provider")
        self.local_svc = make_service(
            self.provider, title="Local Service",
            is_remote=False, lat=40.7128, lng=-74.0060, area="New York"
        )
        self.remote_svc = make_service(self.provider, title="Remote Service", is_remote=True)
        self.far_svc = make_service(
            self.provider, title="Far Service",
            is_remote=False, lat=51.5074, lng=-0.1278, area="London"
        )

    def test_nearby_and_remote_included(self):
        res = self.client.get("/api/services/?user_lat=40.71&user_lng=-74.00")
        titles = [s["title"] for s in res.json()]
        self.assertIn("Local Service", titles)
        self.assertIn("Remote Service", titles)

    def test_far_service_excluded(self):
        res = self.client.get("/api/services/?user_lat=40.71&user_lng=-74.00")
        titles = [s["title"] for s in res.json()]
        self.assertNotIn("Far Service", titles)

    def test_location_text_filter(self):
        res = self.client.get("/api/services/?location=London")
        titles = [s["title"] for s in res.json()]
        self.assertIn("Far Service", titles)
        self.assertIn("Remote Service", titles)
        self.assertNotIn("Local Service", titles)

    def test_invalid_coords_falls_back_to_location_text(self):
        res = self.client.get("/api/services/?user_lat=notanumber&user_lng=bad&location=New+York")
        titles = [s["title"] for s in res.json()]
        self.assertIn("Local Service", titles)


class DeleteServiceViewTest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.provider = make_user("prov4", role="provider")
        self.other = make_user("other4")
        self.svc = make_service(self.provider)

    def test_owner_can_delete(self):
        self.api.force_authenticate(user=self.provider)
        res = self.api.delete(f"/api/services/{self.svc.pk}/delete/")
        self.assertEqual(res.status_code, 204)

    def test_non_owner_gets_403_with_detail_key(self):
        self.api.force_authenticate(user=self.other)
        res = self.api.delete(f"/api/services/{self.svc.pk}/delete/")
        self.assertEqual(res.status_code, 403)
        self.assertIn("detail", res.json())

    def test_missing_service_returns_detail_key(self):
        self.api.force_authenticate(user=self.provider)
        res = self.api.delete("/api/services/99999/delete/")
        self.assertEqual(res.status_code, 404)
        self.assertIn("detail", res.json())
