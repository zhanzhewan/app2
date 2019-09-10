from django.conf import settings
from django.core.mail import send_mail
from django.shortcuts import render, redirect
from django.views import View
from django import http
import re
from .models import User, Address
from django.contrib.auth import login, logout
from meiduo_mall.utils.response_code import RETCODE
from django_redis import get_redis_connection
from django.contrib.auth import authenticate
from . import constants
from meiduo_mall.utils.login import LoginRequiredMixin
import json
from celery_tasks.email_active.tasks import send_active_mail
from meiduo_mall.utils import meiduo_signature


class RegisterView(View):
    def get(self, request):
        return render(request, 'register.html')

    def post(self, request):
        # 接收
        username = request.POST.get('user_name')
        password = request.POST.get('pwd')
        password2 = request.POST.get('cpwd')
        mobile = request.POST.get('phone')
        sms_code = request.POST.get('msg_code')
        allow = request.POST.get('allow')

        # 验证
        # 1.非空
        if not all([username, password, password2, mobile, sms_code, allow]):
            return http.HttpResponseForbidden('填写数据不完整')
        # 2.用户名
        if not re.match('^[a-zA-Z0-9_-]{5,20}$', username):
            return http.HttpResponseForbidden('用户名为5-20个字符')
        if User.objects.filter(username=username).count() > 0:
            return http.HttpResponseForbidden('用户名已经存在')
        # 密码
        if not re.match('^[0-9A-Za-z]{8,20}$', password):
            return http.HttpResponseForbidden('密码为8-20个字符')
        # 确认密码
        if password != password2:
            return http.HttpResponseForbidden('两个密码不一致')
        # 手机号
        if not re.match('^1[3456789]\d{9}$', mobile):
            return http.HttpResponseForbidden('手机号错误')
        if User.objects.filter(mobile=mobile).count() > 0:
            return http.HttpResponseForbidden('手机号存在')
        # 短信验证码
        # 1.读取redis中的短信验证码
        redis_cli = get_redis_connection('sms_code')
        sms_code_redis = redis_cli.get(mobile)
        # 2.判断是否过期
        if sms_code_redis is None:
            return http.HttpResponseForbidden('短信验证码已经过期')
        # 3.删除短信验证码，不可以使用第二次
        redis_cli.delete(mobile)
        redis_cli.delete(mobile + '_flag')
        # 4.判断是否正确
        if sms_code_redis.decode() != sms_code:
            return http.HttpResponseForbidden('短信验证码错误')

        # 处理
        # 1.创建用户对象
        user = User.objects.create_user(
            username=username,
            password=password,
            mobile=mobile
        )
        # 2.状态保持
        login(request, user)

        # 响应
        return redirect('/')


class UsernameCountView(View):
    def get(self, request, username):
        # 接收：通过路由在路径中提取
        # 验证：路由的正则表达式
        # 处理：判断用户名是否存在
        count = User.objects.filter(username=username).count()
        # 响应：提示是否存在
        return http.JsonResponse({
            'count': count,
            'code': RETCODE.OK,
            'errmsg': 'OK'
        })


class MobileCountView(View):
    def get(self, request, mobile):
        # 接收
        # 验证
        # 处理：判断手机号是否存在
        count = User.objects.filter(mobile=mobile).count()
        # 响应：提示是否存在
        return http.JsonResponse({
            'count': count,
            'code': RETCODE.OK,
            'errmsg': "OK"
        })


class LoginView(View):
    def get(self, request):
        return render(request, 'login.html')

    def post(self, request):
        # 接收
        username = request.POST.get('username')
        pwd = request.POST.get('pwd')
        next_url = request.GET.get('next', '/')

        # 验证：根据用户名查询，找到对象后再对比密码
        '''
        user=User.objects.get(username=username)
        user.password==加密(pwd)===>user.check_password(pwd)
        '''
        user = authenticate(request, username=username, password=pwd)
        if user is None:
            # 用户名或密码错误
            return http.HttpResponseForbidden('用户名或密码错误')
        else:
            # 用户名和密码正确
            login(request, user)

            # 向cookie中写用户名，用于客户端显示
            response = redirect(next_url)
            response.set_cookie('username', username, max_age=constants.USERNAME_COOKIE_EXPIRES)

            return response


