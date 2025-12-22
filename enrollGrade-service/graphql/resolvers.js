const { Enrollment, Grade } = require('../models'); 

const resolvers = {
    //query
    enrollments: async () => await Enrollment.findAll(),
    enrollment: async ({ id }) => await Enrollment.findByPk(id),
    enrollmentStudent: async ({ studentID }) => {
        return await Enrollment.findAll({ 
            where: { studentId: studentID }
        });
    },
    enrollmentCourse: async ({ courseID }) => {
        return await Enrollment.findAll({ 
            where: { courseId: courseID }
        });
    },
    grades: async () => await Grade.findAll(),
    grade: async ({ id }) => await Grade.findByPk(id),
    gradeByEnrollment: async ({ enrollmentID }) => {
        return await Grade.findOne({ 
            where: { enrollmentId: enrollmentID }
        });
    },
    gradeStudentAndCourse: async ({ studentID, courseID }) => {
        return await Grade.findOne({ 
            where: { 
                studentId: studentID, 
                courseId: courseID 
            }
        });
    },
    
    //mutation
    enroll: async ({ studentID, courseID }) => {
        return await Enrollment.create({ 
            studentId: studentID, 
            courseId: courseID,
            status: 'active'
        });
    },
    updateEnrollment: async ({ id, status }) => {
        const enrollment = await Enrollment.findByPk(id);
        if (!enrollment) throw new Error('Enrollment not found');
        if (status) await enrollment.update({ status });
        return enrollment;
    },
    addGrade: async ({ enrollmentID, grade }) => {
        const enrollment = await Enrollment.findByPk(enrollmentID);
        if (!enrollment) {
            throw new Error('Enrollment not found');
        }
        
        const existingGrade = await Grade.findOne({
            where: { enrollmentId: enrollmentID }
        });
        if (existingGrade) {
            throw new Error('Grade already exists for this enrollment. Use updateGrade instead.');
        }
        
        return await Grade.create({
            enrollmentId: enrollmentID,
            studentId: enrollment.studentId,
            courseId: enrollment.courseId,
            grade: grade
        });
    },
    updateGrade: async ({ id, grade }) => {
        const gradeRecord = await Grade.findByPk(id);
        if (!gradeRecord) throw new Error('Grade not found');
        if (grade) await gradeRecord.update({ grade });
        return gradeRecord;
    },
    deleteGrade: async ({ id }) => {
        const grade = await Grade.findByPk(id);
        if (!grade) throw new Error('Grade not found');
        await grade.destroy();
        return grade;
    }
};

module.exports = resolvers;