<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        $query = QuizAttempt::with('quiz:id,title')
            ->where('status', 'completed')
            ->orderBy('score', 'desc')
            ->orderByRaw('TIMESTAMPDIFF(SECOND, started_at, completed_at) ASC');
            
        if ($request->has('quiz_id')) {
            $query->where('quiz_id', $request->quiz_id);
        }

        return response()->json($query->paginate(20));
    }
}
