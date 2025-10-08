from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets, permissions, status
from django.shortcuts import get_object_or_404
from django.db.models import Max, Count
from .models import *
from .serializers import *
from django.contrib.auth import get_user_model
from .authentication import JWTAuthentication
import secrets


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def designs(request):
    """List current user's designs or create a new one.

    GET: returns [{id, name, kind, updated_at, latest_version}]
    POST: body {name, kind?} -> creates if not exists (by name), returns object
    """
    user = request.user
    if request.method == "GET":
        qs = (
            Design.objects.filter(user=user)
            .annotate(latest_version=Max("versions__version"))
            .order_by("-updated_at", "-id")
        )
        data = [
            {
                "id": d.id,
                "name": d.name,
                "kind": d.kind,
                "updated_at": d.updated_at,
                "latest_version": d.latest_version or 0,
            }
            for d in qs
        ]
        return Response(data)

    # POST
    name = (request.data.get("name") or "").strip()
    kind = (request.data.get("kind") or "custom").strip() or "custom"
    if not name:
        return Response({"detail": "name required"}, status=400)

    obj, created = Design.objects.get_or_create(user=user, name=name, defaults={"kind": kind})
    if not created and obj.kind != kind and kind:
        obj.kind = kind
        obj.save(update_fields=["kind", "updated_at"])
    return Response({
        "id": obj.id,
        "name": obj.name,
        "kind": obj.kind,
        "updated_at": obj.updated_at,
        "latest_version": obj.versions.aggregate(Max("version")).get("version__max") or 0,
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def shared_designs(request):
    """List designs shared with current user, including role and latest_version."""
    user = request.user
    shares = (
        DesignShare.objects.select_related("design", "design__user")
        .filter(user=user)
        .order_by("-design__updated_at", "-design__id")
    )
    # prefetch latest versions in one pass
    design_ids = [s.design_id for s in shares]
    latest_map = {
        row["design_id"]: row["max_v"]
        for row in DesignVersion.objects.filter(design_id__in=design_ids)
        .values("design_id")
        .annotate(max_v=Max("version"))
    }
    data = []
    for s in shares:
        d = s.design
        data.append({
            "id": d.id,
            "name": d.name,
            "kind": d.kind,
            "updated_at": d.updated_at,
            "latest_version": latest_map.get(d.id, 0),
            "role": s.role,
            "owner": {"id": d.user_id, "name": getattr(d.user, "first_name", ""), "email": getattr(d.user, "email", "")},
        })
    return Response(data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def design_versions(request, design_id):
    """List versions or create a new version for a design.

    GET: returns versions meta
    POST: body {data, note?} -> creates next version
    """
    design = get_object_or_404(Design, id=design_id)
    # view access for GET, edit access for POST
    if request.method == "GET":
        if design.user_id != request.user.id:
            has_share = DesignShare.objects.filter(design=design, user=request.user).exists()
            if not has_share:
                return Response({"detail": "Forbidden"}, status=403)
    else:
        # POST requires owner or editor share
        if design.user_id != request.user.id:
            share = DesignShare.objects.filter(design=design, user=request.user).first()
            if not share or share.role != "edit":
                return Response({"detail": "Forbidden"}, status=403)

    if request.method == "GET":
        versions = design.versions.order_by("-version").all()
        return Response([
            {
                "version": v.version,
                "note": v.note,
                "created_at": v.created_at,
            }
            for v in versions
        ])

    # POST create new version
    data = request.data.get("data")
    if data is None:
        return Response({"detail": "data required"}, status=400)
    note = (request.data.get("note") or "").strip()

    latest = design.versions.aggregate(Max("version")).get("version__max") or 0
    v = DesignVersion.objects.create(design=design, version=latest + 1, data=data, note=note)
    # touch updated_at
    Design.objects.filter(id=design.id).update(updated_at=v.created_at)

    return Response({"version": v.version, "created_at": v.created_at, "note": v.note}, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def design_latest(request, design_id):
    """Fetch latest version data for a design.

    Access control: owner, shared user (view/edit), or via link token in query (?token=...).
    """
    design = get_object_or_404(Design, id=design_id)
    if design.user_id != request.user.id:
        token = request.query_params.get("token")
        has_share = DesignShare.objects.filter(design=design, user=request.user).exists()
        has_link = token and DesignLink.objects.filter(design=design, token=token).exists()
        if not has_share and not has_link:
            return Response({"detail": "Forbidden"}, status=403)
    latest = design.versions.order_by("-version").first()
    if not latest:
        return Response({"version": 0, "data": {"items": []}})
    return Response({"version": latest.version, "data": latest.data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def design_version_detail(request, design_id, version):
    """Fetch specific version data with same access control as latest."""
    design = get_object_or_404(Design, id=design_id)
    if design.user_id != request.user.id:
        token = request.query_params.get("token")
        has_share = DesignShare.objects.filter(design=design, user=request.user).exists()
        has_link = token and DesignLink.objects.filter(design=design, token=token).exists()
        if not has_share and not has_link:
            return Response({"detail": "Forbidden"}, status=403)
    v = get_object_or_404(DesignVersion, design=design, version=version)
    return Response({"version": v.version, "data": v.data, "note": v.note, "created_at": v.created_at})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_share_link(request, design_id):
    """Owner creates a share link with role=view|edit, returns token."""
    design = get_object_or_404(Design, id=design_id, user=request.user)
    role = (request.data.get("role") or "view").lower()
    if role not in ("view", "edit"):
        return Response({"detail": "Invalid role"}, status=400)
    token = secrets.token_urlsafe(16)
    link = DesignLink.objects.create(design=design, token=token, role=role, created_by=request.user)
    return Response({"token": link.token, "role": link.role})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def invite_user(request, design_id):
    """Owner invites a user by email with role=view|edit. Creates user if needed (optional behavior: for now require existing)."""
    design = get_object_or_404(Design, id=design_id, user=request.user)
    email = (request.data.get("email") or "").strip().lower()
    role = (request.data.get("role") or "view").lower()
    if not email or role not in ("view", "edit"):
        return Response({"detail": "email and valid role required"}, status=400)
    User = get_user_model()
    user = User.objects.filter(email=email).first()
    if not user:
        return Response({"detail": "User not found"}, status=404)
    share, created = DesignShare.objects.update_or_create(
        design=design, user=user, defaults={"role": role}
    )
    return Response({"user_id": user.id, "email": user.email, "role": share.role})

# ----------------------------------------------------- Main ------------------------------------------------------------------
class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return getattr(obj, "user_id", None) == request.user.id

# ============ Conference ============
class ConferenceEventViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    serializer_class = ConferenceEventSerializer

    def get_queryset(self):
        return (ConferenceEvent.objects
                .filter(user=self.request.user)
                .annotate(guest_count=Count("guests"), element_count=Count("elements"))
                .order_by("-updated_at"))

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def elements(self, request, pk=None):
        """POST /api/conference/events/{id}/elements """
        event = self.get_object()
        data = request.data.get("elements", [])
        created = []
        for e in data:
            e["event"] = str(event.id)
            ser = ConferenceElementSerializer(data=e)
            ser.is_valid(raise_exception=True)
            ser.save(event=event)
            created.append(ser.data)
        return Response({"success": True, "elements": created})

    @action(detail=True, methods=["post"])
    def guests_import(self, request, pk=None):
        """POST /api/conference/events/{id}/guests/import """
        event = self.get_object()
        items = request.data.get("guests", [])
        created = []
        for g in items:
            ser = ConferenceGuestSerializer(data=g)
            ser.is_valid(raise_exception=True)
            ser.save(event=event)
            created.append(ser.data)
        return Response({"success": True, "imported_count": len(created), "guests": created})

    @action(detail=True, methods=["post"])
    def assignments(self, request, pk=None):
        """POST /api/conference/events/{id}/assignments """
        event = self.get_object()
        payload = request.data
        ser = ConferenceSeatAssignmentSerializer(data=payload)
        ser.is_valid(raise_exception=True)
        ser.save(event=event)
        return Response({"success": True, "assignment": ser.data})

    @action(detail=True, methods=["post"])
    def share(self, request, pk=None):
        """POST /api/conference/events/{id}/share """
        event = self.get_object()
        event.ensure_share_token()
        event.save(update_fields=["share_token"])
        return Response({"success": True, "share_token": event.share_token})

class ConferenceElementViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConferenceElementSerializer
    def get_queryset(self):
        return ConferenceElement.objects.filter(event__user=self.request.user)

class ConferenceGuestViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConferenceGuestSerializer
    def get_queryset(self):
        return ConferenceGuest.objects.filter(event__user=self.request.user)

class ConferenceSeatAssignmentViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConferenceSeatAssignmentSerializer
    def get_queryset(self):
        return ConferenceSeatAssignment.objects.filter(event__user=self.request.user)

#-------------------------------------------------  分享只读 -------------------------------------------------------------
from rest_framework.permissions import AllowAny
class ConferenceShareViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = ConferenceEventSerializer
    lookup_field = "share_token"
    def get_queryset(self):
        return ConferenceEvent.objects.filter(is_public=True)

# ============ Tradeshow ============
class TradeshowEventViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    serializer_class = TradeshowEventSerializer

    def get_queryset(self):
        return (TradeshowEvent.objects
                .filter(user=self.request.user)
                .annotate(vendor_count=Count("vendors"), booth_count=Count("booths"))
                .order_by("-updated_at"))

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def booths(self, request, pk=None):
        event = self.get_object()
        items = request.data.get("booths", [])
        created = []
        for b in items:
            ser = TradeshowBoothSerializer(data=b)
            ser.is_valid(raise_exception=True)
            ser.save(event=event)
            created.append(ser.data)
        return Response({"success": True, "booths": created})

    @action(detail=True, methods=["post"])
    def vendors_import(self, request, pk=None):
        event = self.get_object()
        items = request.data.get("vendors", [])
        created = []
        for v in items:
            ser = TradeshowVendorSerializer(data=v)
            ser.is_valid(raise_exception=True)
            ser.save(event=event)
            created.append(ser.data)
        return Response({"success": True, "imported_count": len(created), "vendors": created})

    @action(detail=True, methods=["post"])
    def assignments(self, request, pk=None):
        event = self.get_object()
        ser = TradeshowBoothAssignmentSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(event=event)
        return Response({"success": True, "assignment": ser.data})

    @action(detail=True, methods=["post"])
    def routes(self, request, pk=None):
        event = self.get_object()
        ser = TradeshowRouteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(event=event)
        return Response({"success": True, "route": ser.data})

    @action(detail=True, methods=["post"], url_path="presets/apply")
    def apply_preset(self, request, pk=None):
        event = self.get_object()
        preset_id = request.data.get("preset_id")
        # 占位：实际根据 preset 生成若干 booth!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        event.preset_layout = preset_id or "custom"
        event.save(update_fields=["preset_layout"])
        return Response({"success": True, "preset": event.preset_layout})

class TradeshowShareViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = TradeshowEventSerializer
    lookup_field = "share_token"
    def get_queryset(self):
        return TradeshowEvent.objects.filter(is_public=True)