from django.conf.urls import url
from . import views
import uuid

urlpatterns = [
    url('^image_codes/(?P<uuid>[\w-]+)/$', views.ImageCodeView.as_view()),
    url(r'^sms_codes/(?P<mobile>1[3-9]\d{9})/$', views.SmsCodeView.as_view()),
]
