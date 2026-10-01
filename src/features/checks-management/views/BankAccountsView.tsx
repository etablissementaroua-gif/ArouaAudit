import React, { useState, useEffect } from 'react';
import { checksManagementService } from '../services/checksManagement.service';
import { BankAccount, CreateBankAccountDTO } from '../models/check.types';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { 
  Building2,
  RotateCcw, 
  CreditCard, 
  Plus, 
  Copy, 
  Check, 
  ShieldCheck, 
  ArrowUpRight, 
  Wallet, 
  Landmark,
  X,
  AlertCircle
} from 'lucide-react';

export const BankAccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedRib, setCopiedRib] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState<CreateBankAccountDTO>({
    account_name: '',
    bank_name: 'Attijariwafa Bank',
    rib: '',
    account_number: '',
    agency: '',
    initial_balance: 0,
    current_balance: 0,
    is_active: true
  });
  const [errorMsg, setErrorMsg] = useState('');

  const [resettingBalances, setResettingBalances] = useState(false);
  const handleResetBalances = async () => {
    if (!window.confirm('هل أنت متأكد من تصفير أرصدة كافة الحسابات البنكية إلى 0,00 MAD؟')) return;
    setResettingBalances(true);
    await checksManagementService.resetAllAccountBalances();
    await loadAccounts();
    setResettingBalances(false);
  };

  const loadAccounts = async () => {
    setLoading(true);
    const data = await checksManagementService.getBankAccounts();
    setAccounts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const totalLiquidity = accounts.reduce((sum, a) => sum + (a.is_active ? a.current_balance : 0), 0);
  const activeCount = accounts.filter(a => a.is_active).length;

  const handleCopyRib = (rib: string) => {
    navigator.clipboard.writeText(rib);
    setCopiedRib(rib);
    setTimeout(() => setCopiedRib(null), 2500);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await checksManagementService.toggleAccountStatus(id, !currentStatus);
    loadAccounts();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.account_name || !newAccount.rib) {
      setErrorMsg('يرجى ملء اسم الحساب ورقم المعرف البنكي (RIB)');
      return;
    }
    if (newAccount.rib.replace(/\s/g, '').length !== 24) {
      setErrorMsg('يجب أن يتكون رقم الـ RIB من 24 رقماً بالضبط');
      return;
    }

    try {
      await checksManagementService.createBankAccount({
        ...newAccount,
        rib: newAccount.rib.replace(/\s/g, ''),
        current_balance: Number(newAccount.initial_balance)
      });
      setIsModalOpen(false);
      setNewAccount({
        account_name: '',
        bank_name: 'Attijariwafa Bank',
        rib: '',
        account_number: '',
        agency: '',
        initial_balance: 0,
        current_balance: 0,
        is_active: true
      });
      setErrorMsg('');
      loadAccounts();
    } catch {
      setErrorMsg('حدث خطأ أثناء حفظ الحساب البنكي');
    }
  };

  const getBankColor = (bankName: string) => {
    if (bankName.includes('Attijariwafa')) return 'bg-amber-50 border-amber-200 text-amber-700';
    if (bankName.includes('Populaire')) return 'bg-orange-50 border-orange-200 text-orange-700';
    if (bankName.includes('CIH')) return 'bg-sky-50 border-sky-200 text-sky-700';
    if (bankName.includes('Africa') || bankName.includes('BMCE')) return 'bg-blue-50 border-blue-200 text-blue-700';
    return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">الحسابات البنكية والخزائن المركزية</h1>
              <p className="text-slate-500 text-sm">إدارة الأرصدة البنكية، أرقام الـ RIB، وتوزيع السيولة النقدية لمجموعة أروى</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetBalances}
            disabled={resettingBalances}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            title="تصفير أرصدة الحسابات إلى 0,00 MAD"
          >
            <RotateCcw className={`w-4 h-4 text-rose-600 ${resettingBalances ? 'animate-spin' : ''}`} />
            <span>تصفير الأرصدة (0 MAD)</span>
          </button>
          <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة حساب بنكي جديد</span>
        </button>
        </div>
      </div>

      {/* Financial Liquidity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="standard-kpi-card"><div className="w-1.5 h-full absolute top-0 right-0 bg-emerald-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">إجمالي السيولة البنكية</span>
            <Wallet className="w-5 h-5 text-emerald-700" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 font-mono tracking-tight">{formatMAD(totalLiquidity)}</p>
          <p className="text-xs text-slate-500 mt-1">موزعة على {activeCount} حسابات نشطة</p>
        </div>

        <div className="standard-kpi-card"><div className="w-1.5 h-full absolute top-0 right-0 bg-teal-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">الحسابات النشطة</span>
            <Building2 className="w-5 h-5 text-emerald-700" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">{activeCount} / {accounts.length}</p>
          <p className="text-xs text-slate-500 mt-1">حسابات بنكية معتمدة</p>
        </div>

        <div className="standard-kpi-card"><div className="w-1.5 h-full absolute top-0 right-0 bg-teal-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">الحساب الرئيسي (Attijari)</span>
            <ShieldCheck className="w-5 h-5 text-amber-700" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 font-mono">
            {formatMAD(accounts[0]?.current_balance || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">وكالة أكدال - الرباط</p>
        </div>

        <div className="standard-kpi-card"><div className="w-1.5 h-full absolute top-0 right-0 bg-teal-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">متوسط الرصيد للحساب</span>
            <ArrowUpRight className="w-5 h-5 text-emerald-800" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-800 font-mono">
            {formatMAD(activeCount > 0 ? totalLiquidity / activeCount : 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">معدل التغطية المالية</p>
        </div>
      </div>

      {/* Bank Accounts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-16 text-center text-slate-500">جاري تحميل بيانات الحسابات البنكية...</div>
        ) : accounts.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-slate-500">لا توجد حسابات مسجلة حالياً</div>
        ) : (
          accounts.map(acc => {
            const colorClass = getBankColor(acc.bank_name);
            return (
              <div 
                key={acc.id}
                className="bg-white border border-slate-200 shadow-xs hover:border-emerald-300 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br border ${colorClass}`}>
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{acc.account_name}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">{acc.bank_name}</span>
                        <span>•</span>
                        <span>{acc.agency || 'الوكالة المركزية'}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    acc.is_active 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 border-emerald-500/30' 
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {acc.is_active ? 'نشط' : 'معطل'}
                  </span>
                </div>

                {/* Balance Display */}
                <div className="bg-slate-50 border border-slate-200 border border-slate-200/80 p-4 rounded-xl mb-4">
                  <span className="text-xs text-slate-500 block mb-1">الرصيد المحاسبي المتوفر</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-emerald-700 font-mono">
                      {formatMAD(acc.current_balance)}
                    </span>
                    <span className="text-xs text-slate-500">
                      افتتاحي: {formatMAD(acc.initial_balance)}
                    </span>
                  </div>
                </div>

                {/* 24-Digit RIB block */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between mb-4">
                  <div className="font-mono text-sm tracking-wider text-slate-700 text-left dir-ltr select-all">
                    {acc.rib.match(/.{1,4}/g)?.join(' ') || acc.rib}
                  </div>
                  <button
                    onClick={() => handleCopyRib(acc.rib)}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                    title="نسخ رقم الـ RIB"
                  >
                    {copiedRib === acc.rib ? (
                      <Check className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 text-xs text-slate-500">
                  <span>رقم الحساب: <span className="font-mono text-slate-700">{acc.account_number || '---'}</span></span>
                  <button
                    onClick={() => handleToggleStatus(acc.id, acc.is_active)}
                    className="hover:text-emerald-700 transition-colors"
                  >
                    {acc.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Bank Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 shadow-xs w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white/50">
              <div className="flex items-center gap-2.5">
                <Landmark className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-lg">إضافة حساب بنكي جديد</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">اسم الحساب الوصفي *</label>
                <input
                  type="text"
                  placeholder="مثال: الحساب الجاري للمصاريف - بنك CIH"
                  value={newAccount.account_name}
                  onChange={e => setNewAccount({ ...newAccount, account_name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">اسم المؤسسة البنكية *</label>
                  <select
                    value={newAccount.bank_name}
                    onChange={e => setNewAccount({ ...newAccount, bank_name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Attijariwafa Bank">Attijariwafa Bank</option>
                    <option value="Banque Populaire">Banque Populaire (البنك الشعبي)</option>
                    <option value="CIH Bank">CIH Bank</option>
                    <option value="Bank of Africa">Bank of Africa (BMCE)</option>
                    <option value="Société Générale">Société Générale</option>
                    <option value="BMCI">BMCI (BNP Paribas)</option>
                    <option value="Crédit Agricole">Crédit Agricole du Maroc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">الوكالة البنكية</label>
                  <input
                    type="text"
                    placeholder="مثال: وكالة أكدال - الرباط"
                    value={newAccount.agency}
                    onChange={e => setNewAccount({ ...newAccount, agency: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">رقم المعرف البنكي الموحد (RIB - 24 رقماً) *</label>
                <input
                  type="text"
                  maxLength={24}
                  placeholder="007780000123456789012345"
                  value={newAccount.rib}
                  onChange={e => setNewAccount({ ...newAccount, rib: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-sm tracking-wider focus:outline-none focus:border-indigo-500 dir-ltr text-left"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">رقم الحساب الفرعي</label>
                  <input
                    type="text"
                    placeholder="000123456789"
                    value={newAccount.account_number}
                    onChange={e => setNewAccount({ ...newAccount, account_number: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:border-indigo-500 dir-ltr text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">الرصيد الافتتاحي (درهم)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newAccount.initial_balance || ''}
                    onChange={e => setNewAccount({ ...newAccount, initial_balance: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:border-indigo-500 text-left dir-ltr"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-700/20 active:scale-95"
                >
                  حفظ وتأكيد الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
