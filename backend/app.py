from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import uuid

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///crypto_game.db'
db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    telegram_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    balance = db.Column(db.Float, default=0)
    last_claim = db.Column(db.DateTime)
    referral_code = db.Column(db.String(10), unique=True)

class Referral(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    referred_id = db.Column(db.String(36), db.ForeignKey('user.id'))

class GamePoints(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    points = db.Column(db.Integer, default=0)

with app.app_context():
    db.create_all()

# Helper Functions
def generate_referral_code():
    return uuid.uuid4().hex[:8]

# API Routes
@app.route('/user', methods=['POST'])
def create_user():
    data = request.json
    telegram_id = data.get('telegram_id')
    name = data.get('name')

    existing_user = User.query.filter_by(telegram_id=telegram_id).first()
    if existing_user:
        return jsonify({"message": "User already exists"}), 400

    new_user = User(
        id=str(uuid.uuid4()),
        telegram_id=telegram_id,
        name=name,
        referral_code=generate_referral_code()
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully", "user_id": new_user.id}), 201

@app.route('/user/<user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "name": user.name,
        "balance": user.balance,
        "last_claim": user.last_claim,
        "referral_code": user.referral_code
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

    user.balance += 100  # Add 100 tokens
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

@app.route('/game_points', methods=['POST'])
def update_game_points():
    user_id = request.json.get('user_id')
    points = request.json.get('points')

    game_points = GamePoints.query.filter_by(user_id=user_id).first()
    if not game_points:
        game_points = GamePoints(user_id=user_id, points=points)
        db.session.add(game_points)
    else:
        game_points.points = points

    db.session.commit()

    return jsonify({"message": "Game points updated successfully"})

@app.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    leaderboard = GamePoints.query.order_by(GamePoints.points.desc()).limit(10).all()
    return jsonify([
        {"user_id": points.user_id, "points": points.points}
        for points in leaderboard
    ])

if __name__ == '__main__':
    app.run(debug=True)