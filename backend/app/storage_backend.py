from storages.backends.s3boto3 import S3Boto3Storage
from django.conf import settings


class PublicMediaStorage(S3Boto3Storage):
    location = settings.AWS_PUBLIC_MEDIA_LOCATION
    default_acl = "public-read"
    file_overwrite = False
    custom_domain = f"{settings.AWS_S3_ENDPOINT_URL.replace('http://', '').replace('https://', '')}/{settings.AWS_STORAGE_BUCKET_NAME}"
