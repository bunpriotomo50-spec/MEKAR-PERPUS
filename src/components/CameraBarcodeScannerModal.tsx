import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Volume2,
  Flashlight,
  SwitchCamera,
  ScanBarcode,
  BookOpen,
  User,
  Info,
} from 'lucide-react';

export const playBarcodeBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // 1760 Hz (A6)
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch {
    // Ignore audio context block
  }
};

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  subtitle?: string;
  autoCloseOnSuccess?: boolean;
  lastScannedInfo?: {
    type: 'book' | 'member' | 'unknown';
    title: string;
    code: string;
    detail?: string;
    success: boolean;
  } | null;
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Pemindai Barcode Kamera',
  subtitle = 'Arahkan kamera ke barcode buku atau kartu anggota',
  autoCloseOnSuccess = false,
  lastScannedInfo = null,
}) => {
  const scannerContainerId = 'html5-camera-barcode-reader';
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);

  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [scanCooldown, setScanCooldown] = useState(false);
  const [keepScanning, setKeepScanning] = useState(!autoCloseOnSuccess);
  const [manualCode, setManualCode] = useState('');

  // Enumerate cameras and start scanning
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setIsInitializing(true);
    setCameraError(null);

    const initScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!mounted) return;

        if (!devices || devices.length === 0) {
          setCameraError('Tidak ada kamera yang terdeteksi pada perangkat Anda.');
          setIsInitializing(false);
          return;
        }

        setCameras(devices);

        // Prefer back / environment camera if available
        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
        );
        const initialCameraId = backCamera ? backCamera.id : devices[0].id;
        setSelectedCameraId(initialCameraId);

        await startCamera(initialCameraId);
      } catch (err: any) {
        if (!mounted) return;
        console.warn('Camera access error:', err);
        if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
          setCameraError(
            'Izin akses kamera ditolak. Harap izinkan akses kamera di pengaturan peramban (browser) Anda untuk memindai barcode.'
          );
        } else {
          setCameraError(
            err?.message || 'Gagal menginisialisasi kamera. Pastikan kamera tidak digunakan aplikasi lain.'
          );
        }
        setIsInitializing(false);
      }
    };

    initScanner();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async (cameraId: string) => {
    stopCamera();
    setIsInitializing(true);
    setCameraError(null);

    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODABAR,
        ],
        verbose: false,
      });

      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 300, height: 180 },
        aspectRatio: 1.33333,
      };

      await html5QrCode.start(
        cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'environment' },
        config,
        (decodedText: string) => {
          handleDetectedCode(decodedText);
        },
        () => {
          // Frame error (no barcode found in frame) - ignore
        }
      );

      isRunningRef.current = true;
      setIsInitializing(false);

      // Check torch capability
      try {
        const capabilities = (html5QrCode as any).getRunningTrackCapabilities?.();
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn('Start camera failed:', err);
      setCameraError(
        err?.message || 'Gagal memulai streaming kamera. Periksa izin kamera pada peramban Anda.'
      );
      setIsInitializing(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isRunningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        isRunningRef.current = false;
      } catch (err) {
        console.warn('Error stopping camera:', err);
      }
    }
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextState = !isTorchOn;
      await (html5QrCodeRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Failed to toggle torch:', err);
    }
  };

  const handleCameraChange = async (newCameraId: string) => {
    setSelectedCameraId(newCameraId);
    await startCamera(newCameraId);
  };

  const handleDetectedCode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || scanCooldown) return;

    // Beep sound
    playBarcodeBeep();

    // Trigger callback
    onScanSuccess(trimmed);

    // Set cooldown to prevent double-firing in rapid succession
    setScanCooldown(true);
    setTimeout(() => {
      setScanCooldown(false);
    }, 1800);

    if (!keepScanning) {
      stopCamera();
      onClose();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDetectedCode(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-xl text-white">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="font-black text-sm text-white tracking-tight flex items-center gap-2">
                <span>{title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Scanner
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup Pemindai"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
          {/* HTML5 QR Code Mount Element */}
          <div
            id={scannerContainerId}
            className="w-full max-h-[360px] overflow-hidden"
            style={{ width: '100%' }}
          />

          {/* Initializing / Loading Indicator */}
          {isInitializing && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-white gap-3 p-4">
              <RefreshCw size={28} className="animate-spin text-emerald-400" />
              <p className="text-xs font-semibold">Mengaktifkan kamera perangkat...</p>
              <p className="text-[10px] text-slate-400 text-center max-w-xs">
                Izinkan akses kamera jika browser Anda memunculkan dialog perizinan.
              </p>
            </div>
          )}

          {/* Error Message */}
          {cameraError && !isInitializing && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center text-white gap-3 p-6 text-center">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30">
                <AlertCircle size={28} />
              </div>
              <h4 className="font-bold text-sm text-rose-300">Akses Kamera Bermasalah</h4>
              <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
              <button
                onClick={() => selectedCameraId && startCamera(selectedCameraId)}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RefreshCw size={14} />
                <span>Coba Lagi</span>
              </button>
            </div>
          )}

          {/* Laser Scanning Overlay (Active when running and no error) */}
          {!isInitializing && !cameraError && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {/* Scan Box Frame */}
              <div className="relative w-[80%] max-w-[320px] h-[190px] rounded-xl border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                {/* 4 Corner Accents */}
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-300 rounded-tl" />
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-300 rounded-tr" />
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-300 rounded-bl" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-300 rounded-br" />

                {/* Animated Laser Bar */}
                <div className="absolute inset-x-2 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-bounce" />

                <div className="absolute inset-x-0 bottom-2 text-center">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/60 text-emerald-300 text-[10px] font-bold tracking-wide backdrop-blur-xs">
                    Posisikan Barcode di Sini
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Floating Controls over Video (Camera switcher, Torch, Cooldown indicator) */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
            {cameras.length > 1 ? (
              <select
                value={selectedCameraId}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="text-[11px] font-semibold bg-slate-900/85 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 backdrop-blur-xs max-w-[200px] truncate cursor-pointer shadow-sm"
              >
                {cameras.map((c, i) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Kamera ${i + 1}`}
                  </option>
                ))}
              </select>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-1.5">
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-1.5 rounded-lg text-xs font-bold backdrop-blur-xs transition-colors flex items-center gap-1 shadow-sm cursor-pointer ${
                    isTorchOn
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-900/85 text-white hover:bg-slate-800'
                  }`}
                  title="Nyalakan / Matikan Senter"
                >
                  <Flashlight size={14} />
                </button>
              )}

              {scanCooldown && (
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-sm animate-pulse">
                  <CheckCircle2 size={12} />
                  <span>Barcode Terbaca!</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Last Scan Feedback Card */}
        {lastScannedInfo && (
          <div
            className={`p-3 border-b text-xs flex items-center justify-between transition-colors ${
              lastScannedInfo.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`p-1.5 rounded-lg ${
                  lastScannedInfo.success
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {lastScannedInfo.type === 'book' ? (
                  <BookOpen size={16} />
                ) : lastScannedInfo.type === 'member' ? (
                  <User size={16} />
                ) : (
                  <ScanBarcode size={16} />
                )}
              </div>
              <div>
                <p className="font-bold text-xs truncate max-w-[280px]">
                  {lastScannedInfo.title}
                </p>
                <p className="text-[10px] font-mono opacity-80">
                  {lastScannedInfo.code} {lastScannedInfo.detail ? `• ${lastScannedInfo.detail}` : ''}
                </p>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                lastScannedInfo.success
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-rose-200 text-rose-900'
              }`}
            >
              {lastScannedInfo.success ? 'Berhasil' : 'Peringatan'}
            </span>
          </div>
        )}

        {/* Footer Controls & Manual Entry Fallback */}
        <div className="p-4 bg-slate-50 space-y-3 text-xs border-t border-slate-200">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={keepScanning}
                onChange={(e) => setKeepScanning(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <span>Tetap buka kamera untuk scan beruntun (buku & anggota)</span>
            </label>

            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Volume2 size={12} className="text-slate-400" />
              <span>Suara Beep Aktif</span>
            </span>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="flex gap-2 pt-1">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Atau ketik/paste barcode manual di sini..."
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono shadow-2xs"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1 shrink-0"
            >
              <ScanBarcode size={13} />
              <span>Proses</span>
            </button>
          </form>

          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1">
            <Info size={13} className="shrink-0 text-slate-400" />
            <span>
              Tips: Beri pencahayaan cukup dan jaga jarak sekitar 15–20 cm dari barcode.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
