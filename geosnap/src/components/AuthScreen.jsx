import { useState } from 'react';
import { Camera, Mail, Lock, User, Eye, EyeOff, Loader2, MapPin } from 'lucide-react';

const AuthScreen = ({ onLogin, onRegister, isLoading, error }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.email || !formData.password) {
      setFormError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!isLoginMode && !formData.username) {
      setFormError('Vui lòng nhập tên người dùng');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      if (isLoginMode) {
        await onLogin(formData.email, formData.password);
      } else {
        await onRegister(formData.username, formData.email, formData.password);
      }
    } catch (err) {
      setFormError(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl gradient-primary flex items-center justify-center shadow-2xl shadow-orange-500/30">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
            GeoSnap
          </h1>
          <p className="text-gray-500 mt-1 flex items-center justify-center gap-1">
            <MapPin className="w-4 h-4" />
            Share moments, mark places
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white text-center mb-4">
            {isLoginMode ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h2>

          {/* Username (register only) */}
          {!isLoginMode && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Tên người dùng"
                className="w-full bg-white/10 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              className="w-full bg-white/10 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Mật khẩu"
              className="w-full bg-white/10 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Error message */}
          {(formError || error) && (
            <p className="text-red-400 text-sm text-center">
              {formError || error}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl gradient-primary text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isLoginMode ? 'Đăng nhập' : 'Đăng ký'
            )}
          </button>

          {/* Toggle mode */}
          <p className="text-center text-gray-400 text-sm">
            {isLoginMode ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setFormError('');
              }}
              className="text-orange-400 font-medium ml-1 hover:underline"
            >
              {isLoginMode ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </p>
        </form>

        {/* Skip login (for demo) */}
        <button
          onClick={() => onLogin('demo@geosnap.com', 'demo123')}
          className="w-full mt-4 py-3 rounded-xl glass-light text-gray-400 font-medium text-sm hover:text-white transition-colors"
        >
          Dùng thử không cần đăng nhập
        </button>
      </div>
    </div>
  );
};

export default AuthScreen;

