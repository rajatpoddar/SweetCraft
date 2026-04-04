import os
import re
from werkzeug.utils import secure_filename
from flask import Flask, jsonify, request, g, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import atexit
from backup_manager import BackupManager

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'default_secret')

# CORS - restrict to frontend URL in production
frontend_url = os.getenv('FRONTEND_URL', '*')
CORS(app, origins=frontend_url)

# PostgreSQL configuration with SQLite fallback
db_uri = os.getenv('DB_URI')
if not db_uri:
    # Default to PostgreSQL if available, else SQLite
    pg_host = os.getenv('POSTGRES_HOST', 'localhost')
    pg_port = os.getenv('POSTGRES_PORT', '5432')
    pg_db = os.getenv('POSTGRES_DB', 'sweetcraft')
    pg_user = os.getenv('POSTGRES_USER', 'postgres')
    pg_pass = os.getenv('POSTGRES_PASSWORD', 'postgres')
    db_uri = f'postgresql://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}'

app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

UPLOAD_FOLDER = 'static/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize Backup Manager
backup_manager = BackupManager()

# Initialize Scheduler for automatic backups
scheduler = BackgroundScheduler()
scheduler.start()

# Schedule daily backup at 2 AM
scheduler.add_job(
    func=backup_manager.perform_daily_backup,
    trigger=CronTrigger(hour=2, minute=0),  # Daily at 2:00 AM
    id='daily_backup',
    name='Daily Database Backup',
    replace_existing=True
)

# Shutdown scheduler when app exits
atexit.register(lambda: scheduler.shutdown())

print("✅ Automatic backup scheduler initialized - Daily backups at 2:00 AM")

# --- MULTI-TENANT HELPER ---
def get_shop_id():
    """
    Request se current shop ka ID lao.
    Frontend 'X-Shop-Username' header bhejta hai.
    Isse har shop ka data alag rehta hai.
    """
    username = request.headers.get('X-Shop-Username', 'admin')
    admin = Admin.query.filter_by(username=username).first()
    if admin:
        return admin.id
    return 1  # default fallback

# --- DATABASE MODELS ---
class Stock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, default=1, nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    min_stock = db.Column(db.Integer, default=5)

class ReturnedItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, default=1, nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    return_date = db.Column(db.DateTime, default=datetime.now)

class InventoryLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, default=1, nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    date_time = db.Column(db.DateTime, default=datetime.now)

class Staff(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, default=1, nullable=False)
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
    shop_id = db.Column(db.Integer, default=1, nullable=False)
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
    shop_id = db.Column(db.Integer, default=1, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=True)
    address = db.Column(db.Text, nullable=True)
    balance = db.Column(db.Float, default=0.0)

class DailyExpense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, default=1, nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, default=1.0)
    unit = db.Column(db.String(20), default='kg')
    amount = db.Column(db.Float, nullable=False)
    date_time = db.Column(db.DateTime, default=datetime.now)
    mahajan_id = db.Column(db.Integer, db.ForeignKey('mahajan.id'), nullable=True)
    payment_status = db.Column(db.String(20), default='Paid')

class CustomerLedger(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    date_time = db.Column(db.DateTime, default=datetime.now)
    txn_type = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    items_details = db.Column(db.Text, nullable=True)

class MenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, default=1, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    desc = db.Column(db.String(255))
    category = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), default='pc')
    image_url = db.Column(db.String(255))
    popular = db.Column(db.Boolean, default=False)
    in_stock = db.Column(db.Boolean, default=True)

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

class ShopSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, default=1, nullable=False, unique=True)
    shop_name = db.Column(db.String(100), default='SweetCraft')
    tagline = db.Column(db.String(255), default='Premium Sweets & Snacks')
    owner_name = db.Column(db.String(100), default='')
    phone = db.Column(db.String(15), default='+91 98765 43210')
    phone2 = db.Column(db.String(15), default='')
    address = db.Column(db.Text, default='Main Market')
    city = db.Column(db.String(100), default='Deoghar, Jharkhand')
    upi_id = db.Column(db.String(100), default='')
    gstin = db.Column(db.String(20), default='')
    footer_note = db.Column(db.String(255), default='Thank you for your business!')

class ShopOwner(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    shop_name = db.Column(db.String(100), nullable=False)
    owner_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), default='')
    city = db.Column(db.String(100), default='')
    admin_username = db.Column(db.String(50), default='')
    is_active = db.Column(db.Boolean, default=True)
    plan = db.Column(db.String(50), default='Free')
    joined_date = db.Column(db.DateTime, default=datetime.now)

class SuperAdmin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

class Mahajan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, default=1, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15))
    balance = db.Column(db.Float, default=0.0)

class MahajanLedger(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mahajan_id = db.Column(db.Integer, db.ForeignKey('mahajan.id'), nullable=False)
    date_time = db.Column(db.DateTime, default=datetime.now)
    txn_type = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255))

class MahajanBill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mahajan_id = db.Column(db.Integer, db.ForeignKey('mahajan.id'), nullable=False)
    shop_id = db.Column(db.Integer, default=1, nullable=False)
    date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255))
    bill_image = db.Column(db.String(255))  # filename of uploaded bill
    created_at = db.Column(db.DateTime, default=datetime.now)

class DailyIncome(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, default=1, nullable=False)
    payment_mode = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255))
    date_time = db.Column(db.DateTime, default=datetime.now)

class DailyPrinciple(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, default=1, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255))
    date_time = db.Column(db.DateTime, default=datetime.now)

with app.app_context():
    db.create_all()
    if not Admin.query.filter_by(username='admin').first():
        admin_pass = os.getenv('ADMIN_PASSWORD', 'admin123')
        hashed_pw = generate_password_hash(admin_pass)
        new_admin = Admin(username='admin', password_hash=hashed_pw)
        db.session.add(new_admin)
        db.session.flush()
        # Admin 1 ke liye default ShopSettings
        if not ShopSettings.query.filter_by(shop_id=new_admin.id if new_admin.id else 1).first():
            db.session.add(ShopSettings(shop_id=1))
    if not SuperAdmin.query.filter_by(username='superadmin').first():
        sa_pass = os.getenv('SUPERADMIN_PASSWORD', 'superadmin123')
        hashed_sa = generate_password_hash(sa_pass)
        db.session.add(SuperAdmin(username='superadmin', password_hash=hashed_sa))
    # Ensure shop_id=1 settings exist
    admin_obj = Admin.query.filter_by(username='admin').first()
    if admin_obj and not ShopSettings.query.filter_by(shop_id=admin_obj.id).first():
        db.session.add(ShopSettings(shop_id=admin_obj.id))
    
    # Only set WAL mode for SQLite
    if 'sqlite' in app.config['SQLALCHEMY_DATABASE_URI']:
        db.session.execute(db.text('PRAGMA journal_mode=WAL;'))
    
    db.session.commit()

# --- ROUTES ---



