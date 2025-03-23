import requests
import json
from tabulate import tabulate

BASE_URL = "https://yara-mine.onrender.com"  # Adjust this if your Flask app is running on a different host/port

def get_all_users():
    response = requests.get(f"{BASE_URL}/api/leaderboard")
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: Unable to fetch users. Status code: {response.status_code}")
        return None

def get_user_details(user_id):
    response = requests.get(f"{BASE_URL}/api/user/{user_id}")
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: Unable to fetch user details. Status code: {response.status_code}")
        return None

def get_user_referrals(user_id):
    response = requests.get(f"{BASE_URL}/api/referrals/{user_id}")
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: Unable to fetch user referrals. Status code: {response.status_code}")
        return None

def display_users():
    users = get_all_users()
    if users:
        headers = ["Username", "Balance"]
        table_data = [[user['username'], user['balance']] for user in users]
        print(tabulate(table_data, headers=headers, tablefmt="grid"))
    else:
        print("No users found.")

def display_user_details(user_id):
    user = get_user_details(user_id)
    if user:
        print(json.dumps(user, indent=2))
    else:
        print(f"User with ID {user_id} not found.")

def display_user_referrals(user_id):
    referrals = get_user_referrals(user_id)
    if referrals:
        print(f"Referral Code: {referrals['referral_code']}")
        print(f"Referral Link: {referrals['referral_link']}")
        print(f"Last Claim Time: {referrals['last_claim_time']}")
        print(f"Claimable Amount: {referrals['claimable_amount']}")

        if referrals['referrals']:
            headers = ["Username", "Balance", "Earnings"]
            table_data = [[r['username'], r['balance'], r['earnings']] for r in referrals['referrals']]
            print("\nReferrals:")
            print(tabulate(table_data, headers=headers, tablefmt="grid"))
        else:
            print("No referrals found.")
    else:
        print(f"Unable to fetch referrals for user with ID {user_id}.")

def main():
    while True:
        print("\n1. View all users")
        print("2. View user details")
        print("3. View user referrals")
        print("4. Exit")

        choice = input("Enter your choice (1-4): ")

        if choice == '1':
            display_users()
        elif choice == '2':
            user_id = input("Enter user ID: ")
            display_user_details(user_id)
        elif choice == '3':
            user_id = input("Enter user ID: ")
            display_user_referrals(user_id)
        elif choice == '4':
            print("Exiting...")
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()