from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import logging

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://yara-miner-bot.vercel.app"]}})
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

class Referral(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    referred_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    claimed = db.Column(db.Boolean, default=False)

with app.app_context():
    db.create_all()

@app.route('/api/user/check_and_create', methods=['POST'])
def check_and_create_user():
    data = request.json
    user = User.query.filter_by(user_id=data['user_id']).first()
    
    if not user:
        # Create new user
        new_user = User(user_id=data['user_id'], username=data['username'])
        db.session.add(new_user)
        db.session.commit()
        app.logger.info(f"Created new user: {new_user.username}")
        user = new_user
    
    return jsonify({
        'user_id': user.user_id,
        'username': user.username,
        'balance': user.balance,
        'last_claim': user.last_claim.isoformat() if user.last_claim else None,
        'cipher_solved': user.cipher_solved,
        'next_cipher_time': user.next_cipher_time.isoformat() if user.next_cipher_time else None
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
            user.balance += 100
            user.last_claim = datetime.utcnow()
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
                user.balance += 1000
                user.cipher_solved = True
                next_time = datetime.utcnow().replace(hour=12, minute=0, second=0, microsecond=0)
                if next_time <= datetime.utcnow():
                    next_time += timedelta(days=1)
                user.next_cipher_time = next_time
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
        return jsonify([
            {'username': referral.username, 'balance': referral.balance}
            for referral in referrals
        ])
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/claim_referrals', methods=['POST'])
def claim_referral_rewards():
    data = request.json
    user = User.query.filter_by(user_id=data['user_id']).first()
    if user:
        if user.last_referral_claim is None or datetime.utcnow() - user.last_referral_claim >= timedelta(days=1):
            unclaimed_referrals = Referral.query.filter_by(referrer_id=user.id, claimed=False).all()
            reward = len(unclaimed_referrals) * 50  # 50 tokens per unclaimed referral

            if reward > 0:
                user.balance += reward
                user.last_referral_claim = datetime.utcnow()

                for referral in unclaimed_referrals:
                    referral.claimed = True

                db.session.commit()
                return jsonify({'success': True, 'new_balance': user.balance, 'reward': reward})
            else:
                return jsonify({'error': 'No unclaimed referrals'}), 400
        else:
            return jsonify({'error': 'Cannot claim referral rewards yet'}), 400
    return jsonify({'error': 'User not found'}), 404

if __name__ == '__main__':
    app.run(debug=False)