# --- SECURE LOGIN ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    admin = Admin.query.filter_by(username=data.get('username')).first()
    if admin and check_password_hash(admin.password_hash, data.get('password')):
        shop = ShopOwner.query.filter_by(admin_username=admin.username).first()
        if shop and not shop.is_active:
            return jsonify({"error": "Aapki dukaan ka access suspend kar diya gaya hai. Super Admin se sampark karein."}), 403
        # Ensure ShopSettings exists for this admin (auto-populated from ShopOwner data)
        if not ShopSettings.query.filter_by(shop_id=admin.id).first():
            shop_name = shop.shop_name if shop else 'SweetCraft'
            db.session.add(ShopSettings(
                shop_id=admin.id, shop_name=shop_name,
                owner_name=shop.owner_name if shop else '',
                phone=shop.phone if shop else '',
                city=shop.city if shop else ''
            ))
            db.session.commit()
        return jsonify({"message": "Login successful", "token": "sweetcraft_secure_token", "username": admin.username}), 200
    return jsonify({"error": "Invalid credentials"}), 401


# ============================================================
#  DASHBOARD
# ============================================================

@app.route('/api/dashboard/alerts', methods=['GET'])
def get_dashboard_alerts():
    sid = get_shop_id()
    warning_date = datetime.today().date() + timedelta(days=15)
    expiring_items = Stock.query.filter(
        Stock.shop_id == sid,
        Stock.expiry_date <= warning_date,
        Stock.quantity > 0
    ).all()

    order_warning_date = datetime.today().date() + timedelta(days=3)
    upcoming_orders = Order.query.filter(
        Order.shop_id == sid,
        Order.delivery_date <= order_warning_date,
        Order.status != 'Delivered'
    ).all()

    all_stock = Stock.query.filter_by(shop_id=sid).all()
    item_totals = {}
    for s in all_stock:
        if s.item_name not in item_totals:
            item_totals[s.item_name] = {'quantity': 0, 'min_stock': s.min_stock, 'id': s.id}
        item_totals[s.item_name]['quantity'] += s.quantity
        if s.min_stock:
            item_totals[s.item_name]['min_stock'] = s.min_stock

    low_stock_items = [
        {"id": v['id'], "item_name": k, "quantity": v['quantity'], "min_stock": v['min_stock']}
        for k, v in item_totals.items() if v['quantity'] <= (v['min_stock'] or 5)
    ]

    return jsonify({
        "expiring_items": [{"id": i.id, "item_name": i.item_name, "quantity": i.quantity, "expiry_date": i.expiry_date.strftime('%Y-%m-%d')} for i in expiring_items],
        "upcoming_orders": [{"id": o.id, "customer_name": o.customer_name, "delivery_date": o.delivery_date.strftime('%Y-%m-%d'), "status": o.status} for o in upcoming_orders],
        "low_stock_items": low_stock_items
    })


@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    sid = get_shop_id()
    date_param = request.args.get('date')
    today = datetime.strptime(date_param, '%Y-%m-%d').date() if date_param else datetime.today().date()

    # Staff ke jo staff is shop ke hain unka advance
    shop_staff_ids = [s.id for s in Staff.query.filter_by(shop_id=sid).all()]
    staff_logs = Ledger.query.filter(
        Ledger.staff_id.in_(shop_staff_ids),
        db.func.date(Ledger.date_time) == today,
        Ledger.txn_type == 'Advance'
    ).all() if shop_staff_ids else []
    total_staff_pay = sum(l.amount for l in staff_logs)

    expenses = DailyExpense.query.filter(
        DailyExpense.shop_id == sid,
        db.func.date(DailyExpense.date_time) == today
    ).all()
    total_expense = sum(e.amount for e in expenses)

    incomes = DailyIncome.query.filter(
        DailyIncome.shop_id == sid,
        db.func.date(DailyIncome.date_time) == today
    ).all()
    total_cash = sum(i.amount for i in incomes if i.payment_mode == 'Cash')
    total_online = sum(i.amount for i in incomes if i.payment_mode == 'Online')
    total_income = total_cash + total_online
    
    # Principle calculation
    principles = DailyPrinciple.query.filter(
        DailyPrinciple.shop_id == sid,
        db.func.date(DailyPrinciple.date_time) == today
    ).all()
    total_principle = sum(p.amount for p in principles)
    
    # New calculation: Net Income = Total Expense + Staff Pay + Principle - (Cash + Online)
    net_income = total_expense + total_staff_pay + total_principle - total_income

    return jsonify({
        "total_income": total_income, "total_cash": total_cash, "total_online": total_online,
        "total_expense": total_expense, "total_staff_pay": total_staff_pay, 
        "total_principle": total_principle, "net_income": net_income
    })


# ============================================================
#  INVENTORY
# ============================================================

@app.route('/api/inventory', methods=['GET', 'POST'])
def manage_inventory():
    sid = get_shop_id()
    if request.method == 'POST':
        data = request.json
        exp_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        min_stk = int(data.get('min_stock', 5))
        item_name = data['item_name']
        quantity = int(data['quantity'])

        existing_stock = Stock.query.filter_by(shop_id=sid, item_name=item_name, expiry_date=exp_date).first()
        if existing_stock:
            existing_stock.quantity += quantity
            existing_stock.min_stock = min_stk
        else:
            db.session.add(Stock(shop_id=sid, item_name=item_name, quantity=quantity, expiry_date=exp_date, min_stock=min_stk))

        db.session.add(InventoryLog(shop_id=sid, item_name=item_name, action='Add', quantity=quantity))
        db.session.commit()
        return jsonify({"message": "Stock processed successfully!"}), 201

    items = Stock.query.filter_by(shop_id=sid).all()
    return jsonify([{"id": i.id, "item_name": i.item_name, "quantity": i.quantity, "expiry_date": i.expiry_date.strftime('%Y-%m-%d'), "min_stock": i.min_stock} for i in items])


@app.route('/api/inventory/item/<string:item_name>', methods=['DELETE'])
def delete_item_completely(item_name):
    sid = get_shop_id()
    Stock.query.filter_by(shop_id=sid, item_name=item_name).delete()
    db.session.commit()
    return jsonify({"message": f"{item_name} removed from inventory!"})


@app.route('/api/inventory/<int:id>/return', methods=['POST'])
def return_stock(id):
    sid = get_shop_id()
    item = Stock.query.filter_by(id=id, shop_id=sid).first_or_404()
    data = request.json
    ret_qty = int(data.get('quantity', 0))
    if item.quantity >= ret_qty:
        item.quantity -= ret_qty
        db.session.add(ReturnedItem(shop_id=sid, item_name=item.item_name, quantity=ret_qty))
        db.session.commit()
        return jsonify({"message": "Stock returned successfully!"})
    return jsonify({"error": "Stock mein itni quantity nahi hai!"}), 400


