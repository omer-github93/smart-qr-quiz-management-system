<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\Quiz;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function index(Quiz $quiz)
    {
        return response()->json($quiz->questions()->with('options')->orderBy('order')->get());
    }

    public function store(Request $request, Quiz $quiz)
    {
        $data = $request->validate([
            'text' => 'required|string',
            'type' => 'required|string|in:multiple_choice,multiple_answers,short_answer,fill_blank',
            'marks' => 'required|integer|min:1',
            'options' => 'nullable|array',
            'options.*.text' => 'required|string',
            'options.*.is_correct' => 'required|boolean',
        ]);

        $question = $quiz->questions()->create([
            'text' => $data['text'],
            'type' => $data['type'],
            'marks' => $data['marks'],
            'order' => $quiz->questions()->max('order') + 1,
        ]);

        if (isset($data['options'])) {
            $question->options()->createMany($data['options']);
        }

        return response()->json($question->load('options'), 201);
    }

    public function update(Request $request, Question $question)
    {
        $data = $request->validate([
            'text' => 'string',
            'type' => 'string|in:multiple_choice,multiple_answers,short_answer,fill_blank',
            'marks' => 'integer|min:1',
            'options' => 'nullable|array',
            'options.*.id' => 'nullable|exists:options,id',
            'options.*.text' => 'required|string',
            'options.*.is_correct' => 'required|boolean',
        ]);

        $question->update($request->only(['text', 'type', 'marks']));

        // Update or create options
        if (isset($data['options'])) {
            $existingOptionIds = [];
            foreach ($data['options'] as $opt) {
                if (isset($opt['id'])) {
                    $question->options()->where('id', $opt['id'])->update($opt);
                    $existingOptionIds[] = $opt['id'];
                } else {
                    $newOpt = $question->options()->create($opt);
                    $existingOptionIds[] = $newOpt->id;
                }
            }
            // Remove deleted options
            $question->options()->whereNotIn('id', $existingOptionIds)->delete();
        }

        return response()->json($question->load('options'));
    }

    public function destroy(Question $question)
    {
        $question->delete();
        return response()->json(['message' => 'Question deleted']);
    }
}
