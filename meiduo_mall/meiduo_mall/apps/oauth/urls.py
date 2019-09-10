from django.conf.urls import url
from . import views

urlpatterns = [
    url('^qq/login/$', views.OAuthQQURLView.as_view()),
    url('^oauth_callback$', views.OAuthQQOpenidView.as_view()),
]
