from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Max
from .models import Design, DesignVersion
from django.contrib.auth import get_user_model
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

@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def designs_detail(request, design_id):
    """Update metadata (rename/kind) or delete a design (owner only)."""
    design = get_object_or_404(Design, id=design_id, user=request.user)
    if request.method == "PATCH":
        name = (request.data.get("name") or "").strip()
        kind = (request.data.get("kind") or "").strip()
        changed = False
        if name and name != design.name:
            # ensure unique per user
            if Design.objects.filter(user=request.user, name=name).exclude(id=design.id).exists():
                return Response({"detail": "name already exists"}, status=400)
            design.name = name
            changed = True
        if kind and kind != design.kind:
            design.kind = kind
            changed = True
        if changed:
            design.save(update_fields=["name", "kind", "updated_at"])
        return Response({
            "id": design.id,
            "name": design.name,
            "kind": design.kind,
            "updated_at": design.updated_at,
            "latest_version": design.versions.aggregate(Max("version")).get("version__max") or 0,
        })

    # DELETE
    design.delete()
    return Response(status=204)



@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def design_versions(request, design_id):
    """List versions or create a new version for a design.

    GET: returns versions meta
    POST: body {data, note?} -> creates next version
    """
    design = get_object_or_404(Design, id=design_id, user=request.user)

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
    """Fetch latest version data for a design (owner only)."""
    design = get_object_or_404(Design, id=design_id, user=request.user)
    latest = design.versions.order_by("-version").first()
    if not latest:
        return Response({"version": 0, "data": {"items": []}})
    return Response({"version": latest.version, "data": latest.data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def design_version_detail(request, design_id, version):
    """Fetch specific version data (owner only)."""
    design = get_object_or_404(Design, id=design_id, user=request.user)
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

