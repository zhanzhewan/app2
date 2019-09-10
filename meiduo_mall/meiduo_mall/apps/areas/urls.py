from django.conf.urls import url
from . import views

urlpatterns = [
    url('^areas/$', views.AreaView.as_view()),
]
