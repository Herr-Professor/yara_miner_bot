import multiprocessing

# Bind to 0.0.0.0 to allow external access
bind = "0.0.0.0:$PORT"

# Number of worker processes
workers = multiprocessing.cpu_count() * 2 + 1

# Worker class to use
worker_class = 'sync'

# Timeout for worker processes
timeout = 120

# Enable access logging
accesslog = '-'
errorlog = '-'

# Log level
loglevel = 'info' 