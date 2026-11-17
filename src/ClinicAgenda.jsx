import React, { useEffect, useMemo, useRef, useState } from "react";

const MONTHS = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

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
  { value: "Onaylandı", label: "Onaylandı" },
  { value: "İşlemde", label: "İşlemde" },
  { value: "Yeni Kayıt", label: "Yeni kayıt" },
  { value: "Bekliyor", label: "Bekliyor" },
  { value: "Geldi", label: "Tamamlandı (Geldi)" },
  { value: "İptal", label: "İptal" },
  { value: "Gelmedi", label: "Gelmedi" },
];

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

const formatDateRange = (start, end) => {
  const first = `${start.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
  if (toDateKey(start) === toDateKey(end)) return first;
  return `${first} - ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
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
  const [showOutsideHours, setShowOutsideHours] = useState(false);
  const [showExtraOptions, setShowExtraOptions] = useState(false);
  const [showDensityOptions, setShowDensityOptions] = useState(false);
  const [slotInterval, setSlotInterval] = useState(30);
  const [search, setSearch] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    title: "Toplantı",
    blockType: "meeting",
    doctorId: doctors[0] || "",
    date: toDateKey(selectedDate),
    time: "09:00",
    duration: "60",
  });
  const dateInputRef = useRef(null);
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window === "undefined" ? 900 : window.innerHeight
  );

  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", updateViewportHeight);
    return () => window.removeEventListener("resize", updateViewportHeight);
  }, []);

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
  const startMinute = showOutsideHours ? 8 * 60 : 9 * 60;
  const endMinute = showOutsideHours ? 21 * 60 : 19 * 60;

  const allAppointments = useMemo(() => {
    const selected = new Set(visibleDoctors);
    return Object.entries(globalData.appointments || {}).flatMap(
      ([doctorId, doctorAppointments]) => {
        if (!selected.has(doctorId)) return [];
        return Object.entries(doctorAppointments || {}).flatMap(
          ([key, appointment]) => {
            if (!appointment) return [];
            const parsed = parseAppointmentKey(key);
            if (!parsed || !dateKeys.has(parsed.dateKey)) return [];
            const start = toMinutes(parsed.time);
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
            return [{
              key,
              doctorId,
              appointment,
              patient,
              date: parsed.date,
              dateKey: parsed.dateKey,
              time: parsed.time,
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

  const baseRowHeight =
    slotInterval === 15 ? 18 : slotInterval === 30 ? 30 : 48;
  const rowHeight = hideEmptySlots
    ? baseRowHeight
    : Math.max(
        baseRowHeight,
        Math.floor(
          Math.max(360, viewportHeight - 120) / Math.max(1, segments.length)
        )
      );
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

  const handleColumnDrop = (event, date, column) => {
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
      visibleDoctors.length === 1 ? visibleDoctors[0] : draggedAptInfo.docId;
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
    setBlockModalOpen(true);
    setShowExtraOptions(false);
  };

  const submitBlock = async (event) => {
    event.preventDefault();
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

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <header className="relative z-20 flex shrink-0 flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900 xl:flex-nowrap">
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setDatePickerOpen((open) => !open)}
              className="min-w-[155px] rounded-md px-1.5 py-1 text-left text-[11px] font-black text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 sm:min-w-[180px]"
            >
              <i className="fa-regular fa-calendar mr-1.5 text-indigo-500"></i>
              {formatDateRange(dates[0], dates[dates.length - 1])}
            </button>
            {datePickerOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <label className="block text-[9px] font-bold uppercase text-slate-400">
                  Başlangıç tarihi
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={toDateKey(selectedDate)}
                    onChange={(event) => {
                      if (event.target.value) {
                        setSelectedDate(fromDateInput(event.target.value));
                        setDatePickerOpen(false);
                      }
                    }}
                    className="mt-1 block rounded-md border border-slate-200 px-2 py-1.5 text-[11px] font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </label>
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDensityOptions((open) => !open)}
              title="Saat aralığı ve yoğunluk"
              aria-expanded={showDensityOptions}
              className="h-7 w-7 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <i className="fa-solid fa-sliders text-[11px]"></i>
            </button>
            {showDensityOptions && (
              <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <label className="block text-[9px] font-bold uppercase text-slate-400">
                  Saat aralığı
                  <select
                    value={slotInterval}
                    onChange={(event) => setSlotInterval(Number(event.target.value))}
                    className="mt-1 h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-[10px] font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value={15}>15 dakika · yoğun</option>
                    <option value={30}>30 dakika · dengeli</option>
                    <option value={60}>60 dakika · sıkı</option>
                  </select>
                </label>
              </div>
            )}
          </div>
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

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-1.5 lg:flex-row">
        <main className="flex min-h-[360px] min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {viewMode === "calendar" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="grid shrink-0 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900" style={{ gridTemplateColumns: `48px repeat(${dates.length}, minmax(112px, 1fr))` }}>
                <div className="sticky left-0 z-20 border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"></div>
                {dates.map((date) => {
                  const dateKey = toDateKey(date);
                  const isToday = dateKey === toDateKey(new Date());
                  return (
                    <div
                      key={dateKey}
                      className="flex h-10 items-center justify-center gap-1.5 border-r border-slate-200 px-1 dark:border-slate-800"
                    >
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                        {WEEKDAYS[(date.getDay() + 6) % 7]}
                      </span>
                      <span
                        className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-black ${
                          isToday
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                <div
                  className="grid min-w-max"
                  style={{
                    gridTemplateColumns: `48px repeat(${dates.length}, minmax(112px, 1fr))`,
                  }}
                >
                  <div
                    className="sticky left-0 z-10 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    style={{ height: timelineHeight }}
                  >
                    {hourLabels.map((minute) => (
                      <div
                        key={minute}
                        className="absolute right-1 top-0 -translate-y-1/2 text-[9px] font-bold text-slate-400"
                        style={{ top: timelinePosition(minute) }}
                      >
                        {fromMinutes(minute)}
                      </div>
                    ))}
                  </div>

                  {dates.map((date) => {
                    const dateKey = toDateKey(date);
                    const dayEntries = appointmentEntriesByDay.get(dateKey) || [];
                    const packed = packConcurrentAppointments(dayEntries);
                    const gridLines = `repeating-linear-gradient(to bottom, transparent 0, transparent ${rowHeight - 1}px, rgba(148,163,184,.22) ${rowHeight - 1}px, rgba(148,163,184,.22) ${rowHeight}px)`;
                    const lunchTop = timelinePosition(13 * 60);
                    const lunchHeight = timelineDuration(13 * 60, 14 * 60);

                    return (
                      <div
                        key={dateKey}
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
                        onClick={(event) =>
                          updateDateFromGrid(event, event.currentTarget)
                        }
                        onDragOver={(event) => {
                          if (!canEditAppointments) return;
                          event.preventDefault();
                          const targetDoctorId =
                            visibleDoctors.length === 1
                              ? visibleDoctors[0]
                              : draggedAptInfo?.docId;
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
                          handleColumnDrop(event, date, event.currentTarget)
                        }
                        role="presentation"
                      >
                        {lunchHeight > 0 && (
                          <div
                            className="pointer-events-none absolute left-0 right-0 z-0 border-y border-amber-100/70 bg-amber-50/55 dark:border-amber-900/20 dark:bg-amber-900/10"
                            style={{ top: lunchTop, height: lunchHeight }}
                            title="Öğle arası"
                          />
                        )}
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
                          const isSolid =
                            ["Onaylandı", "Geldi", "İşlemde", "Tamamlandı"].includes(
                              entry.appointment.status
                            );
                          const isCancelled =
                            entry.appointment.status === "İptal" ||
                            entry.appointment.status === "Gelmedi";
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
                              onDragStart={(event) =>
                                !isBlock &&
                                onDragStart(
                                  event,
                                  entry.doctorId,
                                  entry.date,
                                  entry.time,
                                  entry.appointment,
                                  entry.key
                                )
                              }
                              onDragEnd={onDragEnd}
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedAppointment(entry);
                              }}
                              onContextMenu={(event) => {
                                event.preventDefault();
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
                                  : isCancelled
                                  ? "#fff7f7"
                                  : "#ffffff",
                                borderColor: color,
                                color: isSolid ? "#ffffff" : color,
                              }}
                              title={`${title} · ${entry.time} · ${getDisplayStatus(
                                entry.appointment.status
                              )}`}
                            >
                              {isBlock ? (
                                <span className="truncate text-[10px] font-black">
                                  <i className="fa-solid fa-ban mr-1"></i>
                                  {title}
                                </span>
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
                                  <span className="absolute bottom-0.5 right-1 text-[9px] font-black">
                                    {isSolid ? (
                                      <i className="fa-solid fa-check"></i>
                                    ) : isCancelled ? (
                                      <i className="fa-solid fa-xmark text-rose-600"></i>
                                    ) : (
                                      <i className="fa-regular fa-calendar text-sky-600"></i>
                                    )}
                                  </span>
                                </>
                              )}
                            </button>
                          );
                        })}
                        {dayEntries.length === 0 && (
                          <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center text-[9px] font-semibold text-slate-300 dark:text-slate-700">
                            Boş saat
                          </div>
                        )}
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
                      const status = entry.appointment.status || "Yeni Kayıt";
                      return (
                        <tr
                          key={`${entry.doctorId}-${entry.key}`}
                          className="border-t border-slate-100 hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:bg-slate-800/60"
                        >
                          <td className="whitespace-nowrap px-2 py-1.5 font-black text-indigo-600 dark:text-indigo-300">
                            {entry.date.toLocaleDateString("tr-TR", {
                              day: "2-digit",
                              month: "2-digit",
                            })}{" "}
                            · {entry.time}
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
                                    {option.label}
                                  </option>
                                ))}
                              </select>
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

        <aside className="flex max-h-[34vh] min-h-[180px] w-full shrink-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:max-h-none lg:min-h-0 lg:w-[18%] lg:min-w-[210px]">
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

          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
            <div className="space-y-1">
              {specialtyDoctors.map((doctorId) => {
                const checked = selectedDoctorIds.includes(doctorId);
                const color = doctorColor(doctorId);
                const profile = globalData.doctorProfiles?.[doctorId] || {};
                const name =
                  globalData.systemUsers?.[doctorId]?.displayName ||
                  profile.name ||
                  doctorId;
                return (
                  <button
                    key={doctorId}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggleDoctor(doctorId)}
                    className={`flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1 text-left text-white transition hover:brightness-105 ${
                      checked ? "opacity-100" : "opacity-45 grayscale"
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-white bg-white/10">
                      {checked && (
                        <i className="fa-solid fa-check text-[8px] text-white"></i>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[10px] font-black">
                      {profile.title || globalData.systemUsers?.[doctorId]?.title || "Dt."}{" "}
                      {name}
                    </span>
                    {profile.availabilityStatus === "leave" && (
                      <span className="rounded bg-black/15 px-1 py-0.5 text-[8px] font-bold">
                        İzinli
                      </span>
                    )}
                  </button>
                );
              })}
              {specialtyDoctors.length === 0 && (
                <div className="rounded-md border border-dashed border-slate-200 px-2 py-5 text-center text-[10px] font-semibold text-slate-400 dark:border-slate-700">
                  Bu grupta hekim bulunmuyor.
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 p-1.5 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowExtraOptions((open) => !open)}
              aria-expanded={showExtraOptions}
              className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <i className={`fa-solid ${showExtraOptions ? "fa-chevron-down" : "fa-circle-plus"} text-indigo-500`}></i>
              Ek Seçenekler
            </button>
            {showExtraOptions && (
              <div className="mt-1 space-y-1.5 border-t border-slate-100 pt-1.5 dark:border-slate-800">
                <label className="flex items-center gap-2 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={hideEmptySlots}
                    onChange={(event) => setHideEmptySlots(event.target.checked)}
                    className="h-3 w-3 accent-indigo-600"
                  />
                  Boş saatleri gizle
                </label>
                <label className="flex items-center gap-2 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showOutsideHours}
                    onChange={(event) => setShowOutsideHours(event.target.checked)}
                    className="h-3 w-3 accent-indigo-600"
                  />
                  Mesai dışı saatleri göster
                </label>
                <button
                  type="button"
                  disabled={!canCreateAppointments || !defaultDoctorId}
                  onClick={openBlockModal}
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-left text-[9px] font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                >
                  <i className="fa-solid fa-ban mr-1.5 text-amber-500"></i>
                  Blokaj / İzin Ekle
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {selectedDetails && (
        <div
          className="fixed inset-0 z-[360] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm"
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
                <div className="flex flex-wrap gap-1">
                  {STATUS_OPTIONS.map((option) => (
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
                        setSelectedAppointment(null);
                      }}
                      className="rounded-md border border-slate-200 px-2 py-1 text-[9px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
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
          onClick={() => setBlockModalOpen(false)}
        >
          <form
            onSubmit={submitBlock}
            className="w-full max-w-sm space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-sm font-black text-slate-800 dark:text-white">
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
                <input
                  type="date"
                  required
                  value={blockForm.date}
                  onChange={(event) =>
                    setBlockForm({ ...blockForm, date: event.target.value })
                  }
                  className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[10px] font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
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
                  {[30, 60, 90, 120, 180, 240].map((duration) => (
                    <option key={duration} value={duration}>
                      {duration} dakika
                    </option>
                  ))}
                </select>
              </label>
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