@app.route('/api/inventory/returned', methods=['GET'])
def get_returned_items():
    sid = get_shop_id()
    items = ReturnedItem.query.filter_by(shop_id=sid).order_by(ReturnedItem.return_date.desc()).limit(100).all()
    return jsonify([{"id": i.id, "item_name": i.item_name, "quantity": i.quantity, "return_date": i.return_date.strftime('%Y-%m-%d %I:%M %p')} for i in items])


@app.route('/api/inventory/<int:id>/out', methods=['POST'])
def stock_out(id):
    sid = get_shop_id()
    item = Stock.query.filter_by(id=id, shop_id=sid).first_or_404()
    data = request.json
    reduce_qty = int(data.get('quantity', 0))
    if item.quantity >= reduce_qty:
        item.quantity -= reduce_qty
        db.session.add(InventoryLog(shop_id=sid, item_name=item.item_name, action='Sale', quantity=reduce_qty))
        db.session.commit()
        return jsonify({"message": "Stock reduced successfully!", "new_quantity": item.quantity})
    return jsonify({"error": "Stock mein itni quantity nahi hai!"}), 400


# ============================================================
#  STAFF
# ============================================================

@app.route('/api/staff', methods=['GET', 'POST'])
def manage_staff():
    sid = get_shop_id()
    if not sid:
        return jsonify({"error": "Unauthorized"}), 401

    if request.method == 'POST':
        data = request.get_json()
        new_staff = Staff(
            shop_id=sid,
            name=data['name'],
            mobile=data['mobile'],
            address=data.get('address', ''),
            payment_type=data['payment_type'],
            base_salary=float(data['base_salary']) if data.get('base_salary') else 0.0,
            daily_wage=float(data['daily_wage']) if data.get('daily_wage') else 0.0,
            balance=float(data.get('balance', 0.0))
        )
        db.session.add(new_staff)
        db.session.commit()
        return jsonify({"message": "Staff added"}), 201

    client_date_str = request.args.get('date')
    today = datetime.strptime(client_date_str, '%Y-%m-%d').date() if client_date_str else (datetime.utcnow() + timedelta(hours=5, minutes=30)).date()

    staff_list = Staff.query.filter_by(shop_id=sid).all()
    result = []
    for s in staff_list:
        att = Attendance.query.filter_by(staff_id=s.id, date=today).first()
        
        # Aaj ka Advance payment check karna
        today_paid_record = Ledger.query.filter(
            Ledger.staff_id == s.id,
            Ledger.txn_type == 'Advance',
            db.func.date(Ledger.date_time) == today
        ).first()
        
        today_paid = today_paid_record is not None

        result.append({
            "id": s.id, 
            "name": s.name, 
            "mobile": s.mobile, 
            "address": s.address,
            "payment_type": s.payment_type, 
            "base_salary": s.base_salary,
            "daily_wage": s.daily_wage, 
            "balance": s.balance,
            "today_attendance": att.status if att else None,
            "today_paid": today_paid
        })
    return jsonify(result)
    sid = get_shop_id()
    if request.method == 'POST':
        data = request.json
        pay_type = data.get('payment_type', 'Daily')
        base_sal = float(data.get('base_salary', 0))
        calc_daily_wage = (base_sal / 30.0) if pay_type == 'Monthly' else base_sal
        db.session.add(Staff(
            shop_id=sid, name=data['name'], mobile=data.get('mobile', ''),
            address=data.get('address', ''), payment_type=pay_type,
            base_salary=base_sal, daily_wage=calc_daily_wage, balance=0.0
        ))
        db.session.commit()
        return jsonify({"message": "Staff member added!"}), 201

    client_date_str = request.args.get('date')
    today = datetime.strptime(client_date_str, '%Y-%m-%d').date() if client_date_str else (datetime.utcnow() + timedelta(hours=5, minutes=30)).date()

    staff_list = Staff.query.filter_by(shop_id=sid).all()
    result = []
    for s in staff_list:
        att = Attendance.query.filter_by(staff_id=s.id, date=today).first()
        result.append({"id": s.id, "name": s.name, "mobile": s.mobile, "address": s.address,
                        "payment_type": s.payment_type, "base_salary": s.base_salary,
                        "daily_wage": s.daily_wage, "balance": s.balance,
                        "today_attendance": att.status if att else None})
    return jsonify(result)


@app.route('/api/staff/today_pay', methods=['GET'])
def get_today_staff_pay():
    sid = get_shop_id()
    today = datetime.today().date()
    shop_staff_ids = [s.id for s in Staff.query.filter_by(shop_id=sid).all()]
    logs = Ledger.query.filter(
        Ledger.staff_id.in_(shop_staff_ids),
        db.func.date(Ledger.date_time) == today,
        Ledger.txn_type == 'Advance'
    ).all() if shop_staff_ids else []
    return jsonify({"total_pay_today": sum(l.amount for l in logs)})


@app.route('/api/staff/<int:id>', methods=['PUT'])
def update_staff_profile(id):
    sid = get_shop_id()
    staff = Staff.query.filter_by(id=id, shop_id=sid).first_or_404()
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
        staff.balance -= amount
        db.session.add(Ledger(staff_id=id, txn_type='Advance', amount=amount, description=note or 'Cash Advance Given'))
    elif action == 'clear':
        cleared_amt = staff.balance
        staff.balance = 0.0
        db.session.add(Ledger(staff_id=id, txn_type='Settle', amount=cleared_amt, description=note or 'Month End Settlement'))
    db.session.commit()
    return jsonify({"message": "Account updated!", "balance": staff.balance})


@app.route('/api/staff/<int:id>', methods=['DELETE'])
def delete_staff(id):
    staff = Staff.query.get_or_404(id)
    Attendance.query.filter_by(staff_id=id).delete()
    Ledger.query.filter_by(staff_id=id).delete()
    db.session.delete(staff)
    db.session.commit()
    return jsonify({"message": f"Staff {staff.name} aur unka poora record delete ho gaya!"})


# ============================================================
#  ORDERS
# ============================================================

@app.route('/api/orders', methods=['GET', 'POST'])
def manage_orders():
    sid = get_shop_id()
    if request.method == 'POST':
        data = request.json
        del_date = datetime.strptime(data['delivery_date'], '%Y-%m-%d').date()
        
        # Safe conversion of advance_paid - handle empty strings, None, etc.
        advance_paid_raw = data.get('advance_paid', 0)
        try:
            advance_paid = float(advance_paid_raw) if advance_paid_raw not in ['', None] else 0.0
        except (ValueError, TypeError):
            advance_paid = 0.0
        
        # Safe conversion of discount
        discount_raw = data.get('discount', 0)
        try:
            discount = float(discount_raw) if discount_raw not in ['', None] else 0.0
        except (ValueError, TypeError):
            discount = 0.0
        
        total_amount = float(data['total_amount'])
        due = total_amount - advance_paid
        
        new_order = Order(
            shop_id=sid, customer_name=data['customer_name'], phone=data.get('phone', ''),
            address=data.get('address', ''), items_details=data['items_details'],
            delivery_date=del_date, total_amount=total_amount,
            advance_paid=advance_paid, discount=discount,
            is_due_cleared=(due <= 0)
        )
        db.session.add(new_order)
        db.session.commit()
        return jsonify({"message": "Order created!"}), 201

    orders = Order.query.filter_by(shop_id=sid).order_by(Order.delivery_date.asc()).all()
    return jsonify([{
        "id": o.id, "customer_name": o.customer_name, "phone": o.phone, "address": o.address,
        "items_details": o.items_details, "delivery_date": o.delivery_date.strftime('%Y-%m-%d'),
        "total_amount": o.total_amount, "advance_paid": o.advance_paid,
        "discount": o.discount, "status": o.status, "is_due_cleared": o.is_due_cleared
    } for o in orders])


