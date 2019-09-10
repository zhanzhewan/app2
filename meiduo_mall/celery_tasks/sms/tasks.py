from celery_tasks.main import app
from meiduo_mall.libs.yuntongxun.sms import CCP
from . import constants


@app.task(bind=True, name='send_sms', retry_backoff=3)
def send_sms(self, mobile, sms_code):
    # 将耗时的代码封装在一个方法中
    # ccp = CCP()
    # ret= ccp.send_template_sms(mobile, [sms_code, constants.SMS_CODE_EXPIRES], 1)
    # if ret !=0:
    #     raise self.retry(exc=Exception('发送短信失败'), max_retries=3)
    # return ret

    print(sms_code)

def hello():
    print('ok')