import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Mail, Lock, Loader2, LogIn, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import './Login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const validate = () => {
        const newErrors = {};
        if (!email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address.';
        }
        if (!password.trim()) {
            newErrors.password = 'Password is required.';
        }
        return newErrors;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrors({});

        const clientErrors = validate();
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setIsLoading(true);
        const result = await login(email, password, rememberMe);
        setIsLoading(false);

        if (result.success) {
            const from = location.state?.from?.pathname || '/admin/dashboard';
            navigate(from, { replace: true });
        } else {
            setErrors({ form: result.message || 'Invalid email or password. Please try again.' });
        }
    };

    const clearFieldError = (field) => {
        if (errors[field]) {
            setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        }
    };

    return (
        <div className="login-page-root">
            {/* ── LEFT PANEL ── */}
            <div className="lp-left">
                <div className="lp-form-box">
                    <h1 className="lp-title">ADMIN LOGIN</h1>

                    {errors.form && (
                        <div className="lp-form-error">
                            <AlertCircle size={18} />
                            {errors.form}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="lp-form" noValidate>
                        <div className="lp-field-group">
                            <div className={`lp-field${errors.email ? ' lp-field--error' : ''}`}>
                                <span className="lp-icon"><Mail size={18} /></span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                                    className="lp-input"
                                    placeholder="Email"
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && (
                                <span className="lp-field-error">
                                    <AlertCircle size={13} /> {errors.email}
                                </span>
                            )}
                        </div>

                        <div className="lp-field-group">
                            <div className={`lp-field${errors.password ? ' lp-field--error' : ''}`}>
                                <span className="lp-icon"><Lock size={18} /></span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                                    className="lp-input"
                                    placeholder="Password"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="lp-eye-btn"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                            {errors.password && (
                                <span className="lp-field-error">
                                    <AlertCircle size={13} /> {errors.password}
                                </span>
                            )}
                        </div>

                        <div className="lp-remember-box" onClick={() => setRememberMe(!rememberMe)}>
                            <div className={`lp-remember-check ${rememberMe ? 'lp-remember-check--active' : ''}`}>
                                {rememberMe && <Check size={14} color="white" />}
                            </div>
                            <span className="lp-remember-label">Remember me</span>
                        </div>

                        <button type="submit" disabled={isLoading} className="lp-btn">
                            {isLoading
                                ? <Loader2 size={20} className="lp-spin" />
                                : <><LogIn size={18} /> LOGIN</>
                            }
                        </button>
                    </form>
                </div>
                <div className="lp-wave" />
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="lp-right">
                <div className="lp-neon-layer">
                    <span className="lp-neon lp-neon-q">?</span>
                    <span className="lp-neon lp-neon-bulb1">💡</span>
                    <span className="lp-neon lp-neon-bulb2">💡</span>
                    <span className="lp-neon lp-neon-bulb3">💡</span>
                    <span className="lp-neon lp-neon-puzzle1">🧩</span>
                    <span className="lp-neon lp-neon-puzzle2">🧩</span>
                    <span className="lp-neon lp-neon-star">⭐</span>
                    <span className="lp-neon lp-neon-trophy">🏆</span>
                    <span className="lp-neon lp-neon-brain">🧠</span>
                    <span className="lp-neon lp-neon-q2">❓</span>
                    <span className="lp-neon lp-neon-pacman">🎯</span>
                </div>
                <div className="lp-rocket">🚀</div>
                <div className="lp-smoke">☁️☁️</div>
            </div>
        </div>
    );
}
