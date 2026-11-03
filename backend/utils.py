"""Shared helpers used across every route module."""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def ok(data=None, status=200):
    return jsonify({'success': True, 'data': data if data is not None else {}}), status


def err(message, code='ERROR', status=400):
    return jsonify({'success': False, 'error': {'code': code, 'message': message}}), status


def paginated(items, page, limit, total):
    pages = max(1, (total + limit - 1) // limit)
    return {
        'data': items,
        'pagination': {'page': page, 'limit': limit, 'total': total, 'pages': pages},
    }


def admin_required(fn):
    """Route decorator: requires a valid JWT AND role == 'admin'."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return err('Admin access required.', 'FORBIDDEN', 403)
        return fn(*args, **kwargs)
    return wrapper


def parse_pagination(request):
    try:
        page = max(1, int(request.args.get('page', 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        limit = min(100, max(1, int(request.args.get('limit', 10))))
    except (TypeError, ValueError):
        limit = 10
    return page, limit
