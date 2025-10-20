# 这个文件Serializer 负责把「Python/Django对象 ↔ JSON」互相转换，并在输入时做校验。这是数据边界层。
# 覆盖了conference和tradeshow
# 继承 serializers.ModelSerializer：自动根据模型字段生成序列化/反序列化规则。
# fields = "__all__"：暴露所有模型字段到 API。
# read_only_fields = (...)：只读字段，前端传多余字段不会生效，防止越权。
# 个别 Event 序列化器里有统计只读字段（如 guest_count/element_count/vendor_count/booth_count）：
# 由 views 里 annotate() 提供，序列化时一并输出，方便前端展示列表统计。

from rest_framework import serializers
from .models import *

# Conference
class ConferenceElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConferenceElement
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "event")

class ConferenceGuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConferenceGuest
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "event")

class ConferenceSeatAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConferenceSeatAssignment
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "event")

class ConferenceEventSerializer(serializers.ModelSerializer):
    guest_count = serializers.IntegerField(read_only=True)
    element_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = ConferenceEvent
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "user", "share_token")

class ConferenceGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConferenceGroup
        fields = ['id', 'event', 'name', 'color', 'is_system', 'created_at']
        read_only_fields = ['id', 'created_at']

# Tradeshow
class TradeshowBoothSerializer(serializers.ModelSerializer):
    class Meta:
        model = TradeshowBooth
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "event")

class TradeshowVendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = TradeshowVendor
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "event")

class TradeshowBoothAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TradeshowBoothAssignment
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "event")

class TradeshowRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TradeshowRoute
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "event")

class TradeshowEventSerializer(serializers.ModelSerializer):
    vendor_count = serializers.IntegerField(read_only=True)
    booth_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = TradeshowEvent
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "user", "share_token")