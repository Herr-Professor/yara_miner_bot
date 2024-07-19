import sys
path = '/home/HerrProfessor/yara_miner_bot'
if path not in sys.path:
    sys.path.append(path)

from app import app as application

if __name__ == '__main__':
    application.run()