@app.route('/api/orders/<int:id>/status', methods=['PUT'])
def update_order_status(id):
    sid = get_shop_id()
    order = Order.query.filter_by(id=id, shop_id=sid).first_or_404()
    data = request.json
    new_status = data.get('status')

    if new_status == 'Delivered' and order.status != 'Delivered':
        # Safe conversion of paid_now - handle empty strings, None, etc.
        paid_now_raw = data.get('paid_now', 0)
        try:
            paid_now = float(paid_now_raw) if paid_now_raw not in ['', None] else 0.0
        except (ValueError, TypeError):
            paid_now = 0.0
        
        action = data.get('action')
        order.advance_paid += paid_now
        due_amount = order.total_amount - order.advance_paid

        if action == 'udhari' and due_amount > 0:
            customer = Customer.query.filter_by(shop_id=sid, phone=order.phone).first()
            if not customer:
                customer = Customer(shop_id=sid, name=order.customer_name, phone=order.phone, address=order.address, balance=due_amount)
                db.session.add(customer)
                db.session.flush()
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
    return jsonify({"message": "Status updated!"})


@app.route('/api/orders/<int:id>', methods=['DELETE'])
def delete_order(id):
    sid = get_shop_id()
    order = Order.query.filter_by(id=id, shop_id=sid).first_or_404()
    db.session.delete(order)
    db.session.commit()
    return jsonify({"message": "Order deleted successfully!"})


# ============================================================
#  CUSTOMERS (Market Udhari)
# ============================================================

@app.route('/api/customers', methods=['GET', 'POST'])
def manage_customers():
    sid = get_shop_id()
    if request.method == 'POST':
        data = request.json
        db.session.add(Customer(shop_id=sid, name=data['name'], phone=data.get('phone', ''), address=data.get('address', ''), balance=0.0))
        db.session.commit()
        return jsonify({"message": "Customer added!"}), 201

    customers = Customer.query.filter_by(shop_id=sid).all()
    today = datetime.today().date()
    today_udhar = 0
    # CustomerLedger se aaj ka udhar
    for c in customers:
        logs = CustomerLedger.query.filter(CustomerLedger.customer_id == c.id, db.func.date(CustomerLedger.date_time) == today, CustomerLedger.amount > 0).all()
        for log in logs:
            if 'Due' in log.txn_type or 'Udhar Given' in log.txn_type:
                today_udhar += log.amount
                
    return jsonify({
        "customers": [{"id": c.id, "name": c.name, "phone": c.phone, "address": c.address, "balance": c.balance} for c in customers],
        "today_udhar": today_udhar,
        "total_udhar": sum(c.balance for c in customers)
    })


@app.route('/api/customers/<int:id>/transaction', methods=['POST'])
def customer_transaction(id):
    sid = get_shop_id()
    customer = Customer.query.filter_by(id=id, shop_id=sid).first_or_404()
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
            for o in Order.query.filter_by(shop_id=sid, phone=customer.phone).all():
                o.is_due_cleared = True

    db.session.commit()
    return jsonify({"message": "Transaction successful!", "balance": customer.balance})


@app.route('/api/customers/<int:id>/history', methods=['GET'])
def get_customer_history(id):
    logs = CustomerLedger.query.filter_by(customer_id=id).order_by(CustomerLedger.date_time.desc()).all()
    return jsonify([{
        "id": l.id, "date": l.date_time.strftime('%Y-%m-%d %I:%M %p'),
        "txn_type": l.txn_type, "amount": round(l.amount, 2),
        "items_details": l.items_details or '-'
    } for l in logs])


@app.route('/api/customers/<int:id>', methods=['DELETE'])
def delete_customer(id):
    sid = get_shop_id()
    customer = Customer.query.filter_by(id=id, shop_id=sid).first_or_404()
    CustomerLedger.query.filter_by(customer_id=id).delete()
    db.session.delete(customer)
    db.session.commit()
    return jsonify({"message": f"Customer {customer.name} aur unka khata delete ho gaya!"})


# ============================================================
#  EXPENSES
# ============================================================

@app.route('/api/expenses/suggest', methods=['GET'])
def expense_suggestions():
    sid = get_shop_id()
    items = db.session.query(DailyExpense.item_name).filter_by(shop_id=sid).distinct().all()
    return jsonify([i[0] for i in items])


@app.route('/api/expenses', methods=['GET', 'POST'])
def manage_expenses():
    sid = get_shop_id()
    if request.method == 'POST':
        data = request.json
        mahajan_id = data.get('mahajan_id')
        payment_status = data.get('payment_status', 'Paid')
        amount = float(data['amount'])
        qty = float(data.get('quantity', 1.0))
        unit = data.get('unit', 'kg')

        new_exp = DailyExpense(
            shop_id=sid, item_name=data['item_name'], quantity=qty, unit=unit,
            amount=amount, mahajan_id=mahajan_id, payment_status=payment_status
        )
        db.session.add(new_exp)

        if mahajan_id:
            mahajan = Mahajan.query.filter_by(id=mahajan_id, shop_id=sid).first()
            if mahajan:
                if payment_status == 'Credit':
                    # Udhari - balance increases
                    mahajan.balance += amount
                    db.session.add(MahajanLedger(mahajan_id=mahajan.id, txn_type='Udhar', amount=amount, description=f"{data['item_name']} ({qty} {unit})"))
                elif payment_status == 'Paid':
                    # Payment - balance decreases
                    mahajan.balance -= amount
                    db.session.add(MahajanLedger(mahajan_id=mahajan.id, txn_type='Payment', amount=amount, description=f"Payment for {data['item_name']}"))

        db.session.commit()
        return jsonify({"message": "Expense added!"}), 201

    today = datetime.today().date()
    expenses = (db.session.query(DailyExpense, Mahajan.name)
                .outerjoin(Mahajan, DailyExpense.mahajan_id == Mahajan.id)
                .filter(DailyExpense.shop_id == sid, db.func.date(DailyExpense.date_time) == today)
                .all())
    total = sum(e[0].amount for e in expenses)
    return jsonify({
        "total_today": total,
        "items": [{"id": e[0].id, "item_name": e[0].item_name, "quantity": e[0].quantity, "unit": e[0].unit, "amount": e[0].amount, "mahajan": e[1], "status": e[0].payment_status, "date": e[0].date_time.strftime('%I:%M %p')} for e in expenses]
    })


