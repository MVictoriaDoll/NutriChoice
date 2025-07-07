# 🥗 NutriChoice: AI-Powered Nutritional Receipt Analyst
![nutrichoice](https://github.com/user-attachments/assets/8aefc0a5-32b0-4e0c-96d5-16b1606defda)


NutriChoice is a full-stack web application designed to empower users to make smarter, healthier grocery choices. It transforms the tedious task of analyzing receipts into an insightful experience by leveraging AI to provide a detailed breakdown and long-term analysis of your shopping habits.

The core problem it solves is the "information lag" in personal nutrition. Many of us want to eat healthier, but it's difficult to see the real patterns hiding in our weekly grocery purchases. NutriCheck closes this gap by turning your receipt—a simple piece of paper—into actionable data.

[[**Live Demo**](#) <!-- Add a link to your deployed application here -->](https://youtu.be/k4ApD1jHNg4)

---

## ✨ Key Features

* **AI-Powered Receipt Analysis:** Upload a PDF of your grocery receipt, and our multi-step AI chain, powered by the Gemini API and LangChain, extracts, validates, and analyzes every item.
* **Automated Food Classification:** Items are automatically categorized as "Fresh Food," "Processed," "High Sugar," etc., giving you an at-a-glance understanding of your purchases.
* **Detailed Nutritional Insights:** For food items, the AI provides a list of key nutritional benefits, helping you understand the value of what you buy.
* **Personalized Dashboard:** An interactive dashboard visualizes your shopping habits over time, with charts showing the percentage of fresh vs. processed foods and an overall "NutriScore."
* **Secure User Authentication:** A robust authentication system using Auth0 for registered users (via JWT) and a custom middleware for handling anonymous users, ensuring all data is private and secure.
* **Interactive Verification:** Users can review the AI's analysis and make corrections, which helps improve the accuracy of their long-term nutritional summary.

---

## 🛠️ Tech Stack

This project was built with a modern, type-safe, full-stack architecture.

| Category          | Technology                                                              |
| :---------------- | :---------------------------------------------------------------------- |
| **Frontend** | React, TypeScript, Vite, Axios, Tailwind CSS, Recharts                  |
| **Backend** | Node.js, Express, TypeScript                                            |
| **Database** | MongoDB (with MongoDB Atlas)                                            |
| **ORM** | Prisma                                                                  |
| **AI / LLM** | Google Gemini API, LangChain.js                                         |
| **Authentication**| Auth0 (JWT), `express-jwt`, `jwks-rsa`                                    |
| **File Handling** | Multer, `pdf-parse` (via LangChain's `PDFLoader`)                         |

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Node.js (v18 or later recommended)
* npm
* Git
* A running MongoDB instance (local or a free cluster from MongoDB Atlas)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/nutricheck.git](https://github.com/MVictoriaDoll/NutriCheck)
    cd nutricheck
    ```

2.  **Setup the Backend:**
    * Navigate to the `server` directory: `cd server`
    * Install dependencies: `npm install`
    * Create a `.env` file in the `server` directory and add the following environment variables:
        ```env
        # Server Configuration
        PORT=3000
        NODE_ENV=development

        # Database
        DATABASE_URL="your_mongodb_connection_string"

        # Auth0 Configuration
        AUTH0_DOMAIN="your_auth0_domain"
        AUTH0_AUDIENCE="your_auth0_api_audience"

        # Google Gemini AI
        GEMINI_API_KEY="your_gemini_api_key"
        ```
    * Apply your Prisma schema to the database:
        ```sh
        npx prisma generate
        ```

3.  **Setup the Frontend:**
    * Navigate to the `client` directory: `cd ../client`
    * Install dependencies: `npm install`
    * Create a `.env` file in the `client` directory and add the following:
        ```env
        # The URL of your backend server
        VITE_BACKEND_BASE_URL=http://localhost:3000

        # Auth0 Configuration
        VITE_AUTH0_DOMAIN="your_auth0_domain"
        VITE_AUTH0_CLIENT_ID="your_auth0_client_id"
        VITE_AUTH0_AUDIENCE="your_auth0_api_audience"
        ```

### Running the Application

You will need two separate terminals to run both the backend and frontend servers concurrently.

1.  **Start the Backend Server:**
    * In a terminal at the `server` directory, run:
        ```sh
        npm run dev
        ```

2.  **Start the Frontend Development Server:**
    * In a second terminal at the `client` directory, run:
        ```sh
        npm run dev
        ```

Your application should now be running, with the client available at `http://localhost:5173` (or another port specified by Vite) and the server at `http://localhost:3000`.
