<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Setting;
use Illuminate\Http\Request;

class QuizSessionController extends Controller
{
    public function getQuizDetails($slug)
    {
        $quiz = Quiz::where('slug', $slug)->where('is_active', true)->firstOrFail();
        return response()->json([
            'id'              => $quiz->id,
            'title'           => $quiz->title,
            'description'     => $quiz->description,
            'time_limit'      => $quiz->time_limit,
            'questions_count' => $quiz->questions()->count()
        ]);
    }

    public function startSession(Request $request, $slug)
    {
        $request->validate([
            'student_name' => 'required|string|max:255',
            'student_id'   => 'nullable|string|max:255',
        ]);

        $quiz = Quiz::where('slug', $slug)->where('is_active', true)->firstOrFail();

        $attempt = QuizAttempt::create([
            'quiz_id'      => $quiz->id,
            'student_name' => $request->student_name,
            'student_id'   => $request->student_id,
            'status'       => 'started',
            'started_at'   => now(),
        ]);

        return response()->json([
            'attempt_id' => $attempt->id,
            'quiz'       => $quiz->load(['questions' => function ($query) {
                $query->with(['options' => function ($q) {
                    $q->select('id', 'question_id', 'text');
                }]);
            }])
        ]);
    }

    public function submitSession(Request $request, $slug)
    {
        $request->validate([
            'attempt_id' => 'required|exists:quiz_attempts,id',
            'answers'    => 'array',
        ]);

        $attempt = QuizAttempt::findOrFail($request->attempt_id);

        if ($attempt->status === 'completed') {
            return response()->json(['message' => 'Already submitted'], 400);
        }

        $attempt->update([
            'status'       => 'completed',
            'completed_at' => now(),
        ]);

        $quiz           = $attempt->quiz;
        $questions      = $quiz->questions()->with('options')->get();
        $totalPossible  = $questions->sum('marks');

        // Group submitted answers by question_id
        $submittedAnswers = collect($request->answers ?? [])->groupBy('question_id');

        $totalEarned = 0;

        foreach ($questions as $question) {
            $qAnswers   = $submittedAnswers->get($question->id, collect());
            $isCorrect  = false;
            $marksAwarded = 0;

            if ($question->type === 'multiple_answers') {
                // All correct option IDs that the question requires
                $requiredCorrectIds = $question->options
                    ->where('is_correct', true)
                    ->pluck('id')
                    ->sort()->values();

                // All option IDs the student selected for this question
                $selectedIds = $qAnswers
                    ->pluck('option_id')
                    ->filter()
                    ->sort()->values();

                // Full marks only if the student selected exactly the correct set
                if ($requiredCorrectIds->isNotEmpty() && $selectedIds->toArray() === $requiredCorrectIds->toArray()) {
                    $isCorrect    = true;
                    $marksAwarded = $question->marks;
                }

            } elseif ($question->type === 'multiple_choice') {
                $selectedOptionId = $qAnswers->first()['option_id'] ?? null;
                if ($selectedOptionId) {
                    $option = $question->options->find($selectedOptionId);
                    if ($option && $option->is_correct) {
                        $isCorrect    = true;
                        $marksAwarded = $question->marks;
                    }
                }

            } else {
                // short_answer / fill_blank — text comparison
                $answerText = $qAnswers->first()['answer_text'] ?? null;
                if ($answerText) {
                    $correctOption = $question->options->firstWhere('is_correct', true);
                    if ($correctOption && strtolower(trim($answerText)) === strtolower(trim($correctOption->text))) {
                        $isCorrect    = true;
                        $marksAwarded = $question->marks;
                    }
                }
            }

            // Save one answer record per question
            $firstAns = $qAnswers->first();
            $attempt->answers()->create([
                'question_id'   => $question->id,
                'option_id'     => $firstAns['option_id'] ?? null,
                'answer_text'   => $firstAns['answer_text'] ?? null,
                'is_correct'    => $isCorrect,
                'marks_awarded' => $marksAwarded,
            ]);

            $totalEarned += $marksAwarded;
        }

        // Store score as a 0–100 percentage, rounded
        $scorePercent = $totalPossible > 0
            ? (int) round(($totalEarned / $totalPossible) * 100)
            : 0;

        $attempt->update(['score' => $scorePercent]);

        // Check the show_results_immediately setting
        $showResults = Setting::where('key', 'show_results_immediately')->value('value') ?? 'true';

        return response()->json([
            'message'                  => 'Quiz submitted successfully',
            'score'                    => $scorePercent,
            'earned_marks'             => $totalEarned,
            'total_marks'              => $totalPossible,
            'show_results_immediately' => $showResults === 'true',
        ]);
    }
}
