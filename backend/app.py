from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import logging
import random
import string

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://yara-miner-bot.vercel.app", "https://t.me"]}})
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///yara_game.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(80), unique=True, nullable=False)
    username = db.Column(db.String(80), nullable=False)
    balance = db.Column(db.Float, default=1000)
    last_claim = db.Column(db.DateTime)
    cipher_solved = db.Column(db.Boolean, default=False)
    next_cipher_time = db.Column(db.DateTime)
    last_referral_claim = db.Column(db.DateTime)
    referral_code = db.Column(db.String(10), unique=True, nullable=False)
    daily_earnings = db.Column(db.Float, default=0)
    last_earnings_update = db.Column(db.DateTime)

class Referral(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    referred_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    claimed = db.Column(db.Boolean, default=False)

with app.app_context():
    db.create_all()

def generate_referral_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

@app.route('/api/user/check_and_create', methods=['POST'])
def check_and_create_user():
    data = request.json
    app.logger.info(f"Received request to check/create user: {data}")
    
    user = User.query.filter_by(user_id=data['user_id']).first()
    
    if not user:
        referral_code = data.get('referral_code')
        referrer = User.query.filter_by(referral_code=referral_code).first() if referral_code else None
        
        new_user = User(
            user_id=data['user_id'],
            username=data['username'],
            referral_code=generate_referral_code()
        )
        db.session.add(new_user)
        
        if referrer:
            referrer.balance += 1000  # Bonus for referrer
            new_referral = Referral(referrer_id=referrer.id, referred_id=new_user.id)
            db.session.add(new_referral)
        
        db.session.commit()
        app.logger.info(f"Created new user: {new_user.username}")
        user = new_user
    else:
        app.logger.info(f"Found existing user: {user.username}")
    
    return jsonify({
        'user_id': user.user_id,
        'username': user.username,
        'balance': user.balance,
        'last_claim': user.last_claim.isoformat() if user.last_claim else None,
        'cipher_solved': user.cipher_solved,
        'next_cipher_time': user.next_cipher_time.isoformat() if user.next_cipher_time else None,
        'referral_code': user.referral_code
    })

@app.route('/api/user/<user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.filter_by(user_id=user_id).first()
    if user:
        return jsonify({
            'user_id': user.user_id,
            'username': user.username,
            'balance': user.balance,
            'last_claim': user.last_claim.isoformat() if user.last_claim else None,
            'cipher_solved': user.cipher_solved,
            'next_cipher_time': user.next_cipher_time.isoformat() if user.next_cipher_time else None
        })
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/claim', methods=['POST'])
def claim_tokens():
    data = request.json
    user = User.query.filter_by(user_id=data['user_id']).first()
    if user:
        if user.last_claim is None or datetime.utcnow() - user.last_claim >= timedelta(hours=8):
            claim_amount = 3500
            user.balance += claim_amount
            user.last_claim = datetime.utcnow()
            update_user_earnings(user, claim_amount)
            db.session.commit()
            return jsonify({'success': True, 'new_balance': user.balance})
        else:
            return jsonify({'error': 'Cannot claim yet'}), 400
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/solve_cipher', methods=['POST'])
def solve_cipher():
    data = request.json
    user = User.query.filter_by(user_id=data['user_id']).first()
    if user:
        if not user.cipher_solved and (user.next_cipher_time is None or datetime.utcnow() >= user.next_cipher_time):
            if data['solution'].upper() == 'HELLWORLD':
                reward_amount = 1000
                user.balance += reward_amount
                user.cipher_solved = True
                next_time = datetime.utcnow().replace(hour=12, minute=0, second=0, microsecond=0)
                if next_time <= datetime.utcnow():
                    next_time += timedelta(days=1)
                user.next_cipher_time = next_time
                update_user_earnings(user, reward_amount)
                db.session.commit()
                return jsonify({'success': True, 'new_balance': user.balance})
            else:
                return jsonify({'error': 'Incorrect solution'}), 400
        else:
            return jsonify({'error': 'Cipher already solved or not available'}), 400
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    leaders = User.query.order_by(User.balance.desc()).limit(10).all()
    return jsonify([
        {'username': leader.username, 'balance': leader.balance}
        for leader in leaders
    ])

@app.route('/api/referrals/<user_id>', methods=['GET'])
def get_referrals(user_id):
    user = User.query.filter_by(user_id=user_id).first()
    if user:
        referrals = User.query.join(Referral, Referral.referred_id == User.id).filter(Referral.referrer_id == user.id).all()
        claimable_amount = calculate_claimable_amount(user)
        return jsonify({
            'referral_link': f"https://your-app-url.com/register?ref={user.referral_code}",
            'last_claim_time': user.last_referral_claim.isoformat() if user.last_referral_claim else None,
            'claimable_amount': claimable_amount,
            'referrals': [
                {
                    'username': referral.username,
                    'balance': referral.balance,
                    'earnings': calculate_earnings(referral)
                }
                for referral in referrals
            ]
        })
    return jsonify({'error': 'User not found'}), 404

def calculate_claimable_amount(user):
    referrals = Referral.query.filter_by(referrer_id=user.id).all()
    total_claimable = 0
    current_time = datetime.utcnow()

    for referral in referrals:
        referred_user = User.query.get(referral.referred_id)
        if referred_user:
            earnings = calculate_earnings(referred_user)
            total_claimable += earnings * 0.25  # 25% of earnings

    # Reset daily earnings for referred users
    for referral in referrals:
        referred_user = User.query.get(referral.referred_id)
        if referred_user:
            referred_user.daily_earnings = 0
            referred_user.last_earnings_update = current_time

    db.session.commit()
    return total_claimable

def calculate_earnings(referred_user):
    if referred_user.last_earnings_update is None:
        return referred_user.daily_earnings

    time_since_last_update = datetime.utcnow() - referred_user.last_earnings_update
    if time_since_last_update < timedelta(days=1):
        return referred_user.daily_earnings

    # If it's been more than a day, return the daily earnings and reset
    earnings = referred_user.daily_earnings
    referred_user.daily_earnings = 0
    referred_user.last_earnings_update = datetime.utcnow()
    db.session.commit()
    return earnings

def update_user_earnings(user, amount):
    if user.last_earnings_update is None or datetime.utcnow() - user.last_earnings_update >= timedelta(days=1):
        user.daily_earnings = amount
    else:
        user.daily_earnings += amount
    user.last_earnings_update = datetime.utcnow()
    db.session.commit()

@app.route('/api/claim_referrals', methods=['POST'])
def claim_referral_rewards():
    data = request.json
    user = User.query.filter_by(user_id=data['user_id']).first()
    if user:
        if user.last_referral_claim is None or datetime.utcnow() - user.last_referral_claim >= timedelta(days=1):
            claimable_amount = calculate_claimable_amount(user)

            if claimable_amount > 0:
                user.balance += claimable_amount
                user.last_referral_claim = datetime.utcnow()
                db.session.commit()
                return jsonify({'success': True, 'new_balance': user.balance, 'reward': claimable_amount})
            else:
                return jsonify({'error': 'No rewards to claim'}), 400
        else:
            return jsonify({'error': 'Cannot claim referral rewards yet'}), 400
    return jsonify({'error': 'User not found'}), 404

if __name__ == '__main__':
    app.run(debug=False)