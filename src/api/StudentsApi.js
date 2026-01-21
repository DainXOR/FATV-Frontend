import ApiClient from './ApiClient';

const STUDENTS_ENDPOINT = 'student/';

const StudentsApi = {
    createStudent: async (data) => {
        return ApiClient.post(STUDENTS_ENDPOINT, data);
    },
    getStudent: async (id) => {
        return ApiClient.get(`${STUDENTS_ENDPOINT}${id}/`);
    },
    updateStudent: async (id, data) => {
        return ApiClient.put(`${STUDENTS_ENDPOINT}${id}/`, data);
    },
    deleteStudent: async (id) => {
        return ApiClient.delete(`${STUDENTS_ENDPOINT}${id}/`);
    },
    listStudents: async () => {
        return ApiClient.get(STUDENTS_ENDPOINT);
    }
};

export default StudentsApi;
