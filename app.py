import os
from werkzeug.utils import secure_filename
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///shop.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

UPLOAD_FOLDER = 'static/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- DATABASE MODELS ---
class Stock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    min_stock = db.Column(db.Integer, default=5)

# NAYA TABLE: Returned Items ke liye
class ReturnedItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    return_date = db.Column(db.DateTime, default=datetime.now)

class InventoryLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(100), nullable=False)
    action = db.Column(db.String(50), nullable=False) # 'Add', 'Sale'
    quantity = db.Column(db.Integer, nullable=False)
    date_time = db.Column(db.DateTime, default=datetime.now)

class Staff(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    mobile = db.Column(db.String(15), nullable=True)
    address = db.Column(db.Text, nullable=True)
    payment_type = db.Column(db.String(20), default='Daily') 
    base_salary = db.Column(db.Float, default=0.0) 
    daily_wage = db.Column(db.Float, default=0.0) 
    balance = db.Column(db.Float, default=0.0)

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False)

class Ledger(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id'), nullable=False)
    date_time = db.Column(db.DateTime, default=datetime.now)
    txn_type = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255))

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    address = db.Column(db.Text, nullable=True) 
    items_details = db.Column(db.Text, nullable=False)
    delivery_date = db.Column(db.Date, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    advance_paid = db.Column(db.Float, default=0.0)
    discount = db.Column(db.Float, default=0.0) 
    status = db.Column(db.String(50), default='Pending')
    is_due_cleared = db.Column(db.Boolean, default=False)

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=True)
    address = db.Column(db.Text, nullable=True) 
    balance = db.Column(db.Float, default=0.0)

# NAYA TABLE: Daily Expenses ke liye
class DailyExpense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date_time = db.Column(db.DateTime, default=datetime.now)

# IN DONO TABLES KO REPLACE KARO
class CustomerLedger(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    date_time = db.Column(db.DateTime, default=datetime.now)
    txn_type = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    items_details = db.Column(db.Text, nullable=True) # Naya field list ke liye

class MenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    desc = db.Column(db.String(255))
    category = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), default='pc')
    image_url = db.Column(db.String(255))
    popular = db.Column(db.Boolean, default=False)
    in_stock = db.Column(db.Boolean, default=True) # Naya field In-Stock switch ke liye

with app.app_context():
    db.create_all()
    # Enable WAL mode for 10x faster saving and no lock errors
    db.session.execute(db.text('PRAGMA journal_mode=WAL;'))
    db.session.commit()

# --- ROUTES ---

# 1. Dashboard Alerts Update
@app.route('/api/dashboard/alerts', methods=['GET'])
def get_dashboard_alerts():
    warning_date = datetime.today().date() + timedelta(days=15)
    expiring_items = Stock.query.filter(Stock.expiry_date <= warning_date, Stock.quantity > 0).all()
    
    order_warning_date = datetime.today().date() + timedelta(days=3)
    upcoming_orders = Order.query.filter(Order.delivery_date <= order_warning_date, Order.status != 'Delivered').all()

    # FIX: Aggregate stock by item_name to prevent duplicate alerts
    all_stock = Stock.query.all()
    item_totals = {}
    for s in all_stock:
        if s.item_name not in item_totals:
            item_totals[s.item_name] = {'quantity': 0, 'min_stock': s.min_stock, 'id': s.id}
        item_totals[s.item_name]['quantity'] += s.quantity
        if s.min_stock:
            item_totals[s.item_name]['min_stock'] = s.min_stock

    low_stock_items = []
    for item_name, data in item_totals.items():
        if data['quantity'] <= (data['min_stock'] or 5):
            low_stock_items.append({
                "id": data['id'],
                "item_name": item_name,
                "quantity": data['quantity'],
                "min_stock": data['min_stock']
            })

    return jsonify({
        "expiring_items": [{"id": i.id, "item_name": i.item_name, "quantity": i.quantity, "expiry_date": i.expiry_date.strftime('%Y-%m-%d')} for i in expiring_items],
        "upcoming_orders": [{"id": o.id, "customer_name": o.customer_name, "delivery_date": o.delivery_date.strftime('%Y-%m-%d'), "status": o.status} for o in upcoming_orders],
        "low_stock_items": low_stock_items
    })

