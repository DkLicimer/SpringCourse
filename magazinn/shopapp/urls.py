from django.urls import path
from . import views

app_name = 'shopapp'

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register, name='register'),
    path('contact/', views.contact, name='contact'),

    path('men/', views.men_clothing, name='men_clothing'),
    path('women/', views.women_clothing, name='women_clothing'),

    path('product/', views.single, name='single'),
    path('checkout/', views.checkout, name='checkout'),
]
