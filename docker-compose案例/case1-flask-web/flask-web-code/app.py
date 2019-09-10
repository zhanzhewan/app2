# encoding=utf-8
import time

import redis
from flask import Flask

app = Flask(__name__)
# 此处host是docker-compose.yaml配置文件中 redis服务的名称
cache = redis.Redis(host='redis', port=6379)

def get_hit_count():
    '''利用redis统计访问次数'''
    retries = 5
    # 由于当redis重启时，可能会有短暂时间无法访问redis
    # 因此循环的作用就是在这个期间重试，默认重试5次
    while True:
        try:
            # redis的incr方法，如果hits值存在则自动+1，否则新增该键，值为1
            return cache.incr("hits")
        except redis.execeptions.ConnectError as exec:
            if retries == 0:
                raise exec
            retries -= 1
            time.sleep(0.5)

@app.route("/")
def main():
    count = get_hit_count()
    return "欢迎访问！网站已经累计访问{}次\n".format(count)

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