@app.route('/api/inventory', methods=['GET', 'POST'])
def manage_inventory():
    if request.method == 'POST':
        data = request.json
        exp_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        min_stk = int(data.get('min_stock', 5))
        item_name = data['item_name']
        quantity = int(data['quantity'])

        # Check if the same item with the EXACT same expiry date already exists
        existing_stock = Stock.query.filter_by(item_name=item_name, expiry_date=exp_date).first()

        if existing_stock:
            # Agar same expiry wala stock hai, toh bas quantity badha do
            existing_stock.quantity += quantity
            existing_stock.min_stock = min_stk # Min stock update kar dete hain
        else:
            # Agar expiry alag hai, toh naya batch (row) banao
            new_stock = Stock(item_name=item_name, quantity=quantity, expiry_date=exp_date, min_stock=min_stk)
            db.session.add(new_stock)

        # Log the addition
        db.session.add(InventoryLog(item_name=item_name, action='Add', quantity=quantity))
        db.session.commit()
        return jsonify({"message": "Stock processed successfully!"}), 201
    
    # GET method logic remains exactly the same
    items = Stock.query.all()
    return jsonify([{"id": i.id, "item_name": i.item_name, "quantity": i.quantity, "expiry_date": i.expiry_date.strftime('%Y-%m-%d'), "min_stock": i.min_stock} for i in items])

# 3. NEW ROUTE: Delete an item completely from inventory
@app.route('/api/inventory/item/<string:item_name>', methods=['DELETE'])
def delete_item_completely(item_name):
    Stock.query.filter_by(item_name=item_name).delete()
    db.session.commit()
    return jsonify({"message": f"{item_name} completely removed from inventory!"})

# NAYA: Return Stock Route
@app.route('/api/inventory/<int:id>/return', methods=['POST'])
def return_stock(id):
    item = Stock.query.get_or_404(id)
    data = request.json
    ret_qty = int(data.get('quantity', 0))
    
    if item.quantity >= ret_qty:
        item.quantity -= ret_qty
        db.session.add(ReturnedItem(item_name=item.item_name, quantity=ret_qty))
        db.session.commit()
        return jsonify({"message": "Stock returned successfully!"})
    return jsonify({"error": "Stock mein itni quantity nahi hai!"}), 400

# NAYA: Get Returned Items
@app.route('/api/inventory/returned', methods=['GET'])
def get_returned_items():
    items = ReturnedItem.query.order_by(ReturnedItem.return_date.desc()).limit(100).all()
    return jsonify([{"id": i.id, "item_name": i.item_name, "quantity": i.quantity, "return_date": i.return_date.strftime('%Y-%m-%d %I:%M %p')} for i in items])

# NAYA: Stock Out (Sale) Route
@app.route('/api/inventory/<int:id>/out', methods=['POST'])
def stock_out(id):
    item = Stock.query.get_or_404(id)
    data = request.json
    reduce_qty = int(data.get('quantity', 0))
    
    if item.quantity >= reduce_qty:
        item.quantity -= reduce_qty
        db.session.add(InventoryLog(item_name=item.item_name, action='Sale', quantity=reduce_qty))
        db.session.commit()
        return jsonify({"message": "Stock reduced successfully!", "new_quantity": item.quantity})
    return jsonify({"error": "Stock mein itni quantity nahi hai!"}), 400

@app.route('/api/staff', methods=['GET', 'POST'])
def manage_staff():
    if request.method == 'POST':
        data = request.json
        pay_type = data.get('payment_type', 'Daily')
        base_sal = float(data.get('base_salary', 0))
        calc_daily_wage = (base_sal / 30.0) if pay_type == 'Monthly' else base_sal

        new_staff = Staff(name=data['name'], mobile=data.get('mobile', ''), address=data.get('address', ''), payment_type=pay_type, base_salary=base_sal, daily_wage=calc_daily_wage, balance=0.0)
        db.session.add(new_staff)
        db.session.commit()
        return jsonify({"message": "Staff member added!"}), 201
    
    # Client se exact date lena ya IST fallback use karna timezone bug rokne ke liye
    client_date_str = request.args.get('date')
    if client_date_str:
        today = datetime.strptime(client_date_str, '%Y-%m-%d').date()
    else:
        today = (datetime.utcnow() + timedelta(hours=5, minutes=30)).date()
        
    staff_list = Staff.query.all()
    result = []
    for s in staff_list:
        att = Attendance.query.filter_by(staff_id=s.id, date=today).first()
        result.append({"id": s.id, "name": s.name, "mobile": s.mobile, "address": s.address, "payment_type": s.payment_type, "base_salary": s.base_salary, "daily_wage": s.daily_wage, "balance": s.balance, "today_attendance": att.status if att else None})
    return jsonify(result)

