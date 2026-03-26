from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users to access the view.
    Assumes User model has an is_admin property or role field.
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated and is an admin
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)
    
    def has_object_permission(self, request, view, obj):
        # Object-level permission - only admins can access any object
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to access it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Check if user is admin
        if request.user.is_admin:
            return True
        
        # Check if user is the owner (assumes object has assigned_to or created_by field)
        if hasattr(obj, 'assigned_to') and obj.assigned_to == request.user:
            return True
        
        if hasattr(obj, 'created_by') and obj.created_by == request.user:
            return True
        
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        
        return False


class IsEmployeeUser(permissions.BasePermission):
    """
    Custom permission to only allow employee users.
    """
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_employee)