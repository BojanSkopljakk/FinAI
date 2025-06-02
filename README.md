# FinAI 💸

**FinAI** is a mobile-first personal finance app that helps users track their income, expenses, and budgets — with AI-powered insights (LLM integration planned). Built using **React Native** for the frontend and **.NET 8 Web API** for the backend.

## 🚀 Features

- 🔐 User authentication with JWT
- 💵 Add, update, delete income and expense transactions
- 📊 Set monthly budgets per category
- 📈 Real-time budget tracking and overage warnings
- 📅 Month-based filtering and insights
- 🧠 Upcoming: LLM-powered financial assistant and analytics
- 📱 Fully responsive and UX-optimized mobile design

## 📦 Tech Stack

### Frontend
- React Native
- Axios (API calls)
- react-native-chart-kit (charts and visualizations)
- TypeScript
- Expo + Tailwind-style UI components

### Backend
- .NET 8 Web API
- Entity Framework Core
- Microsoft Identity
- PostgreSQL or SQL Server (via EF)
- JWT Authentication

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

3. Configure database and email credentials in `appsettings.json`:
    ```json
    "ConnectionStrings": {
      "DefaultConnection": "YourDatabaseConnectionHere"
    },
    "Email": {
      "SmtpHost": "sandbox.smtp.mailtrap.io",
      "Port": "2525",
      "Username": "your-mailtrap-username",
      "Password": "your-mailtrap-password"
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

## 📊 Upcoming Features

- 📍 Dashboard with:
  - Monthly income vs. expense
  - Category breakdown (pie chart)
  - Monthly trends (bar/line chart)
  - Top spending categories
- 🧠 Chat-like interface for financial questions
- 🔔 Smart notifications (budget nearing, savings tips)

## 🧑‍💻 Author

Bojan Skopljak

