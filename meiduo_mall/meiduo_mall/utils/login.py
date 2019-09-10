from django.contrib.auth.decorators import login_required
from django import views

class LoginRequiredMixin(object):
    @classmethod
    def as_view(cls, **kwargs):
        view = super().as_view(**kwargs)
        return login_required(view)
