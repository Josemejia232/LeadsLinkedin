import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const navItems = [
        { name: 'Dashboard', href: route('dashboard'), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { name: 'Planes', href: route('plans.index'), icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { name: 'Publicaciones', href: route('publisher.scheduled'), icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
        { name: 'Contactos', href: route('contacts.index'), icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        { name: 'Configuración', href: route('settings.index'), icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-indigo-700 text-white shadow-lg">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center">
                            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mr-3 rounded-md p-1 text-indigo-200 hover:text-white focus:outline-none sm:hidden">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="mr-3 hidden rounded-md p-1 text-indigo-200 hover:text-white focus:outline-none sm:block">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={sidebarCollapsed ? 'M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3' : 'M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18'} />
                                </svg>
                            </button>
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.857.857 0 01-1.257-.57 19.708 19.708 0 01-.507-3.504m5.418 0c.253-.962.584-1.892.985-2.783.247-.55.06-1.21-.463-1.511l-.657-.38a.857.857 0 00-1.257.57 19.708 19.708 0 00.507 3.504m0 0c.688.06 1.386.09 2.09.09h.75a4.5 4.5 0 010 9h-.75c-.704 0-1.402-.03-2.09-.09" />
                                </svg>
                                <span className="text-lg font-bold">LINKEDIN POST</span>
                            </Link>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-indigo-200">
                            <span>{user.name}</span>
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex">
                <aside className={`fixed inset-y-0 left-0 z-30 mt-16 transform bg-white shadow-lg transition-all duration-200 sm:relative sm:mt-0 sm:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:block ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
                    <div className="space-y-1 py-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                                    route().current(item.href === route().current() ? item.href : '')
                                        ? 'border-r-4 border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                </svg>
                                {!sidebarCollapsed && item.name}
                            </Link>
                        ))}
                    </div>
                </aside>

                {sidebarOpen && (
                    <div className="fixed inset-0 z-20 bg-black/50 sm:hidden" onClick={() => setSidebarOpen(false)} />
                )}

                <main className="min-h-[calc(100vh-4rem)] flex-1">
                    {header && (
                        <header className="bg-white shadow">
                            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                                {header}
                            </div>
                        </header>
                    )}
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
