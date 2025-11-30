# Demo Database Credentials

## 🎯 Overview
The database has been populated with 5 realistic restaurants, each with complete menus, categories, and demo customers.

## 👤 Platform Admin Accounts
Your existing platform admin accounts have been preserved:
- Check your existing credentials (they were not modified)

## 🏪 Restaurant Accounts

### 1. Bella Italia 🇮🇹
- **Email:** `owner@bella-italia.com`
- **Password:** `owner123`
- **Features:** All enabled (Orders, Menu, Customers, Analytics, Marketing)
- **Menu:** Italian cuisine with Appetizers, Pasta, Pizza, Desserts
- **Items:** 13 menu items including Spaghetti Carbonara, Margherita Pizza, Tiramisu

### 2. Sushi Master 🍣
- **Email:** `owner@sushi-master.com`
- **Password:** `owner123`
- **Features:** Orders, Menu, Customers, Marketing (Analytics DISABLED)
- **Menu:** Japanese cuisine with Nigiri, Rolls, Sashimi
- **Items:** 10 menu items including California Roll, Dragon Roll, Salmon Sashimi

### 3. Burger Haven 🍔
- **Email:** `owner@burger-haven.com`
- **Password:** `owner123`
- **Features:** Orders, Menu, Analytics (Customers and Marketing DISABLED)
- **Menu:** American fast food with Burgers, Sides, Drinks
- **Items:** 10 menu items including Classic Burger, French Fries, Milkshakes

### 4. Taco Fiesta 🌮
- **Email:** `owner@taco-fiesta.com`
- **Password:** `owner123`
- **Features:** All enabled (Orders, Menu, Customers, Analytics, Marketing)
- **Menu:** Mexican cuisine with Tacos, Burritos, Sides
- **Items:** 10 menu items including Beef Taco, Chicken Burrito, Guacamole

### 5. Thai Spice 🌶️
- **Email:** `owner@thai-spice.com`
- **Password:** `owner123`
- **Features:** All enabled (Orders, Menu, Customers, Analytics, Marketing)
- **Menu:** Thai cuisine with Curries, Noodles, Appetizers
- **Items:** 9 menu items including Pad Thai, Green Curry, Spring Rolls

## 👥 Demo Customers
Each restaurant has 3 demo customer accounts:
- **Emails:** 
  - `john.doe@example.com`
  - `jane.smith@example.com`
  - `mike.johnson@example.com`
- **Password:** `customer123`
- **⚠️ Note:** Customers cannot access the admin dashboard. They are for the customer-facing ordering app only.

## 🎨 Feature Testing Scenarios

### Test Scenario 1: Full Features (Bella Italia, Taco Fiesta, Thai Spice)
- All menu items visible
- All dashboard tabs visible
- All Quick Actions visible
- Can access all pages

### Test Scenario 2: No Analytics (Sushi Master)
- ❌ Analytics menu item hidden
- ❌ Analytics & Reports tabs hidden in dashboard
- ❌ View Reports quick action hidden
- ✅ Can still access Orders, Menu, Customers, Marketing

### Test Scenario 3: Limited Features (Burger Haven)
- ❌ Customers menu item hidden
- ❌ Marketing menu item hidden
- ❌ Add Customer quick action hidden
- ✅ Can access Orders, Menu, Analytics

## 🔐 Security Notes
- All passwords are hashed with bcrypt
- Platform admin accounts were preserved during seeding
- Each restaurant has its own isolated data
- Features control both UI visibility and route access

## 🚀 Quick Start
1. **Login as Platform Admin** - Manage all restaurants
2. **Login as Restaurant Owner** - Test feature restrictions
3. **Login as Customer** - Place orders (when implemented)

## 📊 Database Statistics
- **Restaurants:** 5
- **Total Menu Items:** 52
- **Total Categories:** 16
- **Demo Customers:** 15 (3 per restaurant)
- **Features:** 9 configurable features
- **Roles per Restaurant:** Owner, Staff, Customer

## 🎭 Demo Flow Suggestions
1. Login as **Super Admin** → See all restaurants
2. Disable features for a restaurant → See changes immediately
3. Login as **Restaurant Owner** → Experience restricted features
4. Switch between restaurants → See different feature sets
5. Try accessing disabled pages via URL → Get redirected to dashboard
