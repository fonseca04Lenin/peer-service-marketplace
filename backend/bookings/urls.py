from django.urls import path

from . import views

urlpatterns = [
    path('', views.booking_list_create, name='bookings-list-create'),
    path('<int:pk>/', views.booking_detail, name='booking-detail'),
]