@app.route('/api/staff/<int:id>', methods=['PUT'])
def update_staff_profile(id):
    staff = Staff.query.get_or_404(id)
    data = request.json
    staff.name = data.get('name', staff.name)
    staff.mobile = data.get('mobile', staff.mobile)
    staff.address = data.get('address', staff.address)
    pay_type = data.get('payment_type', staff.payment_type)
    base_sal = float(data.get('base_salary', staff.base_salary))
    staff.payment_type = pay_type
    staff.base_salary = base_sal
    staff.daily_wage = (base_sal / 30.0) if pay_type == 'Monthly' else base_sal
    db.session.commit()
    return jsonify({"message": "Profile updated!"})

@app.route('/api/staff/<int:id>/history', methods=['GET'])
def get_staff_history(id):
    logs = Ledger.query.filter_by(staff_id=id).order_by(Ledger.date_time.desc()).all()
    return jsonify([{"id": l.id, "date": l.date_time.strftime('%Y-%m-%d %H:%M'), "txn_type": l.txn_type, "amount": round(l.amount, 2), "description": l.description} for l in logs])

@app.route('/api/staff/<int:id>/attendance', methods=['POST'])
def mark_attendance(id):
    staff = Staff.query.get_or_404(id)
    data = request.json
    status = data.get('status')
    att_date = datetime.strptime(data.get('date'), '%Y-%m-%d').date()
    existing = Attendance.query.filter_by(staff_id=id, date=att_date).first()
    wage_added = staff.daily_wage if status == 'Present' else (staff.daily_wage / 2 if status == 'Half Day' else 0)

    if existing:
        old_wage = staff.daily_wage if existing.status == 'Present' else (staff.daily_wage / 2 if existing.status == 'Half Day' else 0)
        staff.balance -= old_wage
        staff.balance += wage_added
        existing.status = status
        db.session.add(Ledger(staff_id=id, txn_type='Edit', amount=wage_added, description=f"Attendance changed to {status}"))
    else:
        db.session.add(Attendance(staff_id=id, date=att_date, status=status))
        staff.balance += wage_added
        if wage_added > 0:
            db.session.add(Ledger(staff_id=id, txn_type='Wage', amount=wage_added, description=f"{status} on {att_date}"))
    db.session.commit()
    return jsonify({"message": "Attendance marked!", "balance": staff.balance})

@app.route('/api/staff/<int:id>/advance_clear', methods=['POST'])
def staff_advance_clear(id):
    staff = Staff.query.get_or_404(id)
    data = request.json
    action = data.get('action')
    note = data.get('note', '')

    if action == 'advance':
        amount = float(data.get('amount', 0))
        desc = note if note else 'Cash Advance Given'
        staff.balance -= amount
        db.session.add(Ledger(staff_id=id, txn_type='Advance', amount=amount, description=desc))
    elif action == 'clear':
        cleared_amt = staff.balance
        staff.balance = 0.0
        desc = note if note else 'Month End Settlement'
        db.session.add(Ledger(staff_id=id, txn_type='Settle', amount=cleared_amt, description=desc))
    db.session.commit()
    return jsonify({"message": "Account updated!", "balance": staff.balance})

@app.route('/api/orders', methods=['GET', 'POST'])
def manage_orders():
    if request.method == 'POST':
        data = request.json
        del_date = datetime.strptime(data['delivery_date'], '%Y-%m-%d').date()
        due = float(data['total_amount']) - float(data.get('advance_paid', 0))
        discount = float(data.get('discount', 0.0))
        
        new_order = Order(
            customer_name=data['customer_name'], phone=data.get('phone', ''),
            address=data.get('address', ''), items_details=data['items_details'], 
            delivery_date=del_date, total_amount=float(data['total_amount']), 
            advance_paid=float(data.get('advance_paid', 0)), discount=discount, is_due_cleared=(due <= 0)
        )
        db.session.add(new_order)
        db.session.commit()
        return jsonify({"message": "Order created!"}), 201
    
    orders = Order.query.order_by(Order.delivery_date.asc()).all()
    return jsonify([{
        "id": o.id, "customer_name": o.customer_name, "phone": o.phone, "address": o.address, 
        "items_details": o.items_details, "delivery_date": o.delivery_date.strftime('%Y-%m-%d'),
        "total_amount": o.total_amount, "advance_paid": o.advance_paid, 
        "discount": o.discount, "status": o.status, "is_due_cleared": o.is_due_cleared
    } for o in orders])

