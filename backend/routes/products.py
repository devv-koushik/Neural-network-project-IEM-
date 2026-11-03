from flask import Blueprint, request

from database.db import db
from models.product import Product
from utils import ok, err, admin_required, paginated, parse_pagination

bp = Blueprint('products', __name__, url_prefix='/api/products')

SORT_MAP = {
    'price_asc': Product.price.asc(),
    'price_desc': Product.price.desc(),
    'rating': Product.rating.desc(),
    'featured': Product.featured.desc(),
}


@bp.get('')
def list_products():
    search = (request.args.get('search') or '').strip().lower()
    category = request.args.get('category')
    max_price = request.args.get('max_price', type=float)
    min_rating = request.args.get('min_rating', type=float)
    in_stock = request.args.get('in_stock')
    sort = request.args.get('sort', 'featured')

    query = Product.query
    if search:
        query = query.filter(Product.name.ilike(f'%{search}%'))
    if category and category != 'All':
        query = query.filter(Product.category == category)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if min_rating is not None:
        query = query.filter(Product.rating >= min_rating)
    if in_stock == 'true':
        query = query.filter(Product.stock > 0)
    elif in_stock == 'false':
        query = query.filter(Product.stock == 0)

    query = query.order_by(SORT_MAP.get(sort, Product.featured.desc()))

    if 'page' in request.args or 'limit' in request.args:
        page, limit = parse_pagination(request)
        total = query.count()
        items = query.offset((page - 1) * limit).limit(limit).all()
        return ok(paginated([p.to_dict() for p in items], page, limit, total))

    return ok([p.to_dict() for p in query.all()])


@bp.get('/<int:product_id>')
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return err('Product not found.', 'NOT_FOUND', 404)
    return ok(product.to_dict())


@bp.post('')
@admin_required
def create_product():
    body = request.get_json(silent=True) or {}
    if not body.get('name') or body.get('price') is None:
        return err('name and price are required.', 'VALIDATION_ERROR', 400)

    product = Product(
        name=body['name'],
        category=body.get('category', 'Electronics'),
        price=float(body['price']),
        rating=float(body.get('rating', 4.5)),
        reviews=int(body.get('reviews', 0)),
        stock=int(body.get('stock', 0)),
        description=body.get('description'),
        image_url=body.get('image_url'),
        color=body.get('color', '#5B6EF5'),
        featured=bool(body.get('featured', False)),
    )
    db.session.add(product)
    db.session.commit()
    return ok(product.to_dict(), status=201)


@bp.put('/<int:product_id>')
@admin_required
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return err('Product not found.', 'NOT_FOUND', 404)

    body = request.get_json(silent=True) or {}
    for field in ('name', 'category', 'price', 'rating', 'reviews', 'stock', 'description', 'image_url', 'color', 'featured'):
        if field in body:
            setattr(product, field, body[field])
    db.session.commit()
    return ok(product.to_dict())


@bp.delete('/<int:product_id>')
@admin_required
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return err('Product not found.', 'NOT_FOUND', 404)
    db.session.delete(product)
    db.session.commit()
    return ok({'message': 'Product deleted.'})
