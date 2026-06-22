import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { insforge } from '@/lib/insforge';
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

function formatHour(h) {
    return h.toString().padStart(2, '0') + ':00';
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

export default function PostsEdit({ postId }) {
    const [post, setPost] = useState(null);
    const [scheduledPost, setScheduledPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [scheduleProcessing, setScheduleProcessing] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        text_content: '',
        hashtags: '',
        call_to_action: '',
    });
    const [scheduledDate, setScheduledDate] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: postData, error: postError } = await insforge.database
                    .from('day_posts')
                    .select('*')
                    .eq('id', postId)
                    .single();

                if (postError) {
                    setError(postError.message);
                    return;
                }

                setPost(postData);
                setFormData({
                    title: postData.title || '',
                    text_content: postData.text_content || '',
                    hashtags: postData.hashtags || '',
                    call_to_action: postData.call_to_action || '',
                });

                const { data: schedData } = await insforge.database
                    .from('scheduled_posts')
                    .select('*')
                    .eq('day_post_id', postId)
                    .single();

                if (schedData) {
                    setScheduledPost(schedData);
                    const d = new Date(schedData.scheduled_date);
                    const local = d.toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).replace(' ', 'T').slice(0, 16);
                    setScheduledDate(local);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [postId]);

    const postDate = post?.date ? new Date(post.date).toISOString().split('T')[0] : '';
    const strategicHours = getStrategicHours(post?.date);
    const allHours = buildHours(strategicHours);
    const currentHour = scheduledPost?.scheduled_date ? new Date(scheduledPost.scheduled_date).getHours() : 10;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError(null);

        try {
            const { error: updateError } = await insforge.database
                .from('day_posts')
                .update({
                    title: formData.title,
                    text_content: formData.text_content,
                    hashtags: formData.hashtags,
                    call_to_action: formData.call_to_action,
                })
                .eq('id', postId);

            if (updateError) {
                setError(updateError.message);
            } else {
                setFlash({ success: 'Publicación actualizada.' });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleScheduleSubmit = async () => {
        setScheduleProcessing(true);
        setError(null);

        try {
            const payload = {
                day_post_id: postId,
                scheduled_date: new Date(scheduledDate).toISOString(),
                status: 'scheduled',
            };

            if (scheduledPost?.id) {
                const { error: schedError } = await insforge.database
                    .from('scheduled_posts')
                    .update(payload)
                    .eq('id', scheduledPost.id);

                if (schedError) {
                    setError(schedError.message);
                    return;
                }
            } else {
                const { error: schedError } = await insforge.database
                    .from('scheduled_posts')
                    .insert([payload]);

                if (schedError) {
                    setError(schedError.message);
                    return;
                }
            }

            setScheduledPost({ ...scheduledPost, scheduled_date: scheduledDate, status: 'scheduled' });
            setFlash({ success: 'Horario actualizado.' });
        } catch (err) {
            setError(err.message);
        } finally {
            setScheduleProcessing(false);
        }
    };

    const handleHourChange = (hour) => {
        const newDate = postDate + 'T' + formatHour(hour);
        setScheduledDate(newDate);
    };

    function convertToWebP(file, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
                        resolve(new File([blob], name, { type: 'image/webp' }));
                    } else {
                        reject(new Error('Error al convertir a WebP'));
                    }
                }, 'image/webp', quality);
            };
            img.onerror = () => reject(new Error('Error al cargar la imagen'));
            img.src = URL.createObjectURL(file);
        });
    }

    const toWebP = (file) => new Promise((resolve, reject) => {
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

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const dataUrl = await toWebP(file);

            const res = await fetch('/api/upload-post-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: postId, image: dataUrl }),
            });
            const result = await res.json();

            if (result.url) {
                setPost(prev => ({ ...prev, image_url: result.url }));
            } else {
                setError(result.error || 'Error al subir imagen');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Cargando...</h2>}>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl px-4 text-center text-gray-500">Cargando publicación...</div>
                </div>
            </AuthenticatedLayout>
        );
    }

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
                    {error && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
                    )}

                    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-6">
                                <InputLabel htmlFor="title" value="Título" />
                                <TextInput
                                    id="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="mt-1 block w-full"
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="text_content" value="Contenido" />
                                <textarea
                                    id="text_content"
                                    rows={12}
                                    value={formData.text_content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="hashtags" value="Hashtags" />
                                <TextInput
                                    id="hashtags"
                                    type="text"
                                    value={formData.hashtags}
                                    onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                                    className="mt-1 block w-full"
                                    placeholder="#hashtag1 #hashtag2"
                                />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="call_to_action" value="Call to Action" />
                                <textarea
                                    id="call_to_action"
                                    rows={3}
                                    value={formData.call_to_action}
                                    onChange={(e) => setFormData(prev => ({ ...prev, call_to_action: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>

                            {scheduledPost && (
                                <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
                                    <div className="flex items-center justify-between mb-3">
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
                                <div className="mt-3 relative group">
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