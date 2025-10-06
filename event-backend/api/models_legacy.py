# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class ApiDesign(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=200)
    kind = models.CharField(max_length=32)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    user = models.ForeignKey('AuthUser', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'api_design'
        unique_together = (('user', 'name'),)


class ApiDesignlink(models.Model):
    id = models.BigAutoField(primary_key=True)
    token = models.CharField(unique=True, max_length=64)
    role = models.CharField(max_length=8)
    created_at = models.DateTimeField()
    created_by = models.ForeignKey('AuthUser', models.DO_NOTHING, blank=True, null=True)
    design = models.ForeignKey(ApiDesign, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'api_designlink'


class ApiDesignshare(models.Model):
    id = models.BigAutoField(primary_key=True)
    role = models.CharField(max_length=8)
    created_at = models.DateTimeField()
    design = models.ForeignKey(ApiDesign, models.DO_NOTHING)
    user = models.ForeignKey('AuthUser', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'api_designshare'
        unique_together = (('design', 'user'),)


class ApiDesignversion(models.Model):
    id = models.BigAutoField(primary_key=True)
    version = models.IntegerField()
    data = models.JSONField()
    note = models.CharField(max_length=255)
    created_at = models.DateTimeField()
    design = models.ForeignKey(ApiDesign, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'api_designversion'
        unique_together = (('design', 'version'),)


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.BooleanField()
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.BooleanField()
    is_active = models.BooleanField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class Canvases(models.Model):
    id = models.BigAutoField(primary_key=True)
    event = models.ForeignKey('Events', models.DO_NOTHING)
    name = models.TextField()
    width = models.IntegerField()
    height = models.IntegerField()
    scale_ratio = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    offset_x = models.DecimalField(max_digits=12, decimal_places=4, blank=True, null=True)
    offset_y = models.DecimalField(max_digits=12, decimal_places=4, blank=True, null=True)
    version = models.IntegerField(blank=True, null=True)
    is_active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'canvases'


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.SmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'


class Events(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.TextField()
    type = models.TextField()  # This field type is a guess.
    description = models.TextField(blank=True, null=True)
    venue = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField(blank=True, null=True)
    end_time = models.DateTimeField(blank=True, null=True)
    is_public = models.BooleanField(blank=True, null=True)
    share_token = models.TextField(unique=True, blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'events'


class ExhibitorAssignments(models.Model):
    id = models.BigAutoField(primary_key=True)
    event = models.ForeignKey(Events, models.DO_NOTHING)
    exhibitor = models.ForeignKey('Exhibitors', models.DO_NOTHING)
    booth_object = models.OneToOneField('Objects', models.DO_NOTHING)
    checked_in = models.BooleanField(blank=True, null=True)
    is_active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'exhibitor_assignments'
        unique_together = (('event', 'exhibitor'),)


class Exhibitors(models.Model):
    id = models.BigAutoField(primary_key=True)
    event = models.ForeignKey(Events, models.DO_NOTHING)
    company = models.TextField()
    contact_name = models.TextField(blank=True, null=True)
    email = models.TextField(blank=True, null=True)
    phone = models.TextField(blank=True, null=True)
    website = models.TextField(blank=True, null=True)
    logo_url = models.TextField(blank=True, null=True)
    category = models.TextField(blank=True, null=True)
    prefs = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    # A unique constraint could not be introspected.
    class Meta:
        managed = False
        db_table = 'exhibitors'


class GuestAssignments(models.Model):
    id = models.BigAutoField(primary_key=True)
    event = models.ForeignKey(Events, models.DO_NOTHING)
    guest = models.ForeignKey('Guests', models.DO_NOTHING)
    seat_object = models.OneToOneField('Objects', models.DO_NOTHING)
    seat_label = models.TextField(blank=True, null=True)
    checked_in = models.BooleanField(blank=True, null=True)
    is_active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'guest_assignments'
        unique_together = (('event', 'guest'),)


class Guests(models.Model):
    id = models.BigAutoField(primary_key=True)
    event = models.ForeignKey(Events, models.DO_NOTHING)
    name = models.TextField()
    email = models.TextField(blank=True, null=True)
    phone = models.TextField(blank=True, null=True)
    company = models.TextField(blank=True, null=True)
    title = models.TextField(blank=True, null=True)
    dietary = models.JSONField(blank=True, null=True)
    access = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    # A unique constraint could not be introspected.
    class Meta:
        managed = False
        db_table = 'guests'


class Objects(models.Model):
    id = models.BigAutoField(primary_key=True)
    canvas = models.ForeignKey(Canvases, models.DO_NOTHING)
    obj_type = models.TextField()
    label = models.TextField(blank=True, null=True)
    number = models.IntegerField(blank=True, null=True)
    position_x = models.DecimalField(max_digits=12, decimal_places=4)
    position_y = models.DecimalField(max_digits=12, decimal_places=4)
    width = models.DecimalField(max_digits=12, decimal_places=4, blank=True, null=True)
    height = models.DecimalField(max_digits=12, decimal_places=4, blank=True, null=True)
    rotation = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    scale_x = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    scale_y = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    seats = models.IntegerField(blank=True, null=True)
    z_index = models.IntegerField(blank=True, null=True)
    meta_json = models.JSONField(blank=True, null=True)
    is_active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'objects'
        unique_together = (('canvas', 'label'), ('canvas', 'number'),)


class TradeshowRoutes(models.Model):
    id = models.BigAutoField(primary_key=True)
    event = models.ForeignKey(Events, models.DO_NOTHING)
    name = models.TextField()
    route_type = models.TextField(blank=True, null=True)
    booth_order = models.JSONField()
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    created_by = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tradeshow_routes'
