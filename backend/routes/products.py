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


@bp.post('/checkout')
def checkout():
    import uuid
    from datetime import datetime, timezone, timedelta
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    from models.user import User
    from models.customer import Customer, CustomerBehavior

    body = request.get_json(silent=True) or {}
    items = body.get('items', [])
    if not items:
        return err('No items provided in order.', 'VALIDATION_ERROR', 400)

    shipping = body.get('shipping', {})
    payment_method = body.get('payment_method', 'Credit Card')

    purchased_items = []
    total_amount = 0.0

    for item in items:
        prod_id = item.get('id') or item.get('product_id')
        qty = max(1, int(item.get('quantity', 1)))
        product = Product.query.get(prod_id)
        if not product:
            continue

        item_subtotal = round(product.price * qty, 2)
        total_amount += item_subtotal

        # Decrement product inventory stock
        if product.stock is not None and product.stock > 0:
            product.stock = max(0, product.stock - qty)

        purchased_items.append({
            'product_id': product.id,
            'name': product.name,
            'category': product.category,
            'price': product.price,
            'quantity': qty,
            'subtotal': item_subtotal,
            'image_url': product.image_url,
        })

    if not purchased_items:
        return err('None of the ordered products could be found.', 'NOT_FOUND', 404)

    total_amount = round(total_amount, 2)
    order_id = f"ORD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    # Best-effort update customer profile if logged in
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            user = db.session.get(User, int(user_id))
            if user and user.customer:
                behavior = user.customer.behavior
                if not behavior:
                    behavior = CustomerBehavior(customer_id=user.customer.id)
                    db.session.add(behavior)
                behavior.previous_purchases = (behavior.previous_purchases or 0) + 1
                behavior.customer_lifetime_value = round((behavior.customer_lifetime_value or 0) + total_amount, 2)
                behavior.days_since_last_purchase = 0
                behavior.cart_additions = (behavior.cart_additions or 0) + sum(i['quantity'] for i in purchased_items)
    except Exception:
        pass

    db.session.commit()

    est_delivery = (datetime.now(timezone.utc) + timedelta(days=3)).strftime('%A, %B %d, %Y')

    return ok({
        'order_id': order_id,
        'status': 'confirmed',
        'items': purchased_items,
        'total_amount': total_amount,
        'shipping': shipping,
        'payment_method': payment_method,
        'estimated_delivery': est_delivery,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'message': 'Order successfully placed!',
    }, status=201)

