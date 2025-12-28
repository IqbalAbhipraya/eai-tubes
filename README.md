# EduHub - Course Management System

A microservices-based course management system built with Node.js, GraphQL, PostgreSQL, and Docker.

## 🚀 Features

### Student Mode
- **Browse Courses** - View all available courses
- **Enroll in Courses** - One-click enrollment
- **View Grades** - See grades for enrolled courses
- **Edit Profile** - Update personal information (name, email, major, enrollment year)

### Teacher Mode
- **Manage Courses**
  - Add new courses
  - Edit existing courses
  - Delete courses
- **Manage Students**
  - View enrolled students per course
  - Grade students (add/update grades)
  - Delete students (with protection for currently logged-in user)

## 🏗️ Architecture

The application follows a microservices architecture with 4 main services:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Client (Web)   │────▶│  Student Service │────▶│  PostgreSQL (studentDB)   │
│  Port: 8082     │     │  Port: 4001      │     │           │
└────────┬────────┘     └──────────────────┘     └─────────────────────┘
         │
         │              ┌──────────────────┐     ┌─────────────────────┐
         ├─────────────▶│  Course Service  │────▶│  PostgreSQL (courseDB)   │
         │              │  Port: 4002      │     │          │
         │              └──────────────────┘     └─────────────────────┘
         │
         │              ┌──────────────────┐     ┌─────────────────────┐
         └─────────────▶│ EnrollGrade Service|  │────▶│  PostgreSQL (enrollGradeDB)   │
                        │  Port: 4003      │     │         │
                        └──────────────────┘     └─────────────────────┘
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| Client | 8082 | Static web frontend served via Nginx |
| Student Service | 4001 | Handles student CRUD operations |
| Course Service | 4002 | Handles course CRUD operations |
| EnrollGrade Service | 4003 | Handles enrollments and grading |

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js, GraphQL
- **Database**: MySQL with Sequelize ORM
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- (Optional) Node.js v18+ for local development

## 🚀 Getting Started

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/IqbalAbhipraya/eai-tubes
   cd eai-tubes
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:8082
   - Student Service GraphQL: http://localhost:4001/graphql
   - Course Service GraphQL: http://localhost:4002/graphql
   - EnrollGrade Service GraphQL: http://localhost:4003/graphql

4. **Stop services**
   ```bash
   docker-compose down  
   ```

### Local Development

1. **Install dependencies for each service**
   ```bash
   cd student-service && npm install
   cd ../course-service && npm install
   cd ../enrollGrade-service && npm install
   ```

2. **Set up PostgreSQL databases**
   - Create 3 PostgreSQL databases
   - Update `config/config.js` in each service with your database credentials

3. **Run migrations**
   ```bash
   cd student-service && npx sequelize-cli db:migrate
   cd ../course-service && npx sequelize-cli db:migrate
   cd ../enrollGrade-service && npx sequelize-cli db:migrate
   ```

4. **Start services**
   ```bash
   # In separate terminals
   cd student-service && npm start
   cd course-service && npm start
   cd enrollGrade-service && npm start
   ```

5. **Serve the client**
   ```bash
   # Using any static file server, e.g., http-server
   cd client && npx http-server -p 8082
   ```

## 📡 GraphQL API

### Student Service (Port 4001)

**Queries:**
```graphql
students: [Student]
student(id: ID): Student
```

**Mutations:**
```graphql
createStudent(nama: String, email: String, jurusan: String, enrollmentYear: Int, password: String, tanggalLahir: String): Student
updateStudent(id: ID, nama: String, email: String, jurusan: String, enrollmentYear: Int, password: String, tanggalLahir: String): Student
deleteStudent(id: ID): Student
```

### Course Service (Port 4002)

**Queries:**
```graphql
courses: [Course]
course(id: ID): Course
courseName(name: String): Course
```

**Mutations:**
```graphql
createCourse(title: String, description: String, instructor: String): Course
updateCourse(id: ID, title: String, description: String, instructor: String): Course
deleteCourse(id: ID): Course
```

### EnrollGrade Service (Port 4003)

**Queries:**
```graphql
enrollments: [Enrollment]
enrollment(id: ID): Enrollment
enrollmentStudent(studentID: Int): [Enrollment]
enrollmentCourse(courseID: Int): [Enrollment]
grades: [Grade]
grade(id: ID): Grade
gradeByEnrollment(enrollmentID: Int): Grade
gradeStudentAndCourse(studentID: Int, courseID: Int): Grade
```

**Mutations:**
```graphql
enroll(studentID: Int, courseID: Int): Enrollment
updateEnrollment(id: ID, status: String): Enrollment
addGrade(enrollmentID: Int, grade: String): Grade
updateGrade(id: ID, grade: String): Grade
deleteGrade(id: ID): Grade
```

## 📁 Project Structure

```
eai-tubes/
├── client/                 # Frontend application
│   ├── index.html         # Main HTML file
│   ├── style.css          # Styles
│   ├── script.js          # JavaScript logic
│   └── Dockerfile         # Nginx container config
│
├── student-service/        # Student microservice
│   ├── config/            # Database configuration
│   ├── models/            # Sequelize models
│   ├── migrations/        # Database migrations
│   ├── graphql/           # GraphQL schema & resolvers
│   ├── index.js           # Service entry point
│   └── Dockerfile
│
├── course-service/         # Course microservice
│   ├── config/
│   ├── models/
│   ├── migrations/
│   ├── graphql/
│   ├── index.js
│   └── Dockerfile
│
├── enrollGrade-service/    # Enrollment & Grading microservice
│   ├── config/
│   ├── models/
│   ├── migrations/
│   ├── graphql/
│   ├── index.js
│   └── Dockerfile
│
└── docker-compose.yml      # Docker orchestration
```

## 🔧 Configuration

Each service has a `config/config.js` file for database configuration:

```javascript
module.exports = {
  development: {
    username: "postgres",
    password: "password",
    database: "database_name",
    host: "localhost",
    dialect: "postgres"
  }
}
```

## 🎯 Usage Guide

### As a Student

1. **Login** - Click the Login button and enter your name and email
2. **Browse Courses** - View available courses on the homepage
3. **Enroll** - Click the "Enroll" button on any course card
4. **View Course Details** - Click on a course to see enrolled students and your grade
5. **Edit Profile** - Click "Edit Profile" in the navbar to update your information

### As a Teacher

1. **Login** as a student first, then toggle to **Teacher Mode** using the switch
2. **Add Course** - Click "+ Add New Course" button
3. **Edit/Delete Course** - Open course details and use the action buttons
4. **Grade Students** - Open course details, find the student, and click "Grade" or "Update"
5. **Delete Students** - Click the red "Delete" button next to any student (except yourself)

## 🐛 Troubleshooting

### Services not starting?
```bash
# Check logs
docker-compose logs -f

# Rebuild containers
docker-compose down
docker-compose up --build -d
```

### Database connection issues?
- Ensure PostgreSQL containers are running
- Check database credentials in `docker-compose.yml`
- Verify port mappings are not conflicting

### CORS errors?
- All services are configured to accept requests from `localhost:8082`
- Check that you're accessing the frontend from the correct URL

## 📄 License

This project is for educational purposes.

## 👥 Contributors

- EAI Tubes Team 5
