from django.conf.urls import url
from . import views
from django.contrib.auth.decorators import login_required

urlpatterns = [
    url('^register/$', views.RegisterView.as_view()),
    url(r'^usernames/(?P<username>[a-zA-Z0-9_-]{5,20})/count/$', views.UsernameCountView.as_view()),
    url(r'^mobiles/(?P<mobile>1[345789]\d{9})/count/$', views.MobileCountView.as_view()),
    url('^login/$', views.LoginView.as_view()),
    url('^logout/$', views.LogoutView.as_view()),
    url('^info/$', views.UserCenterInfoView.as_view()),
    # url('^info/$', login_required(views.UserCenterInfoView.as_view())),
    url('^emails/$', views.EmailView.as_view()),
    url('^emails/verification/$', views.EmailActiveView.as_view()),
    url('^addresses/$', views.AddressView.as_view()),
    url('^addresses/create/$', views.AddressCreateView.as_view()),
    url('^addresses/(?P<address_id>\d+)/$', views.AddressEditView.as_view()),
    url('^addresses/(?P<address_id>\d+)/default/$', views.AddressDefaultView.as_view()),
    url('^addresses/(?P<address_id>\d+)/title/$', views.AddressTitleView.as_view()),
    url('^password/$', views.PwdView.as_view()),
]
