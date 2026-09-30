import ApiClient from './ApiClient';

const PublicFormsApi = {
    async getForm(token) {
        if (!(await ApiClient.connect())) throw new Error('Backend unavailable');
        return ApiClient.get('public/forms', { pathParams: [token] });
    },
    async getQuestion(token, questionId) {
        return ApiClient.get('public/forms', { pathParams: [token, 'questions', questionId] });
    },
    async getQuestionType(token, typeId) {
        return ApiClient.get('public/forms', { pathParams: [token, 'question-types', typeId] });
    },
    async submit(token, answers) {
        return ApiClient.post('public/forms', {
            pathParams: [token, 'answers'],
            body: { answers },
        });
    },
};

export default PublicFormsApi;
