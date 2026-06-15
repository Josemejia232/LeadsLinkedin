<?php

namespace App\Http\Controllers;

use App\Models\DayPost;
use App\Models\ScheduledPost;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    public function edit(DayPost $post)
    {
        abort_unless($post->plan->user_id === auth()->id(), 403);

        return Inertia::render('Posts/Edit', [
            'post' => $post->load('plan'),
            'scheduledPost' => $post->scheduledPost,
        ]);
    }

    public function update(Request $request, DayPost $post)
    {
        abort_unless($post->plan->user_id === auth()->id(), 403);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'text_content' => 'nullable|string',
            'hashtags' => 'nullable|string',
            'call_to_action' => 'nullable|string',
        ]);

        $post->update($data);

        return redirect()->back()->with('success', 'Post updated successfully.');
    }

    public function uploadImage(Request $request, DayPost $post)
    {
        abort_unless($post->plan->user_id === auth()->id(), 403);

        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,gif,webp|max:5120',
        ]);

        $path = $request->file('image')->store('posts', 'public');

        $post->update([
            'image_url' => Storage::url($path),
            'image_file' => $path,
        ]);

        return redirect()->back()->with('success', 'Image uploaded successfully.');
    }

    public function updateSchedule(Request $request, DayPost $post)
    {
        abort_unless($post->plan->user_id === auth()->id(), 403);

        $data = $request->validate([
            'scheduled_date' => 'required|date',
        ]);

        ScheduledPost::updateOrCreate(
            ['day_post_id' => $post->id],
            [
                'scheduled_date' => $data['scheduled_date'],
                'status' => 'scheduled',
            ]
        );

        $post->update(['status' => 'scheduled']);

        return back()->with('success', 'Horario actualizado correctamente.');
    }

    public function destroy(DayPost $post)
    {
        abort_unless($post->plan->user_id === auth()->id(), 403);

        if ($post->image_file) {
            Storage::disk('public')->delete($post->image_file);
        }

        $post->delete();

        return redirect()->back()->with('success', 'Post deleted successfully.');
    }
}
