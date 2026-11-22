import React, { useEffect, useMemo, useState } from "react";

const WEEKDAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

const STATUS_FILTERS = [
  { value: "all", label: "Tüm durumlar" },
  { value: "confirmed", label: "Onaylandı" },
  { value: "waiting", label: "Bekliyor" },
  { value: "inProgress", label: "İşlemde" },
  { value: "completed", label: "Tamamlandı" },
  { value: "cancelled", label: "İptal / Gelmedi" },
];

const STATUS_OPTIONS = [
  { value: "Yeni Kayıt", label: "Yeni Randevu Verildi", icon: "🆕" },
  { value: "Onaylandı", label: "Onaylandı", icon: "✅" },
  { value: "Bekliyor", label: "Geldi / Beklemede", icon: "🏥" },
  { value: "İşlemde", label: "İşlemde", icon: "🦷" },
  { value: "Geldi", label: "Tamamlandı", icon: "✔️" },
  { value: "İptal", label: "İptal Edildi", icon: "❌" },
  { value: "Gelmedi", label: "Gelmedi / No-Show", icon: "🚫" },
];

const COMMUNICATION_OPTIONS = [
  { value: "information_pending", label: "Hastaya Bilgi Verilecek", icon: "📢" },
  { value: "phone_unanswered", label: "Telefon Açılmadı", icon: "📵" },
  { value: "informed", label: "Bilgilendirildi / Teyit Alındı", icon: "📞" },
];

const getStatusIcon = (status) =>
  STATUS_OPTIONS.find((option) => option.value === status)?.icon ||
  (status === "Bekliyor" ? "🏥" : "🆕");

const getCommunicationIcon = (value) =>
  COMMUNICATION_OPTIONS.find((option) => option.value === value)?.icon || "";

const getStatusIconClass = (status) => {
  if (status === "Yeni Kayıt") return "fa-circle-plus";
  if (status === "Onaylandı") return "fa-circle-check";
  if (status === "Bekliyor") return "fa-clock";
  if (status === "İşlemde") return "fa-tooth";
  if (status === "Geldi" || status === "Tamamlandı") return "fa-check";
  if (status === "İptal") return "fa-xmark";
  if (status === "Gelmedi") return "fa-user-xmark";
  return "fa-circle";
};

const getStatusBadgeClass = (status) => {
  if (status === "Onaylandı") return "bg-sky-500 text-white";
  if (status === "Bekliyor") return "bg-amber-400 text-slate-950";
  if (status === "İşlemde") return "bg-violet-500 text-white";
  if (status === "Geldi" || status === "Tamamlandı") return "bg-emerald-500 text-white";
  if (status === "İptal") return "bg-rose-500 text-white";
  if (status === "Gelmedi") return "bg-slate-600 text-white";
  return "bg-indigo-100 text-indigo-700";
};

const normalizeStatus = (status) => {
  const known = STATUS_OPTIONS.some((option) => option.value === status);
  return known ? status : "Onaylandı";
};

const isLiveStatus = (status) =>
  ["Onaylandı", "Geldi", "Tamamlandı", "İşlemde"].includes(status);

