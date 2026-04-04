from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Service
from .serializers import ServiceSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def list_services(request):
    services = Service.objects.filter(is_active=True)

    category = request.query_params.get('category')
    if category:
        services = services.filter(category=category)

    keyword = request.query_params.get('q')
    if keyword:
        services = services.filter(title__icontains=keyword)

    serializer = ServiceSerializer(services, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def service_detail(request, pk):
    try:
        service = Service.objects.get(pk=pk, is_active=True)
    except Service.DoesNotExist:
        return Response({'error': 'Service not found.'}, status=status.HTTP_404_NOT_FOUND)

    return Response(ServiceSerializer(service).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_service(request):
    serializer = ServiceSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(provider=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
