# 🎨 MindsMesh

## 🚀 Overview

Welcome to MindsMesh — my ever-evolving personal project 🚀 where passion meets continuous learning! This innovative platform connects creatives, tech enthusiasts 💻, and developers 👩‍💻 with potential employers.

Built with React, NestJS, TypeScript, and modern cloud services, MindsMesh showcases my commitment to professional-grade development practices and architectural design. The platform features secure user authentication, dynamic profile management, skill showcasing, and a real-time chat system with file sharing capabilities.

Each feature of this project represents both a functional solution and a learning milestone in my development journey 🌱.

🧙‍♂️👨‍💻 ***At the moment I am implementing the following:***

👥🔍  **AI feature that helps recommending relevant freelancers to logged in employer users based on their project requirements.**

🚢 ***New DevOps Features***

- 🐳**Docker for API Testing:**
  - Start the Docker Desktop if on Windows or  Docker Engine on Linux.
  - Execute shell script `docker-api-up.sh` in a wsl terminal.
  - 🧪 Test the endpoints directly in the browser using Swagger accessing <http://localhost:3000/api-docs>.

- 🔄**GitHub Actions:** CI/CD pipeline.
  - CI Pipeline: Automatically runs tests and linting on pull requests and pushes to main branch
  -✅ Build Verification: Ensures the application builds successfully in a clean environment.
  - Future Implementation: Automated deployment to staging/production environments.
  
📎***New Chat Attachment feature:***

- **Send and Receive Attachments** : Share files, images, and documents with ease
- **Multiple File Types** 🖼️ 📄 📝- Share images, PDFs, Word documents, and text **(files Maximum file size: 10MB)**
- ***Seamless Experience*** - Files are stored securely in 🔥🔥Firebase Storage 🔥🔥  and accessible across devices

<!-- a booking system, and a review system. Additionally, it includes an admin dashboard for managing users, skills, and bookings, providing a seamless experience for both users and administrators. -->

![MindsMesh logo](/apps/client/src/assets/logo.svg)

![MindsMesh Cat](/apps/client/src/assets/Hipster-Chubby-Cat.webp)

## 🌟 Features

### 🔒 User Authentication & JWT

- **Registration & Login:** Secure user authentication using JWT.
- **Email Verification:** Verify user email addresses for account activation.
- **Password Reset:** Reset forgotten passwords via email.
<!-- - **Role-Based Access Control:** Different access levels for users and admins. -->

### 👤 User Profiles

- **Profile Management:** Users can create and update profiles with bio, photo, images examples of there work, skills offered, etc.
- **Public Profiles:** Profiles are accessible publicly with user statistics.

### 🎯 Skill Offering

- **Create Listings:** Users can offer skills by creating listings with title, description, price, and availability.
- **Categories:** Skills are categorized (e.g., frontend developer, creative script writer, illustrator, etc..).

### 💬 Using the Chat System

### As an Employer 👔

- 💬 Click on the Chat button on a freelancer's profile to initiate a conversation
- 🆕 A chat room will be created if it doesn't already exist
- ⚡ Send and receive messages in real-time

### As a Freelancer 👩‍💻

- 🚪 Click on the Rooms button on your own profile to view all chat rooms with employers
- 🤝 Join a chat room to communicate with the employer
- 📱 Manage your chat rooms and conversations

### Features ✨

- **Real-Time Messaging** 📨: Messages are sent and received instantly
- **Message Status Indicators** ✔️: See when your messages are sending, sent, or if there was an error
- **Connection Status** 🔌: Visual indicators show if you are connected or reconnecting

<!-- ### 📅 Booking System

- **Book Lessons:** Users can book lessons from available skill offerings.
- **Scheduling:** Integration with a calendar for lesson scheduling.
- **Notifications:** Reminders for upcoming lessons.

### ⭐ Review System

- **Leave Reviews:** Users can leave reviews and ratings after lessons.
- **Aggregate Ratings:** Each skill provider has an overall rating. -->

<!-- ### 🛠️ Admin Dashboard

- **User & Skill Management:** Admins can manage users, skills, and bookings.
- **Analytics:** Dashboard showing platform usage, popular skills, etc. -->

<!-- ### 🎁 Optional Features

- **Messaging System:** In-app messaging for communication before/after booking.
- **Payment Integration:** Integrate with Stripe for handling paid lessons. -->

## 🛠️ Tech Stack

### 🔧 Backend (NestJS)

- **NestJS:** A powerful Node.js framework for building scalable and efficient server-side applications, providing an organized structure and TypeScript support out of the box.
- **TypeORM:**  An ORM for TypeScript and JavaScript (ES7, ES6, ES5), allowing for database management with PostgreSQL, making data modeling easier and more intuitive.
- **Passport.js:** Middleware for authentication in Node.js applications, supporting various authentication strategies, with a focus on JWT for secure API access.
- **Swagger:** A tool for documenting  API, enabling easy visualization and interaction with API endpoints directly from a browser.
- **Socket.IO :** A library for real-time, bidirectional, and event-based communication, making it ideal for applications that require live updates, such as chat apps.
- **Cloudinary:** A cloud-based image and video management service uploading users avatar images and skill images.
- **SendGrid:** A cloud-based email delivery service for confirming user registrations, sending password reset emails.
- **Firebase Storage:** A cloud storage solution for image and document attachments in the chat system.

