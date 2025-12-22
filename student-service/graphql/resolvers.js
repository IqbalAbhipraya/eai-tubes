// graphql/resolvers.js
const { Student } = require('../models');

const resolvers = {
    //query
    students: async () => await Student.findAll(),
    student: async ({ id }) => await Student.findByPk(id),

    //mutation
    createStudent: async (args) => await Student.create(args),
    updateStudent: async ({ id, ...updates }) => {
        const student = await Student.findByPk(id);
        if (!student) throw new Error('Student not found');
        await student.update(updates);
        return student;
    },
    deleteStudent: async ({ id }) => {
        const student = await Student.findByPk(id);
        if (!student) throw new Error('Student not found');
        await student.destroy();
        return student;
    },
};

module.exports = resolvers;