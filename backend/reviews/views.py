from rest_framework import viewsets, permissions
from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        filter_type = self.request.query_params.get('filter', 'written')

        if filter_type == 'about':
            return Review.objects.filter(
                booking__service__provider=user
            ).select_related('reviewer', 'booking__service__provider', 'booking__service')

        return Review.objects.filter(
            reviewer=user
        ).select_related('reviewer', 'booking__service__provider', 'booking__service')