class LogoutView(View):
    def get(self, request):
        # 删除状态保持
        logout(request)

        # 删除cookie中的username
        response = redirect('/login/')
        response.delete_cookie('username')

        return response


class UserCenterInfoView(LoginRequiredMixin, View):
    def get(self, request):
        # if request.user.is_authenticated:
        #     return render(request, 'user_center_info.html')
        # else:
        #     return redirect('/login/')

        return render(request, 'user_center_info.html')


class EmailView(LoginRequiredMixin, View):
    def put(self, request):
        # 接收
        json_dict = json.loads(request.body.decode())
        email = json_dict.get('email')

        # 验证
        if not all([email]):
            return http.JsonResponse({'code': RETCODE.EMAILERR, 'errmsg': "邮箱无效"})
        if not re.match(r'^[a-z0-9][\w\.\-]*@[a-z0-9\-]+(\.[a-z]{2,5}){1,2}$', email):
            return http.JsonResponse({'code': RETCODE.EMAILERR, 'errmsg': "邮箱格式错误"})

        # 处理：修改当前登录用户的邮箱属性
        user = request.user
        user.email = email
        user.save()

        # 发邮件：耗时代码，使用celery异步
        # send_mail('美多商城-邮箱激活','',settings.EMAIL_FROM,[email],html_message='')
        # 将用户编号加密
        token = meiduo_signature.dumps({'user_id': user.id}, constants.EMAIL_ACTIVE_EXPIRES)
        # 拼接激活的链接地址
        verify_url = settings.EMAIL_VERIFY_URL + '?token=' + token
        # 异步发邮件
        send_active_mail.delay(email, verify_url)

        # 响应
        return http.JsonResponse({'code': RETCODE.OK, 'errmsg': "OK"})


class EmailActiveView(View):
    def get(self, request):
        # 接收
        token = request.GET.get('token')

        # 验证
        if not all([token]):
            return http.HttpResponseForbidden('参数无效')
        # 解密，获取用户编号
        json_dict = meiduo_signature.loads(token, constants.EMAIL_ACTIVE_EXPIRES)
        if json_dict is None:
            return http.HttpResponseForbidden('激活信息无效')
        user_id = json_dict.get('user_id')

        # 处理
        try:
            user = User.objects.get(pk=user_id)
        except:
            return http.HttpResponseForbidden('用户无效')
        user.email_active = True
        user.save()

        # 响应
        return redirect('/info/')


class AddressView(LoginRequiredMixin, View):
    def get(self, request):
        # 查询当前登录用户的所有收货地址
        # request.user.addresses.all()
        address_list = Address.objects.filter(user_id=request.user.id, is_delete=False)

        address_list2 = []
        for address in address_list:
            address_list2.append({
                'id': address.id,
                'title': address.title,
                'receiver': address.receiver,
                'province': address.province.name,
                'province_id': address.province_id,
                'city': address.city.name,
                'city_id': address.city_id,
                'district': address.district.name,
                'district_id': address.district_id,
                'place': address.detail_address,
                'mobile': address.mobile,
                'tel': address.phone,
                'email': address.email
            })

        context = {
            'addresses': address_list2,
            'user': request.user
        }

        return render(request, 'user_center_site.html', context)


class AddressCreateView(LoginRequiredMixin, View):
    def post(self, request):
        # 接收：不是表单，而是json数据
        json_dict = json.loads(request.body.decode())
        title = json_dict.get('title')
        receiver = json_dict.get('receiver')
        province_id = json_dict.get('province_id')
        city_id = json_dict.get('city_id')
        district_id = json_dict.get('district_id')
        place = json_dict.get('place')
        mobile = json_dict.get('mobile')
        tel = json_dict.get('tel')
        email = json_dict.get('email')

        # 验证
        if not all([title, receiver, province_id, city_id, district_id, place, mobile]):
            return http.JsonResponse({'code': RETCODE.PARAMERR, 'errmsg': '数据不完整'})

        # 处理：创建对象
        address = Address.objects.create(
            user=request.user,
            title=title,
            receiver=receiver,
            province_id=province_id,
            city_id=city_id,
            district_id=district_id,
            detail_address=place,
            mobile=mobile,
            phone=tel,
            email=email
        )

        # 响应
        return http.JsonResponse({
            'code': RETCODE.OK,
            'errmsg': 'OK',
            'address': {
                'id': address.id,
                'title': address.title,
                'receiver': address.receiver,
                'province': address.province.name,
                'province_id': address.province_id,
                'city': address.city.name,
                'city_id': address.city_id,
                'district': address.district.name,
                'district_id': address.district_id,
                'place': address.detail_address,
                'mobile': mobile,
                'tel': tel,
                'email': email
            }
        })


