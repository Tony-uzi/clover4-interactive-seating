from django.urls import path
from .views_auth import login

urlpatterns = [
    path('auth/login/', login, name='login'),
]

from .views_auth import login, signup
urlpatterns += [
    path('auth/register/', signup, name='signup'),
]