@app.route('/api/orders/<int:id>/status', methods=['PUT'])
def update_order_status(id):
    order = Order.query.get_or_404(id)
    data = request.json
    new_status = data.get('status')

    if new_status == 'Delivered' and order.status != 'Delivered':
        paid_now = float(data.get('paid_now', 0))
        action = data.get('action') 
        
        order.advance_paid += paid_now 
        due_amount = order.total_amount - order.advance_paid

        if action == 'udhari' and due_amount > 0:
            customer = Customer.query.filter_by(phone=order.phone).first()
            if not customer:
                customer = Customer(name=order.customer_name, phone=order.phone, address=order.address, balance=due_amount)
                db.session.add(customer)
                db.session.flush() 
                # Yahan items_details pass kiya gaya hai
                db.session.add(CustomerLedger(customer_id=customer.id, txn_type=f'Order #{order.id} Due', amount=due_amount, items_details=order.items_details))
            else:
                customer.balance += due_amount
                db.session.add(CustomerLedger(customer_id=customer.id, txn_type=f'Order #{order.id} Due', amount=due_amount, items_details=order.items_details))
            order.is_due_cleared = False
        else:
            if due_amount > 0:
                order.discount = due_amount
            order.is_due_cleared = True 

    order.status = new_status
    db.session.commit()
    return jsonify({"message": "Status updated and synced with Udhari book!"})

@app.route('/api/orders/<int:id>', methods=['DELETE'])
def delete_order(id):
    order = Order.query.get_or_404(id)
    db.session.delete(order)
    db.session.commit()
    return jsonify({"message": "Order deleted successfully!"})

@app.route('/api/customers', methods=['GET', 'POST'])
def manage_customers():
    if request.method == 'POST':
        data = request.json
        db.session.add(Customer(name=data['name'], phone=data.get('phone', ''), address=data.get('address', ''), balance=0.0))
        db.session.commit()
        return jsonify({"message": "Customer added!"}), 201
    
    customers = Customer.query.all()
    return jsonify([{"id": c.id, "name": c.name, "phone": c.phone, "address": c.address, "balance": c.balance} for c in customers])

@app.route('/api/customers/<int:id>/transaction', methods=['POST'])
def customer_transaction(id):
    customer = Customer.query.get_or_404(id)
    data = request.json
    action = data.get('action')
    amount = float(data.get('amount', 0))
    items_details = data.get('items_details', '')

    if action == 'give_udhar':
        customer.balance += amount
        db.session.add(CustomerLedger(customer_id=id, txn_type='Udhar Given', amount=amount, items_details=items_details))
    elif action == 'receive_payment':
        customer.balance -= amount
        db.session.add(CustomerLedger(customer_id=id, txn_type='Payment Received', amount=amount))
        if customer.balance <= 0:
            orders = Order.query.filter_by(phone=customer.phone).all()
            for o in orders:
                o.is_due_cleared = True

    db.session.commit()
    return jsonify({"message": "Transaction successful!", "balance": customer.balance})

@app.route('/api/customers/<int:id>/history', methods=['GET'])
def get_customer_history(id):
    logs = CustomerLedger.query.filter_by(customer_id=id).order_by(CustomerLedger.date_time.desc()).all()
    return jsonify([{
        "id": l.id, 
        "date": l.date_time.strftime('%Y-%m-%d %I:%M %p'), 
        "txn_type": l.txn_type, 
        "amount": round(l.amount, 2), 
        "items_details": l.items_details or '-'
    } for l in logs])

@app.route('/api/customers/<int:id>', methods=['DELETE'])
def delete_customer(id):
    customer = Customer.query.get_or_404(id)
    # Pehle us customer ka sara ledger/history delete karenge taki database me error na aaye
    CustomerLedger.query.filter_by(customer_id=id).delete()
    # Phir customer ko delete karenge
    db.session.delete(customer)
    db.session.commit()
    return jsonify({"message": f"Customer {customer.name} aur unka khata delete ho gaya!"})

