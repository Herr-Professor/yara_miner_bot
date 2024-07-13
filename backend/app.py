from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from datetime import datetime, timedelta
import uuid
import logging
import random
import string

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///yara_game.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)  # Set up Flask-Migrate

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Database Models
class User(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    username = db.Column(db.String(5), unique=True, nullable=False)
    secret_code = db.Column(db.String(15), unique=True, nullable=False)
    balance = db.Column(db.Float, default=0)
    last_claim = db.Column(db.DateTime)
    referral_code = db.Column(db.String(10), unique=True)
    last_referral_claim = db.Column(db.DateTime)
    cipher_solved = db.Column(db.Boolean, default=False)  # New field
    next_cipher_time = db.Column(db.DateTime)  # New field

class Referral(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    referred_id = db.Column(db.String(36), db.ForeignKey('user.id'))

class ReferralClaim(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    referred_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    amount = db.Column(db.Float)
    claim_time = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

# Helper Functions
def generate_referral_code():
    return uuid.uuid4().hex[:8]

def generate_secret_code():
    return 'yX-' + ''.join(random.choices(string.ascii_letters + string.digits, k=12))

# API Routes
@app.route('/user', methods=['POST'])
def create_user():
    try:
        data = request.json
        app.logger.info(f"Received data: {data}")
        
        if not data:
            return jsonify({"message": "No input data provided"}), 400
        
        username = data.get('username')
        
        app.logger.info(f"Creating user with username: {username}")
        
        if not username or len(username) != 5:
            return jsonify({"message": "Username must be exactly 5 characters long"}), 400

        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({"message": "Username already exists"}), 400

        secret_code = generate_secret_code()
        new_user = User(
            id=str(uuid.uuid4()),
            username=username,
            secret_code=secret_code,
            referral_code=generate_referral_code(),
            last_referral_claim=datetime.utcnow()
        )
        db.session.add(new_user)
        db.session.commit()

        app.logger.info(f"User created successfully with id: {new_user.id}")
        return jsonify({
            "message": "User created successfully",
            "user_id": new_user.id,
            "secret_code": secret_code
        }), 201
    except Exception as e:
        app.logger.error(f"Error creating user: {str(e)}")
        db.session.rollback()
        return jsonify({"message": f"Failed to create user: {str(e)}"}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    secret_code = data.get('secret_code')
    
    if not secret_code:
        return jsonify({"message": "Secret code is required"}), 400
    
    user = User.query.filter_by(secret_code=secret_code).first()
    if not user:
        return jsonify({"message": "Invalid secret code"}), 401
    
    return jsonify({
        "user_id": user.id,
        "username": user.username,
        "balance": user.balance,
        "last_claim": user.last_claim,
        "referral_code": user.referral_code,
        "last_referral_claim": user.last_referral_claim
    }), 200

@app.route('/user/<user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    referrals = Referral.query.filter_by(referrer_id=user_id).all()
    referred_users = [User.query.get(ref.referred_id) for ref in referrals]

    return jsonify({
        "id": user.id,
        "username": user.username,
        "balance": user.balance,
        "last_claim": user.last_claim,
        "referral_code": user.referral_code,
        "last_referral_claim": user.last_referral_claim,
        "cipher_solved": user.cipher_solved,
        "next_cipher_time": user.next_cipher_time.isoformat() if user.next_cipher_time else None,
        "referrals": [{"id": ref.id, "username": ref.username} for ref in referred_users]
    })

@app.route('/claim', methods=['POST'])
def claim_tokens():
    user_id = request.json.get('user_id')
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    now = datetime.utcnow()
    if user.last_claim and (now - user.last_claim) < timedelta(hours=8):
        return jsonify({"message": "Cannot claim yet"}), 400

    user.balance += 3500 
    user.last_claim = now
    db.session.commit()

    return jsonify({"message": "Tokens claimed successfully", "new_balance": user.balance})

@app.route('/referral', methods=['POST'])
def add_referral():
    referrer_code = request.json.get('referrer_code')
    referred_id = request.json.get('referred_id')

    referrer = User.query.filter_by(referral_code=referrer_code).first()
    referred = User.query.get(referred_id)

    if not referrer or not referred:
        return jsonify({"message": "Invalid referral"}), 400

    new_referral = Referral(referrer_id=referrer.id, referred_id=referred.id)
    db.session.add(new_referral)
    db.session.commit()

    return jsonify({"message": "Referral added successfully"})

@app.route('/update_balance', methods=['POST'])
def update_balance():
    user_id = request.json.get('user_id')
    points = request.json.get('points')

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    user.balance += points
    db.session.commit()

    return jsonify({"message": "Balance updated successfully", "new_balance": user.balance})

@app.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    leaderboard = User.query.order_by(User.balance.desc()).limit(10).all()
    return jsonify([
        {"user_id": user.id, "username": user.username, "balance": user.balance}
        for user in leaderboard
    ])

@app.route('/user/<user_id>/referrals', methods=['GET'])
def get_user_referrals(user_id):
    referrals = Referral.query.filter_by(referrer_id=user_id).all()
    referred_users = [User.query.get(ref.referred_id) for ref in referrals]
    return jsonify([
        {"id": user.id, "username": user.username}
        for user in referred_users
    ])

@app.route('/user/<user_id>/claim-referrals', methods=['POST'])
def claim_referral_rewards(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    now = datetime.utcnow()
    if user.last_referral_claim and (now - user.last_referral_claim) < timedelta(hours=4):
        return jsonify({"message": "Cannot claim referral rewards yet"}), 400

    referrals = Referral.query.filter_by(referrer_id=user_id).all()
    total_reward = 0

    for referral in referrals:
        referred_user = User.query.get(referral.referred_id)
        if referred_user:
            reward = referred_user.balance * 0.25  # 25% of referred user's balance
            total_reward += reward
            new_claim = ReferralClaim(referrer_id=user_id, referred_id=referred_user.id, amount=reward)
            db.session.add(new_claim)

    user.balance += total_reward
    user.last_referral_claim = now
    db.session.commit()

    return jsonify({"message": "Referral rewards claimed successfully", "reward": total_reward, "new_balance": user.balance})

@app.route('/user/<user_id>/update-referral-claim-time', methods=['POST'])
def update_referral_claim_time(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    user.last_referral_claim = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "Referral claim time updated successfully"})

@app.route('/user/<user_id>/balance', methods=['GET'])
def get_user_balance(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify({"balance": user.balance})

@app.route('/user/<user_id>/update-cipher-status', methods=['POST'])
def update_cipher_status(user_id):
    data = request.json
    solved = data.get('solved')
    next_time = data.get('next_time')

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if solved is not None:
        user.cipher_solved = solved

    if next_time:
        user.next_cipher_time = datetime.fromisoformat(next_time)

    db.session.commit()

    return jsonify({"message": "Cipher status updated successfully"})


@app.route('/test_db')
def test_db():
    try:
        db.session.query(User).first()
        return jsonify({"message": "Database connection successful"}), 200
    except Exception as e:
        return jsonify({"message": f"Database connection failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
