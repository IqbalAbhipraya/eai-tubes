const { buildSchema } = require('graphql');

const schema = buildSchema(`
    type Enrollment {
        id: ID
        studentId: Int
        courseId: Int
        status: String
        grade: Grade
        createdAt: String
        updatedAt: String
    }
    type Grade {
        id: ID
        enrollmentId: Int
        studentId: Int
        courseId: Int
        grade: String
        enrollment: Enrollment
        createdAt: String
        updatedAt: String
    }
    type Query {
        enrollments: [Enrollment]
        enrollment(id: ID): Enrollment
        enrollmentStudent(studentID: Int): [Enrollment]
        enrollmentCourse(courseID: Int): [Enrollment]

        grades: [Grade]
        grade(id: ID): Grade
        gradeByEnrollment(enrollmentID: Int): Grade
        gradeStudentAndCourse(studentID: Int, courseID: Int): Grade
    }
    type Mutation { 
        enroll(studentID: Int, courseID: Int): Enrollment
        updateEnrollment(id: ID, status: String): Enrollment

        addGrade(enrollmentID: Int, grade: String): Grade
        updateGrade(id: ID, grade: String): Grade
        deleteGrade(id: ID): Grade
    }
`);

module.exports = schema;