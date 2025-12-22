const { Course } = require('../models'); 

const resolvers = {
    //query
    courses: async () => await Course.findAll(),
    course: async ({ id }) => await Course.findByPk(id),
    courseName: async ({ name }) => await Course.findOne({ where: { title: name } }),

    //mutation
    createCourse: async (args) => await Course.create(args),
    updateCourse: async ({ id, ...updates }) => {
        const course = await Course.findByPk(id);
        if (!course) throw new Error('Course not found');
        await course.update(updates);
        return course;
    },
    deleteCourse: async ({ id }) => {
        const course = await Course.findByPk(id);
        if (!course) throw new Error('Course not found');
        await course.destroy();
        return course;
    },
};

module.exports = resolvers;