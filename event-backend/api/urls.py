from django.urls import path
from .views_auth import login, signup
from .views import designs, designs_detail, design_versions, design_latest, design_version_detail, create_share_link, invite_user, shared_designs

urlpatterns = [
    path('auth/login/', login, name='login'),
    path('auth/register/', signup, name='signup'),

    # Designs and versions
    path('designs/', designs, name='designs'),
    path('designs/<int:design_id>/', designs_detail, name='designs-detail'),
    path('designs/shared/', shared_designs, name='shared-designs'),
    path('designs/<int:design_id>/versions/', design_versions, name='design-versions'),
    path('designs/<int:design_id>/latest/', design_latest, name='design-latest'),
    path('designs/<int:design_id>/versions/<int:version>/', design_version_detail, name='design-version-detail'),
    path('designs/<int:design_id>/share-link/', create_share_link, name='design-create-share-link'),
    path('designs/<int:design_id>/invite/', invite_user, name='design-invite-user'),
]