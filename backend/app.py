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
    last_ton_purchase = db.Column(db.DateTime)
    balance_multiplier = db.Column(db.Float, default=1.0)
    mining_multiplier = db.Column(db.Float, default=1.0)
    purchased_multipliers = db.Column(db.String(255), default='')

class StoreItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    price = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), nullable=False)
    multiplier = db.Column(db.Float, nullable=False)

class Referral(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    referred_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    claimed = db.Column(db.Boolean, default=False)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    reward = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(50), nullable=False)
    url = db.Column(db.String(200))
    required_count = db.Column(db.Integer, default=1)
    required_balance = db.Column(db.Float, default=5000)

class UserTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime)
    claimed = db.Column(db.Boolean, default=False)
    claimed_at = db.Column(db.DateTime)

def create_initial_tasks():
    tasks = [
        Task(description="Invite a friend", reward=500, type="referral", required_count=1),
        Task(description="Invite 3 friends", reward=2000, type="referral", required_count=3),
        Task(description="Invite 5 friends", reward=5000, type="referral", required_count=5),
        Task(description="Invite 10 friends", reward=15000, type="referral", required_count=10),
        Task(description="Join our Telegram channel", reward=200, type="telegram", url="https://t.me/yaracoinchannel"),
        Task(description="Follow our Twitter page", reward=200, type="twitter", url="https://twitter.com/yaracoin"),
        Task(description="Reach 5,000 balance", reward=1000, type="achievement"),
        Task(description="Reach 10,000 balance", reward=2000, type="achievement"),
        Task(description="Reach 50,000 balance", reward=10000, type="achievement")
    ]
    db.session.bulk_save_objects(tasks)
    db.session.commit()

def create_initial_store_items():
    items = [
        StoreItem(id=1, name='Basic Multiplier', description='Double your current balance', price=10, currency='TON', multiplier=2.0),
        StoreItem(id=2, name='Advanced Multiplier', description='Triple your current balance', price=25, currency='TON', multiplier=3.0),
        StoreItem(id=3, name='Super Multiplier', description='Quadruple your current balance', price=50, currency='TON', multiplier=4.0),
        StoreItem(id=4, name='Mega Multiplier', description='5x your current balance', price=100, currency='TON', multiplier=5.0),
        StoreItem(id=5, name='Basic Miner', description='Increase mining speed by 50%', price=5000, currency='Balance', multiplier=1.5),
        StoreItem(id=6, name='Advanced Miner', description='Double your mining speed', price=10000, currency='Balance', multiplier=2.0),
        StoreItem(id=7, name='Super Miner', description='Triple your mining speed', price=25000, currency='Balance', multiplier=3.0),
        StoreItem(id=8, name='Mega Miner', description='5x your mining speed', price=50000, currency='Balance', multiplier=5.0),
        StoreItem(id=9, name='Ultra Miner', description='10x your mining speed', price=100000, currency='Balance', multiplier=10.0),
    ]
    db.session.bulk_save_objects(items)
    db.session.commit()

with app.app_context():
    db.create_all()
    if Task.query.count() == 0:
        create_initial_tasks()
    if StoreItem.query.count() == 0:
        create_initial_store_items()

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
        db.session.flush()
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
            'wallet_address': user.wallet_address
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
            base_claim_amount = 3500
            # Add this check
            balance_multiplier = user.balance_multiplier if user.balance_multiplier is not None else 1
            claim_amount = base_claim_amount * balance_multiplier
            user.balance += claim_amount
            user.last_claim = datetime.utcnow()
            db.session.commit()
            app.logger.info(f"Claim successful for {user.username}. New balance: {user.balance}")
            return jsonify({'success': True, 'new_balance': user.balance, 'claimed_amount': claim_amount})
        else:
            app.logger.info(f"Claim attempt too soon for {user.username}")
            return jsonify({'error': 'Cannot claim yet'}), 400
    app.logger.warning(f"User not found for claim request: {data['user_id']}")
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/user/<user_id>/last_purchase_time', methods=['GET'])
def get_last_purchase_time(user_id):
    app.logger.info(f"Fetching last purchase time for user_id: {user_id}")
    user = User.query.filter_by(user_id=user_id).first()
    if user:
        return jsonify({
            'last_purchase_time': user.last_ton_purchase.isoformat() if user.last_ton_purchase else None
        })
    app.logger.warning(f"User not found for user_id: {user_id}")
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/update_multiplier', methods=['POST'])
def update_multiplier():
    data = request.json
    user_id = data.get('user_id')
    multiplier = data.get('multiplier')

    app.logger.info(f"Updating multiplier for user_id: {user_id}, multiplier: {multiplier}")

    user = User.query.filter_by(user_id=user_id).first()
    if not user:
        app.logger.warning(f"User not found for user_id: {user_id}")
        return jsonify({'error': 'User not found'}), 404

    user.balance_multiplier = multiplier
    user.last_ton_purchase = datetime.utcnow()
    db.session.commit()

    app.logger.info(f"Multiplier updated for {user.username}. New multiplier: {user.balance_multiplier}")
    return jsonify({'success': True, 'new_multiplier': user.balance_multiplier})

