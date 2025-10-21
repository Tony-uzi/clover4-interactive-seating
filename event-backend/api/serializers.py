from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Design, DesignVersion,
    ConferenceEvent, ConferenceElement, ConferenceGroup,
    ConferenceGuest, ConferenceSeatAssignment,
    TradeshowEvent, TradeshowBooth, TradeshowVendor,
    TradeshowBoothAssignment, TradeshowRoute
)

User = get_user_model()


# ========================================== Design Serializers ==========================================
class DesignSerializer(serializers.ModelSerializer):
    latest_version = serializers.IntegerField(read_only=True)

    class Meta:
        model = Design
        fields = ['id', 'name', 'kind', 'created_at', 'updated_at', 'latest_version']
        read_only_fields = ['id', 'created_at', 'updated_at']


class DesignVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DesignVersion
        fields = ['version', 'data', 'note', 'created_at']
        read_only_fields = ['version', 'created_at']


# ========================================== Conference Serializers ==========================================
class ConferenceEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConferenceEvent
        fields = [
            'id', 'name', 'description', 'event_date',
            'room_width', 'room_height', 'is_public',
            'share_token', 'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'share_token', 'created_at', 'updated_at']


class ConferenceEventListSerializer(serializers.ModelSerializer):
    guest_count = serializers.IntegerField(read_only=True)
    element_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ConferenceEvent
        fields = [
            'id', 'name', 'description', 'event_date',
            'guest_count', 'element_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConferenceElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConferenceElement
        fields = [
            'id', 'event', 'element_type', 'label', 'seats',
            'position_x', 'position_y', 'width', 'height',
            'rotation', 'scale_x', 'scale_y',
            'door_width', 'door_swing', 'outlet_type',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConferenceGroupSerializer(serializers.ModelSerializer):
    guest_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = ConferenceGroup
        fields = ['id', 'event', 'name', 'color', 'is_system', 'guest_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConferenceGuestSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True, required=False)
    seat_info = serializers.SerializerMethodField()

    class Meta:
        model = ConferenceGuest
        fields = [
            'id', 'event', 'group', 'group_name', 'name', 'email',
            'dietary_requirements', 'company', 'phone',
            'checked_in', 'check_in_time', 'metadata',
            'seat_info', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'check_in_time']

    def get_seat_info(self, obj):
        assignment = obj.seat_assignments.first()
        if assignment:
            return {
                'element_id': str(assignment.element_id),
                'element_label': assignment.element.label,
                'seat_number': assignment.seat_number
            }
        return None


class ConferenceSeatAssignmentSerializer(serializers.ModelSerializer):
    guest_name = serializers.CharField(source='guest.name', read_only=True)
    element_label = serializers.CharField(source='element.label', read_only=True)

    class Meta:
        model = ConferenceSeatAssignment
        fields = [
            'id', 'event', 'element', 'element_label',
            'guest', 'guest_name', 'seat_number',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ========================================== Tradeshow Serializers ==========================================
class TradeshowEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TradeshowEvent
        fields = [
            'id', 'name', 'description', 'event_date_start', 'event_date_end',
            'hall_width', 'hall_height', 'preset_layout', 'is_public',
            'share_token', 'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'share_token', 'created_at', 'updated_at']


class TradeshowEventListSerializer(serializers.ModelSerializer):
    vendor_count = serializers.IntegerField(read_only=True)
    booth_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = TradeshowEvent
        fields = [
            'id', 'name', 'description', 'event_date_start', 'event_date_end',
            'vendor_count', 'booth_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TradeshowBoothSerializer(serializers.ModelSerializer):
    class Meta:
        model = TradeshowBooth
        fields = [
            'id', 'event', 'booth_type', 'category', 'label',
            'position_x', 'position_y', 'width', 'height',
            'rotation', 'scale_x', 'scale_y',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TradeshowVendorSerializer(serializers.ModelSerializer):
    booth_info = serializers.SerializerMethodField()

    class Meta:
        model = TradeshowVendor
        fields = [
            'id', 'event', 'company_name', 'contact_name',
            'contact_email', 'contact_phone', 'category',
            'booth_size_preference', 'website', 'logo_url',
            'description', 'checked_in', 'check_in_time',
            'metadata', 'booth_info', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'check_in_time']

    def get_booth_info(self, obj):
        assignment = obj.assignments.first()
        if assignment:
            return {
                'booth_id': str(assignment.booth_id),
                'booth_label': assignment.booth.label,
                'booth_type': assignment.booth.booth_type
            }
        return None


class TradeshowBoothAssignmentSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.company_name', read_only=True)
    booth_label = serializers.CharField(source='booth.label', read_only=True)

    class Meta:
        model = TradeshowBoothAssignment
        fields = [
            'id', 'event', 'booth', 'booth_label',
            'vendor', 'vendor_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TradeshowRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TradeshowRoute
        fields = [
            'id', 'event', 'name', 'route_type', 'booth_order',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ========================================== Bulk Import Serializers ==========================================
class BulkGuestImportSerializer(serializers.Serializer):
    """Serializer for bulk CSV guest import"""
    guests = serializers.ListField(
        child=serializers.DictField()
    )


class BulkVendorImportSerializer(serializers.Serializer):
    """Serializer for bulk CSV vendor import"""
    vendors = serializers.ListField(
        child=serializers.DictField()
    )