@app.route('/api/expenses/<int:id>', methods=['DELETE'])
def delete_expense(id):
    sid = get_shop_id()
    expense = DailyExpense.query.filter_by(id=id, shop_id=sid).first_or_404()
    db.session.delete(expense)
    db.session.commit()
    return jsonify({"message": "Expense deleted!"})


# ============================================================
#  INCOME
# ============================================================

@app.route('/api/income', methods=['POST'])
def add_income():
    sid = get_shop_id()
    data = request.json
    db.session.add(DailyIncome(
        shop_id=sid, payment_mode=data['payment_mode'],
        amount=float(data['amount']), description=data.get('description', '')
    ))
    db.session.commit()
    return jsonify({"message": "Income recorded!"}), 201


@app.route('/api/income/<int:id>', methods=['PUT', 'DELETE'])
def edit_delete_income(id):
    sid = get_shop_id()
    income = DailyIncome.query.filter_by(id=id, shop_id=sid).first_or_404()
    if request.method == 'DELETE':
        db.session.delete(income)
        db.session.commit()
        return jsonify({"message": "Income entry deleted!"})
    data = request.json
    income.payment_mode = data.get('payment_mode', income.payment_mode)
    income.amount = float(data.get('amount', income.amount))
    income.description = data.get('description', income.description)
    db.session.commit()
    return jsonify({"message": "Income updated!"})


@app.route('/api/principle', methods=['POST'])
def add_principle():
    sid = get_shop_id()
    data = request.json
    db.session.add(DailyPrinciple(
        shop_id=sid, amount=float(data['amount']),
        description=data.get('description', '')
    ))
    db.session.commit()
    return jsonify({"message": "Principle recorded!"}), 201


@app.route('/api/principle/<int:id>', methods=['PUT', 'DELETE'])
def edit_delete_principle(id):
    sid = get_shop_id()
    principle = DailyPrinciple.query.filter_by(id=id, shop_id=sid).first_or_404()
    if request.method == 'DELETE':
        db.session.delete(principle)
        db.session.commit()
        return jsonify({"message": "Principle entry deleted!"})
    data = request.json
    principle.amount = float(data.get('amount', principle.amount))
    principle.description = data.get('description', principle.description)
    db.session.commit()
    return jsonify({"message": "Principle updated!"})


@app.route('/api/staff/ledger/<int:id>', methods=['PUT', 'DELETE'])
def edit_delete_staff_ledger(id):
    sid = get_shop_id()
    # Verify ledger belongs to a staff of this shop
    ledger = Ledger.query.get_or_404(id)
    staff = Staff.query.filter_by(id=ledger.staff_id, shop_id=sid).first_or_404()
    if request.method == 'DELETE':
        # Reverse the balance effect
        if ledger.txn_type == 'Advance':
            staff.balance += ledger.amount  # advance diya tha, wapas add karo
        db.session.delete(ledger)
        db.session.commit()
        return jsonify({"message": "Staff ledger entry deleted!"})
    data = request.json
    old_amount = ledger.amount
    new_amount = float(data.get('amount', ledger.amount))
    # Adjust staff balance for amount change (only for Advance type)
    if ledger.txn_type == 'Advance':
        staff.balance += old_amount   # reverse old
        staff.balance -= new_amount   # apply new
    ledger.amount = new_amount
    ledger.description = data.get('description', ledger.description)
    db.session.commit()
    return jsonify({"message": "Staff ledger entry updated!"})


# ============================================================
#  REPORTS
# ============================================================

@app.route('/api/reports', methods=['GET'])
def get_all_reports():
    sid = get_shop_id()
    date_param = request.args.get('date')
    
    if date_param:
        target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        # Filter by specific date
        inv_logs = InventoryLog.query.filter(
            InventoryLog.shop_id == sid,
            db.func.date(InventoryLog.date_time) == target_date
        ).order_by(InventoryLog.date_time.desc()).all()
        
        ret_items = ReturnedItem.query.filter(
            ReturnedItem.shop_id == sid,
            db.func.date(ReturnedItem.return_date) == target_date
        ).order_by(ReturnedItem.return_date.desc()).all()
        
        income_logs = DailyIncome.query.filter(
            DailyIncome.shop_id == sid,
            db.func.date(DailyIncome.date_time) == target_date
        ).order_by(DailyIncome.date_time.desc()).all()
        
        principle_logs = DailyPrinciple.query.filter(
            DailyPrinciple.shop_id == sid,
            db.func.date(DailyPrinciple.date_time) == target_date
        ).order_by(DailyPrinciple.date_time.desc()).all()
        
        expense_logs = (db.session.query(DailyExpense, Mahajan.name)
                        .outerjoin(Mahajan, DailyExpense.mahajan_id == Mahajan.id)
                        .filter(DailyExpense.shop_id == sid)
                        .filter(db.func.date(DailyExpense.date_time) == target_date)
                        .order_by(DailyExpense.date_time.desc()).all())
        
        # Mahajan bills for specific date
        mahajan_bills = (db.session.query(MahajanBill, Mahajan.name)
                        .join(Mahajan, MahajanBill.mahajan_id == Mahajan.id)
                        .filter(MahajanBill.shop_id == sid)
                        .filter(MahajanBill.date == target_date)
                        .order_by(MahajanBill.date.desc()).all())
        
        # Staff logs for specific date
        shop_staff_ids = [s.id for s in Staff.query.filter_by(shop_id=sid).all()]
        staff_logs_q = (db.session.query(Ledger, Staff.name)
                        .join(Staff, Ledger.staff_id == Staff.id)
                        .filter(Staff.shop_id == sid)
                        .filter(db.func.date(Ledger.date_time) == target_date)
                        .order_by(Ledger.date_time.desc()).all()) if shop_staff_ids else []
        
        # Customer logs for specific date
        cust_logs_q = (db.session.query(CustomerLedger, Customer.name)
                       .join(Customer, CustomerLedger.customer_id == Customer.id)
                       .filter(Customer.shop_id == sid)
                       .filter(db.func.date(CustomerLedger.date_time) == target_date)
                       .order_by(CustomerLedger.date_time.desc()).all())
    else:
        # Default: show last 200 records
        inv_logs = InventoryLog.query.filter_by(shop_id=sid).order_by(InventoryLog.date_time.desc()).limit(200).all()
        ret_items = ReturnedItem.query.filter_by(shop_id=sid).order_by(ReturnedItem.return_date.desc()).limit(100).all()
        income_logs = DailyIncome.query.filter_by(shop_id=sid).order_by(DailyIncome.date_time.desc()).limit(200).all()
        principle_logs = DailyPrinciple.query.filter_by(shop_id=sid).order_by(DailyPrinciple.date_time.desc()).limit(200).all()
        expense_logs = (db.session.query(DailyExpense, Mahajan.name)
                        .outerjoin(Mahajan, DailyExpense.mahajan_id == Mahajan.id)
                        .filter(DailyExpense.shop_id == sid)
                        .order_by(DailyExpense.date_time.desc()).limit(200).all())
        
        mahajan_bills = (db.session.query(MahajanBill, Mahajan.name)
                        .join(Mahajan, MahajanBill.mahajan_id == Mahajan.id)
                        .filter(MahajanBill.shop_id == sid)
                        .order_by(MahajanBill.date.desc()).limit(200).all())
        
        shop_staff_ids = [s.id for s in Staff.query.filter_by(shop_id=sid).all()]
        staff_logs_q = (db.session.query(Ledger, Staff.name)
                        .join(Staff, Ledger.staff_id == Staff.id)
                        .filter(Staff.shop_id == sid)
                        .order_by(Ledger.date_time.desc()).limit(200).all()) if shop_staff_ids else []
        
        cust_logs_q = (db.session.query(CustomerLedger, Customer.name)
                       .join(Customer, CustomerLedger.customer_id == Customer.id)
                       .filter(Customer.shop_id == sid)
                       .order_by(CustomerLedger.date_time.desc()).limit(200).all())

    return jsonify({
        "inventory": [{"id": i.id, "item_name": i.item_name, "action": i.action, "quantity": i.quantity, "date": i.date_time.strftime('%Y-%m-%d %I:%M %p')} for i in inv_logs],
        "returns": [{"id": r.id, "item_name": r.item_name, "quantity": r.quantity, "date": r.return_date.strftime('%Y-%m-%d %I:%M %p')} for r in ret_items],
        "staff": [{"id": l[0].id, "staff_name": l[1], "txn_type": l[0].txn_type, "amount": l[0].amount, "description": l[0].description, "date": l[0].date_time.strftime('%Y-%m-%d %I:%M %p')} for l in staff_logs_q],
        "customers": [{"id": c[0].id, "customer_name": c[1], "txn_type": c[0].txn_type, "amount": c[0].amount, "date": c[0].date_time.strftime('%Y-%m-%d %I:%M %p')} for c in cust_logs_q],
        "incomes": [{"id": i.id, "payment_mode": i.payment_mode, "amount": i.amount, "description": i.description, "date": i.date_time.strftime('%Y-%m-%d %I:%M %p')} for i in income_logs],
        "principles": [{"id": p.id, "amount": p.amount, "description": p.description, "date": p.date_time.strftime('%Y-%m-%d %I:%M %p')} for p in principle_logs],
        "expenses": [{"id": e[0].id, "item_name": e[0].item_name, "amount": e[0].amount, "mahajan": e[1], "status": e[0].payment_status, "date": e[0].date_time.strftime('%Y-%m-%d %I:%M %p')} for e in expense_logs],
        "mahajan_bills": [{"id": b[0].id, "mahajan_name": b[1], "amount": b[0].amount, "description": b[0].description, "date": b[0].date.strftime('%Y-%m-%d'), "bill_image": b[0].bill_image} for b in mahajan_bills]
    })


