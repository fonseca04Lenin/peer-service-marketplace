from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q

from .models import Service
from .serializers import ServiceSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def list_services(request):
    services = Service.objects.filter(is_active=True).select_related('provider').order_by('-created_at')

    category = request.query_params.get('category')
    if category:
        services = services.filter(category=category)

    keyword = request.query_params.get('q')
    if keyword:
        services = services.filter(
            Q(title__icontains=keyword) | Q(description__icontains=keyword)
        )

    provider_id = request.query_params.get('provider')
    if provider_id:
        services = services.filter(provider_id=provider_id)

    location = request.query_params.get('location')
    if location:
        services = services.filter(
            Q(service_area__icontains=location) | Q(is_remote=True)
        )

    serializer = ServiceSerializer(services, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def service_detail(request, pk):
    try:
        service = Service.objects.get(pk=pk, is_active=True)
    except Service.DoesNotExist:
        return Response({'error': 'Service not found.'}, status=status.HTTP_404_NOT_FOUND)

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
        return Response({'error': 'Service not found.'}, status=status.HTTP_404_NOT_FOUND)

    if service.provider != request.user:
        return Response({'error': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)

    service.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
