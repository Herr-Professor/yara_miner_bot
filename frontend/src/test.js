from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from datetime import datetime, timedelta
import uuid
import logging
import random
import string
import requests
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://yara_miner_bot.vercel.app"]}})
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///yara_game.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)

logging.basicConfig(level=logging.DEBUG)

TELEGRAM_TOKEN = os.environ.get('TELEGRAM_TOKEN', '7031484757:AAFxCtzFo5QiXzbO9_-tA-2wLGEasvtqxug')
TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}"

class User(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    username = db.Column(db.String(5), unique=True, nullable=False)
    secret_code = db.Column(db.String(15), unique=True, nullable=False)
    balance = db.Column(db.Float, default=0)
    last_claim = db.Column(db.DateTime)
    referral_code = db.Column(db.String(10), unique=True)
    last_referral_claim = db.Column(db.DateTime)
    cipher_solved = db.Column(db.Boolean, default=False)
    next_cipher_time = db.Column(db.DateTime)
    telegram_chat_id = db.Column(db.String(20), unique=True)

# ... (keep other model definitions as they were)

with app.app_context():
    db.create_all()

def generate_referral_code():
    return uuid.uuid4().hex[:8]

def generate_secret_code():
    return 'yX-' + ''.join(random.choices(string.ascii_letters + string.digits, k=12))

def send_telegram_message(chat_id, text):
    url = f'{TELEGRAM_API}/sendMessage'
    data = {'chat_id': chat_id, 'text': text}
    response = requests.post(url, json=data)
    return response.json()

@app.route('/webhook', methods=['POST'])
def telegram_webhook():
    update = request.json
    if 'message' in update:
        message = update['message']
        chat_id = message['chat']['id']
        username = message['from'].get('username')
        
        user = User.query.filter_by(username=username).first()
        if not user:
            secret_code = generate_secret_code()
            new_user = User(
                id=str(uuid.uuid4()),
                username=username,
                secret_code=secret_code,
                referral_code=generate_referral_code(),
                last_referral_claim=datetime.utcnow(),
                telegram_chat_id=str(chat_id)
            )
            db.session.add(new_user)
            db.session.commit()
            
            send_telegram_message(chat_id, f"Welcome, {username}! Your secret code is: {secret_code}")
        else:
            send_telegram_message(chat_id, f"Welcome back, {username}!")
        
        return jsonify({'status': 'ok'}), 200
    return jsonify({'status': 'error'}), 400

@app.route('/user', methods=['POST'])
def create_user():
    try:
        data = request.json
        app.logger.info(f"Received data: {data}")

        if not data:
            return jsonify({"message": "No input data provided"}), 400

        username = data.get('username')
        telegram_chat_id = data.get('telegram_chat_id')

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
            last_referral_claim=datetime.utcnow(),
            telegram_chat_id=telegram_chat_id
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

# ... (keep other routes as they were)

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

    if user.telegram_chat_id:
        if solved:
            send_telegram_message(user.telegram_chat_id, "Congratulations! You've solved the cipher.")
        else:
            send_telegram_message(user.telegram_chat_id, f"New cipher available at: {next_time}")

    return jsonify({"message": "Cipher status updated successfully"})

@app.route('/test_db')
def test_db():
    try:
        db.session.query(User).first()
        return jsonify({"message": "Database connection successful"}), 200
    except Exception as e:
        return jsonify({"message": f"Database connection failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=False)