@app.route('/api/reports', methods=['GET'])
def get_all_reports():
    inv_logs = InventoryLog.query.order_by(InventoryLog.date_time.desc()).limit(200).all()
    ret_items = ReturnedItem.query.order_by(ReturnedItem.return_date.desc()).limit(100).all()
    staff_logs_q = db.session.query(Ledger, Staff.name).join(Staff, Ledger.staff_id == Staff.id).order_by(Ledger.date_time.desc()).limit(200).all()
    cust_logs_q = db.session.query(CustomerLedger, Customer.name).join(Customer, CustomerLedger.customer_id == Customer.id).order_by(CustomerLedger.date_time.desc()).limit(200).all()
    
    reports = {
        "inventory": [{"id": i.id, "item_name": i.item_name, "action": i.action, "quantity": i.quantity, "date": i.date_time.strftime('%Y-%m-%d %I:%M %p')} for i in inv_logs],
        "returns": [{"id": r.id, "item_name": r.item_name, "quantity": r.quantity, "date": r.return_date.strftime('%Y-%m-%d %I:%M %p')} for r in ret_items],
        "staff": [{"id": l[0].id, "staff_id": l[0].staff_id, "staff_name": l[1], "txn_type": l[0].txn_type, "amount": l[0].amount, "description": l[0].description, "date": l[0].date_time.strftime('%Y-%m-%d %I:%M %p')} for l in staff_logs_q],
        "customers": [{"id": c[0].id, "customer_id": c[0].customer_id, "customer_name": c[1], "txn_type": c[0].txn_type, "amount": c[0].amount, "date": c[0].date_time.strftime('%Y-%m-%d %I:%M %p')} for c in cust_logs_q]
    }
    return jsonify(reports)

@app.route('/api/menu', methods=['GET', 'POST'])
def manage_menu():
    if request.method == 'POST':
        name = request.form.get('name')
        desc = request.form.get('desc')
        category = request.form.get('category')
        price = float(request.form.get('price', 0))
        unit = request.form.get('unit', 'pc')
        popular = request.form.get('popular') == 'true'
        in_stock = request.form.get('in_stock', 'true') == 'true'
        
        image_url = ''
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                filename = secure_filename(file.filename)
                filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                image_url = f"/static/uploads/{filename}"
        
        new_item = MenuItem(name=name, desc=desc, category=category, price=price, unit=unit, image_url=image_url, popular=popular, in_stock=in_stock)
        db.session.add(new_item)
        db.session.commit()
        return jsonify({"message": "Menu item added!"}), 201
    
    items = MenuItem.query.all()
    return jsonify([{"id": i.id, "name": i.name, "desc": i.desc, "category": i.category, "price": i.price, "unit": i.unit, "image_url": i.image_url, "popular": i.popular, "in_stock": i.in_stock} for i in items])

@app.route('/api/menu/<int:id>', methods=['PUT', 'DELETE'])
def update_menu_item(id):
    item = MenuItem.query.get_or_404(id)
    if request.method == 'DELETE':
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Item deleted!"})
    
    if request.method == 'PUT':
        item.name = request.form.get('name', item.name)
        item.desc = request.form.get('desc', item.desc)
        item.category = request.form.get('category', item.category)
        item.price = float(request.form.get('price', item.price))
        item.unit = request.form.get('unit', item.unit)
        item.popular = request.form.get('popular') == 'true'
        item.in_stock = request.form.get('in_stock') == 'true'
        
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                filename = secure_filename(file.filename)
                filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                item.image_url = f"/static/uploads/{filename}"
        
        db.session.commit()
        return jsonify({"message": "Menu item updated!"})

# NEW ROUTES: Expenses aur Staff Pay ke liye
@app.route('/api/expenses', methods=['GET', 'POST'])
def manage_expenses():
    if request.method == 'POST':
        data = request.json
        new_exp = DailyExpense(item_name=data['item_name'], amount=float(data['amount']))
        db.session.add(new_exp)
        db.session.commit()
        return jsonify({"message": "Expense added!"}), 201
    
    today = datetime.today().date()
    expenses = DailyExpense.query.filter(db.func.date(DailyExpense.date_time) == today).all()
    total = sum(e.amount for e in expenses)
    return jsonify({
        "total_today": total,
        "items": [{"id": e.id, "item_name": e.item_name, "amount": e.amount, "date": e.date_time.strftime('%I:%M %p')} for e in expenses]
    })

@app.route('/api/staff/today_pay', methods=['GET'])
def get_today_staff_pay():
    today = datetime.today().date()
    logs = Ledger.query.filter(db.func.date(Ledger.date_time) == today, Ledger.txn_type == 'Advance').all()
    total_pay = sum(l.amount for l in logs)
    return jsonify({"total_pay_today": total_pay})

@app.route('/api/expenses/<int:id>', methods=['DELETE'])
def delete_expense(id):
    expense = DailyExpense.query.get_or_404(id)
    db.session.delete(expense)
    db.session.commit()
    return jsonify({"message": "Expense deleted!"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)