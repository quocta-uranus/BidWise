'use client';

import { useState, useEffect } from 'react';
import { CreditCard, ArrowRight, Loader2, CheckCircle2, Shield, Info, ArrowRightLeft } from 'lucide-react';
import { useFreelancer } from '@/lib/hooks/useFreelancer';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  gateway: string;
  userEmail: string;
  onSuccess: () => void;
}

export default function CheckoutModal({ isOpen, onClose, amount, gateway, userEmail, onSuccess }: Props) {
  const { depositFunds } = useFreelancer();
  const { language } = useTranslation();
  const [step, setStep] = useState<'checkout' | 'processing' | 'success'>('checkout');

  const L = (vi: string, en: string) => (language === 'vi' ? vi : en);

  const [loadingText, setLoadingText] = useState(L('Đang khởi tạo giao dịch...', 'Initializing transaction...'));
  
  // Card states
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardFocused, setCardFocused] = useState<'number' | 'name' | 'expiry' | 'cvc' | null>(null);

  // Convert USD to VND for VietQR mockup (Rate: 1 USD = 25,450 VND)
  const exchangeRate = 25450;
  const amountVnd = Math.round(amount * exchangeRate);
  
  // Mock Bank credentials for VietQR
  const bankId = 'MB'; // MBBank
  const accountNo = '90123456789';
  const accountName = 'CONG TY BIDWISE VIETNAM';
  const memo = `BIDWISE DEPOSIT ${userEmail.replace(/@.*/, '').toUpperCase()}`;
  
  // VietQR Dynamic API URL
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amountVnd}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountName)}`;

  useEffect(() => {
    if (isOpen) {
      setStep('checkout');
      setCardNumber('');
      setCardName('');
      setExpiry('');
      setCvc('');
      setCardFocused(null);
      setLoadingText(L('Đang khởi tạo giao dịch...', 'Initializing transaction...'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setLoadingText(L('Đang liên hệ với ngân hàng phát hành...', 'Contacting issuing bank...'));
    
    setTimeout(() => {
      setLoadingText(L('Đang xử lý thanh toán qua cổng bảo mật...', 'Processing payment via secure gateway...'));
    }, 800);

    setTimeout(async () => {
      try {
        const res = await depositFunds(amount, gateway.toUpperCase());
        if (res.success) {
          setStep('success');
          toast.success(L('Nạp tiền vào ví thành công!', 'Funds deposited successfully!'));
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
        } else {
          setStep('checkout');
          toast.error(L('Giao dịch bị từ chối bởi cổng thanh toán.', 'Transaction declined by payment gateway.'));
        }
      } catch (err) {
        setStep('checkout');
        toast.error(L('Có lỗi hệ thống xảy ra.', 'A system error occurred.'));
      }
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const isStripe = gateway.toLowerCase() === 'stripe';
  const displayGatewayName = isStripe
    ? 'Stripe Credit Card'
    : gateway.toUpperCase() === 'VNPAY'
    ? 'Cổng VNPAY (QR-Pay)'
    : gateway.toUpperCase() === 'MOMO'
    ? 'Ví điện tử MoMo'
    : 'Ví điện tử ZaloPay';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                {L('Cổng thanh toán an toàn', 'Secure Payment Gateway')}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{displayGatewayName}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={step === 'processing'}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-all disabled:opacity-50"
          >
            {L('Đóng', 'Close')}
          </button>
        </div>

        {/* Content steps */}
        <div className="p-6 flex-1 min-h-[380px] flex flex-col justify-center">
          
          {step === 'checkout' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              
              {/* Payment Summary */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 flex justify-between items-center border border-slate-200/50 shadow-inner">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                    {L('Số tiền nạp ví', 'Deposit Amount')}
                  </span>
                  <h4 className="text-2xl font-black text-slate-800">${amount.toLocaleString()} <span className="text-xs font-semibold text-slate-500">USD</span></h4>
                </div>
                {!isStripe && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      {L('Tương đương (VND)', 'Equivalent (VND)')}
                    </span>
                    <h4 className="text-sm font-extrabold text-blue-600">{amountVnd.toLocaleString()} ₫</h4>
                  </div>
                )}
              </div>

              {isStripe ? (
                /* Stripe Credit Card Mockup */
                <form onSubmit={handlePay} className="space-y-4">
                  {/* Virtual Card Graphic */}
                  <div className="bg-gradient-to-tr from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden h-40 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
                    
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs text-slate-400 tracking-wider">Debit Card Mockup</span>
                      <CreditCard className="w-8 h-8 text-slate-400" />
                    </div>
                    
                    <div>
                      <p className="font-mono text-lg tracking-widest text-slate-200">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </p>
                      <div className="flex justify-between items-end mt-4">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-mono">{L('Chủ thẻ', 'Cardholder')}</p>
                          <p className="font-mono text-xs tracking-wider uppercase text-slate-300 truncate max-w-[180px]">
                            {cardName || 'NATIVE DEVELOPER'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-slate-500 uppercase font-mono">{L('Hạn dùng', 'Expires')}</p>
                          <p className="font-mono text-xs text-slate-300">{expiry || 'MM/YY'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card fields */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">{L('SỐ THẺ TÍN DỤNG', 'CREDIT CARD NUMBER')}</label>
                      <input
                        type="text"
                        required
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        onFocus={() => setCardFocused('number')}
                        maxLength={19}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-mono font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all bg-slate-50/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">{L('TÊN TRÊN THẺ', 'CARDHOLDER NAME')}</label>
                      <input
                        type="text"
                        required
                        placeholder="NGUYEN VAN A"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        onFocus={() => setCardFocused('name')}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-mono font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all bg-slate-50/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">{L('HẠN SỬ DỤNG', 'EXPIRY DATE')}</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          onFocus={() => setCardFocused('expiry')}
                          maxLength={5}
                          className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all bg-slate-50/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">CVC / CVV</label>
                        <input
                          type="password"
                          required
                          placeholder="•••"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
                          onFocus={() => setCardFocused('cvc')}
                          maxLength={3}
                          className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  >
                    {L('Thanh toán bảo mật', 'Pay Securely')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Bank Transfer / Wallet QR Scan Code Mockup */
                <div className="space-y-4 text-center">
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col items-center shadow-inner relative group">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 rounded-full px-3 py-0.5 shadow-sm mb-3">
                      {L('Quét mã để chuyển khoản bằng App Ngân hàng', 'Scan QR code using bank app to transfer')}
                    </span>
                    
                    {/* Dynamic QR Image via VietQR Open API */}
                    <div className="bg-white border border-slate-200/80 p-2.5 rounded-2xl shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={qrUrl} 
                        alt="VietQR Payment Dynamic Code" 
                        className="w-48 h-48 object-contain select-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-left w-full mt-4 pt-3 border-t border-slate-200/40 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold">{L('Tên ngân hàng:', 'Bank Name:')}</span>
                        <p className="font-extrabold text-slate-800 mt-0.5">MBBank (Ngân hàng Quân Đội)</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">{L('Số tài khoản:', 'Account No:')}</span>
                        <p className="font-extrabold text-blue-600 mt-0.5 tracking-wider">{accountNo}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 font-semibold">{L('Tên tài khoản:', 'Account Name:')}</span>
                        <p className="font-extrabold text-slate-800 mt-0.5 uppercase">{accountName}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 font-semibold">{L('Nội dung chuyển khoản (Bắt buộc):', 'Transfer Memo (Required):')}</span>
                        <p className="font-mono font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2.5 mt-1 tracking-wider break-all shadow-inner">
                          {memo}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      onClick={onClose}
                      className="flex-1 h-10 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl transition-all"
                    >
                      {L('Hủy giao dịch', 'Cancel')}
                    </button>
                    <button
                      onClick={handlePay}
                      className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {L('Tôi đã chuyển tiền', 'I have transferred funds')}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-medium">
                <Info className="w-3 h-3 shrink-0" />
                <span>{L('Mọi thông tin thẻ/tài khoản đều được bảo mật SSL 256-bit.', 'All card/account details are protected by 256-bit SSL encryption.')}</span>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-10 space-y-4 animate-in fade-in duration-300">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin relative" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-800 text-sm">
                  {L('Đang xác thực giao dịch', 'Verifying transaction')}
                </h4>
                <p className="text-xs text-slate-400 font-medium animate-pulse">{loadingText}</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-10 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-green-50 border-2 border-green-150 rounded-full flex items-center justify-center mx-auto text-green-600 animate-bounce shadow-md">
                <CheckCircle2 size={36} className="fill-green-50" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-base">
                  {L('Thanh toán thành công!', 'Payment Successful!')}
                </h4>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  {L(
                    `Cảm ơn bạn. Số tiền $${amount.toLocaleString()} USD đã được cộng vào số dư ví của bạn.`,
                    `Thank you. The amount of $${amount.toLocaleString()} USD has been successfully added to your wallet balance.`
                  )}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
