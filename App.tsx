import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Switched to stable library
import { Product, CartItem, PaymentMethod, Order, OrderStatus, User, Store, Employee, Screen } from './types';
import { productApi, checkoutApi, storeApi, historyApi, cashierApi, authApi, otpApi } from './services/apiService';
import { SQL_ReceiptStatus } from './data/sqlDb';
import { LOGO_URL } from './constants';
import { 
  Barcode, 
  ShoppingCart, 
  CreditCard, 
  LayoutDashboard, 
  ChevronLeft, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  QrCode,
  Users,
  Camera,
  Search,
  MapPin,
  LogOut,
  Navigation,
  Receipt,
  Clock,
  SearchCode,
  ShieldCheck,
  Banknote,
  XCircle,
  Lock,
  UserCheck,
  Smartphone,
  ArrowRight,
  User as UserIcon,
  Menu, // Added Menu icon
  X // Added X icon
} from 'lucide-react';
import SystemArchitecture from './components/SystemArchitecture';

type EmployeeMode = 'CASHIER' | 'GUARD';

// --- Shared Components ---

// Updated BarcodeScanner to support shape variants (Square for QR, Rectangle for Product)
const BarcodeScanner: React.FC<{ onScan: (code: string) => void; variant?: 'square' | 'rectangle' }> = React.memo(({ onScan, variant = 'square' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;
    let detector: any = null;

    if (!('BarcodeDetector' in window)) {
      setIsSupported(false);
    } else {
      // @ts-ignore
      detector = new window.BarcodeDetector({ formats: ['ean_13', 'upc_a', 'code_128', 'qr_code'] });
    }

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          if (detector) scanFrame();
        }
      } catch (err) {
        setHasPermission(false);
      }
    };

    const scanFrame = async () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            onScan(barcodes[0].rawValue);
          }
        } catch (err) {
          // console.error("Detection error", err);
        }
      }
      animationFrameId = requestAnimationFrame(scanFrame);
    };

    startCamera();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan]);

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-white bg-black h-full">
        <AlertCircle size={48} className="text-[#FFD200] mb-4" />
        <p className="font-bold text-lg">Hardware Incompatibility</p>
        <p className="text-sm text-gray-400 mt-2">Browser doesn't support Barcode API.</p>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-white bg-black h-full">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="font-bold">Camera Denied</p>
        <p className="text-sm text-gray-400">Please enable camera access.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Camera Video */}
      {hasPermission === true && (
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline />
      )}
      
      {/* Dark overlay outside scanning area */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Top overlay */}
        <div className="absolute top-0 left-0 right-0 bg-black/50" style={{ height: 'calc(50% - 25%)' }}></div>
        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50" style={{ height: 'calc(50% - 25%)' }}></div>
        {/* Left overlay */}
        <div className="absolute top-1/4 bottom-1/4 left-0 bg-black/50" style={{ width: '5%' }}></div>
        {/* Right overlay */}
        <div className="absolute top-1/4 bottom-1/4 right-0 bg-black/50" style={{ width: '5%' }}></div>
      </div>
      
      {/* Scanning Frame Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className={`relative ${variant === 'rectangle' ? 'w-[90%] h-1/2' : 'w-80 h-80'}`}>
          {/* L-shaped corners - larger and more visible */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white shadow-lg"></div>
          <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white shadow-lg"></div>
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white shadow-lg"></div>
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white shadow-lg"></div>
          
          {/* Green horizontal line across center */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#007041] shadow-[0_0_8px_rgba(0,112,65,0.6)]"></div>
          {/* Green vertical lines - two separate lines from top and bottom */}
          <div className="absolute left-1/2 top-0 h-1/4 w-[2px] bg-[#007041] shadow-[0_0_8px_rgba(0,112,65,0.6)]"></div>
          <div className="absolute left-1/2 bottom-0 h-1/4 w-[2px] bg-[#007041] shadow-[0_0_8px_rgba(0,112,65,0.6)]"></div>
          
          {/* Scanning instruction text */}
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-white text-sm font-medium drop-shadow-lg">Position barcode within the frame</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// --- View Components ---

// Refactored Login Components
const CustomerLoginForm: React.FC<{ onSuccess: (phone: string, name: string) => void }> = ({ onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'INPUT_MOBILE' | 'INPUT_OTP'>('INPUT_MOBILE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (phoneNumber.length < 10) {
      setError('Invalid Mobile Number');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    const res = await otpApi.sendOtp(phoneNumber);
    setIsLoading(false);

    if (res.success) {
      setStep('INPUT_OTP');
    } else {
      setError(res.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError(null);
    const res = await otpApi.verifyOtp(phoneNumber, otp);
    setIsLoading(false);

    if (res.success) {
      onSuccess(phoneNumber, name);
    } else {
      setError(res.message || 'Invalid OTP');
    }
  };

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border-t-8 border-[#007041]">
      <div className="flex justify-center mb-6">
         {/* Using stored logo URL */}
         <img src={LOGO_URL} alt="ScanGo Logo" className="h-16 object-contain" />
      </div>
      
      <h1 className="text-2xl font-black text-center text-gray-800 mb-2">
        {step === 'INPUT_MOBILE' ? 'Welcome' : 'Verify Mobile'}
      </h1>
      <p className="text-center text-gray-400 text-sm mb-8 font-medium">
        {step === 'INPUT_MOBILE' ? 'Create an account to continue' : `Enter OTP sent to ${phoneNumber}`}
      </p>

      {step === 'INPUT_MOBILE' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
              <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#007041] transition">
                  <div className="bg-gray-100 px-4 py-4 border-r border-gray-200 text-gray-500 font-bold text-sm flex items-center">
                    <UserIcon size={24} />
                  </div>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-transparent p-4 outline-none font-bold text-gray-800"
                    placeholder="John Doe"
                  />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Mobile Number</label>
              <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#007041] transition">
                  <div className="bg-gray-100 px-4 py-4 border-r border-gray-200 text-gray-500 font-bold text-sm flex items-center">
                    +91
                  </div>
                  <input 
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 bg-transparent p-4 outline-none font-bold text-gray-800"
                    placeholder="98765 43210"
                    maxLength={10}
                  />
              </div>
            </div>
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#007041] text-white py-4 rounded-xl font-bold text-lg hover:bg-green-800 transition shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? 'Sending...' : <>Get OTP <ArrowRight size={20} /></>}
            </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">One Time Password</label>
              <input 
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-[#007041] transition"
                  placeholder="------"
                  maxLength={6}
              />
            </div>
            <p className="text-[10px] text-gray-400 font-bold text-center bg-gray-100 py-1 rounded">
              Demo Hint: Use OTP <span className="text-gray-800">123456</span>
            </p>
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#007041] text-white py-4 rounded-xl font-bold text-lg hover:bg-green-800 transition shadow-lg active:scale-[0.98]"
            >
              {isLoading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button 
              type="button" 
              onClick={() => { setStep('INPUT_MOBILE'); setError(null); }}
              className="w-full text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-[#007041] py-2"
            >
              Change Number
            </button>
        </form>
      )}
      <div className="mt-8 text-center text-xs text-gray-400 font-medium">
        <p>By logging in, you agree to our</p>
        <p><span className="underline">Terms of Service</span> & <span className="underline">Privacy Policy</span></p>
      </div>
    </div>
  );
};

const EmployeeLoginForm: React.FC<{ onSuccess: (emp: Employee) => void }> = ({ onSuccess }) => {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const emp = await authApi.login(empId, password);
      if (emp) {
        onSuccess(emp);
      } else {
        setError('Invalid Credentials');
      }
    } catch (err) {
      setError('Login Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-gray-800 p-8 rounded-3xl shadow-xl border-t-8 border-[#FFD200]">
      <div className="mb-8 text-center">
         <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-600">
           <Lock size={32} className="text-[#FFD200]" />
         </div>
         <h1 className="text-2xl font-black text-white">Employee Access</h1>
         <p className="text-gray-400 text-sm">Authorized Personnel Only</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Employee ID</label>
          <input 
            type="text" 
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white focus:border-[#007041] outline-none transition"
            placeholder="e.g. EMP-001"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white focus:border-[#007041] outline-none transition"
            placeholder="••••••••"
          />
        </div>
        
        {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#007041] text-white py-4 rounded-xl font-bold text-lg hover:bg-green-800 transition shadow-lg mt-6 flex items-center justify-center gap-2"
        >
          {loading ? 'Verifying...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

const UnifiedLoginView: React.FC<{
  onCustomerLogin: (phone: string, name: string) => void;
  onEmployeeLogin: (emp: Employee) => void;
}> = ({ onCustomerLogin, onEmployeeLogin }) => {
  const [mode, setMode] = useState<'CUSTOMER' | 'EMPLOYEE'>('CUSTOMER');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`h-screen flex flex-col relative overflow-hidden ${mode === 'EMPLOYEE' ? 'bg-gray-900' : 'bg-gray-50'}`}>
       
       {/* Sidebar Overlay */}
       {sidebarOpen && (
         <div 
           className="absolute inset-0 bg-black/50 z-40 backdrop-blur-sm animate-in fade-in" 
           onClick={() => setSidebarOpen(false)} 
         />
       )}
       
       {/* Sidebar Drawer */}
       <div className={`absolute top-0 bottom-0 left-0 w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 bg-[#007041] text-white h-40 flex flex-col justify-end relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <ShoppingCart size={120} />
            </div>
            <h2 className="text-2xl font-black">Login Menu</h2>
            <p className="text-green-100 text-xs font-medium">Select your portal</p>
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="p-4 space-y-3 mt-4">
            <button onClick={() => { setMode('CUSTOMER'); setSidebarOpen(false); }} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${mode === 'CUSTOMER' ? 'bg-green-50 text-[#007041] shadow-sm border border-green-100 ring-2 ring-green-500/20' : 'text-gray-500 hover:bg-gray-50'}`}>
               <div className={`p-2 rounded-xl ${mode === 'CUSTOMER' ? 'bg-white' : 'bg-gray-100'}`}><UserIcon size={20} /></div>
               <div className="text-left">
                  <span className="block font-black text-sm">Customer Login</span>
                  <span className="block text-[10px] opacity-70">For Shoppers</span>
               </div>
               {mode === 'CUSTOMER' && <CheckCircle2 size={16} className="ml-auto" />}
            </button>
            <button onClick={() => { setMode('EMPLOYEE'); setSidebarOpen(false); }} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${mode === 'EMPLOYEE' ? 'bg-gray-800 text-[#FFD200] shadow-sm border border-gray-700 ring-2 ring-yellow-500/20' : 'text-gray-500 hover:bg-gray-50'}`}>
               <div className={`p-2 rounded-xl ${mode === 'EMPLOYEE' ? 'bg-gray-700' : 'bg-gray-100'}`}><Lock size={20} /></div>
               <div className="text-left">
                  <span className="block font-black text-sm">Employee Login</span>
                  <span className="block text-[10px] opacity-70">For Staff Only</span>
               </div>
               {mode === 'EMPLOYEE' && <CheckCircle2 size={16} className="ml-auto" />}
            </button>
          </div>
          <div className="absolute bottom-6 left-0 w-full text-center">
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ScanGo v1.2</p>
          </div>
       </div>

       {/* Header Toggle */}
       <div className="absolute top-4 left-4 z-30">
          <button onClick={() => setSidebarOpen(true)} className={`p-3 rounded-full shadow-lg transition-colors ${mode === 'EMPLOYEE' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
             <Menu size={24} />
          </button>
       </div>

       {/* Main Content Area */}
       <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-y-auto">
          <div className="w-full flex justify-center animate-in slide-in-from-bottom-4 duration-500 fade-in">
            {mode === 'CUSTOMER' ? (
               <CustomerLoginForm onSuccess={onCustomerLogin} />
            ) : (
               <EmployeeLoginForm onSuccess={onEmployeeLogin} />
            )}
          </div>
       </div>
    </div>
  );
};

interface StoreSelectViewProps {
  onSelectStore: (store: Store) => void;
  onError: (msg: string) => void;
  setProcessing: (loading: boolean) => void;
  isProcessing: boolean;
}

const StoreSelectView: React.FC<StoreSelectViewProps> = ({ onSelectStore, onError, setProcessing, isProcessing }) => {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    storeApi.getStores().then(setStores);
  }, []);

  const detectLocation = async () => {
    setProcessing(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
         const nearest = await storeApi.getNearestStore(position.coords.latitude, position.coords.longitude);
         onSelectStore(nearest);
         setProcessing(false);
      }, () => {
         onError("Location Denied. Select manually.");
         setProcessing(false);
      });
    } else {
      onError("Geolocation not supported");
      setProcessing(false);
    }
  };

  return (
     <div className="h-full flex flex-col bg-gray-50">
        <div className="bg-white p-6 pb-4 shadow-sm z-10">
          <h1 className="text-2xl font-black text-[#007041]">Select Store</h1>
          <p className="text-gray-400 text-sm font-medium">Choose where you are shopping today</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
           <button 
             onClick={detectLocation}
             className="w-full bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-4 mb-4 text-blue-700 active:scale-95 transition"
           >
              <div className="bg-white p-2 rounded-full shadow-sm"><Navigation size={20} className="text-blue-600" /></div>
              <div className="text-left flex-1">
                <h3 className="font-black text-sm">Use Current Location</h3>
                <p className="text-xs opacity-70">Detect nearest ScanGo</p>
              </div>
              {isProcessing && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent animate-spin rounded-full"></div>}
           </button>

           <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Nearby Stores</h4>
           
           {stores.map(store => (
             <button 
               key={store.id}
               onClick={() => onSelectStore(store)}
               className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-[#007041] transition active:scale-[0.98]"
             >
               <div className="bg-gray-100 p-3 rounded-xl text-gray-500"><MapPin size={20} /></div>
               <div className="text-left flex-1">
                 <h3 className="font-bold text-gray-800">{store.name}</h3>
                 <p className="text-xs text-gray-400">{store.address}</p>
                 {store.id === 'store-002' && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 rounded font-black mt-1 inline-block">PREMIUM</span>}
                 {store.id === 'store-003' && <span className="text-[9px] bg-green-100 text-green-600 px-1.5 rounded font-black mt-1 inline-block">WHOLESALE</span>}
               </div>
               <ChevronLeft size={16} className="rotate-180 text-gray-300" />
             </button>
           ))}
        </div>
     </div>
  );
};

const HomeView: React.FC<{ 
  user: User | null; 
  store: Store | null; 
  onChangeScreen: (s: Screen) => void;
  onLogout: () => void;
}> = ({ user, store, onChangeScreen, onLogout }) => (
  <div className="p-6 flex flex-col items-center justify-center h-full relative">
    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start">
      <div className="flex flex-col items-start">
         <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Hello,</span>
         <span className="text-lg font-black text-gray-800">{user?.name || user?.phoneNumber || 'Guest'}</span>
      </div>
      <button onClick={() => onChangeScreen('STORE_SELECT')} className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
         <MapPin size={12} className="text-[#007041]" />
         <span className="text-[10px] font-bold text-gray-600 max-w-[100px] truncate">{store?.name || 'Select Store'}</span>
      </button>
    </div>

    <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full border-b-8 border-[#007041] mt-12">
      <div className="flex justify-center mb-6">
         {/* Using stored logo URL */}
         <img src={LOGO_URL} alt="ScanGo Logo" className="h-20 object-contain" />
      </div>
      <p className="text-gray-500 mb-8 font-medium">Verify your items at the door with a digital invoice.</p>
      <button 
        onClick={() => onChangeScreen('SCANNER')}
        className="w-full bg-[#007041] text-white py-4 rounded-xl font-bold text-lg hover:bg-green-800 transition shadow-lg flex items-center justify-center gap-2"
      >
        <Camera size={24} /> Start Shopping
      </button>
    </div>
    
    <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
      <button onClick={() => onChangeScreen('HISTORY')} className="bg-white p-4 rounded-2xl shadow border border-gray-100 flex flex-col items-center gap-2">
        <Receipt size={24} className="text-gray-600" />
        <span className="text-xs font-semibold">Past Orders</span>
      </button>
      {/* Employee Login Button Removed: Now in Sidebar on Login Screen */}
      <button onClick={() => onChangeScreen('DOCS')} className="bg-white p-4 rounded-2xl shadow border border-gray-100 flex flex-col items-center gap-2">
        <LayoutDashboard size={24} className="text-purple-600" />
        <span className="text-xs font-semibold">System Docs</span>
      </button>
    </div>
    
    <button onClick={onLogout} className="mt-auto flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-red-500 transition pt-6">
      <LogOut size={14} /> Switch Store
    </button>
  </div>
);

// ... ScannerView, CartView, PaymentView, SuccessView, HistoryView, EmployeeScannerView remain unchanged ...

const ScannerView: React.FC<{
  store: Store | null;
  onScreenChange: (s: Screen) => void;
  onScan: (code: string) => void;
  manualInput: string;
  setManualInput: (v: string) => void;
  isProcessing: boolean;
  lastScanned: Product | null;
  setLastScanned: (p: Product | null) => void;
  scanQuantity: number;
  setScanQuantity: (q: number) => void;
  addToCart: (p: Product, q: number) => void;
  cart: CartItem[];
  error: string | null;
  setError: (e: string | null) => void;
  totalAmount: number;
}> = ({
  store, onScreenChange, onScan, manualInput, setManualInput, isProcessing,
  lastScanned, setLastScanned, scanQuantity, setScanQuantity, addToCart, cart,
  error, setError, totalAmount
}) => {
  return (
    <div className="h-full flex flex-col bg-black relative">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pb-12">
        <button onClick={() => onScreenChange('HOME')} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Store</span>
          <span className="text-sm font-black text-white">{store?.name}</span>
        </div>
      </div>

      {/* Camera View - takes most of the screen */}
      <div className="flex-1 relative min-h-0">
        <BarcodeScanner onScan={onScan} variant="rectangle" />
        {isProcessing && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
             <div className="w-12 h-12 border-4 border-[#007041] border-t-transparent animate-spin rounded-full"></div>
           </div>
        )}
        {error && (
           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-xl z-40 animate-bounce">
              {error}
           </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="bg-white rounded-t-2xl p-3 pb-4 z-20 shadow-lg">
         {/* Manual Entry */}
         <div className="flex gap-2 mb-2">
            <div className="flex-1 bg-gray-100 rounded-lg flex items-center px-3 border border-gray-200 focus-within:border-[#007041] transition">
               <SearchCode size={16} className="text-gray-400" />
               <input 
                 type="text" 
                 value={manualInput}
                 onChange={(e) => setManualInput(e.target.value)}
                 placeholder="Enter barcode manually"
                 className="w-full bg-transparent p-2 outline-none text-sm font-bold text-gray-700"
               />
            </div>
            <button 
              onClick={() => { if(manualInput) { onScan(manualInput); setManualInput(''); } }}
              className="bg-gray-800 text-white p-2 rounded-lg font-bold"
            >
              <ArrowRight size={20} />
            </button>
         </div>

         {/* Cart Summary Button */}
         <button 
           onClick={() => onScreenChange('CART')}
           className="w-full bg-[#007041] text-white p-2.5 rounded-xl flex items-center justify-between group active:scale-[0.98] transition"
         >
            <div className="flex items-center gap-2">
               <div className="bg-white/20 p-1.5 rounded-lg relative">
                  <ShoppingCart size={18} />
                  {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{cart.reduce((a,c) => a + c.quantity, 0)}</span>}
               </div>
               <div className="text-left">
                  <span className="block text-[10px] text-green-100 font-medium">Total Bill</span>
                  <span className="block text-base font-black">₹{totalAmount.toFixed(2)}</span>
               </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold bg-white/10 px-2 py-1 rounded-lg group-hover:bg-white/20 transition">
               View Cart <ChevronLeft size={14} className="rotate-180" />
            </div>
         </button>
      </div>

      {/* Product Scanned Modal */}
      {lastScanned && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in slide-in-from-bottom-10">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10">
             <div className="flex gap-4 mb-6">
                <img src={lastScanned.imageUrl} alt={lastScanned.name} className="w-24 h-24 rounded-xl object-cover bg-gray-100" />
                <div className="flex-1">
                   <h3 className="font-bold text-lg text-gray-800 leading-tight mb-1">{lastScanned.name}</h3>
                   <p className="text-xs text-gray-500 mb-2">{lastScanned.brand} • {lastScanned.weight}</p>
                   <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#007041]">₹{lastScanned.price}</span>
                      {lastScanned.discount > 0 && (
                        <>
                           <span className="text-sm text-gray-400 line-through">₹{lastScanned.mrp}</span>
                           <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                             {Math.round((lastScanned.discount / lastScanned.mrp) * 100)}% OFF
                           </span>
                        </>
                      )}
                   </div>
                </div>
             </div>

             <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <span className="text-sm font-bold text-gray-500">Quantity</span>
                <div className="flex items-center gap-6">
                   <button onClick={() => setScanQuantity(Math.max(1, scanQuantity - 1))} className="w-10 h-10 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center text-gray-600 active:bg-gray-100">
                      <Minus size={20} />
                   </button>
                   <span className="text-2xl font-black w-8 text-center">{scanQuantity}</span>
                   <button onClick={() => setScanQuantity(scanQuantity + 1)} className="w-10 h-10 rounded-full bg-[#007041] shadow text-white flex items-center justify-center active:bg-green-800">
                      <Plus size={20} />
                   </button>
                </div>
             </div>

             <div className="flex gap-3">
                <button 
                  onClick={() => setLastScanned(null)}
                  className="flex-1 py-4 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition"
                >
                   Cancel
                </button>
                <button 
                  onClick={() => addToCart(lastScanned, scanQuantity)}
                  className="flex-[2] py-4 rounded-xl font-bold text-white bg-[#007041] hover:bg-green-800 shadow-lg shadow-green-900/20 transition"
                >
                   Add to Cart
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CartView: React.FC<{
  cart: CartItem[];
  updateQuantity: (id: string, d: number) => void;
  onScreenChange: (s: Screen) => void;
  totalAmount: number;
  totalSavings: number;
}> = ({ cart, updateQuantity, onScreenChange, totalAmount, totalSavings }) => {
   return (
      <div className="h-full flex flex-col bg-gray-50">
         <div className="bg-white p-6 shadow-sm z-10 sticky top-0">
            <div className="flex items-center gap-4">
               <button onClick={() => onScreenChange('SCANNER')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
                  <ChevronLeft size={24} />
               </button>
               <h1 className="text-xl font-black text-gray-800">Your Cart <span className="text-gray-400 font-medium text-sm">({cart.length} items)</span></h1>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-50 pb-20">
                  <ShoppingCart size={64} className="mb-4 text-gray-300" />
                  <p className="font-bold text-gray-400">Your cart is empty</p>
                  <button onClick={() => onScreenChange('SCANNER')} className="mt-4 text-[#007041] font-bold text-sm uppercase tracking-widest">Start Scanning</button>
               </div>
            ) : (
               cart.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                     <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-gray-50" />
                     <div className="flex-1">
                        <h3 className="font-bold text-sm text-gray-800 line-clamp-2">{item.name}</h3>
                        <p className="text-[10px] text-gray-400 mb-2">{item.weight}</p>
                        <div className="flex justify-between items-end">
                           <div className="text-sm font-black text-[#007041]">₹{item.price * item.quantity}</div>
                           <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                              <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white shadow-sm rounded text-gray-600"><Minus size={14} /></button>
                              <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white shadow-sm rounded text-green-600"><Plus size={14} /></button>
                           </div>
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>

         {cart.length > 0 && (
            <div className="bg-white p-6 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
               <div className="space-y-2 mb-6 text-sm">
                  <div className="flex justify-between text-gray-500">
                     <span>MRP Total</span>
                     <span>₹{(totalAmount + totalSavings).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-bold">
                     <span>Savings</span>
                     <span>- ₹{totalSavings.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-100 my-2 pt-2 flex justify-between text-lg font-black text-gray-900">
                     <span>To Pay</span>
                     <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
               </div>
               <button 
                  onClick={() => onScreenChange('PAYMENT')}
                  className="w-full bg-[#007041] text-white py-4 rounded-xl font-bold text-lg hover:bg-green-800 transition shadow-lg flex items-center justify-center gap-2"
               >
                  Proceed to Pay <ArrowRight size={20} />
               </button>
            </div>
         )}
      </div>
   );
};

const PaymentView: React.FC<{
  onScreenChange: (s: Screen) => void;
  totalAmount: number;
  handleCheckout: (m: PaymentMethod) => void;
  isProcessing: boolean;
}> = ({ onScreenChange, totalAmount, handleCheckout, isProcessing }) => {
   const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.UPI);

   return (
      <div className="h-full flex flex-col bg-gray-50">
         <div className="bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
               <button onClick={() => onScreenChange('CART')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
                  <ChevronLeft size={24} />
               </button>
               <h1 className="text-xl font-black text-gray-800">Checkout</h1>
            </div>
         </div>
         
         <div className="p-6 flex-1">
            <div className="bg-[#007041] text-white p-6 rounded-2xl shadow-lg mb-8 text-center">
               <p className="text-green-100 text-sm font-medium mb-1">Total Payable Amount</p>
               <h2 className="text-4xl font-black">₹{totalAmount.toFixed(2)}</h2>
            </div>

            <h3 className="font-bold text-gray-800 mb-4 px-1">Select Payment Method</h3>
            <div className="space-y-3">
               {[
                  { id: PaymentMethod.UPI, label: 'UPI / QR Code', icon: <QrCode size={20} /> },
                  { id: PaymentMethod.CARD, label: 'Credit / Debit Card', icon: <CreditCard size={20} /> },
                  { id: PaymentMethod.CASH, label: 'Pay Cash at Counter', icon: <Banknote size={20} /> },
               ].map((opt) => (
                  <button 
                    key={opt.id}
                    onClick={() => setMethod(opt.id)}
                    className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${method === opt.id ? 'border-[#007041] bg-green-50 text-[#007041] ring-1 ring-[#007041]' : 'border-gray-200 bg-white text-gray-600'}`}
                  >
                     <div className={`p-2 rounded-lg ${method === opt.id ? 'bg-white' : 'bg-gray-100'}`}>{opt.icon}</div>
                     <span className="font-bold">{opt.label}</span>
                     {method === opt.id && <CheckCircle2 size={20} className="ml-auto" />}
                  </button>
               ))}
            </div>
         </div>

         <div className="p-6 bg-white border-t border-gray-100">
            <button 
               onClick={() => handleCheckout(method)}
               disabled={isProcessing}
               className="w-full bg-[#007041] text-white py-4 rounded-xl font-bold text-lg hover:bg-green-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
               {isProcessing ? 'Processing...' : `Pay ₹${totalAmount.toFixed(2)}`}
            </button>
         </div>
      </div>
   );
};

const SuccessView: React.FC<{
   currentOrder: Order | null;
   selectedStore: Store | null;
   onFinish: () => void;
}> = ({ currentOrder, selectedStore, onFinish }) => {
   if (!currentOrder) return null;

   return (
      <div className="h-full bg-[#007041] text-white p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
         {/* Confetti / Decoration Background */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-yellow-400 rounded-full blur-3xl"></div>
         </div>

         <div className="bg-white text-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm relative z-10 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
               <CheckCircle2 size={32} />
            </div>
            <h1 className="text-2xl font-black mb-1">Order Placed!</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">{currentOrder.receiptNumber}</p>

            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 mb-6 flex flex-col items-center justify-center">
               <QRCodeSVG value={currentOrder.qrPayload} size={160} />
               <p className="text-[10px] text-gray-400 mt-4 font-medium text-center max-w-[200px]">
                  Show this QR at the exit gate for verification.
               </p>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-4 mb-2">
               <span className="text-gray-500">Amount Paid</span>
               <span className="font-black text-lg">₹{currentOrder.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-6">
               <span className="text-gray-500">Items</span>
               <span className="font-bold">{currentOrder.items.length}</span>
            </div>

            <button onClick={onFinish} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold shadow hover:bg-black transition">
               Done
            </button>
         </div>
         
         <p className="mt-8 text-green-200 text-xs font-medium max-w-xs leading-relaxed">
            A copy of this receipt has been saved to your history.
         </p>
      </div>
   );
};

const HistoryView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
   const [orders, setOrders] = useState<Order[]>([]);
   
   useEffect(() => {
      setOrders(historyApi.getOrders());
   }, []);

   return (
      <div className="h-full flex flex-col bg-gray-50">
         <div className="bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
               <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
                  <ChevronLeft size={24} />
               </button>
               <h1 className="text-xl font-black text-gray-800">Past Orders</h1>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {orders.length === 0 ? (
               <div className="text-center text-gray-400 mt-20">No history found.</div>
            ) : (
               orders.map(order => (
                  <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <div className="font-black text-gray-800 text-lg">₹{order.totalAmount}</div>
                           <div className="text-xs text-gray-400">{new Date(order.timestamp).toLocaleDateString()} • {new Date(order.timestamp).toLocaleTimeString()}</div>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${order.status === 'PAID' || order.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                           {order.status}
                        </span>
                     </div>
                     <div className="border-t border-gray-50 pt-3">
                        <p className="text-xs text-gray-500 mb-2 font-medium">{order.storeName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                           <Receipt size={12} /> {order.receiptNumber}
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>
   );
};

const EmployeeScannerView: React.FC<{
   mode: EmployeeMode;
   onBack: () => void;
}> = ({ mode, onBack }) => {
   const [scannedData, setScannedData] = useState<string | null>(null);
   const [statusMsg, setStatusMsg] = useState<{ type: 'success'|'error'|'info', text: string } | null>(null);
   const [receiptDetails, setReceiptDetails] = useState<SQL_ReceiptStatus | null>(null);
   const [processing, setProcessing] = useState(false);

   const handleScan = async (code: string) => {
      if (processing) return;
      setProcessing(true);
      setScannedData(code);
      setStatusMsg({ type: 'info', text: 'Fetching Receipt...' });

      try {
         // Parse QR Payload
         let lookupId = code;
         try {
            const parsed = JSON.parse(code);
            // Priority 1: Use receipt number directly from QR code (for production)
            if (parsed.receipt) {
               lookupId = parsed.receipt;
            } 
            // Priority 2: Use order ID and try to find in local history (for development)
            else if (parsed.id) {
               lookupId = parsed.id;
            const localHistory = historyApi.getOrders();
            const order = localHistory.find(o => o.id === lookupId);
            if (order) {
               lookupId = order.receiptNumber;
               }
            }
         } catch (e) {
            // Not JSON, use code as-is (might be receipt number directly)
         }

         const receipt = await cashierApi.getReceiptStatus(lookupId);
         
         if (receipt) {
            setReceiptDetails(receipt);
            if (mode === 'CASHIER') {
               if (receipt.payment_status === OrderStatus.PAID || receipt.payment_status === OrderStatus.VERIFIED) {
                  setStatusMsg({ type: 'success', text: 'Already Paid' });
               } else {
                  setStatusMsg({ type: 'info', text: `Collect ₹${receipt.total_amount}` });
               }
            } else {
               // GUARD - Check exit verification first
               if (receipt.exit_verification) {
                  // Bill has already been used for exit verification
                  setStatusMsg({ type: 'error', text: 'Bill Already Used! Cannot verify again.' });
               } else if (receipt.payment_status === OrderStatus.PAID || receipt.payment_status === OrderStatus.VERIFIED) {
                  // Payment is complete, allow exit and mark as verified
                   setStatusMsg({ type: 'success', text: 'Verified: Allowed to Exit' });
                  // Update exit_verification to true to prevent reuse
                  await cashierApi.updateExitVerification(receipt.receipt_number);
                  // Update local state to reflect the change
                  setReceiptDetails({ ...receipt, exit_verification: true });
               } else {
                   setStatusMsg({ type: 'error', text: 'Payment Pending! STOP.' });
               }
            }
         } else {
            setStatusMsg({ type: 'error', text: 'Receipt Not Found' });
            setReceiptDetails(null);
         }
      } catch (e) {
         setStatusMsg({ type: 'error', text: 'Scan Error' });
      } finally {
         setProcessing(false);
      }
   };

   const markAsPaid = async () => {
      if (!receiptDetails) return;
      setProcessing(true);
      const success = await cashierApi.updatePaymentStatus(receiptDetails.receipt_number, OrderStatus.PAID);
      if (success) {
         setReceiptDetails({ ...receiptDetails, payment_status: OrderStatus.PAID });
         setStatusMsg({ type: 'success', text: 'Payment Recorded' });
      } else {
         setStatusMsg({ type: 'error', text: 'Update Failed' });
      }
      setProcessing(false);
   };

   return (
      <div className="h-full flex flex-col bg-gray-900 text-white">
         <div className="p-4 flex items-center justify-between bg-gray-800 shadow-md z-10">
            <button onClick={onBack} className="p-2 bg-gray-700 rounded-full">
               <ChevronLeft size={24} />
            </button>
            <div className="text-right">
               <h2 className="font-bold text-lg">{mode === 'CASHIER' ? 'Cashier Terminal' : 'Security Gate'}</h2>
               <p className="text-xs text-gray-400">Scan Customer QR</p>
            </div>
         </div>

         <div className="flex-1 relative flex flex-col">
            <div className="h-1/2 relative bg-black">
               <BarcodeScanner onScan={handleScan} variant="square" />
               <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 px-4 py-1 rounded-full text-xs font-mono">
                  {processing ? 'Processing...' : 'Ready to Scan'}
               </div>
            </div>

            <div className="flex-1 bg-gray-800 p-6 rounded-t-3xl -mt-6 z-20 shadow-2xl">
               {statusMsg && (
                  <div className={`p-4 rounded-xl mb-6 text-center font-bold text-lg ${
                     statusMsg.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
                     statusMsg.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 
                     'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                  }`}>
                     {statusMsg.text}
                  </div>
               )}

               {receiptDetails && (
                  <div className="space-y-4">
                     <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Receipt #</span>
                        <span className="font-mono">{receiptDetails.receipt_number}</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Amount</span>
                        <span className="font-black text-xl">₹{receiptDetails.total_amount}</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Status</span>
                        <span className={`font-bold ${receiptDetails.payment_status === 'PENDING' ? 'text-yellow-500' : 'text-green-500'}`}>
                           {receiptDetails.payment_status}
                        </span>
                     </div>
                     {mode === 'GUARD' && (
                        <div className="flex justify-between border-b border-gray-700 pb-2">
                           <span className="text-gray-400">Exit Verified</span>
                           <span className={`font-bold ${receiptDetails.exit_verification ? 'text-red-500' : 'text-green-500'}`}>
                              {receiptDetails.exit_verification ? 'Yes (Used)' : 'No'}
                           </span>
                        </div>
                     )}

                     {mode === 'CASHIER' && receiptDetails.payment_status === 'PENDING' && (
                        <button 
                           onClick={markAsPaid}
                           disabled={processing}
                           className="w-full bg-[#007041] text-white py-4 rounded-xl font-bold text-lg hover:bg-green-800 transition shadow-lg mt-4"
                        >
                           Confirm Cash Payment
                        </button>
                     )}
                     
                     <button 
                        onClick={() => { setReceiptDetails(null); setStatusMsg(null); }}
                        className="w-full bg-gray-700 text-white py-3 rounded-xl font-bold mt-2"
                     >
                        Scan Next
                     </button>
                  </div>
               )}
               
               {!receiptDetails && !processing && (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                     <QrCode size={48} className="mb-2" />
                     <p>Waiting for scan...</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

const EmployeeHomeView: React.FC<{
  employee: Employee | null;
  onSelectMode: (mode: EmployeeMode) => void;
  onBack: () => void;
}> = ({ employee, onSelectMode, onBack }) => {
  if (!employee) return null;

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Dashboard</h1>
          <p className="text-gray-400 text-sm">Welcome, {employee.name}</p>
        </div>
        <button onClick={onBack} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
          <LogOut size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => onSelectMode('CASHIER')}
          className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex items-center gap-4 hover:border-[#007041] hover:bg-gray-800/80 transition group"
        >
          <div className="bg-[#007041] p-4 rounded-xl text-white shadow-lg group-hover:scale-110 transition">
            <Banknote size={32} />
          </div>
          <div className="text-left flex-1">
            <h3 className="font-bold text-lg">Cashier Mode</h3>
            <p className="text-xs text-gray-400">Process payments for pending receipts</p>
          </div>
          <ChevronLeft size={24} className="rotate-180 text-gray-500 group-hover:text-white" />
        </button>

        <button
          onClick={() => onSelectMode('GUARD')}
          className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex items-center gap-4 hover:border-[#FFD200] hover:bg-gray-800/80 transition group"
        >
          <div className="bg-[#FFD200] p-4 rounded-xl text-black shadow-lg group-hover:scale-110 transition">
            <ShieldCheck size={32} />
          </div>
          <div className="text-left flex-1">
            <h3 className="font-bold text-lg">Guard Mode</h3>
            <p className="text-xs text-gray-400">Verify exit QR codes at the gate</p>
          </div>
          <ChevronLeft size={24} className="rotate-180 text-gray-500 group-hover:text-white" />
        </button>
      </div>

      <div className="mt-auto bg-gray-800 p-4 rounded-xl border border-gray-700">
        <div className="flex items-center gap-3 mb-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Status</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center">
           <div className="bg-gray-900 p-3 rounded-lg">
              <span className="block text-xl font-black text-white">Online</span>
              <span className="text-[10px] text-gray-500">Database</span>
           </div>
           <div className="bg-gray-900 p-3 rounded-lg">
              <span className="block text-xl font-black text-[#007041]">v1.2</span>
              <span className="text-[10px] text-gray-500">Version</span>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('LOGIN'); // Start at LOGIN
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [scanQuantity, setScanQuantity] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [employeeMode, setEmployeeMode] = useState<EmployeeMode>('CASHIER');
  
  // Store State & User State
  const [user, setUser] = useState<User | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  
  // Employee Auth State
  const [loggedInEmployee, setLoggedInEmployee] = useState<Employee | null>(null);

  const lastScanTime = useRef<number>(0);

  const addToCart = useCallback((product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity: quantity }];
    });
    setLastScanned(null);
    setScanQuantity(1);
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  }, []);

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalSavings = cart.reduce((acc, item) => acc + ((item.mrp - item.price) * item.quantity), 0);

  const handleScan = useCallback(async (barcode: string) => {
    const now = Date.now();
    if (now - lastScanTime.current < 2500) return;
    
    // Check if store is selected (should be, given flow, but safety check)
    if (!selectedStore) {
      setError("Please select a store first.");
      return;
    }

    lastScanTime.current = now;
    setIsProcessing(true);
    setError(null);
    try {
      // Pass the selectedStore.id to the API to get store-specific pricing
      const product = await productApi.fetchByBarcode(barcode, selectedStore.id);
      if (product) {
        setLastScanned(product);
        setScanQuantity(1); 
      } else {
        setError(`Not Found: [${barcode}]`);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Syncing Error...");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedStore]);

  const handleCheckout = useCallback(async (method: PaymentMethod) => {
    if (!selectedStore) return;
    setIsProcessing(true);
    setError(null);
    try {
      const order = await checkoutApi.createOrder(cart, method, selectedStore.name);
      setCurrentOrder(order);
      setCurrentScreen('SUCCESS');
    } catch (err) {
      setError("Payment Processing Error.");
    } finally {
      setIsProcessing(false);
    }
  }, [cart, selectedStore]);

  const handleStoreSelect = useCallback((s: Store) => {
    setSelectedStore(s);
    // Reset cart when switching stores to avoid price discrepancies
    setCart([]); 
    setCurrentScreen('HOME');
  }, []);

  const handleLoginSuccess = (phone: string, name: string) => {
    setUser({ id: `user-${phone}`, phoneNumber: phone, name: name });
    setCurrentScreen('STORE_SELECT');
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen shadow-2xl relative overflow-hidden font-sans">
      
      {currentScreen === 'LOGIN' && (
        <UnifiedLoginView 
          onCustomerLogin={handleLoginSuccess}
          onEmployeeLogin={(emp) => {
            setLoggedInEmployee(emp);
            setCurrentScreen('EMPLOYEE_HOME');
          }}
        />
      )}

      {currentScreen === 'STORE_SELECT' && (
        <StoreSelectView 
          onSelectStore={handleStoreSelect} 
          onError={setError} 
          setProcessing={setIsProcessing} 
          isProcessing={isProcessing} 
        />
      )}
      
      {currentScreen === 'HOME' && (
        <HomeView 
          user={user} 
          store={selectedStore} 
          onChangeScreen={setCurrentScreen} 
          onLogout={() => { setSelectedStore(null); setCurrentScreen('STORE_SELECT'); }} 
        />
      )}
      
      {currentScreen === 'HISTORY' && (
        <HistoryView onBack={() => setCurrentScreen('HOME')} />
      )}

      {currentScreen === 'SCANNER' && (
        <ScannerView 
          store={selectedStore}
          onScreenChange={setCurrentScreen}
          onScan={handleScan}
          manualInput={manualInput}
          setManualInput={setManualInput}
          isProcessing={isProcessing}
          lastScanned={lastScanned}
          setLastScanned={setLastScanned}
          scanQuantity={scanQuantity}
          setScanQuantity={setScanQuantity}
          addToCart={addToCart}
          cart={cart}
          error={error}
          setError={setError}
          totalAmount={totalAmount}
        />
      )}
      
      {currentScreen === 'CART' && (
        <CartView 
          cart={cart} 
          updateQuantity={updateQuantity} 
          onScreenChange={setCurrentScreen} 
          totalAmount={totalAmount}
          totalSavings={totalSavings}
        />
      )}
      
      {currentScreen === 'PAYMENT' && (
        <PaymentView 
          onScreenChange={setCurrentScreen} 
          totalAmount={totalAmount} 
          handleCheckout={handleCheckout} 
          isProcessing={isProcessing} 
        />
      )}
      
      {currentScreen === 'SUCCESS' && (
        <SuccessView 
          currentOrder={currentOrder} 
          selectedStore={selectedStore} 
          onFinish={() => { setCurrentOrder(null); setCart([]); setCurrentScreen('HOME'); }} 
        />
      )}
      
      {currentScreen === 'EMPLOYEE_LOGIN' && (
        <UnifiedLoginView 
          onCustomerLogin={handleLoginSuccess}
          onEmployeeLogin={(emp) => {
             setLoggedInEmployee(emp);
             setCurrentScreen('EMPLOYEE_HOME');
          }}
        />
      )}

      {currentScreen === 'EMPLOYEE_HOME' && (
        <EmployeeHomeView 
          employee={loggedInEmployee}
          onSelectMode={(mode) => {
            setEmployeeMode(mode);
            setCurrentScreen('EMPLOYEE_ACTION');
          }}
          onBack={() => {
            setLoggedInEmployee(null);
            setCurrentScreen('LOGIN');
          }} 
        />
      )}

      {currentScreen === 'EMPLOYEE_ACTION' && (
         <EmployeeScannerView 
            mode={employeeMode}
            onBack={() => setCurrentScreen('EMPLOYEE_HOME')}
         />
      )}
      
      {currentScreen === 'DOCS' && (<div className="p-6 h-screen overflow-y-auto bg-white"><button onClick={() => setCurrentScreen('HOME')} className="mb-4 text-xs font-black uppercase flex items-center gap-2 text-gray-400 tracking-widest"><ChevronLeft size={16} /> Exit System Docs</button><SystemArchitecture /></div>)}
    </div>
  );
};

export default App;