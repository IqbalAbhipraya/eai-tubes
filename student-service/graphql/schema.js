const { buildSchema } = require('graphql');

const schema = buildSchema(`
    type Student {
        id: ID
        nama: String
        email: String
        tanggalLahir: String
        jurusan: String
        enrollmentYear: Int
        createdAt: String
        updatedAt: String
    }

    type Query {
        students: [Student]
        student(id: ID): Student
    }

    type Mutation { 
        createStudent(
            nama: String, 
            email: String, 
            jurusan: String, 
            enrollmentYear: Int
            password: String
            tanggalLahir: String
        ): Student
        updateStudent(
            id: ID,
            nama: String, 
            email: String, 
            jurusan: String, 
            enrollmentYear: Int
            password: String
            tanggalLahir: String
        ): Student
        deleteStudent(id: ID): Student
    }
`);



module.exports = schema;