class AddressEditView(LoginRequiredMixin, View):
    def put(self, request, address_id):
        json_dict = json.loads(request.body.decode())
        title = json_dict.get('title')
        receiver = json_dict.get('receiver')
        province_id = json_dict.get('province_id')
        city_id = json_dict.get('city_id')
        district_id = json_dict.get('district_id')
        place = json_dict.get('place')
        mobile = json_dict.get('mobile')
        tel = json_dict.get('tel')
        email = json_dict.get('email')

        # 验证
        if not all([title, receiver, province_id, city_id, district_id, place, mobile]):
            return http.JsonResponse({'code': RETCODE.PARAMERR, 'errmsg': '数据不完整'})

        # 处理：根据id查询收货地址，并修改
        address = Address.objects.get(pk=address_id)
        address.receiver = receiver
        address.province_id = province_id
        address.city_id = city_id
        address.district_id = district_id
        address.detail_address = place
        address.mobile = mobile
        address.phone = tel
        address.email = email
        address.save()

        # 响应
        return http.JsonResponse({
            'code': RETCODE.OK,
            'errmsg': 'OK',
            'address': {
                'id': address.id,
                'title': address.title,
                'receiver': address.receiver,
                'province': address.province.name,
                'province_id': address.province_id,
                'city': address.city.name,
                'city_id': address.city_id,
                'district': address.district.name,
                'district_id': address.district_id,
                'place': address.detail_address,
                'mobile': mobile,
                'tel': tel,
                'email': email
            }
        })

    def delete(self, request, address_id):
        # 处理：删除
        address = Address.objects.get(pk=address_id)

        # 物理删除
        # address.delete()

        # 逻辑删除
        address.is_delete = True
        address.save()

        # 响应
        return http.JsonResponse({'code': RETCODE.OK, 'errmsg': 'OK'})


class AddressDefaultView(LoginRequiredMixin, View):
    def put(self, request, address_id):
        # 处理：修改当前登录用户的默认收货地址属性
        user = request.user
        user.default_address_id = address_id
        user.save()

        # 响应
        return http.JsonResponse({'code': RETCODE.OK, 'errmsg': 'OK'})


class AddressTitleView(LoginRequiredMixin, View):
    def put(self, request, address_id):
        # 接收
        title = json.loads(request.body.decode()).get('title')

        # 验证
        if not all([title]):
            return http.JsonResponse({'code': RETCODE.PARAMERR, 'errmsg': "请指定标题"})
        if Address.objects.filter(title=title, user_id=request.user.id, is_delete=False).count() > 0:
            return http.JsonResponse({'code': RETCODE.PARAMERR, 'errmsg': '标题已经存在'})

        # 处理
        address = Address.objects.get(pk=address_id)
        address.title = title
        address.save()

        # 响应
        return http.JsonResponse({'code': RETCODE.OK, 'errmsg': 'OK'})


class PwdView(LoginRequiredMixin, View):
    def get(self, request):
        return render(request, 'user_center_pass.html')

    def post(self, request):
        # 接收
        old_pwd = request.POST.get('old_pwd')
        new_pwd = request.POST.get('new_pwd')
        new_cpwd = request.POST.get('new_cpwd')

        # 验证
        # 1.旧密码是否正确
        user = request.user
        if not user.check_password(old_pwd):
            return http.HttpResponseForbidden('旧密码错误')
        if not re.match('^[0-9A-Za-z]{8,20}$', new_pwd):
            return http.HttpResponseForbidden('密码为8-20个字符')
        # 确认密码
        if new_pwd != new_cpwd:
            return http.HttpResponseForbidden('两个密码不一致')

        # 处理
        user.set_password(new_pwd)
        user.save()

        # 响应
        return render(request, 'user_center_pass.html')
