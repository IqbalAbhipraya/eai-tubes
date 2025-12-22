const GET_STUDENTS = `
  query GetStudents {
    students {
      id
      nama
      email
      jurusan
    }
  }
`;

const GET_COURSES = `
  query GetCourses {
    courses {
      id
      title
      instructor
    }
  }
`;

const GET_ENROLLMENTS = `
  query GetEnrollments {
    enrollments {
      id
      studentId
      courseId
      status
    }
  }
`;