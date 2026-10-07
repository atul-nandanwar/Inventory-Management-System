from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os


# ============================================================
# APPLICATION CONFIGURATION
# ============================================================

app = Flask(__name__)

# Allow frontend to communicate with Flask backend
CORS(app)


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "inventory.db")


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_db_connection():
    """
    Create and return a SQLite database connection.
    """

    connection = sqlite3.connect(DATABASE)

    # Access database columns using column names
    connection.row_factory = sqlite3.Row

    return connection


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def initialize_database():
    """
    Create the products table if it does not already exist.
    """

    connection = get_db_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0,
            price REAL NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def product_to_dict(product):
    """
    Convert SQLite Row into a normal Python dictionary.
    """

    return {
        "product_id": product["product_id"],
        "name": product["name"],
        "category": product["category"],
        "quantity": product["quantity"],
        "price": product["price"],
        "created_at": product["created_at"]
    }


def validate_product_data(data, require_product_id=True):
    """
    Validate product data received from frontend.

    Returns:
        (clean_data, error_message)
    """

    if not data:
        return None, "Request body must contain JSON data"

    product_id = str(data.get("product_id", "")).strip()
    name = str(data.get("name", "")).strip()
    category = str(data.get("category", "")).strip()

    quantity = data.get("quantity")
    price = data.get("price")

    # Product ID
    if require_product_id and not product_id:
        return None, "Product ID is required"

    # Name
    if not name:
        return None, "Product name is required"

    # Category
    if not category:
        return None, "Product category is required"

    # Quantity
    if quantity is None:
        return None, "Quantity is required"

    # Price
    if price is None:
        return None, "Price is required"

    # Convert quantity
    try:
        quantity = int(quantity)
    except (ValueError, TypeError):
        return None, "Quantity must be an integer"

    # Convert price
    try:
        price = float(price)
    except (ValueError, TypeError):
        return None, "Price must be a number"

    # Range validation
    if quantity < 0:
        return None, "Quantity cannot be negative"

    if price < 0:
        return None, "Price cannot be negative"

    return {
        "product_id": product_id,
        "name": name,
        "category": category,
        "quantity": quantity,
        "price": price
    }, None


# ============================================================
# HOME / SERVER STATUS
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "success": True,
        "message": "Inventory Management System API is running",
        "version": "1.0",
        "backend": "Flask",
        "database": "SQLite",
        "status": "active"
    }), 200


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/api/health", methods=["GET"])
def health_check():

    connection = None

    try:

        connection = get_db_connection()

        connection.execute("SELECT 1")

        return jsonify({
            "success": True,
            "message": "Backend and database are working properly",
            "database": "SQLite",
            "status": "healthy"
        }), 200

    except Exception as error:

        return jsonify({
            "success": False,
            "message": "Backend health check failed",
            "error": str(error)
        }), 500

    finally:

        if connection:
            connection.close()


# ============================================================
# GET ALL PRODUCTS
# ============================================================

@app.route("/api/products", methods=["GET"])
def get_products():

    connection = None

    try:

        connection = get_db_connection()

        products = connection.execute("""
            SELECT
                product_id,
                name,
                category,
                quantity,
                price,
                created_at
            FROM products
            ORDER BY id DESC
        """).fetchall()

        return jsonify([
            product_to_dict(product)
            for product in products
        ]), 200

    except Exception as error:

        return jsonify({
            "success": False,
            "error": "Unable to fetch products",
            "details": str(error)
        }), 500

    finally:

        if connection:
            connection.close()


# ============================================================
# GET SINGLE PRODUCT
# ============================================================

@app.route("/api/products/<product_id>", methods=["GET"])
def get_product(product_id):

    connection = None

    try:

        connection = get_db_connection()

        product = connection.execute("""
            SELECT
                product_id,
                name,
                category,
                quantity,
                price,
                created_at
            FROM products
            WHERE product_id = ?
        """, (product_id,)).fetchone()

        if product is None:

            return jsonify({
                "success": False,
                "error": "Product not found"
            }), 404

        return jsonify(product_to_dict(product)), 200

    except Exception as error:

        return jsonify({
            "success": False,
            "error": "Unable to fetch product",
            "details": str(error)
        }), 500

    finally:

        if connection:
            connection.close()


# ============================================================
# SEARCH PRODUCTS
# ============================================================

@app.route("/api/products/search", methods=["GET"])
def search_products():

    query = request.args.get("q", "").strip()

    if not query:

        return jsonify({
            "success": False,
            "error": "Search query is required"
        }), 400

    connection = None

    try:

        connection = get_db_connection()

        search_pattern = f"%{query}%"

        products = connection.execute("""
            SELECT
                product_id,
                name,
                category,
                quantity,
                price,
                created_at
            FROM products
            WHERE
                product_id LIKE ?
                OR name LIKE ?
                OR category LIKE ?
            ORDER BY id DESC
        """, (
            search_pattern,
            search_pattern,
            search_pattern
        )).fetchall()

        return jsonify([
            product_to_dict(product)
            for product in products
        ]), 200

    except Exception as error:

        return jsonify({
            "success": False,
            "error": "Search failed",
            "details": str(error)
        }), 500

    finally:

        if connection:
            connection.close()


