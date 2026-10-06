import { useState, useMemo } from 'react';

// Types
interface Employee {
  id: string;
  name: string;
  nationalCode: string;
  position: string;
  baseSalary: number;
  overtimeHours: number;
  children: number;
  housingAllowance: boolean;
  foodAllowance: boolean;
}

interface PaySlip {
  employee: Employee;
  baseSalary: number;
  overtimePay: number;
  housingAllowance: number;
  foodAllowance: number;
  childrenAllowance: number;
  grossSalary: number;
  insuranceDeduction: number;
  taxDeduction: number;
  netSalary: number;
  month: string;
  year: number;
}

// Constants
const MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const HOUSING_ALLOWANCE = 9000000; // 9,000,000 Rials
const FOOD_ALLOWANCE = 14000000; // 14,000,000 Rials
const CHILDREN_ALLOWANCE_PER_CHILD = 5000000; // 5,000,000 Rials per child
const INSURANCE_RATE = 0.07; // 7% employee share
const EMPLOYER_INSURANCE_RATE = 0.23; // 23% employer share
const WORKING_HOURS_PER_MONTH = 192; // Standard working hours
const DAILY_WAGE_DIVISOR = 30;

// Tax brackets for 1403 (simplified)
function calculateTax(taxableIncome: number): number {
  if (taxableIncome <= 120000000) return 0;
  if (taxableIncome <= 168000000) return (taxableIncome - 120000000) * 0.10;
  if (taxableIncome <= 276000000) return 4800000 + (taxableIncome - 168000000) * 0.15;
  if (taxableIncome <= 408000000) return 21000000 + (taxableIncome - 276000000) * 0.20;
  return 47400000 + (taxableIncome - 408000000) * 0.30;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(num));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Components