# ============================================================
#  MENU
# ============================================================

@app.route('/api/menu', methods=['GET', 'POST'])
def manage_menu():
    sid = get_shop_id()
    if request.method == 'POST':
        image_url = ''
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                filename = secure_filename(file.filename)
                filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                image_url = f"/static/uploads/{filename}"

        db.session.add(MenuItem(
            shop_id=sid,
            name=request.form.get('name'), desc=request.form.get('desc'),
            category=request.form.get('category'), price=float(request.form.get('price', 0)),
            unit=request.form.get('unit', 'pc'), image_url=image_url,
            popular=request.form.get('popular') == 'true',
            in_stock=request.form.get('in_stock', 'true') == 'true'
        ))
        db.session.commit()
        return jsonify({"message": "Menu item added!"}), 201

    items = MenuItem.query.filter_by(shop_id=sid).all()
    return jsonify([{"id": i.id, "name": i.name, "desc": i.desc, "category": i.category, "price": i.price, "unit": i.unit, "image_url": i.image_url, "popular": i.popular, "in_stock": i.in_stock} for i in items])


@app.route('/api/menu/<int:id>', methods=['PUT', 'DELETE'])
def update_menu_item(id):
    sid = get_shop_id()
    item = MenuItem.query.filter_by(id=id, shop_id=sid).first_or_404()

    if request.method == 'DELETE':
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Item deleted!"})

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


# ============================================================
#  MAHAJANS
# ============================================================

@app.route('/api/mahajans', methods=['GET', 'POST'])
def manage_mahajans():
    sid = get_shop_id()
    if request.method == 'POST':
        data = request.json
        db.session.add(Mahajan(shop_id=sid, name=data['name'], phone=data.get('phone', '')))
        db.session.commit()
        return jsonify({"message": "Mahajan added!"}), 201

    mahajans = Mahajan.query.filter_by(shop_id=sid).all()
    today = datetime.today().date()
    today_udhar = 0
    # MahajanLedger se aaj ka udhar (expenses done on credit)
    for m in mahajans:
        logs = MahajanLedger.query.filter(MahajanLedger.mahajan_id == m.id, db.func.date(MahajanLedger.date_time) == today, MahajanLedger.txn_type == 'Udhar').all()
        today_udhar += sum(l.amount for l in logs)
        
    return jsonify({
        "mahajans": [{"id": m.id, "name": m.name, "phone": m.phone, "balance": m.balance} for m in mahajans],
        "today_udhar": today_udhar,
        "total_udhar": sum(m.balance for m in mahajans)
    })


@app.route('/api/mahajans/<int:id>/pay', methods=['POST'])
def pay_mahajan(id):
    sid = get_shop_id()
    mahajan = Mahajan.query.filter_by(id=id, shop_id=sid).first_or_404()
    amount = float(request.json.get('amount', 0))
    mahajan.balance -= amount
    db.session.add(MahajanLedger(mahajan_id=id, txn_type='Payment', amount=amount, description='Payment Cleared'))
    db.session.commit()
    return jsonify({"message": "Payment successful!", "balance": mahajan.balance})


@app.route('/api/mahajans/<int:id>', methods=['PUT', 'DELETE'])
def edit_delete_mahajan(id):
    sid = get_shop_id()
    mahajan = Mahajan.query.filter_by(id=id, shop_id=sid).first_or_404()
    
    if request.method == 'PUT':
        data = request.json
        mahajan.name = data.get('name', mahajan.name)
        mahajan.phone = data.get('phone', mahajan.phone)
        db.session.commit()
        return jsonify({"message": "Mahajan updated successfully!"})
    
    if request.method == 'DELETE':
        MahajanLedger.query.filter_by(mahajan_id=id).delete()
        MahajanBill.query.filter_by(mahajan_id=id).delete()
        # also remove mahajan relations with DailyExpense if we want, or just set to null
        db.session.query(DailyExpense).filter_by(mahajan_id=id).update({DailyExpense.mahajan_id: None})
        db.session.delete(mahajan)
    db.session.commit()
    return jsonify({"message": f"Vendor {mahajan.name} deleted successfully!"})


