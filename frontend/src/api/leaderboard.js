import api from './index';

export const getLeaderboardApi = async (page = 1, quizId = '') => {
    let url = `/api/admin/leaderboard?page=${page}`;
    if (quizId) {
        url += `&quiz_id=${quizId}`;
    }
    return await api.get(url);
};