function Header() {
  return (
    <header className="bg-gradient-to-l from-blue-700 via-blue-600 to-indigo-700 text-white shadow-xl no-print">
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <i className="fas fa-calculator text-3xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold">سامانه حقوق و دستمزد</h1>
              <p className="text-blue-100 text-sm mt-1">مدیریت و محاسبه حقوق کارکنان</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 text-sm">
            <span className="bg-white/10 px-3 py-1 rounded-full">
              <i className="fas fa-calendar-alt ml-1"></i>
              سال ۱۴۰۳
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatsCards({ employees, paySlips }: { employees: Employee[]; paySlips: PaySlip[] }) {
  const totalNetSalary = paySlips.reduce((sum, ps) => sum + ps.netSalary, 0);
  const totalInsurance = paySlips.reduce((sum, ps) => sum + ps.insuranceDeduction, 0);
  const totalTax = paySlips.reduce((sum, ps) => sum + ps.taxDeduction, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="card border-r-4 border-r-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">تعداد کارکنان</p>
            <p className="text-2xl font-bold text-blue-600">{formatNumber(employees.length)}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <i className="fas fa-users text-blue-600 text-xl"></i>
          </div>
        </div>
      </div>
      <div className="card border-r-4 border-r-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">جمع حقوق خالص</p>
            <p className="text-lg font-bold text-green-600">{formatNumber(totalNetSalary)} ریال</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <i className="fas fa-money-bill-wave text-green-600 text-xl"></i>
          </div>
        </div>
      </div>
      <div className="card border-r-4 border-r-orange-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">جمع بیمه</p>
            <p className="text-lg font-bold text-orange-600">{formatNumber(totalInsurance)} ریال</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-full">
            <i className="fas fa-shield-alt text-orange-600 text-xl"></i>
          </div>
        </div>
      </div>
      <div className="card border-r-4 border-r-red-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">جمع مالیات</p>
            <p className="text-lg font-bold text-red-600">{formatNumber(totalTax)} ریال</p>
          </div>
          <div className="bg-red-100 p-3 rounded-full">
            <i className="fas fa-landmark text-red-600 text-xl"></i>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeeForm({ 
  onAdd, 
  editingEmployee, 
  onCancelEdit 
}: { 
  onAdd: (emp: Employee) => void;
  editingEmployee: Employee | null;
  onCancelEdit: () => void;
}) {
  const [form, setForm] = useState<Employee>({
    id: '',
    name: '',
    nationalCode: '',
    position: '',
    baseSalary: 0,
    overtimeHours: 0,
    children: 0,
    housingAllowance: true,
    foodAllowance: true,
  });

  // Update form when editing
  useState(() => {
    if (editingEmployee) {
      setForm(editingEmployee);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.baseSalary) {
      alert('لطفاً نام و حقوق پایه را وارد کنید');
      return;
    }
    onAdd({ ...form, id: form.id || generateId() });
    setForm({
      id: '',
      name: '',
      nationalCode: '',
      position: '',
      baseSalary: 0,
      overtimeHours: 0,
      children: 0,
      housingAllowance: true,
      foodAllowance: true,
    });
  };

  return (
    <div className="card mb-8">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <i className="fas fa-user-plus text-blue-600"></i>
        {editingEmployee ? 'ویرایش اطلاعات کارمند' : 'ثبت کارمند جدید'}
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">نام و نام خانوادگی *</label>
          <input
            type="text"
            className="input-field"
            placeholder="نام کامل کارمند"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">کد ملی</label>
          <input
            type="text"
            className="input-field"
            placeholder="کد ملی ۱۰ رقمی"
            value={form.nationalCode}
            onChange={(e) => setForm({ ...form, nationalCode: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">سمت شغلی</label>
          <input
            type="text"
            className="input-field"
            placeholder="عنوان شغلی"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">حقوق پایه (ریال) *</label>
          <input
            type="number"
            className="input-field"
            placeholder="مبلغ به ریال"
            value={form.baseSalary || ''}
            onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">ساعات اضافه‌کاری</label>
          <input
            type="number"
            className="input-field"
            placeholder="تعداد ساعات"
            value={form.overtimeHours || ''}
            onChange={(e) => setForm({ ...form, overtimeHours: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">تعداد فرزندان</label>
          <input
            type="number"
            className="input-field"
            placeholder="تعداد"
            min="0"
            max="10"
            value={form.children || ''}
            onChange={(e) => setForm({ ...form, children: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.housingAllowance}
              onChange={(e) => setForm({ ...form, housingAllowance: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-600">حق مسکن</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.foodAllowance}
              onChange={(e) => setForm({ ...form, foodAllowance: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-600">حق خواربار</span>
          </label>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary flex items-center gap-2">
            <i className="fas fa-save"></i>
            {editingEmployee ? 'بروزرسانی' : 'ثبت'}
          </button>
          {editingEmployee && (
            <button type="button" onClick={onCancelEdit} className="btn-secondary">
              انصراف
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function EmployeeTable({ 
  employees, 
  onEdit, 
  onDelete, 
  onCalculatePay 
}: { 
  employees: Employee[];
  onEdit: (emp: Employee) => void;
  onDelete: (id: string) => void;
  onCalculatePay: (emp: Employee) => void;
}) {
  return (
    <div className="card mb-8 overflow-x-auto">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <i className="fas fa-list text-blue-600"></i>
        لیست کارکنان
      </h2>
      {employees.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <i className="fas fa-users text-5xl mb-4"></i>
          <p>هنوز کارمندی ثبت نشده است</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-right rounded-tr-lg">ردیف</th>
              <th className="px-4 py-3 text-right">نام</th>
              <th className="px-4 py-3 text-right">سمت</th>
              <th className="px-4 py-3 text-right">حقوق پایه</th>
              <th className="px-4 py-3 text-right">اضافه‌کاری</th>
              <th className="px-4 py-3 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, index) => (
              <tr key={emp.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{emp.name}</td>
                <td className="px-4 py-3 text-gray-600">{emp.position || '-'}</td>
                <td className="px-4 py-3">{formatNumber(emp.baseSalary)} ریال</td>
                <td className="px-4 py-3">{emp.overtimeHours} ساعت</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onCalculatePay(emp)}
                      className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                      title="محاسبه حقوق"
                    >
                      <i className="fas fa-calculator ml-1"></i>
                      محاسبه
                    </button>
                    <button
                      onClick={() => onEdit(emp)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                      title="ویرایش"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => onDelete(emp.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                      title="حذف"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PaySlipView({ 
  paySlip, 
  onClose, 
  onPrint 
}: { 
  paySlip: PaySlip | null;
  onClose: () => void;
  onPrint: () => void;
}) {
  if (!paySlip) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-l from-green-600 to-emerald-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <i className="fas fa-file-invoice-dollar"></i>
              فیش حقوقی
            </h2>
            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <p className="text-green-100 mt-2">{paySlip.month} {paySlip.year}</p>
        </div>
        
        <div className="p-6">
          {/* Employee Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">نام:</span> <span className="font-bold">{paySlip.employee.name}</span></div>
              <div><span className="text-gray-500">سمت:</span> <span className="font-bold">{paySlip.employee.position || '-'}</span></div>
              <div><span className="text-gray-500">کد ملی:</span> <span className="font-bold">{paySlip.employee.nationalCode || '-'}</span></div>
              <div><span className="text-gray-500">تعداد فرزند:</span> <span className="font-bold">{paySlip.employee.children}</span></div>
            </div>
          </div>

          {/* Earnings */}
          <div className="mb-6">
            <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
              <i className="fas fa-plus-circle"></i>
              اقلام حقوقی (مزایا)
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                <span className="text-gray-600">حقوق پایه</span>
                <span className="font-medium">{formatNumber(paySlip.baseSalary)} ریال</span>
              </div>
              {paySlip.overtimePay > 0 && (
                <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                  <span className="text-gray-600">اضافه‌کاری ({paySlip.employee.overtimeHours} ساعت)</span>
                  <span className="font-medium">{formatNumber(paySlip.overtimePay)} ریال</span>
                </div>
              )}
              {paySlip.housingAllowance > 0 && (
                <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                  <span className="text-gray-600">حق مسکن</span>
                  <span className="font-medium">{formatNumber(paySlip.housingAllowance)} ریال</span>
                </div>
              )}
              {paySlip.foodAllowance > 0 && (
                <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                  <span className="text-gray-600">حق خواربار</span>
                  <span className="font-medium">{formatNumber(paySlip.foodAllowance)} ریال</span>
                </div>
              )}
              {paySlip.childrenAllowance > 0 && (
                <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                  <span className="text-gray-600">حق اولاد ({paySlip.employee.children} فرزند)</span>
                  <span className="font-medium">{formatNumber(paySlip.childrenAllowance)} ریال</span>
                </div>
              )}
              <div className="flex justify-between py-2 bg-green-50 rounded-lg px-3 font-bold text-green-700">
                <span>جمع کل مزایا</span>
                <span>{formatNumber(paySlip.grossSalary)} ریال</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="mb-6">
            <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">
              <i className="fas fa-minus-circle"></i>
              کسورات
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                <span className="text-gray-600">بیمه تأمین اجتماعی (۷٪)</span>
                <span className="font-medium text-red-600">{formatNumber(paySlip.insuranceDeduction)} ریال</span>
              </div>
              {paySlip.taxDeduction > 0 && (
                <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                  <span className="text-gray-600">مالیات بر درآمد</span>
                  <span className="font-medium text-red-600">{formatNumber(paySlip.taxDeduction)} ریال</span>
                </div>
              )}
              <div className="flex justify-between py-2 bg-red-50 rounded-lg px-3 font-bold text-red-700">
                <span>جمع کل کسورات</span>
                <span>{formatNumber(paySlip.insuranceDeduction + paySlip.taxDeduction)} ریال</span>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="bg-gradient-to-l from-blue-600 to-indigo-700 text-white rounded-xl p-5 text-center">
            <p className="text-blue-100 text-sm mb-1">مبلغ قابل پرداخت (خالص)</p>
            <p className="text-3xl font-bold">{formatNumber(paySlip.netSalary)} ریال</p>
            <p className="text-blue-200 text-xs mt-2">
              معادل {formatNumber(paySlip.netSalary / 10)} تومان
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button onClick={onPrint} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <i className="fas fa-print"></i>
              چاپ فیش
            </button>
            <button onClick={onClose} className="btn-secondary flex-1">
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaySlipsHistory({ paySlips, onView }: { paySlips: PaySlip[]; onView: (ps: PaySlip) => void }) {
  if (paySlips.length === 0) return null;

  return (
    <div className="card mb-8">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <i className="fas fa-history text-purple-600"></i>
        سوابق محاسبه حقوق
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-100">
              <th className="px-4 py-3 text-right rounded-tr-lg">نام کارمند</th>
              <th className="px-4 py-3 text-right">دوره</th>
              <th className="px-4 py-3 text-right">حقوق ناخالص</th>
              <th className="px-4 py-3 text-right">کسورات</th>
              <th className="px-4 py-3 text-right">حقوق خالص</th>
              <th className="px-4 py-3 text-center">مشاهده</th>
            </tr>
          </thead>
          <tbody>
            {paySlips.map((ps, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors">
                <td className="px-4 py-3 font-medium">{ps.employee.name}</td>
                <td className="px-4 py-3 text-gray-600">{ps.month} {ps.year}</td>
                <td className="px-4 py-3">{formatNumber(ps.grossSalary)} ریال</td>
                <td className="px-4 py-3 text-red-600">{formatNumber(ps.insuranceDeduction + ps.taxDeduction)} ریال</td>
                <td className="px-4 py-3 font-bold text-green-700">{formatNumber(ps.netSalary)} ریال</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onView(ps)}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                  >
                    <i className="fas fa-eye ml-1"></i>
                    فیش
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BatchCalculation({ 
  employees, 
  onCalculateAll 
}: { 
  employees: Employee[];
  onCalculateAll: (month: string, year: number) => void;
}) {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]);
  const [selectedYear, setSelectedYear] = useState(1403);

  return (
    <div className="card mb-8 bg-gradient-to-l from-indigo-50 to-blue-50 border-indigo-200">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <i className="fas fa-cogs text-indigo-600"></i>
        محاسبه گروهی حقوق
      </h2>
      <p className="text-gray-600 text-sm mb-4">
        با کلیک روی دکمه زیر، حقوق تمام کارکنان برای ماه انتخابی محاسبه می‌شود.
      </p>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">ماه</label>
          <select
            className="input-field"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">سال</label>
          <input
            type="number"
            className="input-field w-28"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          />
        </div>
        <button
          onClick={() => onCalculateAll(selectedMonth, selectedYear)}
          disabled={employees.length === 0}
          className="btn-success flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-play"></i>
          محاسبه حقوق همه ({employees.length} نفر)
        </button>
      </div>
    </div>
  );
}

function ExportSection({ paySlips }: { paySlips: PaySlip[] }) {
  const exportToText = () => {
    let content = '═══════════════════════════════════════════\n';
    content += '          گزارش حقوق و دستمزد\n';
    content += '═══════════════════════════════════════════\n\n';
    
    paySlips.forEach((ps, i) => {
      content += `--- فیش شماره ${i + 1} ---\n`;
      content += `نام: ${ps.employee.name}\n`;
      content += `سمت: ${ps.employee.position || '-'}\n`;
      content += `دوره: ${ps.month} ${ps.year}\n`;
      content += `حقوق پایه: ${formatNumber(ps.baseSalary)} ریال\n`;
      content += `اضافه‌کاری: ${formatNumber(ps.overtimePay)} ریال\n`;
      content += `حق مسکن: ${formatNumber(ps.housingAllowance)} ریال\n`;
      content += `حق خواربار: ${formatNumber(ps.foodAllowance)} ریال\n`;
      content += `حق اولاد: ${formatNumber(ps.childrenAllowance)} ریال\n`;
      content += `جمع مزایا: ${formatNumber(ps.grossSalary)} ریال\n`;
      content += `بیمه: ${formatNumber(ps.insuranceDeduction)} ریال\n`;
      content += `مالیات: ${formatNumber(ps.taxDeduction)} ریال\n`;
      content += `حقوق خالص: ${formatNumber(ps.netSalary)} ریال\n`;
      content += '\n';
    });

    content += '═══════════════════════════════════════════\n';
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payroll-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    let content = 'نام,سمت,حقوق پایه,اضافه کاری,حق مسکن,حق خواربار,حق اولاد,جمع مزایا,بیمه,مالیات,حقوق خالص\n';
    paySlips.forEach(ps => {
      content += `${ps.employee.name},${ps.employee.position || '-'},${ps.baseSalary},${ps.overtimePay},${ps.housingAllowance},${ps.foodAllowance},${ps.childrenAllowance},${ps.grossSalary},${ps.insuranceDeduction},${ps.taxDeduction},${ps.netSalary}\n`;
    });

    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payroll-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToBat = () => {
    let content = '@echo off\n';
    content += 'chcp 65001 >nul\n';
    content += 'echo ═══════════════════════════════════════════\n';
    content += 'echo           گزارش حقوق و دستمزد\n';
    content += 'echo ═══════════════════════════════════════════\n';
    content += 'echo.\n';
    
    paySlips.forEach((ps, i) => {
      content += `echo --- فیش شماره ${i + 1} ---\n`;
      content += `echo نام: ${ps.employee.name}\n`;
      content += `echo سمت: ${ps.employee.position || '-'}\n`;
      content += `echo دوره: ${ps.month} ${ps.year}\n`;
      content += `echo حقوق پایه: ${formatNumber(ps.baseSalary)} ریال\n`;
      content += `echo اضافه‌کاری: ${formatNumber(ps.overtimePay)} ریال\n`;
      content += `echo جمع مزایا: ${formatNumber(ps.grossSalary)} ریال\n`;
      content += `echo بیمه: ${formatNumber(ps.insuranceDeduction)} ریال\n`;
      content += `echo مالیات: ${formatNumber(ps.taxDeduction)} ریال\n`;
      content += `echo حقوق خالص: ${formatNumber(ps.netSalary)} ریال\n`;
      content += 'echo.\n';
    });

    content += 'echo ═══════════════════════════════════════════\n';
    content += 'pause\n';

    const blob = new Blob([content], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payroll-report.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (paySlips.length === 0) return null;

  return (
    <div className="card mb-8 bg-gradient-to-l from-amber-50 to-yellow-50 border-amber-200">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <i className="fas fa-download text-amber-600"></i>
        خروجی گزارش
      </h2>
      <p className="text-gray-600 text-sm mb-4">
        گزارش حقوق را با فرمت‌های مختلف دانلود کنید.
      </p>
      <div className="flex flex-wrap gap-3">
        <button onClick={exportToText} className="btn-primary flex items-center gap-2">
          <i className="fas fa-file-alt"></i>
          خروجی TXT
        </button>
        <button onClick={exportToCSV} className="btn-success flex items-center gap-2">
          <i className="fas fa-file-csv"></i>
          خروجی CSV
        </button>
        <button onClick={exportToBat} className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2">
          <i className="fas fa-terminal"></i>
          خروجی BAT
        </button>
      </div>
    </div>
  );
}

// Main App
export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [paySlips, setPaySlips] = useState<PaySlip[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedPaySlip, setSelectedPaySlip] = useState<PaySlip | null>(null);

  const handleAddEmployee = (emp: Employee) => {
    if (editingEmployee) {
      setEmployees(employees.map(e => e.id === emp.id ? emp : e));
      setEditingEmployee(null);
    } else {
      setEmployees([...employees, emp]);
    }
  };

  const handleEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('آیا از حذف این کارمند مطمئن هستید؟')) {
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
  };

  const calculatePaySlip = (emp: Employee, month: string, year: number): PaySlip => {
    const hourlyRate = emp.baseSalary / WORKING_HOURS_PER_MONTH;
    const overtimePay = emp.overtimeHours * hourlyRate * 1.4; // 40% overtime premium
    
    const housingAllowance = emp.housingAllowance ? HOUSING_ALLOWANCE : 0;
    const foodAllowance = emp.foodAllowance ? FOOD_ALLOWANCE : 0;
    const childrenAllowance = emp.children * CHILDREN_ALLOWANCE_PER_CHILD;
    
    const grossSalary = emp.baseSalary + overtimePay + housingAllowance + foodAllowance + childrenAllowance;
    
    // Insurance is calculated on base salary + overtime
    const insuranceBase = emp.baseSalary + overtimePay;
    const insuranceDeduction = insuranceBase * INSURANCE_RATE;
    
    // Tax is calculated on gross minus insurance
    const taxableIncome = grossSalary - insuranceDeduction;
    const taxDeduction = calculateTax(taxableIncome);
    
    const netSalary = grossSalary - insuranceDeduction - taxDeduction;

    return {
      employee: emp,
      baseSalary: emp.baseSalary,
      overtimePay,
      housingAllowance,
      foodAllowance,
      childrenAllowance,
      grossSalary,
      insuranceDeduction,
      taxDeduction,
      netSalary,
      month,
      year,
    };
  };

  const handleCalculatePay = (emp: Employee) => {
    const paySlip = calculatePaySlip(emp, MONTHS[new Date().getMonth()], 1403);
    setPaySlips([...paySlips, paySlip]);
    setSelectedPaySlip(paySlip);
  };

  const handleCalculateAll = (month: string, year: number) => {
    const newPaySlips = employees.map(emp => calculatePaySlip(emp, month, year));
    setPaySlips([...paySlips, ...newPaySlips]);
    alert(`حقوق ${employees.length} نفر با موفقیت محاسبه شد.`);
  };

  const handleViewPaySlip = (ps: PaySlip) => {
    setSelectedPaySlip(ps);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <StatsCards employees={employees} paySlips={paySlips} />
        
        <EmployeeForm 
          onAdd={handleAddEmployee}
          editingEmployee={editingEmployee}
          onCancelEdit={handleCancelEdit}
        />

        <EmployeeTable 
          employees={employees}
          onEdit={handleEditEmployee}
          onDelete={handleDeleteEmployee}
          onCalculatePay={handleCalculatePay}
        />

        <BatchCalculation 
          employees={employees}
          onCalculateAll={handleCalculateAll}
        />

        <PaySlipsHistory 
          paySlips={paySlips}
          onView={handleViewPaySlip}
        />

        <ExportSection paySlips={paySlips} />
      </main>

      <PaySlipView 
        paySlip={selectedPaySlip}
        onClose={() => setSelectedPaySlip(null)}
        onPrint={handlePrint}
      />

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-6 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">
            <i className="fas fa-copyright ml-1"></i>
            سامانه حقوق و دستمزد — تمامی حقوق محفوظ است
          </p>
          <p className="text-xs text-gray-500 mt-2">
            طراحی و توسعه با ❤️ | نسخه ۱.۰
          </p>
        </div>
      </footer>
    </div>
  );
}