@app.route('/api/purchase', methods=['POST'])
def purchase():
    data = request.json
    user_id = data.get('user_id')
    item_id = data.get('item_id')

    app.logger.info(f"Purchase request for user_id: {user_id}, item_id: {item_id}")

    user = User.query.filter_by(user_id=user_id).first()
    if not user:
        app.logger.warning(f"User not found for user_id: {user_id}")
        return jsonify({'error': 'User not found'}), 404

    item = StoreItem.query.get(item_id)
    if not item:
        app.logger.warning(f"Item not found for item_id: {item_id}")
        return jsonify({'error': 'Item not found'}), 404

    if item.currency == 'Balance':
        if user.balance < item.price:
            app.logger.warning(f"Insufficient balance for user: {user.username}")
            return jsonify({'error': 'Insufficient balance'}), 400

        # Check if the user has already purchased this multiplier
        purchased_multipliers = user.purchased_multipliers.split(',') if user.purchased_multipliers else []
        if str(item.id) in purchased_multipliers:
            app.logger.warning(f"User {user.username} already purchased multiplier: {item.id}")
            return jsonify({'error': 'Multiplier already purchased'}), 400

        user.balance -= item.price
        user.mining_multiplier = item.multiplier

        # Add the purchased multiplier to the user's list
        purchased_multipliers.append(str(item.id))
        user.purchased_multipliers = ','.join(purchased_multipliers)
    elif item.currency == 'TON':
        user.balance_multiplier = item.multiplier
        user.last_ton_purchase = datetime.utcnow()
    else:
        app.logger.warning(f"Invalid currency for item: {item.id}")
        return jsonify({'error': 'Invalid item currency'}), 400

    db.session.commit()

    app.logger.info(f"Purchase successful for {user.username}. New balance: {user.balance}, New mining multiplier: {user.mining_multiplier}")
    return jsonify({
        'success': True,
        'new_balance': user.balance,
        'new_mining_multiplier': user.mining_multiplier,
        'new_balance_multiplier': user.balance_multiplier
    })

