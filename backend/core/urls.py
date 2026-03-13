from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ProjectViewSet, RegisterView, SendOTPView, UserView, DatasetViewSet, ExperimentViewSet, TrainingRunViewSet, CheckUsernameView, DashboardStatsView

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'datasets', DatasetViewSet)
router.register(r'experiments', ExperimentViewSet)
router.register(r'runs', TrainingRunViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('auth/send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserView.as_view(), name='user-me'),
    path('auth/check-username/', CheckUsernameView.as_view(), name='check-username'),
]
