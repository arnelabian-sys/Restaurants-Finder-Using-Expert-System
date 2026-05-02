from flask import Flask, request, jsonify, send_from_directory, make_response
from flask import Flask, render_template, session, redirect, url_for, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from flask import session, redirect
import sqlite3
import os
import json

# ============================================
# DATABASE CLASS
# ============================================

class Database:
    def __init__(self, db_path='restaurant.db'):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.db_path = os.path.join(base_dir, db_path)

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS restaurants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                emoji TEXT NOT NULL DEFAULT '🍽️',
                cuisine TEXT NOT NULL,
                price TEXT NOT NULL,
                price_n INTEGER NOT NULL DEFAULT 1,
                distance REAL NOT NULL DEFAULT 0.0,
                rating REAL NOT NULL DEFAULT 4.0,
                tags TEXT NOT NULL DEFAULT '[]',
                is_open INTEGER NOT NULL DEFAULT 1,
                category TEXT NOT NULL DEFAULT 'other',
                lat REAL NOT NULL DEFAULT 9.1835,
                lng REAL NOT NULL DEFAULT 125.5375,
                created_at TEXT DEFAULT (datetime('now'))
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT
            )
        ''')

        cursor.execute('SELECT COUNT(*) FROM restaurants')
        count = cursor.fetchone()[0]

        if count == 0:
            seed_data = [
            ("River Way", '🌊', 'Filipino Cuisine', '₱₱', 2, 0.8, 4.6, '["seafood", "pork", "chicken", "grilled", "family"]', 1, 'filipino', 9.12564, 125.54054),
            ("Tambayan sa Suba", '🚣', 'Filipino Dishes', '₱₱', 2, 0.9, 4.5, '["Native", "seafood", "pork", "chicken", "grilled", "Relaxing", "Outdoor"]', 1, 'filipino', 9.12520, 125.54057),
            ("Gazebo Pools & Restaurant", '🏊', 'Filipino/General', '₱₱', 2, 1.2, 4.4, '["Pool", "Family", "Events"]', 1, 'filipino', 9.12455, 125.54550),
            ("Helen's Diner", '🥘', 'Home-style Cooking', '₱', 1, 0.6, 4.2, '["Budget", "Quick", "Home-style"]', 1, 'filipino', 9.12062, 125.54710),
            ("Kayee Garden Grill", '🌿', 'Garden Grill', '₱₱', 2, 0.7, 4.5, '["Garden", "Grilled", "Cozy"]', 1, 'bbq', 9.12137, 125.54330),
            ("Zackies Restaurant", '🍽️', 'Filipino Favorites', '₱₱', 2, 0.9, 4.2, '["Modern", "Clean", "Family"]', 1, 'filipino', 9.11743, 125.54174),
            ("Conching Cafe & Food Park", '🎡', 'Various Foods', '₱₱', 2, 0.7, 4.5, '["Outdoor", "Food Park", "Vibes"]', 1, 'filipino', 9.11712, 125.5380),
            ("Jollibee", '🐝', 'Fast Food', '₱₱', 2, 0.3, 4.8, '["Kids", "Fried Chicken", "Fast Food"]', 1, 'fastfood', 9.11933, 125.53891),
            ("Villatuna - Cabadbaran", '🐟', 'Fresh Seafood', '₱₱₱', 3, 0.6, 4.6, '["Seafood", "Tuna", "Fresh"]', 1, 'seafood', 9.12029, 125.53871),
            ("Weegool's", '🍗', 'Filipino BBQ', '₱₱', 2, 0.4, 4.4, '["Chicken", "Lunch", "Popular"]', 1, 'filipino', 9.12254, 125.5366),
            ("Gyeongju Samgyupsal", '🇰🇷', 'Korean BBQ', '₱₱₱', 3, 0.5, 4.7, '["Unlimited", "Meat", "Korean"]', 1, 'korean bbq', 9.12477, 125.53828),
            ("Sabang Dike Barbeque House", '🍢', 'Street BBQ', '₱', 1, 1.1, 4.3, '["Dike", "Cheap", "Budget"]', 1, 'bbq', 9.12316, 125.52844),
            ("LANI'S FOOD HOUSE", '🏠', 'Filipino Lutong Bahay', '₱', 1, 0.8, 4.0, '["Daily Menu", "Fast", "Local"]', 1, 'filipino', 9.12174, 125.53252),
            ("Hayahay Restaurant", '🌴', 'Filipino / Seafood', '₱₱', 2, 3.5, 4.5, '["Relaxing", "Far", "View"]', 1, 'filipino', 9.09197, 125.55214),
            ("McDonald's", '🍟', 'Fast Food', '₱₱', 2, 0.4, 4.8, '["Burger", "24/7", "Fast Food"]', 1, 'fastfood', 9.11756, 125.54247),
            ("Don Benido's BBQ House", '🥓', 'Smoked BBQ', '₱₱', 2, 4.2, 4.6, '["Flavorful", "Grills", "Specialty"]', 1, 'bbq', 9.09909, 125.56315)
        ]

            cursor.executemany('''
                INSERT INTO restaurants
                (name, emoji, cuisine, price, price_n, distance, rating, tags, is_open, category, lat, lng)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', seed_data)

        conn.commit()
        conn.close()
        print("Database ready")

