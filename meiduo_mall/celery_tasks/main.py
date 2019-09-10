from celery import Celery
import os

# 读取django项目的配置
os.environ["DJANGO_SETTINGS_MODULE"] = "meiduo_mall.settings.dev"

# 创建celery对象
app = Celery('meiduo')

# 加载配置
app.config_from_object('celery_tasks.config')

# 加载可用的任务
app.autodiscover_tasks([
    'celery_tasks.sms',
    'celery_tasks.email_active',
])