### 🎨 Frontend 

- **React 19 :** The latest  version of the most popular front-end library, React, introducing several new features and improvements for building user interfaces. Some of the new features include:
  - ***Server Components:*** Enhances server-side rendering by allowing you to build components that run exclusively on the server, reducing the need for client-side JavaScript.
  - ***Concurrent Rendering Improvements:*** Better handling of asynchronous tasks, making UIs more responsive by allowing React to interrupt rendering and continue later when needed.
  - ***Simplified State Management:*** Improvements in the way React handles state, making it more intuitive and reducing the complexity of managing state across components.
- **ShadcnUI Components & Tailwind CSS:** A powerful combination for styling and building UI components. ShadcnUI provides a set of highly customizable and accessible UI components using Tailwind syntax.
- **Axios:** Promise-based HTTP client for making API requests that simplifies the process of handling HTTP requests, supporting features like request and response interception, automatic JSON data transformation, and error handling.  

### 🗄️ Database

- **PostgreSQL:** Relational database management.


<!-- ### Main Features

   **Messaging with Socket.IO** -->
   <!-- **Stripe integration for payments** -->

## 🧑‍💻 Development Steps

1. **Project Setup:**
   - Initialize NestJS project.
   - Set up PostgreSQL database.
   - Configure environment variables.

2. **User Authentication:**
   - Implement JWT-based authentication.
   - Set up role-based access control.

3. **User Profile Management:**
   - APIs for profile creation and updates.
   - Implement file upload and carousel for images.

4. **Skill Offering:**
   - Design skill offerings schema.
   - CRUD operations for skill listings.

5. **Frontend Development:**
   - Build UI with React/Next.js.
   - Integrate with backend API.
   - Implement client-side authentication and state management.

6. **Real-Time Features (Optional):**
   - Implement messaging with Socket.IO.

7. **Testing & Deployment:**
    - Write unit and integration tests.
    - Set up CI/CD pipelines.
    <!-- - Deploy to cloud provider. -->
<!-- 10. **Payment Integration (Optional):**
    - Integrate Stripe for payments. -->

## 🎓 Learning Outcomes

- **NestJS:** Building RESTful APIs, managing databases, handling authentication.
- **TypeORM:** Mastering ORM tools for database interactions.
- **Frontend Development:** Building responsive UIs with React/Angular.
- **DevOps:** Containerization, CI/CD, and deployment practices.
- **Advanced Features:** Real-time communication.

## 🚀 Getting Started

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/andrenormanlang/mindsmesh-nestjs-react-19.git
   ```

2. **Install Dependencies:**

   ```bash
   cd mindsmesh-nestjs-react-19/
   npm install
   ```

3. **Set Up Environment Variables:**
   - Create a `.env` file in mindsmesh-nestjs-react-19/apps/api/ and add your configuration for the following.

   ### Api

      ```env

      FRONTEND_URL=http://localhost:5173
      DATABASE_TYPE=  
      DATABASE_HOST=
      DATABASE_PORT=5432
      DATABASE_USERNAME=
      DATABASE_PASSWORD=yourpassword
      DATABASE_NAME=
      DATABASE_URL=
      JWT_SECRET=YourSuperSecretKey
      JWT_EXPIRATION_TIME=
      RESET_PASSWORD_SECRET=
      RESET_PASSWORD_EXPIRES_IN=
      CLOUDINARY_CLOUD_NAME=
      CLOUDINARY_API_KEY=
      CLOUDINARY_API_SECRET=
      SENDGRID_API_KEY=

      ```

   ### Client

      ```env

      VITE_BASE_URL=http://localhost:3000/api
      VITE_BASE_URL_CHAT_EMPLOYER==http://localhost:3000

      ```

4. **For Local Testing Create and Access a PostgreSQL Database by CLI:**

   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   enter password

   # Create your database and access your DB
   CREATE DATABASE mindsmesh;
   \c mindsmesh

   # Create the necessary tables
   CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       email VARCHAR(255) UNIQUE NOT NULL,
       username VARCHAR(255) NOT NULL,
       password VARCHAR(255) NOT NULL,
       isAdmin BOOLEAN DEFAULT false,
       role VARCHAR(255) DEFAULT 'user'
   );

   CREATE TABLE skills (
       id SERIAL PRIMARY KEY,
       title VARCHAR(255) NOT NULL,
       description TEXT,
       price NUMERIC(10, 2) NOT NULL,
       isAvailable BOOLEAN DEFAULT true,
       user_id INTEGER REFERENCES users(id)
   );

   ```

5. **Run and access the Application endpoints:**

### Backend

   ```bash
   npm run start:dev
   ```

- Open `http://localhost:3000` in Postman or Insomnia.

- **Swagger Documentation:** Access the API documentation at `http://localhost:3000/api-docs`.

### Frontend

   ```bash
   npm run start dev
   ```

- Open `http://localhost:5173` in your browser of choice.

## 🤝 Contributing

Feel free to fork this repository, create a new branch, and submit a pull request with your changes.
