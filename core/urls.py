from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NodeViewSet, EdgeViewSet, TransactionViewSet

router = DefaultRouter()
router.register(r'nodes', NodeViewSet, basename='node')
router.register(r'edges', EdgeViewSet, basename='edge')
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('', include(router.urls)),
]