# ============================================================
# ADD PRODUCT
# ============================================================

@app.route("/api/products", methods=["POST"])
def add_product():

    data = request.get_json(silent=True)

    clean_data, error_message = validate_product_data(
        data,
        require_product_id=True
    )

    if error_message:

        return jsonify({
            "success": False,
            "error": error_message
        }), 400

    product_id = clean_data["product_id"]
    name = clean_data["name"]
    category = clean_data["category"]
    quantity = clean_data["quantity"]
    price = clean_data["price"]

    connection = None

    try:

        connection = get_db_connection()

        # Check duplicate Product ID
        existing_product = connection.execute("""
            SELECT product_id
            FROM products
            WHERE product_id = ?
        """, (product_id,)).fetchone()

        if existing_product:

            return jsonify({
                "success": False,
                "error": "Product ID already exists"
            }), 409

        # Insert product
        connection.execute("""
            INSERT INTO products
            (
                product_id,
                name,
                category,
                quantity,
                price
            )
            VALUES (?, ?, ?, ?, ?)
        """, (
            product_id,
            name,
            category,
            quantity,
            price
        ))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Product added successfully",
            "product": {
                "product_id": product_id,
                "name": name,
                "category": category,
                "quantity": quantity,
                "price": price
            }
        }), 201

    except sqlite3.IntegrityError:

        return jsonify({
            "success": False,
            "error": "Product ID already exists"
        }), 409

    except Exception as error:

        return jsonify({
            "success": False,
            "error": "Unable to add product",
            "details": str(error)
        }), 500

    finally:

        if connection:
            connection.close()


# ============================================================
# UPDATE PRODUCT
# ============================================================

@app.route("/api/products/<product_id>", methods=["PUT"])
def update_product(product_id):

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "error": "Request body must contain JSON data"
        }), 400

    name = str(data.get("name", "")).strip()
    category = str(data.get("category", "")).strip()
    quantity = data.get("quantity")
    price = data.get("price")

    # Validate name
    if not name:

        return jsonify({
            "success": False,
            "error": "Product name is required"
        }), 400

    # Validate category
    if not category:

        return jsonify({
            "success": False,
            "error": "Product category is required"
        }), 400

    # Validate quantity
    if quantity is None:

        return jsonify({
            "success": False,
            "error": "Quantity is required"
        }), 400

    # Validate price
    if price is None:

        return jsonify({
            "success": False,
            "error": "Price is required"
        }), 400

    # Convert quantity
    try:
        quantity = int(quantity)
    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "error": "Quantity must be an integer"
        }), 400

    # Convert price
    try:
        price = float(price)
    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "error": "Price must be a number"
        }), 400

    # Range validation
    if quantity < 0:

        return jsonify({
            "success": False,
            "error": "Quantity cannot be negative"
        }), 400

    if price < 0:

        return jsonify({
            "success": False,
            "error": "Price cannot be negative"
        }), 400

    connection = None

    try:

        connection = get_db_connection()

        # Check product exists
        existing_product = connection.execute("""
            SELECT product_id
            FROM products
            WHERE product_id = ?
        """, (product_id,)).fetchone()

        if existing_product is None:

            return jsonify({
                "success": False,
                "error": "Product not found"
            }), 404

        # Update product
        connection.execute("""
            UPDATE products
            SET
                name = ?,
                category = ?,
                quantity = ?,
                price = ?
            WHERE product_id = ?
        """, (
            name,
            category,
            quantity,
            price,
            product_id
        ))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Product updated successfully",
            "product": {
                "product_id": product_id,
                "name": name,
                "category": category,
                "quantity": quantity,
                "price": price
            }
        }), 200

    except Exception as error:

        return jsonify({
            "success": False,
            "error": "Unable to update product",
            "details": str(error)
        }), 500

    finally:

        if connection:
            connection.close()


# ============================================================
# DELETE PRODUCT
# ============================================================

@app.route("/api/products/<product_id>", methods=["DELETE"])
def delete_product(product_id):

    connection = None

    try:

        connection = get_db_connection()

        # Check product exists
        existing_product = connection.execute("""
            SELECT product_id
            FROM products
            WHERE product_id = ?
        """, (product_id,)).fetchone()

        if existing_product is None:

            return jsonify({
                "success": False,
                "error": "Product not found"
            }), 404

        # Delete product
        connection.execute("""
            DELETE FROM products
            WHERE product_id = ?
        """, (product_id,))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Product deleted successfully",
            "product_id": product_id
        }), 200

    except Exception as error:

        return jsonify({
            "success": False,
            "error": "Unable to delete product",
            "details": str(error)
        }), 500

    finally:

        if connection:
            connection.close()


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "success": False,
        "error": "API endpoint not found"
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):

    return jsonify({
        "success": False,
        "error": "HTTP method not allowed"
    }), 405


@app.errorhandler(500)
def internal_server_error(error):

    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500


# ============================================================
# APPLICATION START
# ============================================================

if __name__ == "__main__":

    initialize_database()

    print()
    print("=" * 60)
    print("        INVENTORY MANAGEMENT SYSTEM")
    print("=" * 60)
    print("Backend : Flask")
    print("Database: SQLite")
    print("Server  : http://127.0.0.1:5000")
    print("=" * 60)
    print()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )