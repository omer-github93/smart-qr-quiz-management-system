import { useState, createContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    HelpCircle,
    Trophy,
    Settings,
    Menu,
    X,
    PanelLeftClose,
    PanelLeftOpen,
    LogOut,
    Moon,
    Sun
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

const SidebarContext = createContext(null);

export default function AdminLayout() {
    const [expanded, setExpanded] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    return (
        <SidebarContext.Provider value={{ expanded, setExpanded }}>
            <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">

                {/* Mobile backdrop */}
                {mobileOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-sm transition-[width,transform] duration-300 ease-in-out lg:static lg:translate-x-0",
                        expanded ? "w-64" : "w-20",
                        mobileOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
                        {/* Logo area */}
                        <div className={cn("flex items-center overflow-hidden transition-all duration-300", expanded ? "w-auto opacity-100" : "w-0 opacity-0")}>
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold shrink-0">
                                Q
                            </div>
                            <span className="ml-3 font-bold text-slate-800 dark:text-white whitespace-nowrap animate-in fade-in zoom-in duration-300">
                                Smart Quiz
                            </span>
                        </div>

                        {/* Logo for collapsed state */}
                        {!expanded && (
                            <div className="absolute left-0 w-full flex justify-center opacity-100 transition-opacity duration-300 pointer-events-none">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white font-bold shadow-sm">
                                    Q
                                </div>
                            </div>
                        )}

                        {/* Desktop Toggle Button */}
                        <button
                            onClick={() => setExpanded(curr => !curr)}
                            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors z-10"
                            title={expanded ? "Collapse Sidebar" : "Expand Sidebar"}
                        >
                            {expanded ? <PanelLeftClose size={22} strokeWidth={1.5} /> : <PanelLeftOpen size={22} strokeWidth={1.5} />}
                        </button>

                        {/* Mobile Close Button */}
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 z-10"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
                        <SidebarItem icon={<LayoutDashboard size={20} />} text="Dashboard" to="/admin/dashboard" expanded={expanded} />
                        <SidebarItem icon={<BookOpen size={20} />} text="Quizzes" to="/admin/quizzes" expanded={expanded} />
                        <SidebarItem icon={<Trophy size={20} />} text="Leaderboard" to="/admin/leaderboard" expanded={expanded} />
                        <div className="my-4 border-t border-slate-100 dark:border-slate-700 mx-2" />
                        <SidebarItem icon={<Settings size={20} />} text="Settings" to="/admin/settings" expanded={expanded} />
                    </nav>

                    {/* Bottom Area: Theme, Profile & Logout */}
                    <div className="border-t border-slate-100 dark:border-slate-700 p-4 shrink-0 flex flex-col gap-4">
                        <div className={cn("flex flex-col gap-2 transition-all duration-300", expanded ? "items-stretch" : "items-center")}>
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className={cn(
                                    "flex items-center justify-center h-10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group",
                                    expanded ? "px-4 w-full" : "w-10"
                                )}
                                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                {theme === 'dark' ? <Sun size={18} className={cn("shrink-0 text-amber-500", expanded ? "mr-2" : "")} /> : <Moon size={18} className={cn("shrink-0", expanded ? "mr-2" : "")} />}
                                {expanded && <span className="text-sm font-medium whitespace-nowrap">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                            </button>

                            {/* User Profile */}
                            <div className={cn("flex items-center py-2 rounded-xl transition-all cursor-default", expanded ? "px-2" : "justify-center")}>
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-600">
                                    {user?.name?.charAt(0) || 'A'}
                                </div>
                                {expanded && (
                                    <div className="flex flex-col ml-3 overflow-hidden animate-in fade-in duration-300">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap truncate">{user?.name || 'Admin User'}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap truncate">{user?.email || 'admin@admin.com'}</span>
                                    </div>
                                )}
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className={cn(
                                    "flex items-center justify-center h-10 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group",
                                    expanded ? "px-4 w-full" : "w-10"
                                )}
                                title="Sign Out"
                            >
                                <LogOut size={18} className={cn("shrink-0", expanded ? "mr-2" : "")} />
                                {expanded && <span className="text-sm font-medium whitespace-nowrap">Sign Out</span>}
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-slate-50 dark:bg-slate-900">
                    <header className="h-16 flex items-center px-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shrink-0 sticky top-0 z-30 lg:hidden">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="p-2 -ml-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="ml-2 font-semibold text-slate-800 dark:text-slate-100">Smart Quiz Admin</h1>
                    </header>

                    <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-transparent">
                        <div className="mx-auto max-w-7xl animate-in slide-in-from-bottom-4 fade-in duration-500">
                            <Outlet />
                        </div>
                    </main>
                </div>

            </div>
        </SidebarContext.Provider>
    );
}

function SidebarItem({ icon, text, to, expanded }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn(
                "relative flex items-center h-11 px-3 rounded-xl cursor-pointer group transition-all duration-200",
                isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
            )}
        >
            {({ isActive }) => (
                <>
                    {/* Active Indicator Line */}
                    {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-md bg-blue-600" />
                    )}

                    <div className={cn("flex items-center justify-center shrink-0 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")}>
                        {icon}
                    </div>

                    {expanded && (
                        <span className="ml-3 whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                            {text}
                        </span>
                    )}

                    {/* Hover Tooltip for Collapsed State */}
                    {!expanded && (
                        <div className="absolute left-14 px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-medium opacity-0 invisible translate-x-2 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50 pointer-events-none whitespace-nowrap shadow-xl">
                            {text}
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-800" />
                        </div>
                    )}
                </>
            )}
        </NavLink>
    );
}
