"""
Health check endpoint for Kubernetes liveness and readiness probes
"""

from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache


def health_check(request):
    """
    Simple health check endpoint
    Returns 200 OK if the service is healthy
    """
    return JsonResponse({
        'status': 'healthy',
        'service': 'event-backend'
    })


def readiness_check(request):
    """
    Readiness check endpoint
    Checks if the service is ready to accept traffic (database connection, etc.)
    """
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")

        return JsonResponse({
            'status': 'ready',
            'database': 'connected'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'not ready',
            'error': str(e)
        }, status=503)
