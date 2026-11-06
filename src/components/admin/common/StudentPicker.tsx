import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, User, X, Check, School } from 'lucide-react';
import { Student } from '../../../types/admin';
import { playSoftClickSound } from '../../../lib/sound';

interface StudentPickerProps {
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
  required?: boolean;
  accentColor?: 'red' | 'amber' | 'blue' | 'rose' | 'emerald';
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  idPrefix?: string;
}

export const StudentPicker: React.FC<StudentPickerProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  required = false,
  accentColor = 'blue',
  label = 'اختر الطالب *',
  disabled = false,
  placeholder = 'ابحث باسم الطالب، الفصل، الكود أو ولي الأمر...',
  idPrefix = 'std-picker',
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) {
      return students;
    }
    const q = searchTerm.trim().toLowerCase();
    return students.filter((std) => {
      return (
        std.name.toLowerCase().includes(q) ||
        (std.className && std.className.toLowerCase().includes(q)) ||
        (std.studentCode && std.studentCode.toLowerCase().includes(q)) ||
        (std.nationalId && std.nationalId.includes(q)) ||
        (std.parentName && std.parentName.toLowerCase().includes(q)) ||
        (std.parentPhone && std.parentPhone.includes(q)) ||
        std.id.toLowerCase().includes(q)
      );
    });
  }, [students, searchTerm]);

  // Color config
  const colorStyles = {
    red: {
      ring: 'focus:ring-red-500 border-red-200',
      activeBorder: 'border-red-500 bg-red-50/60',
      selectedBadge: 'bg-red-100 text-red-800 border-red-200',
      activeText: 'text-red-700',
      checkIcon: 'text-red-600',
      avatarBg: 'bg-red-100 text-red-700',
    },
    amber: {
      ring: 'focus:ring-amber-500 border-amber-200',
      activeBorder: 'border-amber-500 bg-amber-50/60',
      selectedBadge: 'bg-amber-100 text-amber-800 border-amber-200',
      activeText: 'text-amber-700',
      checkIcon: 'text-amber-600',
      avatarBg: 'bg-amber-100 text-amber-700',
    },
    rose: {
      ring: 'focus:ring-rose-500 border-rose-200',
      activeBorder: 'border-rose-500 bg-rose-50/60',
      selectedBadge: 'bg-rose-100 text-rose-800 border-rose-200',
      activeText: 'text-rose-700',
      checkIcon: 'text-rose-600',
      avatarBg: 'bg-rose-100 text-rose-700',
    },
    emerald: {
      ring: 'focus:ring-emerald-500 border-emerald-200',
      activeBorder: 'border-emerald-500 bg-emerald-50/60',
      selectedBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      activeText: 'text-emerald-700',
      checkIcon: 'text-emerald-600',
      avatarBg: 'bg-emerald-100 text-emerald-700',
    },
    blue: {
      ring: 'focus:ring-blue-600 border-blue-200',
      activeBorder: 'border-blue-600 bg-blue-50/60',
      selectedBadge: 'bg-blue-100 text-blue-800 border-blue-200',
      activeText: 'text-blue-700',
      checkIcon: 'text-blue-600',
      avatarBg: 'bg-blue-100 text-blue-700',
    },
  }[accentColor];

  const handleSelect = (stdId: string) => {
    if (disabled) return;
    playSoftClickSound();
    onSelectStudent(stdId);
  };

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <label className="block font-extrabold text-slate-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {selectedStudent && (
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${colorStyles.selectedBadge} flex items-center gap-1`}>
            <Check className="w-3 h-3" />
            <span>تم تحديد الطالب</span>
          </span>
        )}
      </div>

      {/* Selected Student Active Card */}
      {selectedStudent ? (
        <div
          id={`${idPrefix}-selected-card`}
          className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${colorStyles.activeBorder}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${colorStyles.avatarBg}`}>
              {selectedStudent.photoUrl ? (
                <img
                  src={selectedStudent.photoUrl}
                  alt={selectedStudent.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                selectedStudent.name.charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                {selectedStudent.name}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                <span className="font-bold text-slate-700 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                  {selectedStudent.className || 'غير محدد'}
                </span>
                {selectedStudent.studentCode && (
                  <span className="font-mono text-slate-500">
                    كود: {selectedStudent.studentCode}
                  </span>
                )}
                {selectedStudent.parentName && (
                  <span className="hidden sm:inline text-slate-500">
                    • ولي الأمر: {selectedStudent.parentName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              playSoftClickSound();
              onSelectStudent('');
            }}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-[11px] border border-slate-200 transition-colors shrink-0 cursor-pointer active:scale-95 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>تغيير</span>
          </button>
        </div>
      ) : null}

      {/* Search Input & Student List Picker */}
      <div className="space-y-1.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id={`${idPrefix}-search`}
            type="text"
            disabled={disabled}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className={`w-full pr-8 pl-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 font-medium transition-all ${colorStyles.ring} disabled:opacity-60`}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Scrollable Student Selection Grid/List */}
        <div
          id={`${idPrefix}-list`}
          className="max-h-44 overflow-y-auto space-y-1 p-1 bg-slate-50/70 border border-slate-200 rounded-2xl divide-y divide-slate-100/80 overscroll-contain"
        >
          {filteredStudents.length === 0 ? (
            <div className="text-center py-6 text-slate-400 font-medium text-xs">
              لا يوجد طالب يطابق البحث "{searchTerm}"
            </div>
          ) : (
            filteredStudents.map((std) => {
              const isSelected = selectedStudentId === std.id;
              return (
                <div
                  key={std.id}
                  id={`${idPrefix}-item-${std.id}`}
                  onClick={() => handleSelect(std.id)}
                  className={`w-full p-2.5 rounded-xl text-right transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none active:scale-[0.99] ${
                    isSelected
                      ? `bg-white shadow-xs border-2 ${colorStyles.activeBorder}`
                      : 'hover:bg-white/90 border border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        isSelected ? colorStyles.avatarBg : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {std.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className={`font-bold text-xs truncate ${isSelected ? colorStyles.activeText : 'text-slate-900'}`}>
                        {std.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-1 rounded">
                          {std.className || 'عام'}
                        </span>
                        {std.studentCode && (
                          <span className="font-mono text-slate-400">
                            #{std.studentCode}
                          </span>
                        )}
                        {std.parentName && (
                          <span className="truncate hidden sm:inline text-slate-500">
                            • ولي الأمر: {std.parentName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isSelected ? (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${colorStyles.avatarBg}`}>
                        <Check className={`w-3.5 h-3.5 ${colorStyles.checkIcon}`} />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 hover:border-slate-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
