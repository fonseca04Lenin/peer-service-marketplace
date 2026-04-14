from django.urls import path
from . import views

urlpatterns = [
    path('',             views.conversation_list),
    path('<int:user_id>/', views.conversation_detail),
]
