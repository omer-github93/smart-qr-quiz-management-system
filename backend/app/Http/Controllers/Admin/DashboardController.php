<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $totalQuizzes = Quiz::count();
        $totalParticipants = QuizAttempt::distinct('student_name')->count('student_name');
        $totalAttempts = QuizAttempt::count();

        // Pass/Fail counts (assuming 50 is the pass mark)
        $passCount = QuizAttempt::where('score', '>=', 50)->count();
        $failCount = QuizAttempt::where('score', '<', 50)->count();

        // Used for recent attempts table
        $recentAttempts = QuizAttempt::with('quiz:id,title')->latest()->limit(5)->get();

        // Used for Quiz Performance Chart (fetching enough data to group by quiz on frontend)
        $allAttempts = QuizAttempt::with('quiz:id,title')
            ->select('id', 'quiz_id', 'student_name', 'score')
            ->get();
            
        // Get all quizzes for the dropdown filter
        $quizzes = Quiz::select('id', 'title')->get();

        return response()->json([
            'total_quizzes' => $totalQuizzes,
            'total_participants' => $totalParticipants,
            'total_attempts' => $totalAttempts,
            'pass_count' => $passCount,
            'fail_count' => $failCount,
            'recent_attempts' => $recentAttempts,
            'all_attempts' => $allAttempts,
            'quizzes' => $quizzes
        ]);
    }
}
