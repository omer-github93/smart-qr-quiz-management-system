import axios from './axios';

export const getQuestionsApi = (quizId) => axios.get(`/admin/quizzes/${quizId}/questions`);

export const createQuestionApi = (quizId, data) => {
    // We use FormData for file uploads
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (key === 'options') {
            formData.append(key, JSON.stringify(data[key]));
        } else {
            formData.append(key, data[key]);
        }
    });
    return axios.post(`/admin/quizzes/${quizId}/questions`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const updateQuestionApi = (questionId, data) => {
    // If updating image, use FormData. Otherwise, common JSON works.
    // However, Laravel has issues with PUT + FormData, so we often spoof it as POST with _method=PUT
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (key === 'options') {
            formData.append(key, JSON.stringify(data[key]));
        } else {
            formData.append(key, data[key]);
        }
    });
    formData.append('_method', 'PUT');

    return axios.post(`/admin/questions/${questionId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const deleteQuestionApi = (questionId) => axios.delete(`/admin/questions/${questionId}`);
