<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\QuizController;
use App\Http\Controllers\Admin\QuestionController;
use App\Http\Controllers\Admin\LeaderboardController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Student\QuizSessionController;

// Auth Routes (Admin)
Route::post('/admin/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/admin/logout', [AuthController::class, 'logout']);
    Route::get('/admin/me', [AuthController::class, 'me']);

    // Admin API Routes
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        
        Route::apiResource('quizzes', QuizController::class);
        Route::post('/quizzes/{quiz}/generate-qr', [QuizController::class, 'generateQr']);
        
        // Nested resource roughly for questions
        Route::get('/quizzes/{quiz}/questions', [QuestionController::class, 'index']);
        Route::post('/quizzes/{quiz}/questions', [QuestionController::class, 'store']);
        Route::put('/questions/{question}', [QuestionController::class, 'update']);
        Route::delete('/questions/{question}', [QuestionController::class, 'destroy']);

        Route::get('/leaderboard', [LeaderboardController::class, 'index']);
        
        Route::get('/settings', [SettingController::class, 'index']);
        Route::post('/settings', [SettingController::class, 'update']);
    });
});

// Student Public API Routes
Route::prefix('student')->group(function () {
    Route::get('/quiz/{slug}', [QuizSessionController::class, 'getQuizDetails']);
    Route::post('/quiz/{slug}/start', [QuizSessionController::class, 'startSession']);
    Route::post('/quiz/{slug}/submit', [QuizSessionController::class, 'submitSession']);
});
