# InventoryPro – Inventory Management System

A web-based Inventory / Product Management System developed as a mini project for managing products, stock quantities, prices, and low-stock alerts.

---

## 🎯 Objective

The objective of this project is to develop a simple and user-friendly inventory management system that allows users to:

- Add new products
- View available products
- Search products
- Update product details
- Update stock quantity and price
- Delete products
- Monitor low-stock products
- View overall inventory statistics

The system uses a REST API to communicate between the frontend and backend and stores product data in an SQLite database.

---

## ✨ Features

### Dashboard
- Total number of products
- Total available stock
- Low-stock product count
- Total inventory value
- Recently added products
- Stock alerts

### Product Management
- Add new products
- View all products
- Search products
- Edit product information
- Update quantity and price
- Delete products

### Low Stock Monitoring
- Automatically identifies products with low quantity
- Displays low-stock alerts
- Shows remaining stock
- Provides an update option

### Validation
- Product quantity cannot be negative
- Product price cannot be negative
- Required product information is validated before submission

### Backend
- REST API based architecture
- JSON data communication
- SQLite database
- CRUD operations

---

## 🛠️ Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript
- Live Server

### Backend
- Python
- Flask

### Database
- SQLite

### Development Tools
- Visual Studio Code
- Git
- GitHub
- Web Browser

---

## 📁 Project Structure

```text
Inventory-Management-System/
│
├── backend/
│   ├── app.py
│   ├── database.db
│   └── venv/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── README.md
└── .gitignore