@app.route('/api/store/items', methods=['GET'])
def get_store_items():
    app.logger.info("Fetching store items")
    user_id = request.args.get('user_id')
    user = User.query.filter_by(user_id=user_id).first()

    items = StoreItem.query.all()
    purchased_multipliers = user.purchased_multipliers.split(',') if user and user.purchased_multipliers else []

    return jsonify([{
        'id': item.id,
        'name': item.name,
        'description': item.description,
        'price': item.price,
        'currency': item.currency,
        'multiplier': item.multiplier,
        'purchased': str(item.id) in purchased_multipliers if item.currency == 'Balance' else False
    } for item in items])

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
def solve_cipher():
    data = request.json
    app.logger.info(f"Cipher solve attempt for user_id: {data['user_id']}")
    user = User.query.filter_by(user_id=data['user_id']).first()
    if user:
        if not user.cipher_solved and (user.next_cipher_time is None or datetime.utcnow() >= user.next_cipher_time):
            if data['solution'].upper() == 'CARBONITE':
                reward_amount = 3000
                user.balance += reward_amount
                user.cipher_solved = True
                next_time = datetime.utcnow().replace(hour=12, minute=0, second=0, microsecond=0)
                if next_time <= datetime.utcnow():
                    next_time += timedelta(days=1)
                user.next_cipher_time = next_time
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

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    user_id = request.args.get('user_id')
    user = User.query.filter_by(user_id=user_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    all_tasks = Task.query.all()
    user_tasks = UserTask.query.filter_by(user_id=user.id).all()

    tasks = []
    for task in all_tasks:
        user_task = next((ut for ut in user_tasks if ut.task_id == task.id), None)
        if not user_task or not user_task.completed:
            tasks.append({
                'id': task.id,
                'description': task.description,
                'reward': task.reward,
                'type': task.type,
                'completed': user_task.completed if user_task else False,
                'claimed': user_task.claimed if user_task else False,
                'cooldown': (user_task.completed_at + timedelta(minutes=1) - datetime.utcnow()).total_seconds() if user_task and user_task.completed_at else 0
            })

    return jsonify(tasks)

@app.route('/api/verify_task', methods=['POST'])
def verify_task():
    data = request.json
    user_id = data.get('user_id')
    task_id = data.get('task_id')

    user = User.query.filter_by(user_id=user_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    if task.type == 'referral':
        referral_count = Referral.query.filter_by(referrer_id=user.id).count()
        if referral_count >= task.required_count:
            return complete_task(user, task)
        else:
            return jsonify({'error': 'Not enough referrals'}), 400

    elif task.type == 'telegram':
        # Implement Telegram channel membership verification
        telegram_username = data.get('telegram_username')
        if not telegram_username:
            return jsonify({'error': 'Telegram username not provided'}), 400

        if verify_telegram_membership(telegram_username, task.url):
            return complete_task(user, task)
        else:
            return jsonify({'error': 'Not a member our channel'}), 400

    elif task.type == 'twitter':
        # Implement Twitter follow verification
        twitter_username = data.get('twitter_username')
        if not twitter_username:
            return jsonify({'error': 'Twitter username not provided'}), 400

        if verify_twitter_follow(twitter_username, task.url):
            return complete_task(user, task)
        else:
            return jsonify({'error': 'Not following the Twitter account'}), 400

    elif task.type == 'achievement':
        user_balance = user.balance  # Assuming user object has a balance attribute
        if user_balance >= task.required_balance:
            return complete_task(user, task)
        else:
            return jsonify({
            'error': 'Achievement not reached',
            'current_balance': user_balance,
            'required_balance': task.required_balance
            }), 400
    else:
        return jsonify({'error': 'Invalid task type'}), 400

def verify_telegram_membership(username, channel_url):
    # This is a placeholder function. In a real-world scenario, you would need to use
    # Telegram's Bot API to verify channel membership.
    # For demonstration purposes, we'll assume the verification is successful.
    app.logger.info(f"Verifying Telegram membership for {username} in {channel_url}")
    return True

def verify_twitter_follow(username, twitter_url):
    # This is a placeholder function. In a real-world scenario, you would need to use
    # Twitter's API to verify if a user is following an account.
    # For demonstration purposes, we'll assume the verification is successful.
    app.logger.info(f"Verifying Twitter follow for {username} on {twitter_url}")
    return True

def complete_task(user, task):
    user_task = UserTask.query.filter_by(user_id=user.id, task_id=task.id).first()
    if not user_task:
        user_task = UserTask(user_id=user.id, task_id=task.id)
        db.session.add(user_task)

    user_task.completed = True
    user_task.completed_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'success': True, 'message': 'Task completed'})

@app.route('/api/claim_task', methods=['POST'])
def claim_task():
    data = request.json
    user_id = data.get('user_id')
    task_id = data.get('task_id')

    user = User.query.filter_by(user_id=user_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user_task = UserTask.query.filter_by(user_id=user.id, task_id=task_id).first()
    if not user_task or not user_task.completed or user_task.claimed:
        return jsonify({'error': 'Cannot claim task'}), 400

    if datetime.utcnow() - user_task.completed_at < timedelta(minutes=1):
        return jsonify({'error': 'Task is still on cooldown'}), 400

    task = Task.query.get(task_id)
    user.balance += task.reward
    user_task.claimed = True
    user_task.claimed_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'success': True, 'new_balance': user.balance})

@app.route('/api/referrals/<user_id>', methods=['GET'])
def get_referrals(user_id):
    app.logger.info(f"Fetching referrals for user_id: {user_id}")
    user = User.query.filter_by(user_id=user_id).first()
    if user:
        referrals = User.query.join(Referral, Referral.referred_id == User.id).filter(Referral.referrer_id == user.id).all()

        referral_link = f"https://t.me/yara_miner_bot/mine65?start={user.referral_code}"

        referral_data = {
            'referral_code': user.referral_code,
            'referral_link': referral_link,
            'referrals': [
                {
                    'username': referral.username,
                    'balance': referral.balance,
                }
                for referral in referrals
            ]
        }
        app.logger.info(f"Referral data for {user.username}: {referral_data}")
        return jsonify(referral_data)
    app.logger.warning(f"User not found for referral data request: {user_id}")
    return jsonify({'error': 'User not found'}), 404

if __name__ == '__main__':
    app.run(debug=False)