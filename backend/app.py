from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import uuid
import json
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///crypto_game.db'
db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    telegram_id = db.Column(db.String(50), unique=True, nullable=False)
    username = db.Column(db.String(50), nullable=True)
    first_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=True)
    balance = db.Column(db.Float, default=0)
    last_claim = db.Column(db.DateTime)
    referral_code = db.Column(db.String(10), unique=True)
    last_referral_claim = db.Column(db.DateTime)

class Referral(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    referred_id = db.Column(db.String(36), db.ForeignKey('user.id'))

class GamePoints(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    points = db.Column(db.Integer, default=0)

class ReferralClaim(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    referred_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    amount = db.Column(db.Float)
    claim_time = db.Column(db.DateTime, default=datetime.utcnow)

class UserState(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    is_mining = db.Column(db.Boolean, default=False)
    mining_start_time = db.Column(db.DateTime)
    last_claim_time = db.Column(db.DateTime)

with app.app_context():
    db.create_all()

# Helper Functions
def generate_referral_code():
    return uuid.uuid4().hex[:8]

def create_user(telegram_id, username, first_name, last_name):
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            telegram_id=telegram_id,
            username=username,
            first_name=first_name,
            last_name=last_name,
            referral_code=str(uuid.uuid4())[:8]
        )
        db.session.add(user)
        db.session.commit()
    return user

def get_user_state(user_id):
    state = UserState.query.filter_by(user_id=user_id).first()
    if not state:
        state = UserState(user_id=user_id)
        db.session.add(state)
        db.session.commit()
    return state

def start_mining(user_id):
    state = get_user_state(user_id)
    if not state.is_mining:
        state.is_mining = True
        state.mining_start_time = datetime.utcnow()
        db.session.commit()
        return True
    return False

def check_mining_status(user_id):
    state = get_user_state(user_id)
    if state.is_mining:
        mining_duration = datetime.utcnow() - state.mining_start_time
        if mining_duration >= timedelta(hours=8):
            return "ready_to_claim"
        else:
            return "mining"
    return "not_mining"

def claim_tokens(user_id):
    user = User.query.get(user_id)
    state = get_user_state(user_id)
    if state.is_mining and (datetime.utcnow() - state.mining_start_time) >= timedelta(hours=8):
        tokens_earned = 100  # You can adjust this value
        user.balance += tokens_earned
        state.is_mining = False
        state.last_claim_time = datetime.utcnow()
        db.session.commit()
        return tokens_earned
    return 0

# Telegram bot handlers
def start(update, context):
    user = create_user(
        update.effective_user.id,
        update.effective_user.username,
        update.effective_user.first_name,
        update.effective_user.last_name
    )
    update.message.reply_text(f"Welcome, {user.first_name}! Your balance is {user.balance} tokens.")

def start_mining_command(update, context):
    user = User.query.filter_by(telegram_id=str(update.effective_user.id)).first()
    if start_mining(user.id):
        update.message.reply_text("Mining started. You can claim your tokens after 8 hours.")
    else:
        update.message.reply_text("You're already mining.")

def check_status(update, context):
    user = User.query.filter_by(telegram_id=str(update.effective_user.id)).first()
    status = check_mining_status(user.id)
    if status == "ready_to_claim":
        update.message.reply_text("Your tokens are ready to be claimed!")
    elif status == "mining":
        update.message.reply_text("You're currently mining. Keep going!")
    else:
        update.message.reply_text("You're not mining. Start mining to earn tokens!")

def claim(update, context):
    user = User.query.filter_by(telegram_id=str(update.effective_user.id)).first()
    tokens_claimed = claim_tokens(user.id)
    if tokens_claimed > 0:
        update.message.reply_text(f"You've claimed {tokens_claimed} tokens! Your new balance is {user.balance}.")
    else:
        update.message.reply_text("No tokens to claim. Make sure you've been mining for at least 8 hours.")

def main():
    updater = Updater("7031484757:AAFxCtzFo5QiXzbO9_-tA-2wLGEasvtqxug", use_context=True)
    dp = updater.dispatcher

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("mine", start_mining_command))
    dp.add_handler(CommandHandler("status", check_status))
    dp.add_handler(CommandHandler("claim", claim))

    updater.start_polling()
    updater.idle()

# API Routes
@app.route('/user', methods=['POST'])
def create_user_route():
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
        referral_code=generate_referral_code(),
        last_referral_claim=datetime.utcnow()
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully", "user_id": new_user.id}), 201

@app.route('/user/<user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    referrals = Referral.query.filter_by(referrer_id=user_id).all()
    referred_users = [User.query.get(ref.referred_id) for ref in referrals]

    return jsonify({
        "id": user.id,
        "name": user.name,
        "balance": user.balance,
        "last_claim": user.last_claim,
        "referral_code": user.referral_code,
        "last_referral_claim": user.last_referral_claim,
        "referrals": [{"id": ref.id, "name": ref.name} for ref in referred_users]
    })

@app.route('/claim', methods=['POST'])
def claim_tokens_route():
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

@app.route('/user/<user_id>/referrals', methods=['GET'])
def get_user_referrals(user_id):
    referrals = Referral.query.filter_by(referrer_id=user_id).all()
    referred_users = [User.query.get(ref.referred_id) for ref in referrals]
    return jsonify([
        {"id": user.id, "name": user.name}
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

if __name__ == '__main__':
    main()
    app.run(debug=True)
