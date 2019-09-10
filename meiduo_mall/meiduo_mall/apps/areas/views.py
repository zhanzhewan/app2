from django.shortcuts import render
from django.views import View
from .models import Area
from django import http
from meiduo_mall.utils.response_code import RETCODE
from django.core.cache import cache
from . import constants


class AreaView(View):
    def get(self, request):
        area_id = request.GET.get('area_id')
        if area_id is None:
            # 先获取缓存，如果存在中不存在，再查询mysq并缓存
            result = cache.get('province_list')
            if result is None:
                # 没有传递地区编号，表示查询省列表
                province_list = Area.objects.filter(parent__isnull=True)
                # 只返回地区对象的编号、名称
                province_list2 = []
                for province in province_list:
                    province_list2.append({
                        'id': province.id,
                        'name': province.name
                    })

                result = {
                    'code': RETCODE.OK,
                    'errmsg': "OK",
                    'province_list': province_list2
                }
                cache.set('province_list', result, constants.AREA_CACHE_EXPIRES)

            return http.JsonResponse(result)
        else:
            result = cache.get('area_' + area_id)
            if result is None:
                # 有地区编号，表示查询指定地区的子级地区列表
                try:
                    area = Area.objects.get(pk=area_id)
                except:
                    return http.JsonResponse({'code': RETCODE.PARAMERR, 'errmsg': '地区编号无效'})
                # 获取指定地区的子级地区
                sub_list = area.subs.all()
                # 整理前端需要的数据格式
                sub_list2 = []
                for sub in sub_list:
                    sub_list2.append({
                        'id': sub.id,
                        'name': sub.name
                    })

                result = {
                    'code': RETCODE.OK,
                    'errmsg': 'OK',
                    'sub_data': {
                        'id': area.id,
                        'name': area.name,
                        'subs': sub_list2
                    }
                }
                cache.set('area_' + area_id, result, constants.AREA_CACHE_EXPIRES)

            return http.JsonResponse(result)
