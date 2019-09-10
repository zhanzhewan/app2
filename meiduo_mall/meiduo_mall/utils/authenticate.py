from django.contrib.auth.backends import ModelBackend
import re
from users.models import User


class MeiduoModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        # 变量username的值，可以是用户名，也可以是手机号，需要判断，再查询
        try:
            # if re.match(r'^1[3-9]\d{9}$', username):
            #     user = User.objects.get(mobile=username)
            # else:
            #     user = User.objects.get(username=username)
            user = User.objects.get(username=username)
        except:
            # 如果未查到数据，则返回None，用于后续判断
            try:
                user = User.objects.get(mobile=username)
            except:
                return None
                # return None

        # 判断密码
        if user.check_password(password):
            return user
        else:
            return None
