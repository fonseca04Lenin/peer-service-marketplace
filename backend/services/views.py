import math

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q

from .models import Service
from .serializers import ServiceSerializer, annotate_ratings


def _filter_by_location(qs, user_lat, user_lng, location):
    if user_lat is not None and user_lng is not None:
        try:
            lat = float(user_lat)
            lng = float(user_lng)
            radius_km = 80
            lat_delta = radius_km / 111.0
            lng_delta = radius_km / (111.0 * max(abs(math.cos(math.radians(lat))), 1e-6))
            geo_q = (
                Q(
                    latitude__gte=lat - lat_delta,
                    latitude__lte=lat + lat_delta,
                    longitude__gte=lng - lng_delta,
                    longitude__lte=lng + lng_delta,
                )
                | Q(is_remote=True)
                | Q(latitude__isnull=True)
            )
            if location:
                geo_q |= Q(service_area__icontains=location)
            return qs.filter(geo_q)
        except (ValueError, TypeError):
            pass

    if location:
        return qs.filter(Q(service_area__icontains=location) | Q(is_remote=True))
    return qs


@api_view(['GET'])
@permission_classes([AllowAny])
def list_services(request):
    qs = (
        Service.objects
        .filter(is_active=True)
        .select_related('provider')
        .order_by('-created_at')
    )

    category = request.query_params.get('category')
    if category:
        qs = qs.filter(category=category)

    keyword = request.query_params.get('q')
    if keyword:
        qs = qs.filter(Q(title__icontains=keyword) | Q(description__icontains=keyword))

    provider_id = request.query_params.get('provider')
    if provider_id:
        qs = qs.filter(provider_id=provider_id)

    qs = _filter_by_location(
        qs,
        request.query_params.get('user_lat'),
        request.query_params.get('user_lng'),
        request.query_params.get('location'),
    )

    qs = annotate_ratings(qs)
    return Response(ServiceSerializer(qs, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def service_detail(request, pk):
    try:
        service = annotate_ratings(Service.objects.filter(pk=pk, is_active=True)).get()
    except Service.DoesNotExist:
        return Response({'detail': 'Service not found.'}, status=status.HTTP_404_NOT_FOUND)

    return Response(ServiceSerializer(service, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_service(request):
    serializer = ServiceSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save(provider=request.user)
        if request.user.role != 'provider':
            request.user.role = 'provider'
            request.user.save(update_fields=['role'])
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_service(request, pk):
    try:
        service = Service.objects.get(pk=pk)
    except Service.DoesNotExist:
        return Response({'detail': 'Service not found.'}, status=status.HTTP_404_NOT_FOUND)

    if service.provider != request.user:
        return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)

    service.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