# ============================================================
#  MAHAJAN BILLS
# ============================================================

@app.route('/api/mahajan-bills', methods=['GET', 'POST'])
def manage_mahajan_bills():
    sid = get_shop_id()
    
    if request.method == 'POST':
        data = request.json
        
        # Validate mahajan_id
        if not data.get('mahajan_id') or data['mahajan_id'] == '':
            return jsonify({"error": "Please select a mahajan"}), 400
            
        mahajan_id = int(data['mahajan_id'])
        amount = float(data['amount'])
        bill_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        description = data.get('description', '')
        bill_image = data.get('bill_image', '')
        
        # Add bill
        new_bill = MahajanBill(
            mahajan_id=mahajan_id,
            shop_id=sid,
            date=bill_date,
            amount=amount,
            description=description,
            bill_image=bill_image
        )
        db.session.add(new_bill)
        
        # Update mahajan balance
        mahajan = Mahajan.query.filter_by(id=mahajan_id, shop_id=sid).first()
        if mahajan:
            mahajan.balance += amount
        
        # Add ledger entry
        db.session.add(MahajanLedger(
            mahajan_id=mahajan_id,
            txn_type='Bill',
            amount=amount,
            description=description,
            date_time=datetime.combine(bill_date, datetime.min.time())
        ))
        
        db.session.commit()
        return jsonify({"message": "Bill added successfully!"}), 201
    
    # GET - return all bills with mahajan names
    bills = (db.session.query(MahajanBill, Mahajan.name)
             .join(Mahajan, MahajanBill.mahajan_id == Mahajan.id)
             .filter(MahajanBill.shop_id == sid)
             .order_by(MahajanBill.date.desc())
             .all())
    
    return jsonify([{
        "id": b[0].id,
        "mahajan_id": b[0].mahajan_id,
        "mahajan_name": b[1],
        "date": b[0].date.strftime('%Y-%m-%d'),
        "amount": b[0].amount,
        "description": b[0].description,
        "bill_image": b[0].bill_image
    } for b in bills])


@app.route('/api/mahajan-bills/<int:id>', methods=['PUT', 'DELETE'])
def edit_delete_mahajan_bill(id):
    sid = get_shop_id()
    bill = MahajanBill.query.filter_by(id=id, shop_id=sid).first_or_404()
    
    if request.method == 'DELETE':
        # Update mahajan balance (subtract the bill amount)
        mahajan = Mahajan.query.filter_by(id=bill.mahajan_id).first()
        if mahajan:
            mahajan.balance -= bill.amount
        
        # Delete ledger entry
        MahajanLedger.query.filter_by(
            mahajan_id=bill.mahajan_id,
            txn_type='Bill',
            amount=bill.amount,
            description=bill.description
        ).delete()
        
        db.session.delete(bill)
        db.session.commit()
        return jsonify({"message": "Bill deleted successfully!"})
    
    if request.method == 'PUT':
        data = request.json
        old_amount = bill.amount
        new_amount = float(data['amount'])
        
        # Update mahajan balance
        mahajan = Mahajan.query.filter_by(id=bill.mahajan_id).first()
        if mahajan:
            mahajan.balance = mahajan.balance - old_amount + new_amount
        
        # Update bill
        bill.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        bill.amount = new_amount
        bill.description = data.get('description', '')
        if 'bill_image' in data:
            bill.bill_image = data['bill_image']
        
        db.session.commit()
        return jsonify({"message": "Bill updated successfully!"})


@app.route('/api/mahajans/<int:id>/bills', methods=['GET'])
def get_mahajan_bills(id):
    sid = get_shop_id()
    
    # Get bills from MahajanBill table
    bills = MahajanBill.query.filter_by(mahajan_id=id, shop_id=sid).order_by(MahajanBill.date.desc()).all()
    bill_list = [{
        "id": f"bill_{b.id}",
        "type": "bill",
        "date": b.date.strftime('%Y-%m-%d'),
        "amount": b.amount,
        "description": b.description,
        "bill_image": b.bill_image
    } for b in bills]
    
    # Get expenses for this mahajan
    expenses = DailyExpense.query.filter_by(mahajan_id=id, shop_id=sid).order_by(DailyExpense.date_time.desc()).all()
    expense_list = [{
        "id": f"expense_{e.id}",
        "type": "expense",
        "date": e.date_time.strftime('%Y-%m-%d'),
        "amount": e.amount,
        "description": f"{e.item_name} ({e.payment_status})",
        "bill_image": None
    } for e in expenses]
    
    # Combine and sort by date
    all_transactions = bill_list + expense_list
    all_transactions.sort(key=lambda x: x['date'], reverse=True)
    
    return jsonify(all_transactions)

    db.session.commit()
    return jsonify({"message": f"Vendor {mahajan.name} deleted successfully!"})


# ============================================================
#  SHOP SETTINGS
# ============================================================

@app.route('/api/settings', methods=['GET', 'PUT'])
def shop_settings():
    shop_id = get_shop_id()
    settings = ShopSettings.query.filter_by(shop_id=shop_id).first()
    if not settings:
        admin = Admin.query.get(shop_id)
        shop = ShopOwner.query.filter_by(admin_username=admin.username).first() if admin else None
        settings = ShopSettings(
            shop_id=shop_id,
            shop_name=shop.shop_name if shop else 'SweetCraft',
            owner_name=shop.owner_name if shop else '',
            phone=shop.phone if shop else '',
            city=shop.city if shop else ''
        )
        db.session.add(settings)
        db.session.commit()

    if request.method == 'PUT':
        data = request.json
        for field in ['shop_name', 'tagline', 'owner_name', 'phone', 'phone2', 'address', 'city', 'upi_id', 'gstin', 'footer_note']:
            if field in data:
                setattr(settings, field, data[field])
        db.session.commit()
        return jsonify({'message': 'Settings updated!'})

    return jsonify({
        'shop_name': settings.shop_name, 'tagline': settings.tagline,
        'owner_name': settings.owner_name, 'phone': settings.phone,
        'phone2': settings.phone2 or '', 'address': settings.address,
        'city': settings.city, 'upi_id': settings.upi_id or '',
        'gstin': settings.gstin or '', 'footer_note': settings.footer_note
    })

@app.route('/api/settings/password', methods=['PUT'])
def change_admin_password():
    sid = get_shop_id()
    data = request.json
    admin = Admin.query.get(sid)
    if not admin:
        return jsonify({"error": "Admin account not found!"}), 404
        
    old_pw = data.get('oldPassword', '')
    new_pw = data.get('newPassword', '')
    
    if not check_password_hash(admin.password_hash, old_pw):
        return jsonify({"error": "Purana password galat hai!"}), 400
        
    admin.password_hash = generate_password_hash(new_pw)
    db.session.commit()
    return jsonify({"message": "Password changed successfully!"})


