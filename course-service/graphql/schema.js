const { buildSchema } = require('graphql');

const schema = buildSchema(`
    type Course {
        id: ID
        title: String
        description: String
        instructor: String
        createdAt: String
        updatedAt: String
    }

    type Query {
        courses: [Course]
        course(id: ID): Course
        courseName(name: String): Course
    }

    type Mutation { 
        createCourse(
            title: String,
            description: String,
            instructor: String
        ): Course
        updateCourse(id: ID, title: String, description: String, instructor: String): Course
        deleteCourse(id: ID): Course
    }
`);

module.exports = schema;