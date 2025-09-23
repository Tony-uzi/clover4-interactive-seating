# Role: Inbound validation (validating submitted data fields and performing type conversion), 
# outbound representation (converting Model instances/query sets into JSON).

from rest_framework import serializers
from .models import Venue, Layout, Table, Seat, Attendee, Assignment

class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = "__all__"

class LayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Layout
        fields = "__all__"

class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = "__all__"

class SeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seat
        fields = "__all__"

class AttendeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendee
        fields = "__all__"

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")