const pastelDoctorColor = (color) => {
  const normalized = String(color || "").replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return "#eef2ff";
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgb(${Math.round(red + (255 - red) * 0.82)}, ${Math.round(
    green + (255 - green) * 0.82
  )}, ${Math.round(blue + (255 - blue) * 0.82)})`;
};

const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const fromDateInput = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getWeekDates = (date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 6 }, (_, index) => {
    const next = new Date(monday);
    next.setDate(monday.getDate() + index);
    return next;
  });
};

const parseAppointmentKey = (key) => {
  const [year, month, day, ...timeParts] = key.split("-");
  const time = timeParts.join("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    Number.isNaN(date.getTime()) ||
    !/^\d{2}:\d{2}$/.test(time)
  ) {
    return null;
  }
  return { date, dateKey: toDateKey(date), time };
};

const toMinutes = (time) => {
  const [hour, minute] = String(time || "").split(":").map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute)
    ? hour * 60 + minute
    : null;
};

const fromMinutes = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60
  ).padStart(2, "0")}`;

const formatTimeRange = (startTime, duration) => {
  const start = toMinutes(startTime);
  const minutes = Number.parseInt(duration, 10);
  if (start === null || !Number.isFinite(minutes) || minutes <= 0) {
    return String(startTime || "");
  }
  return `${fromMinutes(start)}-${fromMinutes(start + minutes)}`;
};

const formatHourCount = (duration) => {
  const minutes = Number.parseInt(duration, 10);
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} saat`;
};

const getDisplayStatus = (status) => {
  if (status === "Yeni Kayıt") return "Bekliyor";
  if (status === "Geldi") return "Tamamlandı";
  if (status === "İptal") return "İptal";
  return status || "Bekliyor";
};

const matchesStatusFilter = (status, filter) => {
  if (filter === "all") return true;
  if (filter === "confirmed") return status === "Onaylandı";
  if (filter === "waiting") return status === "Yeni Kayıt" || status === "Bekliyor";
  if (filter === "inProgress") return status === "İşlemde";
  if (filter === "completed") return status === "Geldi" || status === "Tamamlandı";
  if (filter === "cancelled") return status === "İptal" || status === "Gelmedi";
  return true;
};

const getDuration = (appointment) => {
  const duration = Number.parseInt(appointment?.duration, 10);
  return Number.isFinite(duration) && duration > 0 ? duration : 30;
};

const isBlockAppointment = (appointment) =>
  appointment?.type === "block" ||
  appointment?.isBlock === true ||
  Boolean(appointment?.blockType);

const packConcurrentAppointments = (entries) => {
  const packed = [...entries]
    .map((entry) => ({
      ...entry,
      start: toMinutes(entry.time),
      end: toMinutes(entry.time) + getDuration(entry.appointment),
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const result = [];
  let cluster = [];
  let laneEnds = [];
  let clusterEnd = Number.NEGATIVE_INFINITY;

  const flushCluster = () => {
    if (!cluster.length) return;
    const laneCount = Math.max(1, laneEnds.length);
    result.push(...cluster.map((entry) => ({ ...entry, laneCount })));
    cluster = [];
    laneEnds = [];
    clusterEnd = Number.NEGATIVE_INFINITY;
  };

  packed.forEach((entry) => {
    if (cluster.length && entry.start >= clusterEnd) flushCluster();
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= entry.start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = entry.end;
    clusterEnd = Math.max(clusterEnd, entry.end);
    cluster.push({ ...entry, lane });
  });
  flushCluster();
  return result;
};

export default function ClinicAgenda({
  globalData,
  doctors,
  doctorColors,
  specialties,
  settings,
  currentUser,
  selectedDate,
  setSelectedDate,
  draggedAptInfo,
  dragOverTargetKey,
  canCreateAppointments,
  canEditAppointments,
  getDoctorScheduleStatus,
  onOpenAppointment,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onChangeStatus,
  onChangeCommunication,
  onChangeDoctorColor,
  onOpenPatient,
  onCreateBlock,
  onDeleteBlock,
  onNotify,
  initialView = "calendar",
}) {
  const [viewMode, setViewMode] = useState(initialView);
  const [calendarPeriod, setCalendarPeriod] = useState("week");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [selectedDoctorIds, setSelectedDoctorIds] = useState(() => doctors);
  const [hideEmptySlots, setHideEmptySlots] = useState(false);
  const [workingStart, setWorkingStart] = useState("09:00");
  const [workingEnd, setWorkingEnd] = useState("19:00");
  const [slotInterval, setSlotInterval] = useState(30);
  const [search, setSearch] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [blockDatePickerOpen, setBlockDatePickerOpen] = useState(false);
  const [blockDatePickerMonth, setBlockDatePickerMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  useEffect(() => {
    if (!datePickerOpen && !blockDatePickerOpen) return undefined;
    const closePickers = (event) => {
      if (!event.target.closest("[data-agenda-date-picker]")) {
        setDatePickerOpen(false);
        setBlockDatePickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", closePickers);
    return () => document.removeEventListener("pointerdown", closePickers);
  }, [datePickerOpen, blockDatePickerOpen]);
  const [blockForm, setBlockForm] = useState({
    title: "Toplantı",
    blockType: "meeting",
    doctorId: doctors[0] || "",
    date: toDateKey(selectedDate),
    time: "09:00",
    duration: "60",
  });
  const orderedDoctors = useMemo(
    () =>
      [...doctors].sort((a, b) =>
        (globalData.systemUsers?.[a]?.displayName ||
          globalData.doctorProfiles?.[a]?.name ||
          a).localeCompare(
          globalData.systemUsers?.[b]?.displayName ||
            globalData.doctorProfiles?.[b]?.name ||
            b,
          "tr"
        )
      ),
    [doctors, globalData.systemUsers, globalData.doctorProfiles]
  );

  const doctorColor = (doctorId) => {
    const savedColor = globalData.doctorProfiles?.[doctorId]?.calendarColor;
    if (savedColor) return savedColor;
    const index = Math.max(0, orderedDoctors.indexOf(doctorId));
    if (index < doctorColors.length) return doctorColors[index];
    return `hsl(${(index * 137.508) % 360} 68% 42%)`;
  };

  const specialtyDoctors = useMemo(
    () =>
      specialtyFilter === "all"
        ? orderedDoctors
        : orderedDoctors.filter((doctorId) =>
            (globalData.doctorProfiles?.[doctorId]?.specialties || []).includes(
              specialtyFilter
            )
          ),
    [globalData.doctorProfiles, orderedDoctors, specialtyFilter]
  );
  const visibleDoctors = useMemo(
    () =>
      specialtyDoctors.filter((doctorId) => selectedDoctorIds.includes(doctorId)),
    [selectedDoctorIds, specialtyDoctors]
  );
  const allSpecialtyDoctorsSelected =
    specialtyDoctors.length > 0 &&
    specialtyDoctors.every((doctorId) => selectedDoctorIds.includes(doctorId));

  const dates = useMemo(() => {
    const date = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );
    return calendarPeriod === "day" ? [date] : getWeekDates(date);
  }, [calendarPeriod, selectedDate]);

  const dateKeys = useMemo(() => new Set(dates.map(toDateKey)), [dates]);
  const startMinute = toMinutes(workingStart) ?? 9 * 60;
  const selectedEndMinute = toMinutes(workingEnd) ?? 19 * 60;
  const endMinute =
    selectedEndMinute > startMinute ? selectedEndMinute : startMinute + 60;

  const allAppointments = useMemo(() => {
    const selected = new Set(visibleDoctors);
    return Object.entries(globalData.appointments || {}).flatMap(
      ([doctorId, doctorAppointments]) => {
        if (!selected.has(doctorId)) return [];
        return Object.entries(doctorAppointments || {}).flatMap(
          ([key, appointment]) => {
            if (!appointment) return [];
            const parsed = parseAppointmentKey(key);
            if (!parsed) return [];
            const effectiveDateKey = String(appointment.date || appointment.dateKey || parsed.dateKey);
            const effectiveTime = String(appointment.time || parsed.time);
            if (!dateKeys.has(effectiveDateKey)) return [];
            const start = toMinutes(effectiveTime);
            if (start === null || start < startMinute || start >= endMinute) {
              return [];
            }
            if (
              !isBlockAppointment(appointment) &&
              !matchesStatusFilter(appointment.status, statusFilter)
            ) {
              return [];
            }
            const patient = appointment.patientId
              ? globalData.patientsDb?.[appointment.patientId]
              : Object.values(globalData.patientsDb || {}).find(
                  (item) =>
                    item?.name &&
                    appointment.patientName &&
                    item.name.toLocaleLowerCase("tr-TR") ===
                      appointment.patientName.toLocaleLowerCase("tr-TR")
                );
            const searchable = [
              appointment.patientName,
              appointment.phone,
              patient?.phone,
              appointment.treatment,
              appointment.notes,
              globalData.systemUsers?.[doctorId]?.displayName,
              doctorId,
            ]
              .filter(Boolean)
              .join(" ")
              .toLocaleLowerCase("tr-TR");
            if (search && !searchable.includes(search.trim().toLocaleLowerCase("tr-TR"))) {
              return [];
            }
            const effectiveDoctorId = appointment.doctorId || doctorId;
            if (!selected.has(effectiveDoctorId)) return [];
            return [{
              key,
              doctorId: effectiveDoctorId,
              appointment,
              patient,
              date: effectiveDateKey.includes("-")
                ? fromDateInput(effectiveDateKey)
                : parsed.date,
              dateKey: effectiveDateKey,
              time: effectiveTime,
            }];
          }
        );
      }
    );
  }, [
    dateKeys,
    globalData.appointments,
    globalData.patientsDb,
    globalData.systemUsers,
    search,
    startMinute,
    endMinute,
    statusFilter,
    visibleDoctors,
  ]);

  const segments = useMemo(() => {
    const allSegments = [];
    for (let minute = startMinute; minute < endMinute; minute += slotInterval) {
      allSegments.push({ start: minute, end: Math.min(minute + slotInterval, endMinute) });
    }
    if (!hideEmptySlots || allAppointments.length === 0) return allSegments;
    const occupied = allSegments.filter((segment) =>
      allAppointments.some((entry) => {
        const appointmentStart = toMinutes(entry.time);
        const appointmentEnd = appointmentStart + getDuration(entry.appointment);
        return appointmentStart < segment.end && appointmentEnd > segment.start;
      })
    );
    return occupied.length ? occupied : allSegments;
  }, [allAppointments, endMinute, hideEmptySlots, slotInterval, startMinute]);

  const baseRowHeight = 40;
  const rowHeight =
    slotInterval === 60 ? baseRowHeight : slotInterval === 30 ? 26 : 13;
  const timelineHeight = Math.max(rowHeight, segments.length * rowHeight);
  const timelinePosition = (minute) => {
    let position = 0;
    for (const segment of segments) {
      if (minute >= segment.end) {
        position += rowHeight;
        continue;
      }
      if (minute > segment.start) {
        position += ((minute - segment.start) / (segment.end - segment.start)) * rowHeight;
      }
      return position;
    }
    return position;
  };

  const timelineDuration = (start, end) =>
    segments.reduce((height, segment) => {
      const overlap = Math.max(0, Math.min(end, segment.end) - Math.max(start, segment.start));
      return height + (overlap / (segment.end - segment.start)) * rowHeight;
    }, 0);

  const defaultDoctorId =
    visibleDoctors.find((doctorId) => doctorId === currentUser) ||
    visibleDoctors[0] ||
    "";

  const toggleDoctor = (doctorId) => {
    setSelectedDoctorIds((current) =>
      current.includes(doctorId)
        ? current.filter((id) => id !== doctorId)
        : [...current, doctorId]
    );
  };

  const toggleAllDoctors = () => {
    if (allSpecialtyDoctorsSelected) {
      setSelectedDoctorIds((current) =>
        current.filter((doctorId) => !specialtyDoctors.includes(doctorId))
      );
    } else {
      setSelectedDoctorIds((current) =>
        [...new Set([...current, ...specialtyDoctors])]
      );
    }
  };

  const moveDate = (direction) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + direction * (calendarPeriod === "day" ? 1 : 7));
    setSelectedDate(nextDate);
  };

  const updateDateFromGrid = (event, column) => {
    if (!canCreateAppointments || !defaultDoctorId) return;
    const bounds = column.getBoundingClientRect();
    const offset = Math.max(0, Math.min(event.clientY - bounds.top, timelineHeight - 1));
    const segmentIndex = Math.min(
      segments.length - 1,
      Math.floor(offset / rowHeight)
    );
    const segment = segments[segmentIndex];
    if (!segment) return;
    const date = fromDateInput(event.currentTarget.dataset.date);
    onOpenAppointment(fromMinutes(segment.start), date, defaultDoctorId);
  };

  const handleColumnDrop = (event, date, column, columnDoctorId = null) => {
    if (!canEditAppointments || !draggedAptInfo) return;
    event.preventDefault();
    const bounds = column.getBoundingClientRect();
    const offset = Math.max(0, Math.min(event.clientY - bounds.top, timelineHeight - 1));
    const segmentIndex = Math.min(
      segments.length - 1,
      Math.floor(offset / rowHeight)
    );
    const segment = segments[segmentIndex];
    if (!segment) return;
    const step = Math.max(1, Number(settings?.randevu?.slotAraligi) || 15);
    const snappedTime = Math.round(segment.start / step) * step;
    const targetTime = fromMinutes(snappedTime);
    const targetDoctorId =
      columnDoctorId ||
      (visibleDoctors.length === 1 ? visibleDoctors[0] : draggedAptInfo.docId);
    const availability = getDoctorScheduleStatus(
      globalData.doctorProfiles?.[targetDoctorId],
      date,
      targetTime,
      Number(draggedAptInfo.aptData?.duration) || 30
    );
    if (!availability.available) {
      onNotify(`Bu saat uygun değil: ${availability.reason}`, "error");
      return;
    }
    onDrop(event, targetDoctorId, date, targetTime);
  };

  const openBlockModal = () => {
    setBlockForm((current) => ({
      ...current,
      doctorId: defaultDoctorId,
      date: toDateKey(selectedDate),
    }));
    setBlockDatePickerOpen(false);
    setBlockDatePickerMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    setBlockModalOpen(true);
  };

  const submitBlock = async (event) => {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(blockForm.date)) {
      onNotify("Tarihi YYYY-AA-GG formatında girin.", "error");
      return;
    }
    const created = await onCreateBlock({
      ...blockForm,
      date: fromDateInput(blockForm.date),
    });
    if (created) setBlockModalOpen(false);
  };

  const appointmentEntriesByDay = useMemo(() => {
    const grouped = new Map(dates.map((date) => [toDateKey(date), []]));
    allAppointments.forEach((entry) => grouped.get(entry.dateKey)?.push(entry));
    return grouped;
  }, [allAppointments, dates]);

  const dayColumns = useMemo(
    () =>
      calendarPeriod === "day"
        ? visibleDoctors.map((doctorId) => ({ date: dates[0], doctorId }))
        : dates.map((date) => ({ date, doctorId: null })),
    [
      calendarPeriod,
      dates,
      visibleDoctors,
      globalData.doctorProfiles,
      getDoctorScheduleStatus,
      startMinute,
      slotInterval,
    ]
  );

  const hourLabels = [];
  for (let minute = startMinute; minute <= endMinute; minute += 60) {
    hourLabels.push(minute);
  }
  if (hourLabels[hourLabels.length - 1] !== endMinute) hourLabels.push(endMinute);

  const selectedDetails = selectedAppointment;
  const selectedAppointmentIsBlock = isBlockAppointment(
    selectedDetails?.appointment
  );
  const selectedDoctorName = selectedDetails
    ? globalData.systemUsers?.[selectedDetails.doctorId]?.displayName ||
      globalData.doctorProfiles?.[selectedDetails.doctorId]?.name ||
      selectedDetails.doctorId
    : "";
  const selectedPatientName = selectedDetails?.appointment?.patientName;

  const formatDisplayDate = (date) =>
    date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const getMonthDateCells = (month) => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <header className="relative z-20 flex h-9 shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedDate(new Date())}
            className="h-7 rounded-md bg-indigo-600 px-2 text-[10px] font-black text-white hover:bg-indigo-700"
          >
            Bugün
          </button>
          <button
            type="button"
            aria-label="Önceki dönem"
            onClick={() => moveDate(-1)}
            className="h-7 w-7 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <i className="fa-solid fa-chevron-left text-[10px]"></i>
          </button>
          <button
            type="button"
            aria-label="Sonraki dönem"
            onClick={() => moveDate(1)}
            className="h-7 w-7 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <i className="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
          <div className="relative" data-agenda-date-picker>
            <button
              type="button"
              onClick={() => {
                setDatePickerMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
                setDatePickerOpen((open) => !open);
              }}
              aria-label="Tarih aralığı başlangıç tarihi"
              className="h-7 min-w-[132px] rounded-md border border-slate-200 bg-white px-2 text-[10px] font-black text-slate-700 outline-none hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <i className="fa-regular fa-calendar mr-1 text-slate-400"></i>
              {formatDisplayDate(selectedDate)}
            </button>
            {datePickerOpen && (
              <div
                className="fixed left-2 top-10 z-[500] w-[260px] rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="mb-1 flex items-center justify-between">
                  <button type="button" onClick={() => setDatePickerMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <i className="fa-solid fa-chevron-left text-[9px]"></i>
                  </button>
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                    {datePickerMonth.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
                  </span>
                  <button type="button" onClick={() => setDatePickerMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <i className="fa-solid fa-chevron-right text-[9px]"></i>
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map((day) => (
                    <div key={day} className="py-1 text-center text-[8px] font-black uppercase text-slate-400">{day}</div>
                  ))}
                  {getMonthDateCells(datePickerMonth).map((date) => {
                    const isCurrentMonth = date.getMonth() === datePickerMonth.getMonth();
                    const isSelected = toDateKey(date) === toDateKey(selectedDate);
                    const isToday = toDateKey(date) === toDateKey(new Date());
                    return (
                      <button
                        key={toDateKey(date)}
                        type="button"
                        onClick={() => {
                          setSelectedDate(date);
                          setDatePickerOpen(false);
                        }}
                        className={`h-8 rounded-md text-[10px] font-bold transition ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : isToday
                            ? "border border-indigo-300 text-indigo-600 dark:text-indigo-300"
                            : isCurrentMonth
                            ? "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                            : "text-slate-300 hover:bg-slate-50 dark:text-slate-600"
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => setDatePickerOpen(false)} className="mt-1 h-7 w-full rounded-md text-[9px] font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Kapat</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1.5 xl:justify-center">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Randevu durumu filtresi"
            className="h-7 min-w-[112px] rounded-md border border-slate-200 bg-white px-2 text-[10px] font-bold outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <select
            value={viewMode === "list" ? "list" : calendarPeriod}
            onChange={(event) => {
              if (event.target.value === "list") {
                setViewMode("list");
              } else {
                setCalendarPeriod(event.target.value);
                setViewMode("calendar");
              }
            }}
            aria-label="Görünüm ve periyot"
            className="h-7 min-w-[135px] rounded-md border border-slate-200 bg-white px-2 text-[10px] font-bold outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="week">Haftalık Takvim</option>
            <option value="day">Günlük Takvim</option>
            <option value="list">Randevu Listesi</option>
          </select>
          <label className="relative min-w-[130px] flex-1 max-w-[220px]">
            <i className="fa-solid fa-magnifying-glass absolute left-2 top-2 text-[9px] text-slate-400"></i>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Hasta / işlem ara"
              className="h-7 w-full rounded-md border border-slate-200 bg-white pl-7 pr-2 text-[10px] outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            title="Takvim görünümü"
            aria-pressed={viewMode === "calendar"}
            className={`h-7 w-7 rounded-md border ${
              viewMode === "calendar"
                ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
            }`}
          >
            <i className="fa-solid fa-table-cells-large text-[11px]"></i>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            title="Liste görünümü"
            aria-pressed={viewMode === "list"}
            className={`h-7 w-7 rounded-md border ${
              viewMode === "list"
                ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
            }`}
          >
            <i className="fa-solid fa-list text-[11px]"></i>
          </button>
          <button
            type="button"
            disabled={!canCreateAppointments || !defaultDoctorId}
            onClick={() =>
              onOpenAppointment(
                fromMinutes(startMinute),
                new Date(selectedDate),
                defaultDoctorId
              )
            }
            className="h-7 whitespace-nowrap rounded-md bg-indigo-600 px-2.5 text-[10px] font-black text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i className="fa-solid fa-plus mr-1"></i>
            Yeni Randevu
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-row gap-1 p-1">
        <aside className="order-first flex min-h-0 w-[176px] min-w-[176px] shrink-0 flex-col overflow-y-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="shrink-0 border-b border-slate-200 px-2 py-2 dark:border-slate-800">
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="text-[11px] font-black text-slate-800 dark:text-white">
                Hekim Ajandaları
              </h2>
              <span className="text-[9px] font-bold text-slate-400">
                {visibleDoctors.length}/{specialtyDoctors.length}
              </span>
            </div>
            <label className="block text-[9px] font-bold uppercase text-slate-400">
              Uzmanlık / Grup
              <select
                value={specialtyFilter}
                onChange={(event) => setSpecialtyFilter(event.target.value)}
                className="mt-1 h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-[10px] font-bold normal-case dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">Tüm uzmanlıklar</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-[10px] font-bold text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={allSpecialtyDoctorsSelected}
                onChange={toggleAllDoctors}
                className="h-3.5 w-3.5 accent-indigo-600"
              />
              Tüm Ajandalar
            </label>
          </div>

          <div className="shrink-0 p-1.5">
            <div className="space-y-1">
              {specialtyDoctors.map((doctorId) => {
                const checked = selectedDoctorIds.includes(doctorId);
                const color = doctorColor(doctorId);
                const profile = globalData.doctorProfiles?.[doctorId] || {};
                const name =
                  globalData.systemUsers?.[doctorId]?.displayName ||
                  profile.name ||
                  doctorId;
                const count = allAppointments.filter((entry) => entry.doctorId === doctorId).length;
                return (
                  <div
                    key={doctorId}
                    className={`flex min-h-8 w-full items-center gap-1.5 rounded-md border px-1.5 py-1 transition ${
                      checked
                        ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                        : "border-transparent bg-slate-50 opacity-60 dark:bg-slate-900"
                    }`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDoctor(doctorId)}
                      className="h-3.5 w-3.5 shrink-0 accent-indigo-600"
                      aria-label={`${name} ajandasını göster`}
                    />
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-700"
                      style={{ backgroundColor: color }}
                    ></span>
                    <span className="min-w-0 flex-1 truncate text-[9px] font-black text-slate-700 dark:text-slate-200">
                      {profile.title || globalData.systemUsers?.[doctorId]?.title || "Dt."} {name}
                    </span>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-black text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                      {count}
                    </span>
                    <label className="relative h-5 w-5 shrink-0 cursor-pointer rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-slate-600" title="Hekim rengini değiştir">
                      <input
                        type="color"
                        value={color}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => onChangeDoctorColor?.(doctorId, event.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label={`${name} takvim rengi`}
                      />
                      <span className="block h-full w-full" style={{ backgroundColor: color }}></span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 p-1.5 text-xs dark:border-slate-800">
            <div className="mb-1 text-[10px] font-black text-slate-700 dark:text-slate-200">
              <i className="fa-solid fa-sliders mr-1.5 text-indigo-500"></i>
              Ek Seçenekler
            </div>
            <div className="mt-1 space-y-1.5 border-t border-slate-100 pt-1.5 dark:border-slate-800">
                <div className="text-[9px] font-bold text-slate-500">
                  Çalışma Saat Aralığı
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    <input
                      type="time"
                      value={workingStart}
                      onChange={(event) => {
                        event.stopPropagation();
                        setWorkingStart(event.target.value);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      className="h-7 min-w-0 rounded-md border border-slate-200 bg-white px-1 text-[9px] dark:border-slate-700 dark:bg-slate-800"
                      aria-label="Çalışma başlangıç saati"
                    />
                    <input
                      type="time"
                      value={workingEnd}
                      onChange={(event) => {
                        event.stopPropagation();
                        setWorkingEnd(event.target.value);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      className="h-7 min-w-0 rounded-md border border-slate-200 bg-white px-1 text-[9px] dark:border-slate-700 dark:bg-slate-800"
                      aria-label="Çalışma bitiş saati"
                    />
                  </div>
                </div>
                <label className="block text-[9px] font-bold text-slate-500">
                  Slot Aralığı
                  <select
                    value={slotInterval}
                    onChange={(event) => setSlotInterval(Number(event.target.value))}
                    className="mt-1 h-7 w-full rounded-md border border-slate-200 bg-white px-1 text-[9px] dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value={15}>15 dakika</option>
                    <option value={30}>30 dakika</option>
                    <option value={60}>60 dakika</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={hideEmptySlots} onChange={(event) => setHideEmptySlots(event.target.checked)} className="h-3 w-3 accent-indigo-600" />
                  Boş saatleri gizle
                </label>
                <button type="button" disabled={!canCreateAppointments || !defaultDoctorId} onClick={openBlockModal} className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-left text-[9px] font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">
                  <i className="fa-solid fa-ban mr-1.5 text-amber-500"></i>
                  Blokaj / İzin Ekle
                </button>
            </div>
          </div>
        </aside>

        <main className="order-2 flex min-h-[360px] min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {viewMode === "calendar" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-auto">
                <div
                  className="sticky top-0 z-30 grid shrink-0 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                  style={{ gridTemplateColumns: calendarPeriod === "day"
                    ? `48px repeat(${Math.max(1, dayColumns.length)}, minmax(0, 1fr))`
                    : `48px repeat(${dates.length}, minmax(0, 1fr))` }}
                >
                  <div className="sticky left-0 z-40 border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"></div>
                  {calendarPeriod === "day"
                    ? dayColumns.map(({ doctorId }) => (
                        <div key={doctorId} className="flex h-10 items-center justify-center gap-2 border-r border-slate-200 px-2 dark:border-slate-800">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-700" style={{ backgroundColor: doctorColor(doctorId) }}></span>
                          <div className="min-w-0 text-center">
                            <div className="truncate text-[10px] font-black text-slate-700 dark:text-slate-200">
                              {globalData.systemUsers?.[doctorId]?.displayName || globalData.doctorProfiles?.[doctorId]?.name || doctorId}
                            </div>
                            <div className="text-[9px] font-bold text-slate-400">
                              {selectedDate.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "short" })}
                            </div>
                          </div>
                        </div>
                      ))
                    : dates.map((date) => {
                        const dateKey = toDateKey(date);
                        const isToday = dateKey === toDateKey(new Date());
                        return (
                          <div key={dateKey} className="flex h-10 items-center justify-center gap-2 border-r border-slate-200 px-1 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {WEEKDAYS[(date.getDay() + 6) % 7]}
                            </span>
                            <span className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[12px] font-black ${
                              isToday
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                            }`}>
                              {date.getDate()}
                            </span>
                          </div>
                        );
                      })}
                </div>
                <div
                  className="grid w-full min-w-0"
                  style={{
                    gridTemplateColumns: calendarPeriod === "day"
                      ? `48px repeat(${Math.max(1, dayColumns.length)}, minmax(0, 1fr))`
                      : `48px repeat(${dates.length}, minmax(0, 1fr))`,
                  }}
                >
                  <div
                    className="sticky left-0 z-10 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    style={{ height: timelineHeight }}
                  >
                    {hourLabels.map((minute) => (
                      <div
                        key={minute}
                        className={`absolute right-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 ${
                          minute === startMinute ? "translate-y-0" : "-translate-y-1/2"
                        }`}
                        style={{ top: timelinePosition(minute) }}
                      >
                        {fromMinutes(minute)}
                      </div>
                    ))}
                  </div>

                  {dayColumns.map(({ date, doctorId: columnDoctorId }) => {
                    const dateKey = toDateKey(date);
                    const dayEntries = (appointmentEntriesByDay.get(dateKey) || []).filter(
                      (entry) => !columnDoctorId || entry.doctorId === columnDoctorId
                    );
                    const packed = packConcurrentAppointments(dayEntries);
                    const gridLines = `repeating-linear-gradient(to bottom, transparent 0, transparent ${rowHeight - 1}px, rgba(148,163,184,.22) ${rowHeight - 1}px, rgba(148,163,184,.22) ${rowHeight}px)`;
                    return (
                      <div
                        key={columnDoctorId ? `${dateKey}-${columnDoctorId}` : dateKey}
                        data-date={dateKey}
                        className={`relative border-r border-slate-200 dark:border-slate-800 ${
                          toDateKey(new Date()) === dateKey
                            ? "bg-indigo-50/20 dark:bg-indigo-900/5"
                            : "bg-white dark:bg-slate-900"
                        }`}
                        style={{
                          height: timelineHeight,
                          backgroundImage: gridLines,
                        }}
                        onDoubleClick={(event) => {
                          event.stopPropagation();
                          if (blockModalOpen) return;
                          if (event.target !== event.currentTarget) return;
                          updateDateFromGrid(event, event.currentTarget);
                        }}
                        onDragOver={(event) => {
                          if (!canEditAppointments) return;
                          event.preventDefault();
                          const targetDoctorId =
                            columnDoctorId ||
                            (visibleDoctors.length === 1
                              ? visibleDoctors[0]
                              : draggedAptInfo?.docId);
                          if (!targetDoctorId) return;
                          const bounds = event.currentTarget.getBoundingClientRect();
                          const offset = Math.max(
                            0,
                            Math.min(event.clientY - bounds.top, timelineHeight - 1)
                          );
                          const segment =
                            segments[Math.min(
                              segments.length - 1,
                              Math.floor(offset / rowHeight)
                            )];
                          if (segment) {
                            onDragOver(
                              event,
                              `${targetDoctorId}-${dateKey}-${fromMinutes(segment.start)}`
                            );
                          }
                        }}
                        onDragLeave={onDragLeave}
                        onDrop={(event) =>
                          handleColumnDrop(
                            event,
                            date,
                            event.currentTarget,
                            columnDoctorId
                          )
                        }
                        role="presentation"
                      >
                        {packed.map((entry) => {
                          const appointmentStart = toMinutes(entry.time);
                          const appointmentEnd =
                            appointmentStart + getDuration(entry.appointment);
                          const top = timelinePosition(appointmentStart);
                          const height = Math.max(
                            18,
                            timelineDuration(appointmentStart, appointmentEnd)
                          );
                          const isBlock = isBlockAppointment(entry.appointment);
                          const color = doctorColor(entry.doctorId);
                          const cardStatus = normalizeStatus(entry.appointment.status);
                          const isSolid = isLiveStatus(cardStatus);
                          const laneWidth = 100 / entry.laneCount;
                          const left = isBlock ? 0 : entry.lane * laneWidth;
                          const width = isBlock ? 100 : laneWidth;
                          const title = isBlock
                            ? entry.appointment.title ||
                              entry.appointment.patientName ||
                              "Blokaj"
                            : entry.appointment.patientName || "Hasta";
                          const treatment =
                            entry.appointment.treatment ||
                            entry.appointment.blockType ||
                            "";
                          const isHighlighted =
                            dragOverTargetKey === `${entry.doctorId}-${entry.key}`;

                          return (
                            <button
                              key={`${entry.doctorId}-${entry.key}`}
                              type="button"
                              draggable={!isBlock && canEditAppointments}
                              onDragStart={(event) => {
                                event.stopPropagation();
                                if (!isBlock) {
                                  onDragStart(
                                    event,
                                    entry.doctorId,
                                    entry.date,
                                    entry.time,
                                    entry.appointment,
                                    entry.key
                                  );
                                }
                              }}
                              onDragEnd={onDragEnd}
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedAppointment(entry);
                              }}
                              onContextMenu={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setSelectedAppointment(entry);
                              }}
                              className={`absolute z-10 flex min-w-0 flex-col overflow-hidden rounded-md border px-1 py-0.5 text-left shadow-sm transition hover:z-20 hover:shadow-md ${
                                    isHighlighted ? "ring-2 ring-indigo-400" : ""
                              } ${isBlock ? "items-center justify-center text-center" : ""}`}
                              style={{
                                top,
                                height,
                                left: `calc(${left}% + 2px)`,
                                width: `calc(${width}% - 4px)`,
                                backgroundColor: isSolid
                                  ? color
                                  : pastelDoctorColor(color),
                                borderColor: color,
                                color: isSolid ? "#ffffff" : "#1e293b",
                              }}
                              title={`${title} · ${entry.time} · ${getDisplayStatus(
                                entry.appointment.status
                              )}`}
                            >
                              {isBlock ? (
                                <div className="flex min-w-0 flex-col items-center justify-center">
                                  <span className="truncate text-[10px] font-black">
                                    <i className="fa-solid fa-ban mr-1"></i>
                                    {title}
                                  </span>
                                  <span className="truncate text-[8px] font-bold opacity-90">
                                    {formatTimeRange(entry.time, entry.appointment.duration)}
                                  </span>
                                  <span className="text-[8px] font-bold opacity-80">
                                    {formatHourCount(entry.appointment.duration)}
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <span className="flex min-w-0 items-center gap-1 text-[9px] font-black leading-tight">
                                    {canEditAppointments && (
                                      <i
                                        className="fa-solid fa-grip-vertical shrink-0 opacity-70"
                                        aria-hidden="true"
                                      ></i>
                                    )}
                                    <span className="truncate">{title}</span>
                                  </span>
                                  <span className="truncate text-[8px] font-semibold leading-tight opacity-90">
                                    {treatment}
                                    {entry.appointment.selectedTeeth?.length
                                      ? ` · ${entry.appointment.selectedTeeth.join(", ")}`
                                      : ""}
                                  </span>
                                  <span className="absolute bottom-1 right-1 flex items-center gap-0.5">
                                    <span
                                      title={getDisplayStatus(cardStatus)}
                                      className={`flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-0.5 text-[7px] shadow-sm ${getStatusBadgeClass(cardStatus)}`}
                                    >
                                      <i className={`fa-solid ${getStatusIconClass(cardStatus)}`}></i>
                                    </span>
                                    {entry.appointment.cancelFollowUp && (
                                      <span
                                        title="İletişim durumu"
                                        className="flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-white/95 px-0.5 text-[8px] text-slate-700 shadow-sm"
                                      >
                                        {entry.appointment.cancelFollowUp === "phone_unanswered" ? (
                                          <i className="fa-solid fa-phone-slash"></i>
                                        ) : entry.appointment.cancelFollowUp === "informed" ? (
                                          <i className="fa-solid fa-phone-volume"></i>
                                        ) : (
                                          <i className="fa-solid fa-bullhorn"></i>
                                        )}
                                      </span>
                                    )}
                                  </span>
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-[10px]">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[9px] font-black uppercase tracking-wide text-slate-400 dark:bg-slate-900">
                  <tr>
                    <th className="px-2 py-2">Saat</th>
                    <th className="px-2 py-2">Hasta</th>
                    <th className="px-2 py-2">Hekim</th>
                    <th className="px-2 py-2">İşlem / Diş No</th>
                    <th className="px-2 py-2">Süre</th>
                    <th className="px-2 py-2">Durum</th>
                    <th className="px-2 py-2 text-right">Hızlı aksiyon</th>
                  </tr>
                </thead>
                <tbody>
                  {[...allAppointments]
                    .sort(
                      (a, b) =>
                        a.date.getTime() - b.date.getTime() ||
                        a.time.localeCompare(b.time)
                    )
                    .map((entry) => {
                      const color = doctorColor(entry.doctorId);
                      const block = isBlockAppointment(entry.appointment);
                      const status = normalizeStatus(entry.appointment.status);
                      return (
                        <tr
                          key={`${entry.doctorId}-${entry.key}`}
                          className="border-t border-slate-100 hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:bg-slate-800/60"
                          onClick={(event) => event.stopPropagation()}
                          style={{ boxShadow: `inset 3px 0 0 ${color}` }}
                        >
                          <td className="whitespace-nowrap px-2 py-1.5 font-black text-indigo-600 dark:text-indigo-300">
                            {entry.date.toLocaleDateString("tr-TR", {
                              day: "2-digit",
                              month: "2-digit",
                            })}{" "}
                            · {block
                              ? formatTimeRange(entry.time, entry.appointment.duration)
                              : entry.time}
                          </td>
                          <td className="px-2 py-1.5">
                            {block ? (
                              <span className="font-black text-slate-700 dark:text-slate-200">
                                {entry.appointment.title ||
                                  entry.appointment.patientName ||
                                  "Blokaj"}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenPatient(entry.appointment)}
                                className="text-left font-black text-slate-800 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-300"
                              >
                                {entry.appointment.patientName || "Hasta bilgisi yok"}
                                <span className="block text-[9px] font-medium text-slate-400">
                                  {entry.appointment.phone || entry.patient?.phone || "Telefon yok"}
                                </span>
                              </button>
                            )}
                          </td>
                          <td className="px-2 py-1.5">
                            <span
                              className="inline-flex max-w-[150px] items-center gap-1 truncate rounded-full px-2 py-1 text-[9px] font-black text-white"
                              style={{ backgroundColor: color }}
                            >
                              {globalData.systemUsers?.[entry.doctorId]?.displayName ||
                                globalData.doctorProfiles?.[entry.doctorId]?.name ||
                                entry.doctorId}
                            </span>
                          </td>
                          <td className="max-w-[240px] truncate px-2 py-1.5 text-slate-600 dark:text-slate-300">
                            {entry.appointment.treatment || entry.appointment.blockType || "—"}
                            {entry.appointment.selectedTeeth?.length
                              ? ` · Diş ${entry.appointment.selectedTeeth.join(", ")}`
                              : ""}
                            {entry.appointment.notes && (
                              <span
                                className="ml-1 text-amber-600"
                                title={entry.appointment.notes}
                              >
                                <i className="fa-regular fa-note-sticky"></i>
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-2 py-1.5 text-slate-600 dark:text-slate-300">
                            {getDuration(entry.appointment)} dk
                          </td>
                          <td className="px-2 py-1.5">
                            {block ? (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                Blokaj
                              </span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <select
                                  value={status}
                                  disabled={!canEditAppointments}
                                  onChange={(event) =>
                                    onChangeStatus(
                                      event,
                                      entry.doctorId,
                                      entry.key,
                                      entry.appointment,
                                      event.target.value
                                    )
                                  }
                                  className="max-w-[130px] rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[9px] font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                >
                                  {STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.icon} {option.label}
                                    </option>
                                  ))}
                                </select>
                                {entry.appointment.cancelFollowUp && (
                                  <span
                                    title={
                                      entry.appointment.cancelFollowUp === "phone_unanswered"
                                        ? "Telefon açmadı"
                                        : entry.appointment.cancelFollowUp === "noshow"
                                        ? "Hasta gelmedi"
                                        : entry.appointment.cancelFollowUp === "rebooked"
                                        ? "Yeni randevusu verildi"
                                        : entry.appointment.cancelFollowUp === "information_pending"
                                        ? "Hastaya bilgi verilecek"
                                        : "Yeniden aranacak"
                                    }
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300"
                                  >
                                    <i className={`fa-solid ${
                                      entry.appointment.cancelFollowUp === "phone_unanswered"
                                        ? "fa-phone-slash"
                                        : entry.appointment.cancelFollowUp === "noshow"
                                        ? "fa-user-xmark"
                                        : entry.appointment.cancelFollowUp === "rebooked"
                                        ? "fa-calendar-check"
                                        : "fa-phone-volume"
                                    } text-[9px]`}></i>
                                  </span>
                                )}
                                <select
                                  value={entry.appointment.cancelFollowUp || ""}
                                  disabled={!canEditAppointments}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) =>
                                    onChangeCommunication(
                                      event,
                                      entry.doctorId,
                                      entry.key,
                                      entry.appointment,
                                      event.target.value
                                    )
                                  }
                                  title="İletişim durumu"
                                  className="h-6 max-w-[34px] rounded-md border border-slate-200 bg-white px-0 text-[10px] dark:border-slate-700 dark:bg-slate-900"
                                >
                                  <option value="">—</option>
                                  {COMMUNICATION_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.icon}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-2 py-1.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedAppointment(entry)}
                              title="Randevu detayları"
                              className="mr-1 h-6 w-6 rounded-md border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300"
                            >
                              <i className="fa-regular fa-eye text-[9px]"></i>
                            </button>
                            <button
                              type="button"
                              disabled={!canEditAppointments}
                              onClick={() =>
                                onOpenAppointment(entry.time, entry.date, entry.doctorId)
                              }
                              title="Düzenle"
                              className="h-6 w-6 rounded-md border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                            >
                              <i className="fa-solid fa-pen text-[9px]"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {allAppointments.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        Seçili tarih, hekim ve filtrelerde randevu bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>

      </div>

      {selectedDetails && (
        <div
          className="fixed inset-0 z-[360] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => setSelectedAppointment(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="agenda-detail-title"
            className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 p-3 dark:border-slate-800">
              <div className="min-w-0">
                <div className="mb-1 text-[9px] font-black uppercase tracking-wider text-indigo-500">
                  {selectedAppointmentIsBlock ? "Blokaj / İzin" : "Randevu detayı"}
                </div>
                <h2
                  id="agenda-detail-title"
                  className="truncate text-sm font-black text-slate-800 dark:text-white"
                >
                  {selectedAppointmentIsBlock
                    ? selectedDetails.appointment.title ||
                      selectedDetails.appointment.patientName
                    : selectedPatientName || "Hasta bilgisi yok"}
                </h2>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                  {selectedDoctorName} · {selectedDetails.time} ·{" "}
                  {getDuration(selectedDetails.appointment)} dk
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                aria-label="Kapat"
                className="h-7 w-7 shrink-0 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="space-y-2 p-3">
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                <div className="text-[9px] font-bold uppercase text-slate-400">İşlem</div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  {selectedDetails.appointment.treatment ||
                    selectedDetails.appointment.blockType ||
                    "Belirtilmedi"}
                  {selectedDetails.appointment.selectedTeeth?.length
                    ? ` · Diş ${selectedDetails.appointment.selectedTeeth.join(", ")}`
                    : ""}
                </div>
                {selectedDetails.appointment.notes && (
                  <div className="mt-1 text-[10px] text-slate-500">
                    {selectedDetails.appointment.notes}
                  </div>
                )}
              </div>
              {!selectedAppointmentIsBlock && (
                <>
                  <div className="flex flex-wrap gap-1">
                    {STATUS_OPTIONS.map((option) => {
                      const icon =
                        option.value === "İptal" ? "fa-ban" :
                        option.value === "Gelmedi" ? "fa-user-xmark" :
                        option.value === "İşlemde" ? "fa-stethoscope" :
                        option.value === "Geldi" ? "fa-circle-check" :
                        option.value === "Onaylandı" ? "fa-calendar-check" :
                        "fa-clock";
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={!canEditAppointments}
                          onClick={(event) => {
                            onChangeStatus(
                              event,
                              selectedDetails.doctorId,
                              selectedDetails.key,
                              selectedDetails.appointment,
                              option.value
                            );
                            setSelectedAppointment((current) =>
                              current
                                ? {
                                    ...current,
                                    appointment: {
                                      ...current.appointment,
                                      status: option.value,
                                    },
                                  }
                                : current
                            );
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-[9px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                        >
                          <i className={`fa-solid ${icon}`}></i>
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-2 dark:border-slate-800">
                    {COMMUNICATION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        disabled={!canEditAppointments}
                        onClick={(event) => {
                          onChangeCommunication?.(
                            event,
                            selectedDetails.doctorId,
                            selectedDetails.key,
                            selectedDetails.appointment,
                            option.value
                          );
                          setSelectedAppointment((current) =>
                            current
                              ? {
                                  ...current,
                                  appointment: {
                                    ...current.appointment,
                                    cancelFollowUp: option.value,
                                  },
                                }
                              : current
                          );
                        }}
                        className={`rounded-md border px-2 py-1.5 text-[9px] font-bold ${
                          selectedDetails.appointment.cancelFollowUp === option.value
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                            : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {option.icon} {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full ${getStatusBadgeClass(normalizeStatus(selectedDetails.appointment.status))}`}>
                      <i className={`fa-solid ${getStatusIconClass(normalizeStatus(selectedDetails.appointment.status))}`}></i>
                    </span>
                    <span>
                      Son durum: {getDisplayStatus(normalizeStatus(selectedDetails.appointment.status))}
                    </span>
                  </div>
                  {selectedDetails.appointment.cancelFollowUp && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                      <i className={`fa-solid ${
                        selectedDetails.appointment.cancelFollowUp === "phone_unanswered"
                          ? "fa-phone-slash"
                          : selectedDetails.appointment.cancelFollowUp === "noshow"
                          ? "fa-user-xmark"
                          : selectedDetails.appointment.cancelFollowUp === "rebooked"
                          ? "fa-calendar-check"
                          : "fa-phone-volume"
                      }`}></i>
                      <span>
                        {selectedDetails.appointment.cancelFollowUp === "phone_unanswered" && "Telefon açmadı"}
                        {selectedDetails.appointment.cancelFollowUp === "noshow" && "Hasta gelmedi"}
                        {selectedDetails.appointment.cancelFollowUp === "rebooked" && "Yeni randevusu verildi"}
                        {selectedDetails.appointment.cancelFollowUp === "information_pending" && "Hastaya bilgi verilecek"}
                        {selectedDetails.appointment.cancelFollowUp === "recall" && "Yeniden aranacak"}
                        {selectedDetails.appointment.cancelFollowUp === "cancel" && "Randevu iptal edildi"}
                        {selectedDetails.appointment.cancelFollowUp === "informed" && "Bilgilendirildi / teyit alındı"}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-1.5 border-t border-slate-100 p-2.5 dark:border-slate-800">
              {selectedAppointmentIsBlock ? (
                <button
                  type="button"
                  disabled={!canEditAppointments}
                  onClick={async () => {
                    const deleted = await onDeleteBlock(
                      selectedDetails.doctorId,
                      selectedDetails.key
                    );
                    if (deleted) setSelectedAppointment(null);
                  }}
                  className="mr-auto rounded-md border border-rose-200 px-2.5 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-900/50 dark:text-rose-300"
                >
                  Blokajı kaldır
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPatient(selectedDetails.appointment);
                      setSelectedAppointment(null);
                    }}
                    className="mr-auto rounded-md border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Hasta Kartını Aç
                  </button>
                  <button
                    type="button"
                    disabled={!canEditAppointments}
                    onClick={() => {
                      onOpenAppointment(
                        selectedDetails.time,
                        selectedDetails.date,
                        selectedDetails.doctorId
                      );
                      setSelectedAppointment(null);
                    }}
                    className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-[10px] font-black text-white hover:bg-indigo-700 disabled:opacity-40"
                  >
                    Düzenle
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {blockModalOpen && (
        <div
          className="fixed inset-0 z-[360] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm"
          role="presentation"
          onKeyDown={(event) => {
            if (event.key === "Escape") setBlockModalOpen(false);
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            if (event.target === event.currentTarget) setBlockModalOpen(false);
          }}
        >
          <form
            onSubmit={submitBlock}
            className="w-full max-w-[420px] space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30">
                <i className="fa-solid fa-ban text-[11px]"></i>
              </span>
              Blokaj / İzin Ekle
            </div>
            <label className="block text-[9px] font-bold uppercase text-slate-400">
              Tür
              <select
                value={blockForm.blockType}
                onChange={(event) => {
                  const blockType = event.target.value;
                  setBlockForm({
                    ...blockForm,
                    blockType,
                    title:
                      blockType === "leave"
                        ? "İzin"
                        : blockType === "congress"
                        ? "Kongre"
                        : "Toplantı",
                    duration: blockType === "leave" ? "480" : blockForm.duration,
                  });
                }}
                className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="meeting">Toplantı</option>
                <option value="leave">İzin</option>
                <option value="congress">Kongre</option>
              </select>
            </label>
            <label className="block text-[9px] font-bold uppercase text-slate-400">
              Başlık
              <input
                required
                value={blockForm.title}
                onChange={(event) =>
                  setBlockForm({ ...blockForm, title: event.target.value })
                }
                className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-[9px] font-bold uppercase text-slate-400">
                Hekim
                <select
                  required
                  value={blockForm.doctorId}
                  onChange={(event) =>
                    setBlockForm({ ...blockForm, doctorId: event.target.value })
                  }
                  className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[10px] font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {doctors.map((doctorId) => (
                    <option key={doctorId} value={doctorId}>
                      {globalData.systemUsers?.[doctorId]?.displayName ||
                        globalData.doctorProfiles?.[doctorId]?.name ||
                        doctorId}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[9px] font-bold uppercase text-slate-400">
                Tarih
                <div className="relative" data-agenda-date-picker>
                  <button
                    type="button"
                    onClick={() => {
                      setBlockDatePickerMonth(blockForm.date ? new Date(blockForm.date.slice(0, 4), Number(blockForm.date.slice(5, 7)) - 1, 1) : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
                      setBlockDatePickerOpen((open) => !open);
                    }}
                    className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-left text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <i className="fa-regular fa-calendar mr-1.5 text-slate-400"></i>
                    {/^\d{4}-\d{2}-\d{2}$/.test(blockForm.date)
                      ? formatDisplayDate(fromDateInput(blockForm.date))
                      : "Tarih seçin"}
                  </button>
                  {blockDatePickerOpen && (
                    <div
                      className="absolute left-0 top-[38px] z-[600] w-[260px] rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <button type="button" onClick={() => setBlockDatePickerMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                          <i className="fa-solid fa-chevron-left text-[9px]"></i>
                        </button>
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                          {blockDatePickerMonth.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
                        </span>
                        <button type="button" onClick={() => setBlockDatePickerMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                          <i className="fa-solid fa-chevron-right text-[9px]"></i>
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-0.5">
                        {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map((day) => (
                          <div key={day} className="py-1 text-center text-[8px] font-black uppercase text-slate-400">{day}</div>
                        ))}
                        {getMonthDateCells(blockDatePickerMonth).map((date) => {
                          const isCurrentMonth = date.getMonth() === blockDatePickerMonth.getMonth();
                          const isSelected = toDateKey(date) === blockForm.date;
                          return (
                            <button
                              key={toDateKey(date)}
                              type="button"
                              onClick={() => {
                                setBlockForm({ ...blockForm, date: toDateKey(date) });
                                setBlockDatePickerOpen(false);
                              }}
                              className={`h-8 rounded-md text-[10px] font-bold ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : isCurrentMonth
                                  ? "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                  : "text-slate-300 hover:bg-slate-50 dark:text-slate-600"
                              }`}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                      <button type="button" onClick={() => setBlockDatePickerOpen(false)} className="mt-1 h-7 w-full rounded-md text-[9px] font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Kapat</button>
                    </div>
                  )}
                </div>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-[9px] font-bold uppercase text-slate-400">
                Başlangıç
                <input
                  type="time"
                  required
                  value={blockForm.time}
                  onChange={(event) =>
                    setBlockForm({ ...blockForm, time: event.target.value })
                  }
                  className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[10px] font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>
              <label className="block text-[9px] font-bold uppercase text-slate-400">
                Süre
                <select
                  value={blockForm.duration}
                  onChange={(event) =>
                    setBlockForm({ ...blockForm, duration: event.target.value })
                  }
                  className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[10px] font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {[30, 60, 90, 120, 180, 240, 480].map((duration) => (
                    <option key={duration} value={duration}>
                      {duration === 480 ? "480 dakika / Tam gün" : `${duration} dakika`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1.5 text-[10px] font-black text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300">
              <span>
                <i className="fa-regular fa-clock mr-1.5"></i>
                {formatTimeRange(blockForm.time, blockForm.duration)}
              </span>
              <span>{formatHourCount(blockForm.duration)}</span>
            </div>
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setBlockModalOpen(false)}
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={!canCreateAppointments}
                className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-[10px] font-black text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                Blokajı Kaydet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
