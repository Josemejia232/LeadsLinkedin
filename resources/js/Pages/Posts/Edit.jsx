import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

const STRATEGIC_HOURS_MAP = {
    1: [10],
    2: [10, 11, 12],
    3: [9, 10, 11, 12, 13, 14],
};

function getStrategicHours(dateStr) {
    if (!dateStr) return [];
    const d = new Date(dateStr);
    return STRATEGIC_HOURS_MAP[d.getDay()] || [];
}

function hourLabel(h) {
    if (h < 12) return `${h}:00 AM`;
    if (h === 12) return '12:00 PM';
    return `${h - 12}:00 PM`;
}

function buildHours(strategic) {
    const hours = [];
    for (let h = 6; h <= 22; h++) {
        const isStrategic = strategic.includes(h);
        hours.push({ hour: h, label: `${hourLabel(h)}${isStrategic ? ' ★' : ''}`, isStrategic });
    }
    return hours;
}

export default function PostsEdit() {
    const { post, scheduledPost, flash } = usePage().props;
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const { data, setData, put, processing, errors } = useForm({
        title: post.title || '',
        text_content: post.text_content || '',
        hashtags: post.hashtags || '',
        call_to_action: post.call_to_action || '',
    });

    const [scheduleDate, setScheduleDate] = useState(() => {
        if (scheduledPost?.scheduled_date) {
            const d = new Date(scheduledPost.scheduled_date);
            return d.toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).replace(' ', 'T').slice(0, 16);
        }
        return '';
    });
    const [scheduleProcessing, setScheduleProcessing] = useState(false);

    const postDate = post?.date ? new Date(post.date).toISOString().split('T')[0] : '';
    const strategicHours = getStrategicHours(post?.date);
    const allHours = buildHours(strategicHours);
    const currentHour = scheduledPost?.scheduled_date ? new Date(scheduledPost.scheduled_date).getHours() : 10;

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('posts.update', post.id));
    };

    const handleScheduleSubmit = async () => {
        setScheduleProcessing(true);
        try {
            await fetch(route('posts.schedule', post.id), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduled_date: new Date(scheduleDate).toISOString() }),
            });
            window.location.reload();
        } catch (err) {
            console.error(err);
        } finally {
            setScheduleProcessing(false);
        }
    };

    const handleHourChange = (hour) => {
        const newDate = postDate + 'T' + hour.toString().padStart(2, '0') + ':00';
        setScheduleDate(newDate);
    };

    function toWebP(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const c = document.createElement('canvas');
                c.width = img.width;
                c.height = img.height;
                c.getContext('2d').drawImage(img, 0, 0);
                c.toBlob((blob) => {
                    const r = new FileReader();
                    r.onload = () => resolve(r.result);
                    r.onerror = reject;
                    r.readAsDataURL(blob);
                }, 'image/webp', 0.8);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const dataUrl = await toWebP(file);
            const res = await fetch('/api/upload-post-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: post.id, image: dataUrl }),
            });
            const result = await res.json();
            if (result.url) {
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Editar Publicación</h2>
                    <Link
                        href={route('plans.show', post.plan_id)}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Volver al Plan
                    </Link>
                </div>
            }
        >
            <Head title="Editar Publicación" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">{flash.success}</div>
                    )}
                    {errors.submit && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{errors.submit}</div>
                    )}

                    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-6">
                                <InputLabel htmlFor="title" value="Título" />
                                <TextInput
                                    id="title"
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="text_content" value="Contenido" />
                                <textarea
                                    id="text_content"
                                    rows={12}
                                    value={data.text_content}
                                    onChange={(e) => setData('text_content', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="hashtags" value="Hashtags" />
                                <TextInput
                                    id="hashtags"
                                    type="text"
                                    value={data.hashtags}
                                    onChange={(e) => setData('hashtags', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="#hashtag1 #hashtag2"
                                />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="call_to_action" value="Call to Action" />
                                <textarea
                                    id="call_to_action"
                                    rows={3}
                                    value={data.call_to_action}
                                    onChange={(e) => setData('call_to_action', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>

                            {scheduledPost && (
                                <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div>
                                            <InputLabel value="Horario de Publicación" />
                                            <p className="mt-0.5 text-xs text-purple-600">
                                                Fecha: <span className="font-semibold">{new Date(scheduledPost.scheduled_date).toLocaleDateString('es-ES', { dateStyle: 'long', timeZone: 'America/Bogota' })}</span>
                                            </p>
                                        </div>
                                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                            scheduledPost.status === 'scheduled' ? 'bg-purple-100 text-purple-800' :
                                            scheduledPost.status === 'published' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {scheduledPost.status === 'scheduled' ? 'Programado' : scheduledPost.status === 'published' ? 'Publicado' : scheduledPost.status}
                                        </span>
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <InputLabel htmlFor="scheduled_hour" value="Hora" />
                                            <select
                                                id="scheduled_hour"
                                                value={currentHour || 10}
                                                onChange={(e) => handleHourChange(Number(e.target.value))}
                                                className="mt-1 block w-full rounded-md border-purple-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                                            >
                                                {allHours.map((h) => (
                                                    <option key={h.hour} value={h.hour}>
                                                        {h.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleScheduleSubmit}
                                            disabled={scheduleProcessing}
                                            className="inline-flex items-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-25"
                                        >
                                            {scheduleProcessing ? 'Guardando...' : 'Actualizar'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-end">
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Actualizando...' : 'Actualizar Publicación'}
                                </PrimaryButton>
                            </div>
                        </form>

                        <div className="border-t border-gray-200 p-6">
                            <InputLabel value="Imagen del Post" />
                            <p className="mt-1 text-xs text-gray-500">Se convertirá automáticamente a WebP para optimizar peso.</p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleImageUpload}
                                className="hidden"
                            />

                            {post?.image_url ? (
                                <div className="group relative mt-3">
                                    <img
                                        src={post.image_url}
                                        alt="Preview"
                                        className="w-full rounded-lg border border-gray-200 object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                                    >
                                        {uploading ? 'Subiendo...' : 'Cambiar imagen'}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 text-sm text-gray-500 transition hover:border-indigo-400 hover:text-indigo-600"
                                >
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                                    </svg>
                                    Click para subir imagen
                                </button>
                            )}
                            {uploading && <p className="mt-2 text-xs text-indigo-600">Subiendo imagen...</p>}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}