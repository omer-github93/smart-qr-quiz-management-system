<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class QuizController extends Controller
{
    public function index()
    {
        return response()->json(Quiz::withCount(['questions'])->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255|min:3',
            'description' => 'nullable|string|max:2000',
            'time_limit'  => 'required|integer|min:1|max:300',
            'is_active'   => 'boolean',
            'questions'   => 'required|array|min:1',
            'questions.*.text'  => 'required|string|min:1',
            'questions.*.type'  => 'required|in:multiple_choice,multiple_answers,short_answer,fill_blank',
            'questions.*.marks' => 'required|integer|min:1',
            'questions.*.options' => 'required|array|min:1',
            'questions.*.options.*.text' => 'required|string|min:1',
        ], [
            'title.required'       => 'Quiz name is required.',
            'title.min'            => 'Quiz name must be at least 3 characters.',
            'time_limit.required'  => 'Quiz period (duration) is required.',
            'time_limit.min'       => 'Quiz period must be at least 1 minute.',
            'time_limit.max'       => 'Quiz period cannot exceed 300 minutes.',
            'questions.required'   => 'At least one question is required.',
            'questions.*.text.required' => 'Each question must have text.',
            'questions.*.type.required' => 'Each question must have a type.',
            'questions.*.marks.required' => 'Each question must have a point value.',
            'questions.*.options.required' => 'Each question must have at least one option.',
            'questions.*.options.*.text.required' => 'Each option must have text.',
        ]);

        // When receiving multipart/form-data boolean values might be strings
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
        }

        // Remove 'questions' from $data so it doesn't get inserted as a quiz column
        unset($data['questions']);

        $data['slug'] = Str::slug($data['title']) . '-' . Str::random(5);
        $data['added_by'] = $request->user()->id;

        $quiz = Quiz::create($data);

        // Handle questions
        $this->syncQuestions($quiz, $request);

        // Generate QR code automatically on creation
        $this->generateQrForQuiz($quiz);

        return response()->json($quiz->load('questions.options'), 201);
    }

    public function show(Quiz $quiz)
    {
        return response()->json($quiz->load(['questions.options' => function($q) {
            $q->orderBy('id');
        }]));
    }

    public function update(Request $request, Quiz $quiz)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255|min:3',
            'description' => 'nullable|string|max:2000',
            'time_limit'  => 'required|integer|min:1|max:300',
            'is_active'   => 'boolean',
        ], [
            'title.required'      => 'Quiz name is required.',
            'title.min'           => 'Quiz name must be at least 3 characters.',
            'time_limit.required' => 'Quiz period (duration) is required.',
            'time_limit.min'      => 'Quiz period must be at least 1 minute.',
            'time_limit.max'      => 'Quiz period cannot exceed 300 minutes.',
        ]);

        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
        }

        $quiz->update($data);

        // Handle questions sync
        $this->syncQuestions($quiz, $request);

        return response()->json($quiz->load('questions.options'));
    }

    public function destroy(Quiz $quiz)
    {
        $quiz->delete();
        return response()->json(['message' => 'Quiz deleted']);
    }

    protected function syncQuestions(Quiz $quiz, Request $request)
    {
        if (!$request->has('questions')) {
            return;
        }

        $questionsData = $request->all()['questions'] ?? [];
        // If formData sends stringified JSON for questions, parse it? No, if formatted correctly it will be an array.
        if (is_string($questionsData)) {
            $questionsData = json_decode($questionsData, true);
        }

        $existingQuestionIds = [];
        $order = 1;

        foreach ($questionsData as $index => $qData) {
            if (is_string($qData)) {
                $qData = json_decode($qData, true);
            }

            $questionModel = null;
            $questionId = $qData['id'] ?? null;

            $questionPayload = [
                'text' => $qData['text'] ?? '',
                'type' => $qData['type'] ?? 'multiple_choice',
                'marks' => $qData['marks'] ?? 1,
                'order' => $order++,
            ];

            // Handle Image Upload -> use the file from request if exists
            // because FormData arrays with files: request()->file("questions.{$index}.image")
            if ($request->hasFile("questions.{$index}.image")) {
                $file = $request->file("questions.{$index}.image");
                $path = $file->store('questions', 'public');
                $questionPayload['image_path'] = '/storage/' . $path;
            }

            // Remove image if requested
            if (isset($qData['remove_image']) && filter_var($qData['remove_image'], FILTER_VALIDATE_BOOLEAN)) {
                $questionPayload['image_path'] = null;
            }

            if ($questionId) {
                $questionModel = $quiz->questions()->find($questionId);
                if ($questionModel) {
                    $questionModel->update($questionPayload);
                    $existingQuestionIds[] = $questionModel->id;
                }
            }

            if (!$questionModel) {
                // Determine if there was an image passed inside parsed string
                $questionModel = $quiz->questions()->create($questionPayload);
                $existingQuestionIds[] = $questionModel->id;
            }

            // Options syncing
            if (isset($qData['options']) && is_array($qData['options'])) {
                $existingOptionIds = [];
                foreach ($qData['options'] as $optData) {
                    if (is_string($optData)) {
                        $optData = json_decode($optData, true);
                    }
                    
                    $optPayload = [
                        'text' => $optData['text'] ?? '',
                        'is_correct' => filter_var($optData['is_correct'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    ];

                    $optId = $optData['id'] ?? null;
                    if ($optId) {
                        $optModel = $questionModel->options()->find($optId);
                        if ($optModel) {
                            $optModel->update($optPayload);
                            $existingOptionIds[] = $optModel->id;
                        } else {
                            $newOpt = $questionModel->options()->create($optPayload);
                            $existingOptionIds[] = $newOpt->id;
                        }
                    } else {
                        $newOpt = $questionModel->options()->create($optPayload);
                        $existingOptionIds[] = $newOpt->id;
                    }
                }
                // Delete removed options
                $questionModel->options()->whereNotIn('id', $existingOptionIds)->delete();
            } else {
                // If it's short answer or fill in the blank without distinct options? 
                // Or maybe we still use options for exact match answers.
                // Assuming empty options means delete all if they aren't provided.
                if (!in_array($questionPayload['type'], ['short_answer', 'fill_blank'])) {
                    // For safety, don't blindly delete if type requires options but none provided.
                }
            }
        }

        // Delete any questions that were removed
        $quiz->questions()->whereNotIn('id', $existingQuestionIds)->delete();
    }

    public function generateQr(Quiz $quiz)
    {
        $this->generateQrForQuiz($quiz);
        return response()->json(['message' => 'QR Code regenerated', 'qr_code_path' => $quiz->qr_code_path]);
    }

    private function generateQrForQuiz(Quiz $quiz)
    {
        // Path matches the frontend routing format for the student entry flow
        $url = env('FRONTEND_URL', 'http://localhost:5173') . '/quiz/' . $quiz->slug;
        $fileName = 'qr/' . $quiz->slug . '.svg';
        
        $qrImage = QrCode::format('svg')->size(300)->generate($url);
        
        Storage::disk('public')->put($fileName, $qrImage);
        
        $quiz->update(['qr_code_path' => '/storage/' . $fileName]);
    }
}
