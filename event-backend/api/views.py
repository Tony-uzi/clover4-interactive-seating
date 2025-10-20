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
    # 使用JWT（JSON Web Token）认证
    # 用户必须在请求头中携带有效的token
    # 格式：`Authorization: Bearer <token>`
    authentication_classes = [JWTAuthentication]
    # 只有认证用户且是对象所有者才能访问 `IsAuthenticated`：必须登录 IsOwner`：必须是资源的所有者
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    # 负责数据转换（Python对象 ↔ JSON）
    serializer_class = ConferenceEventSerializer

    # 定义查询集，返回当前用户的所有会议事件，并附加嘉宾和元素的计数
    # 控制用户只能看到自己创建的会议事件
    def get_queryset(self):
        return (ConferenceEvent.objects
                .filter(user=self.request.user) # # 只查询当前用户的会议
                # # 统计嘉宾数量和元素数量
                .annotate(guest_count=Count("guests"), element_count=Count("elements"))
                # 按更新时间倒序排列
                .order_by("-updated_at"))

    # 在创建会议事件时，自动将当前用户设置为事件的所有者
    # 前端创建会议时只发送会议信息，不发送user字段： user字段由后端自动设置
    # 这样可以防止用户伪造请求创建不属于自己的会议
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    #  自定义动作：添加会议元素
    #  url:POST /api/conference/events/{id}/elements
    #  接收一个包含多个元素的列表
    #  为每个元素创建一个 ConferenceElement 实例，并关联到当前会议事件
    #  一次性添加多个会议元素（桌子、椅子等）。
    @action(detail=True, methods=["post"])
    def elements(self, request, pk=None):
        """POST /api/conference/events/{id}/elements """
        # 1. 获取当前会议对象
        event = self.get_object()
        # 2. 从请求数据中提取元素列表
        data = request.data.get("elements", [])
        
        created = []
        # 3. 遍历每个元素数据,逐个创建
        for e in data:
            # 确保元素数据中包含 event 字段，指向当前会议的 ID,3.1 添加事件ID
            e["event"] = str(event.id)
            # 3.2 使用序列化器验证并保存元素,验证数据格式
            ser = ConferenceElementSerializer(data=e)
            ser.is_valid(raise_exception=True)
            # 3.3 保存元素到数据库
            ser.save(event=event)
            # 3.4 将创建的元素数据添加到结果列表，记录返回对象
            created.append(ser.data)
        # 4. 返回成功响应，包含所有创建的元素数据
        return Response({"success": True, "elements": created})

    # 自定义动作：批量导入嘉宾
    # url:POST /api/conference/events/{id}/guests/import
    # 接收一个包含多个嘉宾信息的列表
    # 为每个嘉宾创建一个 ConferenceGuest 实例，并关联到当前会议事件，通常来自于csv文件
    @action(detail=True, methods=["post"])
    def guests_import(self, request, pk=None):
        """POST /api/conference/events/{id}/guests/import """
        # 1. 获取会议对象
        event = self.get_object()
        # 2. 从请求数据中提取嘉宾列表
        items = request.data.get("guests", [])
        # 3. 遍历每个嘉宾数据,逐个创建
         # 3.1 使用序列化器验证并保存嘉宾
        created = []
        for g in items:
            ser = ConferenceGuestSerializer(data=g)
            ser.is_valid(raise_exception=True)
            ser.save(event=event)
            created.append(ser.data)
        # 4. 返回成功响应，包含导入的嘉宾数量和数据
        # 然后通知前端导入成功，并返回导入的嘉宾数量和数据，以便前端更新界面
        # 前端收到响应后，可以显示导入成功的消息，并更新嘉宾列表，是json格式
        return Response({"success": True, "imported_count": len(created), "guests": created})

    # 自定义动作：分配座位，将嘉宾分配到指定座位
    # url:POST /api/conference/events/{id}/assignments
    # 接收一个包含分配信息的对象
    # 创建一个 ConferenceSeatAssignment 实例，并关联到当前会议事件
    @action(detail=True, methods=["post"])
    def assignments(self, request, pk=None):
        """POST /api/conference/events/{id}/assignments """
        # 1. 获取会议对象 self.get_object() 是 Django REST framework 在 ModelViewSet 里提供的工具方法
        event = self.get_object()
        # 2. 从请求数据中提取分配信息
        payload = request.data
        # 3. 使用序列化器验证并保存分配信息
        ser = ConferenceSeatAssignmentSerializer(data=payload)
        ser.is_valid(raise_exception=True)
        # 4. 保存分配到数据库
        ser.save(event=event)
        # 5. 返回成功响应，包含创建的分配数据
        return Response({"success": True, "assignment": ser.data})

    # 自定义动作：生成或获取分享链接
    # url:POST /api/conference/events/{id}/share
    # 为当前会议事件生成一个唯一的分享令牌（share_token），共享给其他人
    # 该令牌可用于只读访问会议详情
    # 如果已经存在分享令牌，则直接返回
    @action(detail=True, methods=["post"])
    def share(self, request, pk=None):
        """POST /api/conference/events/{id}/share """
        # 1. 获取会议对象
        event = self.get_object()
        # 2. 生成或获取分享令牌, 确保有分享token（如果没有就生成）
        event.ensure_share_token()
        # 3. 保存更新（如果生成了新token）
         # 4. 返回成功响应，包含分享令牌
        event.save(update_fields=["share_token"])
        return Response({"success": True, "share_token": event.share_token})


        # 下面都是些辅助类viewset
        
        # 单独管理会议元素（增删改查）
        # 负责处理会议的元素、嘉宾和座位分配
        # 这些视图集都要求用户认证，并且只能访问自己创建的资源
        # 每个视图集都指定了相应的序列化器和查询集过滤逻辑
class ConferenceElementViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConferenceElementSerializer
    def get_queryset(self):
        return ConferenceElement.objects.filter(event__user=self.request.user)
        # 单独管理会议嘉宾（增删改查）
class ConferenceGuestViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConferenceGuestSerializer
    def get_queryset(self):
        return ConferenceGuest.objects.filter(event__user=self.request.user)
        # 单独管理会议嘉宾座位分配（增删改查）
class ConferenceSeatAssignmentViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConferenceSeatAssignmentSerializer
    def get_queryset(self):
        return ConferenceSeatAssignment.objects.filter(event__user=self.request.user)

# 这是一个 ViewSet（视图集），它为 ConferenceGroup（会议嘉宾分组）模型提供完整的 CRUD API。
class ConferenceGroupViewSet(viewsets.ModelViewSet):
    queryset = ConferenceGroup.objects.all()
    serializer_class = ConferenceGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # 只返回当前用户创建的会议的分组
        return ConferenceGroup.objects.filter(event__user=user)

#-------------------------------------------------  分享只读 -------------------------------------------------------------
        # 提供只读的公开访问，无需登录

from rest_framework.permissions import AllowAny
class ConferenceShareViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny] # 任何人都可以访问我
    serializer_class = ConferenceEventSerializer
    lookup_field = "share_token"    # # 通过share的token查找
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