# ============================================
# SERVICE CLASS (LOGIC)
# ============================================

class RestaurantService:
    def __init__(self, db):
        self.db = db

    def row_to_dict(self, row):
        d = dict(row)
        d['tags'] = json.loads(d.get('tags', '[]'))
        d['open'] = bool(d.pop('is_open'))
        d['priceN'] = d.pop('price_n')
        d['dist'] = d.pop('distance')
        return d

    def get_all(self, category, open_only, search):
        conn = self.db.get_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM restaurants WHERE 1=1"
        params = []

        if category and category != 'all':
            query += " AND category = ?"
            params.append(category)

        if open_only == '1':
            query += " AND is_open = 1"

        if search:
            like = f"%{search.lower()}%"
            query += " AND (LOWER(name) LIKE ? OR LOWER(cuisine) LIKE ? OR LOWER(tags) LIKE ?)"
            params.extend([like, like, like])

        query += " ORDER BY rating DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return [self.row_to_dict(r) for r in rows]

    def get_one(self, rid):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM restaurants WHERE id = ?', (rid,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return None
        return self.row_to_dict(row)

# ============================================
# MAIN APP CLASS
# ============================================

class RestaurantApp:
    def __init__(self):
        self.app = Flask(__name__, static_folder='static')
        self.app.secret_key = 'restaurant-finder-secret-2026'
        self.app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
        self.app.config['SESSION_COOKIE_HTTPONLY'] = True
        self.app.config['SESSION_COOKIE_SECURE'] = False
        self.app.config['SESSION_COOKIE_NAME'] = 'restaurant_session'
        CORS(self.app, supports_credentials=True, origins=['http://127.0.0.1:5000', 'http://localhost:5000'])

        self.db = Database()
        self.service = RestaurantService(self.db)

        self.setup_routes()

    def setup_routes(self):

        # ============================================
        # PAGE ROUTES
        # ============================================

        @self.app.route('/')
        def index():
            return render_template('frontpage.html')

        @self.app.route('/explore')
        def explore():
            return render_template('index.html')

        @self.app.route('/login')
        def login_page():
            return render_template('login.html')

        @self.app.route('/signup')
        def signup_page():
            return render_template('signup.html')

        @self.app.route('/admin')
        def admin_page():
            if not session.get('user'):
                return redirect(url_for('login_page'))
            return render_template('admin.html')

        # ============================================
        # STATIC FILES
        # ============================================

        @self.app.route('/static/<path:filename>')
        def serve_static(filename):
            return send_from_directory('static', filename)

        # ============================================
        # AUTH API ROUTES
        # ============================================

        @self.app.route('/api/check-auth')
        def check_auth():
            # FIX: Return 401 kung wala login, 200 kung naay session
            if not session.get('user'):
                return jsonify({"error": "Not authenticated"}), 401
            return jsonify({"authenticated": True})

        @self.app.route('/api/login', methods=['POST'])
        def login():
            data = request.json
            username = data.get('username')
            password = data.get('password')
            conn = self.db.get_connection()
            user = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
            conn.close()
            if user and check_password_hash(user['password'], password):
                session['user'] = username
                return jsonify({"success": True})
            return jsonify({"error": "Invalid credentials"}), 401

        # FIX: Added missing /api/signup route
        @self.app.route('/api/signup', methods=['POST'])
        def signup():
            data = request.json
            username = data.get('username', '').strip()
            password = data.get('password', '')

            if not username or not password:
                return jsonify({"error": "Username and password are required."}), 400

            if len(password) < 4:
                return jsonify({"error": "Password must be at least 4 characters."}), 400

            hashed = generate_password_hash(password)
            conn = self.db.get_connection()
            try:
                conn.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed))
                conn.commit()
            except sqlite3.IntegrityError:
                conn.close()
                return jsonify({"error": "Username already exists."}), 409
            conn.close()
            return jsonify({"success": True})

        @self.app.route('/api/logout')
        def logout():
            session.clear()
            return redirect(url_for('index'))

        # ============================================
        # PUBLIC RESTAURANT API
        # ============================================

        @self.app.route('/api/restaurants')
        def get_restaurants():
            category = request.args.get('category')
            open_only = request.args.get('open')
            search = request.args.get('search', '').strip()
            data = self.service.get_all(category, open_only, search)
            return jsonify(data)

        @self.app.route('/api/restaurants/<int:rid>')
        def get_restaurant(rid):
            data = self.service.get_one(rid)
            if not data:
                return make_response(jsonify({'error': 'Restaurant not found'}), 404)
            return jsonify(data)

        # ============================================
        # ADMIN RESTAURANT API (FIX: All missing routes)
        # ============================================

        def admin_required():
            """Helper: returns error response if not logged in, else None."""
            if not session.get('user'):
                return jsonify({"error": "Unauthorized"}), 401
            return None

        @self.app.route('/api/admin/restaurants', methods=['POST'])
        def admin_add_restaurant():
            err = admin_required()
            if err:
                return err

            d = request.json
            tags_json = json.dumps(d.get('tags', []))
            price_n = 1 if d.get('price') == '₱' else 2 if d.get('price') == '₱₱' else 3

            conn = self.db.get_connection()
            conn.execute('''
                INSERT INTO restaurants
                (name, emoji, cuisine, price, price_n, distance, rating, tags, is_open, category, lat, lng)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                d.get('name'), d.get('emoji', '🍽️'), d.get('cuisine'),
                d.get('price'), price_n, d.get('dist', 0.0),
                d.get('rating', 4.0), tags_json,
                1 if d.get('open') else 0,
                d.get('category', 'other'),
                d.get('lat', 9.1835), d.get('lng', 125.5375)
            ))
            conn.commit()
            conn.close()
            return jsonify({"success": True}), 201

        @self.app.route('/api/admin/restaurants/<int:rid>', methods=['PUT'])
        def admin_update_restaurant(rid):
            err = admin_required()
            if err:
                return err

            d = request.json
            tags_json = json.dumps(d.get('tags', []))
            price_n = 1 if d.get('price') == '₱' else 2 if d.get('price') == '₱₱' else 3

            conn = self.db.get_connection()
            conn.execute('''
                UPDATE restaurants SET
                    name=?, emoji=?, cuisine=?, price=?, price_n=?,
                    distance=?, rating=?, tags=?, is_open=?, category=?, lat=?, lng=?
                WHERE id=?
            ''', (
                d.get('name'), d.get('emoji', '🍽️'), d.get('cuisine'),
                d.get('price'), price_n, d.get('dist', 0.0),
                d.get('rating', 4.0), tags_json,
                1 if d.get('open') else 0,
                d.get('category', 'other'),
                d.get('lat', 9.1835), d.get('lng', 125.5375),
                rid
            ))
            conn.commit()
            conn.close()
            return jsonify({"success": True})

        @self.app.route('/api/admin/restaurants/<int:rid>', methods=['DELETE'])
        def admin_delete_restaurant(rid):
            err = admin_required()
            if err:
                return err

            conn = self.db.get_connection()
            conn.execute("DELETE FROM restaurants WHERE id=?", (rid,))
            conn.commit()
            conn.close()
            return jsonify({"success": True})

    def run(self):
        print(f"Using DB: {os.path.abspath(self.db.db_path)}")
        self.db.init_db()
        self.app.run(debug=False, port=5000)

# ============================================
# RUN APP
# ============================================

# Para sa Render/Gunicorn
restaurant_app = RestaurantApp()
app = restaurant_app.app

# Para sa local testing
if __name__ == '__main__':
    restaurant_app.run()