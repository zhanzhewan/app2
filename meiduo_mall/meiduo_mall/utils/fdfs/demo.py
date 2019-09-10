from fdfs_client.client import Fdfs_client

if __name__ == '__main__':
    # 创建连接对象
    client = Fdfs_client('client.conf')
    # 上传文件
    ret = client.upload_by_filename('/home/python/Desktop/1.jpg')
    # 响应值
    print(ret)

'''
mysql -h127.0.0.1 -uroot -pmysql meiduo_tbd39 < goods_data.sql
{
    'Storage IP': '192.168.47.128',
    'Group name': 'group1',
    'Uploaded size': '8.00KB',
    'Status': 'Upload successed.',
    'Local file name': '/home/python/Desktop/1.jpg',
    'Remote file_id': 'group1/M00/00/00/wKgvgFyVsQKANIKnAAAhg8MeEWU833.jpg'
}

'''