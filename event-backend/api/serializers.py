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

# 具体流程：
# 例子，后续删掉，创建会议事件：
# POST /api/conference/events/
# {
#   "name": "Annual Meeting",
#   "description": "VIP dinner",
#   "room_width": 24.0,
#   "room_height": 16.0
# }

# 响应（由 ConferenceEventSerializer 输出）：
# {
#   "id": "f5e8...-uuid",
#   "user": 1,
#   "name": "Annual Meeting",
#   "description": "VIP dinner",
#   "room_width": "24.00",
#   "room_height": "16.00",
#   "is_public": false,
#   "share_token": null,
#   "guest_count": 0,
#   "element_count": 0,
#   "created_at": "2025-10-06T10:20:30Z",
#   "updated_at": "2025-10-06T10:20:30Z"
# }

# 批量新增元素（elements action 内部还是逐个用 ConferenceElementSerializer 校验）：
# POST /api/conference/events/<event_id>/elements/
# {
#   "elements": [
#     {
#       "element_type": "table_round",
#       "label": "T1",
#       "seats": 8,
#       "position_x": 100, "position_y": 120,
#       "width": 1.8, "height": 1.8,
#       "rotation": 0, "scale_x": 1, "scale_y": 1
#     }
#   ]
# }