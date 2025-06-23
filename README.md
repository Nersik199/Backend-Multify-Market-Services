<p align="center">
  <img src="public/img/logo.png" alt="Multify Market Logo" width="180" height="180"/>
</p>

# Backend Multify Market Services

**Multify Market** is a digital platform for searching, ordering, and managing construction materials, tools, and services. The project unites construction stores, contractors, craftsmen, and end customers in a single ecosystem.

---

## 🏗️ About the Project

Multify Market automates the processes of searching, ordering, and delivering construction goods, as well as interaction between all market participants.  
The platform provides:

- A catalog of stores and products with filtering by category, price, and location.
- Order system and order status tracking.
- Personal account for stores, clients, and contractors.
- Review and rating system.
- Real-time notifications.
- Secure authentication and authorization.
- API documentation for integration with external services.
- **Online payment system via YooKassa**.

---

## 💳 Payment System (YooKassa)

Multify Market is integrated with the **YooKassa** payment system for accepting online payments.  
Users can pay for orders by bank card, SBP, e-wallets, and other methods supported by YooKassa.

**How payment works:**

- After placing an order, the user selects a payment method.
- The server creates a payment session via the YooKassa API.
- The user is redirected to the secure YooKassa payment page.
- After successful payment, the order status is automatically updated.
- All payment events are processed via YooKassa webhooks for reliability.
- Payment information (status, amount, method) is saved in the database and available in the user's and store's personal account.

**Security:**

- All payment data is transmitted only through secure YooKassa channels.
- The server does not store bank card data.

---

## 🧩 Architecture and Components

### Backend (Node.js + Express.js)

- **REST API**: All business processes are implemented via RESTful API.
- **WebSocket (Socket.io)**: For notifications about orders, messages, status changes.
- **Authentication**: JWT for API, Google OAuth via Passport.js.
- **Validation**: Joi for data validation at all levels.
- **Documentation**: Swagger UI, auto-generated via swagger-autogen.
- **Logging**: Morgan for HTTP requests, custom error middleware.
- **Online payments**: Integration with YooKassa via official SDK and REST API.

### Modules and Layers

- **Controllers**: Request handling, business logic.
- **Services**: Work with external services (email, cloud, payments, YooKassa).
- **Models**: Sequelize models for working with the database.
- **Middleware**: Authorization, validation, error handling.
- **Routes**: Definition of all API and SSR routes.
- **Socket**: Notification and chat logic.
- **Utils**: Helpers (token generation, password hashing, etc.).

---

## 🗂️ Project Structure

```
backend/
│
├── documentation/        # Server launch instructions (`run.md`), environment variables description (`env.ru.md`)
├── app.js                # App initialization, middleware, routes
├── bin/                  # Server start scripts
├── config/               # Configs (DB, Cloudinary, Passport, YooKassa)
├── controllers/          # Business logic (User, Stores, Product, Review, Payments)
├── middleware/           # Authorization, validation, error handling
├── models/               # Sequelize models (User, Stores, Product, Review, Category, Payments)
├── public/               # Static files (logo, images, CSS)
│   └── logo.png          # Site logo
├── routes/               # API and SSR routes
├── schemas/              # Joi validation schemas
├── services/             # Email, Cloudinary, payments, YooKassa
├── socket/               # WebSocket logic
├── utils/                # Helper functions
├── views/                # EJS templates for SSR
└── .env                  # Environment variables
```
---

**🎨 Frontend**
- Multify Market has a separate Frontend built with React.
The frontend communicates with this backend server via REST API and WebSocket.

- You can view the visual part of the project here: **[🔗  View the Website ](https://multify-market.onrender.com/)**

---

**🗂️ The `documentation/` folder contains:**

- Detailed description of environment variables `.env` in
- **[🇷🇺 Russian](./documentation/.env.example-Russian-language.md)**
- **[🇬🇧 English](./documentation/.env.example-English-language.md)**

## 🛠️ Technologies

- **Node.js**, **Express.js**
- **Sequelize**, **MySQL**
- **Passport.js**, **JWT**, **Google OAuth**
- **Socket.io**
- **Swagger-autogen**, **swagger-ui-express**
- **Multer**, **Cloudinary**
- **Nodemailer**
- **Joi**, **Morgan**, **dotenv**
- **EJS** (SSR)
- **YooKassa** (official SDK and REST API)

---

## 🔔 Notifications and Feedback

- All important events (new order, status change, new review, successful payment) are sent via Socket.io in real time and duplicated by email.
- The user and store are always aware of the status of their orders and payments.

---

## 🚀 Project Launch

1. Clone the repository:
   ```
   git clone https://github.com/Nersik199/Backend-Multify-Market-Services.git
   cd Backend-Multify-Market-Services
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open API documentation: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## 🤝 Contacts and Support

The project is open for collaboration.  
Questions and suggestions — via Issues or Pull Requests.

---

> **Multify Market** — your digital assistant in construction!

**[🇷🇺 Ru ](./documentation/README.ru.md)**
