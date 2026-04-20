from django.urls import path
from . import views

urlpatterns = [
    path('',          views.list_services,  name='list-services'),
    path('create/',   views.create_service, name='create-service'),
    path('<int:pk>/', views.service_detail, name='service-detail'),
    path('<int:pk>/delete/', views.delete_service, name='delete-service'),
    path('<int:pk>/update/', views.update_service, name='update-service'),
]