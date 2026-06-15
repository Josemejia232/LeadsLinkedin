<?php

namespace App\Http\Controllers;

use App\Models\Topic;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TopicController extends Controller
{
    public function index()
    {
        $topics = Topic::where('user_id', auth()->id())->get();

        return Inertia::render('Topics/Index', [
            'topics' => $topics,
        ]);
    }

    public function create()
    {
        return Inertia::render('Topics/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'industry' => 'nullable|string|max:255',
            'keywords' => 'nullable|string',
            'objectives' => 'nullable|string',
            'target_audience' => 'nullable|string',
        ]);

        $data['user_id'] = auth()->id();

        Topic::create($data);

        return redirect()->route('topics.index')->with('success', 'Topic created successfully.');
    }

    public function edit(Topic $topic)
    {
        abort_unless($topic->user_id === auth()->id(), 403);

        return Inertia::render('Topics/Edit', [
            'topic' => $topic,
        ]);
    }

    public function update(Request $request, Topic $topic)
    {
        abort_unless($topic->user_id === auth()->id(), 403);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'industry' => 'nullable|string|max:255',
            'keywords' => 'nullable|string',
            'objectives' => 'nullable|string',
            'target_audience' => 'nullable|string',
        ]);

        $topic->update($data);

        return redirect()->route('topics.index')->with('success', 'Topic updated successfully.');
    }

    public function destroy(Topic $topic)
    {
        abort_unless($topic->user_id === auth()->id(), 403);

        $topic->delete();

        return redirect()->route('topics.index')->with('success', 'Topic deleted successfully.');
    }
}
