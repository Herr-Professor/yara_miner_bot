from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
from datetime import datetime, timedelta
import logging
import random
import string

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://yara-miner-bot.vercel.app", "https://t.me"]}})
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///yara_game.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Configure logging
logging.basicConfig(level=logging.INFO)

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
    wallet_address = db.Column(db.String(255))

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

    # Log the entire request data
    app.logger.info(f"Full request data: {request.data}")

    # Log headers to check for any Telegram-specific information
    app.logger.info(f"Request headers: {request.headers}")

    user = User.query.filter_by(user_id=data['user_id']).first()

    if not user:
        referral_code = data.get('referral_code')
        app.logger.info(f"Referral code received in request: {referral_code}")

        # Log the start parameter separately if it's coming from Telegram
        start_param = data.get('start_param')
        app.logger.info(f"Start parameter from Telegram: {start_param}")

        referrer = None
        if referral_code:
            referrer = User.query.filter_by(referral_code=referral_code).first()
            app.logger.info(f"Found referrer: {referrer.username if referrer else 'None'}")

        new_user = User(
            user_id=data['user_id'],
            username=data['username'],
            referral_code=generate_referral_code()
        )
        db.session.add(new_user)
        db.session.flush()  # This will assign an ID to new_user
        app.logger.info(f"Created new user: {new_user.username} with referral code: {new_user.referral_code}")

        if referrer:
            try:
                referrer.balance += 2000  # Bonus for referrer
                new_referral = Referral(referrer_id=referrer.id, referred_id=new_user.id)
                db.session.add(new_referral)
                app.logger.info(f"Created new referral relationship: {referrer.username} referred {new_user.username}")
            except Exception as e:
                app.logger.error(f"Failed to create referral relationship: {str(e)}")
                db.session.rollback()
                return jsonify({'error': 'Failed to create referral relationship'}), 500

        try:
            db.session.commit()
            app.logger.info(f"Successfully committed new user and referral data")
        except Exception as e:
            app.logger.error(f"Failed to commit new user data: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Failed to create user'}), 500

        user = new_user
    else:
        app.logger.info(f"Found existing user: {user.username}")

    # Log the response being sent back
    response_data = {
        'user_id': user.user_id,
        'username': user.username,
        'balance': user.balance,
        'last_claim': user.last_claim.isoformat() if user.last_claim else None,
        'cipher_solved': user.cipher_solved,
        'next_cipher_time': user.next_cipher_time.isoformat() if user.next_cipher_time else None,
        'referral_link': f"https://t.me/yara_miner_bot/mine65?start={user.referral_code}"
    }
    app.logger.info(f"Sending response: {response_data}")

    return jsonify(response_data)

@app.route('/api/user/<user_id>', methods=['GET'])
def get_user(user_id):
    app.logger.info(f"Fetching user data for user_id: {user_id}")
    user = User.query.filter_by(user_id=user_id).first()
    if user:
        app.logger.info(f"User found: {user.username}")
        return jsonify({
            'user_id': user.user_id,
            'username': user.username,
            'balance': user.balance,
            'last_claim': user.last_claim.isoformat() if user.last_claim else None,
            'cipher_solved': user.cipher_solved,
            'next_cipher_time': user.next_cipher_time.isoformat() if user.next_cipher_time else None,
            'wallet_address': user.wallet_address  # Add this field to the response
        })
    app.logger.warning(f"User not found for user_id: {user_id}")
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/claim', methods=['POST'])
def claim_tokens():
    data = request.json
    app.logger.info(f"Claim request received for user_id: {data['user_id']}")
    user = User.query.filter_by(user_id=data['user_id']).first()
    if user:
        if user.last_claim is None or datetime.utcnow() - user.last_claim >= timedelta(hours=8):
            claim_amount = 3500
            user.balance += claim_amount
            user.last_claim = datetime.utcnow()
            update_user_earnings(user, claim_amount)
            db.session.commit()
            app.logger.info(f"Claim successful for {user.username}. New balance: {user.balance}")
            return jsonify({'success': True, 'new_balance': user.balance})
        else:
            app.logger.info(f"Claim attempt too soon for {user.username}")
            return jsonify({'error': 'Cannot claim yet'}), 400
    app.logger.warning(f"User not found for claim request: {data['user_id']}")
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/store/items', methods=['GET'])
def get_store_items():
    items = [
        {"id": 1, "name": "Boost 1", "description": "x2 multiplier on your Mining speed", "price": 0.2},
        {"id": 2, "name": "Boost 2", "description": "x3 multiplier on your Mining speed", "price": 0.3},
        {"id": 3, "name": "Boost 3", "description": "x5 multiplier on your Mining speed", "price": 0.5},
        # Add more items as needed
    ]
    return jsonify(items)

@app.route('/api/user/update_wallet', methods=['POST'])
def update_user_wallet():
    data = request.json
    user_id = data.get('user_id')
    wallet_address = data.get('wallet_address')

    app.logger.info(f"Updating wallet address for user_id: {user_id}")

    user = User.query.filter_by(user_id=user_id).first()
    if user:
        user.wallet_address = wallet_address
        db.session.commit()
        app.logger.info(f"Wallet address updated for {user.username}")
        return jsonify({'success': True})

    app.logger.warning(f"User not found for wallet update: {user_id}")
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/update_balance', methods=['POST'])
def update_balance():
    data = request.json
    user_id = data.get('user_id')
    amount = data.get('amount')

    app.logger.info(f"Balance update request for user_id: {user_id}, amount: {amount}")

    if not user_id or amount is None:
        app.logger.warning("Missing user_id or amount in balance update request")
        return jsonify({'error': 'Missing user_id or amount'}), 400

    user = User.query.filter_by(user_id=user_id).first()
    if not user:
        app.logger.warning(f"User not found for balance update: {user_id}")
        return jsonify({'error': 'User not found'}), 404

    try:
        amount = float(amount)
    except ValueError:
        app.logger.warning(f"Invalid amount for balance update: {amount}")
        return jsonify({'error': 'Invalid amount'}), 400

    user.balance += amount
    if user.balance < 0:
        user.balance = 0  # Ensure balance doesn't go negative

    db.session.commit()
    app.logger.info(f"Balance updated for {user.username}. New balance: {user.balance}")

    return jsonify({
        'success': True,
        'new_balance': user.balance
    })

@app.route('/api/solve_cipher', methods=['POST'])
def reset_cipher_status():
    current_time = datetime.utcnow()
    users_to_reset = User.query.filter(
        User.cipher_solved == True,
        User.next_cipher_time <= current_time
    ).all()

    for user in users_to_reset:
        user.cipher_solved = False
        user.next_cipher_time = None

    db.session.commit()
    app.logger.info(f"Reset cipher status for {len(users_to_reset)} users")

def solve_cipher():
    reset_cipher_status()
    data = request.json
    app.logger.info(f"Cipher solve attempt for user_id: {data['user_id']}")
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
                app.logger.info(f"Cipher solved successfully by {user.username}. New balance: {user.balance}")
                return jsonify({'success': True, 'new_balance': user.balance})
            else:
                app.logger.info(f"Incorrect cipher solution by {user.username}")
                return jsonify({'error': 'Incorrect solution'}), 400
        else:
            app.logger.info(f"Cipher already solved or not available for {user.username}")
            return jsonify({'error': 'Cipher already solved or not available'}), 400
    app.logger.warning(f"User not found for cipher solve attempt: {data['user_id']}")
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    app.logger.info("Fetching leaderboard")
    leaders = User.query.order_by(User.balance.desc()).limit(10).all()
    leaderboard = [{'username': leader.username, 'balance': leader.balance} for leader in leaders]
    app.logger.info(f"Leaderboard fetched: {leaderboard}")
    return jsonify(leaderboard)

@app.route('/api/referrals/<user_id>', methods=['GET'])
def get_referrals(user_id):
    app.logger.info(f"Fetching referrals for user_id: {user_id}")
    user = User.query.filter_by(user_id=user_id).first()
    if user:
        referrals = User.query.join(Referral, Referral.referred_id == User.id).filter(Referral.referrer_id == user.id).all()
        claimable_amount = calculate_claimable_amount(user)

        referral_link = f"https://t.me/yara_miner_bot/mine65?start={user.referral_code}"

        referral_data = {
            'referral_code': user.referral_code,
            'referral_link': referral_link,
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
        }
        app.logger.info(f"Referral data for {user.username}: {referral_data}")
        return jsonify(referral_data)
    app.logger.warning(f"User not found for referral data request: {user_id}")
    return jsonify({'error': 'User not found'}), 404

def calculate_claimable_amount(user):
    app.logger.info(f"Calculating claimable amount for {user.username}")
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
    app.logger.info(f"Claimable amount for {user.username}: {total_claimable}")
    return total_claimable

def calculate_earnings(referred_user):
    app.logger.info(f"Calculating earnings for referred user: {referred_user.username}")
    if referred_user.last_earnings_update is None:
        app.logger.info(f"No previous earnings update for {referred_user.username}")
        return referred_user.daily_earnings

    time_since_last_update = datetime.utcnow() - referred_user.last_earnings_update
    if time_since_last_update < timedelta(days=1):
        app.logger.info(f"Less than a day since last update for {referred_user.username}")
        return referred_user.daily_earnings

    # If it's been more than a day, return the daily earnings and reset
    earnings = referred_user.daily_earnings
    referred_user.daily_earnings = 0
    referred_user.last_earnings_update = datetime.utcnow()
    db.session.commit()
    app.logger.info(f"Earnings calculated for {referred_user.username}: {earnings}")
    return earnings

def update_user_earnings(user, amount):
    app.logger.info(f"Updating earnings for {user.username}, amount: {amount}")
    if user.last_earnings_update is None or datetime.utcnow() - user.last_earnings_update >= timedelta(days=1):
        user.daily_earnings = amount
    else:
        user.daily_earnings += amount
    user.last_earnings_update = datetime.utcnow()
    db.session.commit()
    app.logger.info(f"Updated daily earnings for {user.username}: {user.daily_earnings}")

@app.route('/api/claim_referrals', methods=['POST'])
def claim_referral_rewards():
    data = request.json
    app.logger.info(f"Referral claim request for user_id: {data['user_id']}")
    user = User.query.filter_by(user_id=data['user_id']).first()
    if user:
        if user.last_referral_claim is None or datetime.utcnow() - user.last_referral_claim >= timedelta(days=1):
            claimable_amount = calculate_claimable_amount(user)

            if claimable_amount > 0:
                user.balance += claimable_amount
                user.last_referral_claim = datetime.utcnow()
                db.session.commit()
                app.logger.info(f"Referral claim successful for {user.username}. Claimed amount: {claimable_amount}")
                return jsonify({'success': True, 'new_balance': user.balance, 'reward': claimable_amount})
            else:
                app.logger.info(f"No rewards to claim for {user.username}")
                return jsonify({'error': 'No rewards to claim'}), 400
        else:
            app.logger.info(f"Cannot claim referral rewards yet for {user.username}")
            return jsonify({'error': 'Cannot claim referral rewards yet'}), 400
    app.logger.warning(f"User not found for referral claim: {data['user_id']}")
    return jsonify({'error': 'User not found'}), 404

if __name__ == '__main__':
    app.run(debug=False)