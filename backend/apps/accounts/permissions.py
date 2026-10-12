from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    """
    Allows access only to administrator users.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        return hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN'

class IsPassengerUserRole(permissions.BasePermission):
    """
    Allows access to authenticated passengers and admins.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to access it.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or (hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN'):
            return True
        # Check if obj has user field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False
