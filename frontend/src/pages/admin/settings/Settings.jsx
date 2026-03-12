import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Save,
    Bell,
    Globe,
    Shield,
    Smartphone,
    Mail,
    Loader2
} from 'lucide-react';
import { getSettingsApi, updateSettingsApi } from '../../../api/settings';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { cn } from '../../../utils/cn';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const [settings, setSettings] = useState({
        app_name: 'Smart QR Quiz',
        contact_email: 'support@example.com',
        timezone: 'UTC',
        allow_guest_attempts: 'false',
        show_results_immediately: 'true',
        maintenance_mode: 'false'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await getSettingsApi();
            if (res.data && Object.keys(res.data).length > 0) {
                setSettings(prev => ({
                    ...prev,
                    ...res.data
                }));
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage('');
        try {
            await updateSettingsApi(settings);
            setSuccessMessage('Settings saved successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                        <SettingsIcon size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Settings</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage global configuration for your quiz application</p>
                    </div>
                </div>
            </div>

            {/* Success Toast / Alert */}
            {successMessage && (
                <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="font-medium text-sm">{successMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* General Settings */}
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <Globe className="text-blue-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">General Information</h2>
                    </div>

                    <div className="grid gap-6">
                        <Input
                            label="Application Name"
                            value={settings.app_name}
                            onChange={(e) => handleChange('app_name', e.target.value)}
                            placeholder="e.g. Smart Quiz App"
                        />
                    </div>
                </div>

                {/* Communication Settings */}
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <Mail className="text-amber-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Communication</h2>
                    </div>

                    <div className="grid gap-6">
                        <Input
                            label="Support Email Address"
                            type="email"
                            value={settings.contact_email}
                            onChange={(e) => handleChange('contact_email', e.target.value)}
                            placeholder="support@domain.com"
                        />
                    </div>
                </div>

                {/* Quiz & Student Policies */}
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <Shield className="text-emerald-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Access & Policies</h2>
                    </div>

                    <div className="space-y-4">
                        <SettingToggle
                            title="Allow Guest Attempts"
                            description="Let students take quizzes without requiring them to log in or register beforehand."
                            checked={settings.allow_guest_attempts === 'true'}
                            onChange={(checked) => handleChange('allow_guest_attempts', checked ? 'true' : 'false')}
                        />
                        <div className="h-px w-full bg-slate-100 dark:bg-slate-700/50"></div>
                        <SettingToggle
                            title="Show Results Immediately"
                            description="Display the final score and answer breakdown to the student right after submitting."
                            checked={settings.show_results_immediately === 'true'}
                            onChange={(checked) => handleChange('show_results_immediately', checked ? 'true' : 'false')}
                        />
                        <div className="h-px w-full bg-slate-100 dark:bg-slate-700/50"></div>
                        <SettingToggle
                            title="Maintenance Mode"
                            description="Temporarily disable access to all public quiz links. Admin panel remains accessible."
                            checked={settings.maintenance_mode === 'true'}
                            onChange={(checked) => handleChange('maintenance_mode', checked ? 'true' : 'false')}
                            danger
                        />
                    </div>
                </div>

                <div className="sticky bottom-6 z-20 flex justify-end bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
                    <Button
                        type="submit"
                        className="rounded-xl px-8 min-w-[140px] gap-2 shadow-blue-500/20 shadow-lg"
                        disabled={saving}
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Settings</>}
                    </Button>
                </div>

            </form>
        </div>
    );
};

function SettingToggle({ title, description, checked, onChange, danger = false }) {
    return (
        <div className="flex items-center justify-between py-2 group cursor-pointer gap-6" onClick={() => onChange(!checked)}>
            <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</span>
            </div>
            <div className="relative shrink-0">
                <div className={cn(
                    "w-12 h-7 rounded-full transition-colors duration-200",
                    checked
                        ? (danger ? "bg-red-500" : "bg-blue-600")
                        : "bg-slate-200 dark:bg-slate-600"
                )}></div>
                <div className={cn(
                    "absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow-sm",
                    checked ? "translate-x-5" : ""
                )}></div>
            </div>
        </div>
    );
}

export default Settings;
