from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from bookings.models import Booking
from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    http_method_names = ['get', 'post']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        provider_id = self.request.query_params.get('provider_id')
        if provider_id:
            return Review.objects.filter(
                booking__service__provider_id=provider_id
            ).select_related('reviewer', 'booking__service__provider', 'booking__service')

        user = self.request.user
        if not user.is_authenticated:
            return Review.objects.none()

        filter_type = self.request.query_params.get('filter', 'written')
        if filter_type == 'about':
            return Review.objects.filter(
                booking__service__provider=user
            ).select_related('reviewer', 'booking__service__provider', 'booking__service')

        return Review.objects.filter(
            reviewer=user
        ).select_related('reviewer', 'booking__service__provider', 'booking__service')

    def create(self, request, *args, **kwargs):
        booking_id = request.data.get('booking_id')
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')

        if not booking_id or not rating:
            return Response(
                {'error': 'booking_id and rating are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            booking = Booking.objects.select_related('service').get(
                id=booking_id,
                requester=request.user,
            )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if booking.status != 'completed':
            return Response(
                {'error': 'You can only review completed bookings.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(booking, 'review'):
            return Response(
                {'error': 'A review has already been submitted for this booking.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review = Review.objects.create(
            booking=booking,
            reviewer=request.user,
            rating=rating,
            comment=comment,
        )

        return Response(
            ReviewSerializer(review).data,
            status=status.HTTP_201_CREATED,
        )