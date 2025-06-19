# FinAI 💸

**FinAI** is a mobile-first personal finance app that helps users track their income, expenses, and budgets — with AI-powered insights. Built using **React Native** for the frontend and **.NET 8 Web API** for the backend.

## 🚀 Features

- 🔐 User authentication with JWT
- 💵 Add, update, delete income and expense transactions
- 📍 Set monthly budgets per category
- 📈 Real-time budget tracking and overage warnings
- 📅 Month-based filtering and insights
- 📊 UI Friendly Dashboards
- 🔔 Smart notifications (budget nearing, savings tips)
- 📸 Scan receipts with your camera — AI-powered OCR + parsing automatically extracts data
- 🤖 AI chatbot assistant for personalized financial insights and advice 
- 📱 Fully responsive and UX-optimized mobile design

## 📦 Tech Stack

### Frontend
- React Native
- Axios (API calls)
- react-native-chart-kit (charts and visualizations)
- TypeScript
- Expo 

### Backend
- .NET 8 Web API
- Entity Framework Core
- Microsoft Identity
- PostgreSQL or SQL Server (via EF)
- JWT Authentication
- Open AI API
- OCR API

## 🛠️ Installation

### Backend

1. Navigate to the backend folder and set up the database:
    ```bash
    dotnet ef database update
    ```

2. Run the API:
    ```bash
    dotnet run
    ```

3. Configure database and Open AI credentials in `appsettings.json`:
    ```json
    "ConnectionStrings": {
      "DefaultConnection": "YourDatabaseConnectionHere"
    }, "OpenAI": {
    "ApiKey": ""
    }

    ```

### Frontend

1. Navigate to the React Native project folder.
2. Install dependencies:
    ```bash
    npm install
    ```

3. Start the app with Expo:
    ```bash
    npx expo start
    ```

4. Configure `api.ts` with your backend base URL.

5. Configure OCR API in `transactions.tsx`


## 📊 Potential Upgrades

📂 Multi-account support — manage multiple bank accounts and wallets within the app

🌐 Multi-currency support — automatically convert and track expenses in different currencies

📅 Recurring transactions and bill reminders — automate regular payments and get notified

🔄 Data import/export — CSV, Excel, or bank statement integration for easy data migration

🤝 Shared budgets and expense splitting — collaborate with family or roommates

📊 Advanced analytics & forecasting — AI-driven predictions of cash flow and spending habits

🔒 Biometric authentication — Face ID / Touch ID for enhanced security

🌙 Dark mode and UI customizations — improve user experience and personalization

💬 Voice commands — interact with the app using voice to add transactions or get summaries

## 🧑‍💻 Author

Bojan Skopljak

