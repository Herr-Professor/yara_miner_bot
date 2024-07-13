from app import app, db, User, Referral, ReferralClaim

def view_users():
    with app.app_context():
        users = User.query.all()
        for user in users:
            print(f"User ID: {user.id}")
            print(f"Username: {user.username}")
            print(f"Balance: {user.balance}")
            print(f"Last Claim: {user.last_claim}")
            print(f"Referral Code: {user.referral_code}")
            print(f"Last Referral Claim: {user.last_referral_claim}")

            # Get referrals
            referrals = Referral.query.filter_by(referrer_id=user.id).all()
            print(f"Referrals: {len(referrals)}")
            for referral in referrals:
                referred_user = User.query.get(referral.referred_id)
                print(f"  - {referred_user.username} (ID: {referred_user.id})")

            # Get referral claims
            referral_claims = ReferralClaim.query.filter_by(referrer_id=user.id).all()
            print(f"Referral Claims: {len(referral_claims)}")
            for claim in referral_claims:
                referred_user = User.query.get(claim.referred_id)
                print(f"  - {referred_user.username} (Amount: {claim.amount}, Time: {claim.claim_time})")

            print("\n" + "-"*30 + "\n")

if __name__ == "__main__":
    view_users()