@app.route('/api/database/export', methods=['GET'])
def export_database():
    from flask import send_file
    try:
        db_path = os.path.join(app.root_path, 'instance', 'shop.db') if os.path.exists(os.path.join(app.root_path, 'instance', 'shop.db')) else os.path.join(app.root_path, 'shop.db')
        return send_file(db_path, as_attachment=True, download_name=f'shop_backup_{datetime.now().strftime("%Y%m%d%H%M")}.db')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/database/import', methods=['POST'])
def import_database():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'})
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    if file and file.filename.endswith('.db'):
        db_path = os.path.join(app.root_path, 'instance', 'shop.db') if os.path.exists(os.path.join(app.root_path, 'instance', 'shop.db')) else os.path.join(app.root_path, 'shop.db')
        # Create a tiny backup
        if os.path.exists(db_path):
            os.rename(db_path, f"{db_path}.bak_{datetime.now().strftime('%Y%m%d%H%M%S')}")
        file.save(db_path)
        return jsonify({'message': 'Database imported successfully!'}), 200
    return jsonify({'error': 'Invalid file format. Only .db required.'}), 400


# ============================================================
#  AUTOMATIC BACKUP MANAGEMENT
# ============================================================

@app.route('/api/backups/list', methods=['GET'])
def list_backups():
    """List all available backups"""
    try:
        backups = backup_manager.list_backups()
        stats = backup_manager.get_backup_stats()
        return jsonify({
            'backups': backups,
            'stats': stats
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/backups/create', methods=['POST'])
def create_manual_backup():
    """Create a manual backup immediately"""
    try:
        backup_path = backup_manager.create_backup()
        if backup_path:
            return jsonify({
                'message': 'Backup created successfully',
                'backup_path': backup_path
            }), 200
        else:
            return jsonify({'error': 'Failed to create backup'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/backups/download/<filename>', methods=['GET'])
def download_backup(filename):
    """Download a specific backup file"""
    try:
        backup_path = os.path.join(backup_manager.backup_dir, filename)
        if os.path.exists(backup_path) and filename.startswith('shop_backup_'):
            return send_file(backup_path, as_attachment=True, download_name=filename)
        else:
            return jsonify({'error': 'Backup file not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/backups/restore/<filename>', methods=['POST'])
def restore_backup(filename):
    """Restore database from a backup"""
    try:
        success = backup_manager.restore_backup(filename)
        if success:
            return jsonify({'message': 'Database restored successfully'}), 200
        else:
            return jsonify({'error': 'Failed to restore backup'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/backups/delete/<filename>', methods=['DELETE'])
def delete_backup(filename):
    """Delete a specific backup file"""
    try:
        backup_path = os.path.join(backup_manager.backup_dir, filename)
        if os.path.exists(backup_path) and filename.startswith('shop_backup_'):
            os.remove(backup_path)
            return jsonify({'message': 'Backup deleted successfully'}), 200
        else:
            return jsonify({'error': 'Backup file not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/backups/stats', methods=['GET'])
def backup_stats():
    """Get backup statistics"""
    try:
        stats = backup_manager.get_backup_stats()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================
#  RESET TODAY'S ENTRY
# ============================================================

@app.route('/api/settings/reset-today', methods=['POST'])
def reset_today_entry():
    """Sirf aaj ka income, principle, aur expense entries delete karo"""
    sid = get_shop_id()
    today = datetime.today().date()

    DailyIncome.query.filter(
        DailyIncome.shop_id == sid,
        db.func.date(DailyIncome.date_time) == today
    ).delete(synchronize_session=False)

    DailyPrinciple.query.filter(
        DailyPrinciple.shop_id == sid,
        db.func.date(DailyPrinciple.date_time) == today
    ).delete(synchronize_session=False)

    DailyExpense.query.filter(
        DailyExpense.shop_id == sid,
        db.func.date(DailyExpense.date_time) == today
    ).delete(synchronize_session=False)

    db.session.commit()
    return jsonify({"message": "Aaj ka saara entry reset ho gaya!"})


# ============================================================
#  SUPER ADMIN
# ============================================================

@app.route('/api/superadmin/login', methods=['POST'])
def superadmin_login():
    data = request.json
    sa = SuperAdmin.query.filter_by(username=data.get('username')).first()
    if sa and check_password_hash(sa.password_hash, data.get('password')):
        return jsonify({'message': 'Super Admin access granted'}), 200
    return jsonify({'error': 'Invalid credentials'}), 401


@app.route('/api/superadmin/shops', methods=['GET', 'POST'])
def manage_shops():
    if request.method == 'POST':
        data = request.json
        shop = ShopOwner(
            shop_name=data['shop_name'], owner_name=data['owner_name'],
            phone=data.get('phone', ''), city=data.get('city', ''),
            admin_username=data.get('admin_username', ''), plan=data.get('plan', 'Free')
        )
        db.session.add(shop)

        if data.get('admin_username') and data.get('admin_password'):
            if not Admin.query.filter_by(username=data['admin_username']).first():
                new_admin = Admin(
                    username=data['admin_username'],
                    password_hash=generate_password_hash(data['admin_password'])
                )
                db.session.add(new_admin)
                db.session.flush()  # Get admin ID before commit
                # Auto-create ShopSettings so shop owner sees their data in settings
                db.session.add(ShopSettings(
                    shop_id=new_admin.id,
                    shop_name=data['shop_name'],
                    owner_name=data['owner_name'],
                    phone=data.get('phone', ''),
                    city=data.get('city', '')
                ))

        db.session.commit()
        return jsonify({'message': 'Shop registered!'}), 201

    shops = ShopOwner.query.order_by(ShopOwner.joined_date.desc()).all()
    return jsonify([{
        'id': s.id, 'shop_name': s.shop_name, 'owner_name': s.owner_name,
        'phone': s.phone, 'city': s.city, 'admin_username': s.admin_username,
        'is_active': s.is_active, 'plan': s.plan,
        'joined_date': s.joined_date.strftime('%Y-%m-%d')
    } for s in shops])


@app.route('/api/superadmin/shops/<int:id>/toggle', methods=['PUT'])
def toggle_shop(id):
    shop = ShopOwner.query.get_or_404(id)
    shop.is_active = not shop.is_active
    db.session.commit()
    return jsonify({'is_active': shop.is_active, 'message': 'Status updated!'})


@app.route('/api/superadmin/shops/<int:id>', methods=['DELETE'])
def delete_shop(id):
    shop = ShopOwner.query.get_or_404(id)
    db.session.delete(shop)
    db.session.commit()
    return jsonify({'message': 'Shop deleted!'})


if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() in ['true', '1', 't']
    app.run(host='0.0.0.0', debug=debug_mode, port=5000)
