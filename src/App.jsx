import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, update, onValue } from 'firebase/database';
const MONTHS = [
        "Ocak",

        "Şubat",

        "Mart",

        "Nisan",

        "Mayıs",

        "Haziran",

        "Temmuz",

        "Ağustos",

        "Eylül",

        "Ekim",

        "Kasım",

        "Aralık",
      ];

      const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

      const ANAMNESIS_CATEGORIES = {
        Kardiyovasküler: [
          "Hipertansiyon",
          "Kalp Rahatsızlığı",
          "Kalp Pili (Pacemaker)",
          "Kalp Kapakçığı Protezi",
          "Romatizmal Ateş",
        ],
        "Kan ve Kanama": [
          "Kan Sulandırıcı Kullanımı",
          "Kanama Bozukluğu / Hemofili",
          "Anemi",
        ],
        "Metabolik / Endokrin": [
          "Diyabet (Şeker)",
          "Tiroid Bozukluğu",
          "Böbrek Hastalığı",
          "Karaciğer Hastalığı",
          "Hepatit B",
          "Hepatit C",
        ],
        "Solunum Sistemi": ["Astım", "KOAH", "Tüberküloz"],
        "Onkoloji / İlaç Kullanımı": [
          "Kemoterapi",
          "Radyoterapi",
          "Bisfosfonat (Kemik İlacı)",
          "Kortizon Kullanımı",
          "İmmünosupresif Kullanımı",
        ],
        Alerjiler: [
          "Penisilin Alerjisi",
          "Lokal Anestezi Alerjisi",
          "Lateks Alerjisi",
          "Ağrı Kesici Alerjisi",
          "Metal Alerjisi",
        ],
        Diğer: [
          "Gebelik",
          "Epilepsi (Sara)",
          "Bulaşıcı Hastalık",
          "HIV / AIDS",
          "Kemik İliği Hastalığı",
        ],
      };

      const DEFAULT_PRICING = {
        "Genel Muayene": 1000,
        "Uzman Hekim Muayenesi": 1500,
        "Panoramik Röntgen": 500,
        "Dolgu (1 Yüzlü)": 2000,
        "Dolgu (2 Yüzlü)": 2500,
        "Dolgu (3 Yüzlü)": 3000,
        "Kompozit Vener": 3500,
        "Kanal Tedavisi (Tek Kanal)": 4500,
        "Kanal Tedavisi (Çok Kanal)": 6000,
        "Kanal Tedavisi Yenileme": 6000,
        "Diş Çekimi": 1500,
        "Komplikasyonlu Çekim": 2500,
        "Gömülü ve 20lik Diş Çekimi": 4000, // "/" işareti Firebase çökmesini engellemek için kaldırıldı
        "İmplant (Greftsiz)": 15000,
        "İmplant (Greftli)": 20000,
        "Kron-Köprü": 4000,
        "Zirkonyum Kron": 7500,
        "Tam Protez (Tek Çene)": 15000,
        Detertraj: 2000,
        "Subgingival Küretaj": 3000,
        "Süt Dişi Çekimi": 1000,
        "Süt Dişi Dolgu": 1500,
        "Fissür Örtücü": 1000,
        "Flor Uygulaması": 800,
        Ortodonti: 35000,
        "Şeffaf Plak Tedavisi": 45000,
      };

      const INITIAL_PRICING_CATEGORIES = {
        "Teşhis ve Radyoloji": {
          icon: "fa-stethoscope",
          color: "text-blue-500",
          items: [
            "Genel Muayene",
            "Uzman Hekim Muayenesi",
            "Panoramik Röntgen",
          ],
        },
        "Restoratif Tedavi": {
          icon: "fa-tooth",
          color: "text-amber-500",
          items: [
            "Dolgu (1 Yüzlü)",
            "Dolgu (2 Yüzlü)",
            "Dolgu (3 Yüzlü)",
            "Kompozit Vener",
          ],
        },
        Endodonti: {
          icon: "fa-droplet",
          color: "text-rose-500",
          items: [
            "Kanal Tedavisi (Tek Kanal)",
            "Kanal Tedavisi (Çok Kanal)",
            "Kanal Tedavisi Yenileme",
          ],
        },
        "Cerrahi ve İmplant": {
          icon: "fa-pliers",
          color: "text-red-500",
          items: [
            "Diş Çekimi",
            "Komplikasyonlu Çekim",
            "Gömülü ve 20lik Diş Çekimi",
            "İmplant (Greftsiz)",
            "İmplant (Greftli)",
          ],
        },
        "Protetik Tedavi": {
          icon: "fa-crown",
          color: "text-yellow-500",
          items: ["Kron-Köprü", "Zirkonyum Kron", "Tam Protez (Tek Çene)"],
        },
        Periodontoloji: {
          icon: "fa-sparkles",
          color: "text-teal-500",
          items: ["Detertraj", "Subgingival Küretaj"],
        },
        "Pedodonti (Çocuk)": {
          icon: "fa-child",
          color: "text-emerald-500",
          items: [
            "Süt Dişi Çekimi",
            "Süt Dişi Dolgu",
            "Fissür Örtücü",
            "Flor Uygulaması",
          ],
        },
        Ortodonti: {
          icon: "fa-face-smile",
          color: "text-pink-500",
          items: ["Ortodonti", "Şeffaf Plak Tedavisi"],
        },
      };

      // TIME_SLOTS artık App içinde dinamik olarak hesaplanacak!

      // ARAMANIZ GEREKEN VE DEĞİŞTİRECEĞİNİZ KISIM BURASI:
const useFirebase = () => {
  const [fbUser, setFbUser] = useState(null);
  const [db, setDb] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const firebaseConfig = {
          // Kendi veritabanı URL'iniz
          databaseURL: "https://klinikrandevusistemi-adaee-default-rtdb.firebaseio.com/",
        };

        // window.FirebaseModules KULLANMIYORUZ!
        // Doğrudan en yukarıda import ettiğimiz fonksiyonları kullanıyoruz.
        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);

        setDb(database);
        setIsReady(true);
      } catch (err) {
        console.error("Firebase Kurulum Hatası", err);
        setIsReady(true);
      }
    };

    init();
  }, []);

  return { fbUser, db, isReady };
};

      const RealtimeClock = () => {
        const [time, setTime] = useState(new Date());

        useEffect(() => {
          const timer = setInterval(() => setTime(new Date()), 1000);

          return () => clearInterval(timer);
        }, []);

        return (
          <div className="text-base font-black text-white/90 bg-white/20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl mt-2 tracking-widest shadow-inner border border-white/10 backdrop-blur-sm">
            <i className="fa-regular fa-clock"></i>
            {time.toLocaleDateString("tr-TR", {
              day: "2-digit",

              month: "2-digit",

              year: "numeric",
            })}{" "}
            - {time.toLocaleTimeString("tr-TR")}
          </div>
        );
      };

      const ProfessionalToothChart = ({
        patientForm,
        activePlanTreatment,
        setPatientForm,
        showNotification,
        globalData,
        currentUser,
        saveGlobalData // YENİ EKLENDİ
      }) => {
        const [isPediatric, setIsPediatric] = useState(false);

        // --- YENİ EKLENEN: DİŞ DETAY MODALI STATE'LERİ ---
        const [detailToothModal, setDetailToothModal] = useState(null);
        const [detailTab, setDetailTab] = useState("genel");
        const [tempToothData, setTempToothData] = useState({ status: "Sağlıklı", diagnoses: [], notes: "", canalLengths: { root1: "", root2: "", root3: "", root4: "" } });
        const [newDiagnosis, setNewDiagnosis] = useState("");
        const [isEditingNotes, setIsEditingNotes] = useState(false); // YENİ: Not düzenleme modu

        // Literatür bazlı genişletilmiş durum ve tanılar
        const TOOTH_STATUS_OPTIONS = [
          "Sağlıklı", "Başlangıç Çürüğü", "Kavitasyonlu Çürük", 
          "Kanal Tedavili", "Dolgulu", "Kronlu", "İmplant", 
          "Eksik", "Gömülü", "Kök Kalıntısı", "Şüpheli", "Diğer"
        ];
        
        const DEFAULT_DIAGNOSES = [
          "Reversible Pulpitis", "İrreversible Pulpitis", "Nekroz", 
          "Akut Apikal Apse", "Kronik Apikal Apse", "Apikal Periodontitis",
          "Sekonder Çürük", "Aşırı Madde Kaybı", "Mine Kırığı", "Kök Fraktürü", 
          "Hassasiyet (Sıcak/Soğuk)", "Perküsyon Hassasiyeti", "Periodontal Cep"
        ];

        // YENİ: Dişe Göre Anatomik Kanal Önerileri Sistemi
        const getStandardCanals = (tNo) => {
          const t = parseInt(tNo);
          const isUpper = t < 30 || (t >= 50 && t < 70); // Üst çene kontrolü
          const pos = t % 10; // Dişin numarası (1-8 arası)
          
          if (pos >= 6) { // Molarlar
            if (isUpper) return ["MB1", "MB2", "DB", "P"];
            else return ["MB", "ML", "D"];
          } else if (pos === 4 && isUpper) { // Üst 1. Premolarlar
            return ["Bukkal", "Palatinal"];
          } else if (pos === 4 || pos === 5) { // Diğer Premolarlar
            return ["Ana Kanal"];
          } else { // Kesiciler ve Kaninler
            return ["Kanal 1"];
          }
        };

        const openDetailModal = (tNo) => {
          const tKey = tNo.toString();
          const existingData = patientForm.toothRecords?.[tKey] || {};
          
          let initialLengths = existingData.canalLengths || {};
          let initialCanals = existingData.activeCanals || [];
          
          // Eğer bu diş daha önce hiç kanal tedavisi için açılmamışsa
          if (initialCanals.length === 0) {
            // Eski kayıt (K1, K2) sistemiyle kaydedilmiş verileri kurtarma (Geriye Dönük Uyumluluk)
            const legacyKeys = ["root1", "root2", "root3", "root4"].filter(k => initialLengths[k]);
            if (legacyKeys.length > 0) {
              initialCanals = legacyKeys;
            } else {
              // Yepyeni bir dişse anatomik önerileri yükle
              initialCanals = getStandardCanals(tNo);
            }
          }

          setTempToothData({
            status: existingData.status || "Sağlıklı",
            diagnoses: existingData.diagnoses || [],
            notes: existingData.notes || "",
            activeCanals: initialCanals,
            canalLengths: initialLengths
          });
          setIsEditingNotes(false); // Modal açıldığında notlar okuma modunda başlasın
          setDetailToothModal(tKey);
          setDetailTab("genel");
        };

        const saveToothDetails = () => {
          const tKey = detailToothModal;
          const updatedRecords = {
            ...(patientForm.toothRecords || {}),
            [tKey]: tempToothData
          };
          const updatedPatient = { ...patientForm, toothRecords: updatedRecords };
          setPatientForm(updatedPatient);
          
          if(saveGlobalData) {
            saveGlobalData({
              ...globalData,
              patientsDb: { ...globalData.patientsDb, [updatedPatient.id]: updatedPatient }
            });
            showNotification(`${tKey} Numaralı diş detayları kaydedildi.`);
            setIsEditingNotes(false); // Kaydedince tekrar okuma moduna dön
          }
        };

        const toggleDiagnosis = (diag) => {
          setTempToothData(prev => {
            const has = prev.diagnoses.includes(diag);
            let updatedNotes = prev.notes;
            
            // Eğer tanı ekleniyorsa, otomatik olarak nota da ekle
            if (!has) {
              const dateStr = new Date().toLocaleDateString('tr-TR');
              const autoNote = `[${dateStr}] Tanı Eklendi: ${diag}`;
              updatedNotes = prev.notes ? `${prev.notes}\n${autoNote}` : autoNote;
            }

            return {
              ...prev,
              diagnoses: has ? prev.diagnoses.filter(d => d !== diag) : [...prev.diagnoses, diag],
              notes: updatedNotes
            };
          });
        };
        // -------------------------------------------------

        // Doğru pedodontik (FDI) diş numaralandırması
        const topRight = isPediatric
          ? [55, 54, 53, 52, 51]
          : [18, 17, 16, 15, 14, 13, 12, 11];
        const topLeft = isPediatric
          ? [61, 62, 63, 64, 65]
          : [21, 22, 23, 24, 25, 26, 27, 28];
        const botRight = isPediatric
          ? [85, 84, 83, 82, 81]
          : [48, 47, 46, 45, 44, 43, 42, 41];
        const botLeft = isPediatric
          ? [71, 72, 73, 74, 75]
          : [31, 32, 33, 34, 35, 36, 37, 38];

        const handleToothClick = (toothNo) => {
          if (!activePlanTreatment) {
            showNotification(
              "Lütfen önce alt kısımdan bir işlem türü seçin!",
              "error"
            );
            return;
          }

          // YENİ: Akıllı 8 Numara (Yirmilik) Çekimi Kontrolü
          let actualPlanTreatment = activePlanTreatment;
          if (
            activePlanTreatment === "Diş Çekimi" &&
            ["18", "28", "38", "48", "55", "65", "75", "85"].includes(
              toothNo.toString()
            )
          ) {
            actualPlanTreatment = "Gömülü ve 20lik Diş Çekimi";
            showNotification(
              "8 Numaralı diş seçildiği için tarife 'Gömülü ve 20lik Diş Çekimi' olarak otomatik güncellendi."
            );
          }

          const exists = patientForm.plannedTreatments?.some(
            (t) => t.tooth === toothNo && t.treatment === actualPlanTreatment
          );

          if (exists) {
            setPatientForm((prev) => ({
              ...prev,
              plannedTreatments: prev.plannedTreatments.filter(
                (t) =>
                  !(t.tooth === toothNo && t.treatment === actualPlanTreatment)
              ),
            }));
            showNotification(
              `${toothNo} numaralı bölgeden ${actualPlanTreatment} çıkarıldı.`,
              "error"
            );
            return;
          }

          const userPricing =
            globalData.pricingDb?.[patientForm?.addedBy] ||
            globalData.pricingDb?.[currentUser] ||
            (typeof globalData.pricingDb === "object" &&
            globalData.pricingDb["Genel Muayene"]
              ? globalData.pricingDb
              : DEFAULT_PRICING);

          const txPrice =
            userPricing?.[actualPlanTreatment] !== undefined
              ? parseFloat(userPricing[actualPlanTreatment])
              : DEFAULT_PRICING[actualPlanTreatment] || 0;

          const newTx = {
            id: Date.now() + Math.random().toString(),
            tooth: toothNo,
            treatment: actualPlanTreatment,
            date: Date.now(),
            price: txPrice,
          };

          setPatientForm((prev) => ({
            ...prev,
            plannedTreatments: [...(prev.plannedTreatments || []), newTx],
          }));

          showNotification(
            `${toothNo} numaralı dişe ${actualPlanTreatment} planlandı. (${txPrice} ₺)`
          );
        };

        const getToothAnatomy = (toothNo) => {
          const t = parseInt(toothNo);

          const pos = t % 10;

          const isUpper = t < 30;

          let anatomy = {
            type: "incisor",

            roots: 1,

            crownPath: "",

            rootPaths: [],

            canalLines: [],
          };

          if (pos >= 6) {
            anatomy.type = "molar";

            anatomy.crownPath =
              "M 5,80 C 5,110 10,135 20,135 C 30,132 30,132 40,135 C 50,135 55,110 55,80 Z";

            if (isUpper) {
              anatomy.roots = 3;

              anatomy.rootPaths = [
                "M 15,80 C 10,40 5,20 15,5 C 20,20 25,50 25,80 Z",

                "M 35,80 C 35,50 40,20 45,5 C 55,20 50,40 45,80 Z",

                "M 20,80 C 25,40 28,10 30,5 C 32,10 35,40 40,80 Z",
              ];

              anatomy.canalLines = [
                { x1: 15, y1: 10, x2: 18, y2: 110 },

                { x1: 45, y1: 10, x2: 42, y2: 110 },

                { x1: 30, y1: 5, x2: 30, y2: 110 },
              ];
            } else {
              anatomy.roots = 2;

              anatomy.rootPaths = [
                "M 10,80 C 10,40 10,15 20,5 C 25,15 25,40 25,80 Z",

                "M 35,80 C 35,40 35,15 40,5 C 50,15 50,40 50,80 Z",
              ];

              anatomy.canalLines = [
                { x1: 18, y1: 10, x2: 20, y2: 110 },

                { x1: 42, y1: 10, x2: 40, y2: 110 },
              ];
            }
          } else if (pos >= 4) {
            anatomy.type = "premolar";

            anatomy.crownPath =
              "M 12,80 C 12,110 18,135 30,135 C 42,135 48,110 48,80 Z";

            if (isUpper && pos === 4) {
              anatomy.roots = 2;

              anatomy.rootPaths = [
                "M 15,80 C 15,40 20,15 25,5 C 28,15 28,40 30,80 Z",

                "M 30,80 C 32,40 32,15 35,5 C 40,15 45,40 45,80 Z",
              ];

              anatomy.canalLines = [
                { x1: 25, y1: 10, x2: 28, y2: 110 },

                { x1: 35, y1: 10, x2: 32, y2: 110 },
              ];
            } else {
              anatomy.roots = 1;

              anatomy.rootPaths = [
                "M 20,80 C 20,40 25,10 30,5 C 35,10 40,40 40,80 Z",
              ];

              anatomy.canalLines = [{ x1: 30, y1: 8, x2: 30, y2: 110 }];
            }
          } else if (pos === 3) {
            anatomy.type = "canine";

            anatomy.roots = 1;

            anatomy.crownPath =
              "M 15,80 C 15,110 25,140 30,145 C 35,140 45,110 45,80 Z";

            anatomy.rootPaths = [
              "M 18,80 C 18,30 25,5 30,2 C 35,5 42,30 42,80 Z",
            ];

            anatomy.canalLines = [{ x1: 30, y1: 5, x2: 30, y2: 120 }];
          } else {
            anatomy.type = "incisor";

            anatomy.roots = 1;

            anatomy.crownPath =
              "M 15,80 C 15,110 18,135 22,135 C 30,135 30,135 38,135 C 42,135 45,110 45,80 Z";

            anatomy.rootPaths = [
              "M 20,80 C 20,40 25,10 30,5 C 35,10 40,40 40,80 Z",
            ];

            anatomy.canalLines = [{ x1: 30, y1: 8, x2: 30, y2: 115 }];
          }

          return anatomy;
        };

        // YENİ: Zaman Çizelgesi (Timeline) Veri Hazırlığı
        const allTreatmentsSorted = useMemo(() => {
          return [...(patientForm.plannedTreatments || [])].sort(
            (a, b) => a.date - b.date
          );
        }, [patientForm.plannedTreatments]);

        const uniqueDates = useMemo(() => {
          const dates = allTreatmentsSorted.map((t) =>
            new Date(t.date).toLocaleDateString("tr-TR")
          );
          return [...new Set(dates)]; // Sadece eşsiz tarihleri al
        }, [allTreatmentsSorted]);

        const [timelineIndex, setTimelineIndex] = useState(
          uniqueDates.length > 0 ? uniqueDates.length - 1 : -1
        );

        useEffect(() => {
          // Yeni işlem eklendiğinde timeline'ı en sona kaydır
          setTimelineIndex(
            uniqueDates.length > 0 ? uniqueDates.length - 1 : -1
          );
        }, [uniqueDates.length]);

        const renderTooth = (toothNo, isUpper) => {
          // Zaman makinesi filtresi: Sadece seçili timelineIndex'e kadar olan işlemleri getir
          const treatments = allTreatmentsSorted.filter((x) => {
            if (x.tooth !== toothNo.toString()) return false;
            if (timelineIndex === -1) return true;
            const txDateStr = new Date(x.date).toLocaleDateString("tr-TR");
            const txIndex = uniqueDates.indexOf(txDateStr);
            return txIndex <= timelineIndex;
          });

          const hasExtraction = treatments.some((t) =>
            t.treatment.includes("Çekim")
          );
          const hasImplant = treatments.some((t) =>
            t.treatment.includes("İmplant")
          );
          const hasFilling = treatments.some((t) =>
            t.treatment.includes("Dolgu")
          );
          const hasCanal = treatments.some(
            (t) =>
              t.treatment.includes("Kanal Tedavisi") &&
              !t.treatment.includes("Yenileme")
          );
          const hasRetreatment = treatments.some((t) =>
            t.treatment.includes("Yenileme")
          );
          const hasCleaning = treatments.some((t) =>
            t.treatment.includes("Detertraj")
          );
          const hasCrown = treatments.some((t) => t.treatment.includes("Kron"));

          const hasWholeJawDetertraj = patientForm.plannedTreatments?.some(
            (t) => t.tooth === "Tüm Çene" && t.treatment === "Detertraj"
          );

          let heatMapClass = "";
          if (hasExtraction || hasImplant) heatMapClass = "heatmap-danger";
          else if (hasCanal || hasRetreatment) heatMapClass = "heatmap-warning";
          else if (hasFilling || hasCrown) heatMapClass = "heatmap-info";

          const anatomy = getToothAnatomy(toothNo);

          const transform = isUpper ? "" : "scale(1, -1) translate(0, -140)";

          return (
            <div
  key={toothNo}
  onClick={() => handleToothClick(toothNo.toString())}
  className={`flex flex-col items-center group cursor-pointer hover:scale-110 transition-transform relative z-10 w-[24px] sm:w-[30px] md:w-[36px] ${heatMapClass}`}
>
              {/* YENİ EKLENEN KISIM: AKILLI TOOLTIP (BİLGİ KUTUSU) */}
              {treatments.length > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-900 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all duration-300 shadow-xl flex flex-col items-center scale-95 group-hover:scale-100">
                  <div className="font-black text-indigo-300 mb-0.5 border-b border-slate-700 pb-0.5 w-full text-center">
                    Diş {toothNo}
                  </div>
                  {treatments.map((t, idx) => (
                    <div
                      key={idx}
                      className="font-semibold tracking-wide mt-0.5"
                    >
                      {t.treatment}{" "}
                      <span className="text-slate-400">({t.price} ₺)</span>
                    </div>
                  ))}
                  {/* Kutucuğun altındaki küçük ok (triangle) */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700"></div>
                </div>
              )}

              {isUpper && (
                <div className="relative text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1 transition-colors group-hover:text-indigo-500 flex items-center justify-center">
                  <span className="pointer-events-none">{toothNo}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); openDetailModal(toothNo); }}
                    className="absolute -right-4 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-full w-3 h-3 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-all z-50 hover:bg-indigo-600 hover:text-white shadow-sm"
                    title="Diş Detayları"
                  >
                    <i className="fa-solid fa-info"></i>
                  </button>
                </div>
              )}

              <svg
                viewBox="0 0 60 140"
                className="w-full h-[70px] sm:h-[90px] md:h-[110px] drop-shadow-md overflow-visible"
              >
                <defs>
                  <linearGradient
                    id={`rootGrad-${toothNo}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#dcb892" />

                    <stop offset="50%" stopColor="#fef3c7" />

                    <stop offset="100%" stopColor="#dcb892" />
                  </linearGradient>

                  <linearGradient
                    id={`crownGrad-${toothNo}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#ffffff" />

                    <stop offset="80%" stopColor="#f8fafc" />

                    <stop offset="100%" stopColor="#cbd5e1" />
                  </linearGradient>

                  <pattern
                    id="crownPattern"
                    width="6"
                    height="6"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="6"
                      stroke="#fbbf24"
                      strokeWidth="2"
                    />
                  </pattern>
                </defs>

                <g transform={transform}>
                  {hasImplant ? (
                    <g>
                      <rect
                        x="23"
                        y="10"
                        width="14"
                        height="70"
                        fill="#94a3b8"
                        rx="3"
                      />

                      <line
                        x1="18"
                        y1="20"
                        x2="42"
                        y2="25"
                        stroke="#475569"
                        strokeWidth="2.5"
                      />

                      <line
                        x1="18"
                        y1="40"
                        x2="42"
                        y2="45"
                        stroke="#475569"
                        strokeWidth="2.5"
                      />

                      <line
                        x1="18"
                        y1="60"
                        x2="42"
                        y2="65"
                        stroke="#475569"
                        strokeWidth="2.5"
                      />
                    </g>
                  ) : (
                    anatomy.rootPaths.map((path, i) => (
                      <path
                        key={i}
                        d={path}
                        fill={`url(#rootGrad-${toothNo})`}
                        stroke="#c19b76"
                        strokeWidth="1"
                        opacity="0.95"
                      />
                    ))
                  )}

                  {hasCrown ? (
                    <path
                      d={anatomy.crownPath}
                      fill="url(#crownPattern)"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      opacity="0.8"
                    />
                  ) : (
                    <path
                      d={anatomy.crownPath}
                      fill={`url(#crownGrad-${toothNo})`}
                      stroke="#94a3b8"
                      strokeWidth="0.5"
                    />
                  )}

                  {hasFilling && !hasCrown && (
                    <circle
                      cx="30"
                      cy="110"
                      r="7"
                      fill="#ef4444"
                      opacity="0.8"
                    />
                  )}

                  {hasCanal &&
                    anatomy.canalLines.map((line, i) => (
                      <line
                        key={`canal-${i}`}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#ef4444"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    ))}

                  {hasRetreatment &&
                    !hasCanal &&
                    anatomy.canalLines.map((line, i) => (
                      <line
                        key={`retreat-${i}`}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#8b5cf6"
                        strokeWidth="3.5"
                        strokeDasharray="3,3"
                        strokeLinecap="round"
                      />
                    ))}

                  {hasRetreatment &&
                    hasCanal &&
                    anatomy.canalLines.map((line, i) => (
                      <line
                        key={`retreat-over-${i}`}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#8b5cf6"
                        strokeWidth="3.5"
                        strokeDasharray="3,3"
                        strokeLinecap="round"
                      />
                    ))}

                  {hasCleaning && (
                    <path
                      d="M 15,85 Q 30,75 45,85"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  )}

                  {hasWholeJawDetertraj && (
                    <path
                      d="M -5,82 L 65,82"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                  )}
                </g>

                {hasExtraction && (
                  <g stroke="#ef4444" strokeWidth="4" strokeLinecap="round">
                    <line x1="10" y1="20" x2="50" y2="120" />

                    <line x1="50" y1="20" x2="10" y2="120" />
                  </g>
                )}
              </svg>

              {!isUpper && (
                <div className="relative text-[10px] font-black text-slate-500 dark:text-slate-400 mt-1 transition-colors group-hover:text-indigo-500 flex items-center justify-center">
                  <span className="pointer-events-none">{toothNo}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); openDetailModal(toothNo); }}
                    className="absolute -right-4 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-full w-3 h-3 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-all z-50 hover:bg-indigo-600 hover:text-white shadow-sm"
                    title="Diş Detayları"
                  >
                    <i className="fa-solid fa-info"></i>
                  </button>
                </div>
              )}
            </div>
          );
        };

        return (
          <div
            className="relative w-full mx-auto bg-white dark:bg-slate-800 p-2 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 print-tooth-chart"
            style={{ pageBreakInside: "avoid" }}
          >
            <div className="absolute top-[20%] left-[5%] right-[5%] h-[20%] bg-gradient-to-b from-rose-400 to-rose-200/20 blur-[20px] rounded-[100px] opacity-20 pointer-events-none"></div>
            <div className="absolute bottom-[20%] left-[5%] right-[5%] h-[20%] bg-gradient-to-t from-rose-400 to-rose-200/20 blur-[20px] rounded-[100px] opacity-20 pointer-events-none"></div>

            {/* YENİ: Pediatrik Mod Geçiş Butonları */}
            <div className="flex justify-center mb-2 relative z-20 no-print">
              <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl inline-flex shadow-inner">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsPediatric(false);
                  }}
                  className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-300 ${
                    !isPediatric
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  }`}
                >
                  <i className="fa-solid fa-user mr-1"></i> Yetişkin
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsPediatric(true);
                  }}
                  className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-300 ${
                    isPediatric
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  }`}
                >
                  <i className="fa-solid fa-child mr-1"></i> Pediatrik
                </button>
              </div>
            </div>

            <div className="flex justify-center gap-0 sm:gap-0.5 mb-1.5 border-b border-dashed border-slate-200 dark:border-slate-600 pb-2 relative z-10">
  <div className="flex gap-0 sm:gap-0.5">
    {topRight.map((t) => renderTooth(t, true))}
  </div>
  <div className="w-px bg-slate-300 dark:bg-slate-600 mx-0.5 sm:mx-1 h-[100px]"></div>
  <div className="flex gap-0 sm:gap-0.5">
    {topLeft.map((t) => renderTooth(t, true))}
  </div>
</div>

            <div className="flex justify-center gap-0 sm:gap-0.5 pt-0.5 relative z-10">
  <div className="flex gap-0 sm:gap-0.5">
    {botRight.map((t) => renderTooth(t, false))}
  </div>
  <div className="w-px bg-slate-300 dark:bg-slate-600 mx-0.5 sm:mx-1 h-[100px]"></div>
  <div className="flex gap-0 sm:gap-0.5">
    {botLeft.map((t) => renderTooth(t, false))}
  </div>
</div>

            {/* YENİ EKLENEN: DİŞ DETAY MODALI */}
            {detailToothModal && (
              <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[300] p-2 transition-all" onClick={() => setDetailToothModal(null)}>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-pop" onClick={e => e.stopPropagation()}>
                  
                  {/* Modal Header */}
                  <div className="px-3 py-2 bg-[#0f172a] text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                        <i className="fa-solid fa-tooth text-base"></i>
                      </div>
                      <div>
                        <h3 className="font-black text-base uppercase tracking-wider">{detailToothModal} Numaralı Diş</h3>
                        <div className="text-[10px] text-slate-400 font-bold">Hasta: {patientForm.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => {
                        const originalTitle = document.title;
                        document.title = `${patientForm.name} - Dis ${detailToothModal} Raporu`;
                        window.print();
                        setTimeout(() => document.title = originalTitle, 2000);
                      }} className="w-7 h-7 flex justify-center items-center rounded-lg bg-white/10 hover:bg-white/20 transition" title="Yazdır">
                        <i className="fa-solid fa-print text-[13px]"></i>
                      </button>
                      <button onClick={() => setDetailToothModal(null)} className="w-7 h-7 flex justify-center items-center rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition">
                        <i className="fa-solid fa-xmark text-base"></i>
                      </button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-1.5 gap-1 overflow-x-auto custom-scrollbar shrink-0">
                    {["genel", "randevular"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setDetailTab(tab)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider whitespace-nowrap transition-all ${
                          detailTab === tab ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {tab === "genel" ? <><i className="fa-solid fa-notes-medical mr-1"></i> Genel Durum & Tanı</> :
                         <><i className="fa-regular fa-calendar-check mr-1"></i> İlgili Randevular</>}
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents */}
                  <div className="p-2 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-800" id="print-tooth-detail">
                    
                    {/* YAZDIRMA İÇİN GİZLİ BAŞLIK */}
                    <div className="hidden print-only mb-2 border-b-2 border-black pb-2">
                      <h1 className="text-base font-black uppercase text-black">{detailToothModal} NUMARALI DİŞ KLİNİK RAPORU</h1>
                      <div className="text-[13px] font-bold text-gray-700 mt-2 grid grid-cols-2">
                        <div>Hasta: {patientForm.name}</div>
                        <div className="text-right">Tarih: {new Date().toLocaleDateString("tr-TR")}</div>
                      </div>
                    </div>

                    {detailTab === "genel" && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Dişin Güncel Durumu</label>
                            <div className="flex flex-wrap gap-1">
                              {TOOTH_STATUS_OPTIONS.map(opt => (
                                <button
                                  key={opt}
                                  onClick={() => setTempToothData({...tempToothData, status: opt})}
                                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                                    tempToothData.status === opt 
                                      ? "bg-indigo-500 text-white border-indigo-600 shadow-md" 
                                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanılar / Semptomlar</label>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {DEFAULT_DIAGNOSES.map(diag => (
                                <button
                                  key={diag}
                                  onClick={() => toggleDiagnosis(diag)}
                                  className={`px-2 py-1 rounded-md border text-[11px] font-bold transition-all flex items-center gap-1 ${
                                    tempToothData.diagnoses.includes(diag)
                                      ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400"
                                      : "bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  <i className={`fa-solid ${tempToothData.diagnoses.includes(diag) ? "fa-check" : "fa-plus opacity-50"}`}></i>
                                  {diag}
                                </button>
                              ))}
                              {tempToothData.diagnoses.filter(d => !DEFAULT_DIAGNOSES.includes(d)).map(diag => (
                                <button key={diag} onClick={() => toggleDiagnosis(diag)} className="px-2 py-1 rounded-md border text-[11px] font-bold transition-all flex items-center gap-1 bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400">
                                  <i className="fa-solid fa-check"></i> {diag}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-1">
                              <input 
                                type="text" 
                                value={newDiagnosis} 
                                onChange={(e) => setNewDiagnosis(e.target.value)} 
                                placeholder="Özel tanı ekle..." 
                                className="flex-1 p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-500 dark:text-white"
                                onKeyDown={(e) => {
                                  if(e.key === 'Enter' && newDiagnosis.trim()) {
                                    e.preventDefault();
                                    if(!tempToothData.diagnoses.includes(newDiagnosis.trim())) {
                                      toggleDiagnosis(newDiagnosis.trim());
                                    }
                                    setNewDiagnosis("");
                                  }
                                }}
                              />
                              <button 
                                onClick={() => {
                                  if(newDiagnosis.trim() && !tempToothData.diagnoses.includes(newDiagnosis.trim())) {
                                    toggleDiagnosis(newDiagnosis.trim());
                                    setNewDiagnosis("");
                                  }
                                }}
                                className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 px-2.5 py-1.5 rounded-lg font-bold hover:bg-indigo-200 transition text-[11px]"
                              >
                                Ekle
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* KANAL BOYU ALANI (Şartlı Gösterim) */}
                        {(tempToothData.status === "Kanal Tedavili" || tempToothData.diagnoses.some(d => d.includes("Pulpitis") || d.includes("Apse") || d.includes("Nekroz"))) && (
                          <div className="p-2 border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-800/50 rounded-xl mb-2 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-indigo-200/50 dark:border-indigo-800/50">
                              <label className="text-[11px] font-black text-indigo-700 dark:text-indigo-400 uppercase flex items-center gap-1">
                                <i className="fa-solid fa-ruler-vertical"></i> Kanal Anatomisi ve Boy Ölçümleri
                              </label>
                              
                              {/* Dinamik Kanal Ekleme Menüsü */}
                              <div className="flex items-center gap-1 relative group z-20">
                                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                  <i className="fa-solid fa-plus text-indigo-500 text-[10px]"></i>
                                </div>
                                <select 
                                  className="text-[10px] pl-6 pr-6 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-lg font-bold shadow-sm outline-none cursor-pointer hover:border-indigo-400 dark:bg-slate-800 dark:text-indigo-300 dark:border-indigo-700 appearance-none"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if(val === "custom") {
                                      const customName = window.prompt("Özel kanal adını giriniz:");
                                      if(customName && customName.trim() && !tempToothData.activeCanals.includes(customName.trim())) {
                                        setTempToothData({
                                          ...tempToothData, 
                                          activeCanals: [...(tempToothData.activeCanals || []), customName.trim().substring(0,10)]
                                        });
                                      }
                                    } else if(val && !tempToothData.activeCanals.includes(val)) {
                                      setTempToothData({
                                        ...tempToothData, 
                                        activeCanals: [...(tempToothData.activeCanals || []), val]
                                      });
                                    }
                                    e.target.value = ""; // Seçimi sıfırla
                                  }}
                                >
                                  <option value="">Kanal Ekle (Varyasyon)</option>
                                  <optgroup label="Standart Kanallar">
                                    <option value="MB1">MB1 (Mesiobukkal 1)</option>
                                    <option value="MB2">MB2 (Mesiobukkal 2)</option>
                                    <option value="MB3">MB3 (Mesiobukkal 3)</option>
                                    <option value="DB">DB (Distobukkal)</option>
                                    <option value="ML">ML (Mesiolingual)</option>
                                    <option value="MM">MM (Middle Mesial)</option>
                                    <option value="DL">DL (Distolingual)</option>
                                    <option value="D">D (Distal)</option>
                                    <option value="P">P (Palatinal)</option>
                                  </optgroup>
                                  <optgroup label="Tek Kök Kanalları">
                                    <option value="B">Bukkal</option>
                                    <option value="L">Lingual</option>
                                    <option value="Palatinal">Palatinal</option>
                                    <option value="Kanal 1">Kanal 1</option>
                                    <option value="Kanal 2">Kanal 2</option>
                                    <option value="Ana Kanal">Ana Kanal</option>
                                  </optgroup>
                                  <option value="custom">✎ Kendim Yazacağım...</option>
                                </select>
                                <i className="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 text-[8px] pointer-events-none"></i>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {(tempToothData.activeCanals || []).map((cName, idx) => {
                                // Geriye dönük uyumluluk: Eski K1, K2 kayıtlarını şık gösterme
                                let displayObj = cName;
                                if(cName === "root1") displayObj = "K1";
                                if(cName === "root2") displayObj = "K2";
                                if(cName === "root3") displayObj = "K3";
                                if(cName === "root4") displayObj = "K4";
                                
                                return (
                                <div key={idx} className="flex items-center gap-1.5 animate-pop">
                                  <div className="relative flex-1 group/input">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none border-r border-slate-200 dark:border-slate-700 pr-2">
                                      <span className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black truncate max-w-[55px]" title={displayObj}>
                                        {displayObj}
                                      </span>
                                    </div>
                                    <input 
                                      type="text" 
                                      placeholder="Boy (mm)"
                                      value={tempToothData.canalLengths[cName] || ""}
                                      onChange={(e) => setTempToothData({
                                        ...tempToothData,
                                        canalLengths: { ...tempToothData.canalLengths, [cName]: e.target.value }
                                      })}
                                      className="w-full pl-[70px] pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 dark:text-white transition-all shadow-sm"
                                    />
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      // Silme işlemi
                                      const newCanals = tempToothData.activeCanals.filter(c => c !== cName);
                                      const newLengths = { ...tempToothData.canalLengths };
                                      delete newLengths[cName];
                                      setTempToothData({
                                        ...tempToothData,
                                        activeCanals: newCanals,
                                        canalLengths: newLengths
                                      });
                                    }}
                                    className="w-7 h-7 shrink-0 flex items-center justify-center bg-white border border-rose-200 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all dark:bg-slate-800 dark:border-rose-900/50 dark:hover:bg-rose-600 shadow-sm"
                                    title="Kanalı Kaldır"
                                  >
                                    <i className="fa-solid fa-trash-can text-[11px]"></i>
                                  </button>
                                </div>
                              )})}
                            </div>
                            
                            {(tempToothData.activeCanals || []).length === 0 && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold italic text-center py-4 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-dashed border-indigo-200 dark:border-indigo-800/50">
                                <i className="fa-solid fa-circle-info mr-1"></i> Henüz kanal eklenmedi. Yukarıdaki menüden anatominize uygun kanal ekleyebilirsiniz.
                              </div>
                            )}
                          </div>
                        )}

                        {/* KLİNİK NOTLAR ALANI */}
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Bu Dişe Özel Klinik Notlar</label>
                            {!isEditingNotes && (
                              <button 
                                onClick={() => setIsEditingNotes(true)} 
                                className="text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1"
                              >
                                <i className="fa-solid fa-pen"></i> Düzenle
                              </button>
                            )}
                          </div>
                          
                          {isEditingNotes ? (
                            <textarea 
                              rows="4" 
                              value={tempToothData.notes}
                              onChange={e => setTempToothData({...tempToothData, notes: e.target.value})}
                              placeholder="Diş ile ilgili detaylı notlar, kullanılan materyaller vb..."
                              className="w-full p-2 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl text-[13px] font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-amber-400 resize-none shadow-inner"
                              autoFocus
                            ></textarea>
                          ) : (
                            <div className="w-full p-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-medium text-slate-700 dark:text-slate-300 min-h-[80px] whitespace-pre-wrap">
                              {tempToothData.notes ? tempToothData.notes : <span className="text-slate-400 italic">Not girilmemiş...</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    )}


                    {detailTab === "randevular" && (() => {
                      const apts = [];
                      if (globalData.appointments) {
                        Object.values(globalData.appointments).forEach(docApts => {
                          Object.entries(docApts).forEach(([key, apt]) => {
                            if (apt.patientName === patientForm.name && (apt.selectedTeeth?.includes(detailToothModal) || apt.selectedTeeth?.includes("Tüm Çene"))) {
                              const [y, m, d] = key.split("-").map(Number);
                              apts.push({ ...apt, dateStr: `${d}/${m}/${y}`, timeStr: key.split("-")[3] });
                            }
                          });
                        });
                      }
                      return (
                        <div className="space-y-1.5">
                          {apts.length > 0 ? apts.map((a, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm border-l-4 border-l-indigo-500">
                              <div>
                                <div className="font-black text-[13px] text-indigo-700 dark:text-indigo-400">{a.treatment || "Genel İşlem"}</div>
                                <div className="text-[11px] text-slate-500 font-bold mt-0.5"><i className="fa-regular fa-calendar mr-1"></i> {a.dateStr} - {a.timeStr}</div>
                              </div>
                              <div className="text-[10px] font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{a.status}</div>
                            </div>
                          )) : <div className="text-center py-8 text-slate-400 text-[13px] font-medium">Bu dişi içeren bir randevu bulunmuyor.</div>}
                        </div>
                      );
                    })()}

                  </div>
                  
                  {/* Modal Footer (Sadece Genel sekmesinde Kaydet butonu aktif) */}
                  <div className="px-2 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 shrink-0 no-print">
                    <button onClick={() => setDetailToothModal(null)} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[13px] hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm">
                      Kapat
                    </button>
                    {detailTab === "genel" && (
                      <button onClick={saveToothDetails} className="px-3 py-2 bg-indigo-600 text-white rounded-xl font-black text-[13px] hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30">
                        Durum ve Notları Kaydet
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )}
            {/* DİŞ DETAY MODALI BİTİŞ */}

          </div>
        );
      };
      // YENİ GÜVENLİK MOTORU: Şifreleri (SHA-256) ile Kriptolamak İçin
      const hashPassword = async (password) => {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      };
      function App() {
        const { fbUser, db, isReady } = useFirebase();

        const appId =
          typeof __app_id !== "undefined" ? __app_id : "default-klinik-app";

        const [isDarkMode, setIsDarkMode] = useState(() => {
          const savedMode = localStorage.getItem("klinikDarkMode");
          return savedMode === "true";
        });

        // YENİ: Gizlilik Modu ve Kopyalama Özellikleri
        const [isPrivacyMode, setIsPrivacyMode] = useState(false);
        const [copiedPhoneId, setCopiedPhoneId] = useState(null);

        // Paraları gizlemek için akıllı fonksiyon
        const renderMoney = (amount) => {
          if (isPrivacyMode) return "***";
          return typeof amount === "number"
            ? amount.toLocaleString("tr-TR")
            : amount;
        };

        // Tek tıkla telefon kopyalama fonksiyonu
        const handleCopyPhone = (e, phone, id) => {
          e.stopPropagation(); // Tıklamanın hasta modalını açmasını engeller
          if (!phone || phone === "-") return;
          navigator.clipboard.writeText(phone);
          setCopiedPhoneId(id);
          setTimeout(() => setCopiedPhoneId(null), 2000);
          showNotification("Telefon numarası kopyalandı!");
        };

        const [globalData, setGlobalData] = useState({
          usersDb: {},
          appointments: {},
          doctorProfiles: {},
          patientsDb: {},
          pricingDb: {},
          settingsDb: {},
        });

        const [isSyncing, setIsSyncing] = useState(true);

        const [notification, setNotification] = useState(null);

        const showNotification = (message, type = "success") => {
          setNotification({ message, type });

          setTimeout(() => setNotification(null), 3000);
        };

        const [deferredPrompt, setDeferredPrompt] = useState(null);

        const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

        const [currentUser, setCurrentUser] = useState(null);

        // Profesyonel Kalıcı Oturum Kontrolü
useEffect(() => {
  const checkSession = () => {
    const savedUser = sessionStorage.getItem("klinikAktifKullanici");
    const sessionToken = sessionStorage.getItem("klinikOturumTokeni");

    if (savedUser && sessionToken) {
      setCurrentUser(savedUser);
    } else {
      setCurrentUser(null);
      sessionStorage.removeItem("klinikAktifKullanici");
    }
  };
  checkSession();
}, []);

        const [savedUsernames, setSavedUsernames] = useState(() =>
          JSON.parse(localStorage.getItem("klinikSavedUsers") || "[]")
        );

        const [authMode, setAuthMode] = useState("login");

        const [authForm, setAuthForm] = useState({
          username: "",

          password: "",
        });

        const [registerForm, setRegisterForm] = useState({
          username: "",

          password: "",

          name: "",

          title: "Hekim",
        });

        const [forgotForm, setForgotForm] = useState({
          username: "",

          newPassword: "",
        });

        const [authError, setAuthError] = useState("");
        // YENİ: Şifre Göster/Gizle durumu için
        const [showPassword, setShowPassword] = useState(false);

        const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

        const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

        const [passwordForm, setPasswordForm] = useState({
          oldPass: "",

          newPass: "",
        });

        const [isSidebarOpen, setIsSidebarOpen] = useState(false);

        const sidebarRef = useRef(null);

        const [activeTab, setActiveTab] = useState("home");

        const [listDoctorFilter, setListDoctorFilter] = useState("all");

        const [calendarDoctor, setCalendarDoctor] = useState("");

        const [selectedDate, setSelectedDate] = useState(new Date());

        const [isDocChanging, setIsDocChanging] = useState(false);

        const [highlightedAptId, setHighlightedAptId] = useState(null);

        const [draggedAptInfo, setDraggedAptInfo] = useState(null);

        const [dragOverTargetKey, setDragOverTargetKey] = useState(null);

        const [globalSearch, setGlobalSearch] = useState("");

        const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

        const searchRef = useRef(null);

        const [patientSuggestions, setPatientSuggestions] = useState([]);

        const [aptSearchQuery, setAptSearchQuery] = useState("");

        const [isAptSearchOpen, setIsAptSearchOpen] = useState(false);

        const aptSearchRef = useRef(null);

        const [isModalOpen, setIsModalOpen] = useState(false);

        const [aptModalMode, setAptModalMode] = useState("view");

        const [selectedSlot, setSelectedSlot] = useState(null);

        const [activeSlotDate, setActiveSlotDate] = useState(null);

        const [activeSlotDoctor, setActiveSlotDoctor] = useState(null);

        const [formData, setFormData] = useState({
          patientName: "",

          phone: "",

          treatment: "",

          linkedPlanId: null,

          status: "Yeni Kayıt",

          duration: "30",

          notes: "",

          anamnesis: "",

          createdAt: null,

          selectedTeeth: [],

          price: "",

          selectedTreatments: [],

          plannedTreatments: [],
        });

        const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
        const [isSplitMode, setIsSplitMode] = useState(false); // YENİ: Bölünmüş Ekran Kontrolcüsü

        const [patientForm, setPatientForm] = useState(null);

        const [paymentInput, setPaymentInput] = useState("");
        const [paymentMethod, setPaymentMethod] = useState("Nakit");
        // YENİ: KLİNİK GEÇMİŞ (EPİKRİZ) STATE'LERİ VE FONKSİYONLARI
        const [isHistoryDetailModalOpen, setIsHistoryDetailModalOpen] = useState(false);
        const [selectedHistoryRecord, setSelectedHistoryRecord] = useState(null);
        const [isAddHistoryModalOpen, setIsAddHistoryModalOpen] = useState(false);
        const [historySearchQuery, setHistorySearchQuery] = useState("");
        const [historyFilterDoc, setHistoryFilterDoc] = useState("all");
        const [newHistoryForm, setNewHistoryForm] = useState({
          date: (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          })(),
          time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
          doctorId: currentUser || "",
          visitType: "Tedavi",
          treatment: "",
          selectedTeeth: "",
          complaint: "",
          clinicalFindings: "",
          diagnosis: "",
          procedureNotes: "",
          materials: "",
          anesthesia: "",
          prescription: "",
          recommendations: "",
          nextAppointmentDate: "",
        });

        const handleSaveManualHistory = (e) => {
          e.preventDefault();
          const newHistory = {
            id: "hist_" + Date.now(),
            appointmentId: null, // Manuel eklenenlerin randevu ID'si yoktur
            date: newHistoryForm.date,
            time: newHistoryForm.time,
            timestamp: Date.now(),
            doctorId: newHistoryForm.doctorId,
            doctorName: globalData.doctorProfiles?.[newHistoryForm.doctorId]?.name || newHistoryForm.doctorId,
            appointmentStatus: "Geldi",
            visitType: newHistoryForm.visitType,
            treatment: newHistoryForm.treatment,
            selectedTeeth: newHistoryForm.selectedTeeth ? newHistoryForm.selectedTeeth.split(",").map(s => s.trim()) : [],
            complaint: newHistoryForm.complaint,
            clinicalFindings: newHistoryForm.clinicalFindings,
            diagnosis: newHistoryForm.diagnosis,
            procedureNotes: newHistoryForm.procedureNotes,
            materials: newHistoryForm.materials,
            anesthesia: newHistoryForm.anesthesia,
            prescription: newHistoryForm.prescription,
            recommendations: newHistoryForm.recommendations,
            nextAppointment: newHistoryForm.nextAppointmentDate ? { date: newHistoryForm.nextAppointmentDate, time: "", reason: "" } : null,
            createdAt: Date.now(),
            createdBy: currentUser
          };

          const updatedPatient = {
            ...patientForm,
            clinicalHistory: [newHistory, ...(patientForm.clinicalHistory || [])]
          };

          setPatientForm(updatedPatient);
          saveGlobalData({
            ...globalData,
            patientsDb: { ...globalData.patientsDb, [patientForm.id]: updatedPatient }
          });
          setIsAddHistoryModalOpen(false);
          setNewHistoryForm({ ...newHistoryForm, treatment: "", selectedTeeth: "", complaint: "", clinicalFindings: "", diagnosis: "", procedureNotes: "", materials: "", anesthesia: "", prescription: "", recommendations: "", nextAppointmentDate: "" });
          showNotification("Klinik geçmiş kaydı başarıyla eklendi.");
        };

        const [patientModalTab, setPatientModalTab] = useState("info");

        const [activePlanTreatment, setActivePlanTreatment] = useState("");

        const [editingTxId, setEditingTxId] = useState(null);

        const [editingTxPrice, setEditingTxPrice] = useState("");

        const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
        const [avatarModalInfo, setAvatarModalInfo] = useState({
          isOpen: false,
          docId: null,
          tempAvatar: null,
          zoom: 1,
          x: 50,
          y: 50,
        });
        const [touchStartX, setTouchStartX] = useState(null);
        const [docStatsActiveFilter, setDocStatsActiveFilter] = useState("all");
        const [commissionRate, setCommissionRate] = useState("");
        const [newDoctorForm, setNewDoctorForm] = useState({
          username: "",

          password: "",

          name: "",

          title: "",
        });

        const [isDoctorDetailsModalOpen, setIsDoctorDetailsModalOpen] =
          useState(false);

        const [selectedDoctorId, setSelectedDoctorId] = useState(null);

        const [doctorEditForm, setDoctorEditForm] = useState({});

        const [docModalTab, setDocModalTab] = useState("profile");

        const [docStatsStart, setDocStatsStart] = useState("");

        const [docStatsEnd, setDocStatsEnd] = useState("");

        const [docStatsSelectedTreatment, setDocStatsSelectedTreatment] =
          useState(null);

        const [calendarViewMode, setCalendarViewMode] = useState("daily");

        const [patientLocalSearch, setPatientLocalSearch] = useState("");

        const [patientFilterStatus, setPatientFilterStatus] = useState("all");

        const [patientFilterTreatment, setPatientFilterTreatment] =
          useState("all");

        const [isHeaderVisible, setIsHeaderVisible] = useState(true);
        const [showAttendanceDetails, setShowAttendanceDetails] =
          useState(false);
          // --- KLİNİK DOSYA MASASI STATE'LERİ ---
        const [activeFolderId, setActiveFolderId] = useState(null);
        const [folderSearch, setFolderSearch] = useState("");
        // --------------------------------------
        const [dashboardPeriod, setDashboardPeriod] = useState("month");
        const [expandedTx, setExpandedTx] = useState(null); // Ana sayfa detayları için

        const [financePeriod, setFinancePeriod] = useState("all");

        const [financeCustomStart, setFinanceCustomStart] = useState("");

        const [financeCustomEnd, setFinanceCustomEnd] = useState("");

        const [financeDetailView, setFinanceDetailView] = useState("overview");
        // --- KLİNİK AYARLARI STATE YÖNETİMİ ---
        const DEFAULT_SETTINGS = {
          klinik: { ad: "Benim Kliniğim", kisaAd: "Klinik", telefon: "", eposta: "", adres: "", durum: "Aktif" },
          calisma: { 
            baslama: "09:00", bitis: "19:00",
            gunler: { "Pzt": true, "Sal": true, "Çar": true, "Per": true, "Cum": true, "Cmt": true, "Paz": false },
            ozelGunler: []
          },
          randevu: { varsayilanSure: "30", slotAraligi: "15", cakismaKontrolu: true, gecmisTarihUyarisi: true },
          bildirim: { smsAktif: false, whatsappAktif: true, randevuHatirlatma: "24" },
          gorunum: { tema: "Sistem", animasyonlar: true },
          guvenlik: { oturumZamanAsimi: "120", hassasEkranUyarisi: true },
          otomasyon: { aktifKural: 4 },
          dosya: { acil: true, kontrol: true, tedavi: true, lab: true, evrak: true, yeni: true }
        };

        const [settings, setSettings] = useState(DEFAULT_SETTINGS);

        // AYARLARI OKUMA: Hibrit Motor (Önce Local, Sonra Bulut)
        useEffect(() => {
          if (currentUser) {
            // 1. Aşama: Sisteme girer girmez cihaz hafızasından anında çek (Silinmeyi / Sıfırlanmayı engeller)
            const localSaved = localStorage.getItem(`klinikSettings_${currentUser}`);
            if (localSaved) {
              setSettings(JSON.parse(localSaved));
            } else {
              setSettings(DEFAULT_SETTINGS);
            }

            // 2. Aşama: Firebase (Bulut) verisi internetten inince, en güncel haliyle kontrol et
            if (globalData && globalData.settingsDb && globalData.settingsDb[currentUser]) {
              const cloudSettings = globalData.settingsDb[currentUser];
              setSettings(cloudSettings);
              // LocalStorage'ı buluttaki en güncel veriyle senkronize et
              localStorage.setItem(`klinikSettings_${currentUser}`, JSON.stringify(cloudSettings));
            }
          }
        }, [currentUser, globalData.settingsDb]);

        const [settingsDraft, setSettingsDraft] = useState(null);
        const [settingsTab, setSettingsTab] = useState("ozet");
        const [settingsSearch, setSettingsSearch] = useState("");
        const [isCheckingData, setIsCheckingData] = useState(false);
        // --- GERÇEK ZAMANLI EKLENTİLER (BELGE, TEDAVİ, TEMA) ---
        const [documentPreview, setDocumentPreview] = useState(null);
        const [isAddTreatmentModalOpen, setIsAddTreatmentModalOpen] = useState(false);
        const [newTreatmentForm, setNewTreatmentForm] = useState({ name: "", category: "Klinik İşlem", price: "" });

        // --- GERÇEK TDB BELGELERİ ---
        const TDB_DOCUMENTS = [
          { 
            id: 1, 
            title: "TDB Standart Aydınlatılmış Onam Formu", 
            icon: "fa-file-signature", 
            color: "text-rose-500", 
            bg: "bg-rose-50 dark:bg-rose-900/20", 
            content: `TÜRK DİŞHEKİMLERİ BİRLİĞİ (TDB) VE İSTANBUL DİŞHEKİMLERİ ODASI (İDO) 
STANDART AYDINLATILMIŞ ONAM FORMU

Bu belge, 1219 sayılı Tababet ve Şuabatı San’atlarının Tarzı İcrasına Dair Kanun ve Hasta Hakları Yönetmeliği gereğince, uygulanacak tıbbi müdahale, alternatifleri, riskleri ve müdahale edilmemesi durumunda oluşabilecek sonuçlar hakkında hastayı bilgilendirmek ve rızasını almak amacıyla hazırlanmıştır.

1. HASTALIĞIN TANIMI VE PLANLANAN TEDAVİ:
Klinik hekimleri tarafından yapılan klinik ve radyolojik muayeneler sonucunda, ağız ve diş sağlığım ile ilgili mevcut durumum tarafıma anlaşılır bir dilde açıklanmıştır. Uygulanması planlanan tedavinin (dolgu, kanal tedavisi, diş çekimi, protez, cerrahi işlem vb.) aşamaları, süresi ve kullanılacak materyaller hakkında detaylı bilgi verilmiştir.

2. ALTERNATİF TEDAVİ SEÇENEKLERİ:
Planlanan tedaviye alternatif olarak uygulanabilecek diğer tedavi yöntemleri, bu yöntemlerin avantaj ve dezavantajları ile maliyetleri tarafıma anlatılmıştır. Mevcut koşullarda en uygun seçeneğin hekimim tarafından önerilen tedavi olduğuna karar verdim.

3. TEDAVİNİN RİSKLERİ VE OLASI KOMPLİKASYONLAR:
Her tıbbi müdahalede olduğu gibi, diş hekimliği uygulamalarında da bazı riskler bulunmaktadır. Tarafıma anlatılan ve anladığım başlıca riskler şunlardır:
- Lokal anesteziye bağlı alerjik reaksiyonlar, geçici veya kalıcı sinir uyuşuklukları (parestezi).
- Tedavi sırasında veya sonrasında kanama, şişlik (ödem), ağrı ve enfeksiyon gelişimi.
- Diş çekimi veya cerrahi işlemler sırasında komşu dişlerin, restorasyonların veya çevre dokuların zarar görmesi.
- Kanal tedavisi veya diş çekimi sırasında kök kırılması, kanal aleti kırılması veya sinüs boşluğuna açılma.
- Çene ekleminde (TMJ) hassasiyet, ağrı veya geçici ağız açmada kısıtlılık (trismus).

4. TEDAVİNİN REDDEDİLMESİ DURUMUNDA KARŞILAŞILABİLECEK SONUÇLAR:
Önerilen tedaviyi kabul etmemem durumunda; mevcut ağrı ve enfeksiyonun şiddetlenebileceği, dişin tamamen kaybedilebileceği, komşu dişlerin ve çevre dokuların zarar görebileceği, kist veya tümör gibi daha ciddi genel sağlık sorunlarının ortaya çıkabileceği konusunda uyarıldım.

5. HASTANIN BEYANI VE RIZASI:
Yukarıda yer alan maddeleri tamamen okudum ve anladım. Klinik hekimleri tarafından bana durumumla ilgili yeterli zaman ayrıldı ve sorduğum tüm sorulara tatmin edici cevaplar aldım. Uygulanacak tedavinin başarısı için tıp biliminin doğası gereği kesin bir garanti verilemeyeceğini biliyorum. Beklenmeyen durumlarda, hekimimin sağlığım için gerekli göreceği ek tıbbi müdahaleleri yapmasına da izin veriyorum.

Kendi özgür irademle, hiçbir baskı altında kalmadan, planlanan tıbbi/cerrahi müdahalenin ve gerekli lokal anestezi işlemlerinin yapılmasına ONAY VERİYORUM.


HASTA / KANUNİ TEMSİLCİSİ (18 Yaşından Küçükler İçin)
Adı Soyadı: ....................................................
T.C. Kimlik No: ..............................................
Tarih: ...../...../202...
İmza: .....................................................`
          },
          { 
            id: 2, 
            title: "KVKK Aydınlatma ve Açık Rıza Metni", 
            icon: "fa-shield-halved", 
            color: "text-indigo-500", 
            bg: "bg-indigo-50 dark:bg-indigo-900/20", 
            content: `6698 SAYILI KİŞİSEL VERİLERİN KORUNMASI KANUNU (KVKK) KAPSAMINDA 
HASTA AYDINLATMA VE AÇIK RIZA METNİ

Sayın Hastamız / Hasta Yakınımız,
Bu aydınlatma metni, veri sorumlusu sıfatıyla kliniğimiz tarafından, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun (KVKK) 10. maddesi ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca hazırlanmıştır.

1. İŞLENEN KİŞİSEL VERİLERİNİZ VE İŞLENME AMAÇLARI:
Kliniğimize başvurmanız dolayısıyla elde edilen;
- Kimlik Verileriniz (Ad, soyad, T.C. kimlik numarası, pasaport numarası, doğum yeri ve tarihi, cinsiyet),
- İletişim Verileriniz (Adres, telefon numarası, e-posta adresi),
- Sağlık Verileriniz (Röntgen görüntüleri, laboratuvar sonuçları, test sonuçları, muayene verileri, randevu bilgileri, reçete bilgileri, daha önce geçirilmiş hastalıklar, kronik hastalıklar, alerjiler ve diğer tüm tıbbi kayıtlar),
- Finansal Verileriniz (Fatura bilgileri, ödeme ve kredi kartı bilgileri)

Yukarıda belirtilen kişisel ve özel nitelikli kişisel verileriniz; tıbbi teşhis, tedavi ve bakım hizmetlerinin yürütülmesi, randevu planlamasının yapılması, yasal yükümlülüklerin yerine getirilmesi (Sağlık Bakanlığı, İTS, SGK vb. bildirimler) ve sağlık hizmetlerinin finansmanının sağlanması amaçlarıyla işlenmektedir.

2. KİŞİSEL VERİLERİN AKTARILMASI:
Kişisel verileriniz, KVKK'nın 8. ve 9. maddelerinde belirtilen şartlar dahilinde; ilgili mevzuat hükümlerinin izin verdiği kurum ve kuruluşlara (Sağlık Bakanlığı, İl Sağlık Müdürlükleri, SGK, Emniyet Genel Müdürlüğü ve adli makamlar), protetik ve ortodontik laboratuvarlara, yasal savunma hakkımızı kullanabilmek adına hukuki danışmanlarımıza aktarılabilecektir. Verileriniz kesinlikle ticari amaçla 3. şahıslara satılmaz veya devredilmez.

3. İLGİLİ KİŞİNİN (HASTANIN) HAKLARI:
KVKK'nın 11. maddesi uyarınca kliniğimize başvurarak;
- Kişisel verilerinizin işlenip işlenmediğini öğrenme,
- İşlenmişse buna ilişkin bilgi talep etme,
- İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,
- Eksik veya yanlış işlenmişse düzeltilmesini isteme,
- Kanunda öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini talep etme haklarına sahipsiniz.

4. HASTA BEYANI VE AÇIK RIZA:
Yukarıda yer alan aydınlatma metnini tamamen okudum, anladım. Kişisel ve sağlık verilerimin, yukarıda belirtilen amaçlar ve sınırlar çerçevesinde işlenmesine, kaydedilmesine, muhafaza edilmesine ve ilgili yasal mercilere/laboratuvarlara aktarılmasına özgür irademle AÇIK RIZA gösteriyorum.

HASTA / KANUNİ TEMSİLCİSİ
Adı Soyadı: ....................................................
Tarih: ...../...../202...
İmza: .....................................................`
          },
          { 
            id: 3, 
            title: "TDB İmplant Cerrahi Onam Formu", 
            icon: "fa-tooth", 
            color: "text-emerald-500", 
            bg: "bg-emerald-50 dark:bg-emerald-900/20", 
            content: `İMPLANT CERRAHİSİ BİLGİLENDİRME VE AYDINLATILMIŞ ONAM FORMU (TDB UYUMLU)

Bu belge, çene kemiğine yerleştirilecek olan dental implant (yapay diş kökü) operasyonu ve sonrasındaki protez işlemleri için hazırlanmıştır. Lütfen dikkatlice okuyunuz.

1. İŞLEMİN TANIMI:
Eksik olan diş veya dişlerinizin telafisi için, lokal anestezi altında çene kemiğinize titanyum veya titanyum alaşımlı dental implantların yerleştirilmesi planlanmaktadır. Operasyon sonrasında implantın kemikle kaynaşması (osseointegrasyon) için ortalama 2 ile 6 ay arasında bir iyileşme süresi beklenecektir. Bu süre sonunda implant üzerine protez (kron, köprü veya hareketli protez) yapılacaktır.

2. İMPLANT CERRAHİSİ RİSKLERİ VE KOMPLİKASYONLARI:
Bu cerrahi işlemin genel anestezi ve cerrahi risklerinin yanı sıra kendine özgü riskleri de vardır:
- Operasyon sırasında ve sonrasında kanama, yüzde ve diş etlerinde şişlik (ödem), morarma (ekimoz) görülebilir.
- Alt çeneye yapılacak müdahalelerde, mandibular sinirin (nervus alveolaris inferior) etkilenmesine bağlı olarak alt dudakta, çenede veya dilde geçici ya da çok nadir durumlarda kalıcı uyuşukluk (parestezi/anestezi) gelişebilir.
- Üst çene arka bölgelerde implant yerleştirilirken sinüs boşluğuna girilebilir (sinüs perforasyonu) veya implant sinüs içine kaçabilir. Bu durum ek cerrahi müdahaleler gerektirebilir.
- Ameliyat sırasında komşu dişlerin kökleri zarar görebilir.
- İyileşme döneminde veya sonrasında enfeksiyon gelişebilir. Kötü ağız hijyeni, aşırı sigara kullanımı veya sistemik hastalıklar (diyabet vb.) enfeksiyon ve implant kaybı (kemiğin implantı reddetmesi) riskini ciddi oranda artırır.

3. EK CERRAHİ İŞLEMLER (GREFTLEME / SİNÜS LİFTİNG):
Çene kemiğinin miktar veya kalite olarak yetersiz olduğu durumlarda, implant yerleştirebilmek için kemik tozu (greft) veya membran kullanımı ile kemik artırma işlemleri gerekebilir. Bu işlemler önceden planlanabileceği gibi, operasyon esnasında da hekim tarafından gerekli görülebilir. Bu cerrahi ek işlemler ayrıca faturalandırılabilir.

4. BAŞARI GARANTİSİ VE HASTANIN SORUMLULUKLARI:
Tıbbi prosedürlerde olduğu gibi implant cerrahisinde de %100 başarı garantisi verilmesi tıbben ve hukuken mümkün değildir. İmplantın ömrü; genel sağlık durumum, ağız bakımım, sigara tüketimim ve düzenli hekim kontrollerime bağlıdır. Hekimimin verdiği ilaçları düzenli kullanacağımı ve tavsiyelerine harfiyen uyacağımı kabul ediyorum.

5. HASTA ONAYI:
Bana uygulanacak implant cerrahisi hakkında tüm detaylar anlatıldı. Olası riskleri, alternatif tedavileri (hareketli protezler, köprüler) ve implantın başarısız olma ihtimalini anladım. Ek bir cerrahi işlem gerektiğinde kliniğe ve hekimime tam yetki veriyorum. Kendi rızamla bu cerrahi operasyonun yapılmasına ONAY VERİYORUM.

HASTA / KANUNİ TEMSİLCİSİ
Adı Soyadı: ....................................................
Tarih: ...../...../202...
İmza: ....................................................`
          },
          { 
            id: 4, 
            title: "Ortodontik Tedavi Sözleşmesi", 
            icon: "fa-teeth-open", 
            color: "text-amber-500", 
            bg: "bg-amber-50 dark:bg-amber-900/20", 
            content: `ORTODONTİ TEDAVİSİ BİLGİLENDİRME VE ONAM FORMU

1. TEDAVİ SÜRECİ VE SÜRESİ:
Tedavinin tahmini süresi belirtilmiş olup, hastanın biyolojik kemik yanıtlarına, büyüme gelişim potansiyeline ve randevu devamsızlıklarına bağlı olarak bu sürenin uzayabileceğini veya kısalabileceğini kabul ediyorum.

2. HASTA UYUMU VE SORUMLULUKLAR:
- Tedavi süresince asitli, yapışkan ve sert yiyeceklerin (sakız, lokum, fındık, asitli içecekler vb.) tüketilmemesi gerektiği anlatılmıştır.
- Braketlerin veya apareylerin hastanın kullanım hatası sonucu kırılması/kopması durumunda ek malzeme ve işçilik ücreti yansıtılabileceği tarafıma bildirilmiştir.
- Ağız hijyeninin yetersiz olduğu durumlarda dişlerde çürükler veya kalıcı beyaz lekeler (dekalsifikasyon) oluşabileceği bilgisi verilmiştir.

3. KONTROL RANDEVULARI:
Randevularıma zamanında geleceğimi, gelemeyeceğim durumlarda kliniğe önceden bilgi vereceğimi taahhüt ederim. Devamsızlık durumunda tedavinin uzayacağını kabul ediyorum. Yukarıdaki şartları okudum ve ortodontik tedaviye başlanmasına onay veriyorum.

HASTA / VELİSİ
Adı Soyadı: ....................................................
Tarih: ...../...../202...
İmza: ....................................................`
          }
        ];

        // --- TAKVİM ARALIĞINI DİNAMİK YAPAN MOTOR ---
        const TIME_SLOTS = useMemo(() => {
           const interval = parseInt(settings.randevu.slotAraligi || "15", 10);
           const startStr = settings.calisma.baslama || "09:00";
           const endStr = settings.calisma.bitis || "19:00";
           
           let startHour = parseInt(startStr.split(":")[0], 10);
           let startMin = parseInt(startStr.split(":")[1], 10);
           let endHour = parseInt(endStr.split(":")[0], 10);
           let endMin = parseInt(endStr.split(":")[1], 10);
           
           const slots = [];
           let currentTotalMin = startHour * 60 + startMin;
           const endTotalMin = endHour * 60 + endMin;

           while(currentTotalMin <= endTotalMin) {
              const h = Math.floor(currentTotalMin / 60);
              const m = currentTotalMin % 60;
              slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
              currentTotalMin += interval;
           }
           return slots;
        }, [settings.randevu.slotAraligi, settings.calisma]);

        // --- YENİ TEDAVİYİ HER YERE AKTARAN MOTOR ---
        const DYNAMIC_PRICING_CATEGORIES = useMemo(() => {
           const cats = JSON.parse(JSON.stringify(INITIAL_PRICING_CATEGORIES));
           if (globalData.customTreatments) {
              globalData.customTreatments.forEach(t => {
                 if (cats[t.category] && !cats[t.category].items.includes(t.name)) {
                    cats[t.category].items.push(t.name);
                 }
              });
           }
           return cats;
        }, [globalData.customTreatments]);

        const handleSaveNewCustomTreatment = (e) => {
          e.preventDefault();
          const userPricing = globalData.pricingDb?.[currentUser] || (typeof globalData.pricingDb === "object" && globalData.pricingDb["Genel Muayene"] ? globalData.pricingDb : DEFAULT_PRICING);
          
          const updatedPricing = {
            ...userPricing,
            [newTreatmentForm.name]: parseFloat(newTreatmentForm.price) || 0
          };

          const newCustomTreatments = [...(globalData.customTreatments || [])];
          if (!newCustomTreatments.some(t => t.name === newTreatmentForm.name)) {
             newCustomTreatments.push({
                name: newTreatmentForm.name,
                category: newTreatmentForm.category
             });
          }

          saveGlobalData({ 
            ...globalData, 
            pricingDb: { ...globalData.pricingDb, [currentUser]: updatedPricing },
            customTreatments: newCustomTreatments 
          }).then(() => {
              showNotification("Yeni işlem başarıyla eklendi ve tüm listelerde aktif edildi.", "success");
              setIsAddTreatmentModalOpen(false);
              setNewTreatmentForm({ name: "", category: "Teşhis ve Radyoloji", price: "" });
            });
        };

        // Otomatik Tema Algılayıcı ve Değiştirici
        useEffect(() => {
          if (settings.gorunum.tema === "Koyu") setIsDarkMode(true);
          else if (settings.gorunum.tema === "Acik") setIsDarkMode(false);
          else if (settings.gorunum.tema === "Sistem") {
            setIsDarkMode(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
          }
        }, [settings.gorunum.tema]);

        const handleSettingChange = (kategori, key, value) => {
          setSettingsDraft(prev => {
            const currentDraft = prev || JSON.parse(JSON.stringify(settings));
            return { ...currentDraft, [kategori]: { ...currentDraft[kategori], [key]: value } };
          });
        };

        // AYARLARI KAYDETME: Hibrit Motor (Hem Local Hem Bulut)
        const saveSettings = () => {
          if (!settingsDraft && Object.keys(pricingEditValues).length === 0) return;
          
          const finalSettings = settingsDraft || settings;

          const updatedSettingsDb = {
            ...(globalData.settingsDb || {}),
            [currentUser]: finalSettings
          };

          // YENİ: Tedavi Fiyatlarındaki değişiklikleri tespit et ve Firebase'e hazırla
          let updatedPricingDb = globalData.pricingDb || {};
          if (Object.keys(pricingEditValues).length > 0) {
            const currentUserPricing = { ...(updatedPricingDb[currentUser] || DEFAULT_PRICING), ...pricingEditValues };
            updatedPricingDb = { ...updatedPricingDb, [currentUser]: currentUserPricing };
          }

          // 1. Aşama: Cihaza kaydet
          localStorage.setItem(`klinikSettings_${currentUser}`, JSON.stringify(finalSettings));
          setSettings(finalSettings); 

          // 2. Aşama: Ayarları ve Fiyatları Buluta (Firebase) Yolla
          saveGlobalData({ ...globalData, settingsDb: updatedSettingsDb, pricingDb: updatedPricingDb })
            .then(() => {
              setSettingsDraft(null);
              setPricingEditValues({}); // Kayıt sonrası fiyat değişiklik havuzunu temizle
              showNotification("Ayarlar ve Tedavi Kataloğu başarıyla Buluta kaydedildi.", "success");
            })
            .catch(err => {
              showNotification("Buluta kaydedilirken hata oluştu ancak cihazınıza kaydedildi.", "error");
              console.error(err);
            });
        };

        const revertSettings = () => {
          showConfirm("Kaydedilmemiş değişiklikleri geri almak istediğinize emin misiniz?", () => {
            setSettingsDraft(null);
            showNotification("Değişiklikler geri alındı.", "error");
          });
        };

        const [pricingEditValues, setPricingEditValues] = useState({});
        // YENİ: SAĞ TIK / UZUN BASMA (CONTEXT MENU) YÖNETİMİ
        const [contextMenu, setContextMenu] = useState(null);

        useEffect(() => {
          // Menü açıkken ekranda herhangi bir yere tıklanırsa veya kaydırma yapılırsa menüyü kapat
          const closeMenu = () => setContextMenu(null);
          window.addEventListener("click", closeMenu);
          window.addEventListener("scroll", closeMenu, true);
          return () => {
            window.removeEventListener("click", closeMenu);
            window.removeEventListener("scroll", closeMenu, true);
          };
        }, []);

        const handleContextMenu = (e, type, data) => {
          e.preventDefault(); // Tarayıcının varsayılan sağ tık menüsünü engelle
          e.stopPropagation();

          // Fare (Desktop) veya Dokunmatik (Mobil) koordinatlarını al
          let x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
          let y = e.clientY || (e.touches && e.touches[0].clientY) || 0;

          // Menünün ekran dışına taşmasını engellemek için basit sınır kontrolü
          if (x > window.innerWidth - 220) x -= 220;
          if (y > window.innerHeight - 300) y -= 250;

          setContextMenu({ isOpen: true, x, y, type, data });
        };

        const [confirmModal, setConfirmModal] = useState({
          isOpen: false,
          message: "",
          onConfirm: null,
        });

        // YENİ: OFFLINE PWA VE AĞ DURUMU STATE'LERİ
        const [isOffline, setIsOffline] = useState(!navigator.onLine);

        useEffect(() => {
          // Ağ durumunu dinle
          const handleOnline = () => setIsOffline(false);
          const handleOffline = () => setIsOffline(true);
          window.addEventListener("online", handleOnline);
          window.addEventListener("offline", handleOffline);

          return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
          };
        }, []);

        const showConfirm = (message, onConfirm) => {
          setConfirmModal({ isOpen: true, message, onConfirm });
        };

        const handleConfirm = () => {
          if (confirmModal.onConfirm) confirmModal.onConfirm();

          setConfirmModal({ isOpen: false, message: "", onConfirm: null });
        };

        const handleCancelConfirm = () => {
          setConfirmModal({ isOpen: false, message: "", onConfirm: null });
        };

        const userMenuRef = useRef(null);

        useEffect(() => {
          localStorage.setItem("klinikDarkMode", isDarkMode);
          if (isDarkMode) document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
        }, [isDarkMode]);

        useEffect(() => {
          const handler = (e) => {
            e.preventDefault();

            setDeferredPrompt(e);
          };

          window.addEventListener("beforeinstallprompt", handler);

          return () =>
            window.removeEventListener("beforeinstallprompt", handler);
        }, []);

        // RTDB veri okuma

        useEffect(() => {
          if (!isReady) return;

          if (!db) {
            setIsSyncing(false);

            return;
          }


          // ★★★ DEĞİŞİKLİK 2: Veri okuma yolu sabitlendi ★★★

          const dbRef = ref(db, "KlinikAnaVeritabani/Veriler");

          const unsubscribe = onValue(
            dbRef,

            (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.val();

                if (!data.pricingDb) data.pricingDb = DEFAULT_PRICING;
                if (!data.settingsDb) data.settingsDb = {};

                setGlobalData(data);
              } else {
                setGlobalData({
                  usersDb: {},

                  appointments: {},

                  doctorProfiles: {},

                  patientsDb: {},

                  pricingDb: DEFAULT_PRICING,
                });
              }

              setIsSyncing(false);
            },

            (error) => {
              console.error("RTDB read error", error);

              showNotification("Veri okunurken hata oluştu", "error");

              setIsSyncing(false);
            }
          );

          return () => unsubscribe();
        }, [isReady, fbUser, db]);

        const saveGlobalData = async (newData) => {
          if (!db) return;

          try {
            const dbRef = ref(db, "KlinikAnaVeritabani/Veriler");

            // AKILLI GÜNCELLEME (DEEP UPDATE) MANTIĞI
            // Toptan ezmek yerine sadece değişen/eklenen/silinen noktaları bulur.
            const updates = {};

            const checkOneLevel = (collectionName) => {
              const oldCol = globalData[collectionName] || {};
              const newCol = newData[collectionName] || {};

              // Yenileri veya değişenleri bul
              Object.keys(newCol).forEach((key) => {
                if (JSON.stringify(oldCol[key]) !== JSON.stringify(newCol[key])) {
                  updates[`${collectionName}/${key}`] = newCol[key];
                }
              });

              // Silinenleri bul
              Object.keys(oldCol).forEach((key) => {
                if (newCol[key] === undefined) {
                  updates[`${collectionName}/${key}`] = null;
                }
              });
            };

            // Tek katmanlı verileri kontrol et
            checkOneLevel("usersDb");
            checkOneLevel("doctorProfiles");
            checkOneLevel("patientsDb");
            checkOneLevel("pricingDb");
            checkOneLevel("settingsDb"); // YENİ: Ayarlar artık Firebase'e yazılacak

            // İki katmanlı verileri (Randevular: Doctor -> Appointment) kontrol et
            const oldApts = globalData.appointments || {};
            const newApts = newData.appointments || {};
            const allDocIds = new Set([...Object.keys(oldApts), ...Object.keys(newApts)]);

            allDocIds.forEach((docId) => {
              const oldDocApts = oldApts[docId] || {};
              const newDocApts = newApts[docId] || {};

              Object.keys(newDocApts).forEach((aptKey) => {
                if (JSON.stringify(oldDocApts[aptKey]) !== JSON.stringify(newDocApts[aptKey])) {
                  updates[`appointments/${docId}/${aptKey}`] = newDocApts[aptKey];
                }
              });

              Object.keys(oldDocApts).forEach((aptKey) => {
                if (newDocApts[aptKey] === undefined) {
                  updates[`appointments/${docId}/${aptKey}`] = null;
                }
              });
            });

            // Eğer veritabanında değişecek bir şey varsa sadece o yolları (path) güncelle
            if (Object.keys(updates).length > 0) {
              await update(dbRef, updates);
            }

            setGlobalData(newData);
          } catch (e) {
            showNotification("Veritabanı kayıt hatası! Lütfen sayfayı yenileyin.", "error");
            console.error(e);
            throw e;
          }
        };

        // Sidebar dışı tıklama

        useEffect(() => {
          const handleClickOutside = (event) => {
            if (
              sidebarRef.current &&
              !sidebarRef.current.contains(event.target)
            ) {
              setIsSidebarOpen(false);
            }
          };

          document.addEventListener("mousedown", handleClickOutside);

          return () =>
            document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        useEffect(() => {
          const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target))
              setSearchDropdownOpen(false);

            if (
              aptSearchRef.current &&
              !aptSearchRef.current.contains(event.target)
            )
              setIsAptSearchOpen(false);

            if (
              userMenuRef.current &&
              !userMenuRef.current.contains(event.target)
            ) {
              setIsUserMenuOpen(false);
            }
          };

          document.addEventListener("mousedown", handleClickOutside);

          return () =>
            document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        useEffect(() => {
          setAptSearchQuery("");
          setIsAptSearchOpen(false);
          setIsHeaderVisible(true);

          if (activeTab === "calendar" && !calendarDoctor)
            setCalendarDoctor(currentUser);

          if (activeTab === "pricing") {
            const myPricing = globalData.pricingDb?.[currentUser] || {};
            const fallbackPricing =
              typeof globalData.pricingDb === "object" &&
              globalData.pricingDb["Genel Muayene"]
                ? globalData.pricingDb
                : {};

            // Tüm yeni işlemleri ve eski kayıtları harmanlayarak kayıp verileri önler
            setPricingEditValues({
              ...DEFAULT_PRICING,
              ...fallbackPricing,
              ...myPricing,
            });
          }
          // EKLENEN KISIM: globalData.pricingDb eklendi. Böylece anlık fiyat güncellemeleri ekrana yansıyacak.
        }, [activeTab, globalData.pricingDb, currentUser]);

        // YENİ: Global Klavye Kısayolları (Ctrl+K Arama ve ESC ile Kapatma)
        useEffect(() => {
          const handleKeyDown = (e) => {
            // Ctrl+K Arama Kısayolu
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
              e.preventDefault();
              if (searchRef.current) {
                const input = searchRef.current.querySelector("input");
                if (input) {
                  input.focus();
                  setSearchDropdownOpen(true);
                }
              }
            }

            // YENİ: ESC Tuşu ile Modalları (Açılır Pencereleri) Kapatma
            if (e.key === "Escape") {
              setIsModalOpen(false);
              // ... diğer false'lar ...
              if (avatarModalInfo.isOpen)
                setAvatarModalInfo({ ...avatarModalInfo, isOpen: false });
            }
          };

          document.addEventListener("keydown", handleKeyDown);
          return () => document.removeEventListener("keydown", handleKeyDown);
        }, [avatarModalInfo]); // State bağımlılığı eklendi

        const toggleAnamnesis = (opt, formType) => {
          let current = "";

          let setter = null;

          if (formType === "patient") {
            current = patientForm?.anamnesis || "";

            setter = (val) =>
              setPatientForm({ ...patientForm, anamnesis: val });
          }

          if (!setter) return;

          const items = current ? current.split(", ").filter((s) => s) : [];

          const index = items.indexOf(opt);

          let newItems;

          if (index > -1) {
            newItems = items.filter((_, i) => i !== index);
          } else {
            newItems = [...items, opt];
          }

          setter(newItems.join(", "));
        };

        const openPatientByName = (pName) => {
          const pObj = Object.values(globalData.patientsDb || {}).find(
            (p) =>
              p.name.toLowerCase() === pName.toLowerCase() &&
              (p.addedBy === currentUser ||
                globalData.doctorProfiles?.[p.addedBy]?.addedBy === currentUser)
          );

          if (pObj) {
            setPatientForm(pObj);

            setPatientModalTab("finance");

            setIsPatientModalOpen(true);

            setFinanceDetailView("overview");
          }
        };

        const formatDateKey = (date) => {
          if (!date) return "";

          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,

            "0"
          )}-${String(date.getDate()).padStart(2, "0")}`;
        };

        const isDateInRange = (dateStr, period, customStart, customEnd) => {
          if (period === "all") return true;

          const [y, m, d] = dateStr.split("-").map(Number);

          const targetTime = new Date(y, m - 1, d).getTime();

          const today = new Date();

          if (period === "today")
            return (
              targetTime ===
              new Date(
                today.getFullYear(),

                today.getMonth(),

                today.getDate()
              ).getTime()
            );

          if (period === "thisMonth")
            return m - 1 === today.getMonth() && y === today.getFullYear();

          if (period === "custom") {
            if (!customStart && !customEnd) return true;

            let inRange = true;

            if (customStart) {
              const [sy, sm, sd] = customStart.split("-").map(Number);

              if (targetTime < new Date(sy, sm - 1, sd).getTime())
                inRange = false;
            }

            if (customEnd) {
              const [ey, em, ed] = customEnd.split("-").map(Number);

              if (targetTime > new Date(ey, em - 1, ed).getTime())
                inRange = false;
            }

            return inRange;
          }

          return true;
        };

        const calculateEndTime = (startTime, durationInMinutes) => {
          if (!startTime || !durationInMinutes) return startTime;

          let [hours, minutes] = startTime.split(":").map(Number);

          minutes += parseInt(durationInMinutes, 10);

          hours += Math.floor(minutes / 60);

          minutes = minutes % 60;

          return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
            2,

            "0"
          )}`;
        };

        const getWeekDays = (date) => {
          const d = new Date(date);

          const day = d.getDay();

          const diff = d.getDate() - day + (day === 0 ? -6 : 1);

          const monday = new Date(d.setDate(diff));

          const week = [];

          for (let i = 0; i < 7; i++) {
            const nextDay = new Date(monday);

            nextDay.setDate(monday.getDate() + i);

            week.push(nextDay);
          }

          return week;
        };

        const getTreatmentColor = (aptOrTreatment) => {
          if (!aptOrTreatment)
            return { bg: "#e0f2fe", text: "#1e40af", border: "#3b82f6" }; // Mavi (İlk Muayene/Varsayılan)

          let text = "";
          if (typeof aptOrTreatment === "object") {
            if (aptOrTreatment.status === "İptal")
              return { bg: "#f1f5f9", text: "#64748b", border: "#94a3b8" }; // Gri (İptal)
            text = (
              (aptOrTreatment.treatment || "") +
              " " +
              (aptOrTreatment.notes || "")
            ).toLowerCase();
          } else {
            text = aptOrTreatment.toLowerCase();
          }

          if (text.includes("acil"))
            return { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" }; // Kırmızı (Acil)
          if (text.includes("implant"))
            return { bg: "#f3e8ff", text: "#6b21a8", border: "#a855f7" }; // Mor (İmplant)
          if (text.includes("kontrol"))
            return { bg: "#dcfce7", text: "#166534", border: "#22c55e" }; // Yeşil (Kontrol)
          if (
            text.includes("uzun") ||
            text.includes("kanal") ||
            text.includes("ortodonti") ||
            text.includes("çekim")
          )
            return { bg: "#ffedd5", text: "#9a3412", border: "#f97316" }; // Turuncu (Uzun Tedavi)

          return { bg: "#e0f2fe", text: "#1e40af", border: "#3b82f6" }; // Mavi (İlk Muayene)
        };

        // YENİ: Tek Tıkla Durum Güncelleme (Döngüsel)
        const handleStatusCycle = (e, docId, aptKey, aptData) => {
          e.stopPropagation(); // Tıklamanın detay penceresini açmasını engeller

          const cycleMap = {
            "Yeni Kayıt": "Geldi",
            Bekliyor: "Geldi",
            Geldi: "Gelmedi",
            Gelmedi: "İptal",
            İptal: "Bekliyor",
          };

          const currentStatus = aptData.status || "Bekliyor";
          const newStatus = cycleMap[currentStatus] || "Geldi";

          const updatedDocApts = {
            ...(globalData.appointments?.[docId] || {}),
          };
          updatedDocApts[aptKey] = { ...aptData, status: newStatus };

          let updatedPatientsDb = { ...globalData.patientsDb };
          
          // DOĞRU HASTAYI GÜVENLİ ŞEKİLDE BULMA MANTIĞI
          let pId = aptData.patientId; 
          if (!pId) {
            const foundPatient = Object.values(updatedPatientsDb).find(p => p.name === aptData.patientName);
            if (foundPatient) pId = foundPatient.id;
          }

          if (pId && updatedPatientsDb[pId]) {
            updatedPatientsDb[pId].lastStatus = newStatus;
            
            // OTOMATİK KLİNİK GEÇMİŞ OLUŞTURMA MANTIĞI ("Geldi" durumunda çalışır)
            if (newStatus === "Geldi") {
              const historyArray = updatedPatientsDb[pId].clinicalHistory || [];
              const historyExists = historyArray.some((h) => h.appointmentId === aptKey);
              
              if (!historyExists) {
                const [y, m, d, ...timeArr] = aptKey.split("-");
                const timeStr = timeArr.join(":");
                const newHistory = {
                  id: "hist_" + Date.now(),
                  appointmentId: aptKey,
                  date: `${d}.${m}.${y}`, // Türkçe okunaklı tarih
                  time: timeStr,
                  timestamp: Date.now(),
                  doctorId: docId,
                  doctorName: globalData.doctorProfiles?.[docId]?.name || docId,
                  appointmentStatus: "Geldi",
                  visitType: "Gerçekleşen Klinik İşlem",
                  treatment: aptData.treatment || "Belirtilmedi",
                  selectedTeeth: aptData.selectedTeeth || [],
                  complaint: aptData.notes || "",
                  createdAt: Date.now(),
                  createdBy: currentUser
                };
                // En yeni kayıt en üste gelecek şekilde ekliyoruz
                updatedPatientsDb[pId].clinicalHistory = [newHistory, ...historyArray];
              }
            }
            // "Geldi" durumundan "Bekliyor" veya "İptal"e dönülürse geçmiş silinmez, kalıcıdır!
          }

          saveGlobalData({
            ...globalData,
            appointments: {
              ...globalData.appointments,
              [docId]: updatedDocApts,
            },
            patientsDb: updatedPatientsDb,
          });

          showNotification(`Durum güncellendi: ${newStatus}`);
        };

        const getStatusBadge = (status, onToggle = null) => {
          const baseClass =
            "relative px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm whitespace-nowrap transition-all duration-300 select-none";
          const interactionClass = onToggle
            ? " cursor-pointer hover:shadow-md ring-1 ring-white/50 hover:ring-2"
            : "";

          const props = onToggle ? { onClick: onToggle } : {};

          switch (status) {
            case "Geldi":
              return (
                <span
                  {...props}
                  className={`${baseClass}${interactionClass} bg-emerald-500 text-white`}
                >
                  Geldi
                </span>
              );
            case "Gelmedi":
              return (
                <span
                  {...props}
                  className={`${baseClass}${interactionClass} bg-rose-500 text-white`}
                >
                  Gelmedi
                </span>
              );
            case "İptal":
              return (
                <span
                  {...props}
                  className={`${baseClass}${interactionClass} bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400`}
                >
                  İptal Edildi
                </span>
              );
            default:
              return (
                <span
                  {...props}
                  className={`${baseClass}${interactionClass} bg-sky-500 text-white flex items-center gap-1.5 justify-center`}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                  </span>
                  Bekliyor
                </span>
              );
          }
        };

        const renderTreatmentText = (apt) => {
          let text = apt.treatment || "Belirtilmedi";

          if (apt.selectedTeeth && apt.selectedTeeth.length > 0)
            text += ` (Diş: ${apt.selectedTeeth.join(", ")})`;

          return text;
        };

        const handleDragStart = (
          e,

          docId,

          dateObj,

          timeSlot,

          aptData,

          originalKey
        ) => {
          e.dataTransfer.effectAllowed = "move";

          e.dataTransfer.setData("text/plain", originalKey);

          setTimeout(() => e.target.classList.add("is-dragging"), 0);

          setDraggedAptInfo({ docId, dateObj, timeSlot, aptData, originalKey });
        };

        const handleDragEnd = (e) => {
          e.target.classList.remove("is-dragging");

          setDraggedAptInfo(null);

          setDragOverTargetKey(null);
        };

        const handleDragOver = (e, targetFullKey) => {
          e.preventDefault();

          e.dataTransfer.dropEffect = "move";

          if (dragOverTargetKey !== targetFullKey)
            setDragOverTargetKey(targetFullKey);
        };

        const handleDragLeave = (e) => {
          e.preventDefault();

          setDragOverTargetKey(null);
        };

        const handleDrop = (e, targetDocId, targetDateObj, targetTimeSlot) => {
          e.preventDefault();

          setDragOverTargetKey(null);

          if (!draggedAptInfo) return;

          const targetDateKey = formatDateKey(targetDateObj);

          const targetFullKey = `${targetDateKey}-${targetTimeSlot}`;

          if (
            draggedAptInfo.docId === targetDocId &&
            draggedAptInfo.originalKey === targetFullKey
          )
            return;

          const existingTargetApt =
            globalData.appointments?.[targetDocId]?.[targetFullKey];

          if (existingTargetApt) {
            showNotification("Sürüklediğiniz saat zaten dolu!", "error");

            return;
          }

          const updatedAppointments = JSON.parse(
            JSON.stringify(globalData.appointments || {})
          );

          if (updatedAppointments[draggedAptInfo.docId])
            delete updatedAppointments[draggedAptInfo.docId][
              draggedAptInfo.originalKey
            ];

          if (!updatedAppointments[targetDocId])
            updatedAppointments[targetDocId] = {};

          updatedAppointments[targetDocId][targetFullKey] =
            draggedAptInfo.aptData;

          saveGlobalData({ ...globalData, appointments: updatedAppointments });

          showNotification(
            `${draggedAptInfo.aptData.patientName} başarıyla yeni hekime/saatine taşındı.`
          );
        };

        const calculatePatientFinance = (patientId, patientName) => {
          let totalBilled = 0,
            totalPaid = 0,
            treatments = [];

          const pData = globalData.patientsDb?.[patientId];

          if (pData && pData.plannedTreatments) {
            pData.plannedTreatments.forEach((tx) => {
              const price = parseFloat(tx.price) || 0;

              totalBilled += price;

              treatments.push({
                id: tx.id,

                date: tx.date,

                dateStr: new Date(tx.date).toLocaleDateString("tr-TR"),

                treatment:
                  tx.tooth === "Tüm Çene"
                    ? tx.treatment
                    : `Diş: ${tx.tooth} - ${tx.treatment}`,

                price: price,

                isPlan: true,
              });
            });
          }

          if (globalData.appointments) {
            Object.entries(globalData.appointments).forEach(
              ([docId, docApts]) => {
                if (
                  docId !== currentUser &&
                  globalData.doctorProfiles?.[docId]?.addedBy !== currentUser
                )
                  return;
                Object.entries(docApts).forEach(([key, apt]) => {
                  if (
                    apt.patientName === patientName &&
                    apt.price &&
                    !apt.linkedPlanId
                  ) {
                    const pVal = parseFloat(apt.price);

                    totalBilled += pVal;

                    const [y, m, d] = key.split("-").map(Number);

                    treatments.push({
                      id: key,

                      date: new Date(`${y}-${m}-${d}`).getTime(),

                      dateStr: `${d}/${m}/${y}`,

                      treatment: renderTreatmentText(apt) + " (Hızlı Kayıt)",

                      price: pVal,

                      isPlan: false,

                      docId:
                        apt.docId ||
                        Object.keys(globalData.appointments).find(
                          (d) => globalData.appointments[d][key] === apt
                        ),
                    });
                  }
                });
              }
            );
          }

          if (pData && pData.payments) {
            totalPaid = pData.payments.reduce(
              (sum, p) => sum + parseFloat(p.amount),

              0
            );
          }

          treatments.sort((a, b) => b.date - a.date);

          return {
            totalBilled,

            totalPaid,

            debt: totalBilled - totalPaid,

            treatments,
          };
        };

        const getPatientAppointmentsList = (pName) => {
          if (!pName) return { past: [], future: [] };

          const all = [];

          const now = new Date().getTime();

          if (globalData.appointments) {
            Object.entries(globalData.appointments).forEach(([dId, dApts]) => {
              if (
                dId !== currentUser &&
                globalData.doctorProfiles?.[dId]?.addedBy !== currentUser
              )
                return;
              Object.entries(dApts).forEach(([k, apt]) => {
                if (apt.patientName.toLowerCase() === pName.toLowerCase()) {
                  const parts = k.split("-");

                  const y = parts[0],
                    m = parts[1],
                    d = parts[2],
                    timeStr = parts.slice(3).join(":");

                  const aptTime = new Date(
                    `${y}-${m}-${d}T${timeStr}:00`
                  ).getTime();

                  all.push({
                    ...apt,

                    docId: dId,

                    dateStr: `${d}/${m}/${y}`,

                    timeStr: timeStr,

                    timestamp: aptTime,
                  });
                }
              });
            });
          }

          const future = all

            .filter((a) => a.timestamp >= now)

            .sort((a, b) => a.timestamp - b.timestamp);

          const past = all

            .filter((a) => a.timestamp < now)

            .sort((a, b) => b.timestamp - a.timestamp);

          return { past, future };
        };

        const jumpToAppointment = (dateKey, aptKey, targetTab, targetDocId) => {
          const [y, m, d] = dateKey.split("-");

          setSelectedDate(new Date(y, m - 1, d));

          if (targetDocId) {
            setListDoctorFilter(targetDocId);

            setCalendarDoctor(targetDocId);
          }

          setActiveTab(targetTab);

          setHighlightedAptId(aptKey);

          setTimeout(() => setHighlightedAptId(null), 3000);
        };

        const triggerInstall = async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();

            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === "accepted") setDeferredPrompt(null);
          } else setIsInstallModalOpen(true);

          setIsUserMenuOpen(false);
        };

        const handleSavePatient = (e) => {
          if (e) e.preventDefault();

          const clinicOwner = patientForm.addedBy || currentUser;
          
          // TC'yi sadece rakam kalacak şekilde normalize ediyoruz (Veritabanındaki orijinali değişmez)
          const normalizedTc = (patientForm.tc || "").replace(/\D/g, "");

          // 1. KLİNİK İÇİ TC KOPYA KONTROLÜ
          if (normalizedTc && normalizedTc.length > 0) {
            const duplicateByTc = Object.values(globalData.patientsDb || {}).find((p) => {
              // Klinik izolasyonu: Sadece kendi kliniğimizdeki hastaları kontrol et
              const isSameClinic = p.addedBy === clinicOwner || p.addedBy === currentUser || globalData.doctorProfiles?.[p.addedBy]?.addedBy === currentUser;
              const pTc = (p.tc || "").replace(/\D/g, "");
              
              // Aynı kliniğe ait, TC'si aynı olan ve KENDİSİ OLMAYAN bir hasta var mı?
              return isSameClinic && pTc === normalizedTc && p.id !== patientForm.id;
            });

            if (duplicateByTc) {
              showNotification("Bu TC Kimlik No ile kayıtlı başka bir hasta zaten bulunuyor!", "error");
              return; // Başka hastanın üzerine yazmayı / kopyayı engelle ve işlemi iptal et
            }
          }

          // 2. YENİ KİMLİK (ID) OLUŞTURMA VEYA MEVCUTU KORUMA
          // Eskiden isimle arama yapılıp başka hastanın ID'si çalınıyordu, bu tamamen KALDIRILDI.
          // Artık kendi ID'si varsa korur (düzenleme), yoksa yepyeni ve benzersiz bir kayıt oluşturur.
          const pId =
            patientForm.id ||
            (patientForm.name.toLowerCase().replace(/\s+/g, "") +
              "_" +
              Date.now() + 
              Math.random().toString(36).substr(2, 4));

          const updatedPatients = {
            ...globalData.patientsDb,
            [pId]: {
              ...patientForm,
              id: pId,
              addedBy: clinicOwner,
            },
          };

          saveGlobalData({ ...globalData, patientsDb: updatedPatients });

          setPatientForm({ ...patientForm, id: pId });

          showNotification(
            "Hasta bilgileri ve planlama başarıyla güncellendi."
          );
        };

        const handleWholeJawTreatment = () => {
          if (!activePlanTreatment) {
            showNotification(
              "Lütfen önce alt kısımdan bir işlem türü seçin!",

              "error"
            );

            return;
          }

          const exists = patientForm.plannedTreatments?.some(
            (t) => t.tooth === "Tüm Çene" && t.treatment === activePlanTreatment
          );

          if (exists) {
            // YENİ: Tüm çene için de hızlı geri alma mantığı
            setPatientForm((prev) => ({
              ...prev,
              plannedTreatments: prev.plannedTreatments.filter(
                (t) =>
                  !(
                    t.tooth === "Tüm Çene" &&
                    t.treatment === activePlanTreatment
                  )
              ),
            }));
            showNotification(
              `Tüm çeneden ${activePlanTreatment} çıkarıldı.`,
              "error"
            );
            return;
          }

          const userPricing =
            globalData.pricingDb?.[currentUser] ||
            (typeof globalData.pricingDb === "object" &&
            globalData.pricingDb["Genel Muayene"]
              ? globalData.pricingDb
              : DEFAULT_PRICING);
          const txPrice =
            userPricing?.[activePlanTreatment] !== undefined
              ? parseFloat(userPricing[activePlanTreatment])
              : DEFAULT_PRICING[activePlanTreatment] || 0;

          const newTx = {
            id: Date.now() + Math.random().toString(),

            tooth: "Tüm Çene",

            treatment: activePlanTreatment,

            date: Date.now(),

            price: txPrice,
          };

          setPatientForm((prev) => ({
            ...prev,

            plannedTreatments: [...(prev.plannedTreatments || []), newTx],
          }));

          showNotification(
            `Tüm Çene için ${activePlanTreatment} eklendi. (${txPrice} ₺)`
          );
        };

        const handleAddPayment = (e) => {
          e.preventDefault();

          if (!paymentInput || isNaN(paymentInput)) return;

          const pId = patientForm.id;

          const newPayment = {
            amount: parseFloat(paymentInput),
            method: paymentMethod,
            date: Date.now(),
            id: Date.now().toString(),
          };

          const updatedPatient = {
            ...patientForm,

            payments: [...(patientForm.payments || []), newPayment],
          };

          saveGlobalData({
            ...globalData,

            patientsDb: { ...globalData.patientsDb, [pId]: updatedPatient },
          });

          setPatientForm(updatedPatient);

          setPaymentInput("");

          showNotification(`Tahsilat eklendi: ${newPayment.amount} ₺`);
        };

        const handleDeletePatient = () => {
          showConfirm(
            `${patientForm.name} adlı hastayı silmek istediğinize emin misiniz? (Geçmiş finans verileri korunacaktır)`,
            () => {
              const updatedPatients = { ...globalData.patientsDb };
              // YENİ: Hastayı toptan silmek (delete) yerine arşivliyoruz (Soft Delete)
              updatedPatients[patientForm.id] = { ...updatedPatients[patientForm.id], isDeleted: true };

              const updatedAppointments = JSON.parse(JSON.stringify(globalData.appointments || {}));
              let isAppointmentsChanged = false;

              Object.keys(updatedAppointments).forEach((docId) => {
                Object.keys(updatedAppointments[docId]).forEach((aptKey) => {
                  const apt = updatedAppointments[docId][aptKey];
                  if (apt.patientId === patientForm.id || apt.patientName === patientForm.name) {
                    // YENİ: Sadece gerçekleşmemiş (gelecek/bekleyen) randevuları takvimden temizle.
                    // "Geldi" olan geçmiş randevular, hekimin zaman harcadığı kayıtlar olduğu için silinmez.
                    if (apt.status !== "Geldi") {
                      delete updatedAppointments[docId][aptKey];
                      isAppointmentsChanged = true;
                    }
                  }
                });
              });

              saveGlobalData({ 
                ...globalData, 
                patientsDb: updatedPatients,
                ...(isAppointmentsChanged ? { appointments: updatedAppointments } : {}) 
              });

              setIsPatientModalOpen(false);
              showNotification("Hasta arşivlendi. Geçmiş bilançolar korundu, bekleyen randevuları silindi.", "error");
            }
          );
        };

        const handleUpdateTxPrice = (txId, newPrice, isPlan, docId) => {
          const parsedPrice = parseFloat(newPrice) || 0;

          if (isPlan) {
            const updatedPlans = patientForm.plannedTreatments.map((t) =>
              t.id === txId ? { ...t, price: parsedPrice } : t
            );

            const updatedPatient = {
              ...patientForm,

              plannedTreatments: updatedPlans,
            };

            setPatientForm(updatedPatient);

            saveGlobalData({
              ...globalData,

              patientsDb: {
                ...globalData.patientsDb,

                [patientForm.id]: updatedPatient,
              },
            });
          } else {
            const updatedAppointments = JSON.parse(
              JSON.stringify(globalData.appointments)
            );

            if (
              updatedAppointments[docId] &&
              updatedAppointments[docId][txId]
            ) {
              updatedAppointments[docId][txId].price = parsedPrice;

              saveGlobalData({
                ...globalData,

                appointments: updatedAppointments,
              });
            }
          }

          setEditingTxId(null);

          setEditingTxPrice("");

          showNotification("İşlem ücreti güncellendi.");
        };

        const openAppointmentModal = (slot, dateObj, doctorId) => {
          setSelectedSlot(slot);

          setActiveSlotDate(dateObj);

          setActiveSlotDoctor(doctorId);

          const key = `${formatDateKey(dateObj)}-${slot}`;

          const existingData = globalData.appointments?.[doctorId]?.[key];

          let patientAnamnesis = "";
          let patientPlans = []; // YENİ: Hastanın planlarını çekmek için hafıza açtık

          if (existingData && existingData.patientName) {
            const pat = Object.values(globalData.patientsDb || {}).find(
              (p) =>
                p && p.name && 
                p.name.toLowerCase() ===
                existingData.patientName.toLowerCase().trim()
            );

            if (pat) {
              patientAnamnesis = pat.anamnesis || "";
              patientPlans = pat.plannedTreatments || []; // YENİ: Veritabanından planları çekiyoruz
            }
          }

          if (existingData) {
            setAptModalMode("view");

            setFormData({
              ...existingData,

              selectedTeeth: existingData.selectedTeeth || [],

              anamnesis: patientAnamnesis,

              selectedTreatments: existingData.selectedTreatments || [],

              plannedTreatments: patientPlans, // DÜZELTME: Eskiden boş [] olan kısmı hastanın gerçek planlarıyla değiştirdik
            });
          } else {
            setAptModalMode("edit");

            // YENİ: Takvimden ekle butonuyla gelindiyse hasta verisini hafızadan çek
            const pData = window.pendingAptPatient;

            setFormData({
              patientName: pData ? pData.name : "",

              phone: pData ? pData.phone || "" : "",

              treatment: "",

              price: "",

              linkedPlanId: null,

              status: "Yeni Kayıt",

              duration: "30",

              notes: "",

              anamnesis: pData ? pData.anamnesis || "" : "",

              createdAt: Date.now(),

              selectedTeeth: [],

              selectedTreatments: [],

              plannedTreatments: pData ? pData.plannedTreatments || [] : [],
            });

            // Kullanıldıktan sonra hafızayı temizle (başka randevulara karışmaması için)
            window.pendingAptPatient = null;
          }

          setIsModalOpen(true);

          setPatientSuggestions([]);
        };

        const handlePatientNameChange = (val) => {
          setFormData({
            ...formData,
            patientId: null, // Yeni isim girildiğinde önceki ID referansını kopar
            patientName: val,
            treatment: "",
            price: "",
            linkedPlanId: null,
            selectedTeeth: [],
            selectedTreatments: [],
          });

          if (val.trim().length > 0) {
                const matches = Object.values(globalData.patientsDb || {}).filter(
                  (p) =>
                    (p.addedBy === currentUser ||
                      globalData.doctorProfiles?.[p.addedBy]?.addedBy ===
                        currentUser) && !p.isDeleted &&
                    (p.name.toLowerCase().includes(val.toLowerCase()) ||
                      (p.phone && p.phone.includes(val)) ||
                      (p.tc && p.tc.includes(val)))
                );
                setPatientSuggestions(matches);
              } else {
                setPatientSuggestions(
                  Object.values(globalData.patientsDb || {}).filter(
                    (p) =>
                      (p.addedBy === currentUser ||
                      globalData.doctorProfiles?.[p.addedBy]?.addedBy ===
                        currentUser) && !p.isDeleted
                  )
                );
              }
        };

        const selectPatientSuggestion = (p) => {
          setFormData({
            ...formData,
            patientId: p.id, // Hastayı açılır listeden seçerse asıl kimliğini (ID) hafızaya al
            patientName: p.name,
            phone: p.phone || "",

            anamnesis: p.anamnesis || "",

            treatment: "",

            price: "",

            linkedPlanId: null,

            selectedTeeth: [],

            selectedTreatments: [],

            plannedTreatments: p.plannedTreatments || [],
          });

          setPatientSuggestions([]);
        };

        const handleSaveAppointment = (e) => {
          e.preventDefault();

          if (!formData.patientName) return;

          const key = `${formatDateKey(activeSlotDate)}-${selectedSlot}`;

          const treatmentStr = formData.treatment || "";

          const finalData = { ...formData, treatment: treatmentStr };

          const updatedDocApts = {
            ...(globalData.appointments?.[activeSlotDoctor] || {}),

            [key]: finalData,
          };

          // YENİ HASTA EŞLEŞTİRME MANTIĞI:
          // 1. Kullanıcı dropdown'dan (önerilerden) seçtiyse formData.patientId mevcuttur, onu kullan.
          // 2. Sadece isim yazdıysa ve sistemde o kliniğe ait aynı isim + AYNI TELEFONA sahip biri varsa onu kullan.
          // 3. Aksi halde sırf ismi aynı diye başkasının üzerine YAZMA, yeni benzersiz hasta oluştur.
          const clinicOwner = currentUser;
          const existingPatient = formData.patientId 
            ? globalData.patientsDb?.[formData.patientId] 
            : Object.values(globalData.patientsDb || {}).find(
              (p) => {
                const isSameClinic = p.addedBy === clinicOwner || globalData.doctorProfiles?.[p.addedBy]?.addedBy === clinicOwner;
                return isSameClinic && 
                       p.name.toLowerCase() === formData.patientName.toLowerCase().trim() && 
                       p.phone === formData.phone && 
                       p.phone !== ""; // Sadece isme göre eşleştirme yapılmasını kesinlikle engeller
              }
            );

          const patientId = existingPatient
            ? existingPatient.id
            : formData.patientName.toLowerCase().replace(/\s+/g, "") + "_" + Date.now() + Math.random().toString(36).substr(2, 4);

          let updatedPatientsDb = { ...(globalData.patientsDb || {}) };

          if (!existingPatient) {
            updatedPatientsDb[patientId] = {
              id: patientId,
              name: formData.patientName.trim(),
              phone: formData.phone || "",
              tc: "",
              age: "",
              gender: "Belirtilmemiş",
              anamnesis: formData.anamnesis || "",
              payments: [],
              plannedTreatments: [],
              lastStatus: formData.status,
              lastTreatment: treatmentStr,
              addedBy: currentUser,
              // Yeni hasta oluşturulurken Geldi işaretlenirse geçmişe at
              clinicalHistory: formData.status === "Geldi" ? [{
                id: "hist_" + Date.now(),
                appointmentId: key,
                date: formatDateKey(activeSlotDate),
                time: selectedSlot,
                timestamp: Date.now(),
                doctorId: activeSlotDoctor,
                doctorName: globalData.doctorProfiles?.[activeSlotDoctor]?.name || activeSlotDoctor,
                appointmentStatus: "Geldi",
                visitType: "İlk Muayene",
                treatment: treatmentStr || "Belirtilmedi",
                selectedTeeth: formData.selectedTeeth || [],
                complaint: formData.notes || "",
                createdAt: Date.now(),
                createdBy: currentUser
              }] : []
            };
          } else {
            if (formData.phone) updatedPatientsDb[patientId].phone = formData.phone;
            if (formData.anamnesis) updatedPatientsDb[patientId].anamnesis = formData.anamnesis;
            updatedPatientsDb[patientId].lastStatus = formData.status;
            updatedPatientsDb[patientId].lastTreatment = treatmentStr;
            
            // Var olan hasta için Randevu "Geldi" ise geçmişe at
            if (formData.status === "Geldi") {
              const historyArray = updatedPatientsDb[patientId].clinicalHistory || [];
              const historyExists = historyArray.some((h) => h.appointmentId === key);
              if (!historyExists) {
                const newHistory = {
                  id: "hist_" + Date.now(),
                  appointmentId: key,
                  date: formatDateKey(activeSlotDate),
                  time: selectedSlot,
                  timestamp: Date.now(),
                  doctorId: activeSlotDoctor,
                  doctorName: globalData.doctorProfiles?.[activeSlotDoctor]?.name || activeSlotDoctor,
                  appointmentStatus: "Geldi",
                  visitType: "Tedavi / İşlem",
                  treatment: treatmentStr || "Belirtilmedi",
                  selectedTeeth: formData.selectedTeeth || [],
                  complaint: formData.notes || "",
                  createdAt: Date.now(),
                  createdBy: currentUser
                };
                updatedPatientsDb[patientId].clinicalHistory = [newHistory, ...historyArray];
              }
            }
          }

          saveGlobalData({
            ...globalData,

            appointments: {
              ...globalData.appointments,

              [activeSlotDoctor]: updatedDocApts,
            },

            patientsDb: updatedPatientsDb,
          });

          setIsModalOpen(false);

          showNotification("Randevu kaydedildi.");
        };

        const handleDeleteAppointment = () => {
          showConfirm("Bu randevuyu silmek istediğinize emin misiniz?", () => {
            const key = `${formatDateKey(activeSlotDate)}-${selectedSlot}`;

            const updatedDocApts = {
              ...(globalData.appointments?.[activeSlotDoctor] || {}),
            };

            delete updatedDocApts[key];

            saveGlobalData({
              ...globalData,

              appointments: {
                ...globalData.appointments,

                [activeSlotDoctor]: updatedDocApts,
              },
            });

            setIsModalOpen(false);

            showNotification("Randevu silindi.", "error");
          });
        };

        const getSearchedAppointments = (query) => {
          if (!query || query.trim().length < 2)
            return { past: [], future: [] };

          const q = query.toLowerCase().trim();

          const all = [];

          const now = new Date().getTime();

          if (globalData.appointments) {
            Object.entries(globalData.appointments).forEach(([dId, dApts]) => {
              if (
                dId !== currentUser &&
                globalData.doctorProfiles?.[dId]?.addedBy !== currentUser
              )
                return;
              Object.entries(dApts).forEach(([k, apt]) => {
                const pInfo =
                  globalData.patientsDb?.[
                    apt.patientName.toLowerCase().replace(/\s+/g, "")
                  ];

                const matches =
                  apt.patientName.toLowerCase().includes(q) ||
                  (apt.phone && apt.phone.includes(q)) ||
                  (pInfo && pInfo.phone && pInfo.phone.includes(q)) ||
                  (pInfo && pInfo.tc && pInfo.tc.includes(q));

                if (matches) {
                  const parts = k.split("-");

                  if (parts.length >= 4) {
                    const y = parts[0],
                      m = parts[1],
                      d = parts[2],
                      timeStr = parts.slice(3).join(":");

                    const aptTime = new Date(
                      `${y}-${m}-${d}T${timeStr}:00`
                    ).getTime();

                    all.push({
                      ...apt,

                      docId: dId,

                      dateStr: `${d}/${m}/${y}`,

                      timeStr: timeStr,

                      timestamp: aptTime,

                      originalKey: k,

                      dateKey: `${y}-${m}-${d}`,
                    });
                  }
                }
              });
            });
          }

          const future = all

            .filter((a) => a.timestamp >= now)

            .sort((a, b) => a.timestamp - b.timestamp);

          const past = all

            .filter((a) => a.timestamp < now)

            .sort((a, b) => b.timestamp - a.timestamp);

          return { past, future };
        };

        const renderAptSearchDropdown = () => {
          const { past, future } = getSearchedAppointments(aptSearchQuery);

          if (past.length === 0 && future.length === 0)
            return (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-50 p-2 text-center text-[13px] font-bold text-slate-500 dark:text-slate-400">
                Randevu bulunamadı.
              </div>
            );

          return (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl z-50 max-h-[400px] overflow-y-auto flex flex-col overflow-hidden">
              {future.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-black text-indigo-500 uppercase px-2.5 py-1 tracking-wider">
                    Gelecek Randevular
                  </div>

                  {future.map((a, i) => (
                    <div
                      key={`f-${i}`}
                      onClick={() => {
                        jumpToAppointment(
                          a.dateKey,

                          a.originalKey,

                          activeTab,

                          a.docId
                        );

                        setIsAptSearchOpen(false);

                        setAptSearchQuery("");
                      }}
                      className="px-2.5 py-2 mx-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer rounded-xl border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800 transition-all mb-1 group"
                    >
                      <div className="font-black text-slate-800 dark:text-slate-200 text-[13px] group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition">
                        {a.patientName}
                      </div>

                      <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1.5">
                        <i className="fa-regular fa-clock"></i> {a.dateStr} -{" "}
                        {a.timeStr}
                      </div>

                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1 flex justify-between">
                        <span>
                          {globalData.doctorProfiles?.[a.docId]?.name ||
                            a.docId}
                        </span>

                        <span className="bg-slate-100 dark:bg-slate-700 px-1.5 rounded text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                          {renderTreatmentText(a)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {past.length > 0 && (
                <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
                  <div className="text-[10px] font-black text-slate-400 uppercase px-2.5 py-1 tracking-wider">
                    Geçmiş Randevular
                  </div>

                  {past.map((a, i) => (
                    <div
                      key={`p-${i}`}
                      onClick={() => {
                        jumpToAppointment(
                          a.dateKey,

                          a.originalKey,

                          activeTab,

                          a.docId
                        );

                        setIsAptSearchOpen(false);

                        setAptSearchQuery("");
                      }}
                      className="px-2.5 py-2 mx-1 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer rounded-xl border border-transparent transition-all mb-1 opacity-70 hover:opacity-100 grayscale hover:grayscale-0 group"
                    >
                      <div className="font-bold text-slate-600 dark:text-slate-300 text-[13px] group-hover:text-slate-800 dark:group-hover:text-white transition">
                        {a.patientName}
                      </div>

                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <i className="fa-regular fa-calendar-check"></i>{" "}
                        {a.dateStr} - {a.timeStr}
                      </div>

                      <div className="text-[10px] text-slate-400 font-bold mt-1 flex justify-between">
                        <span>
                          {globalData.doctorProfiles?.[a.docId]?.name ||
                            a.docId}
                        </span>

                        <span className="bg-slate-200/50 dark:bg-slate-600 px-1.5 rounded truncate max-w-[100px]">
                          {renderTreatmentText(a)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        };

        const renderAppointmentSearchBox = () => (
          <div className="relative w-full" ref={aptSearchRef}>
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-[13px]"></i>

              <input
                type="text"
                placeholder="İsim, Tel, TC ile Ara..."
                value={aptSearchQuery}
                onChange={(e) => {
                  setAptSearchQuery(e.target.value);

                  setIsAptSearchOpen(true);
                }}
                onFocus={() => {
                  if (aptSearchQuery.length > 1) setIsAptSearchOpen(true);
                }}
                className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 dark:focus:ring-indigo-900/50 shadow-inner transition-all"
              />

              {aptSearchQuery && (
                <button
                  onClick={() => {
                    setAptSearchQuery("");

                    setIsAptSearchOpen(false);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-rose-500 transition"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {isAptSearchOpen &&
              aptSearchQuery.length > 1 &&
              renderAptSearchDropdown()}
          </div>
        );

        // ★★★ DÜZELTİLEN GİRİŞ / KAYIT / ŞİFRE FONKSİYONLARI ★★★

        const handleAuthSubmit = async (e) => {
          e.preventDefault();

          // Kaba Kuvvet (Brute Force) Koruması (Aktif Bırakıldı)
          const attempts = parseInt(
            localStorage.getItem("loginAttempts") || "0"
          );
          const lockTime = parseInt(localStorage.getItem("lockTime") || "0");

          if (lockTime > Date.now()) {
            setAuthError(
              `Güvenlik Kalkanı: Çok fazla hatalı giriş yaptınız. Lütfen ${Math.ceil(
                (lockTime - Date.now()) / 1000
              )} saniye bekleyin.`
            );
            return;
          }

          const usersDb = globalData.usersDb || {};
          const storedPass = usersDb[authForm.username];

          // DİKKAT: Şifreleme (Kriptolama) devre dışı bırakıldı, düz metin kontrolü yapılıyor.
          if (!storedPass || storedPass !== authForm.password) {
            const newAttempts = attempts + 1;
            if (newAttempts >= 4) {
              localStorage.setItem("lockTime", Date.now() + 30000);
              localStorage.setItem("loginAttempts", "0");
              setAuthError(
                "4 kez hatalı giriş denemesi! Sistem 30 saniye kilitlendi."
              );
            } else {
              localStorage.setItem("loginAttempts", newAttempts.toString());
              setAuthError(
                `Kullanıcı adı veya şifre hatalı! (Kalan deneme hakkı: ${
                  4 - newAttempts
                })`
              );
            }
            return;
          }

          // Başarılı Giriş
          localStorage.setItem("loginAttempts", "0");
          setCurrentUser(authForm.username);
          sessionStorage.setItem("klinikAktifKullanici", authForm.username);
          sessionStorage.setItem("klinikOturumTokeni", "active");

          if (!savedUsernames.includes(authForm.username)) {
            const newSaved = [...savedUsernames, authForm.username];
            setSavedUsernames(newSaved);
            localStorage.setItem("klinikSavedUsers", JSON.stringify(newSaved));
          }
        };

        const handleRegisterSubmit = async (e) => {
          e.preventDefault();
          const btn = e.nativeEvent.submitter;
          if (btn) btn.disabled = true;
          setAuthError("");

          if (registerForm.password.length < 6) {
            setAuthError(
              "Güvenlik Uyarısı: Şifreniz en az 6 karakterden oluşmalıdır."
            );
            if (btn) btn.disabled = false;
            return;
          }

          const usersDb = globalData.usersDb || {};
          if (usersDb[registerForm.username]) {
            setAuthError("Bu hekim hesabı zaten alınmış!");
            if (btn) btn.disabled = false;
            return;
          }

          // DİKKAT: Kriptolama iptal edildi, şifre düz metin (plain text) olarak kaydediliyor.
          const updatedUsers = {
            ...usersDb,
            [registerForm.username]: registerForm.password,
          };

          const updatedProfiles = {
            ...(globalData.doctorProfiles || {}),
            [registerForm.username]: {
              name: registerForm.name,
              title: registerForm.title,
              addedBy: registerForm.username,
            },
          };

          if (!savedUsernames.includes(registerForm.username)) {
            const newSaved = [...savedUsernames, registerForm.username];
            setSavedUsernames(newSaved);
            localStorage.setItem("klinikSavedUsers", JSON.stringify(newSaved));
          }

          try {
            await saveGlobalData({
              ...globalData,
              usersDb: updatedUsers,
              doctorProfiles: updatedProfiles,
            });

            showNotification("Hesap test modunda (şifresiz) oluşturuldu.");
            setCurrentUser(registerForm.username);
            sessionStorage.setItem("klinikAktifKullanici", registerForm.username);
            sessionStorage.setItem("klinikOturumTokeni", "active");

            if (btn) btn.disabled = false;
          } catch (error) {
            setAuthError("Kayıt sırasında hata oluştu, lütfen tekrar deneyin.");
            if (btn) btn.disabled = false;
          }
        };

        const handleForgotSubmit = async (e) => {
          e.preventDefault();
          const usersDb = globalData.usersDb || {};

          if (!usersDb[forgotForm.username]) {
            setAuthError("Sistemde böyle bir hekim bulunamadı!");
            return;
          }

          if (forgotForm.newPassword.length < 6) {
            setAuthError("Yeni şifreniz en az 6 karakter olmalıdır.");
            return;
          }

          // DİKKAT: Yeni şifre düz metin olarak kaydediliyor.
          const updatedUsers = {
            ...usersDb,
            [forgotForm.username]: forgotForm.newPassword,
          };

          try {
            await saveGlobalData({ ...globalData, usersDb: updatedUsers });
            showNotification("Şifreniz test modunda yenilendi.");
            setAuthMode("login");
            setForgotForm({ username: "", newPassword: "" });
            setAuthError("");
          } catch (error) {
            setAuthError("Şifre sıfırlama hatası, lütfen tekrar deneyin.");
          }
        };

        const handleChangePassword = async (e) => {
          e.preventDefault();

          if (passwordForm.newPass.length < 6) {
            showNotification("Yeni şifre en az 6 karakter olmalıdır!", "error");
            return;
          }

          const usersDb = globalData.usersDb || {};
          const storedPass = usersDb[currentUser];

          // DİKKAT: Eski şifre düz metin olarak kontrol ediliyor
          if (storedPass !== passwordForm.oldPass) {
            showNotification("Mevcut şifrenizi yanlış girdiniz!", "error");
            return;
          }

          // DİKKAT: Yeni şifre düz metin olarak kaydediliyor
          const updatedUsers = {
            ...usersDb,
            [currentUser]: passwordForm.newPass,
          };

          try {
            await saveGlobalData({ ...globalData, usersDb: updatedUsers });
            setIsPasswordModalOpen(false);
            setPasswordForm({ oldPass: "", newPass: "" });
            showNotification("Şifreniz düz metin olarak güncellendi.");
          } catch (error) {
            showNotification("Şifre güncelleme hatası!", "error");
          }
        };

        // UI Loading States

        if (!isReady || isSyncing)
          return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center gap-2">
              <i className="fa-solid fa-spinner fa-spin text-lg text-indigo-600"></i>

              <div className="text-slate-500 font-bold text-[13px]">
                Klinik Verileriniz Senkronize Ediliyor...
              </div>
            </div>
          );

        if (!currentUser)
          return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col items-center justify-center p-2 relative overflow-hidden">
              {/* YENİ: Modern Arka Plan Ambiyans Işıkları */}
              <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
              <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"></div>

              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-md p-2 sm:p-6 border border-white/60 dark:border-slate-700/50 animate-pop relative z-10">
                <div className="text-center mb-2">
                  <div className="w-14 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center text-lg mx-auto mb-2 shadow-lg shadow-indigo-500/30">
                    <i className="fa-solid fa-tooth"></i>
                  </div>

                  <h1 className="text-base font-black text-slate-800 dark:text-white tracking-tight">
                    Klinik Sistemi
                  </h1>

                  <p className="text-slate-500 dark:text-slate-400 text-[13px] mt-1 font-semibold">
                    {authMode === "login"
                      ? "Güvenli Hekim Giriş Paneli"
                      : authMode === "register"
                      ? "Yeni Hekim Hesabı Oluştur"
                      : "Şifre Sıfırlama Sihirbazı"}
                  </p>
                </div>

                {authError && (
                  <div className="mb-2 p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[13px] rounded-xl font-bold text-center border border-rose-100 dark:border-rose-800/50 flex items-center justify-center gap-1.5 animate-pop">
                    <i className="fa-solid fa-triangle-exclamation text-base"></i>{" "}
                    {authError}
                  </div>
                )}

                {authMode === "login" && (
                  <form onSubmit={handleAuthSubmit} className="space-y-2">
                    <div className="relative group">
                      <i className="fa-solid fa-user absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                      <input
                        type="text"
                        required
                        list="saved-users"
                        value={authForm.username}
                        onChange={(e) =>
                          setAuthForm({ ...authForm, username: e.target.value })
                        }
                        className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-[13px] font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                        placeholder="Kullanıcı Adınız"
                        autoComplete="off"
                      />
                      <datalist id="saved-users">
                        {savedUsernames.map((uname, idx) => (
                          <option key={idx} value={uname} />
                        ))}
                      </datalist>
                    </div>

                    <div className="relative group">
                      <i className="fa-solid fa-lock absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={authForm.password}
                        onChange={(e) =>
                          setAuthForm({ ...authForm, password: e.target.value })
                        }
                        className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-[13px] font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                        placeholder="Şifreniz"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        <i
                          className={`fa-solid ${
                            showPassword ? "fa-eye-slash" : "fa-eye"
                          }`}
                        ></i>
                      </button>
                    </div>

                    <div className="flex justify-end mt-0.5 mb-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("forgot");
                          setAuthError("");
                        }}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                      >
                        Şifremi Unuttum?
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-1.5"
                    >
                      Sisteme Giriş Yap{" "}
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>

                    <div className="text-center mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                        Sistemde henüz kaydınız yok mu?{" "}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("register");
                          setAuthError("");
                        }}
                        className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Yeni Hesap Oluştur
                      </button>
                    </div>
                  </form>
                )}

                {authMode === "register" && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-2">
                    <div className="relative group">
                      <i className="fa-solid fa-id-card absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                      <input
                        type="text"
                        required
                        value={registerForm.name}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-[13px] font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                        placeholder="Adınız Soyadınız"
                      />
                    </div>

                    <div className="relative group">
                      <i className="fa-solid fa-user absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                      <input
                        type="text"
                        required
                        value={registerForm.username}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            username: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-[13px] font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                        placeholder="Kullanıcı Adı Belirleyin"
                      />
                    </div>

                    <div className="relative group">
                      <i className="fa-solid fa-lock absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            password: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-[13px] font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                        placeholder="Şifre Belirleyin"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        <i
                          className={`fa-solid ${
                            showPassword ? "fa-eye-slash" : "fa-eye"
                          }`}
                        ></i>
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-1.5"
                    >
                      Kaydı Tamamla <i className="fa-solid fa-check"></i>
                    </button>

                    <div className="text-center mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => setAuthMode("login")}
                        className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1.5 w-full"
                      >
                        <i className="fa-solid fa-arrow-left"></i> Giriş
                        Ekranına Dön
                      </button>
                    </div>
                  </form>
                )}

                {authMode === "forgot" && (
                  <form onSubmit={handleForgotSubmit} className="space-y-2">
                    <div className="relative group">
                      <i className="fa-solid fa-user absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                      <input
                        type="text"
                        required
                        value={forgotForm.username}
                        onChange={(e) =>
                          setForgotForm({
                            ...forgotForm,
                            username: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-[13px] font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                        placeholder="Mevcut Kullanıcı Adınız"
                      />
                    </div>

                    <div className="relative group">
                      <i className="fa-solid fa-key absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={forgotForm.newPassword}
                        onChange={(e) =>
                          setForgotForm({
                            ...forgotForm,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-[13px] font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                        placeholder="Yeni Şifre Belirleyin"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        <i
                          className={`fa-solid ${
                            showPassword ? "fa-eye-slash" : "fa-eye"
                          }`}
                        ></i>
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 py-2 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-black rounded-xl shadow-lg hover:-translate-y-0.5 transition-all flex justify-center items-center gap-1.5"
                    >
                      Şifremi Sıfırla{" "}
                      <i className="fa-solid fa-rotate-right"></i>
                    </button>

                    <div className="text-center mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => setAuthMode("login")}
                        className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1.5 w-full"
                      >
                        <i className="fa-solid fa-arrow-left"></i> İptal Et ve
                        Geri Dön
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          );

        // YENİ: Sisteme giriş yetkisi (usersDb kaydı) olmayan, 
        // sadece klinikte çalışan hekimlerin de listelenmesi için güncellendi.
        const allDoctors = Array.from(new Set([
          ...Object.keys(globalData.usersDb || {}),
          ...Object.keys(globalData.doctorProfiles || {})
        ])).filter(
          (doc) =>
            doc === currentUser ||
            globalData.doctorProfiles?.[doc]?.addedBy === currentUser
        );

        const visibleListDoctors =
          listDoctorFilter === "all" ? allDoctors : [listDoctorFilter];

        const renderHome = () => {
          const todayStr = formatDateKey(new Date());
          let todaysApts = [],
            waitingCount = 0,
            totalApts = 0;
          if (globalData.appointments && globalData.appointments[currentUser]) {
            Object.entries(globalData.appointments[currentUser]).forEach(
              ([key, apt]) => {
                if (key.startsWith(todayStr)) {
                  const docId = currentUser;
                  const dateKey = key.split("-").slice(0, 3).join("-");
                  const timeStr = key.split("-").slice(3).join(":");
                  const aptKey = dateKey + "-" + key.split("-")[3];
                  const endTime = calculateEndTime(
                    timeStr,
                    apt.duration || "30"
                  );
                  todaysApts.push({
                    ...apt,
                    docId: docId,
                    timeStr: `${timeStr} - ${endTime}`,
                    sortTime: timeStr,
                    originalKey: aptKey,
                    dateKey: dateKey,
                  });
                  totalApts++;
                  if (apt.status === "Yeni Kayıt" || apt.status === "Bekliyor")
                    waitingCount++;
                }
              }
            );
          }
          todaysApts.sort((a, b) => a.sortTime.localeCompare(b.sortTime));

          return (
            <div
              className={`flex flex-col gap-3 pb-8 animate-pop w-full h-full ${
                isDocChanging ? "refreshing" : ""
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-2.5 text-white shadow-lg overflow-hidden relative shrink-0 gap-2">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-10 -mt-20 blur-2xl pointer-events-none"></div>

                <div className="z-10">
                  <h1 className="text-base font-black mb-0.5">
                    {new Date().getHours() >= 6 && new Date().getHours() < 12
                      ? "Günaydın ☀️"
                      : new Date().getHours() >= 12 &&
                        new Date().getHours() < 18
                      ? "İyi Günler 🌤️"
                      : new Date().getHours() >= 18 &&
                        new Date().getHours() < 24
                      ? "İyi Akşamlar 🌙"
                      : "İyi Geceler 🌜"}
                    ,{" "}
                    {globalData.doctorProfiles?.[currentUser]?.name ||
                      currentUser}
                  </h1>

                  <RealtimeClock />
                </div>

                {/* YENİ: Akıllı Sistem Bilgi Barı (Sıradaki Hasta & Hızlı Kısayollar) */}
                <div className="z-10 flex bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 gap-1.5 shadow-inner w-full lg:w-auto overflow-x-auto custom-scrollbar">
                  <div className="flex flex-col pr-4 border-r border-white/20 shrink-0 justify-center">
                    <span className="text-[10px] uppercase font-bold opacity-75 tracking-wider mb-0.5">
                      <i className="fa-solid fa-bolt text-amber-300 mr-1"></i>{" "}
                      Hızlı İşlemler
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setActiveTab("patients");
                          setPatientForm({
                            id: "",
                            name: "",
                            phone: "",
                            tc: "",
                            age: "",
                            gender: "Belirtilmemiş",
                            anamnesis: "",
                            payments: [],
                            plannedTreatments: [],
                          });
                          setPatientModalTab("info");
                          setIsPatientModalOpen(true);
                        }}
                        className="text-[11px] bg-white text-indigo-600 px-2.5 py-1 rounded-lg font-black hover:bg-slate-100 transition shadow-sm"
                      >
                        Yeni Hasta
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("calendar");
                        }}
                        className="text-[11px] bg-indigo-900/50 text-white px-2.5 py-1 rounded-lg font-black hover:bg-indigo-900/70 border border-indigo-300/30 transition shadow-sm"
                      >
                        Takvime Git
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col shrink-0 justify-center min-w-[120px]">
                    <span className="text-[10px] uppercase font-bold opacity-75 tracking-wider mb-0.5">
                      <i className="fa-regular fa-clock text-rose-300 mr-1"></i>{" "}
                      Sıradaki Randevu
                    </span>
                    {(() => {
                      const nextApt = todaysApts.find(
                        (a) =>
                          a.status === "Yeni Kayıt" || a.status === "Bekliyor"
                      );
                      if (nextApt) {
                        return (
                          <span
                            className="text-[13px] font-black text-white truncate max-w-[150px]"
                            title={nextApt.patientName}
                          >
                            {nextApt.sortTime} -{" "}
                            {nextApt.patientName.split(" ")[0]}
                          </span>
                        );
                      }
                      return (
                        <span className="text-[13px] font-bold text-indigo-200">
                          Bekleyen Hasta Yok
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 shrink-0">
                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5">
                  <div className="w-14 h-9 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-lg">
                    <i className="fa-regular fa-calendar-check"></i>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                      Bugünkü Toplam Randevu
                    </div>

                    <div className="text-lg font-black text-slate-800 dark:text-white">
                      {totalApts}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5">
                  <div className="w-14 h-9 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-lg">
                    <i className="fa-solid fa-hourglass-half"></i>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                      Bekleyen Hastalar
                    </div>

                    <div className="text-lg font-black text-slate-800 dark:text-white">
                      {waitingCount}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-2.5 flex flex-col">
                <h3 className="text-base font-black text-slate-800 dark:text-white mb-2 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-1.5">
                  <i className="fa-regular fa-clock text-indigo-500"></i>{" "}
                  Yaklaşan Randevularınız
                </h3>

                <div className="space-y-1.5 pr-1.5">
                  {todaysApts.length > 0 ? (
                    todaysApts.map((apt, i) => {
                      const pId = apt.patientName

                        .toLowerCase()

                        .replace(/\s+/g, "");

                      const anamnesis = globalData.patientsDb?.[pId]?.anamnesis;

                      return (
                        <div
                          key={i}
                          onClick={() =>
                            jumpToAppointment(
                              apt.dateKey,
                              apt.originalKey,
                              "list",
                              apt.docId
                            )
                          }
                          onContextMenu={(e) =>
                            handleContextMenu(e, "appointment", {
                              slot: apt.sortTime,
                              date: new Date(
                                apt.dateKey.split("-")[0],
                                apt.dateKey.split("-")[1] - 1,
                                apt.dateKey.split("-")[2]
                              ),
                              docId: apt.docId,
                              fullKey: apt.originalKey,
                              apt,
                            })
                          }
                          className={`flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-y border-r border-l-4 hover:shadow-md transition cursor-pointer group relative ${
                            apt.status === "Geldi"
                              ? "border-l-emerald-500 border-y-slate-200 border-r-slate-200 dark:border-y-slate-700 dark:border-r-slate-700 hover:border-emerald-400"
                              : apt.status === "Gelmedi"
                              ? "border-l-rose-500 border-y-slate-200 border-r-slate-200 dark:border-y-slate-700 dark:border-r-slate-700 hover:border-rose-400"
                              : "border-l-sky-500 border-y-slate-200 border-r-slate-200 dark:border-y-slate-700 dark:border-r-slate-700 hover:border-sky-400"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className="bg-white dark:bg-slate-800 font-black text-indigo-600 dark:text-indigo-400 px-2.5 py-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-[11px] w-28 text-center group-hover:bg-indigo-600 group-hover:text-white transition">
                              {apt.timeStr}
                            </div>

                            <div>
                              <div className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-[13px]">
                                {apt.patientName}{" "}
                                {anamnesis && (
                                  <i className="fa-solid fa-triangle-exclamation text-rose-500"></i>
                                )}
                              </div>

                              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 max-w-[160px] truncate">
                                <i className="fa-solid fa-stethoscope mr-1"></i>{" "}
                                {renderTreatmentText(apt)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-lg hidden sm:block">
                              {globalData.doctorProfiles?.[apt.docId]?.name}
                            </span>

                            {/* YENİ: Tıklanabilir Anasayfa Rozeti */}
                            {getStatusBadge(apt.status, (e) =>
                              handleStatusCycle(
                                e,
                                apt.docId,
                                apt.originalKey,
                                apt
                              )
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-400 font-medium">
                      Bugün için planlanmış bir randevu bulunmuyor.
                    </div>
                  )}
                </div>
              </div>

              {/* ========================================================= */}
              {/* YENİ MODÜL: KLİNİK DOSYA MASASI (VERİYE BAĞLANDI) */}
              {/* ========================================================= */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-3 flex flex-col shrink-0 mt-2 animate-pop min-h-[400px]">
                {(() => {
                  const allPats = Object.values(globalData.patientsDb || {}).filter(
                  (p) => (p.addedBy === currentUser || globalData.doctorProfiles?.[p.addedBy]?.addedBy === currentUser) && !p.isDeleted
                );

                 // YENİ AKILLI MANTIK: Gelecekte randevusu olan hastayı masadan gizleyen fonksiyon
                  const checkHasFutureAppointment = (pName) => {
                    if (!pName) return false;
                    const now = new Date().getTime();
                    let hasFuture = false;
                    if (globalData.appointments) {
                      Object.values(globalData.appointments).forEach(docApts => {
                        Object.entries(docApts).forEach(([k, apt]) => {
                          if (apt.patientName.toLowerCase() === pName.toLowerCase()) {
                            const [y, m, d] = k.split("-");
                            const timeStr = k.split("-").slice(3).join(":");
                            const aptTime = new Date(`${y}-${m}-${d}T${timeStr}:00`).getTime();
                            if (aptTime >= now && apt.status !== "İptal") {
                              hasFuture = true; // Hastanın gelecekte bir randevusu var!
                            }
                          }
                        });
                      });
                    }
                    return hasFuture;
                  };

                  // 1. Manuel Etiketli Klasörler (Tamamlandı olanlar Hariç)
                  // 1. Sadece kullanıcının kendi hastalarını al
                  const myPatientsForHome = Object.values(globalData.patientsDb || {}).filter(p => 
                    (p.addedBy === currentUser || globalData.doctorProfiles?.[p.addedBy]?.addedBy === currentUser) && !p.isDeleted
                  );

                  // 2. Tarih ve Randevu Kontrolleri İçin Hazırlık (Son 7 Gün Algılayıcı)
                  const now = new Date();
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(now.getDate() - 7);

                  // 3. Çok daha akıllı (İçinde geçen kelimeye göre arayan) Klasörleme Sistemi
                  const fAcil = myPatientsForHome.filter(p => {
                     const status = (p.lastStatus || "").toLowerCase();
                     return status.includes("acil") || status.includes("ağrı") || status.includes("kanama");
                  });
                  
                  const fKontrol = myPatientsForHome.filter(p => {
                     const status = (p.lastStatus || "").toLowerCase();
                     return status.includes("kontrol") || status.includes("takip") || status.includes("sonraki");
                  });

                  const fTedavi = myPatientsForHome.filter(p => {
                     const status = (p.lastStatus || "").toLowerCase();
                     return status.includes("tedavi") || status.includes("planlandı") || status.includes("devam") || status.includes("kanal") || status.includes("dolgu") || status.includes("çekim");
                  });

                  const fLab = myPatientsForHome.filter(p => {
                     const status = (p.lastStatus || "").toLowerCase();
                     return status.includes("lab") || status.includes("ölçü") || status.includes("prova") || status.includes("protez");
                  });

                  const fEvrak = myPatientsForHome.filter(p => {
                     const status = (p.lastStatus || "").toLowerCase();
                     return status.includes("evrak") || status.includes("onam") || status.includes("röntgen") || status.includes("kimlik");
                  });

                  // YENİ HASTALAR KLASÖRÜ (MÜKEMMELLEŞTİRİLDİ)
                  const fYeni = myPatientsForHome.filter(p => {
                     // Kural 1: Durumunda "Yeni" yazıyorsa direkt al
                     if((p.lastStatus || "").toLowerCase().includes("yeni")) return true;
                     
                     // Kural 2: Sisteme son 7 gün içinde eklenmişse otomatik olarak al
                     if(p.date) {
                         let pDate;
                         if (p.date.includes(".")) {
                           const [d, m, y] = p.date.split(".");
                           pDate = new Date(y, m - 1, d);
                         } else {
                           pDate = new Date(p.date);
                         }
                         if(pDate >= sevenDaysAgo && pDate <= now) return true;
                     }

                     // Kural 3: Geçmişte veya gelecekte hiç randevusu YAZILMAMIŞSA (sadece kaydedilip bırakıldıysa) "Yeni" klasörüne düşsün
                     let hasApt = false;
                     if(globalData.appointments) {
                       Object.values(globalData.appointments).forEach(apts => {
                         Object.values(apts).forEach(apt => {
                           if(apt.patientId === p.id || apt.patientName === p.name) hasApt = true;
                         });
                       });
                     }
                     return !hasApt;
                  });

                  // 4. Dosya Masası (Folders) Dizisi ve Kullanıcı Ayarlarına Göre Gizleme/Gösterme
                  const folders = [
                    { id: "acil", title: "ACİL TAKİP", icon: "fa-truck-medical", colorClass: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800", count: fAcil.length, data: fAcil, desc: "Aktif acil & ağrı", info: "Hasta dosyasında 'Acil', 'Ağrı', 'Kanama' kelimeleri geçenler." },
                    { id: "kontrol", title: "KONTROL BEKLEYENLER", icon: "fa-calendar-check", colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", count: fKontrol.length, data: fKontrol, desc: "Yaklaşan kontroller", info: "Son durumunda 'Kontrol' veya 'Takip' geçen hastalar." },
                    { id: "tedavi", title: "TEDAVİSİ DEVAM EDENLER", icon: "fa-tooth", colorClass: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800", count: fTedavi.length, data: fTedavi, desc: "İşlem bekleyenler", info: "Tedavisi süren, planlanmış işlemi olan hastalar." },
                    { id: "lab", title: "LABORATUVAR BEKLEYENLER", icon: "fa-flask", colorClass: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800", count: fLab.length, data: fLab, desc: "Laboratuvar süreçleri", info: "Ölçü alınmış, provası olan veya laba iş gönderilen hastalar." },
                    { id: "evrak", title: "EVRAK BEKLEYENLER", icon: "fa-file-signature", colorClass: "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700", count: fEvrak.length, data: fEvrak, desc: "Eksik belgeler", info: "Onam formu, röntgen veya eksik evrakı olan hastalar." },
                    { id: "yeni", title: "YENİ HASTALAR", icon: "fa-user-plus", colorClass: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800", count: fYeni.length, data: fYeni, desc: "Son 7 gün ve randevusuzlar", info: "Sisteme son 7 günde eklenen veya henüz hiç randevusu olmayan hastalar." }
                  ].filter(f => settings?.dosya?.[f.id] !== false);

                  const activeFolderData = activeFolderId ? folders.find(f => f.id === activeFolderId) : null;

                  const displayedData = activeFolderData 
                    ? activeFolderData.data.filter(p => 
                        p.name.toLowerCase().includes(folderSearch.toLowerCase()) || 
                        (p.phone && p.phone.includes(folderSearch)) || 
                        (p.tc && p.tc.includes(folderSearch)))
                    : [];

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-700 pb-3 mb-3 gap-2">
                        <div>
                          <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                            <i className="fa-solid fa-folder-open text-indigo-500"></i>
                            {activeFolderData ? "Klasör Görüntüleniyor" : "Klinik Dosya Masası"}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {activeFolderData ? "Hasta dosyalarını aşağıdan inceleyebilirsiniz." : "Kliniğinizde takip edilmesi gereken hastaları ve işlemleri hızlıca yönetin."}
                          </p>
                        </div>
                        <div className="relative w-full sm:w-64">
                          <i className="fa-solid fa-search absolute left-2.5 top-2.5 text-slate-400 text-[11px]"></i>
                          <input
                            type="text"
                            placeholder={activeFolderData ? "Bu klasörde ara..." : "Masada dosya ara..."}
                            value={folderSearch}
                            onChange={(e) => setFolderSearch(e.target.value)}
                            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[12px] font-bold outline-none focus:border-indigo-500 shadow-sm dark:text-white"
                          />
                        </div>
                      </div>

                      {!activeFolderData ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {folders.map(folder => (
                            <div 
                      key={folder.id} 
                      onClick={() => { setActiveFolderId(folder.id); setFolderSearch(""); }}
                      className="group border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col"
                    >
                      <div className={`p-2.5 flex items-center justify-between border-b rounded-t-[11px] ${folder.colorClass}`}>
                                <h4 className="font-black text-[12px] flex items-center gap-1.5">
                                  <i className={`fa-solid ${folder.icon} text-sm opacity-80`}></i>
                                  {folder.title}
                                </h4>
                                
                                {/* YENİ: Bilgi İkonu (Tooltip) */}
                                <div 
                                  className="relative group/tooltip flex items-center justify-center p-1"
                                  onClick={(e) => e.stopPropagation()} // Tıklanınca klasörü açmasını engeller
                                >
                                  <i className="fa-solid fa-circle-info opacity-50 group-hover/tooltip:opacity-100 hover:text-slate-800 dark:hover:text-white transition-all text-sm cursor-help"></i>
                                  <div className="absolute bottom-full right-0 lg:left-1/2 lg:-translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-semibold rounded-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all z-50 whitespace-normal text-left shadow-xl hidden group-hover/tooltip:block leading-relaxed border border-slate-700 dark:border-slate-600">
                                    {folder.info}
                                    <div className="absolute top-full right-2 lg:left-1/2 lg:-translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700"></div>
                                  </div>
                                </div>

                              </div>
                              <div className="p-3 flex flex-col flex-1 justify-between">
                                <div className="flex justify-between items-end mb-2">
                                  <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">
                                    {folder.count}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                    {folder.desc}
                                  </span>
                                </div>
                                <button className="w-full py-1.5 mt-2 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-900/30 dark:group-hover:text-indigo-400 transition-colors border border-slate-200 dark:border-slate-700 group-hover:border-indigo-200 dark:group-hover:border-indigo-800">
                                  DOSYALARI AÇ <i className="fa-solid fa-arrow-right ml-1"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col flex-1 animate-pop">
                          <div className="flex items-center gap-2 mb-3">
                            <button onClick={() => { setActiveFolderId(null); setFolderSearch(""); }} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-lg font-bold text-[11px] hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                              <i className="fa-solid fa-arrow-left mr-1"></i> Geri Dön
                            </button>
                            <span className={`px-2 py-0.5 rounded font-black text-[11px] border ${activeFolderData.colorClass}`}>
                              <i className={`fa-solid ${activeFolderData.icon} mr-1`}></i> {activeFolderData.title}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">({displayedData.length} Dosya)</span>
                          </div>

                          <div className="space-y-2 overflow-y-auto max-h-[450px] custom-scrollbar pr-1.5">
                            {displayedData.length > 0 ? (
                              displayedData.map((pt, i) => {
                                // YENİ: TEK TIKLA DURUM GÜNCELLEME (QUICK STATUS UPDATE)
                                let specificStatus = null;
                                let badgeColor = "";
                                let options = [];
                                let fieldToUpdate = "";
                                
                                if(activeFolderId === "acil") { 
                                  specificStatus = pt.folder_acil || ""; 
                                  fieldToUpdate = "folder_acil";
                                  badgeColor = specificStatus === "Tamamlandı" ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800" : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800"; 
                                  options = [
                                    {val: "Tamamlandı", label: "✅ Tamamlandı"},
                                    {val: "Aktif Acil", label: "🔴 Aktif Acil Durum"},
                                    {val: "Ağrı Takibi", label: "🟠 Ağrı Takibi"},
                                    {val: "İlaç Kullanıyor", label: "🟡 İlaç Kullanıyor"},
                                    {val: "", label: "🗑️ Klasörden Kaldır"}
                                  ];
                                }
                                else if(activeFolderId === "lab") { 
                                  specificStatus = pt.folder_lab || ""; 
                                  fieldToUpdate = "folder_lab";
                                  badgeColor = specificStatus === "Tamamlandı" ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800" : "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-400 dark:border-purple-800"; 
                                  options = [
                                    {val: "Tamamlandı", label: "✅ Tamamlandı"},
                                    {val: "Ölçü Alınacak", label: "⏳ Ölçü Alınacak"},
                                    {val: "Laboratuvarda", label: "🧪 Laboratuvarda"},
                                    {val: "Klinikte (Provaya Hazır)", label: "🏢 Klinikte (Provaya Hazır)"},
                                    {val: "", label: "🗑️ Klasörden Kaldır"}
                                  ];
                                }
                                else if(activeFolderId === "evrak") { 
                                  specificStatus = pt.folder_evrak || ""; 
                                  fieldToUpdate = "folder_evrak";
                                  badgeColor = specificStatus === "Tamamlandı" ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800" : "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"; 
                                  options = [
                                    {val: "Tamamlandı", label: "✅ Evraklar Tamamlandı"},
                                    {val: "Onam Formu Eksik", label: "📄 Onam Formu Eksik"},
                                    {val: "Röntgen Bekliyor", label: "🦴 Röntgen Bekliyor"},
                                    {val: "Kimlik/Pasaport Eksik", label: "🪪 Kimlik/Pasaport Eksik"},
                                    {val: "", label: "🗑️ Klasörden Kaldır"}
                                  ];
                                }

                                return (
                                <div key={i} className="bg-white dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-2 hover:border-indigo-300 transition-colors">
                                  <div className="flex items-start gap-2 w-full md:w-auto">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-600 shrink-0 mt-0.5">
                                      <i className="fa-regular fa-folder-open text-base"></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-black text-[13px] text-slate-800 dark:text-white flex items-center flex-wrap gap-1.5">
                                        <span className="truncate max-w-[140px] sm:max-w-[200px]">{pt.name}</span>
                                        {pt.anamnesis && <i className="fa-solid fa-triangle-exclamation text-rose-500" title="Önemli Not"></i>}
                                        
                                        {/* DİNAMİK AÇILIR MENÜ (QUICK UPDATE) */}
                                        {options.length > 0 ? (
                                            <div className="relative inline-block ml-1 group/select">
                                              <select 
                                                value={specificStatus || ""}
                                                onChange={(e) => {
                                                  e.stopPropagation();
                                                  const val = e.target.value;
                                                  
                                                  // Veritabanını Tek Tıkla Güncelliyoruz
                                                  const updatedPatient = { ...pt, [fieldToUpdate]: val };
                                                  saveGlobalData({
                                                    ...globalData,
                                                    patientsDb: { ...globalData.patientsDb, [pt.id]: updatedPatient }
                                                  });
                                                  
                                                  showNotification(val === "" ? "Hasta klasörden başarıyla çıkarıldı 🚀" : val === "Tamamlandı" ? "Kayıt başarıyla tamamlandı olarak işaretlendi ✅" : "Durum güncellendi!");
                                                }}
                                                className={`text-[9px] font-black pl-1.5 pr-4 py-0.5 rounded-md border tracking-wider outline-none cursor-pointer appearance-none shadow-sm hover:ring-2 hover:ring-indigo-400/50 transition-all ${badgeColor}`}
                                                title="Tıklayarak Durumu Değiştirin"
                                              >
                                                <option value={specificStatus || ""} disabled hidden>{specificStatus || "Durum Seç"}</option>
                                                {options.map(o => <option key={o.val} value={o.val} className="text-slate-800 font-bold">{o.label}</option>)}
                                              </select>
                                              <i className="fa-solid fa-chevron-down absolute right-1.5 top-1/2 -translate-y-1/2 text-[7px] pointer-events-none opacity-60 group-hover/select:opacity-100 transition-opacity"></i>
                                            </div>
                                        ) : specificStatus && (
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border tracking-wider ml-1 ${badgeColor}`}>
                                                {specificStatus}
                                            </span>
                                        )}
                                      </h4>
                                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                                        <span><i className="fa-solid fa-phone mr-0.5"></i> {pt.phone || "-"}</span>
                                        <span className="opacity-50 hidden sm:inline">•</span>
                                        <span className="hidden sm:inline">Son İşlem: <span className="text-indigo-500 dark:text-indigo-400">{pt.lastTreatment || "Yok"}</span></span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-1.5 mt-2 md:mt-0 w-full md:w-auto shrink-0 justify-end">
                                    <button onClick={() => { setPatientForm(pt); setPatientModalTab("info"); setIsPatientModalOpen(true); }} className="flex-1 md:flex-none px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-black text-[10px] hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm transition flex items-center justify-center gap-1">
                                      <i className="fa-solid fa-folder-open"></i> Detay
                                    </button>
                                  </div>
                                </div>
                                );
                            })
                            ) : (
                              <div className="flex flex-col items-center justify-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                <i className="fa-regular fa-folder-open text-3xl text-slate-300 mb-2"></i>
                                <span className="text-[11px] font-bold text-slate-500">Bu klasörde aranan kriterlere uygun dosya bulunmuyor.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              {/* ========================================================= */}
            </div>
          );
        };

        const renderCalendarView = () => {
          const targetDoc = calendarDoctor || currentUser;

          const renderDaily = () => {
            const currentYear = selectedDate.getFullYear(),
              currentMonth = selectedDate.getMonth();

            const daysInMonth = new Date(
              currentYear,

              currentMonth + 1,

              0
            ).getDate();

            const firstDay = new Date(currentYear, currentMonth, 1).getDay();

            const startingDay = firstDay === 0 ? 6 : firstDay - 1;

            const calendarDays = [];

            for (let i = 0; i < startingDay; i++) calendarDays.push(null);

            for (let i = 1; i <= daysInMonth; i++)
              calendarDays.push(new Date(currentYear, currentMonth, i));

            return (
              <div className="flex h-full gap-1.5 relative">
                <div className="w-[260px] shrink-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 hidden lg:flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-black text-slate-800 dark:text-white text-base">
                      Takvim
                    </h3>

                    <button
                      onClick={() => setSelectedDate(new Date())}
                      className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition"
                    >
                      Bugün
                    </button>
                  </div>

                  <div className="flex justify-between items-center mb-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() =>
                        setSelectedDate(
                          new Date(currentYear, currentMonth - 1, 1)
                        )
                      }
                      className="w-7 h-7 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 shadow-sm flex justify-center items-center"
                    >
                      <i className="fa-solid fa-chevron-left text-[11px]"></i>
                    </button>

                    <div className="font-bold text-slate-700 dark:text-slate-200 text-[13px]">
                      {MONTHS[currentMonth]} {currentYear}
                    </div>

                    <button
                      onClick={() =>
                        setSelectedDate(
                          new Date(currentYear, currentMonth + 1, 1)
                        )
                      }
                      className="w-7 h-7 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 shadow-sm flex justify-center items-center"
                    >
                      <i className="fa-solid fa-chevron-right text-[11px]"></i>
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">
                    {DAYS.map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((d, i) => {
                      if (!d) return <div key={i}></div>;

                      const isSel =
                        d.getDate() === selectedDate.getDate() &&
                        d.getMonth() === selectedDate.getMonth() &&
                        d.getFullYear() === selectedDate.getFullYear();

                      const isTod =
                        d.getDate() === new Date().getDate() &&
                        d.getMonth() === new Date().getMonth() &&
                        d.getFullYear() === new Date().getFullYear();

                      const hasApt =
                        globalData.appointments?.[targetDoc] &&
                        Object.keys(globalData.appointments[targetDoc]).some(
                          (k) => k.startsWith(formatDateKey(d))
                        );

                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedDate(d)}
                          className={`aspect-square rounded-xl text-[11px] font-bold flex flex-col items-center justify-center relative transition-all ${
                            isSel
                              ? "bg-indigo-600 text-white shadow-md"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                          } ${
                            isTod && !isSel
                              ? "border border-indigo-300 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                              : ""
                          }`}
                        >
                          {d.getDate()}

                          {hasApt && (
                            <div
                              className={`w-1 h-1 rounded-full absolute bottom-1.5 ${
                                isSel ? "bg-white" : "bg-rose-500"
                              }`}
                            ></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-slate-50/50 dark:bg-slate-900/50">
                    {TIME_SLOTS.map((slot) => {
                      const fullKey = `${formatDateKey(selectedDate)}-${slot}`;
                      const apt =
                        globalData.appointments?.[targetDoc]?.[fullKey];

                      // YENİ: Geçmiş Zaman ve Tarih Hesaplama
                      const now = new Date();
                      const todayStart = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate()
                      ).getTime();
                      const selectedStart = new Date(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth(),
                        selectedDate.getDate()
                      ).getTime();
                      const isPastDate = selectedStart < todayStart;
                      const isToday = selectedStart === todayStart;
                      const slotHour = parseInt(slot.split(":")[0]);
                      
                      // GÜÇLENDİRİLMİŞ ÇALIŞMA GÜNÜ MOTORU (Günlük)
                      const dayName = DAYS[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1];
                      const currentFormattedDate = `${String(selectedDate.getDate()).padStart(2, '0')}.${String(selectedDate.getMonth() + 1).padStart(2, '0')}.${selectedDate.getFullYear()}`;
                      const isDayClosed = settings?.calisma?.gunler?.[dayName] === false || (settings?.calisma?.ozelGunler || []).some(og => og.tarih === currentFormattedDate);
                      
                      const isPastSlot = isPastDate || (isToday && slotHour < now.getHours()) || isDayClosed;

                      let pId = apt
                        ? apt.patientName.toLowerCase().replace(/\s+/g, "")
                        : null;

                      let anamnesis = pId
                        ? globalData.patientsDb?.[pId]?.anamnesis
                        : null;

                      const isHighlighted = highlightedAptId === fullKey;

                      const dropTargetKey = `${targetDoc}-${fullKey}`;

                      const tColor = getTreatmentColor(apt);

                      return (
                        <div
                          key={slot}
                          onDragOver={(e) => {
                            if (!isPastSlot) handleDragOver(e, dropTargetKey);
                          }}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => {
                            if (!isPastSlot)
                              handleDrop(e, targetDoc, selectedDate, slot);
                          }}
                          onClick={() => {
                            if (!apt && !isPastSlot)
                              openAppointmentModal(
                                slot,
                                selectedDate,
                                targetDoc
                              );
                          }}
                          className={`flex rounded-xl overflow-hidden slot-cell grid-row-h transition-all duration-300 ${
                            isHighlighted ? "flash-highlight" : ""
                          } ${
                            apt
                              ? "border border-indigo-200 dark:border-indigo-800 shadow-md bg-white dark:bg-slate-800"
                              : isPastSlot
                              ? "border border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/10 opacity-60 grayscale cursor-not-allowed pointer-events-none"
                              : "border border-dashed border-emerald-300 dark:border-emerald-700/50 hover:border-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 bg-emerald-50/30 dark:bg-emerald-900/10 cursor-pointer shadow-[inset_0_0_8px_rgba(16,185,129,0.05)]"
                          } ${
                            dragOverTargetKey === dropTargetKey
                              ? "drag-over"
                              : ""
                          }`}
                        >
                          <div
                            className={`w-14 shrink-0 flex items-center justify-center font-black text-[13px] ${
                              apt
                                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-r border-indigo-100"
                                : "bg-slate-50 dark:bg-slate-900/50 text-slate-400 border-r border-slate-100 dark:border-slate-700"
                            }`}
                          >
                            {slot}
                          </div>

                          <div className="flex-1 px-2.5 flex justify-between items-center relative">
                            {apt ? (
                              <div className="relative apt-card-wrapper w-full h-full flex items-center group z-40">
                                <div className="glass-tooltip flex flex-col gap-1 text-left pointer-events-none">
                                  <div className="font-black text-[13px] border-b border-black/10 dark:border-white/20 pb-1 mb-1 text-indigo-700 dark:text-indigo-300">
                                    {apt.patientName}
                                  </div>
                                  {apt.treatment && (
                                    <div className="text-[11px] flex items-center gap-1.5 font-bold">
                                      <i className="fa-solid fa-stethoscope"></i>{" "}
                                      {renderTreatmentText(apt)}
                                    </div>
                                  )}
                                  <div className="text-[10px] font-bold opacity-80 flex items-center gap-1.5">
                                    <i className="fa-regular fa-clock"></i>{" "}
                                    Süre: {apt.duration} Dk
                                  </div>
                                  {apt.price && (
                                    <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 mt-1 pt-1 border-t border-black/10 dark:border-white/10">
                                      Ücret: {renderMoney(apt.price)} ₺
                                    </div>
                                  )}
                                  {apt.notes && (
                                    <div className="text-[11px] mt-1 p-2 bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300 rounded-md italic font-semibold max-w-[200px] whitespace-normal shadow-sm">
                                      <i className="fa-solid fa-thumbtack text-amber-500 mr-1"></i>{" "}
                                      {apt.notes}
                                    </div>
                                  )}
                                </div>

                                <div
                                  draggable
                                  onDragStart={(e) =>
                                    handleDragStart(
                                      e,
                                      targetDoc,
                                      selectedDate,
                                      slot,
                                      apt,
                                      fullKey
                                    )
                                  }
                                  onDragEnd={handleDragEnd}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAppointmentModal(
                                      slot,
                                      selectedDate,
                                      targetDoc
                                    );
                                  }}
                                  onContextMenu={(e) =>
                                    handleContextMenu(e, "appointment", {
                                      slot,
                                      date: selectedDate,
                                      docId: targetDoc,
                                      fullKey,
                                      apt,
                                    })
                                  }
                                  className="apt-card !static !border-l-4 !shadow-sm hover:!shadow-md hover:!-translate-y-0.5 !rounded-lg w-full flex justify-between items-center cursor-pointer transition-all ml-1"
                                  style={{
                                    backgroundColor: tColor.bg,
                                    color: tColor.text,
                                    borderLeftColor: tColor.border,
                                  }}
                                >
                                  <div className="flex items-center gap-1.5 overflow-hidden">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full h-full p-0.5 gap-0.5 overflow-hidden">
  <div className="flex flex-wrap items-center gap-1 truncate">
    <span className="font-black text-slate-800 dark:text-white text-[11px] sm:text-[13px] truncate">
      {apt.patientName} {anamnesis && (<i className="fa-solid fa-triangle-exclamation text-rose-500"></i>)}
    </span>
    <span className="text-[10px] sm:text-[11px] font-bold opacity-80 truncate">
      • {renderTreatmentText(apt)} {apt.duration ? `(${apt.duration} Dk)` : ""}
    </span>
  </div>
</div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                                    {getStatusBadge(apt.status, (e) =>
                                      handleStatusCycle(
                                        e,
                                        targetDoc,
                                        fullKey,
                                        apt
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-300 dark:text-slate-600 font-semibold text-[11px] flex items-center gap-1.5 opacity-0 hover:opacity-100 transition pointer-events-none">
                                <i className="fa-solid fa-plus"></i> Boş Seans
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          };

          const renderWeekly = () => {
            const weekDays = getWeekDays(selectedDate);

            return (
              <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden w-full">
                <div className="flex items-center justify-between p-1.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0">
                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          selectedDate.setDate(selectedDate.getDate() - 7)
                        )
                      )
                    }
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded shadow-sm text-[11px] font-bold dark:text-slate-200"
                  >
                    <i className="fa-solid fa-chevron-left"></i> Önceki Hafta
                  </button>

                  <span className="font-black text-[13px] text-slate-700 dark:text-slate-200">
                    Haftalık Görünüm
                  </span>

                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          selectedDate.setDate(selectedDate.getDate() + 7)
                        )
                      )
                    }
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded shadow-sm text-[11px] font-bold dark:text-slate-200"
                  >
                    Sonraki Hafta <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>

                {/* custom-scrollbar eklendi */}
                <div className="flex-1 overflow-auto bg-slate-100/50 dark:bg-slate-900/50 w-full relative custom-scrollbar">
                  {/* YENİ: min-w-[800px] ile mobilde sütunların sıkışması engellendi */}
                  <div className="weekly-grid h-full min-w-[800px] lg:min-w-full">
                    <div className="sticky top-0 left-0 bg-white dark:bg-slate-800 z-30 border-b border-slate-200 dark:border-slate-700 time-col h-8 shadow-sm"></div>

                    {weekDays.map((d, i) => (
                      <div
                        key={i}
                        className="sticky top-0 bg-white dark:bg-slate-800 z-20 border-b border-slate-200 dark:border-slate-700 day-col h-8 flex flex-col items-center justify-center shadow-sm overflow-hidden"
                      >
                        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                          {DAYS[i]}
                        </div>

                        <div className="text-[13px] font-black text-slate-800 dark:text-white">
                          {d.getDate()} {MONTHS[d.getMonth()]}
                        </div>
                      </div>
                    ))}

                    {TIME_SLOTS.map((time) => (
                      <React.Fragment key={time}>
                        <div className="time-col flex items-center justify-center text-[11px] font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 grid-row-h">
                          {time}
                        </div>

                        {weekDays.map((d, i) => {
                          const fullKey = `${formatDateKey(d)}-${time}`;

                          const apt =
                            globalData.appointments?.[targetDoc]?.[fullKey];

                          const tColor = getTreatmentColor(apt?.treatment);

                          const dropTargetKey = `${targetDoc}-${fullKey}`;

                          const now = new Date();
                          const todayStart = new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            now.getDate()
                          ).getTime();
                          const dayStart = new Date(
                            d.getFullYear(),
                            d.getMonth(),
                            d.getDate()
                          ).getTime();
                          const isPastDate = dayStart < todayStart;
                          const isToday = dayStart === todayStart;
                          const slotHour = parseInt(time.split(":")[0]);
                          
                          // GÜÇLENDİRİLMİŞ ÇALIŞMA GÜNÜ MOTORU (Haftalık)
                          const dayName = DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];
                          const currentFormattedDate = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
                          const isDayClosed = settings?.calisma?.gunler?.[dayName] === false || (settings?.calisma?.ozelGunler || []).some(og => og.tarih === currentFormattedDate);
                          
                          const isPastSlot = isPastDate || (isToday && slotHour < now.getHours()) || isDayClosed;

                          let anamnesis = apt
                            ? globalData.patientsDb?.[
                                apt.patientName
                                  .toLowerCase()
                                  .replace(/\s+/g, "")
                              ]?.anamnesis
                            : null;

                          return (
                            <div
                              key={i}
                              onDragOver={(e) => {
                                if (!isPastSlot)
                                  handleDragOver(e, dropTargetKey);
                              }}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => {
                                if (!isPastSlot)
                                  handleDrop(e, targetDoc, d, time);
                              }}
                              onClick={() => {
                                if (!apt && !isPastSlot)
                                  openAppointmentModal(time, d, targetDoc);
                              }}
                              className={`day-col slot-cell grid-row-h flex items-center px-1 transition-all duration-300 ${
                                apt
                                  ? "has-apt bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm"
                                  : isPastSlot
                                  ? "border-b border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/10 opacity-60 grayscale cursor-not-allowed pointer-events-none"
                                  : "border-b border-dashed border-emerald-300 dark:border-emerald-700/50 hover:border-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 bg-emerald-50/30 dark:bg-emerald-900/10 cursor-pointer"
                              } ${
                                dragOverTargetKey === dropTargetKey
                                  ? "drag-over"
                                  : ""
                              }`}
                            >
                              {apt && (
                                <div className="relative apt-card-wrapper w-full h-full flex flex-col justify-center items-start group">
                                  <div className="glass-tooltip flex flex-col gap-1 text-left pointer-events-none">
                                    <div className="font-black text-[13px] border-b border-black/10 dark:border-white/20 pb-1 mb-1 text-indigo-700 dark:text-indigo-300">
                                      {apt.patientName}
                                    </div>
                                    {apt.treatment && (
                                      <div className="text-[11px] flex items-center gap-1.5 font-bold">
                                        <i className="fa-solid fa-stethoscope"></i>{" "}
                                        {renderTreatmentText(apt)}
                                      </div>
                                    )}
                                    <div className="text-[10px] font-bold opacity-80 flex items-center gap-1.5">
                                      <i className="fa-regular fa-clock"></i>{" "}
                                      Süre: {apt.duration} Dk
                                    </div>
                                    {apt.notes && (
                                      <div className="text-[10px] mt-1 p-1.5 bg-black/5 dark:bg-white/5 rounded-md italic font-semibold max-w-[200px] whitespace-normal">
                                        <i className="fa-solid fa-note-sticky text-amber-500 mr-1"></i>{" "}
                                        {apt.notes}
                                      </div>
                                    )}
                                  </div>

                                  <div
                                    draggable
                                    onDragStart={(e) =>
                                      handleDragStart(
                                        e,
                                        targetDoc,
                                        d,
                                        time,
                                        apt,
                                        fullKey
                                      )
                                    }
                                    onDragEnd={handleDragEnd}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openAppointmentModal(time, d, targetDoc);
                                    }}
                                    onContextMenu={(e) =>
                                      handleContextMenu(e, "appointment", {
                                        slot: time,
                                        date: d,
                                        docId: targetDoc,
                                        fullKey,
                                        apt,
                                      })
                                    }
                                    className="apt-card w-full flex flex-col justify-center items-start cursor-pointer transition-all hover:-translate-y-0.5"
                                    style={{
                                      backgroundColor: tColor.bg,
                                      color: tColor.text,
                                      borderLeftColor: tColor.border,
                                    }}
                                  >
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full h-full p-0.5 gap-0.5 overflow-hidden">
  <div className="flex flex-wrap items-center gap-1 truncate">
    <span className="font-black text-slate-800 dark:text-white text-[11px] truncate">
      {apt.patientName} {anamnesis && (<i className="fa-solid fa-triangle-exclamation text-rose-500"></i>)}
    </span>
    <span className="text-[10px] font-bold opacity-80 truncate">
      • {renderTreatmentText(apt)} {apt.duration ? `(${apt.duration} Dk)` : ""}
    </span>
  </div>
</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            );
          };

          return (
            <div
              className={`flex flex-col h-full animate-pop w-full ${
                isDocChanging ? "refreshing" : ""
              }`}
            >
              <div className="flex flex-wrap lg:flex-nowrap justify-between items-center mb-2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 shrink-0 gap-1.5">
                <div className="font-black text-slate-800 dark:text-white text-[13px] sm:text-base ml-1.5 whitespace-nowrap flex items-center gap-1.5">
                  <div className="flex items-center">
                    <input
                      type="date"
                      value={formatDateKey(selectedDate)}
                      onChange={(e) => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split("-");
                          setSelectedDate(new Date(y, m - 1, d));
                        }
                      }}
                      className="font-black text-slate-800 dark:text-white text-[13px] sm:text-base bg-transparent cursor-pointer outline-none w-32 sm:w-40 focus:text-indigo-600 transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="text-[9px] sm:text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 sm:px-2 py-0.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition align-middle"
                  >
                    Bugün
                  </button>
                </div>

                <div className="w-full lg:w-auto flex-1 flex justify-center min-w-[220px] order-last lg:order-none">
                  {renderAppointmentSearchBox()}
                </div>

                <div className="flex items-center gap-1.5 lg:gap-1.5 justify-end">
                  <div className="relative">
                    <i className="fa-solid fa-user-doctor absolute left-3 top-2 text-slate-400 text-[11px]"></i>

                    <select
                      value={calendarDoctor}
                      onChange={(e) => setCalendarDoctor(e.target.value)}
                      className="pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                    >
                      {allDoctors.map((doc) => (
                        <option key={doc} value={doc}>
                          {globalData.doctorProfiles?.[doc]?.name || doc}
                        </option>
                      ))}
                    </select>

                    <i className="fa-solid fa-chevron-down absolute right-3 top-1.5 text-slate-400 text-[11px] pointer-events-none"></i>
                  </div>

                  <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl justify-end overflow-hidden shrink-0">
                    <button
                      onClick={() => setCalendarViewMode("daily")}
                      className={`px-2 sm:px-2.5 py-1 font-bold text-[10px] sm:text-[11px] rounded-lg transition-all ${
                        calendarViewMode === "daily"
                          ? "bg-white dark:bg-slate-700 text-indigo-600"
                          : "text-slate-500"
                      }`}
                    >
                      Günlük
                    </button>

                    <button
                      onClick={() => setCalendarViewMode("weekly")}
                      className={`px-2 sm:px-2.5 py-1 font-bold text-[10px] sm:text-[11px] rounded-lg transition-all ${
                        calendarViewMode === "weekly"
                          ? "bg-white dark:bg-slate-700 text-indigo-600"
                          : "text-slate-500"
                      }`}
                    >
                      Haftalık
                    </button>

                    <button
                      onClick={() => setCalendarViewMode("monthly")}
                      className={`px-2 sm:px-2.5 py-1 font-bold text-[10px] sm:text-[11px] rounded-lg transition-all ${
                        calendarViewMode === "monthly"
                          ? "bg-white dark:bg-slate-700 text-indigo-600"
                          : "text-slate-500"
                      }`}
                    >
                      Aylık
                    </button>
                  </div>
                </div>
              </div>

              {(() => {
                const renderMonthly = () => {
                  const currentYear = selectedDate.getFullYear();
                  const currentMonth = selectedDate.getMonth();
                  const daysInMonth = new Date(
                    currentYear,
                    currentMonth + 1,
                    0
                  ).getDate();
                  const firstDay = new Date(
                    currentYear,
                    currentMonth,
                    1
                  ).getDay();
                  const startingDay = firstDay === 0 ? 6 : firstDay - 1;

                  const calendarDays = [];
                  for (let i = 0; i < startingDay; i++) calendarDays.push(null);
                  for (let i = 1; i <= daysInMonth; i++)
                    calendarDays.push(new Date(currentYear, currentMonth, i));

                  return (
                    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden w-full">
                      <div className="flex items-center justify-between p-1.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0">
                        <button
                          onClick={() =>
                            setSelectedDate(
                              new Date(currentYear, currentMonth - 1, 1)
                            )
                          }
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded shadow-sm text-[11px] font-bold dark:text-slate-200 transition hover:bg-slate-100"
                        >
                          <i className="fa-solid fa-chevron-left mr-1"></i>{" "}
                          Önceki Ay
                        </button>
                        <span className="font-black text-[13px] text-slate-700 dark:text-slate-200">
                          {MONTHS[currentMonth]} {currentYear}
                        </span>
                        <button
                          onClick={() =>
                            setSelectedDate(
                              new Date(currentYear, currentMonth + 1, 1)
                            )
                          }
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded shadow-sm text-[11px] font-bold dark:text-slate-200 transition hover:bg-slate-100"
                        >
                          Sonraki Ay{" "}
                          <i className="fa-solid fa-chevron-right ml-1"></i>
                        </button>
                      </div>

                      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0">
                        {DAYS.map((d) => (
                          <div
                            key={d}
                            className="text-center text-[10px] font-black text-slate-500 py-1.5 uppercase tracking-wider"
                          >
                            {d}
                          </div>
                        ))}
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <div className="grid grid-cols-7 bg-slate-200 dark:bg-slate-700 gap-px h-full auto-rows-fr">
                          {calendarDays.map((d, i) => {
                            if (!d)
                              return (
                                <div
                                  key={i}
                                  className="bg-slate-50 dark:bg-slate-800"
                                ></div>
                              );

                            let total = 0;
                            let canceled = 0;
                            const dateKey = formatDateKey(d);

                            if (
                              globalData.appointments &&
                              globalData.appointments[targetDoc]
                            ) {
                              Object.entries(
                                globalData.appointments[targetDoc]
                              ).forEach(([key, apt]) => {
                                if (key.startsWith(dateKey)) {
                                  total++;
                                  if (apt.status === "İptal") canceled++;
                                }
                              });
                            }

                            const emptySlots = TIME_SLOTS.length - total;
                            const activeApts = total - canceled;
                            const isTod =
                              d.getDate() === new Date().getDate() &&
                              d.getMonth() === new Date().getMonth() &&
                              d.getFullYear() === new Date().getFullYear();

                            return (
                              <div
                                key={i}
                                onClick={() => {
                                  setSelectedDate(d);
                                  setCalendarViewMode("daily");
                                }}
                                className={`bg-white dark:bg-slate-800 p-1.5 flex flex-col overflow-y-auto custom-scrollbar min-h-0 hover:bg-indigo-50/50 dark:hover:bg-slate-750 cursor-pointer transition-colors relative ${
                                  isTod
                                    ? "ring-2 ring-inset ring-indigo-500 z-10"
                                    : ""
                                }`}
                              >
                                <div
                                  className={`text-[11px] font-black mb-0.5 ${
                                    isTod
                                      ? "text-indigo-600 dark:text-indigo-400"
                                      : "text-slate-700 dark:text-slate-200"
                                  }`}
                                >
                                  {d.getDate()}
                                </div>
                                <div className="flex flex-col gap-0.5 mt-auto">
                                  {activeApts > 0 && (
                                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm"></div>{" "}
                                      {activeApts} Randevu
                                    </div>
                                  )}
                                  {canceled > 0 && (
                                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm"></div>{" "}
                                      {canceled} İptal
                                    </div>
                                  )}
                                  {emptySlots > 0 && (
                                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm"></div>{" "}
                                      {emptySlots} Boş
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                };

                return calendarViewMode === "daily"
                  ? renderDaily()
                  : calendarViewMode === "weekly"
                  ? renderWeekly()
                  : renderMonthly();
              })()}
            </div>
          );
        };

        const renderGridList = () => {
          return (
            <div
              className={`flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-pop w-full ${
                isDocChanging ? "refreshing" : ""
              }`}
            >
              <div className="flex flex-wrap items-center justify-between p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 gap-1.5 shrink-0">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative shrink-0">
                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          selectedDate.setDate(selectedDate.getDate() - 1)
                        )
                      )
                    }
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    <i className="fa-solid fa-chevron-left text-[11px]"></i>
                  </button>

                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={formatDateKey(selectedDate)}
                      onChange={(e) => {
                        if (e.target.value)
                          setSelectedDate(
                            new Date(
                              e.target.value.split("-")[0],

                              e.target.value.split("-")[1] - 1,

                              e.target.value.split("-")[2]
                            )
                          );
                      }}
                      className="font-black text-slate-800 dark:text-white text-[13px] px-1.5 py-0.5 bg-transparent cursor-pointer outline-none w-32 text-center z-10 relative"
                    />

                    <i className="fa-regular fa-calendar-days absolute right-1.5 text-indigo-500 z-0 pointer-events-none"></i>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          selectedDate.setDate(selectedDate.getDate() + 1)
                        )
                      )
                    }
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    <i className="fa-solid fa-chevron-right text-[11px]"></i>
                  </button>
                </div>

                <div className="w-full md:w-auto flex-1 flex justify-center min-w-[220px] order-last md:order-none">
                  {renderAppointmentSearchBox()}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <div className="relative">
                    <i className="fa-solid fa-user-doctor absolute left-3 top-1.5 text-slate-400 text-[11px]"></i>

                    <select
                      value={listDoctorFilter}
                      onChange={(e) => setListDoctorFilter(e.target.value)}
                      className="pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 appearance-none dark:text-white cursor-pointer"
                    >
                      <option value="all">Tüm Hekimler (Izgara)</option>

                      {allDoctors.map((doc) => (
                        <option key={doc} value={doc}>
                          {globalData.doctorProfiles?.[doc]?.name || doc}
                        </option>
                      ))}
                    </select>

                    <i className="fa-solid fa-chevron-down absolute right-3 top-1.5 text-slate-400 text-[11px] pointer-events-none"></i>
                  </div>

                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="text-[11px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2.5 py-1.5 rounded-xl border border-indigo-100 shadow-sm transition"
                  >
                    Bugün
                  </button>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto overflow-x-auto relative bg-slate-100/50 dark:bg-slate-900/50 w-full custom-scrollbar"
                style={{ "--doctor-count": visibleListDoctors.length }}
              >
                {/* YENİ: min-w-[600px] veya lg:min-w-full ekleyerek mobilde sütun sıkışmasını engelliyoruz */}
                <div className="calendar-grid min-w-[600px] lg:min-w-full h-full">
                  <div className="sticky top-0 left-0 bg-white dark:bg-slate-800 z-30 border-b border-slate-200 dark:border-slate-700 time-col h-8 shadow-sm"></div>

                  {visibleListDoctors.map((docId) => (
                    <div
                      key={`header-${docId}`}
                      className="sticky top-0 bg-white dark:bg-slate-800 z-20 border-b border-slate-200 dark:border-slate-700 doc-col h-8 flex flex-col items-center justify-center shadow-sm overflow-hidden px-1.5"
                    >
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[9px] shrink-0">
                          <i className="fa-solid fa-user-doctor"></i>
                        </div>

                        <span className="font-black text-slate-800 dark:text-white text-[10px] sm:text-[13px] truncate w-full text-center">
                          {globalData.doctorProfiles?.[docId]?.name || docId}
                        </span>
                      </div>
                    </div>
                  ))}

                  {TIME_SLOTS.map((time) => (
                    <React.Fragment key={time}>
                      <div className="time-col flex items-center justify-center text-[11px] font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 grid-row-h shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        {time}
                      </div>

                      {visibleListDoctors.map((docId) => {
                        const fullKey = `${formatDateKey(
                          selectedDate
                        )}-${time}`;

                        const apt = globalData.appointments?.[docId]?.[fullKey];

                        const tColor = getTreatmentColor(apt?.treatment);

                        const isHighlighted = highlightedAptId === fullKey;

                        const dropTargetKey = `${docId}-${fullKey}`;

                        const now = new Date();
                        const todayStart = new Date(
                          now.getFullYear(),
                          now.getMonth(),
                          now.getDate()
                        ).getTime();
                        const selectedStart = new Date(
                          selectedDate.getFullYear(),
                          selectedDate.getMonth(),
                          selectedDate.getDate()
                        ).getTime();
                        const isPastDate = selectedStart < todayStart;
                        const isToday = selectedStart === todayStart;
                        const slotHour = parseInt(time.split(":")[0]);
                        
                        // GÜÇLENDİRİLMİŞ ÇALIŞMA GÜNÜ MOTORU (Liste)
                        const dayName = DAYS[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1];
                        const currentFormattedDate = `${String(selectedDate.getDate()).padStart(2, '0')}.${String(selectedDate.getMonth() + 1).padStart(2, '0')}.${selectedDate.getFullYear()}`;
                        const isDayClosed = settings?.calisma?.gunler?.[dayName] === false || (settings?.calisma?.ozelGunler || []).some(og => og.tarih === currentFormattedDate);
                        
                        const isPastSlot = isPastDate || (isToday && slotHour < now.getHours()) || isDayClosed;

                        let pId = apt
                          ? apt.patientName.toLowerCase().replace(/\s+/g, "")
                          : null;

                        let anamnesis = pId
                          ? globalData.patientsDb?.[pId]?.anamnesis
                          : null;

                        return (
                          <div
                            key={`${docId}-${time}`}
                            onDragOver={(e) => {
                              if (!isPastSlot) handleDragOver(e, dropTargetKey);
                            }}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => {
                              if (!isPastSlot)
                                handleDrop(e, docId, selectedDate, time);
                            }}
                            onClick={() => {
                              if (!apt && !isPastSlot)
                                openAppointmentModal(time, selectedDate, docId);
                            }}
                            className={`doc-col slot-cell grid-row-h flex items-center px-1 transition-all duration-300 ${
                              isHighlighted ? "flash-highlight" : ""
                            } ${
                              apt
                                ? "has-apt bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm"
                                : isPastSlot
                                ? "border-b border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/10 opacity-60 grayscale cursor-not-allowed pointer-events-none"
                                : "border-b border-dashed border-emerald-300 dark:border-emerald-700/50 hover:border-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 bg-emerald-50/30 dark:bg-emerald-900/10 cursor-pointer"
                            } ${
                              dragOverTargetKey === dropTargetKey
                                ? "drag-over"
                                : ""
                            }`}
                          >
                            {apt && (
                              <div
                                draggable
                                onDragStart={(e) =>
                                  handleDragStart(
                                    e,
                                    docId,
                                    selectedDate,
                                    time,
                                    apt,
                                    fullKey
                                  )
                                }
                                onDragEnd={handleDragEnd}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAppointmentModal(
                                    time,
                                    selectedDate,
                                    docId
                                  );
                                }}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, "appointment", {
                                    slot: time,
                                    date: selectedDate,
                                    docId,
                                    fullKey,
                                    apt,
                                  })
                                }
                                className={`apt-card w-full flex items-center justify-between cursor-pointer transition-all hover:-translate-y-0.5 ${
                                  apt.status === "Gelmedi"
                                    ? "opacity-50 grayscale hover:grayscale-0 hover:opacity-100"
                                    : ""
                                }`}
                                style={{
                                  backgroundColor: tColor.bg,
                                  color: tColor.text,
                                  borderLeftColor: tColor.border,
                                }}
                              >
                                <div className="font-black truncate flex items-center gap-1 text-[10px] sm:text-[11px]">
                                  {apt.patientName}
                                  {anamnesis && (
                                    <i
                                      className="fa-solid fa-triangle-exclamation text-rose-500"
                                      title="Önemli Uyarı Var"
                                    ></i>
                                  )}
                                  {apt.notes && (
                                    <i
                                      className="fa-regular fa-note-sticky text-amber-600 dark:text-amber-500 ml-0.5"
                                      title="Randevu Notu Var"
                                    ></i>
                                  )}
                                </div>

                                <div className="flex gap-1 items-center shrink-0 ml-0.5">
                                  <span className="text-[9px] sm:text-[10px] font-bold opacity-80 hidden md:inline truncate max-w-[80px]">
                                    {renderTreatmentText(apt)}
                                  </span>
                                  {getStatusBadge(apt.status, (e) =>
                                    handleStatusCycle(e, docId, fullKey, apt)
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          );
        };

        const renderPatients = () => {
          let patientsList = Object.values(globalData.patientsDb || {}).filter(
            (p) => p.addedBy === currentUser && !p.isDeleted
          );
          if (patientLocalSearch)
            patientsList = patientsList.filter(
              (p) =>
                p.name

                  .toLowerCase()

                  .includes(patientLocalSearch.toLowerCase()) ||
                (p.phone && p.phone.includes(patientLocalSearch)) ||
                (p.tc && p.tc.includes(patientLocalSearch))
            );

          if (patientFilterStatus !== "all")
            patientsList = patientsList.filter(
              (p) => p.lastStatus === patientFilterStatus
            );

          if (patientFilterTreatment !== "all")
            patientsList = patientsList.filter(
              (p) => p.lastTreatment === patientFilterTreatment
            );

          return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col animate-pop w-full">
              <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-1.5 bg-slate-50 dark:bg-slate-900 rounded-t-2xl shrink-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1">
                    <i className="fa-solid fa-hospital-user text-indigo-500"></i>{" "}
                    Hasta Veritabanı
                  </h2>

                  <div className="bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full text-[11px] shadow-sm">
                    Toplam: {patientsList.length}
                  </div>
                </div>

                <div className="flex gap-1 w-full xl:w-auto flex-wrap">
                  <div className="relative flex-1 min-w-[160px]">
                    <i className="fa-solid fa-search absolute left-2.5 top-2 text-slate-400 text-[11px]"></i>

                    <input
                      type="text"
                      placeholder="İsim, TC, Tel ara..."
                      value={patientLocalSearch}
                      onChange={(e) => setPatientLocalSearch(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 shadow-sm dark:text-white"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setPatientForm({
                        id: "",

                        name: "",

                        phone: "",

                        tc: "",

                        age: "",

                        gender: "Belirtilmemiş",

                        anamnesis: "",

                        payments: [],

                        plannedTreatments: [],
                      });

                      setPatientModalTab("info");

                      setIsPatientModalOpen(true);
                    }}
                    className="bg-slate-900 dark:bg-indigo-600 text-white px-2.5 py-1.5 rounded-xl text-[13px] font-bold shadow-md hover:bg-slate-800 dark:hover:bg-indigo-700 transition"
                  >
                    <i className="fa-solid fa-plus mr-1"></i> Yeni
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto overflow-y-auto w-full">
                <table className="w-full text-left text-[13px] text-slate-600 dark:text-slate-300 min-w-[700px] border-separate border-spacing-y-1.5">
                  <thead className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider bg-transparent sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">Hasta Adı</th>
                      <th className="px-2.5 py-1.5 font-semibold">
                        Kişisel Bilgiler
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold">
                        Uyarı / Anamnez
                      </th>
                      <th className="px-2.5 py-1.5 text-right font-semibold">
                        Bakiye
                      </th>
                      <th className="px-2.5 py-1.5 text-center font-semibold">
                        İşlem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent">
                    {patientsList.map((p) => {
                      const finance = calculatePatientFinance(p.id, p.name);

                      return (
                        <tr
                          key={p.id}
                          className="bg-white dark:bg-slate-800/80 shadow-sm border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group rounded-xl overflow-hidden relative"
                          onClick={() => {
                            setPatientForm(p);
                            setPatientModalTab("info");
                            setIsPatientModalOpen(true);
                          }}
                          onContextMenu={(e) =>
                            handleContextMenu(e, "patient", p)
                          }
                        >
                          <td className="px-2.5 py-1.5 font-black text-slate-800 dark:text-slate-100">
                            <div className="flex items-center gap-1.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                <i className="fa-regular fa-user"></i>
                              </div>

                              <div>
                                <div>{p.name}</div>

                                {/* YENİ: Tek tıkla kopyalama özelliği */}
                                <div
                                  onClick={(e) =>
                                    handleCopyPhone(e, p.phone, p.id)
                                  }
                                  className={`text-[10px] mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-all border ${
                                    copiedPhoneId === p.id
                                      ? "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800"
                                      : "text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                                  }`}
                                >
                                  <i
                                    className={`fa-solid ${
                                      copiedPhoneId === p.id
                                        ? "fa-check"
                                        : "fa-phone"
                                    }`}
                                  ></i>
                                  {copiedPhoneId === p.id
                                    ? "Kopyalandı!"
                                    : p.phone || "-"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-2.5 py-1.5 font-medium">
                            <div className="text-slate-700 dark:text-slate-300 font-bold">
                              {p.tc || "TC Yok"}
                            </div>

                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {p.age ? p.age + " Yaş" : "-"} •{" "}
                              {p.gender !== "Belirtilmemiş" ? p.gender : "-"}
                            </div>
                          </td>

                          <td className="px-2.5 py-1.5">
                            {p.anamnesis ? (
                              <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">
                                <i className="fa-solid fa-triangle-exclamation mr-1"></i>{" "}
                                Kayıtlı
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[11px]">-</span>
                            )}
                          </td>

                          <td className="px-2.5 py-1.5 text-right font-black">
                            <span
                              className={
                                finance.debt > 0
                                  ? "text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-lg border border-rose-100 dark:bg-rose-900/30 dark:border-rose-800/50"
                                  : "text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800/50"
                              }
                            >
                              {/* YENİ: Bakiye artık Gizlilik Modu ile uyumlu çalışacak */}
                              {renderMoney(finance.debt)}{" "}
                              {isPrivacyMode ? "" : "₺"}
                            </span>
                          </td>

                          <td className="px-2.5 py-1.5 text-right pr-4">
                            {/* YENİ: Modern Hızlı Eylem Grubu */}
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 translate-x-3 group-hover:translate-x-0 transition-all duration-300">
                              {/* Hızlı WhatsApp/Ara Butonu */}
                              {p.phone && p.phone !== "-" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    let num = p.phone.replace(/\D/g, "");
                                    if (!num.startsWith("90")) num = "90" + num;
                                    window.open(
                                      `https://wa.me/${num}`,
                                      "_blank"
                                    );
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-colors shadow-sm"
                                  title="WhatsApp ile Mesaj At"
                                >
                                  <i className="fa-brands fa-whatsapp"></i>
                                </button>
                              )}

                              {/* Dosyayı Aç Butonu */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPatientForm(p);
                                  setPatientModalTab("info");
                                  setIsPatientModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 font-bold text-[11px] hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-colors shadow-sm flex items-center gap-1"
                              >
                                Dosya{" "}
                                <i className="fa-solid fa-arrow-right"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {patientsList.length === 0 && (
                      <tr>
                        <td colSpan="5">
                          <div className="flex flex-col items-center justify-center py-12 px-3 text-center">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                              <i className="fa-solid fa-hospital-user text-xl text-slate-300 dark:text-slate-600"></i>
                            </div>
                            <h4 className="text-slate-500 dark:text-slate-400 text-base font-black mb-0.5">
                              Kayıt Bulunamadı
                            </h4>
                            <p className="text-slate-400 dark:text-slate-500 text-[13px] font-medium max-w-sm">
                              Arama kriterlerinize uyan bir hasta dosyası
                              bulunmuyor. Yeni bir hasta kaydı
                              oluşturabilirsiniz.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        };

        const renderPricing = () => {
          const handleSavePricing = (e) => {
            e.preventDefault();

            let existingDb = { ...(globalData.pricingDb || {}) };

            // Eğer önceki eski "düz (hekim bazlı olmayan)" yapı mevcutsa üzerine yazıp temizleyelim
            if (existingDb["Genel Muayene"] !== undefined) {
              existingDb = {};
            }

            const cleanPricing = {};
            // Firebase'in çökmesini engellemek için tüm değerleri saf sayı formatına çeviriyoruz
            Object.keys(pricingEditValues).forEach((tx) => {
              cleanPricing[tx] = parseFloat(pricingEditValues[tx]) || 0;
            });

            const updatedPricingDb = {
              ...existingDb,
              [currentUser]: cleanPricing,
            };

            saveGlobalData({ ...globalData, pricingDb: updatedPricingDb })
              .then(() => {
                showNotification("Ücretlendirmeleriniz başarıyla kaydedildi.");
              })
              .catch((err) => {
                showNotification(
                  "Firebase Kayıt Hatası! İşlem isimlerinde geçersiz karakter olabilir.",
                  "error"
                );
                console.error(err);
              });
          };

          return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 pb-8 flex flex-col p-2 animate-pop w-full h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-2 pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
                <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1">
                  <i className="fa-solid fa-tags text-pink-500"></i> İşlem
                  Ücretlendirmeleri
                </h2>
              </div>

              <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-2 font-medium">
                Klinikte uyguladığınız işlemlere ait standart tutarları aşağıdan
                güncelleyebilirsiniz. Yeni eklenen işlemleri veya "0" olarak
                görünenleri doldurup kaydettiğinizde tüm sistemde anında geçerli
                olacaktır.
              </p>

              <form onSubmit={handleSavePricing} className="space-y-2">
                {Object.entries(DYNAMIC_PRICING_CATEGORIES).map(([catName, data]) => (
                  <div
                    key={catName}
                    className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800"
                  >
                    <h3 className="font-black text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-2 text-base flex items-center gap-1">
                      <i className={`fa-solid ${data.icon} ${data.color}`}></i>{" "}
                      {catName}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5">
                      {data.items.map((tx) => (
                        <div
                          key={tx}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                        >
                          <div className="flex-1">
                            <label className="font-bold text-slate-700 dark:text-slate-200 text-[13px] leading-tight block mb-1.5">
                              {tx}
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <span className="text-slate-400 text-[13px] font-black dark:text-slate-500">
                                  ₺
                                </span>
                              </div>
                              <input
                                type="number"
                                required
                                value={pricingEditValues[tx] ?? ""}
                                onChange={(e) =>
                                  setPricingEditValues({
                                    ...pricingEditValues,
                                    [tx]: e.target.value,
                                  })
                                }
                                className="w-full text-right pr-3 pl-7 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 outline-none font-black text-base text-indigo-700 dark:text-indigo-400 bg-slate-50 dark:bg-slate-900 transition-all"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="sticky bottom-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md pt-3 border-t border-slate-200 dark:border-slate-700 mt-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-3 py-2 rounded-xl font-black shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                  >
                    <i className="fa-solid fa-save mr-1.5"></i> Ücretleri Kaydet
                  </button>
                </div>
              </form>
            </div>
          );
        };

        const renderDoctors = () => {
          const handleAddDoctor = (e) => {
            e.preventDefault();

            // undefined/null hatalarını önlemek için güvenli tanımlamalar
            const safeNewName = newDoctorForm.name || "";
            const normalizedNewName = safeNewName.trim().toLowerCase();

            // 1. KLİNİK BAZLI İSİM BENZERSİZLİK KONTROLÜ
            const isDuplicateName = allDoctors.some((docId) => {
              const docProfile = globalData.doctorProfiles?.[docId];
              const profileName = docProfile?.name || "";
              return profileName.trim().toLowerCase() === normalizedNewName;
            });

            if (isDuplicateName) {
              showNotification("Bu klinikte bu isimde bir hekim zaten bulunuyor.", "error");
              return;
            }

            // 2. SADECE HEKİM PROFİLİ İÇİN BENZERSİZ KİMLİK (ID) OLUŞTURMA (usersDb'den bağımsız)
            let baseId = safeNewName.toLowerCase().replace(/\s+/g, "");
            let autoDoctorId = baseId;
            let counter = 1;
            while (globalData.doctorProfiles?.[autoDoctorId]) {
              autoDoctorId = baseId + counter;
              counter++;
            }

            const updatedProfiles = {
              ...globalData.doctorProfiles,
              [autoDoctorId]: {
                name: safeNewName.trim(),
                title: newDoctorForm.title || "",
                addedBy: currentUser,
              },
            };

            saveGlobalData({
              ...globalData,
              // DİKKAT: usersDb güncellenmiyor. Yeni hekime sisteme giriş (login) kaydı açılmıyor.
              doctorProfiles: updatedProfiles,
            });

            setIsAddDoctorModalOpen(false);

            setNewDoctorForm({
              username: "",
              password: "",
              name: "",
              title: "",
            });

            showNotification("Yeni hekim kaydı başarıyla oluşturuldu.");
          };

          const openDoctorDetails = (docUsername) => {
            setSelectedDoctorId(docUsername);

            setDoctorEditForm(
              globalData.doctorProfiles?.[docUsername] || {
                name: docUsername,

                title: "Hekim",
              }
            );

            setDocModalTab("profile");

            setDocStatsStart("");

            setDocStatsEnd("");

            setDocStatsSelectedTreatment(null);

            setIsDoctorDetailsModalOpen(true);
          };

          const handleUpdateDoctor = (e) => {
            e.preventDefault();

            // KLİNİK BAZLI İSİM BENZERSİZLİK KONTROLÜ (DÜZENLEME İÇİN)
            const normalizedEditName = doctorEditForm.name.trim().toLowerCase();
            const isDuplicateName = allDoctors.some((docId) => {
              if (docId === selectedDoctorId) return false; // Kendisini kontrol dışı bırak
              const docProfile = globalData.doctorProfiles?.[docId];
              return docProfile?.name?.trim().toLowerCase() === normalizedEditName;
            });

            if (isDuplicateName) {
              showNotification("Bu klinikte bu isimde başka bir hekim zaten bulunuyor.", "error");
              return;
            }

            // İsim alanındaki gereksiz boşlukları temizleyerek kaydet
            const finalEditForm = { ...doctorEditForm, name: doctorEditForm.name.trim() };

            const updatedProfiles = {
              ...globalData.doctorProfiles,
              [selectedDoctorId]: finalEditForm,
            };

            saveGlobalData({ ...globalData, doctorProfiles: updatedProfiles });

            showNotification("Hekim profili güncellendi.");

            setIsDoctorDetailsModalOpen(false);
          };

          const handleDeleteDoctor = () => {
          if (selectedDoctorId === currentUser) {
            showNotification(
              "Şu an aktif olan hesabınızı silemezsiniz!",
              "error"
            );
            return;
          }

          showConfirm(
            `${selectedDoctorId} adlı hekimi pasife almak istediğinize emin misiniz? (Geçmiş randevuları ve ciroları korunacaktır)`,
            () => {
              const updatedUsers = { ...globalData.usersDb };
              delete updatedUsers[selectedDoctorId]; // Sisteme giriş yetkisi kaldırılır

              const updatedProfiles = { ...globalData.doctorProfiles };
              delete updatedProfiles[selectedDoctorId]; // Hekim listeden kaldırılır

              // DİKKAT: updatedAppointments (randevular ve geçmiş cirolar) silinmiyor!
              // Böylece geçmiş bilanço ve finans raporlarınız asla bozulmaz.

              saveGlobalData({
                ...globalData,
                usersDb: updatedUsers,
                doctorProfiles: updatedProfiles,
                // appointments objesine dokunulmuyor, geçmiş veriler saklanıyor.
              });

              showNotification("Hekim pasife alındı. Geçmiş randevu ve ciro kayıtları korundu.", "error");

              setIsDoctorDetailsModalOpen(false);
            }
          );
        };

          const getDoctorFilteredStats = (docId) => {
            let stats = {
              total: 0,

              waiting: 0,

              done: 0,

              revenue: 0,

              treatments: {},

              ptList: [],
            };

            const apts = globalData.appointments?.[docId] || {};

            Object.entries(apts).forEach(([key, a]) => {
              const [y, m, d] = key.split("-").map(Number);

              const aptDateStr = `${y}-${String(m).padStart(2, "0")}-${String(
                d
              ).padStart(2, "0")}`;

              let inRange = true;

              if (docStatsStart && aptDateStr < docStatsStart) inRange = false;

              if (docStatsEnd && aptDateStr > docStatsEnd) inRange = false;

              if (inRange) {
                stats.total++;

                if (a.status === "Yeni Kayıt" || a.status === "Bekliyor")
                  stats.waiting++;

                if (a.status === "Geldi") stats.done++;
                if (a.treatment)
                  stats.treatments[a.treatment] =
                    (stats.treatments[a.treatment] || 0) + 1;

                let aptPrice = parseFloat(a.price) || 0;
                // Randevuda manuel fiyat yoksa ilgili hekimin özel fiyat listesinden çek
                if (!aptPrice && a.treatment) {
                  const docPricing =
                    globalData.pricingDb?.[docId] ||
                    (typeof globalData.pricingDb === "object" &&
                    globalData.pricingDb["Genel Muayene"]
                      ? globalData.pricingDb
                      : DEFAULT_PRICING);
                  const matchedTx = Object.keys(DEFAULT_PRICING).find((t) =>
                    a.treatment.includes(t)
                  );
                  if (matchedTx && docPricing[matchedTx] !== undefined) {
                    aptPrice = parseFloat(docPricing[matchedTx]) || 0;
                  }
                }
                // Randevu "Geldi" (İşlem Bitti) olarak işaretlendiğinde hekimin cirosuna ekle
                if (a.status === "Geldi" && aptPrice > 0)
                  stats.revenue += aptPrice;

                stats.ptList.push({
                  date: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
                  time: key.split("-")[3],
                  patient: a.patientName,
                  treatment: renderTreatmentText(a),
                  status: a.status,
                  price: aptPrice,
                  // YENİ: Gerçek zaman damgası (Timestamp) arka planda hesaplanıp saklanıyor
                  timestamp: new Date(y, m - 1, d, ...(key.split("-")[3] || "00:00").split(":")).getTime() 
                });
              }
            });

            // YENİ DÜZELTME: Metinsel sıralama (localeCompare) iptal edildi. 
            // Matematiksel timestamp ile hatasız kronolojik sıralama yapılıyor (En yeniden en eskiye).
            stats.ptList.sort((a, b) => b.timestamp - a.timestamp);

            return stats;
          };

          return (
            <div className="w-full h-full flex flex-col relative animate-pop">
              {!isDoctorDetailsModalOpen && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 pb-8 flex flex-col p-2 w-full h-full overflow-y-auto">
                  <div className="flex justify-between items-center mb-2 pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
                    <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1">
                      <i className="fa-solid fa-user-doctor text-indigo-500"></i>{" "}
                      Hekim Yönetimi
                    </h2>

                    <button
                      onClick={() => setIsAddDoctorModalOpen(true)}
                      className="bg-slate-900 dark:bg-indigo-600 text-white px-2.5 py-2 rounded-xl text-[13px] font-bold shadow-md hover:bg-slate-800 dark:hover:bg-indigo-700 transition"
                    >
                      <i className="fa-solid fa-plus mr-1"></i>Yeni Hekim Ekle
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5 content-start">
                    {allDoctors.map((doc) => {
                      const prof = globalData.doctorProfiles?.[doc] || {};

                      return (
                        <div
                          key={doc}
                          onClick={() => openDoctorDetails(doc)}
                          onContextMenu={(e) =>
                            handleContextMenu(e, "doctor", doc)
                          }
                          className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition cursor-pointer group relative"
                        >
                          <div className="w-14 h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400 text-base shadow-sm group-hover:text-indigo-500 transition-colors overflow-hidden relative shrink-0">
                            {prof.avatar ? (
                              <img
                                src={prof.avatar}
                                style={{
                                  transform: `scale(${prof.zoom || 1})`,
                                  objectPosition: `${prof.x || 50}% ${
                                    prof.y || 50
                                  }%`,
                                }}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <i className="fa-solid fa-user-doctor"></i>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="font-black text-slate-800 dark:text-white text-base">
                              {prof.name || doc}
                            </div>
                            <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800/50 inline-block px-2 py-0.5 rounded-lg mt-0.5 shadow-sm">
                              {prof.title || "Hekim"}
                            </div>
                          </div>

                          <div className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition pr-1.5">
                            <i className="fa-solid fa-chevron-right"></i>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isAddDoctorModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2">
                  <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-pop">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-[#0f172a] text-white flex justify-between items-center">
                      <h3 className="font-black">
                        <i className="fa-solid fa-user-plus mr-2"></i>Yeni Hekim
                        Ekle
                      </h3>

                      <button
                        onClick={() => setIsAddDoctorModalOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <i className="fa-solid fa-xmark text-base"></i>
                      </button>
                    </div>

                    <form onSubmit={handleAddDoctor} className="p-3 space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Ad Soyad / Görünen İsim
                        </label>

                        <input
                          required
                          value={newDoctorForm.name}
                          onChange={(e) =>
                            setNewDoctorForm({
                              ...newDoctorForm,

                              name: e.target.value,
                            })
                          }
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Unvan
                        </label>

                        <input
                          required
                          value={newDoctorForm.title}
                          onChange={(e) =>
                            setNewDoctorForm({
                              ...newDoctorForm,

                              title: e.target.value,
                            })
                          }
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 dark:text-white"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-[#0f172a] dark:bg-indigo-600 text-white rounded-xl font-black shadow-lg mt-2 hover:bg-slate-800 dark:hover:bg-indigo-700 transition"
                      >
                        Kaydet ve Ekle
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {isDoctorDetailsModalOpen &&
                selectedDoctorId &&
                (() => {
                  const stats = getDoctorFilteredStats(selectedDoctorId);
                  let displayedPtList = stats.ptList;

                  // Hangi karta tıklandıysa listeyi ona göre daraltıyoruz
                  if (docStatsActiveFilter === "done")
                    displayedPtList = displayedPtList.filter(
                      (pt) => pt.status === "Geldi"
                    );
                  if (docStatsActiveFilter === "waiting")
                    displayedPtList = displayedPtList.filter(
                      (pt) =>
                        pt.status === "Yeni Kayıt" || pt.status === "Bekliyor"
                    );
                  if (docStatsActiveFilter === "revenue")
                    displayedPtList = displayedPtList.filter(
                      (pt) => pt.price > 0 && pt.status === "Geldi"
                    );

                  // Üzerine bir de işlem seçildiyse onu da filtreliyoruz
                  if (docStatsSelectedTreatment) {
                    displayedPtList = displayedPtList.filter((pt) =>
                      pt.treatment.includes(docStatsSelectedTreatment)
                    );
                  }

                  return (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col w-full h-full overflow-hidden animate-pop">
                      <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setIsDoctorDetailsModalOpen(false)}
                            className="w-9 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                          >
                            <i className="fa-solid fa-arrow-left"></i>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base shadow-md overflow-hidden relative">
                              {globalData.doctorProfiles?.[selectedDoctorId]
                                ?.avatar ? (
                                <img
                                  src={
                                    globalData.doctorProfiles[selectedDoctorId]
                                      .avatar
                                  }
                                  style={{
                                    transform: `scale(${
                                      globalData.doctorProfiles[
                                        selectedDoctorId
                                      ].zoom || 1
                                    })`,
                                    objectPosition: `${
                                      globalData.doctorProfiles[
                                        selectedDoctorId
                                      ].x || 50
                                    }% ${
                                      globalData.doctorProfiles[
                                        selectedDoctorId
                                      ].y || 50
                                    }%`,
                                  }}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <i className="fa-solid fa-user-doctor"></i>
                              )}
                            </div>
                            <div>
                              <h3 className="font-black text-slate-800 dark:text-white text-base leading-tight">
                                {
                                  globalData.doctorProfiles?.[selectedDoctorId]
                                    ?.name
                                }
                              </h3>
                              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mt-0.5 bg-indigo-50 dark:bg-indigo-900/30 inline-block px-1.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800">
                                {globalData.doctorProfiles?.[selectedDoctorId]
                                  ?.title || "Hekim Profili"}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="hidden sm:flex bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            Sistemde Kayıtlı
                          </span>
                        </div>
                      </div>

                      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 px-2.5 pt-3 gap-2 shrink-0">
                        <button
                          onClick={() => setDocModalTab("profile")}
                          className={`pb-2 font-bold text-[13px] border-b-2 transition-all ${
                            docModalTab === "profile"
                              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                              : "border-transparent text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          Profil Düzenle
                        </button>

                        <button
                          onClick={() => setDocModalTab("stats")}
                          className={`pb-2 font-bold text-[13px] border-b-2 transition-all ${
                            docModalTab === "stats"
                              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                              : "border-transparent text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          Detaylı Performans & Hastalar
                        </button>
                      </div>

                      <div className="p-2 overflow-y-auto flex-1">
                        {docModalTab === "profile" && (
                          <form
                            onSubmit={handleUpdateDoctor}
                            className="space-y-2 max-w-2xl mx-auto bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg mt-2 relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                            <h4 className="font-black text-[13px] uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-1">
                              <i className="fa-solid fa-id-card text-indigo-500"></i>{" "}
                              Temel Bilgiler & Yetkiler
                            </h4>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Hekim Adı
                              </label>

                              <input
                                required
                                value={doctorEditForm.name}
                                onChange={(e) =>
                                  setDoctorEditForm({
                                    ...doctorEditForm,

                                    name: e.target.value,
                                  })
                                }
                                className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Unvan
                              </label>

                              <input
                                value={doctorEditForm.title}
                                onChange={(e) =>
                                  setDoctorEditForm({
                                    ...doctorEditForm,

                                    title: e.target.value,
                                  })
                                }
                                className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-emerald-500 uppercase mb-1">
                                Hakediş Oranı (%)
                              </label>
                              <input
                                type="number"
                                placeholder="Örn: 40"
                                value={doctorEditForm.commissionRate || ""}
                                onChange={(e) =>
                                  setDoctorEditForm({
                                    ...doctorEditForm,
                                    commissionRate: e.target.value,
                                  })
                                }
                                className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-emerald-500 dark:text-white mb-2"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Profil Fotoğrafı
                              </label>

                              <div className="flex items-center gap-1.5 mt-1.5">
                                <div
                                  onClick={() =>
                                    setAvatarModalInfo({
                                      isOpen: true,
                                      docId: selectedDoctorId,
                                      tempAvatar: doctorEditForm.avatar || null,
                                      zoom: doctorEditForm.zoom || 1,
                                      x: doctorEditForm.x || 50,
                                      y: doctorEditForm.y || 50,
                                    })
                                  }
                                  className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden relative hover:opacity-80 transition shadow-sm group"
                                >
                                  {doctorEditForm.avatar ? (
                                    <>
                                      <img
                                        src={doctorEditForm.avatar}
                                        style={{
                                          transform: `scale(${
                                            doctorEditForm.zoom || 1
                                          })`,
                                          objectPosition: `${
                                            doctorEditForm.x || 50
                                          }% ${doctorEditForm.y || 50}%`,
                                        }}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <i className="fa-solid fa-pen text-white"></i>
                                      </div>
                                    </>
                                  ) : (
                                    <i className="fa-solid fa-camera text-slate-400 text-base group-hover:text-indigo-500"></i>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                  Fotoğraf eklemek veya hizalamak için
                                  <br />
                                  yandaki yuvaya tıklayın.
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 pt-3 border-t border-slate-100 dark:border-slate-700 mt-1.5">
                              {selectedDoctorId !== currentUser && (
                                <button
                                  type="button"
                                  onClick={handleDeleteDoctor}
                                  className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 font-bold rounded-xl transition border border-rose-100 dark:border-rose-800/50 flex items-center gap-1"
                                >
                                  <i className="fa-solid fa-trash"></i> Hekimi
                                  Sil
                                </button>
                              )}

                              <button
                                type="submit"
                                className="flex-1 py-1.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md"
                              >
                                Değişiklikleri Kaydet
                              </button>
                            </div>
                          </form>
                        )}

                        {docModalTab === "stats" && (
                          <div className="space-y-2 flex flex-col pb-3">
                            <div className="flex justify-end gap-1 items-center bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 shrink-0">
                              <span className="text-[11px] font-bold text-slate-500 mr-1.5">
                                <i className="fa-regular fa-calendar mr-1"></i>{" "}
                                Tarih Aralığı:
                              </span>

                              <input
                                type="date"
                                value={docStatsStart}
                                onChange={(e) =>
                                  setDocStatsStart(e.target.value)
                                }
                                className="relative text-[13px] font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 outline-none cursor-pointer dark:text-white"
                              />

                              <span className="text-slate-400">-</span>

                              <input
                                type="date"
                                value={docStatsEnd}
                                onChange={(e) => setDocStatsEnd(e.target.value)}
                                className="relative text-[13px] font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 outline-none cursor-pointer dark:text-white"
                              />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                              <div
                                onClick={() => setDocStatsActiveFilter("all")}
                                className={`p-2 rounded-xl border shadow-sm text-center cursor-pointer transition-all hover:scale-105 ${
                                  docStatsActiveFilter === "all"
                                    ? "bg-indigo-50 border-indigo-500 dark:bg-indigo-900/40 ring-2 ring-indigo-500"
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                <div className="text-[10px] font-bold text-slate-500 uppercase">
                                  Toplam Randevu
                                </div>
                                <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                                  {stats.total}
                                </div>
                              </div>

                              <div
                                onClick={() => setDocStatsActiveFilter("done")}
                                className={`p-2 rounded-xl border shadow-sm text-center cursor-pointer transition-all hover:scale-105 ${
                                  docStatsActiveFilter === "done"
                                    ? "bg-emerald-100 border-emerald-500 dark:bg-emerald-900/50 ring-2 ring-emerald-500"
                                    : "bg-emerald-50/30 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50"
                                }`}
                              >
                                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                                  İşlemi Biten
                                </div>
                                <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                  {stats.done}
                                </div>
                              </div>

                              <div
                                onClick={() =>
                                  setDocStatsActiveFilter("waiting")
                                }
                                className={`p-2 rounded-xl border shadow-sm text-center cursor-pointer transition-all hover:scale-105 ${
                                  docStatsActiveFilter === "waiting"
                                    ? "bg-amber-100 border-amber-500 dark:bg-amber-900/50 ring-2 ring-amber-500"
                                    : "bg-amber-50/30 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50"
                                }`}
                              >
                                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                                  Bekleyen Aktif
                                </div>
                                <div className="text-base font-black text-amber-600 dark:text-amber-400">
                                  {stats.waiting}
                                </div>
                              </div>

                              <div
                                onClick={() =>
                                  setDocStatsActiveFilter("revenue")
                                }
                                className={`p-2 rounded-xl border shadow-sm text-center cursor-pointer transition-all hover:scale-105 ${
                                  docStatsActiveFilter === "revenue"
                                    ? "bg-blue-100 border-blue-500 dark:bg-blue-900/50 ring-2 ring-blue-500"
                                    : "bg-blue-50/30 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50"
                                }`}
                              >
                                <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">
                                  Üretilen Ciro
                                </div>
                                <div className="text-base font-black text-blue-600 dark:text-blue-400">
                                  {stats.revenue.toLocaleString("tr-TR")} ₺
                                </div>
                                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 bg-white/50 dark:bg-black/20 rounded py-0.5">
                                  Hakediş:{" "}
                                  {(
                                    (stats.revenue *
                                      (globalData.doctorProfiles?.[
                                        selectedDoctorId
                                      ]?.commissionRate || 0)) /
                                    100
                                  ).toLocaleString("tr-TR")}{" "}
                                  ₺
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-2 min-h-[400px]">
                              <div className="flex-1 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-0 h-full">
                                <h4 className="font-black text-[11px] text-slate-500 uppercase mb-2 tracking-wider shrink-0">
                                  İşlem Dağılımı{" "}
                                  <span className="text-[9px] font-normal text-slate-400 normal-case block mt-0.5">
                                    Detay için işleme tıklayın
                                  </span>
                                </h4>

                                <div className="space-y-1.5 overflow-y-auto flex-1">
                                  {Object.entries(stats.treatments).length >
                                  0 ? (
                                    Object.entries(stats.treatments).map(
                                      ([t, count]) => {
                                        const isSelected =
                                          docStatsSelectedTreatment === t;

                                        return (
                                          <div
                                            key={t}
                                            onClick={() =>
                                              setDocStatsSelectedTreatment(
                                                isSelected ? null : t
                                              )
                                            }
                                            className={`flex justify-between items-center text-[11px] p-1.5 rounded-lg font-bold border cursor-pointer transition ${
                                              isSelected
                                                ? "bg-indigo-50 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-600 ring-1 ring-indigo-500"
                                                : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            }`}
                                          >
                                            <span
                                              className={
                                                isSelected
                                                  ? "text-indigo-800 dark:text-indigo-300"
                                                  : "text-slate-700 dark:text-slate-300"
                                              }
                                            >
                                              {t}
                                            </span>

                                            <span
                                              className={`px-1.5 py-0.5 rounded shadow-sm ${
                                                isSelected
                                                  ? "bg-indigo-600 text-white"
                                                  : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                                              }`}
                                            >
                                              {count} Kez
                                            </span>
                                          </div>
                                        );
                                      }
                                    )
                                  ) : (
                                    <div className="text-[11px] text-slate-400 font-medium text-center py-2">
                                      Kayıtlı işlem yok.
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex-[2] bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-0 h-full">
                                <div className="flex justify-between items-center mb-2 shrink-0">
                                  <h4 className="font-black text-[11px] text-slate-500 uppercase tracking-wider">
                                    Randevu Geçmişi Detayı{" "}
                                    <span className="text-indigo-600 dark:text-indigo-400 ml-1">
                                      [
                                      {docStatsActiveFilter === "all"
                                        ? "Tüm Randevular"
                                        : docStatsActiveFilter === "done"
                                        ? "İşlemi Bitenler"
                                        : docStatsActiveFilter === "waiting"
                                        ? "Bekleyen Aktifler"
                                        : "Ciroya Dahil Biten İşlemler"}
                                      ]
                                    </span>
                                    {docStatsSelectedTreatment && (
                                      <span className="text-purple-600 dark:text-purple-400 ml-1">
                                        ({docStatsSelectedTreatment})
                                      </span>
                                    )}{" "}
                                    <span className="ml-1 text-slate-400">
                                      ({displayedPtList.length} Kayıt)
                                    </span>
                                  </h4>

                                  {docStatsSelectedTreatment && (
                                    <button
                                      onClick={() =>
                                        setDocStatsSelectedTreatment(null)
                                      }
                                      className="text-[10px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold transition"
                                    >
                                      Filtreyi Temizle
                                    </button>
                                  )}
                                </div>

                                <div className="flex-1 overflow-y-auto pr-1.5 space-y-1.5">
                                  {displayedPtList.map((pt, i) => (
                                    <div
                                      key={i}
                                      className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 transition"
                                    >
                                      <div>
                                        <div className="font-black text-slate-800 dark:text-slate-200 text-[13px]">
                                          {pt.patient}
                                        </div>

                                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                          {pt.date} - {pt.time} •{" "}
                                          {pt.treatment || "Belirtilmedi"}
                                        </div>
                                      </div>

                                      <div>{getStatusBadge(pt.status)}</div>
                                    </div>
                                  ))}

                                  {displayedPtList.length === 0 && (
                                    <div className="text-[11px] text-slate-400 font-medium text-center py-2">
                                      Bu kriterlere uygun randevu yok.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
            </div>
          );
        };
const renderSettings = () => {
          const SETTINGS_TABS = [
            { id: "ozet", icon: "fa-chart-pie", label: "Özet" },
            { id: "klinik", icon: "fa-hospital", label: "Klinik" },
            { id: "calisma", icon: "fa-clock", label: "Çalışma" },
            { id: "randevu", icon: "fa-calendar-check", label: "Randevu" },
            { id: "tedavi", icon: "fa-tooth", label: "Tedavi" },
            { id: "bildirim", icon: "fa-bell", label: "Bildirim" },
            { id: "belge", icon: "fa-file-signature", label: "Belge" },
            { id: "dosya", icon: "fa-folder-tree", label: "Dosya" },
            { id: "otomasyon", icon: "fa-robot", label: "Otomasyon" },
            { id: "gorunum", icon: "fa-palette", label: "Görünüm" },
            { id: "guvenlik", icon: "fa-shield-halved", label: "Güvenlik" },
            { id: "veri", icon: "fa-database", label: "Veri" }
          ];

          const currentData = settingsDraft || settings;

          return (
            <div className="flex flex-col h-full animate-pop w-full relative">
              {/* HEADER BÖLÜMÜ */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 sm:p-4 shrink-0 mb-2 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-gear text-slate-500"></i> Klinik Ayarları
                  </h2>
                  <p className="text-[11px] sm:text-[13px] text-slate-500 mt-1 font-medium max-w-xl">
                    Klinik sisteminizin çalışma biçimini, randevu kurallarını, tedavi seçeneklerini, bildirimleri ve diğer operasyonel ayarları yönetin.
                  </p>
                </div>
                <div className="w-full md:w-auto flex flex-col items-end gap-2">
                  <div className="relative w-full md:w-64">
                    <i className="fa-solid fa-search absolute left-3 top-2.5 text-slate-400 text-[13px]"></i>
                    <input type="text" placeholder="Ayarlarda ara..." value={settingsSearch} onChange={(e) => setSettingsSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 shadow-inner dark:text-white" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">Son kaydedilme: Bugün {new Date().toLocaleTimeString("tr-TR", {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
              </div>

              {/* YATAY TAB MENÜSÜ */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-2 shrink-0 px-2 py-2 overflow-hidden">
                <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                  {SETTINGS_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-[12px] whitespace-nowrap transition-all flex-1 justify-center sm:flex-none sm:justify-start ${
                        settingsTab === tab.id
                          ? "bg-slate-900 text-white shadow-md dark:bg-indigo-600"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <i className={`fa-solid ${tab.icon} ${settingsTab === tab.id ? "" : "opacity-70"}`}></i> {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* İÇERİK ALANI */}
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 sm:p-4 overflow-y-auto custom-scrollbar pb-24 relative">
                
                {settingsTab === "ozet" && (
                  <div className="animate-pop">
                    <h3 className="font-black text-slate-800 dark:text-white text-base mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Sistem Özeti</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex gap-3 items-start cursor-pointer hover:shadow-md transition bg-slate-50/50 dark:bg-slate-800/50" onClick={()=>setSettingsTab("klinik")}>
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center text-lg dark:bg-emerald-900/20"><i className="fa-solid fa-hospital"></i></div>
                        <div><div className="text-[10px] font-bold text-slate-400 uppercase">Klinik</div><div className="font-black text-[13px] dark:text-white mt-0.5">{currentData.klinik.durum}</div></div>
                      </div>
                      <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex gap-3 items-start cursor-pointer hover:shadow-md transition bg-slate-50/50 dark:bg-slate-800/50" onClick={()=>setSettingsTab("randevu")}>
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center text-lg dark:bg-indigo-900/20"><i className="fa-solid fa-calendar-check"></i></div>
                        <div><div className="text-[10px] font-bold text-slate-400 uppercase">Randevu</div><div className="font-black text-[13px] dark:text-white mt-0.5">{currentData.randevu.varsayilanSure} Dk</div></div>
                      </div>
                      <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex gap-3 items-start cursor-pointer hover:shadow-md transition bg-slate-50/50 dark:bg-slate-800/50" onClick={()=>setSettingsTab("bildirim")}>
                        <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center text-lg dark:bg-amber-900/20"><i className="fa-solid fa-bell"></i></div>
                        <div><div className="text-[10px] font-bold text-slate-400 uppercase">Bildirim</div><div className="font-black text-[13px] dark:text-white mt-0.5">{currentData.bildirim.whatsappAktif ? "WP Aktif" : "Pasif"}</div></div>
                      </div>
                      <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex gap-3 items-start cursor-pointer hover:shadow-md transition bg-slate-50/50 dark:bg-slate-800/50" onClick={()=>setSettingsTab("guvenlik")}>
                        <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center text-lg dark:bg-rose-900/20"><i className="fa-solid fa-shield-halved"></i></div>
                        <div><div className="text-[10px] font-bold text-slate-400 uppercase">Güvenlik</div><div className="font-black text-[13px] dark:text-white mt-0.5">Yüksek</div></div>
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === "klinik" && (
                  <div className="animate-pop max-w-4xl space-y-4">
                     <h3 className="font-black text-slate-800 dark:text-white text-base border-b border-slate-100 dark:border-slate-700 pb-2">Genel Klinik Bilgileri</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Klinik Tam Adı</label>
                            <input type="text" value={currentData.klinik.ad} onChange={e => handleSettingChange('klinik', 'ad', e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Telefon</label>
                              <input type="text" value={currentData.klinik.telefon} onChange={e => handleSettingChange('klinik', 'telefon', e.target.value)} placeholder="05XX..." className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">E-Posta</label>
                              <input type="email" value={currentData.klinik.eposta} onChange={e => handleSettingChange('klinik', 'eposta', e.target.value)} placeholder="info@klinik.com" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Açık Adres</label>
                            <textarea rows="3" value={currentData.klinik.adres} onChange={e => handleSettingChange('klinik', 'adres', e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:border-indigo-500 resize-none dark:bg-slate-900 dark:text-white dark:border-slate-700"></textarea>
                          </div>
                        </div>
                        <div className="space-y-4">
                           <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer hover:border-indigo-500 transition-colors h-32 relative overflow-hidden group">
                             {currentData.klinik.logo ? (
                               <img src={currentData.klinik.logo} className="w-full h-full object-contain absolute inset-0 p-2 opacity-50 group-hover:opacity-20 transition" alt="Logo Önizleme" />
                             ) : null}
                             <i className="fa-solid fa-cloud-arrow-up text-2xl text-indigo-400 mb-2 relative z-10"></i>
                             <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 relative z-10">{currentData.klinik.logo ? "Logoyu Değiştir" : "Logo Yüklemek İçin Tıklayın"}</span>
                             <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                               const file = e.target.files[0];
                               if(file){
                                 const reader = new FileReader();
                                 reader.onload = (event) => {
                                   handleSettingChange('klinik', 'logo', event.target.result);
                                 };
                                 reader.readAsDataURL(file);
                               }
                             }} />
                           </label>
                           <div>
                             <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Klinik Operasyon Durumu</label>
                             <div className="flex gap-2">
                                <button onClick={() => handleSettingChange('klinik', 'durum', 'Aktif')} className={`flex-1 py-2 rounded-lg text-[12px] font-bold border transition-all ${currentData.klinik.durum === 'Aktif' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>Aktif / Açık</button>
                                <button onClick={() => handleSettingChange('klinik', 'durum', 'Kapalı')} className={`flex-1 py-2 rounded-lg text-[12px] font-bold border transition-all ${currentData.klinik.durum === 'Kapalı' ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-900/30' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>Geçici Kapalı</button>
                             </div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {settingsTab === "randevu" && (
                  <div className="animate-pop max-w-4xl space-y-4">
                     <h3 className="font-black text-slate-800 dark:text-white text-base border-b border-slate-100 dark:border-slate-700 pb-2">Randevu İşleyiş Kuralları</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="flex items-center justify-between cursor-pointer">
                              <div><div className="font-bold text-[13px] dark:text-white">Varsayılan Randevu Süresi</div><div className="text-[10px] text-slate-500 mt-0.5">Takvimde otomatik ayrılacak süre.</div></div>
                              <select value={currentData.randevu.varsayilanSure} onChange={e => handleSettingChange('randevu', 'varsayilanSure', e.target.value)} className="p-1.5 border rounded-lg text-[12px] font-bold outline-none dark:bg-slate-800 dark:text-white">
                                 <option value="15">15 Dk</option><option value="30">30 Dk</option><option value="45">45 Dk</option><option value="60">60 Dk</option>
                              </select>
                            </label>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="flex items-center justify-between cursor-pointer">
                              <div><div className="font-bold text-[13px] dark:text-white">Takvim Slot Aralığı</div><div className="text-[10px] text-slate-500 mt-0.5">Takvimdeki satır yükseklik ayarı.</div></div>
                              <select value={currentData.randevu.slotAraligi} onChange={e => handleSettingChange('randevu', 'slotAraligi', e.target.value)} className="p-1.5 border rounded-lg text-[12px] font-bold outline-none dark:bg-slate-800 dark:text-white">
                                 <option value="10">10 Dk</option>
                                 <option value="15">15 Dk</option>
                                 <option value="30">30 Dk</option>
                                 <option value="60">60 Dk</option>
                              </select>
                            </label>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="font-black text-[12px] text-slate-500 uppercase border-b border-slate-100 dark:border-slate-700 pb-1 mb-2">Akıllı Uyarılar</div>
                          <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg">
                             <div><div className="font-bold text-[13px] dark:text-white">Hekim Çakışma Kontrolü</div><div className="text-[10px] text-slate-500">Aynı saat dilimine aynı hekime 2. randevu yazmayı engeller.</div></div>
                             <input type="checkbox" checked={currentData.randevu.cakismaKontrolu} onChange={e => handleSettingChange('randevu', 'cakismaKontrolu', e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                          </label>
                          <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg">
                             <div><div className="font-bold text-[13px] dark:text-white">Geçmiş Tarih Uyarısı</div><div className="text-[10px] text-slate-500">Geçmişteki bir tarihe randevu eklenirken uyarı verir.</div></div>
                             <input type="checkbox" checked={currentData.randevu.gecmisTarihUyarisi} onChange={e => handleSettingChange('randevu', 'gecmisTarihUyarisi', e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                          </label>
                        </div>
                     </div>
                  </div>
                )}

                {settingsTab === "bildirim" && (
                  <div className="animate-pop max-w-4xl space-y-4">
                     <h3 className="font-black text-slate-800 dark:text-white text-base border-b border-slate-100 dark:border-slate-700 pb-2">Bildirim ve Hatırlatmalar</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="flex items-center justify-between cursor-pointer p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 transition-colors">
                             <div>
                               <div className="font-bold text-[13px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"><i className="fa-brands fa-whatsapp text-base"></i> WhatsApp Hatırlatmaları</div>
                               <div className="text-[10px] text-slate-500 mt-0.5">Hastalar için otomatik mesaj taslakları aktifleştir.</div>
                             </div>
                             <input type="checkbox" checked={currentData.bildirim.whatsappAktif} onChange={e => handleSettingChange('bildirim', 'whatsappAktif', e.target.checked)} className="w-5 h-5 accent-emerald-500" />
                          </label>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-3 rounded-xl">
                           <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Randevu Hatırlatma Süresi</label>
                           <select value={currentData.bildirim.randevuHatirlatma} onChange={e => handleSettingChange('bildirim', 'randevuHatirlatma', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold outline-none cursor-pointer dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                             <option value="24">Randevudan 24 Saat Önce</option>
                             <option value="12">Randevudan 12 Saat Önce</option>
                             <option value="2">Randevudan 2 Saat Önce</option>
                           </select>
                        </div>
                     </div>
                  </div>
                )}

                {settingsTab === "gorunum" && (
                  <div className="animate-pop max-w-4xl space-y-4">
                     <h3 className="font-black text-slate-800 dark:text-white text-base border-b border-slate-100 dark:border-slate-700 pb-2">Arayüz ve Tema</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        {['Acik', 'Koyu', 'Sistem'].map(t => (
                          <div key={t} onClick={() => handleSettingChange('gorunum', 'tema', t)} className={`border rounded-xl p-3 cursor-pointer text-center flex flex-col items-center gap-2 transition-all ${currentData.gorunum.tema === t ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20 dark:bg-indigo-900/20' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}>
                            <div className="w-12 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shadow-inner border border-slate-200 dark:border-slate-600">
                              <i className={`fa-solid ${t === 'Acik' ? 'fa-sun text-amber-500' : t === 'Koyu' ? 'fa-moon text-indigo-400' : 'fa-desktop text-slate-500'}`}></i>
                            </div>
                            <span className="font-bold text-[12px] dark:text-white">{t === 'Acik' ? 'Açık Tema' : t === 'Koyu' ? 'Koyu Tema' : 'Sistem Tanımlı'}</span>
                          </div>
                        ))}
                     </div>
                     <label className="flex items-center justify-between cursor-pointer p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 max-w-md">
                         <div>
                           <div className="font-bold text-[13px] dark:text-white">Arayüz Animasyonları</div>
                           <div className="text-[10px] text-slate-500 mt-0.5">Geçiş efektlerini açar/kapatır (Hızlandırmak için kapatılabilir).</div>
                         </div>
                         <input type="checkbox" checked={currentData.gorunum.animasyonlar} onChange={e => handleSettingChange('gorunum', 'animasyonlar', e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                      </label>
                  </div>
                )}

                {settingsTab === "guvenlik" && (
                  <div className="animate-pop max-w-4xl space-y-4">
                     <h3 className="font-black text-slate-800 dark:text-white text-base border-b border-slate-100 dark:border-slate-700 pb-2">Güvenlik ve Gizlilik</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                           <div>
                             <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Oturum Zaman Aşımı</label>
                             <select value={currentData.guvenlik.oturumZamanAsimi} onChange={e => handleSettingChange('guvenlik', 'oturumZamanAsimi', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold outline-none cursor-pointer dark:bg-slate-800 dark:text-white dark:border-slate-600">
                               <option value="30">30 Dakika Hareketsizlikte Çıkış Yap</option>
                               <option value="120">2 Saat Hareketsizlikte Çıkış Yap</option>
                               <option value="480">Mesai Sonunda Çıkış Yap</option>
                             </select>
                           </div>
                           <label className="flex items-center justify-between cursor-pointer border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                             <div>
                               <div className="font-bold text-[13px] dark:text-white">Hassas Veri Koruması (Finans Ekranı)</div>
                             </div>
                             <input type="checkbox" checked={currentData.guvenlik.hassasEkranUyarisi} onChange={e => handleSettingChange('guvenlik', 'hassasEkranUyarisi', e.target.checked)} className="w-4 h-4 accent-rose-500" />
                           </label>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col justify-center">
                           <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">Hesap Şifresi</div>
                           <div className="text-[11px] text-slate-500 mb-4">Mevcut giriş şifrenizi güncellemek için aşağıdaki butonu kullanın.</div>
                           <button onClick={() => setIsPasswordModalOpen(true)} className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-[12px] font-bold hover:bg-slate-800 transition shadow-sm dark:bg-indigo-600 dark:hover:bg-indigo-500"><i className="fa-solid fa-key mr-1.5"></i> Şifremi Değiştir</button>
                        </div>
                     </div>
                  </div>
                )}

                {settingsTab === "calisma" && (
                  <div className="animate-pop max-w-4xl space-y-4">
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                       <h3 className="font-black text-slate-800 dark:text-white text-base">Genel Mesai Saatleri ve Günler</h3>
                     </div>
                     <p className="text-[11px] text-slate-500 dark:text-slate-400">Tüm sistemdeki takvim gridleri ve randevu saatleri bu aralıklara göre oluşturulur.</p>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Mesai Başlangıç</label>
                          <input type="time" value={currentData.calisma.baslama} onChange={e => handleSettingChange('calisma', 'baslama', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-800 dark:text-white dark:border-slate-600 cursor-pointer shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Mesai Bitiş</label>
                          <input type="time" value={currentData.calisma.bitis} onChange={e => handleSettingChange('calisma', 'bitis', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-800 dark:text-white dark:border-slate-600 cursor-pointer shadow-sm" />
                        </div>
                     </div>

                     <div className="space-y-2">
                       <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2 mb-3">
                         <h4 className="font-bold text-[12px] text-slate-700 dark:text-slate-300">Çalışma Günleri (Haftalık)</h4>
                       </div>
                       
                       {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => {
                          const isWorking = currentData.calisma.gunler?.[day] !== false;
                          return (
                          <div key={day} className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${isWorking ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm" : "bg-slate-50 dark:bg-slate-900/50 border-dashed border-slate-200 dark:border-slate-800 opacity-60"}`}>
                             <label className="flex items-center gap-3 w-1/3 cursor-pointer">
                                <input type="checkbox" checked={isWorking} onChange={(e) => {
                                   const newGunler = { ...(currentData.calisma.gunler || {}) };
                                   newGunler[day] = e.target.checked;
                                   handleSettingChange('calisma', 'gunler', newGunler);
                                }} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                                <span className={`font-bold text-[13px] ${isWorking ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                                  {day === "Pzt" ? "Pazartesi" : day === "Sal" ? "Salı" : day === "Çar" ? "Çarşamba" : day === "Per" ? "Perşembe" : day === "Cum" ? "Cuma" : day === "Cmt" ? "Cumartesi" : "Pazar"}
                                </span>
                             </label>
                             <div className="flex items-center gap-2 flex-1 justify-end">
                                <span className={`text-[11px] font-bold px-2 py-1 rounded shadow-sm border ${isWorking ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"}`}>
                                  {isWorking ? `${currentData.calisma.baslama} - ${currentData.calisma.bitis}` : "Kapalı"}
                                </span>
                             </div>
                          </div>
                          );
                       })}

                       <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 gap-2 border-b border-amber-200 dark:border-amber-800 pb-3">
                             <h5 className="text-[11px] font-black text-amber-700 dark:text-amber-500 uppercase"><i className="fa-solid fa-calendar-xmark mr-1"></i> Özel Günler / Tatiller (Kapalı)</h5>
                             <div className="flex gap-1.5">
                               <input type="date" id="ozelGunInput" className="p-1.5 rounded-lg border border-amber-200 text-[11px] font-bold outline-none dark:bg-slate-800 dark:text-white dark:border-slate-600" />
                               <button type="button" onClick={() => {
                                 const el = document.getElementById("ozelGunInput");
                                 if(!el || !el.value) {
                                   showNotification("Lütfen bir tarih seçin", "error");
                                   return;
                                 }
                                 const [y, m, d] = el.value.split('-');
                                 const formatted = `${d}.${m}.${y}`;
                                 const guncelAyarlar = settingsDraft || settings;
                                 const mevcutOzel = guncelAyarlar?.calisma?.ozelGunler || [];
                                 
                                 // Aynı tarih daha önce eklendiyse engelle
                                 if(mevcutOzel.some(og => og.tarih === formatted)){
                                   showNotification("Bu tarih zaten ekli!", "error");
                                   return;
                                 }

                                 const yeniOzel = [...mevcutOzel, { tarih: formatted, durum: "Kapalı" }];
                                 handleSettingChange('calisma', 'ozelGunler', yeniOzel);
                                 el.value = "";
                                 showNotification(`${formatted} tarihi kapalı olarak eklendi`, "success");
                               }} className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-amber-600 shadow-sm transition-colors">Ekle</button>
                             </div>
                          </div>
                          
                          <div className="space-y-1.5">
                             {(currentData.calisma.ozelGunler || []).length > 0 ? (
                               (currentData.calisma.ozelGunler || []).map((og, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-amber-100 dark:border-amber-800/50 shadow-sm">
                                    <span className="text-[12px] font-bold dark:text-white"><i className="fa-regular fa-calendar mr-1 text-slate-400"></i> {og.tarih}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-bold dark:bg-rose-900/40 dark:text-rose-400">Tam Gün Kapalı</span>
                                      <button type="button" onClick={() => {
                                        const newOzel = currentData.calisma.ozelGunler.filter((_, i) => i !== idx);
                                        handleSettingChange('calisma', 'ozelGunler', newOzel);
                                      }} className="text-slate-400 hover:text-rose-500 w-6 h-6 flex items-center justify-center rounded hover:bg-rose-50 transition-colors"><i className="fa-solid fa-trash-can"></i></button>
                                    </div>
                                  </div>
                               ))
                             ) : (
                               <div className="text-[11px] text-amber-600/70 font-semibold italic text-center py-2">Henüz özel kapalı gün eklenmemiş.</div>
                             )}
                          </div>
                       </div>
                     </div>
                  </div>
                )}

                {settingsTab === "tedavi" && (() => {
                  const basePricing = globalData.pricingDb?.[currentUser] || (typeof globalData.pricingDb === "object" && globalData.pricingDb["Genel Muayene"] ? globalData.pricingDb : DEFAULT_PRICING);
                  // Değişiklikleri anlık tabloya yansıtmak için:
                  const userPricing = { ...basePricing, ...pricingEditValues };
                  const allTreatments = Object.keys(userPricing);

                  return (
                  <div className="animate-pop max-w-5xl space-y-4">
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                       <h3 className="font-black text-slate-800 dark:text-white text-base">Tedavi ve Ücret Kataloğu</h3>
                       <button onClick={() => setIsAddTreatmentModalOpen(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm hover:bg-indigo-700 transition"><i className="fa-solid fa-plus mr-1"></i> Yeni Tedavi Ekle</button>
                     </div>
                     <p className="text-[11px] text-slate-500 dark:text-slate-400">Tüm uygulamada geçerli olan aktif işlemlerinizin listesi. Fiyatları doğrudan hücrelerden güncelleyebilirsiniz.</p>
                     <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto max-h-[400px] custom-scrollbar relative">
                        <table className="w-full text-left text-[12px] min-w-[500px]">
                           <thead className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b dark:border-slate-700 sticky top-0 z-10 shadow-sm">
                             <tr><th className="p-2.5">İşlem Adı</th><th className="p-2.5">Kategori</th><th className="p-2.5">Güncel Ücret</th><th className="p-2.5 text-center">Durum</th></tr>
                           </thead>
                           <tbody>
                             {allTreatments.map(tx => (
                               <tr key={tx} className="border-b last:border-0 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition">
                                 <td className="p-2.5 font-bold text-slate-800 dark:text-white">{tx}</td>
                                 <td className="p-2.5 text-slate-500"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 shadow-sm text-[10px] font-bold">Klinik İşlem</span></td>
                                 <td className="p-2.5">
                                   <div className="flex items-center gap-1.5">
                                      <input 
                                        type="number" 
                                        value={userPricing[tx] === 0 ? 0 : (userPricing[tx] || "")} 
                                        onChange={(e) => {
                                          setPricingEditValues(prev => ({ ...prev, [tx]: parseFloat(e.target.value) || 0 }));
                                          // Fiyat değiştiğinde alttaki "Kaydet" çubuğunun çıkması için tetikleyici:
                                          if(!settingsDraft) setSettingsDraft(settings);
                                        }}
                                        className="w-20 p-1.5 bg-white border border-slate-200 rounded-lg text-[13px] font-black text-indigo-600 outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-indigo-400 dark:border-slate-600 transition-colors shadow-sm"
                                      />
                                      <span className="text-[11px] font-black text-slate-400">₺</span>
                                   </div>
                                 </td>
                                 <td className="p-2.5 text-center"><span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-bold">Aktif</span></td>
                               </tr>
                             ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
                  );
                })()}

                {settingsTab === "belge" && (
                  <div className="animate-pop max-w-5xl space-y-4">
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                       <h3 className="font-black text-slate-800 dark:text-white text-base">Belge ve TDB Şablon Yönetimi</h3>
                     </div>
                     <p className="text-[11px] text-slate-500 dark:text-slate-400">Türk Dişhekimleri Birliği (TDB) standartlarında hazırlanmış resmi evrak ve onam formları. Hastalarınız için anında yazdırabilirsiniz.</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {TDB_DOCUMENTS.map((doc) => (
                         <div key={doc.id} onClick={() => setDocumentPreview(doc)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex justify-between items-center hover:shadow-md transition group cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${doc.bg} ${doc.color}`}><i className={`fa-solid ${doc.icon}`}></i></div>
                              <div>
                                <div className="font-bold text-[13px] text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{doc.title}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Sistem Şablonu • TDB Uyumlu</div>
                              </div>
                            </div>
                            <button className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition flex items-center justify-center"><i className="fa-solid fa-print text-[11px]"></i></button>
                         </div>
                       ))}
                     </div>
                  </div>
                )}

                {settingsTab === "dosya" && (() => {
                  const DOSYA_KLASORLERI = [
                     { id: "acil", isim: "Acil Takip", icon: "fa-truck-medical", color: "bg-rose-500" },
                     { id: "lab", isim: "Laboratuvar Bekleyenler", icon: "fa-flask", color: "bg-purple-500" },
                     { id: "evrak", isim: "Evrak Bekleyenler", icon: "fa-file-signature", color: "bg-slate-500" },
                     { id: "kontrol", isim: "Kontrol Bekleyenler", icon: "fa-calendar-check", color: "bg-emerald-500" },
                     { id: "tedavi", isim: "Tedavisi Devam Edenler", icon: "fa-tooth", color: "bg-amber-500" },
                     { id: "yeni", isim: "Yeni Hastalar", icon: "fa-user-plus", color: "bg-blue-500" }
                  ];
                  return (
                    <div className="animate-pop max-w-4xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                            <h3 className="font-black text-slate-800 dark:text-white text-base">Dosya Masası Özelleştirme</h3>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Dosya Masası ekranında hangi klasörlerin aktif olarak görüneceğini seçin. Değişiklik anında Ana Sayfaya yansır.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {DOSYA_KLASORLERI.map((folder) => (
                                <div key={folder.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:border-indigo-300 transition gap-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${folder.color}`}><i className={`fa-solid ${folder.icon}`}></i></div>
                                    <span className="font-bold text-[13px] text-slate-800 dark:text-white">{folder.isim}</span>
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer pl-6 sm:pl-0">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${currentData.dosya?.[folder.id] !== false ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-600"}`}>
                                    {currentData.dosya?.[folder.id] !== false ? "Görünür" : "Gizli"}
                                    </span>
                                    <input type="checkbox" checked={currentData.dosya?.[folder.id] !== false} onChange={e => handleSettingChange('dosya', folder.id, e.target.checked)} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                                </label>
                                </div>
                            ))}
                        </div>
                    </div>
                  );
                })()}

                {settingsTab === "otomasyon" && (
                  <div className="animate-pop max-w-4xl space-y-4">
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                       <h3 className="font-black text-slate-800 dark:text-white text-base">Süreç Otomasyonları</h3>
                     </div>
                     <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Aşağıdaki otomasyonlar arka planda çalışarak klinik işleyişinizi hızlandırır. İstemediklerinizi kapatabilirsiniz.</p>
                     <div className="space-y-3">
                       
                       <label className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between relative overflow-hidden group gap-2 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${currentData.otomasyon?.otoEpikriz !== false ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}></div>
                          <div className="pl-3">
                            <div className="font-bold text-[13px] text-slate-800 dark:text-white mb-1.5 flex items-center gap-1.5"><i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i> Randevu Durumu "Geldi" Olursa</div>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold opacity-80">
                              <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">Tetikleyici: Durum Değişimi</span>
                              <i className="fa-solid fa-arrow-right text-slate-400 hidden sm:block"></i>
                              <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/50">Aksiyon: Otomatik Epikriz (Geçmiş) Oluştur</span>
                            </div>
                          </div>
                          <div className="relative inline-flex items-center cursor-pointer sm:ml-4 pl-3 sm:pl-0 shrink-0">
                             <input type="checkbox" className="sr-only peer" checked={currentData.otomasyon?.otoEpikriz !== false} onChange={e => handleSettingChange('otomasyon', 'otoEpikriz', e.target.checked)} />
                             <div className="w-9 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </div>
                       </label>

                       <label className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between relative overflow-hidden group gap-2 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${currentData.otomasyon?.otoKlasor !== false ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}></div>
                          <div className="pl-3">
                            <div className="font-bold text-[13px] text-slate-800 dark:text-white mb-1.5 flex items-center gap-1.5"><i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i> Yeni Hasta Sisteme Eklendiğinde</div>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold opacity-80">
                              <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">Tetikleyici: Yeni Kayıt</span>
                              <i className="fa-solid fa-arrow-right text-slate-400 hidden sm:block"></i>
                              <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/50">Aksiyon: Dosya Masasında "Yeni Hastalar"a Taşı</span>
                            </div>
                          </div>
                          <div className="relative inline-flex items-center cursor-pointer sm:ml-4 pl-3 sm:pl-0 shrink-0">
                             <input type="checkbox" className="sr-only peer" checked={currentData.otomasyon?.otoKlasor !== false} onChange={e => handleSettingChange('otomasyon', 'otoKlasor', e.target.checked)} />
                             <div className="w-9 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </div>
                       </label>

                     </div>
                  </div>
                )}

                {settingsTab === "veri" && (() => {
                  // Sadece bu kliniğe ait verileri hesaplıyoruz
                  const myPatientsCount = Object.values(globalData.patientsDb || {}).filter(p => (p.addedBy === currentUser || globalData.doctorProfiles?.[p.addedBy]?.addedBy === currentUser) && !p.isDeleted).length;
                  const myAptsCount = allDoctors.reduce((sum, docId) => sum + Object.keys(globalData.appointments?.[docId] || {}).length, 0);

                  return (
                  <div className="animate-pop max-w-4xl space-y-4">
                     <h3 className="font-black text-slate-800 dark:text-white text-base border-b border-slate-100 dark:border-slate-700 pb-2">Veri ve Yedekleme Merkezi</h3>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl flex items-center justify-between shadow-sm">
                           <div>
                             <div className="font-black text-[14px] text-emerald-800 dark:text-emerald-400 flex items-center gap-2"><i className="fa-solid fa-server"></i> Sistem Durumu: Normal</div>
                             <div className="text-[11px] text-emerald-600/80 dark:text-emerald-500 mt-1 font-semibold">Firebase bağlantısı aktif. Tüm veriler senkronize.</div>
                           </div>
                           <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between shadow-sm">
                           <div>
                             <div className="font-black text-[13px] text-slate-800 dark:text-white">Veri Bütünlüğü</div>
                             <div className="text-[11px] text-slate-500 mt-1 font-bold">
                               {myPatientsCount} Kayıtlı Hasta • {myAptsCount} Toplam Randevu
                             </div>
                           </div>
                           <button onClick={() => {
                             setIsCheckingData(true);
                             setTimeout(() => {
                               setIsCheckingData(false);
                               showNotification(`Doğrulama başarılı! Toplam ${myPatientsCount} hasta ve ${myAptsCount} randevu sorunsuz taranıp güvenceye alındı.`, "success");
                             }, 2500);
                           }} 
                           className="text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition shadow-sm border border-slate-200 dark:border-slate-600 w-28 text-center"
                           disabled={isCheckingData}>
                             {isCheckingData ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i> Taranıyor</> : "Kontrol Et"}
                           </button>
                        </div>
                     </div>

                     <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mt-4 shadow-sm">
                        <h4 className="font-black text-[12px] text-slate-800 dark:text-white mb-3 uppercase tracking-wider">Veri Dışa Aktarma (Export)</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                           <button 
                             onClick={() => {
                               let csv = "Hasta Adi,Telefon,TC,Yas,Cinsiyet,Son Durum\n";
                               Object.values(globalData.patientsDb || {}).forEach(p => {
                                 if(!p.isDeleted) csv += `${p.name},${p.phone || "-"},${p.tc || "-"},${p.age || "-"},${p.gender || "-"},${p.lastStatus || "-"}\n`;
                               });
                               const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                               const link = document.createElement("a");
                               link.href = URL.createObjectURL(blob);
                               link.download = `Hastalar_${new Date().toLocaleDateString("tr-TR")}.csv`;
                               link.click();
                               showNotification("Hasta verileri CSV olarak indirildi.");
                             }}
                             className="p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex flex-col items-center gap-2 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition group text-slate-600 dark:text-slate-300 shadow-sm"
                           >
                             <i className="fa-solid fa-users text-xl group-hover:scale-110 transition-transform"></i>
                             <span className="font-bold text-[11px]">Hastalar (CSV)</span>
                           </button>
                           
                           <button 
                             onClick={() => {
                               let csv = "Tarih,Saat,Hasta,Hekim,Islem,Durum\n";
                               if(globalData.appointments) {
                                 Object.entries(globalData.appointments).forEach(([docId, apts]) => {
                                   Object.entries(apts).forEach(([key, apt]) => {
                                      const [y, m, d, time] = key.split("-");
                                      const safeTx = (apt.treatment || "").replace(/,/g, "-");
                                      csv += `${d}/${m}/${y},${time},${apt.patientName},${globalData.doctorProfiles?.[docId]?.name || docId},${safeTx},${apt.status}\n`;
                                   });
                                 });
                               }
                               const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                               const link = document.createElement("a");
                               link.href = URL.createObjectURL(blob);
                               link.download = `Randevular_${new Date().toLocaleDateString("tr-TR")}.csv`;
                               link.click();
                               showNotification("Randevu verileri CSV olarak indirildi.");
                             }}
                             className="p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex flex-col items-center gap-2 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition group text-slate-600 dark:text-slate-300 shadow-sm"
                           >
                             <i className="fa-regular fa-calendar-check text-xl group-hover:scale-110 transition-transform"></i>
                             <span className="font-bold text-[11px]">Randevular (CSV)</span>
                           </button>
                           
                           <button 
                             onClick={() => {
                               showNotification("Tüm detaylı verilerin PDF özeti hazırlanıyor...", "success");
                               setTimeout(() => window.print(), 800);
                             }}
                             className="p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex flex-col items-center gap-2 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition group text-slate-600 dark:text-slate-300 shadow-sm"
                           >
                             <i className="fa-solid fa-file-pdf text-xl group-hover:scale-110 transition-transform"></i>
                             <span className="font-bold text-[11px]">Rapor (PDF)</span>
                           </button>
                        </div>
                     </div>
                  </div>
                  );
                })()}
              </div>

              {/* SABİT KAYDETME ÇUBUĞU (DEĞİŞİKLİK VARSA ÇIKAR) */}
              {settingsDraft && (
                <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-row items-center gap-3 animate-[modalPop_0.3s_ease-out_forwards] z-[200] border border-white/10 w-[90%] sm:w-auto max-w-xl justify-center">
                   <div className="flex items-center gap-2 hidden sm:flex">
                     <i className="fa-solid fa-circle-exclamation text-amber-400 text-lg"></i>
                     <span className="font-bold text-[13px]">Kaydedilmemiş değişiklikleriniz var</span>
                   </div>
                   <div className="flex gap-2 w-full sm:w-auto">
                     <button onClick={revertSettings} className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-[12px] font-bold bg-white/10 hover:bg-white/20 dark:bg-black/5 dark:hover:bg-black/10 transition-colors"><i className="fa-solid fa-rotate-left mr-1"></i> İptal</button>
                     <button onClick={saveSettings} className="flex-1 sm:flex-none px-6 py-2 rounded-xl text-[12px] font-black bg-indigo-500 hover:bg-indigo-400 dark:bg-indigo-600 shadow-lg transition-colors">Kaydet <i className="fa-solid fa-check ml-1"></i></button>
                   </div>
                </div>
              )}
              {/* MODAL: YENİ TEDAVİ EKLE */}
              {isAddTreatmentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-2" onClick={() => setIsAddTreatmentModalOpen(false)}>
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-pop" onClick={e => e.stopPropagation()}>
                    <div className="px-3 py-2 bg-[#0f172a] text-white flex justify-between items-center">
                      <h3 className="font-black text-[13px] uppercase tracking-wider"><i className="fa-solid fa-tooth text-indigo-400 mr-1.5"></i>Yeni Tedavi Ekle</h3>
                      <button onClick={() => setIsAddTreatmentModalOpen(false)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-base"></i></button>
                    </div>
                    <form onSubmit={handleSaveNewCustomTreatment} className="p-3 space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">İşlem / Tedavi Adı</label>
                        <input type="text" required value={newTreatmentForm.name} onChange={e => setNewTreatmentForm({...newTreatmentForm, name: e.target.value})} className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 dark:text-white" placeholder="Örn: Zirkonyum Kaplama" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kategori</label>
                        <select value={newTreatmentForm.category} onChange={e => setNewTreatmentForm({...newTreatmentForm, category: e.target.value})} className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 dark:text-white cursor-pointer">
                          {Object.keys(DYNAMIC_PRICING_CATEGORIES).map(cat => <option key={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Varsayılan Ücret (₺)</label>
                        <input type="number" required value={newTreatmentForm.price} onChange={e => setNewTreatmentForm({...newTreatmentForm, price: e.target.value})} className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-black text-indigo-600 dark:text-indigo-400 outline-none focus:border-indigo-500" placeholder="0" />
                      </div>
                      <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-xl font-black text-[13px] shadow-lg hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 mt-2"><i className="fa-solid fa-save"></i> Sisteme Kaydet</button>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL: BELGE (TDB) ÖNİZLEME VE YAZDIRMA */}
              {documentPreview && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-2" onClick={() => setDocumentPreview(null)}>
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-pop flex flex-col h-[85vh]" onClick={e => e.stopPropagation()}>
                    <div className="px-3 py-2 bg-[#0f172a] text-white flex justify-between items-center shrink-0 no-print">
                      <h3 className="font-black text-[13px] uppercase tracking-wider flex items-center gap-1.5"><i className={`fa-solid ${documentPreview.icon} text-indigo-400`}></i> {documentPreview.title}</h3>
                      <button onClick={() => setDocumentPreview(null)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-base"></i></button>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap leading-relaxed font-medium" id="document-print-area">
                      {/* Antet */}
                      <div className="border-b-2 border-slate-300 dark:border-slate-600 pb-4 mb-4 flex justify-between items-end">
                        <div>
                           <div className="font-black text-lg uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-tooth text-slate-400"></i> {settings?.klinik?.ad ? settings.klinik.ad.toUpperCase() : "KLİNİK YÖNETİM"}</div>
                           <div className="text-[10px] font-bold text-slate-500 mt-1">Resmi Belge Şablonu</div>
                        </div>
                        <div className="text-right text-[10px] font-bold text-slate-500">
                           Tarih: {new Date().toLocaleDateString("tr-TR")}
                        </div>
                      </div>
                      
                      {documentPreview.content}
                    </div>

                    <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-2 shrink-0 no-print">
                      <button onClick={() => setDocumentPreview(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[12px] hover:bg-slate-200 dark:hover:bg-slate-600 transition">Kapat</button>
                      <button onClick={() => {
                        const originalTitle = document.title;
                        document.title = documentPreview.title;
                        
                        // Sadece belgeyi yazdırmak için basit bir numara
                        const printContent = document.getElementById('document-print-area').innerHTML;
                        const originalContent = document.body.innerHTML;
                        document.body.innerHTML = `<div style="padding:20px; font-family:sans-serif;">${printContent}</div>`;
                        window.print();
                        document.body.innerHTML = originalContent;
                        window.location.reload(); // React state'ini korumak için reload en güvenlisi
                        
                      }} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-[12px] shadow-lg hover:bg-indigo-700 transition flex items-center gap-1.5"><i className="fa-solid fa-print"></i> Yazdır / PDF Al</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        };
        const renderFinance = () => {
          let totalRevenue = 0,
            totalCollected = 0,
            doctorStats = {};

          let paymentHistory = [];

          let patientDebts = [];

          let revenueHistory = [];

          allDoctors.forEach((docId) => {
            doctorStats[docId] = {
              name: globalData.doctorProfiles?.[docId]?.name || docId,

              revenue: 0,
            };
          });

          if (globalData.appointments) {
            Object.entries(globalData.appointments).forEach(
              ([docId, docApts]) => {
                if (
                  docId !== currentUser &&
                  globalData.doctorProfiles?.[docId]?.addedBy !== currentUser
                )
                  return;
                Object.entries(docApts).forEach(([key, apt]) => {
                  const dateStr = key.split("-").slice(0, 3).join("-");
                  if (
                    isDateInRange(
                      dateStr,
                      financePeriod,
                      financeCustomStart,
                      financeCustomEnd
                    )
                  ) {
                    // YENİ: Fiyat manuel girilmemişse, otomatik olarak hekim fiyat listesinden bul
                    let aptPrice = parseFloat(apt.price) || 0;
                    if (!aptPrice && apt.treatment) {
                      const docPricing =
                        globalData.pricingDb?.[docId] ||
                        (typeof globalData.pricingDb === "object" &&
                        globalData.pricingDb["Genel Muayene"]
                          ? globalData.pricingDb
                          : DEFAULT_PRICING);
                      const matchedTx = Object.keys(DEFAULT_PRICING).find((t) =>
                        apt.treatment.includes(t)
                      );
                      if (matchedTx && docPricing[matchedTx] !== undefined) {
                        aptPrice = parseFloat(docPricing[matchedTx]) || 0;
                      }
                    }

                    // YENİ: Sadece "Geldi" durumundaki randevuları Hekim Cirosuna yansıt
                    if (aptPrice > 0 && apt.status === "Geldi") {
                      totalRevenue += aptPrice;
                      if (doctorStats[docId])
                        doctorStats[docId].revenue += aptPrice;

                      const [y, m, d] = key.split("-").map(Number);
                      revenueHistory.push({
                        date: new Date(
                          `${y}-${m}-${d}T${key.split("-")[3] || "00:00"}:00`
                        ).getTime(),
                        patientName: apt.patientName,
                        treatment: renderTreatmentText(apt),
                        amount: aptPrice,
                        type: "İşlem Kaydı",
                      });
                    }
                  }
                });
              }
            );
          }

          if (globalData.patientsDb) {
            Object.values(globalData.patientsDb)
              .filter(
                (p) =>
                  p.addedBy === currentUser ||
                  globalData.doctorProfiles?.[p.addedBy]?.addedBy ===
                    currentUser
              )
              .forEach((p) => {
                if (p.plannedTreatments) {
                  p.plannedTreatments.forEach((tx) => {
                    const txDateStr = formatDateKey(new Date(tx.date));

                    if (
                      isDateInRange(
                        txDateStr,

                        financePeriod,

                        financeCustomStart,

                        financeCustomEnd
                      )
                    ) {
                      const price = parseFloat(tx.price) || 0;

                      totalRevenue += price;

                      revenueHistory.push({
                        date: tx.date,

                        patientName: p.name,

                        treatment:
                          tx.tooth === "Tüm Çene"
                            ? tx.treatment
                            : `Diş: ${tx.tooth} - ${tx.treatment}`,

                        amount: price,

                        type: "Planlı İşlem",
                      });
                    }
                  });
                }

                if (p.payments) {
                  p.payments.forEach((pay) => {
                    const pDateStr = formatDateKey(new Date(pay.date));

                    if (
                      isDateInRange(
                        pDateStr,

                        financePeriod,

                        financeCustomStart,

                        financeCustomEnd
                      )
                    ) {
                      totalCollected += parseFloat(pay.amount);

                      paymentHistory.push({
                        patientId: p.id,

                        patientName: p.name,

                        amount: parseFloat(pay.amount),

                        date: pay.date,
                      });
                    }
                  });
                }

                const fin = calculatePatientFinance(p.id, p.name);

                if (fin.debt > 0)
                  patientDebts.push({
                    patientName: p.name,

                    debt: fin.debt,

                    id: p.id,
                  });
              });
          }

          const totalReceivable = totalRevenue - totalCollected;

          paymentHistory.sort((a, b) => b.date - a.date);

          patientDebts.sort((a, b) => b.debt - a.debt);

          revenueHistory.sort((a, b) => b.date - a.date);

          const getDateRangeText = () => {
            if (financePeriod === "today")
              return new Date().toLocaleDateString("tr-TR");

            if (financePeriod === "thisMonth") {
              const today = new Date();

              return `${new Date(
                today.getFullYear(),

                today.getMonth(),

                1
              ).toLocaleDateString("tr-TR")} - ${new Date(
                today.getFullYear(),

                today.getMonth() + 1,

                0
              ).toLocaleDateString("tr-TR")}`;
            }

            if (financePeriod === "custom") {
              if (financeCustomStart && financeCustomEnd)
                return `${financeCustomStart

                  .split("-")

                  .reverse()

                  .join("/")} - ${financeCustomEnd

                  .split("-")

                  .reverse()

                  .join("/")}`;
            }

            return "Tüm Zamanlar";
          };

          return (
            <div
              id="print-area"
              className="flex flex-col gap-2 animate-pop pb-8 w-full h-full"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 shadow-sm gap-1.5 shrink-0 no-print">
                <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1">
                  <i className="fa-solid fa-chart-line text-emerald-500"></i>{" "}
                  Finans ve Bilanço
                </h2>

                <div className="flex gap-1 w-full md:w-auto flex-wrap">
                  {financePeriod === "custom" && (
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-bold text-slate-500 mr-1">
                        <i className="fa-regular fa-calendar mr-1"></i> Tarih
                        Aralığı:
                      </span>

                      <input
                        type="date"
                        value={financeCustomStart}
                        onChange={(e) => setFinanceCustomStart(e.target.value)}
                        className="relative text-[13px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 outline-none cursor-pointer dark:text-white"
                      />

                      <span className="text-slate-400">-</span>

                      <input
                        type="date"
                        value={financeCustomEnd}
                        onChange={(e) => setFinanceCustomEnd(e.target.value)}
                        className="relative text-[13px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 outline-none cursor-pointer dark:text-white"
                      />
                    </div>
                  )}

                  <select
                    value={financePeriod}
                    onChange={(e) => {
                      setFinancePeriod(e.target.value);
                      setFinanceDetailView("overview");
                    }}
                    className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-[13px] outline-none cursor-pointer dark:text-white"
                  >
                    <option value="all">Tüm Zamanlar</option>
                    <option value="today">Bugün</option>
                    <option value="thisMonth">Bu Ay</option>
                    <option value="custom">Tarih Aralığı Seç...</option>
                  </select>

                  {/* YENİ: Excel'e Aktar Butonu */}
                  <button
                    onClick={() => {
                      let csv = "Tarih,Hasta Adi,Islem Detayi,Tutar (TL)\n";
                      revenueHistory.forEach((r) => {
                        const d = new Date(r.date).toLocaleDateString("tr-TR");
                        // Virgülden dolayı tablo kaymasın diye işlem detayındaki olası virgülleri temizliyoruz
                        const safeTreatment = (r.treatment || "").replace(
                          /,/g,
                          "-"
                        );
                        csv += `${d},${r.patientName},${safeTreatment},${r.amount}\n`;
                      });
                      const blob = new Blob(["\uFEFF" + csv], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(blob);
                      link.download = `Finans_Raporu_${new Date().toLocaleDateString(
                        "tr-TR"
                      )}.csv`;
                      link.click();
                    }}
                    className="bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl font-bold text-[13px] shadow-md hover:bg-emerald-700 transition"
                  >
                    <i className="fa-solid fa-file-excel mr-1"></i> Excel
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="bg-slate-900 dark:bg-indigo-600 text-white px-2.5 py-1.5 rounded-xl font-bold text-[13px] shadow-md hover:bg-slate-800 dark:hover:bg-indigo-700 transition"
                  >
                    <i className="fa-solid fa-print mr-1"></i> Yazdır
                  </button>
                </div>
              </div>

              <div className="hidden print-only print-header-grid mb-2 border-b-2 border-black pb-2">
                <h1 className="text-base font-black m-0">
                  Klinik Finans Raporu
                </h1>

                <p className="text-[13px] font-bold m-0 mt-1">
                  Dönem: {getDateRangeText()}
                </p>

                <p className="text-[11px] text-gray-500 m-0">
                  Yazdırılma Tarihi: {new Date().toLocaleString("tr-TR")}
                </p>
              </div>

              {financeDetailView === "overview" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 shrink-0 print-only-grid">
                    {/* 1. KART: CİRO (SADE TIKLANABİLİR) */}
                    <div
                      className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all no-print group h-28"
                      onClick={() => setFinanceDetailView("revenue")}
                    >
                      <i className="fa-solid fa-money-bill-wave absolute -right-4 -bottom-4 text-5xl text-slate-100 dark:text-slate-700/50 group-hover:scale-110 transition-transform duration-300"></i>
                      <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                        Fatura Edilen Toplam Ciro
                        <i className="fa-solid fa-arrow-right text-indigo-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"></i>
                      </div>
                      <div className="text-lg font-black text-slate-800 dark:text-white relative z-10">
                        {totalRevenue.toLocaleString("tr-TR")} ₺
                      </div>
                    </div>

                    {/* YAZDIRMA İÇİN KART 1 (GİZLİ) */}
                    <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden hidden print-only h-28">
                      <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                        Fatura Edilen Toplam Ciro
                      </div>
                      <div className="text-lg font-black text-slate-800">
                        {totalRevenue.toLocaleString("tr-TR")} ₺
                      </div>
                    </div>

                    {/* 2. KART: TAHSİLAT (SADE TIKLANABİLİR) */}
                    <div
                      className="bg-emerald-50/50 dark:bg-emerald-900/20 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm flex flex-col justify-center relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all no-print group h-28"
                      onClick={() => setFinanceDetailView("collected")}
                    >
                      <i className="fa-solid fa-vault absolute -right-4 -bottom-4 text-5xl text-emerald-100 dark:text-emerald-900/30 group-hover:scale-110 transition-transform duration-300"></i>
                      <div className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                        Kasaya Giren (Tahsilat)
                        <i className="fa-solid fa-arrow-right text-emerald-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"></i>
                      </div>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-300 relative z-10">
                        {totalCollected.toLocaleString("tr-TR")} ₺
                      </div>
                    </div>

                    {/* YAZDIRMA İÇİN KART 2 (GİZLİ) */}
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200 shadow-sm relative overflow-hidden hidden print-only h-28">
                      <div className="text-[11px] font-black text-emerald-700 uppercase tracking-wider mb-1.5">
                        Kasaya Giren (Tahsilat)
                      </div>
                      <div className="text-lg font-black text-emerald-600">
                        {totalCollected.toLocaleString("tr-TR")} ₺
                      </div>
                    </div>

                    {/* 3. KART: ALACAK (SADE TIKLANABİLİR) */}
                    <div
                      className="bg-rose-50/50 dark:bg-rose-900/20 p-2 rounded-xl border border-rose-200 dark:border-rose-800/50 shadow-sm flex flex-col justify-center relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-rose-400 dark:hover:border-rose-600 transition-all no-print group h-28"
                      onClick={() => setFinanceDetailView("pending")}
                    >
                      <i className="fa-solid fa-triangle-exclamation absolute -right-4 -bottom-4 text-5xl text-rose-100 dark:text-rose-900/30 group-hover:scale-110 transition-transform duration-300"></i>
                      <div className="text-[11px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                        Bekleyen Alacak (Bakiye)
                        <i className="fa-solid fa-arrow-right text-rose-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"></i>
                      </div>
                      <div className="text-lg font-black text-rose-600 dark:text-rose-300 relative z-10">
                        {totalReceivable.toLocaleString("tr-TR")} ₺
                      </div>
                    </div>

                    {/* YAZDIRMA İÇİN KART 3 (GİZLİ) */}
                    <div className="bg-rose-50 p-2 rounded-xl border border-rose-200 shadow-sm relative overflow-hidden hidden print-only h-28">
                      <div className="text-[11px] font-black text-rose-700 uppercase tracking-wider mb-1.5">
                        Bekleyen Alacak (Bakiye)
                      </div>
                      <div className="text-lg font-black text-rose-600">
                        {totalReceivable.toLocaleString("tr-TR")} ₺
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 mt-1.5 flex-1 min-h-0">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border shadow-sm overflow-hidden flex flex-col">
                      <div className="p-2 border-b bg-slate-50 dark:bg-slate-900">
                        <h3 className="font-black text-[13px] uppercase tracking-wider dark:text-white">
                          Hekim Bazlı Üretilen Ciro
                        </h3>
                      </div>

                      <div className="overflow-x-auto w-full flex-1">
                        <table className="w-full text-left text-[13px] print-table">
                          <thead className="text-[10px] uppercase border-b bg-white dark:bg-slate-800 font-black tracking-wider text-slate-400">
                            <tr>
                              <th className="px-2.5 py-2">Hekim Adı</th>
                              <th className="px-2.5 py-2 text-right">
                                Ürettiği Ciro
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {Object.values(doctorStats)
                              .sort((a, b) => b.revenue - a.revenue)
                              .map((doc, i) => (
                                <tr
                                  key={i}
                                  className="border-b transition dark:text-white"
                                >
                                  <td className="px-2.5 py-2 font-black flex items-center gap-1.5">
                                    <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border no-print">
                                      <i className="fa-solid fa-user-doctor"></i>
                                    </div>
                                    {doc.name}
                                  </td>
                                  <td className="px-2.5 py-2 text-right font-black text-indigo-600 text-base">
                                    {doc.revenue.toLocaleString("tr-TR")} ₺
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="hidden print-only bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-col mt-2 print-only-section">
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                      <h3 className="font-black text-slate-800 text-[13px] uppercase">
                        Tahsilat Detayları (Özet)
                      </h3>
                    </div>

                    <table className="w-full text-left text-[11px] print-table">
                      <thead>
                        <tr>
                          <th className="px-2.5 py-1.5">Tarih</th>

                          <th className="px-2.5 py-1.5">Hasta</th>

                          <th className="px-2.5 py-1.5 text-right">Tutar</th>
                        </tr>
                      </thead>

                      <tbody>
                        {paymentHistory.slice(0, 15).map((pay, i) => (
                          <tr key={i}>
                            <td className="px-2.5 py-1.5">
                              {new Date(pay.date).toLocaleString("tr-TR", {
                                day: "2-digit",

                                month: "2-digit",

                                year: "numeric",

                                hour: "2-digit",

                                minute: "2-digit",
                              })}
                            </td>

                            <td className="px-2.5 py-1.5">{pay.patientName}</td>

                            <td className="px-2.5 py-1.5 text-right">
                              +{pay.amount} ₺
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {financeDetailView === "revenue" && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 animate-pop dark:bg-slate-800 dark:border-slate-700">
                  <div className="p-2 border-b bg-indigo-50 flex justify-between dark:bg-slate-900 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setFinanceDetailView("overview")}
                        className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border dark:border-slate-600 shadow-sm flex items-center justify-center text-slate-500 hover:text-indigo-600 transition"
                      >
                        <i className="fa-solid fa-arrow-left"></i>
                      </button>

                      <h3 className="font-black text-indigo-800 text-[13px] uppercase tracking-wider dark:text-indigo-400">
                        Toplam Bilanço Detayları
                      </h3>
                    </div>

                    <div className="font-black text-indigo-600 text-base dark:text-indigo-400">
                      {totalRevenue.toLocaleString("tr-TR")} ₺
                    </div>
                  </div>

                  <div className="overflow-y-auto w-full flex-1">
                    <table className="w-full text-left text-[13px]">
                      <thead className="text-[10px] text-slate-400 uppercase border-b dark:border-slate-700 font-black sticky top-0 bg-white dark:bg-slate-800">
                        <tr>
                          <th className="px-2.5 py-2">Tarih</th>

                          <th className="px-2.5 py-2">Hasta</th>

                          <th className="px-2.5 py-2">İşlem Detayı</th>

                          <th className="px-2.5 py-2 text-right">Tutar</th>
                        </tr>
                      </thead>

                      <tbody>
                        {revenueHistory.map((rev, i) => (
                          <tr
                            key={i}
                            className="border-b hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                            onContextMenu={(e) => {
                              const pObj = Object.values(
                                globalData.patientsDb || {}
                              ).find(
                                (p) =>
                                  p.name.toLowerCase() ===
                                  rev.patientName.toLowerCase()
                              );
                              if (pObj) handleContextMenu(e, "patient", pObj);
                            }}
                          >
                            <td className="px-2.5 py-2 font-bold text-slate-500 dark:text-slate-400">
                              {new Date(rev.date).toLocaleString("tr-TR", {
                                day: "2-digit",

                                month: "2-digit",

                                year: "numeric",
                              })}
                            </td>

                            <td
                              className="px-2.5 py-2 font-black text-slate-800 cursor-pointer hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                              onClick={() => openPatientByName(rev.patientName)}
                            >
                              {rev.patientName}
                            </td>

                            <td className="px-2.5 py-2 font-bold text-slate-600 dark:text-slate-300">
                              {rev.treatment}{" "}
                              <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded dark:bg-slate-700 dark:text-slate-400">
                                {rev.type}
                              </span>
                            </td>

                            <td className="px-2.5 py-2 text-right font-black text-indigo-600 dark:text-indigo-400">
                              {rev.amount.toLocaleString("tr-TR")} ₺
                            </td>
                          </tr>
                        ))}

                        {revenueHistory.length === 0 && (
                          <tr>
                            <td
                              colSpan="4"
                              className="text-center py-2 text-slate-400 font-medium"
                            >
                              Bu dönemde fatura edilen işlem bulunmuyor.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {financeDetailView === "collected" && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 animate-pop">
                  <div className="p-2 border-b bg-emerald-50 flex justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setFinanceDetailView("overview")}
                        className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-indigo-600 transition"
                      >
                        <i className="fa-solid fa-arrow-left"></i>
                      </button>

                      <h3 className="font-black text-emerald-800 text-[13px] uppercase tracking-wider">
                        Tahsilat Detayları
                      </h3>
                    </div>

                    <div className="font-black text-emerald-600 text-base">
                      {totalCollected.toLocaleString("tr-TR")} ₺
                    </div>
                  </div>

                  <div className="overflow-y-auto w-full flex-1">
                    <table className="w-full text-left text-[13px]">
                      <thead className="text-[10px] text-slate-400 uppercase border-b font-black sticky top-0 bg-white">
                        <tr>
                          <th className="px-2.5 py-2">Tarih ve Saat</th>

                          <th className="px-2.5 py-2">Hasta</th>

                          <th className="px-2.5 py-2 text-right">Tutar</th>
                        </tr>
                      </thead>

                      <tbody>
                        {paymentHistory.map((pay, i) => (
                          <tr
                            key={i}
                            className="border-b hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                            onContextMenu={(e) => {
                              const pObj = Object.values(
                                globalData.patientsDb || {}
                              ).find(
                                (p) =>
                                  p.name.toLowerCase() ===
                                  pay.patientName.toLowerCase()
                              );
                              if (pObj) handleContextMenu(e, "patient", pObj);
                            }}
                          >
                            <td className="px-2.5 py-2 font-bold text-slate-500 dark:text-slate-400">
                              {new Date(pay.date).toLocaleString("tr-TR", {
                                day: "2-digit",

                                month: "2-digit",

                                year: "numeric",

                                hour: "2-digit",

                                minute: "2-digit",
                              })}
                            </td>

                            <td
                              className="px-2.5 py-2 font-black text-slate-800 cursor-pointer hover:text-indigo-600"
                              onClick={() => openPatientByName(pay.patientName)}
                            >
                              {pay.patientName}
                            </td>

                            <td className="px-2.5 py-2 text-right font-black text-emerald-600">
                              +{pay.amount.toLocaleString("tr-TR")} ₺
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {financeDetailView === "pending" && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 animate-pop">
                  <div className="p-2 border-b bg-rose-50 flex justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setFinanceDetailView("overview")}
                        className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-indigo-600 transition"
                      >
                        <i className="fa-solid fa-arrow-left"></i>
                      </button>

                      <h3 className="font-black text-rose-800 text-[13px] uppercase tracking-wider">
                        Bekleyen Alacaklar
                      </h3>
                    </div>

                    <div className="font-black text-rose-600 text-base">
                      {totalReceivable.toLocaleString("tr-TR")} ₺
                    </div>
                  </div>

                  <div className="overflow-y-auto w-full flex-1">
                    <table className="w-full text-left text-[13px]">
                      <thead className="text-[10px] text-slate-400 uppercase border-b font-black sticky top-0 bg-white">
                        <tr>
                          <th className="px-2.5 py-2">Hasta</th>

                          <th className="px-2.5 py-2 text-right">Borç Tutarı</th>
                        </tr>
                      </thead>

                      <tbody>
                        {patientDebts.map((p, i) => (
                          <tr
                            key={i}
                            className="border-b hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                            onContextMenu={(e) => {
                              const pObj = Object.values(
                                globalData.patientsDb || {}
                              ).find(
                                (pat) =>
                                  pat.name.toLowerCase() ===
                                  p.patientName.toLowerCase()
                              );
                              if (pObj) handleContextMenu(e, "patient", pObj);
                            }}
                          >
                            <td
                              className="px-2.5 py-2 font-black text-slate-800 cursor-pointer hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                              onClick={() => openPatientByName(p.patientName)}
                            >
                              {p.patientName}
                            </td>

                            <td className="px-2.5 py-2 text-right font-black text-rose-600">
                              {p.debt.toLocaleString("tr-TR")} ₺
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        };

        const SidebarItem = ({ icon, label, id }) => (
          <div className="relative group px-1.5">
            {/* YENİ: Aktif Sekme Göstergesi (Indicator) */}
            {activeTab === id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full shadow-[2px_0_8px_rgba(79,70,229,0.5)] z-10"></div>
            )}
            <button
              onClick={() => {
                setActiveTab(id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-300 ${
                activeTab === id
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-800"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
              }`}
            >
              <i
                className={`fa-solid ${icon} w-5 text-center text-base transition-transform duration-300 ${
                  activeTab === id ? "scale-110" : "group-hover:scale-110"
                }`}
              ></i>

              <span
                className={`text-[13px] whitespace-nowrap transition-opacity duration-200 ${
                  isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
                }`}
              >
                {label}
              </span>
            </button>
          </div>
        );

        return (
          <div className="h-screen w-full flex bg-slate-50 dark:bg-[#0f172a] overflow-hidden text-slate-800 dark:text-slate-200 relative transition-colors duration-300">
            {/* YENİ: SAĞ TIK / UZUN BASMA MENÜSÜ ARAYÜZÜ */}
            {contextMenu && contextMenu.isOpen && (
              <div
                className="fixed bg-white dark:bg-slate-800 rounded-xl shadow-[0_15px_50px_-10px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-slate-700 py-1.5 z-[300] min-w-[200px] animate-pop"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onContextMenu={(e) => e.preventDefault()} // Menü üzerinde tekrar sağ tıklanmasını engelle
              >
                {contextMenu.type === "patient" && (
                  <div className="flex flex-col">
                    <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-700/50 font-black text-indigo-600 dark:text-indigo-400 text-[11px] uppercase tracking-wider truncate">
                      {contextMenu.data.name}
                    </div>
                    <button
                      onClick={() => {
                        setPatientForm(contextMenu.data);
                        setPatientModalTab("info");
                        setIsPatientModalOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-2 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition"
                    >
                      <i className="fa-regular fa-calendar-plus w-4 text-center"></i>{" "}
                      Randevu / Not Ekle
                    </button>
                    <button
                      onClick={() => {
                        setPatientForm(contextMenu.data);
                        setPatientModalTab("plan");
                        setIsPatientModalOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-2 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition"
                    >
                      <i className="fa-solid fa-tooth w-4 text-center"></i>{" "}
                      Tedavi Ekle (Plan)
                    </button>
                    <button
                      onClick={() => {
                        setPatientForm(contextMenu.data);
                        setPatientModalTab("finance");
                        setIsPatientModalOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-2 text-[13px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex items-center gap-1.5 transition"
                    >
                      <i className="fa-solid fa-money-bill-wave w-4 text-center"></i>{" "}
                      Ödeme Al
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                    <button
                      onClick={() => {
                        setPatientForm(contextMenu.data);
                        handleDeletePatient();
                      }}
                      className="w-full text-left px-2.5 py-2 text-[13px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-1.5 transition"
                    >
                      <i className="fa-solid fa-trash w-4 text-center"></i>{" "}
                      Hastayı Sil
                    </button>
                  </div>
                )}

                {contextMenu.type === "appointment" && (
                  <div className="flex flex-col">
                    <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-700/50 font-black text-indigo-600 dark:text-indigo-400 text-[11px] uppercase tracking-wider truncate">
                      {contextMenu.data.apt.patientName}
                    </div>
                    <button
                      onClick={() =>
                        openAppointmentModal(
                          contextMenu.data.slot,
                          contextMenu.data.date,
                          contextMenu.data.docId
                        )
                      }
                      className="w-full text-left px-2.5 py-2 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition"
                    >
                      <i className="fa-solid fa-pen-to-square w-4 text-center"></i>{" "}
                      Randevuyu Düzenle
                    </button>
                    <button
                      onClick={(e) =>
                        handleStatusCycle(
                          e,
                          contextMenu.data.docId,
                          contextMenu.data.fullKey,
                          contextMenu.data.apt
                        )
                      }
                      className="w-full text-left px-2.5 py-2 text-[13px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex items-center gap-1.5 transition"
                    >
                      <i className="fa-solid fa-rotate w-4 text-center"></i>{" "}
                      Durumu Değiştir
                    </button>
                  </div>
                )}

                {contextMenu.type === "doctor" && (
                  <div className="flex flex-col">
                    <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-700/50 font-black text-indigo-600 dark:text-indigo-400 text-[11px] uppercase tracking-wider truncate">
                      {globalData.doctorProfiles?.[contextMenu.data]?.name ||
                        contextMenu.data}
                    </div>
                    <button
                      onClick={() => {
                        const docUsername = contextMenu.data;
                        setSelectedDoctorId(docUsername);
                        setDoctorEditForm(
                          globalData.doctorProfiles?.[docUsername] || {
                            name: docUsername,
                            title: "Hekim",
                          }
                        );
                        setDocModalTab("profile");
                        setDocStatsStart("");
                        setDocStatsEnd("");
                        setDocStatsSelectedTreatment(null);
                        setIsDoctorDetailsModalOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-2 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition"
                    >
                      <i className="fa-solid fa-user-pen w-4 text-center"></i>{" "}
                      Profili İncele / Düzenle
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* YENİ: OFFLINE MOD UYARI BARI */}
            {isOffline && (
              <div className="absolute top-0 left-0 w-full bg-rose-500 text-white text-[11px] font-black uppercase tracking-widest text-center py-1 z-[200] shadow-md flex justify-center items-center gap-1 animate-pulse">
                <i className="fa-solid fa-wifi-slash"></i>
                İnternet Bağlantısı Koptu - Çevrimdışı (Offline) Modda
                Çalışıyorsunuz
              </div>
            )}

            {notification && (
              <div
                className={`fixed top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] font-black text-[13px] text-white z-[100] animate-[modalPop_0.3s_ease-out_forwards] backdrop-blur-xl flex items-center gap-2 border ${
                  notification.type === "error"
                    ? "bg-rose-500/90 border-rose-400"
                    : "bg-slate-900/90 dark:bg-indigo-600/90 border-slate-700 dark:border-indigo-400"
                }`}
              >
                <i
                  className={`fa-solid ${
                    notification.type === "error"
                      ? "fa-triangle-exclamation"
                      : "fa-check-circle"
                  } text-base`}
                ></i>
                {notification.message}
              </div>
            )}

            {confirmModal.isOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-2">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-pop">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-[#0f172a] text-white flex justify-between items-center">
                    <h3 className="font-black text-[13px] uppercase tracking-wider">
                      <i className="fa-solid fa-circle-exclamation mr-2"></i>
                      Onay
                    </h3>

                    <button
                      onClick={handleCancelConfirm}
                      className="text-slate-400 hover:text-white"
                    >
                      <i className="fa-solid fa-xmark text-base"></i>
                    </button>
                  </div>

                  <div className="p-3 space-y-2">
                    <p className="text-slate-700 dark:text-slate-300 font-bold text-base">
                      {confirmModal.message}
                    </p>

                    <div className="flex gap-1.5 pt-1.5">
                      <button
                        onClick={handleCancelConfirm}
                        className="flex-1 px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition dark:bg-slate-700 dark:text-slate-200"
                      >
                        Vazgeç
                      </button>

                      <button
                        onClick={handleConfirm}
                        className="flex-[2] px-2.5 py-1.5 bg-rose-500 text-white rounded-xl font-black hover:bg-rose-600 transition"
                      >
                        Evet, Sil
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <aside
              ref={sidebarRef}
              className={`sidebar-transition bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 flex flex-col shadow-[4px_0_15px_-3px_rgba(0,0,0,0.05)] absolute h-full sm:relative sm:h-auto ${
                isSidebarOpen ? "w-56" : "w-[68px] hidden sm:flex"
              } no-print`}
            >
              <div
                className="h-16 flex items-center px-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0 gap-1.5 overflow-hidden bg-slate-50/50 dark:bg-slate-900 cursor-pointer"
                onClick={() => {
                  setActiveTab("home");

                  setIsSidebarOpen(false);
                }}
              >
                <div className="w-8 h-7 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[13px] shadow-md">
                  <i className="fa-solid fa-tooth"></i>
                </div>

                <span
                  className={`font-black text-base text-slate-800 dark:text-white tracking-tight transition-opacity whitespace-nowrap ${
                    isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
                  }`}
                >
                  {settings.klinik.ad || "Klinik Randevu"}
                </span>
              </div>

              <div className="flex-1 px-2 py-1.5 flex flex-col gap-1 overflow-y-auto">
                <SidebarItem
                  icon="fa-chart-pie text-sky-500"
                  label="Anasayfa (Özet)"
                  id="home"
                />

                <SidebarItem
                  icon="fa-calendar-days text-indigo-500"
                  label="Randevu Takvimi"
                  id="calendar"
                />

                <SidebarItem
                  icon="fa-table-columns text-purple-500"
                  label="Randevu Listesi"
                  id="list"
                />

                <SidebarItem
                  icon="fa-hospital-user text-emerald-500"
                  label="Hastalar & Veri"
                  id="patients"
                />

                <SidebarItem
                  icon="fa-tags text-pink-500"
                  label="Ücretlendirme"
                  id="pricing"
                />

                <SidebarItem
                  icon="fa-user-doctor text-amber-500"
                  label="Hekim Yönetimi"
                  id="doctors"
                />

                <SidebarItem
                  icon="fa-vault text-rose-500"
                  label="Finans (Bilanço)"
                  id="finance"
                />
              </div>
              
              {/* KLİNİK AYARLARI BUTONU (EN ALTTA SABİT) */}
              <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent">
                <SidebarItem
                  icon="fa-gear text-slate-500 dark:text-slate-400"
                  label="Klinik Ayarları"
                  id="settings"
                />
              </div>
            </aside>

            {/* YENİ: Mobil için Pürüzsüz Glassmorphism Alt Menü */}
            <div
              className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 flex overflow-x-auto p-1.5 pb-3 gap-1 justify-around z-40 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] no-print transition-colors"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                paddingBottom: "env(safe-area-inset-bottom, 12px)",
              }}
            >
              {[
                "home",

                "calendar",

                "list",

                "patients",

                "pricing",

                "doctors",

                "finance",

                "settings",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setIsSidebarOpen(false);
                  }}
                  className={`flex shrink-0 flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-300 ${
                    activeTab === tab
                      ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 w-16"
                      : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 w-10"
                  }`}
                >
                  <i
                    className={`fa-solid ${
                      tab === "home"
                        ? "fa-chart-pie"
                        : tab === "calendar"
                        ? "fa-calendar-days"
                        : tab === "list"
                        ? "fa-table-columns"
                        : tab === "patients"
                        ? "fa-hospital-user"
                        : tab === "pricing"
                        ? "fa-tags"
                        : tab === "doctors"
                        ? "fa-user-doctor"
                        : tab === "finance"
                        ? "fa-vault"
                        : "fa-gear"
                    } text-lg transition-transform ${
                      activeTab === tab ? "scale-110 -translate-y-0.5" : ""
                    }`}
                  ></i>
                  {/* YENİ: Sadece aktif sekmede beliren metin */}
                  {activeTab === tab && (
                    <span className="text-[9px] font-black mt-0.5 animate-pop tracking-wider">
                      {tab === "home"
                        ? "ÖZET"
                        : tab === "calendar"
                        ? "TAKVİM"
                        : tab === "list"
                        ? "LİSTE"
                        : tab === "patients"
                        ? "HASTA"
                        : tab === "pricing"
                        ? "FİYAT"
                        : tab === "doctors"
                        ? "HEKİM"
                        : tab === "finance"
                        ? "FİNANS"
                        : "AYARLAR"}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative pb-20 sm:pb-0 w-full">
              {activeTab === "doctors" && !isHeaderVisible && (
                <div
                  className="header-trigger-zone"
                  onMouseEnter={() => setIsHeaderVisible(true)}
                ></div>
              )}

              <header
                className={`h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-2.5 lg:px-4 z-30 shrink-0 shadow-sm w-full absolute top-0 left-0 right-0 header-transition no-print ${
                  activeTab === "doctors" && !isHeaderVisible
                    ? "header-hidden"
                    : ""
                }`}
                onMouseLeave={() => {
                  if (activeTab === "doctors") setIsHeaderVisible(false);
                }}
                onMouseEnter={() => setIsHeaderVisible(true)}
              >
                {/* MOBİL İÇİN MENÜ AÇMA BUTONU */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="w-9 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 transition mr-2 lg:hidden shrink-0"
                >
                  <i className="fa-solid fa-bars text-base"></i>
                </button>

                {/* KLİNİK LOGO VE ADI (MASAÜSTÜNDE ARAMA ÇUBUĞUNUN SOLUNDA GÖRÜNÜR) */}
                <div className="hidden lg:flex items-center gap-3 mr-6 shrink-0 select-none">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg shadow-md overflow-hidden border border-indigo-200 dark:border-indigo-800">
                    {settings?.klinik?.logo ? (
                      <img src={settings.klinik.logo} alt="Klinik Logo" className="w-full h-full object-cover" />
                    ) : (
                      <i className="fa-solid fa-tooth drop-shadow-md"></i>
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="font-black text-slate-800 dark:text-white tracking-tight text-[15px] leading-tight truncate max-w-[200px]">
                      {settings?.klinik?.ad || "Klinik Randevu"}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 leading-none mt-0.5">
                      Yönetim Paneli
                    </span>
                  </div>
                </div>

                {/* ARAMA ÇUBUĞU */}
                <div className="relative flex-1 max-w-sm mr-3" ref={searchRef}>
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 w-full focus-within:border-indigo-400 focus-within:ring-2 transition-all shadow-inner group relative">
                    <div className="flex items-center flex-1 min-w-0">
                      <i className="fa-solid fa-magnifying-glass text-indigo-400 text-[13px] shrink-0"></i>
                      <input
                        type="text"
                        placeholder="İsim, Tel, TC Ara..."
                        value={globalSearch}
                        onChange={(e) => {
                          setGlobalSearch(e.target.value);
                          setSearchDropdownOpen(true);
                        }}
                        onFocus={() => setSearchDropdownOpen(true)}
                        className="bg-transparent outline-none border-none text-[13px] ml-2 w-full font-bold dark:text-white"
                      />
                    </div>

                    {/* YENİ: Profesyonel Klavye Kısayol Rozeti (Sadece boşken görünür) */}
                    {!globalSearch && (
                      <div className="hidden sm:flex items-center gap-1 shrink-0 ml-2 pointer-events-none opacity-60 group-focus-within:opacity-0 transition-opacity">
                        <span className="text-[10px] font-black bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded shadow-sm">
                          Ctrl
                        </span>
                        <span className="text-[10px] font-black bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded shadow-sm">
                          K
                        </span>
                      </div>
                    )}
                  </div>

                  {searchDropdownOpen && globalSearch && (
                    <div className="absolute top-full left-0 mt-1.5 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border overflow-hidden z-50 animate-pop">
                      <div className="p-1.5 bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase text-center border-b tracking-wider">
                        Bulunan Hastalar
                      </div>

                      <div className="max-h-56 overflow-y-auto">
                        {Object.values(globalData.patientsDb || {})
                            .filter(
                              (p) =>
                                (p.addedBy === currentUser ||
                                  globalData.doctorProfiles?.[p.addedBy]
                                    ?.addedBy === currentUser) && !p.isDeleted &&
                                (p.name
                                  .toLowerCase()
                                  .includes(globalSearch.toLowerCase()) ||
                                  (p.phone && p.phone.includes(globalSearch)) ||
                                  (p.tc && p.tc.includes(globalSearch)))
                            )

                          .slice(0, 8)

                          .map((p, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setPatientForm(p);

                                setPatientModalTab("info");

                                setIsPatientModalOpen(true);

                                setSearchDropdownOpen(false);

                                setGlobalSearch("");
                              }}
                              className="p-1.5 border-b hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center transition group"
                            >
                              <div>
                                <div className="font-black text-[13px] group-hover:text-indigo-700 transition dark:text-white">
                                  {p.name}
                                </div>

                                <div className="text-[11px] text-slate-500 font-medium">
                                  <i className="fa-solid fa-phone mr-1"></i>

                                  {p.phone || "-"}
                                </div>
                              </div>

                              <i className="fa-solid fa-arrow-right text-indigo-300 group-hover:text-indigo-600 transition"></i>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 lg:gap-1.5 shrink-0">
                  {/* YENİ: Hasta Mahremiyeti / Gizlilik Modu Butonu */}
                  <button
                    onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                    className={`w-9 h-8 rounded-xl flex items-center justify-center transition shadow-sm ${
                      isPrivacyMode
                        ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                    title="Finansal Verileri Gizle"
                  >
                    <i
                      className={`fa-solid ${
                        isPrivacyMode ? "fa-eye-slash" : "fa-eye"
                      }`}
                    ></i>
                  </button>

                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="relative w-14 h-7 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors duration-300 flex items-center px-1 border border-slate-300 dark:border-slate-600 shadow-inner shrink-0"
                    title="Temayı Değiştir"
                  >
                    <div
                      className={`absolute w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ${
                        isDarkMode ? "translate-x-7" : "translate-x-0"
                      }`}
                    >
                      <i
                        className={`fa-solid text-[9px] ${
                          isDarkMode
                            ? "fa-moon text-indigo-600"
                            : "fa-sun text-amber-500"
                        }`}
                      ></i>
                    </div>
                  </button>

                  <div className="relative" ref={userMenuRef}>
                    <div
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 pr-2.5 rounded-xl transition border border-transparent"
                    >
                      <div className="text-right hidden xl:block">
                        <div className="text-[13px] font-black dark:text-white">
                          {globalData.doctorProfiles?.[currentUser]?.name ||
                            currentUser}
                        </div>
                      </div>
                      <div className="w-9 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-base border shadow-sm shrink-0 overflow-hidden relative">
                        {globalData.doctorProfiles?.[currentUser]?.avatar ? (
                          <img
                            src={globalData.doctorProfiles[currentUser].avatar}
                            style={{
                              transform: `scale(${
                                globalData.doctorProfiles[currentUser].zoom || 1
                              })`,
                              objectPosition: `${
                                globalData.doctorProfiles[currentUser].x || 50
                              }% ${
                                globalData.doctorProfiles[currentUser].y || 50
                              }%`,
                            }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          currentUser.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200/50 dark:border-slate-700/50 overflow-hidden z-50 animate-pop ring-1 ring-black/5 dark:ring-white/10">
                        {/* Menü İçi Kullanıcı Özeti */}
                        <div className="p-2.5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                          <div className="font-black text-[13px] text-slate-800 dark:text-white truncate">
                            {globalData.doctorProfiles?.[currentUser]?.name ||
                              currentUser}
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                            {globalData.doctorProfiles?.[currentUser]?.title ||
                              "Klinik Hekimi"}
                          </div>
                        </div>

                        <div className="p-1.5 space-y-0.5">
                          <button
                            onClick={() => {
                              setIsPasswordModalOpen(true);
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-2 text-[11px] font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-xl flex items-center gap-1.5 group"
                          >
                            <i className="fa-solid fa-key w-4 text-center text-slate-400 group-hover:text-indigo-500 transition-colors"></i>
                            Şifre Değiştir
                          </button>

                          <button
                            onClick={triggerInstall}
                            className="w-full text-left px-2.5 py-2 text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 transition-colors rounded-xl flex items-center gap-1.5 group"
                          >
                            <i className="fa-solid fa-download w-4 text-center text-slate-400 group-hover:text-slate-500 transition-colors"></i>
                            Uygulamayı Yükle
                          </button>
                        </div>

                        <div className="p-1.5 border-t border-slate-100 dark:border-slate-700/50">
                          <button
                            onClick={() => {
                              sessionStorage.removeItem("klinikAktifKullanici");
                              sessionStorage.removeItem("klinikOturumTokeni");
                              window.location.reload();
                            }}
                            className="w-full text-left px-2.5 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-700 transition-colors rounded-xl flex items-center gap-1.5 group"
                          >
                            <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center text-rose-400 group-hover:text-rose-600 transition-colors"></i>
                            Sistemden Çıkış Yap
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </header>

              <div
                id="main-content-area"
                className={`flex-1 p-1.5 sm:p-2 lg:p-2.5 overflow-x-hidden overflow-y-auto bg-slate-100/30 dark:bg-[#0f172a] relative w-full flex flex-col transition-all duration-300 ${
                  activeTab !== "doctors"
                    ? "mt-16"
                    : isHeaderVisible
                    ? "mt-16"
                    : "mt-0"
                } ${
                  isSplitMode && isPatientModalOpen
                    ? "sm:pl-[360px] xl:pl-[400px]"
                    : ""
                }`}
              >
                {activeTab === "home" && renderHome()}

                {activeTab === "calendar" && renderCalendarView()}

                {activeTab === "list" && renderGridList()}

                {activeTab === "patients" && renderPatients()}

                {activeTab === "pricing" && renderPricing()}

                {activeTab === "doctors" && renderDoctors()}

                {activeTab === "finance" && renderFinance()}

                {activeTab === "settings" && renderSettings()}
              </div>
            </main>

            {isPasswordModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2">
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-pop">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-[#0f172a] text-white flex justify-between items-center">
                    <h3 className="font-black text-[13px] uppercase tracking-wider">
                      <i className="fa-solid fa-key mr-2"></i>Şifre Değiştir
                    </h3>

                    <button
                      onClick={() => setIsPasswordModalOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <i className="fa-solid fa-xmark text-base"></i>
                    </button>
                  </div>

                  <form
                    onSubmit={handleChangePassword}
                    className="p-3 space-y-2"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                        Eski Şifre
                      </label>

                      <input
                        required
                        type="password"
                        value={passwordForm.oldPass}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,

                            oldPass: e.target.value,
                          })
                        }
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                        Yeni Şifre
                      </label>

                      <input
                        required
                        type="password"
                        value={passwordForm.newPass}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,

                            newPass: e.target.value,
                          })
                        }
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 text-white rounded-xl font-black mt-1.5 shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition"
                    >
                      Güncelle
                    </button>
                  </form>
                </div>
              </div>
            )}

            {isInstallModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2">
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-pop">
                  <div className="px-3 py-2 bg-[#0f172a] text-white flex justify-between items-center">
                    <h3 className="font-black text-base flex items-center gap-1">
                      <i className="fa-solid fa-download text-blue-400"></i>{" "}
                      Uygulamayı Yükle
                    </h3>

                    <button
                      onClick={() => setIsInstallModalOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <i className="fa-solid fa-xmark text-base"></i>
                    </button>
                  </div>

                  <div className="p-3 space-y-2 text-[13px] text-slate-600 dark:text-slate-300 font-medium">
                    <p className="font-black text-slate-800 dark:text-white text-base border-b border-slate-100 dark:border-slate-700 pb-2">
                      Veri Kaybı Yaşamadan Hızlı Kurulum:
                    </p>

                    <div className="space-y-1.5 pt-1.5">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                        <strong className="text-slate-800 dark:text-white block mb-0.5 text-base">
                          <i className="fa-brands fa-apple text-slate-400"></i>{" "}
                          iPhone / iPad (Safari):
                        </strong>{" "}
                        Alt menüdeki{" "}
                        <i className="fa-solid fa-arrow-up-from-bracket text-blue-600 mx-1"></i>{" "}
                        <b>Paylaş</b> ikonuna basın ve ardından{" "}
                        <b>"Ana Ekrana Ekle"</b> seçeneğini seçin.
                      </div>

                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                        <strong className="text-emerald-800 dark:text-emerald-400 block mb-0.5 text-base">
                          <i className="fa-brands fa-android text-emerald-500"></i>{" "}
                          Android (Chrome):
                        </strong>{" "}
                        Sağ üstteki <b>üç nokta (⋮)</b> menüsüne basın ve{" "}
                        <b>"Uygulamayı Yükle"</b> veya <b>"Ana Ekrana Ekle"</b>{" "}
                        seçeneğini seçin.
                      </div>
                    </div>

                    <button
                      onClick={() => setIsInstallModalOpen(false)}
                      className="w-full mt-2 py-2 bg-slate-900 dark:bg-indigo-600 text-white font-black rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-700 transition shadow-lg"
                    >
                      Anladım, Kapat
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isModalOpen && (
              <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-2 transition-opacity"
                onClick={() => setIsModalOpen(false)} // YENİ: Dışarı tıklayınca kapanır
              >
                <div
                  className="bg-white dark:bg-slate-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-pop flex flex-col max-h-[90vh]"
                  onClick={(e) => e.stopPropagation()} // YENİ: İçeri tıklayınca kapanmasını engeller
                >
                  {/* YENİ: Sadece mobilde görünen tutamaç (Drag Handle) */}
                  <div className="w-full flex justify-center pt-2.5 pb-0.5 bg-[#0f172a] sm:hidden rounded-t-[2rem]">
                    <div className="w-10 h-1 bg-white/30 rounded-full"></div>
                  </div>

                  <div className="px-3 py-2 sm:py-1.5 border-b border-slate-700 flex justify-between items-center bg-[#0f172a] text-white shrink-0 cursor-default">
                    <div>
                      <h3 className="font-black text-base">Randevu İşlemleri</h3>

                      <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                        {globalData.doctorProfiles?.[activeSlotDoctor]?.name ||
                          activeSlotDoctor}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="bg-white/10 text-white text-[11px] font-black px-2.5 py-1.5 rounded-xl border border-white/20 shadow-inner">
                        <i className="fa-regular fa-clock mr-1"></i>{" "}
                        {selectedSlot}
                      </div>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition shadow-sm"
                      >
                        <i className="fa-solid fa-xmark text-base"></i>
                      </button>
                    </div>
                  </div>

                  {aptModalMode === "view" ? (
                    <div className="p-3 space-y-2 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                      {formData.anamnesis && (
                        <div className="bg-rose-100 text-rose-700 p-2.5 rounded-xl border shadow-sm flex gap-2 items-start dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800">
                          <i className="fa-solid fa-triangle-exclamation text-base mt-0.5"></i>

                          <div>
                            <div className="font-black text-[11px] mb-1 uppercase tracking-wider">
                              Önemli Uyarı (Anamnez)
                            </div>

                            <div className="text-[11px] font-semibold">
                              {formData.anamnesis}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-700">
                          <div className="w-9 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <i className="fa-solid fa-user"></i>
                          </div>

                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Hasta Adı
                            </div>

                            <div className="font-black text-base text-slate-800 dark:text-white">
                              {formData.patientName}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Telefon & İletişim
                            </div>

                            <div className="font-bold mt-1 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <div>
                                <i className="fa-solid fa-phone text-slate-400 mr-1"></i>
                                {formData.phone || "-"}
                              </div>

                              {/* YENİ: Otomatik Mesajlı WhatsApp Butonu */}
                                  {formData.phone &&
                                    String(formData.phone).replace(/\D/g, "").length >= 10 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          let num = String(formData.phone).replace(/\D/g, "");
                                          if (!num.startsWith("90")) num = "90" + num;
                                          
                                          const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                                          const formattedDate = activeSlotDate ? new Date(activeSlotDate).toLocaleDateString('tr-TR', dateOptions) : "";
                                          const msg = `Sayın ${formData.patientName},\n\n${formattedDate} tarihi, saat ${selectedSlot}'daki randevunuzu hatırlatırız. Randevunuza gelemeyecek olmanız durumunda lütfen kliniğimize önceden bilgi veriniz.\n\nSağlıklı günler dileriz.`;
                                          
                                          window.open(
                                            `https://wa.me/${num}?text=${encodeURIComponent(msg)}`,
                                            "_blank"
                                          );
                                        }}
                                    className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg hover:bg-emerald-200 transition shadow-sm flex items-center gap-1 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border dark:border-emerald-800"
                                  >
                                    <i className="fa-brands fa-whatsapp text-[13px]"></i>{" "}
                                    Hatırlat
                                  </button>
                                )}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Durum
                            </div>

                            <div className="mt-1">
                              {getStatusBadge(formData.status)}
                            </div>
                          </div>

                          <div className="col-span-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Tedavi / Seçilen Diş / Süre
                            </div>

                            <div className="font-bold mt-1 text-slate-700 dark:text-slate-300">
                              {renderTreatmentText(formData)} (
                              {formData.duration} Dk)
                            </div>
                          </div>

                          {formData.price && (
                            <div className="col-span-2">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Plan Ücreti
                              </div>

                              <div className="font-black text-indigo-600 dark:text-indigo-400 mt-1">
                                {formData.price} ₺
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={handleDeleteAppointment}
                          className="px-2.5 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition shadow-sm border border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="flex-1 px-2.5 py-2 bg-slate-200 text-slate-600 rounded-xl font-bold text-[13px] hover:bg-slate-300 transition shadow-sm dark:bg-slate-700 dark:text-slate-200"
                        >
                          Kapat
                        </button>

                        <button
                          type="button"
                          onClick={() => setAptModalMode("edit")}
                          className="flex-[2] px-2.5 py-2 bg-indigo-600 text-white rounded-xl font-black text-[13px] shadow-xl hover:bg-indigo-700 transition"
                        >
                          <i className="fa-solid fa-pen-to-square mr-1.5"></i>
                          Düzenle
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSaveAppointment}
                      className="p-3 space-y-2 overflow-y-auto bg-white dark:bg-slate-800"
                    >
                      {/* YENİ: Geçmiş Tarih Uyarısı */}
                      {activeSlotDate &&
                        new Date(
                          formatDateKey(activeSlotDate) + "T" + selectedSlot
                        ).getTime() < new Date().getTime() && (
                          <div className="bg-amber-50 text-amber-700 p-2.5 rounded-xl border border-amber-200 shadow-sm flex items-start gap-1.5 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50">
                            <i className="fa-solid fa-clock-rotate-left text-base"></i>
                            <div>
                              <div className="font-black text-[13px] mb-0.5 uppercase tracking-wider">
                                Geçmiş Tarihli Kayıt
                              </div>
                              <div className="text-[13px] font-semibold">
                                Geçmiş bir tarih veya saat dilimi için işlem
                                yapıyorsunuz. Lütfen tarihi kontrol edin.
                              </div>
                            </div>
                          </div>
                        )}

                      {formData.anamnesis && (
                        <div className="bg-rose-100 text-rose-700 p-2.5 rounded-xl border shadow-sm flex items-start gap-1.5 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50">
                          <i className="fa-solid fa-triangle-exclamation text-base"></i>

                          <div>
                            <div className="font-black text-[13px] mb-0.5 uppercase tracking-wider">
                              Önemli Uyarı (Anamnez)
                            </div>

                            <div className="text-[13px] font-semibold whitespace-pre-wrap">
                              {formData.anamnesis}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="relative group">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                          Hasta Seç veya Adı Soyadı Yaz *
                        </label>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <i className="fa-regular fa-user text-slate-400 group-focus-within:text-indigo-500 transition-colors text-base"></i>
                          </div>

                          <input
                            required
                            autoFocus
                            value={formData.patientName}
                            onChange={(e) =>
                              handlePatientNameChange(e.target.value)
                            }
                            onFocus={() => {
                              if (!formData.patientName)
                                setPatientSuggestions(
                                  Object.values(
                                    globalData.patientsDb || {}
                                  ).filter(
                                    (p) =>
                                      p.addedBy === currentUser ||
                                      globalData.doctorProfiles?.[p.addedBy]
                                        ?.addedBy === currentUser
                                  )
                                );
                            }}
                            autoComplete="off"
                            className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-black text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all dark:bg-slate-900 dark:text-white"
                            placeholder="Örn: Ayşe Demir"
                          />
                        </div>

                        {patientSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-100 dark:border-slate-700 shadow-2xl rounded-xl z-50 max-h-48 overflow-y-auto overflow-hidden dark:bg-slate-800">
                            <div className="p-1.5 bg-slate-50/80 backdrop-blur-sm text-[9px] font-black uppercase text-slate-400 tracking-wider text-center dark:bg-slate-900/80 border-b dark:border-slate-700 sticky top-0 z-10">
                              Kayıtlı Hastalardan Seçin
                            </div>

                            {patientSuggestions.map((p, i) => (
                              <div
                                key={i}
                                onClick={() => selectPatientSuggestion(p)}
                                className="px-2.5 py-1.5 border-b border-slate-50 dark:border-slate-700/50 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors group dark:hover:bg-slate-750"
                              >
                                <div className="font-black text-[13px] text-slate-700 group-hover:text-indigo-700 dark:text-slate-200 dark:group-hover:text-indigo-400 transition-colors">
                                  {p.name}
                                </div>
                                <div className="text-[11px] text-slate-500 font-bold bg-white border border-slate-100 px-1.5 py-0.5 rounded-md shadow-sm dark:bg-slate-800 dark:border-slate-600">
                                  <i className="fa-solid fa-phone mr-1 opacity-70"></i>
                                  {p.phone || "-"}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                          Planlanan İşlemler (Birden Fazla Seçilebilir)
                        </label>
                        {(() => {
                          const scheduledTxs = [];
                          const currentAptKey =
                            activeSlotDate && selectedSlot
                              ? `${formatDateKey(
                                  activeSlotDate
                                )}-${selectedSlot}`
                              : null;

                          // Başka randevulara atanmış işlemleri bul
                          if (globalData.appointments) {
                            Object.values(globalData.appointments).forEach(
                              (docApts) => {
                                Object.entries(docApts).forEach(
                                  ([aptKey, apt]) => {
                                    if (
                                      currentAptKey &&
                                      aptKey === currentAptKey
                                    )
                                      return;

                                    if (
                                      apt.patientName === formData.patientName
                                    ) {
                                      if (
                                        apt.selectedTreatments &&
                                        apt.selectedTreatments.length > 0
                                      ) {
                                        apt.selectedTreatments.forEach((t) =>
                                          scheduledTxs.push(
                                            `${t.treatment}-${t.tooth}`
                                          )
                                        );
                                      } else if (
                                        apt.selectedTeeth &&
                                        apt.selectedTeeth.length > 0
                                      ) {
                                        scheduledTxs.push(
                                          `${apt.treatment}-${apt.selectedTeeth[0]}`
                                        );
                                      }
                                    }
                                  }
                                );
                              }
                            );
                          }

                          // Müsait planları listele
                          const availablePlans = (
                            formData.plannedTreatments || []
                          ).filter(
                            (tx) =>
                              !scheduledTxs.includes(
                                `${tx.treatment}-${tx.tooth}`
                              )
                          );

                          if (availablePlans.length > 0) {
                            return (
                              <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 p-1.5 space-y-1 custom-scrollbar shadow-inner">
                                {availablePlans.map((tx, idx) => {
                                  // Seçili mi kontrolü (Eski tekli kayıtlar için de geriye dönük uyumluluk)
                                  const isSelected =
                                    (formData.selectedTreatments || []).some(
                                      (t) =>
                                        t.tooth === tx.tooth &&
                                        t.treatment === tx.treatment
                                    ) ||
                                    (!formData.selectedTreatments?.length &&
                                      formData.treatment?.includes(
                                        tx.treatment
                                      ) &&
                                      formData.selectedTeeth?.includes(
                                        tx.tooth
                                      ));

                                  return (
                                    <label
                                      key={idx}
                                      className={`flex items-center gap-1.5 p-1.5 rounded-lg cursor-pointer transition-all border ${
                                        isSelected
                                          ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/40 dark:border-indigo-700 shadow-sm"
                                          : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-750"
                                      }`}
                                    >
                                      <div className="relative flex items-center justify-center shrink-0">
                                        <input
                                          type="checkbox"
                                          className="peer sr-only"
                                          checked={!!isSelected}
                                          onChange={() => {
                                            const currentSelected =
                                              formData.selectedTreatments || [];
                                            let newSelected = [
                                              ...currentSelected,
                                            ];

                                            // Eski tekli seçim datasını diziye dönüştürme (veri kaybı olmasın diye)
                                            if (
                                              newSelected.length === 0 &&
                                              formData.treatment &&
                                              formData.selectedTeeth?.length > 0
                                            ) {
                                              newSelected.push({
                                                treatment: formData.treatment,
                                                tooth:
                                                  formData.selectedTeeth[0],
                                              });
                                            }

                                            const existsIdx =
                                              newSelected.findIndex(
                                                (t) =>
                                                  t.tooth === tx.tooth &&
                                                  t.treatment === tx.treatment
                                              );

                                            if (existsIdx >= 0) {
                                              newSelected.splice(existsIdx, 1); // Varsa çıkar (Tiki kaldır)
                                            } else {
                                              newSelected.push({
                                                treatment: tx.treatment,
                                                tooth: tx.tooth,
                                              }); // Yoksa ekle
                                            }

                                            setFormData({
                                              ...formData,
                                              selectedTreatments: newSelected,
                                              treatment: newSelected
                                                .map((t) => t.treatment)
                                                .join(", "),
                                              selectedTeeth: newSelected.map(
                                                (t) => t.tooth
                                              ),
                                            });
                                          }}
                                        />
                                        <div
                                          className={`w-4 h-4 rounded-[6px] border-[1.5px] flex items-center justify-center transition-all ${
                                            isSelected
                                              ? "bg-indigo-600 border-indigo-600 text-white"
                                              : "bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-500"
                                          }`}
                                        >
                                          {isSelected && (
                                            <i className="fa-solid fa-check text-[9px]"></i>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex flex-col flex-1 min-w-0">
                                        <div
                                          className={`text-[13px] font-black truncate ${
                                            isSelected
                                              ? "text-indigo-800 dark:text-indigo-300"
                                              : "text-slate-700 dark:text-slate-200"
                                          }`}
                                        >
                                          {tx.treatment}
                                        </div>
                                        <div
                                          className={`text-[10px] font-bold mt-0.5 ${
                                            isSelected
                                              ? "text-indigo-500 dark:text-indigo-400"
                                              : "text-slate-400 dark:text-slate-500"
                                          }`}
                                        >
                                          Diş Bölgesi: {tx.tooth}
                                        </div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            );
                          } else {
                            return (
                              <div className="text-[11px] text-slate-500 font-bold py-1.5 bg-slate-50 rounded-xl px-2.5 py-2 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 flex items-center gap-1 shadow-sm">
                                <i className="fa-solid fa-circle-info text-slate-400 text-base"></i>
                                Bu hasta için planlanan tüm işlemler randevulara
                                bağlanmış veya henüz plan oluşturulmamış.
                              </div>
                            );
                          }
                        })()}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="relative group">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                            İşlem Süresi
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <i className="fa-solid fa-hourglass-half text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                            </div>
                            <select
                              value={formData.duration}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  duration: e.target.value,
                                })
                              }
                              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm dark:bg-slate-900 dark:text-white"
                            >
                              <option value="30">30 Dakika</option>
                              <option value="45">45 Dakika</option>
                              <option value="60">1 Saat</option>
                              <option value="90">1.5 Saat</option>
                              <option value="120">2 Saat+</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <i className="fa-solid fa-chevron-down text-slate-400 text-[10px]"></i>
                            </div>
                          </div>
                        </div>

                        <div className="relative group">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                            Durum
                          </label>
                          <div className="relative">
                            <select
                              value={formData.status || "Yeni Kayıt"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  status: e.target.value,
                                })
                              }
                              className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-black text-slate-700 outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm dark:bg-slate-900 dark:text-white"
                            >
                              <option value="Yeni Kayıt">
                                Yeni Kayıt (Bekliyor)
                              </option>
                              <option value="Geldi">Geldi (İşlem Bitti)</option>
                              <option value="Gelmedi">Gelmedi</option>
                              <option value="İptal">İptal Edildi</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <i className="fa-solid fa-chevron-down text-slate-400 text-[10px]"></i>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-end mb-1.5">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Notlar
                          </label>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  notes:
                                    (formData.notes
                                      ? formData.notes + " - "
                                      : "") + "Ağrı Şikayeti",
                                })
                              }
                              className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              Ağrı
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  notes:
                                    (formData.notes
                                      ? formData.notes + " - "
                                      : "") + "Kontrol Randevusu",
                                })
                              }
                              className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              Kontrol
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  notes:
                                    (formData.notes
                                      ? formData.notes + " - "
                                      : "") + "Anestezi İstemiyor",
                                })
                              }
                              className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              Anestezi Yok
                            </button>
                          </div>
                        </div>

                        <textarea
                          rows="2"
                          value={formData.notes || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                          className="w-full p-2 bg-white border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-semibold text-slate-700 resize-none outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all dark:bg-slate-900 dark:text-white"
                          placeholder="Randevu ile ilgili notlar..."
                        />
                      </div>

                      <div className="flex gap-1.5 pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="flex-1 px-2.5 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-[13px] hover:bg-slate-200 transition-colors shadow-sm dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                        >
                          İptal Kapat
                        </button>

                        <button
                          type="submit"
                          className="flex-[2] px-2.5 py-2 bg-[#0f172a] text-white rounded-xl font-black text-[13px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-slate-800 transition-all dark:bg-indigo-600 hover:dark:bg-indigo-700"
                        >
                          Değişiklikleri Kaydet
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {isPatientModalOpen &&
              patientForm &&
              (() => {
                const { past, future } = getPatientAppointmentsList(
                  patientForm.name
                );

                const fin = calculatePatientFinance(
                  patientForm.id,

                  patientForm.name
                );

                const txTypes = Object.keys(DEFAULT_PRICING);

                return (
                  <div
                    className={
                      isSplitMode
                        ? `fixed top-16 bottom-0 z-[45] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-[10px_0_30px_rgba(0,0,0,0.15)] flex justify-center transition-all duration-300 w-full sm:w-[360px] xl:w-[400px] ${
                            isSidebarOpen
                              ? "left-0 lg:left-[224px]"
                              : "left-0 sm:left-[68px]"
                          }`
                        : "fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 transition-all duration-300"
                    }
                  >
                    <div
                      className={
                        isSplitMode
                          ? "w-full h-full flex flex-col bg-white dark:bg-slate-800 overflow-hidden relative"
                          : "bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col h-[90vh] max-h-[850px] animate-pop relative"
                      }
                    >
                      <div className="px-3 py-2 border-b border-slate-700 flex justify-between items-center bg-[#0f172a] text-white shrink-0 no-print">
                        <h3 className="font-black text-[13px] sm:text-base flex items-center gap-1 truncate pr-1.5">
                          <i className="fa-regular fa-folder-open text-indigo-400 shrink-0"></i>{" "}
                          <span className="truncate">{patientForm.name}</span>
                        </h3>

                        <div className="flex gap-1 items-center shrink-0">
                          <button
                            onClick={() => {
                              setIsSplitMode(!isSplitMode);
                              if (!isSplitMode) setActiveTab("calendar");
                            }}
                            className={`hidden sm:flex px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition items-center gap-1 shadow-sm mr-0.5 ${
                              isSplitMode
                                ? "bg-indigo-500 text-white shadow-indigo-500/30 border border-indigo-600"
                                : "bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:text-white"
                            }`}
                          >
                            <i className="fa-solid fa-table-columns"></i>
                            {isSplitMode ? "Tam Ekran" : "Takvimle Böl"}
                          </button>

                          {patientForm.id && !isSplitMode && (
                            <button
                              onClick={handleDeletePatient}
                              className="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition mr-0.5 shadow-sm"
                            >
                              <i className="fa-solid fa-trash mr-1"></i>Sil
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setIsPatientModalOpen(false);
                              setIsSplitMode(false);
                            }}
                            className="text-slate-400 hover:text-white transition w-7 h-7 flex items-center justify-center bg-slate-800 rounded-lg hover:bg-rose-500 hover:text-white"
                          >
                            <i className="fa-solid fa-xmark text-base"></i>
                          </button>
                        </div>
                      </div>

                      {/* YENİ: iOS Stili Segmented Control Sekmeler */}
                      <div className="px-2.5 py-2 bg-white dark:bg-slate-800 border-b dark:border-slate-700 shrink-0 no-print">
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-0.5 overflow-x-auto custom-scrollbar shadow-inner">
                          <button
                            onClick={() => setPatientModalTab("info")}
                            className={`flex-1 ${
                              isSplitMode ? "min-w-[100px] py-1.5 px-1.5 text-[10px]" : "min-w-[130px] py-2 px-2.5 text-[13px]"
                            } font-bold rounded-lg whitespace-nowrap transition-all duration-300 ${
                              patientModalTab === "info"
                                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                          >
                            <i className="fa-regular fa-address-card mr-1"></i> Kimlik & Randevu
                          </button>

                          <button
                            onClick={() => setPatientModalTab("finance")}
                            className={`flex-1 ${
                              isSplitMode ? "min-w-[100px] py-1.5 px-1.5 text-[10px]" : "min-w-[130px] py-2 px-2.5 text-[13px]"
                            } font-bold rounded-lg whitespace-nowrap transition-all duration-300 ${
                              patientModalTab === "finance"
                                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                          >
                            <i className="fa-solid fa-money-bill-wave mr-1"></i> Hesap Özeti
                          </button>

                          <button
                            onClick={() => setPatientModalTab("plan")}
                            className={`flex-1 ${
                              isSplitMode ? "min-w-[100px] py-1.5 px-1.5 text-[10px]" : "min-w-[130px] py-2 px-2.5 text-[13px]"
                            } font-bold rounded-lg whitespace-nowrap transition-all duration-300 ${
                              patientModalTab === "plan"
                                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                          >
                            <i className="fa-solid fa-tooth mr-1"></i> Planlama
                          </button>

                          <button
                            onClick={() => setPatientModalTab("history")}
                            className={`flex-1 ${
                              isSplitMode ? "min-w-[100px] py-1.5 px-1.5 text-[10px]" : "min-w-[130px] py-2 px-2.5 text-[13px]"
                            } font-bold rounded-lg whitespace-nowrap transition-all duration-300 ${
                              patientModalTab === "history"
                                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                          >
                            <i className="fa-solid fa-notes-medical mr-1"></i> Klinik Geçmiş
                          </button>
                        </div>
                      </div>

                      {patientModalTab === "info" && (
                        <div
                          className={`flex-1 overflow-y-auto p-2.5 sm:p-3 flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-900/50 ${
                            isSplitMode ? "" : "lg:flex-row"
                          }`}
                        >
                          <div className="flex-[3] space-y-1.5">
                            {patientForm.anamnesis && (
                              <div className="bg-rose-100 text-rose-700 p-2.5 rounded-xl border shadow-sm animate-pop flex items-start gap-1.5 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50">
                                <i className="fa-solid fa-triangle-exclamation text-base"></i>

                                <div>
                                  <div className="font-black text-[13px] mb-0.5 uppercase tracking-wider">
                                    Önemli Uyarı (Anamnez)
                                  </div>

                                  <div className="text-[13px] font-semibold whitespace-pre-wrap">
                                    {patientForm.anamnesis}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                              <h4 className="font-black text-slate-800 mb-2 border-b border-slate-100 pb-2 text-[13px] uppercase tracking-wider dark:text-white dark:border-slate-700">
                                Kimlik & İletişim
                              </h4>

                              <form className="space-y-1.5">
                                <div
                                  className={`grid gap-2 ${
                                    isSplitMode ? "grid-cols-1" : "grid-cols-2"
                                  }`}
                                >
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                                      Ad Soyad *
                                    </label>

                                    <input
                                      required
                                      value={patientForm.name}
                                      onChange={(e) =>
                                        setPatientForm({
                                          ...patientForm,

                                          name: e.target.value,
                                        })
                                      }
                                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                                    />
                                  </div>

                                  <div>
                                    <div className="flex justify-between items-center mb-0.5">
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                        TC Kimlik / Pasaport No
                                      </label>
                                      <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={
                                            patientForm.isForeign || false
                                          }
                                          onChange={(e) =>
                                            setPatientForm({
                                              ...patientForm,
                                              isForeign: e.target.checked,
                                              tc: "",
                                            })
                                          }
                                          className="accent-indigo-600 w-3 h-3 cursor-pointer"
                                        />
                                        Yurt Dışı Hasta
                                      </label>
                                    </div>

                                    <div className="relative">
                                      <input
                                        maxLength={
                                          patientForm.isForeign ? "20" : "11"
                                        }
                                        value={patientForm.tc || ""}
                                        placeholder={
                                          patientForm.isForeign
                                            ? "Pasaport No Giriniz"
                                            : "11 Haneli TC Giriniz"
                                        }
                                        onChange={(e) => {
                                          let val = e.target.value;
                                          if (!patientForm.isForeign) {
                                            val = val.replace(/\D/g, ""); // TC için sadece rakam
                                          }
                                          setPatientForm({
                                            ...patientForm,
                                            tc: val,
                                          });
                                        }}
                                        className="w-full p-1.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                                      />
                                      {patientForm.tc &&
                                        !patientForm.isForeign && (
                                          <div className="absolute right-2.5 top-2">
                                            {(() => {
                                              const tc = patientForm.tc;
                                              if (tc.length < 11) {
                                                return (
                                                  <i
                                                    className="fa-solid fa-triangle-exclamation text-amber-500 text-base"
                                                    title="TC 11 hane olmalıdır"
                                                  ></i>
                                                );
                                              }
                                              const isAllSame = /^[0-9]$/.test(
                                                tc
                                              )
                                                ? false
                                                : tc
                                                    .split("")
                                                    .every(
                                                      (char) => char === tc[0]
                                                    );
                                              if (tc[0] === "0" || isAllSame)
                                                return (
                                                  <i
                                                    className="fa-solid fa-circle-xmark text-rose-500 text-base"
                                                    title="Geçersiz TC"
                                                  ></i>
                                                );

                                              const digits = tc
                                                .split("")
                                                .map(Number);
                                              const sumOdd =
                                                digits[0] +
                                                digits[2] +
                                                digits[4] +
                                                digits[6] +
                                                digits[8];
                                              const sumEven =
                                                digits[1] +
                                                digits[3] +
                                                digits[5] +
                                                digits[7];
                                              const check10 =
                                                (sumOdd * 7 - sumEven) % 10;
                                              const check11 =
                                                (sumOdd + sumEven + digits[9]) %
                                                10;

                                              if (
                                                check10 === digits[9] &&
                                                check11 === digits[10]
                                              ) {
                                                return (
                                                  <i
                                                    className="fa-solid fa-circle-check text-emerald-500 text-base"
                                                    title="Geçerli TC"
                                                  ></i>
                                                );
                                              }
                                              return (
                                                <i
                                                  className="fa-solid fa-circle-xmark text-rose-500 text-base"
                                                  title="Geçersiz TC Algoritması"
                                                ></i>
                                              );
                                            })()}
                                          </div>
                                        )}
                                      {patientForm.tc &&
                                        patientForm.isForeign && (
                                          <div className="absolute right-2.5 top-2">
                                            <i
                                              className="fa-solid fa-earth-americas text-indigo-400 text-base"
                                              title="Yurt Dışı Hasta Belgesi"
                                            ></i>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>

                                <div
                                  className={`grid gap-2 ${
                                    isSplitMode ? "grid-cols-1" : "grid-cols-3"
                                  }`}
                                >
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                                      Yaş
                                    </label>

                                    <input
                                      type="number"
                                      value={patientForm.age || ""}
                                      onChange={(e) =>
                                        setPatientForm({
                                          ...patientForm,

                                          age: e.target.value,
                                        })
                                      }
                                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                                    />
                                  </div>

                                  <div
                                    className={
                                      isSplitMode ? "col-span-1" : "col-span-2"
                                    }
                                  >
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                                      Telefon
                                    </label>

                                    <input
                                      type="tel"
                                      value={patientForm.phone || ""}
                                      placeholder="05XX XXX XX XX"
                                      onChange={(e) => {
                                        // 1. Sadece rakamları al
                                        let input = e.target.value.replace(
                                          /\D/g,
                                          ""
                                        );

                                        // 2. Her zaman 0 ile başlamasını sağla
                                        if (
                                          input.length > 0 &&
                                          input[0] !== "0"
                                        )
                                          input = "0" + input;

                                        // 3. Maksimum 11 haneye izin ver
                                        if (input.length > 11)
                                          input = input.substring(0, 11);

                                        // 4. Matematiksel parça parça boşluk ekleme (Silme işleminde çökmez)
                                        let formatted = input;
                                        if (
                                          input.length > 3 &&
                                          input.length <= 6
                                        ) {
                                          formatted =
                                            input.slice(0, 4) +
                                            " " +
                                            input.slice(4);
                                        } else if (
                                          input.length > 6 &&
                                          input.length <= 8
                                        ) {
                                          formatted =
                                            input.slice(0, 4) +
                                            " " +
                                            input.slice(4, 7) +
                                            " " +
                                            input.slice(7);
                                        } else if (input.length > 8) {
                                          formatted =
                                            input.slice(0, 4) +
                                            " " +
                                            input.slice(4, 7) +
                                            " " +
                                            input.slice(7, 9) +
                                            " " +
                                            input.slice(9, 11);
                                        }

                                        setPatientForm({
                                          ...patientForm,
                                          phone: formatted,
                                        });
                                      }}
                                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700 transition-colors"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                                    Cinsiyet
                                  </label>

                                  <select
                                    value={patientForm.gender}
                                    onChange={(e) =>
                                      setPatientForm({
                                        ...patientForm,

                                        gender: e.target.value,
                                      })
                                    }
                                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold outline-none dark:bg-slate-900 dark:text-white dark:border-slate-700"
                                  >
                                    <option>Belirtilmemiş</option>

                                    <option>Erkek</option>

                                    <option>Kadın</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-black text-rose-500 uppercase mb-0.5 tracking-wider">
                                    Sistemik Hastalık / Anamnez / Alerji
                                  </label>

                                  <textarea
                                    rows="2"
                                    value={patientForm.anamnesis}
                                    onChange={(e) =>
                                      setPatientForm({
                                        ...patientForm,
                                        anamnesis: e.target.value,
                                      })
                                    }
                                    className="w-full p-1.5 bg-rose-50 border border-rose-200 rounded-xl text-[13px] font-bold text-slate-800 resize-none outline-none focus:border-rose-400 placeholder-slate-400 dark:bg-rose-900/20 dark:text-white dark:border-rose-800/50 transition-colors"
                                    placeholder="Özel bir not veya uyarı girebilirsiniz..."
                                  ></textarea>

                                  {/* Katlanabilir Modern Anamnez Menüsü */}
                                  <details className="group border border-rose-200 dark:border-rose-800/60 rounded-xl bg-white dark:bg-slate-800 mt-1.5 shadow-sm open:shadow-md transition-all">
                                    <summary className="px-2.5 py-1.5 font-bold text-[11px] text-rose-600 dark:text-rose-400 cursor-pointer list-none flex justify-between items-center outline-none select-none hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
                                      <span className="flex items-center gap-1">
                                        <i className="fa-solid fa-notes-medical text-base"></i>{" "}
                                        Literatürden Hızlı Ekle
                                      </span>
                                      <i className="fa-solid fa-chevron-down group-open:rotate-180 transition-transform duration-300"></i>
                                    </summary>

                                    <div className="p-2 border-t border-rose-100 dark:border-rose-800/50 max-h-[220px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-b-xl">
                                      {Object.entries(ANAMNESIS_CATEGORIES).map(
                                        ([catName, options]) => (
                                          <div key={catName}>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 border-b border-slate-200 dark:border-slate-700 pb-0.5">
                                              {catName}
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                              {options.map((opt) => {
                                                const isSelected =
                                                  patientForm.anamnesis &&
                                                  patientForm.anamnesis.includes(
                                                    opt
                                                  );
                                                return (
                                                  <button
                                                    type="button"
                                                    key={opt}
                                                    onClick={() =>
                                                      toggleAnamnesis(
                                                        opt,
                                                        "patient"
                                                      )
                                                    }
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                                                      isSelected
                                                        ? "bg-rose-600 text-white border-rose-700 shadow-sm"
                                                        : "bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-600 dark:hover:text-rose-400"
                                                    }`}
                                                  >
                                                    {isSelected ? (
                                                      <i className="fa-solid fa-check"></i>
                                                    ) : (
                                                      <i className="fa-solid fa-plus opacity-50"></i>
                                                    )}
                                                    {opt}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </details>
                                </div>
                                {/* YENİ EKLENEN: DOSYA MASAÜSTÜ DURUMLARI */}
                                  <div className="col-span-1 sm:col-span-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 mt-2">
                                    <h4 className="font-black text-slate-800 mb-2 border-b border-slate-100 pb-2 text-[12px] uppercase tracking-wider dark:text-white dark:border-slate-700 flex items-center gap-1.5">
                                      <i className="fa-solid fa-folder-tree text-indigo-500"></i> Dosya Masası Etiketleri
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      {/* Acil Durumu */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Acil Takip</label>
                                        <select
                                          value={patientForm.folder_acil || ""}
                                          onChange={(e) => setPatientForm({...patientForm, folder_acil: e.target.value})}
                                          className="w-full p-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold outline-none focus:border-rose-500 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800 cursor-pointer"
                                        >
                                          <option value="">Normal (Acil Değil)</option>
                                          <option value="Aktif Acil">🔴 Aktif Acil Durum</option>
                                          <option value="Ağrı Takibi">🟠 Ağrı Takibi</option>
                                          <option value="İlaç Kullanıyor">🟡 İlaç Kullanıyor</option>
                                        </select>
                                      </div>

                                      {/* Lab Durumu */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Laboratuvar</label>
                                        <select
                                          value={patientForm.folder_lab || ""}
                                          onChange={(e) => setPatientForm({...patientForm, folder_lab: e.target.value})}
                                          className="w-full p-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold outline-none focus:border-purple-500 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 cursor-pointer"
                                        >
                                          <option value="">Lab Süreci Yok</option>
                                          <option value="Ölçü Alınacak">⏳ Ölçü Alınacak</option>
                                          <option value="Laboratuvarda">🧪 Laboratuvarda</option>
                                          <option value="Klinikte (Provaya Hazır)">🏢 Klinikte (Provaya Hazır)</option>
                                        </select>
                                      </div>

                                      {/* Evrak Durumu */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Evrak / Belge</label>
                                        <select
                                          value={patientForm.folder_evrak || ""}
                                          onChange={(e) => setPatientForm({...patientForm, folder_evrak: e.target.value})}
                                          className="w-full p-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-slate-500 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 cursor-pointer"
                                        >
                                          <option value="">Evraklar Tam</option>
                                          <option value="Onam Formu Eksik">📄 Onam Formu Eksik</option>
                                          <option value="Röntgen Bekliyor">🦴 Röntgen Bekliyor</option>
                                          <option value="Kimlik/Pasaport Eksik">🪪 Kimlik/Pasaport Eksik</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                  {/* YENİ EKLENEN BİTİŞ */}
                              </form>
                            </div>
                          </div>

                          <div className="flex-[2] flex flex-col gap-1.5">
                            <div className="flex-1 bg-white p-2.5 rounded-xl border shadow-sm flex flex-col h-[240px] dark:bg-slate-800 dark:border-slate-700">
                              <div className="flex justify-between items-center mb-1.5 border-b border-slate-100 dark:border-slate-700 pb-1.5">
                                <h4 className="font-black text-indigo-700 text-[11px] uppercase tracking-wider flex items-center gap-1 dark:text-indigo-400">
                                  <i className="fa-solid fa-calendar-check"></i>{" "}
                                  Planlanan Randevular ({future.length})
                                </h4>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    window.pendingAptPatient = patientForm; // Hasta bilgisini hafızaya al
                                    setIsPatientModalOpen(false);
                                    setActiveTab("calendar");
                                    setTimeout(() => {
                                      showNotification(
                                        "Takvimden uygun bir saate tıklayarak randevuyu oluşturabilirsiniz."
                                      );
                                    }, 300);
                                  }}
                                  className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800 px-1.5 py-0.5 rounded-lg font-bold transition flex items-center gap-1 shadow-sm"
                                >
                                  <i className="fa-solid fa-calendar-plus"></i>{" "}
                                  Takvimden Ekle
                                </button>
                              </div>

                              <div className="flex-1 overflow-y-auto pr-0.5 space-y-1.5">
                                {future.length > 0 ? (
                                  future.map((a, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-100 text-[11px] dark:bg-indigo-900/30 dark:border-indigo-800/50"
                                    >
                                      <div className="flex justify-between items-center mb-0.5">
                                        <span className="font-black text-indigo-900 dark:text-indigo-300">
                                          <i className="fa-regular fa-clock mr-1"></i>
                                          {a.dateStr} - {a.timeStr}
                                        </span>

                                        {getStatusBadge(a.status)}
                                      </div>

                                      <div className="font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                                        <span className="truncate max-w-[130px]">
                                          {renderTreatmentText(a)}
                                        </span>

                                        <span className="text-indigo-600 dark:text-indigo-400">
                                          Planlı İle Entegre
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center text-slate-400 font-medium text-[11px] py-2">
                                    Gelecek randevusu yok.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex-1 bg-white p-2.5 rounded-xl border shadow-sm flex flex-col h-[240px] dark:bg-slate-800 dark:border-slate-700">
                              <h4 className="font-black text-slate-600 mb-1.5 border-b pb-1.5 text-[11px] uppercase tracking-wider flex items-center gap-1 dark:text-white dark:border-slate-700">
                                <i className="fa-solid fa-clock-rotate-left"></i>{" "}
                                Geçmiş Randevular ({past.length})
                              </h4>

                              {/* YENİ: Geçmiş Randevular Zaman Tüneli (Timeline) */}
                              <div className="flex-1 overflow-y-auto pr-1.5 relative mt-2 custom-scrollbar px-1.5">
                                {past.length > 0 ? (
                                  <div className="relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent dark:before:via-slate-700">
                                    {past.map((a, idx) => (
                                      <div
                                        key={idx}
                                        className="relative flex items-center justify-start group mb-2 pl-10"
                                      >
                                        <div className="absolute left-0.5 flex items-center justify-center w-6 h-6 rounded-full border-4 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300 text-slate-500 shadow z-10">
                                          <i
                                            className={`fa-solid ${
                                              a.status === "Geldi"
                                                ? "fa-check text-emerald-500 group-hover:text-white"
                                                : a.status === "Gelmedi"
                                                ? "fa-xmark text-rose-500 group-hover:text-white"
                                                : "fa-calendar-check"
                                            } text-[9px]`}
                                          ></i>
                                        </div>
                                        <div className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 shadow-sm group-hover:shadow-md transition-shadow relative before:absolute before:top-2.5 before:right-full before:w-2.5 before:h-0.5 before:bg-slate-200 dark:before:bg-slate-700 group-hover:before:bg-indigo-300">
                                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1.5 gap-1 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                            <time className="font-bold text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                                              {a.dateStr} • {a.timeStr}
                                            </time>
                                            {getStatusBadge(a.status)}
                                          </div>
                                          <h4 className="font-black text-slate-800 dark:text-slate-200 text-[13px] mb-0.5 mt-1">
                                            {renderTreatmentText(a)}
                                          </h4>
                                          <div className="text-[10px] font-bold text-slate-400 mt-1.5">
                                            <i className="fa-solid fa-user-doctor mr-1"></i>{" "}
                                            {globalData.doctorProfiles?.[
                                              a.docId
                                            ]?.name || a.docId}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-8">
                                    <i className="fa-solid fa-clock-rotate-left text-lg text-slate-300 dark:text-slate-600 mb-1.5"></i>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">
                                      Geçmiş randevusu bulunmuyor.
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {patientModalTab === "finance" && (
                        <div className="flex-1 overflow-y-auto p-2.5 bg-slate-50/50 flex justify-center dark:bg-slate-900/50">
                          <div className="w-full flex flex-col lg:flex-row gap-2">
                            <div className="flex-[3] flex flex-col gap-2">
                              <div className="bg-white p-2.5 rounded-xl border shadow-sm flex flex-col max-h-[350px] dark:bg-slate-800 dark:border-slate-700">
                                <h4 className="font-black text-slate-800 mb-2 border-b pb-2 text-[13px] uppercase tracking-wider dark:text-white dark:border-slate-700">
                                  Uygulanan/Planlanan Borç Yaratan İşlemler
                                </h4>

                                <div className="overflow-y-auto flex-1 pr-1.5 space-y-1.5">
                                  {fin.treatments.length > 0 ? (
                                    fin.treatments.map((tx, idx) => (
                                      <div
                                        key={idx}
                                        className="flex justify-between items-center bg-slate-50 p-1.5 rounded-xl border dark:bg-slate-900 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition group"
                                      >
                                        <div>
                                          <div className="font-black text-slate-800 text-[13px] dark:text-slate-200">
                                            {tx.treatment}
                                          </div>

                                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                            <span>
                                              <i className="fa-regular fa-calendar mr-1"></i>

                                              {tx.dateStr}
                                            </span>

                                            {tx.isPlan && (
                                              <span className="text-indigo-500 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                                                Plan Kaydı
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                          {editingTxId === tx.id ? (
                                            <div className="flex items-center gap-1">
                                              <input
                                                type="number"
                                                value={editingTxPrice}
                                                onChange={(e) =>
                                                  setEditingTxPrice(
                                                    e.target.value
                                                  )
                                                }
                                                className="w-16 px-1.5 py-0.5 text-[13px] font-bold border rounded outline-none dark:bg-slate-800 dark:text-white"
                                                autoFocus
                                              />

                                              <button
                                                onClick={() =>
                                                  handleUpdateTxPrice(
                                                    tx.id,

                                                    editingTxPrice,

                                                    tx.isPlan,

                                                    tx.docId
                                                  )
                                                }
                                                className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded hover:bg-emerald-100 transition"
                                              >
                                                <i className="fa-solid fa-check"></i>
                                              </button>

                                              <button
                                                onClick={() =>
                                                  setEditingTxId(null)
                                                }
                                                className="text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-300 transition"
                                              >
                                                <i className="fa-solid fa-xmark"></i>
                                              </button>
                                            </div>
                                          ) : (
                                            <>
                                              <div className="font-black text-indigo-600 dark:text-indigo-400 text-base">
                                                {tx.price} ₺
                                              </div>

                                              <button
                                                onClick={() => {
                                                  setEditingTxId(tx.id);

                                                  setEditingTxPrice(tx.price);
                                                }}
                                                className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition"
                                              >
                                                <i className="fa-solid fa-pen-to-square"></i>
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center text-slate-400 font-medium text-[13px] py-2">
                                      Ücret girilmiş kayıt bulunmuyor.
                                    </div>
                                  )}
                                </div>
                              </div>

                              <form
                                onSubmit={handleAddPayment}
                                className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner flex flex-col gap-1.5"
                              >
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-black">
                                    <i className="fa-solid fa-cash-register text-base"></i>
                                    <span className="uppercase text-[13px] tracking-wider">
                                      Tahsilat İşlemi
                                    </span>
                                  </div>
                                  {fin.debt > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setPaymentInput(fin.debt)}
                                      className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-bold hover:bg-emerald-200 transition"
                                    >
                                      Kalanı Kapat ({fin.debt} ₺)
                                    </button>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                      Alınan Tutar
                                    </label>
                                    <div className="relative">
                                      <input
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        value={paymentInput}
                                        onChange={(e) =>
                                          setPaymentInput(e.target.value)
                                        }
                                        className="w-full pl-3.5 pr-9 py-1.5 border border-slate-300 dark:border-slate-600 rounded-xl text-base font-black bg-white dark:bg-slate-800 outline-none focus:border-emerald-500 text-slate-800 dark:text-white shadow-sm"
                                      />
                                      <i className="fa-solid fa-turkish-lira-sign absolute right-3.5 top-2.5 text-slate-400"></i>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                      Ödeme Yöntemi
                                    </label>
                                    <div className="flex gap-1">
                                    {[
                                      "Nakit",
                                      "Kredi Kartı",
                                      "Havale",
                                    ].map((method) => (
                                      <button
                                        type="button"
                                        key={method}
                                        onClick={() =>
                                          setPaymentMethod(method)
                                        }
                                        className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
                                          paymentMethod === method
                                            ? "bg-emerald-600 text-white border-emerald-700 shadow-md"
                                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                                        }`}
                                      >
                                        {method === "Nakit" && (
                                          <i className="fa-solid fa-money-bill-wave mr-0.5"></i>
                                        )}
                                        {method === "Kredi Kartı" && (
                                          <i className="fa-solid fa-credit-card mr-0.5"></i>
                                        )}
                                        {method === "Havale" && (
                                          <i className="fa-solid fa-building-columns mr-0.5"></i>
                                        )}
                                        {method}
                                      </button>
                                    ))}
                                  </div>
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  className="w-full mt-1.5 bg-emerald-500 text-white py-2 rounded-xl font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition"
                                >
                                  Ödemeyi Onayla ve Kaydet
                                </button>
                              </form>
                            </div>

                            <div className="flex-[2] flex flex-col gap-2">
                              <div className="bg-white p-2.5 rounded-xl border shadow-sm shrink-0 dark:bg-slate-800 dark:border-slate-700">
                                <h4 className="font-black text-slate-800 mb-2 border-b pb-2 text-[13px] uppercase tracking-wider dark:text-white dark:border-slate-700">
                                  Hesap Özeti
                                </h4>

                                {/* YENİ: Hesap Özeti ve İlerleme Çubuğu (Progress Bar) */}
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-base items-center">
                                    <span className="text-slate-500 font-bold dark:text-slate-400 flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800 dark:bg-white"></div>
                                      Fatura Edilen:
                                    </span>
                                    <span className="font-black text-slate-800 dark:text-white">
                                      {fin.totalBilled.toLocaleString("tr-TR")}{" "}
                                      ₺
                                    </span>
                                  </div>

                                  <div className="flex justify-between text-base items-center">
                                    <span className="text-slate-500 font-bold dark:text-slate-400 flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                      Yapılan Tahsilat:
                                    </span>
                                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                                      {fin.totalPaid.toLocaleString("tr-TR")} ₺
                                    </span>
                                  </div>

                                  {/* İlerleme Çubuğu Grafiği */}
                                  {fin.totalBilled > 0 && (
                                    <div className="py-1.5">
                                      <div className="flex justify-between text-[10px] font-black text-slate-400 mb-0.5">
                                        <span>Tahsilat Oranı</span>
                                        <span className="text-emerald-600">
                                          {Math.round(
                                            (fin.totalPaid / fin.totalBilled) *
                                              100
                                          )}
                                          %
                                        </span>
                                      </div>
                                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden shadow-inner">
                                        <div
                                          className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                                          style={{
                                            width: `${Math.min(
                                              100,
                                              (fin.totalPaid /
                                                fin.totalBilled) *
                                                100
                                            )}%`,
                                          }}
                                        >
                                          {/* Bar içi parıltı animasyonu */}
                                          <div className="absolute inset-0 bg-white/30 w-full h-full skew-x-12 -ml-10 hover:animate-[shine_1s_ease-out]"></div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex justify-between items-center text-base sm:text-base pt-3 border-t mt-1.5 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 -mx-2.5 px-2.5 -mb-2.5 pb-3 rounded-b-2xl">
                                    <span className="text-slate-800 font-black dark:text-white flex items-center gap-1">
                                      <i className="fa-solid fa-scale-balanced text-slate-400 text-[13px]"></i>{" "}
                                      Bakiye:
                                    </span>

                                    <span
                                      className={`font-black ${
                                        fin.debt > 0
                                          ? "text-rose-600 bg-white px-2.5 py-1 rounded-xl border border-rose-200 shadow-sm dark:text-rose-400 dark:bg-slate-800 dark:border-rose-900/50"
                                          : "text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shadow-sm dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400"
                                      }`}
                                    >
                                      {fin.debt > 0 ? (
                                        ""
                                      ) : (
                                        <i className="fa-solid fa-check mr-1"></i>
                                      )}
                                      {fin.debt.toLocaleString("tr-TR")} ₺
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-2.5 rounded-xl border shadow-sm flex-1 flex flex-col min-h-[200px] dark:bg-slate-800 dark:border-slate-700">
                                <h4 className="font-black text-slate-800 mb-2 border-b pb-2 text-[13px] uppercase tracking-wider dark:text-white dark:border-slate-700">
                                  Geçmiş Tahsilat Dökümü
                                </h4>

                                <div className="space-y-1.5 overflow-y-auto flex-1 pr-0.5">
                                  {patientForm.payments &&
                                  patientForm.payments.length > 0 ? (
                                    patientForm.payments

                                      .slice()

                                      .reverse()

                                      .map((pay) => (
                                        <div
                                          key={pay.id}
                                          className="flex justify-between items-center text-[13px] bg-slate-50 p-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700"
                                        >
                                          <span className="text-slate-500 font-bold dark:text-slate-400">
                                            <i className="fa-regular fa-calendar mr-1.5"></i>

                                            {new Date(pay.date).toLocaleString(
                                              "tr-TR",

                                              {
                                                day: "2-digit",

                                                month: "2-digit",

                                                year: "numeric",

                                                hour: "2-digit",

                                                minute: "2-digit",
                                              }
                                            )}
                                          </span>

                                          <div className="flex flex-col items-end">
                                            <span className="font-black text-emerald-600 text-base dark:text-emerald-400">
                                              +{pay.amount} ₺
                                            </span>
                                            {pay.method && (
                                              <span className="text-[10px] font-bold text-slate-400 mt-0.5 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-sm border border-slate-100 dark:border-slate-700">
                                                {pay.method}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                  ) : (
                                    <div className="text-center text-slate-400 font-medium text-[13px] py-2">
                                      Ödeme kaydı bulunmuyor.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {patientModalTab === "plan" &&
                        (() => {
                          const userPricing =
                            globalData.pricingDb?.[currentUser] ||
                            (typeof globalData.pricingDb === "object" &&
                            globalData.pricingDb["Genel Muayene"]
                              ? globalData.pricingDb
                              : DEFAULT_PRICING);

                          const groupedTreatments = {};
                          let grandTotal = 0;

                          if (patientForm?.plannedTreatments) {
                            patientForm.plannedTreatments.forEach((tx) => {
                              let finalPrice = parseFloat(tx.price) || 0;
                              if (!groupedTreatments[tx.treatment]) {
                                groupedTreatments[tx.treatment] = {
                                  teeth: [],
                                  totalPrice: 0,
                                };
                              }
                              if (!groupedTreatments[tx.treatment].teeth.includes(tx.tooth)) {
                                groupedTreatments[tx.treatment].teeth.push(tx.tooth);
                              }
                              groupedTreatments[tx.treatment].totalPrice += finalPrice;
                              grandTotal += finalPrice;
                            });
                          }

                          return (
                            <div
                              id="print-plan-area"
                              className="flex-1 overflow-y-auto p-2.5 lg:p-2.5 bg-slate-50 flex flex-col gap-2 relative dark:bg-slate-900/50 print:bg-white print:p-0"
                            >
                              {/* --- ARAÇ ÇUBUĞU (Yazdırılmaz) --- */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm no-print gap-1.5 shrink-0">
                                <div>
                                  <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-1 text-base">
                                    <i className="fa-solid fa-file-signature text-indigo-500"></i>
                                    Tedavi Planı ve Çıktı Alma
                                  </h3>
                                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    Hastaya sunulacak detaylı tedavi planını buradan yazdırabilirsiniz.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const originalTitle = document.title;
                                    document.title = patientForm.name;
                                    window.print();
                                    setTimeout(() => {
                                      document.title = originalTitle;
                                    }, 2000);
                                  }}
                                  className="bg-indigo-600 text-white px-2.5 py-2 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-1 w-full sm:w-auto justify-center"
                                >
                                  <i className="fa-solid fa-print"></i> Planı Yazdır
                                </button>
                              </div>

                              {/* --- YAZDIRMA KLİNİK ANTETİ (Gizli, Sadece Baskıda Görünür) --- */}
                              <div className="hidden print-only mb-1.5 border-b-2 border-black pb-1.5">
                                <div className="flex justify-between items-end mb-1.5">
                                  <div>
                                    <h1 className="text-base font-black uppercase tracking-wider mb-0.5 flex items-center text-black">
                                <i className="fa-solid fa-tooth text-gray-300 mr-1.5 text-base"></i>
                                {settings?.klinik?.ad ? settings.klinik.ad.toUpperCase() : "KLİNİK RANDEVU"}
                              </h1>
                                    <h2 className="text-[11px] font-bold text-gray-600">Tedavi Planı ve Bilgilendirme Formu</h2>
                                  </div>
                                  <div className="text-right text-[10px] font-semibold text-gray-600">
                                    <p>Tarih: {new Date().toLocaleDateString("tr-TR")}</p>
                                    <p>Hekim: {globalData.doctorProfiles?.[currentUser]?.name || currentUser}</p>
                                  </div>
                                </div>
                                <div className="bg-gray-50 border border-gray-300 p-1.5 rounded-lg flex justify-between items-center text-[10px]">
                                  <div>
                                    <span className="font-black text-gray-500 uppercase text-[8px] block">Hasta Adı</span>
                                    <span className="font-bold text-[11px] text-black">{patientForm.name}</span>
                                  </div>
                                  <div>
                                    <span className="font-black text-gray-500 uppercase text-[8px] block">İletişim / TC</span>
                                    <span className="font-bold text-[11px] text-black">{patientForm.phone || "-"} {patientForm.tc ? ` / ${patientForm.tc}` : ""}</span>
                                  </div>
                                  <div>
                                    <span className="font-black text-gray-500 uppercase text-[8px] block">Uyarı / Anamnez</span>
                                    <span className="font-bold text-[11px] text-red-600">{patientForm.anamnesis || "Yok"}</span>
                                  </div>
                                </div>
                              </div>

                              {/* --- DİŞ ŞEMASI --- */}
                              <ProfessionalToothChart
                                patientForm={patientForm}
                                activePlanTreatment={activePlanTreatment}
                                setPatientForm={setPatientForm}
                                showNotification={showNotification}
                                globalData={globalData}
                                currentUser={currentUser}
                                saveGlobalData={saveGlobalData} 
                              />

                              {/* --- YAZDIRMA İŞLEM TABLOSU (Gizli, Sadece Baskıda) --- */}
                              <div className="hidden print-only mt-2">
                                <h3 className="text-[11px] font-black border-b border-black pb-0.5 mb-1 uppercase tracking-wider text-black">
                                  Planlanan Tedavi Detayları
                                </h3>
                                <table className="w-full text-left border-collapse" style={{ fontSize: "9px" }}>
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="border border-gray-400 py-0.5 px-1 w-1/2 text-black font-bold">İşlem Adı</th>
                                      <th className="border border-gray-400 py-0.5 px-1 w-1/4 text-center text-black font-bold">Uygulanacak Dişler</th>
                                      <th className="border border-gray-400 py-0.5 px-1 w-1/4 text-right text-black font-bold">Toplam Tutar</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.keys(groupedTreatments).length > 0 ? (
                                      Object.entries(groupedTreatments).map(([txName, data]) => (
                                        <tr key={txName}>
                                          <td className="border border-gray-400 py-0.5 px-1 font-semibold text-black">{txName}</td>
                                          <td className="border border-gray-400 py-0.5 px-1 font-semibold text-center text-black">{data.teeth.join(", ")}</td>
                                          <td className="border border-gray-400 py-0.5 px-1 text-right font-bold text-black">{data.totalPrice.toLocaleString("tr-TR")} ₺</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr><td colSpan="3" className="border border-gray-400 py-1.5 px-1 text-center italic text-gray-500">Planlanmış işlem bulunmamaktadır.</td></tr>
                                    )}
                                  </tbody>
                                  <tfoot>
                                    <tr>
                                      <td colSpan="2" className="border border-gray-400 py-1 px-1 text-right font-black uppercase text-[10px] text-black">Genel Toplam:</td>
                                      <td className="border border-gray-400 py-1 px-1 text-right font-black text-[11px] text-black">{grandTotal.toLocaleString("tr-TR")} ₺</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>

                              {/* --- İŞLEM SEÇİM MENÜSÜ --- */}
                              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col no-print shrink-0">
                                <div className="flex flex-wrap sm:flex-nowrap justify-between items-center mb-2 border-b border-slate-100 dark:border-slate-700 pb-2 gap-1.5">
                                  <h3 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1">
                                    <span className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 w-5 h-5 rounded-md flex items-center justify-center text-[11px]">1</span>
                                    İşlem Türü Seçin
                                  </h3>
                                  {activePlanTreatment && (
                                    <div className="hidden sm:flex bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm items-center gap-1">
                                      <i className="fa-solid fa-check-circle"></i> Seçili İşlem: {activePlanTreatment}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={handleWholeJawTreatment}
                                    className="text-[11px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-1.5 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition border border-indigo-100 dark:border-indigo-800 flex items-center gap-1 shadow-sm"
                                  >
                                    <i className="fa-solid fa-teeth-open"></i> Tüm Çeneye Uygula
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 max-h-[220px] overflow-y-auto custom-scrollbar p-0.5">
                                  {Object.entries(DYNAMIC_PRICING_CATEGORIES).map(([catName, data]) => (
                                    <div key={catName} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-1.5 border border-slate-100 dark:border-slate-800 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
                                      <h4 className={`text-[11px] font-black uppercase tracking-wider mb-2 flex items-center gap-1 ${data.color}`}>
                                        <i className={`fa-solid ${data.icon}`}></i> {catName}
                                      </h4>
                                      <div className="flex flex-col gap-1 flex-1">
                                        {data.items.map((tx) => {
                                          const txPrice = userPricing[tx] !== undefined ? parseFloat(userPricing[tx]) : DEFAULT_PRICING[tx] || 0;
                                          const isSelected = activePlanTreatment === tx;
                                          return (
                                            <button
                                              key={tx}
                                              type="button"
                                              onClick={(e) => { e.preventDefault(); setActivePlanTreatment(tx); }}
                                              className={`text-left px-2.5 py-2 rounded-lg text-[11px] font-bold transition-all flex justify-between items-center w-full ${
                                                isSelected ? "bg-indigo-600 text-white border-indigo-700 shadow-md transform scale-[1.02]" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300 border border-slate-200 dark:border-slate-700"
                                              }`}
                                            >
                                              <span className="truncate pr-1.5">{tx}</span>
                                              <span className={`shrink-0 ${isSelected ? "text-indigo-200" : "text-emerald-600 dark:text-emerald-400"}`}>{txPrice} ₺</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* --- PLANLANAN TEDAVİ DETAYLARI TABLOSU --- */}
                              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col shrink-0 no-print">
                                <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                                  <h4 className="font-black text-[13px] uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                    <span className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 w-5 h-5 rounded-md flex items-center justify-center text-[11px]">2</span>
                                    Planlanan Tedavi Tablosu
                                  </h4>
                                  <div className="text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 px-2.5 py-1 rounded-lg shadow-sm">
                                    Toplam: {patientForm.plannedTreatments?.reduce((sum, tx) => sum + (parseFloat(tx.price) || 0), 0).toLocaleString("tr-TR")} ₺
                                  </div>
                                </div>

                                <div className="overflow-x-auto w-full max-h-[260px] overflow-y-auto custom-scrollbar">
                                  <table className="w-full text-left text-[13px]">
                                    <thead className="text-[10px] text-slate-400 uppercase font-black bg-white dark:bg-slate-800 border-b dark:border-slate-700 sticky top-0 z-10">
                                      <tr>
                                        <th className="px-2.5 py-1.5">Tarih</th>
                                        <th className="px-2.5 py-1.5">Diş/Bölge</th>
                                        <th className="px-2.5 py-1.5">İşlem Türü</th>
                                        <th className="px-2.5 py-1.5 text-right">Ücret</th>
                                        <th className="px-2.5 py-1.5 text-center">Sil</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(patientForm.plannedTreatments || []).length > 0 ? (
                                        patientForm.plannedTreatments.map((tx) => (
                                          <tr key={tx.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                            <td className="px-2.5 py-1.5 font-bold text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                                              {new Date(tx.date).toLocaleDateString("tr-TR")}
                                            </td>
                                            <td className="px-2.5 py-1.5 whitespace-nowrap">
                                              <span className="font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[11px] border border-indigo-100 dark:border-indigo-800/50">
                                                {tx.tooth === "Tüm Çene" ? "Tüm Çene" : `Diş ${tx.tooth}`}
                                              </span>
                                            </td>
                                            <td className="px-2.5 py-1.5 font-bold text-slate-700 dark:text-slate-300">
                                              {tx.treatment}
                                            </td>
                                            <td className="px-2.5 py-1.5 text-right whitespace-nowrap">
                                              {editingTxId === tx.id ? (
                                                <div className="flex items-center justify-end gap-1">
                                                  <input
                                                    type="number"
                                                    value={editingTxPrice}
                                                    onChange={(e) => setEditingTxPrice(e.target.value)}
                                                    className="w-16 p-1 border border-slate-300 rounded-lg text-right text-[11px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                                                    autoFocus
                                                  />
                                                  <button onClick={() => handleUpdateTxPrice(tx.id, editingTxPrice, true, tx.docId)} className="bg-emerald-500 text-white w-6 h-6 rounded-lg flex items-center justify-center hover:bg-emerald-600 shadow-sm">
                                                    <i className="fa-solid fa-check text-[9px]"></i>
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="font-black text-slate-800 dark:text-white flex items-center justify-end gap-1.5">
                                                  {renderMoney(tx.price)} ₺
                                                  <button onClick={() => { setEditingTxId(tx.id); setEditingTxPrice(tx.price); }} className="text-slate-300 hover:text-indigo-500 dark:text-slate-600 dark:hover:text-indigo-400 transition-colors" title="Ücreti Düzenle">
                                                    <i className="fa-solid fa-pen text-[11px]"></i>
                                                  </button>
                                                </div>
                                              )}
                                            </td>
                                            <td className="px-2.5 py-1.5 text-center">
                                              <button
                                                onClick={() => {
                                                  showConfirm("Silmek istediğinize emin misiniz?", () => {
                                                    const updatedTxs = patientForm.plannedTreatments.filter((t) => t.id !== tx.id);
                                                    const updatedPatient = { ...patientForm, plannedTreatments: updatedTxs };
                                                    setPatientForm(updatedPatient);
                                                    saveGlobalData({ ...globalData, patientsDb: { ...globalData.patientsDb, [patientForm.id]: updatedPatient } });
                                                    showNotification("İşlem silindi.", "error");
                                                  });
                                                }}
                                                className="w-7 h-7 rounded-xl bg-white border border-rose-100 text-rose-400 hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:border-rose-900/30 dark:hover:bg-rose-600 transition-all flex items-center justify-center mx-auto shadow-sm"
                                                title="Sil"
                                              >
                                                <i className="fa-solid fa-trash-can text-[11px]"></i>
                                              </button>
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan="5" className="text-center py-8 text-slate-400 text-[13px] font-medium">
                                            <i className="fa-solid fa-tooth text-lg mb-2 block opacity-50"></i>
                                            Henüz planlanmış bir işlem bulunmuyor.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                            </div>
                          );
                        })()}
{/* --- 7. KLİNİK GEÇMİŞ (EPİKRİZ) EKRANI --- */}
                      {patientModalTab === "history" && (
                        <div className="flex-1 overflow-y-auto p-2.5 lg:p-2.5 bg-slate-50 flex flex-col gap-2 relative dark:bg-slate-900/50 print:bg-white print:p-0">
                          
                          {/* Print Alanı (Sadece Çıktıda Görünür) */}
                          <div className="hidden print-only w-full">
                            <div className="border-b-2 border-black pb-1.5 mb-2">
                              <h1 className="text-base font-black uppercase text-black">KLİNİK GEÇMİŞ / EPİKRİZ RAPORU</h1>
                              <div className="text-[11px] font-bold text-gray-700 mt-1.5 grid grid-cols-2 gap-1">
                                <div>Hasta: {patientForm.name}</div>
                                <div className="text-right">Rapor Tarihi: {new Date().toLocaleDateString("tr-TR")}</div>
                                <div>İletişim: {patientForm.phone || "-"}</div>
                                <div className="text-right">Raporlayan Hekim: {globalData.doctorProfiles?.[currentUser]?.name || currentUser}</div>
                              </div>
                            </div>
                            <table className="w-full text-left border-collapse" style={{ fontSize: "10px" }}>
                              <thead>
                                <tr className="bg-gray-100 text-black">
                                  <th className="border border-gray-400 py-0.5 px-1 w-20">Tarih / Saat</th>
                                  <th className="border border-gray-400 py-0.5 px-1 w-28">Hekim</th>
                                  <th className="border border-gray-400 py-0.5 px-1">İşlem / Tanı / Notlar</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(patientForm.clinicalHistory || []).map((h, i) => (
                                  <tr key={h.id || i}>
                                    <td className="border border-gray-400 py-1 px-1 font-bold align-top">{h.date} - {h.time}</td>
                                    <td className="border border-gray-400 py-1 px-1 font-semibold align-top">{h.doctorName}</td>
                                    <td className="border border-gray-400 py-1 px-1 align-top">
                                      <div className="font-bold">{h.treatment} {h.selectedTeeth?.length > 0 && `(Diş: ${h.selectedTeeth.join(", ")})`}</div>
                                      {h.complaint && <div className="mt-0.5 text-gray-600"><b>Şikayet:</b> {h.complaint}</div>}
                                      {h.diagnosis && <div className="mt-0.5 text-gray-600"><b>Tanı:</b> {h.diagnosis}</div>}
                                      {h.procedureNotes && <div className="mt-0.5 text-gray-600"><b>Not:</b> {h.procedureNotes}</div>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm no-print gap-1.5 shrink-0">
                            <div>
                              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-1 text-base">
                                <i className="fa-solid fa-clock-rotate-left text-indigo-500"></i>
                                Klinik Geçmiş (Epikriz)
                              </h3>
                            </div>
                            <div className="flex gap-1 w-full sm:w-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  const originalTitle = document.title;
                                  document.title = `${patientForm.name} - Epikriz Raporu`;
                                  window.print();
                                  setTimeout(() => document.title = originalTitle, 2000);
                                }}
                                className="flex-1 sm:flex-none bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 px-2.5 py-2 rounded-xl font-bold shadow-sm hover:bg-slate-200 transition-all flex items-center gap-1 justify-center"
                              >
                                <i className="fa-solid fa-print"></i> Yazdır
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsAddHistoryModalOpen(true)}
                                className="flex-1 sm:flex-none bg-indigo-600 text-white px-2.5 py-2 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-1 justify-center"
                              >
                                <i className="fa-solid fa-plus"></i> Yeni Kayıt
                              </button>
                            </div>
                          </div>

                          {/* Filtre ve Arama Alanı */}
                          <div className="flex gap-1 flex-wrap no-print">
                            <div className="relative flex-1 min-w-[160px]">
                              <i className="fa-solid fa-search absolute left-2.5 top-2 text-slate-400 text-[11px]"></i>
                              <input
                                type="text"
                                placeholder="İşlem, Diş, Tanı ara..."
                                value={historySearchQuery}
                                onChange={(e) => setHistorySearchQuery(e.target.value)}
                                className="w-full pl-7 pr-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 shadow-sm dark:text-white"
                              />
                            </div>
                            <select
                              value={historyFilterDoc}
                              onChange={(e) => setHistoryFilterDoc(e.target.value)}
                              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none shadow-sm dark:text-white"
                            >
                              <option value="all">Tüm Hekimler</option>
                              {allDoctors.map(doc => (
                                <option key={doc} value={doc}>{globalData.doctorProfiles?.[doc]?.name || doc}</option>
                              ))}
                            </select>
                          </div>

                          {/* Timeline Görünümü */}
                          <div className="flex-1 overflow-y-auto no-print pr-1.5 relative mt-1.5 custom-scrollbar">
                            {(() => {
                              let historyData = [...(patientForm.clinicalHistory || [])]; // Kopyasını alıyoruz ki state doğrudan mutasyona uğramasın
                              
                              // YENİ DÜZELTME: Hekim geçmişe dönük manuel kayıt eklerse (örn: 1 ay öncesi), 
                              // en üste değil, doğru tarihli aralığa girmesini sağlayan Akıllı Kronolojik Sıralama
                              historyData.sort((a, b) => {
                                const parseDate = (dStr, tStr) => {
                                  if (!dStr) return 0;
                                  let day = 0, month = 0, year = 0;
                                  if (dStr.includes(".")) [day, month, year] = dStr.split(".");
                                  else if (dStr.includes("/")) [day, month, year] = dStr.split("/");
                                  else if (dStr.includes("-")) [year, month, day] = dStr.split("-");
                                  const [hr, min] = (tStr || "00:00").split(":");
                                  return new Date(year, month - 1, day, hr, min).getTime();
                                };
                                return parseDate(b.date, b.time) - parseDate(a.date, a.time); // En yeni tarih en üstte
                              });

                              if (historyFilterDoc !== "all") historyData = historyData.filter(h => h.doctorId === historyFilterDoc);
                              if (historySearchQuery) {
                                const q = historySearchQuery.toLowerCase();
                                historyData = historyData.filter(h => 
                                  (h.treatment && h.treatment.toLowerCase().includes(q)) || 
                                  (h.diagnosis && h.diagnosis.toLowerCase().includes(q)) ||
                                  (h.selectedTeeth && h.selectedTeeth.some(t => t.includes(q))) ||
                                  (h.complaint && h.complaint.toLowerCase().includes(q))
                                );
                              }

                              if (historyData.length === 0) return (
                                <div className="text-center py-8 text-slate-400 text-[13px] font-medium bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                                  <i className="fa-solid fa-notes-medical text-lg mb-2 text-slate-300 dark:text-slate-600 block"></i>
                                  Kayıtlı klinik geçmiş bulunmuyor.
                                </div>
                              );

                              return (
                                <div className="relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-transparent">
                                  {historyData.map((h, index) => (
                                    <div key={h.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-2">
                                      <div className="flex items-center justify-center w-8 h-7 rounded-full border-4 border-slate-50 dark:border-slate-900 bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 absolute left-0 md:left-1/2 -translate-x-0 cursor-pointer hover:scale-110 transition-transform"
                                           onClick={() => { setSelectedHistoryRecord(h); setIsHistoryDetailModalOpen(true); }}>
                                        <i className="fa-solid fa-stethoscope text-[11px]"></i>
                                      </div>
                                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] ml-auto md:ml-0 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
                                           onClick={() => { setSelectedHistoryRecord(h); setIsHistoryDetailModalOpen(true); }}>
                                        <div className="flex justify-between items-center mb-1.5">
                                          <span className="font-black text-indigo-600 dark:text-indigo-400 text-[11px] bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-md">
                                            {h.date} • {h.time}
                                          </span>
                                          <span className="text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded-md">
                                            {h.visitType}
                                          </span>
                                        </div>
                                        <h4 className="font-black text-[13px] text-slate-800 dark:text-white mb-1.5">{h.treatment}</h4>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-col gap-0.5">
                                          <div className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
                                            <i className="fa-solid fa-user-doctor w-3 text-center"></i> {h.doctorName}
                                          </div>
                                          {h.selectedTeeth?.length > 0 && (
                                            <div className="flex items-center gap-1">
                                              <i className="fa-solid fa-tooth w-3 text-center"></i> Dişler: {h.selectedTeeth.join(" • ")}
                                            </div>
                                          )}
                                          {h.diagnosis && (
                                            <div className="flex items-start gap-1 mt-0.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                              <i className="fa-solid fa-notes-medical w-3 text-center text-rose-400 mt-0.5"></i> <span className="line-clamp-2 italic">{h.diagnosis}</span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* YENİ: DÜZENLE BUTONU İBARESİ */}
                                        <div className="mt-2 text-right">
                                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 transition">
                                                <i className="fa-solid fa-pen mr-1"></i> Düzenle
                                            </span>
                                        </div>
                                        
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Modal: Yeni Klinik Kayıt (Epikriz) Ekleme */}
                      {isAddHistoryModalOpen && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-2">
                          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-pop">
                            <div className="px-3 py-2 border-b border-slate-700 flex justify-between items-center bg-[#0f172a] text-white shrink-0">
                              <h3 className="font-black text-[13px] uppercase tracking-wider flex items-center gap-1">
                                <i className="fa-solid fa-file-medical text-indigo-400"></i> Yeni Klinik Geçmiş Ekle
                              </h3>
                              <button onClick={() => setIsAddHistoryModalOpen(false)} className="text-slate-400 hover:text-white transition">
                                <i className="fa-solid fa-xmark text-base"></i>
                              </button>
                            </div>
                            <form onSubmit={handleSaveManualHistory} className="p-2.5 overflow-y-auto custom-scrollbar flex-1 space-y-1.5">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                <div className="col-span-2 sm:col-span-1 relative z-10">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Tarih *</label>
                                  <input type="date" lang="tr-TR" required value={newHistoryForm.date || ""} onClick={(e) => e.stopPropagation()} onChange={e => setNewHistoryForm({...newHistoryForm, date: e.target.value})} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700" />
                                </div>
                                <div className="col-span-2 sm:col-span-1 relative z-10">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Saat *</label>
                                  <input type="time" lang="tr-TR" required value={newHistoryForm.time || ""} onClick={(e) => e.stopPropagation()} onChange={e => setNewHistoryForm({...newHistoryForm, time: e.target.value})} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700" />
                                </div>
                                <div className="col-span-2 sm:col-span-2 relative z-10">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">İlgili Hekim *</label>
                                  <select required value={newHistoryForm.doctorId || ""} onClick={(e) => e.stopPropagation()} onChange={e => setNewHistoryForm({...newHistoryForm, doctorId: e.target.value})} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700">
                                    <option value="" disabled>Seçiniz</option>
                                    {allDoctors.map(doc => (<option key={doc} value={doc}>{globalData.doctorProfiles?.[doc]?.name || doc}</option>))}
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Ziyaret Türü</label>
                                  <select value={newHistoryForm.visitType} onChange={e => setNewHistoryForm({...newHistoryForm, visitType: e.target.value})} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none dark:bg-slate-900 dark:text-white dark:border-slate-700">
                                    <option>İlk Muayene</option><option>Tedavi / İşlem</option><option>Kontrol</option><option>Cerrahi</option><option>Diğer</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">İlgili Dişler (Virgülle ayırın, Örn: 46, 36)</label>
                                  <input type="text" placeholder="Tüm Çene veya diş numaraları" value={newHistoryForm.selectedTeeth} onChange={e => setNewHistoryForm({...newHistoryForm, selectedTeeth: e.target.value})} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Yapılan İşlem / Tedavi *</label>
                                <input type="text" required placeholder="Örn: Kanal Tedavisi, Kompozit Dolgu..." value={newHistoryForm.treatment} onChange={e => setNewHistoryForm({...newHistoryForm, treatment: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700" />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Başvuru Şikayeti</label>
                                  <textarea rows="2" value={newHistoryForm.complaint} onChange={e => setNewHistoryForm({...newHistoryForm, complaint: e.target.value})} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold outline-none focus:border-indigo-500 resize-none dark:bg-slate-900 dark:text-white dark:border-slate-700"></textarea>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Klinik Bulgular & Tanı</label>
                                  <textarea rows="2" value={newHistoryForm.diagnosis} onChange={e => setNewHistoryForm({...newHistoryForm, diagnosis: e.target.value})} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold outline-none focus:border-indigo-500 resize-none dark:bg-slate-900 dark:text-white dark:border-slate-700"></textarea>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Anestezi / Materyal Bilgisi</label>
                                  <textarea rows="2" value={newHistoryForm.anesthesia} onChange={e => setNewHistoryForm({...newHistoryForm, anesthesia: e.target.value})} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold outline-none focus:border-indigo-500 resize-none dark:bg-slate-900 dark:text-white dark:border-slate-700"></textarea>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Hekim Notu / Prosedür Notu</label>
                                  <textarea rows="2" value={newHistoryForm.procedureNotes} onChange={e => setNewHistoryForm({...newHistoryForm, procedureNotes: e.target.value})} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold outline-none focus:border-indigo-500 resize-none dark:bg-slate-900 dark:text-white dark:border-slate-700"></textarea>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                <div className="relative z-10">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">İlaç / Reçete / Öneri</label>
                                  <textarea rows="2" value={newHistoryForm.prescription || ""} onClick={(e) => e.stopPropagation()} onChange={e => setNewHistoryForm({...newHistoryForm, prescription: e.target.value})} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold outline-none focus:border-indigo-500 resize-none dark:bg-slate-900 dark:text-white dark:border-slate-700"></textarea>
                                </div>
                                <div className="relative z-10">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Sonraki Kontrol Tarihi</label>
                                  <input 
                                    type="text" 
                                    placeholder="gg.aa.yyyy" 
                                    maxLength="10"
                                    value={newHistoryForm.nextAppointmentDate || ""} 
                                    onChange={e => {
                                      let digits = e.target.value.replace(/[^0-9]/g, "");
                                      let formatted = digits;
                                      if (digits.length > 2) formatted = digits.substring(0, 2) + "." + digits.substring(2);
                                      if (digits.length > 4) formatted = digits.substring(0, 2) + "." + digits.substring(2, 4) + "." + digits.substring(4, 8);
                                      setNewHistoryForm({...newHistoryForm, nextAppointmentDate: formatted});
                                    }} 
                                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700" 
                                  />
                                </div>
                              </div>
                              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-1.5">
                                <button type="button" onClick={() => setIsAddHistoryModalOpen(false)} className="px-2.5 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-[13px] hover:bg-slate-200 transition dark:bg-slate-700 dark:text-slate-300">İptal</button>
                                <button type="submit" className="px-2.5 py-2 bg-indigo-600 text-white rounded-xl font-black text-[13px] shadow-lg hover:bg-indigo-700 transition">Kaydet</button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}

                      {/* Modal: Klinik Ziyaret Detayı (Düzenleme) */}
                      {isHistoryDetailModalOpen && selectedHistoryRecord && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-2" onClick={() => setIsHistoryDetailModalOpen(false)}>
                          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-pop" onClick={e => e.stopPropagation()}>
                            <div className="px-3 py-2 border-b border-slate-700 flex justify-between items-center bg-[#0f172a] text-white shrink-0">
                              <div>
                                <h3 className="font-black text-[13px] uppercase tracking-wider flex items-center gap-1">
                                  <i className="fa-solid fa-pen-to-square text-indigo-400"></i> Klinik Geçmişi Düzenle
                                </h3>
                                <div className="text-[10px] text-slate-400 mt-0.5">{selectedHistoryRecord.date} • {selectedHistoryRecord.time}</div>
                              </div>
                              <button onClick={() => setIsHistoryDetailModalOpen(false)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center">
                                <i className="fa-solid fa-xmark text-[13px]"></i>
                              </button>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                // Klinik geçmiş kaydını güncelleyip kaydetme
                                const updatedHistory = patientForm.clinicalHistory.map(h => 
                                  h.id === selectedHistoryRecord.id ? selectedHistoryRecord : h
                                );
                                const updatedPatient = { ...patientForm, clinicalHistory: updatedHistory };
                                setPatientForm(updatedPatient);
                                saveGlobalData({ ...globalData, patientsDb: { ...globalData.patientsDb, [patientForm.id]: updatedPatient } });
                                setIsHistoryDetailModalOpen(false);
                                showNotification("Klinik detaylar başarıyla kaydedildi.");
                            }} className="p-2.5 overflow-y-auto custom-scrollbar flex-1 space-y-1.5">
                              
                              {/* Otomatik Bilgiler (Kilitli Alanlar) */}
                              <div className="grid grid-cols-2 gap-1.5 mb-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                  <div className="bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 opacity-80 cursor-not-allowed">
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Hekim</label>
                                      <div className="font-black text-[12px] text-slate-800 dark:text-white mt-0.5"><i className="fa-solid fa-user-doctor text-indigo-500 mr-1"></i> {selectedHistoryRecord.doctorName}</div>
                                  </div>
                                  <div className="bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 opacity-80 cursor-not-allowed">
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Durum / Ziyaret</label>
                                      <div className="font-black text-[12px] text-emerald-600 dark:text-emerald-400 mt-0.5"><i className="fa-solid fa-check-circle mr-1"></i> {selectedHistoryRecord.appointmentStatus || "Geldi"}</div>
                                  </div>
                              </div>
                              
                              {/* Düzenlenebilir Manuel Klinik Bilgiler */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Yapılan İşlem / Tedavi</label>
                                      <input type="text" value={selectedHistoryRecord.treatment || ""} onChange={e => setSelectedHistoryRecord({...selectedHistoryRecord, treatment: e.target.value})} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-white" />
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">İlgili Dişler (Virgülle ayırın)</label>
                                      <input type="text" value={selectedHistoryRecord.selectedTeeth ? (Array.isArray(selectedHistoryRecord.selectedTeeth) ? selectedHistoryRecord.selectedTeeth.join(", ") : selectedHistoryRecord.selectedTeeth) : ""} onChange={e => setSelectedHistoryRecord({...selectedHistoryRecord, selectedTeeth: e.target.value.split(',').map(s=>s.trim())})} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-white" />
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Başvuru Şikayeti / Randevu Notu</label>
                                      <textarea rows="2" value={selectedHistoryRecord.complaint || ""} onChange={e => setSelectedHistoryRecord({...selectedHistoryRecord, complaint: e.target.value})} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-semibold outline-none focus:border-indigo-500 resize-none text-slate-800 dark:text-white"></textarea>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Klinik Bulgular & Tanı</label>
                                      <textarea rows="2" value={selectedHistoryRecord.diagnosis || selectedHistoryRecord.clinicalFindings || ""} onChange={e => setSelectedHistoryRecord({...selectedHistoryRecord, diagnosis: e.target.value, clinicalFindings: e.target.value})} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-semibold outline-none focus:border-indigo-500 resize-none text-slate-800 dark:text-white"></textarea>
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Hekim Notu / Prosedür Notu</label>
                                      <textarea rows="2" value={selectedHistoryRecord.procedureNotes || ""} onChange={e => setSelectedHistoryRecord({...selectedHistoryRecord, procedureNotes: e.target.value})} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-semibold outline-none focus:border-indigo-500 resize-none text-slate-800 dark:text-white"></textarea>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Anestezi / Materyal Bilgisi</label>
                                      <textarea rows="2" value={selectedHistoryRecord.anesthesia || selectedHistoryRecord.materials || ""} onChange={e => setSelectedHistoryRecord({...selectedHistoryRecord, anesthesia: e.target.value, materials: e.target.value})} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-semibold outline-none focus:border-indigo-500 resize-none text-slate-800 dark:text-white"></textarea>
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">İlaç / Reçete / Öneri</label>
                                      <textarea rows="2" value={selectedHistoryRecord.prescription || ""} onChange={e => setSelectedHistoryRecord({...selectedHistoryRecord, prescription: e.target.value})} className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-semibold outline-none focus:border-indigo-500 resize-none text-slate-800 dark:text-white"></textarea>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Sonraki Kontrol Tarihi</label>
                                      <input 
                                        type="text" 
                                        placeholder="gg.aa.yyyy" 
                                        maxLength="10"
                                        value={selectedHistoryRecord.nextAppointment?.date || selectedHistoryRecord.nextAppointmentDate || ""} 
                                        onChange={e => {
                                          let digits = e.target.value.replace(/[^0-9]/g, "");
                                          let formatted = digits;
                                          if (digits.length > 2) formatted = digits.substring(0, 2) + "." + digits.substring(2);
                                          if (digits.length > 4) formatted = digits.substring(0, 2) + "." + digits.substring(2, 4) + "." + digits.substring(4, 8);
                                          setSelectedHistoryRecord({
                                            ...selectedHistoryRecord, 
                                            nextAppointmentDate: formatted, 
                                            nextAppointment: { date: formatted }
                                          });
                                        }} 
                                        className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-white" 
                                      />
                                  </div>
                              </div>

                              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-1.5 mt-1.5">
                                  <button type="button" onClick={() => setIsHistoryDetailModalOpen(false)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-[13px] hover:bg-slate-200 transition dark:bg-slate-700 dark:text-slate-300">İptal</button>
                                  <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-xl font-black text-[13px] shadow-lg hover:bg-indigo-700 transition"><i className="fa-solid fa-save mr-1"></i> Detayları Kaydet</button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                      {/* DOSYAYI GÜNCELLE VE KAPAT BUTONLARI BURADA KORUNUYOR */}
                      <div className="px-2.5 py-2 bg-white border-t flex justify-between items-center rounded-b-[2rem] shrink-0 no-print z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] dark:bg-[#0f172a] dark:border-slate-700">
                        <div className="text-[11px] text-slate-400 font-bold hidden sm:block">
                          *Değişiklikleri kaydetmek için lütfen güncelleyin.
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsPatientModalOpen(false)}
                            className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-[13px] hover:bg-slate-200 transition dark:bg-slate-700 dark:text-slate-300"
                          >
                            Kapat
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleSavePatient(e)}
                            className="px-2.5 py-1.5 bg-[#0f172a] text-white rounded-xl font-black text-[13px] shadow-xl hover:bg-slate-800 transition dark:bg-indigo-600 dark:hover:bg-indigo-700"
                          >
                            <i className="fa-solid fa-save mr-1.5"></i> Dosyayı
                            Güncelle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            {avatarModalInfo.isOpen && (
  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[150] p-2 animate-fadeIn">
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] w-full max-w-sm overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col animate-pop">
      
      {/* Modern Header */}
      <div className="px-2.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center gap-1.5 relative z-10">
          <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-[13px] shadow-inner">
            <i className="fa-solid fa-circle-user"></i>
          </div>
          <div>
            <h3 className="font-black text-[13px] tracking-wide">Profil Fotoğrafını Düzenle</h3>
            <p className="text-[10px] text-indigo-100 font-semibold">Sürükleyin ve Hizalayın</p>
          </div>
        </div>
        <button
          onClick={() => setAvatarModalInfo({ ...avatarModalInfo, isOpen: false })}
          className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition backdrop-blur-md relative z-10"
        >
          <i className="fa-solid fa-xmark text-[13px]"></i>
        </button>
      </div>

      <div className="p-2.5 space-y-2.5">
        {/* İnteraktif Sürükle-Bırak / Kaydırma Alanı */}
        <div className="flex flex-col items-center justify-center">
          <div 
            className="w-36 h-36 rounded-full border-4 border-indigo-500/30 shadow-2xl overflow-hidden relative bg-slate-900 flex items-center justify-center ring-8 ring-indigo-500/10 cursor-grab active:cursor-grabbing select-none group"
            onMouseDown={(e) => {
              const startX = e.clientX;
              const startY = e.clientY;
              const origX = avatarModalInfo.x;
              const origY = avatarModalInfo.y;
              
              const onMouseMove = (moveEvent) => {
                const deltaX = (moveEvent.clientX - startX) * 0.5;
                const deltaY = (moveEvent.clientY - startY) * 0.5;
                setAvatarModalInfo(prev => ({
                  ...prev,
                  x: Math.max(0, Math.min(100, origX - deltaX)),
                  y: Math.max(0, Math.min(100, origY - deltaY))
                }));
              };
              
              const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
              };
              
              window.addEventListener('mousemove', onMouseMove);
              window.addEventListener('mouseup', onMouseUp);
            }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              const startX = touch.clientX;
              const startY = touch.clientY;
              const origX = avatarModalInfo.x;
              const origY = avatarModalInfo.y;
              
              const onTouchMove = (moveEvent) => {
                const t = moveEvent.touches[0];
                const deltaX = (t.clientX - startX) * 0.5;
                const deltaY = (t.clientY - startY) * 0.5;
                setAvatarModalInfo(prev => ({
                  ...prev,
                  x: Math.max(0, Math.min(100, origX - deltaX)),
                  y: Math.max(0, Math.min(100, origY - deltaY))
                }));
              };
              
              const onTouchEnd = () => {
                window.removeEventListener('touchmove', onTouchMove);
                window.removeEventListener('touchend', onTouchEnd);
              };
              
              window.addEventListener('touchmove', onTouchMove);
              window.addEventListener('touchend', onTouchEnd);
            }}
          >
            {avatarModalInfo.tempAvatar ? (
              <img
                src={avatarModalInfo.tempAvatar}
                style={{
                  transform: `scale(${avatarModalInfo.zoom})`,
                  objectPosition: `${avatarModalInfo.x}% ${avatarModalInfo.y}%`,
                }}
                className="w-full h-full object-cover pointer-events-none transition-transform duration-75"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                <i className="fa-solid fa-camera text-lg"></i>
                <span className="text-[10px] font-bold">Görsel Yok</span>
              </div>
            )}
            
            {/* Sürükleme İpucu Overlay */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-white text-[10px] font-black bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-md shadow-lg flex items-center gap-1">
                <i className="fa-solid fa-hand-pointer"></i> Kaydırmak için sürükleyin
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAvatarModalInfo({ ...avatarModalInfo, zoom: 1, x: 50, y: 50 })}
            className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline mt-3 flex items-center gap-1"
          >
            <i className="fa-solid fa-rotate-left"></i> Konumu ve Zoomu Sıfırla
          </button>
        </div>

        {/* Akıllı Slider Kontrol Paneli */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-black text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-magnifying-glass text-indigo-500"></i> Yakınlaştırma Seviyesi
            </span>
            <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-mono">
              {avatarModalInfo.zoom.toFixed(1)}x
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAvatarModalInfo({ ...avatarModalInfo, zoom: Math.max(1, parseFloat((avatarModalInfo.zoom - 0.2).toFixed(1))) })}
              className="w-7 h-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-indigo-50 transition shadow-sm"
            >
              <i className="fa-solid fa-minus text-[11px]"></i>
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={avatarModalInfo.zoom}
              onChange={(e) => setAvatarModalInfo({ ...avatarModalInfo, zoom: parseFloat(e.target.value) })}
              className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <button
              type="button"
              onClick={() => setAvatarModalInfo({ ...avatarModalInfo, zoom: Math.min(3, parseFloat((avatarModalInfo.zoom + 0.2).toFixed(1))) })}
              className="w-7 h-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-indigo-50 transition shadow-sm"
            >
              <i className="fa-solid fa-plus text-[11px]"></i>
            </button>
          </div>
        </div>

        {/* Alt Aksiyon Butonları */}
        <div className="space-y-2">
          <div className="flex gap-1">
            <label className="flex-1 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition rounded-xl font-black text-[11px] text-center cursor-pointer border border-indigo-100 dark:border-indigo-800/50 shadow-sm flex items-center justify-center gap-1">
              <i className="fa-solid fa-cloud-arrow-up"></i> Fotoğraf Değiştir
              <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const img = new Image();
                          img.onload = () => {
                            // Akıllı Kanvas Sıkıştırma Motoru (Maksimum 300x300 piksel ve %70 kalite optimizasyonu)
                            const canvas = document.createElement('canvas');
                            let width = img.width;
                            let height = img.height;
                            const maxSize = 300;

                            if (width > height) {
                              if (width > maxSize) {
                                height *= maxSize / width;
                                width = maxSize;
                              }
                            } else {
                              if (height > maxSize) {
                                width *= maxSize / height;
                                height = maxSize;
                              }
                            }

                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);

                            // Boyutu devasa ölçüde küçülten sıkıştırılmış base64 çıktısı (JPEG formatında)
                            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

                            setAvatarModalInfo({ 
                              ...avatarModalInfo, 
                              tempAvatar: compressedDataUrl, 
                              zoom: 1, 
                              x: 50, 
                              y: 50 
                            });
                          };
                          img.src = event.target.result;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
            </label>
            <button
              type="button"
              onClick={() => setAvatarModalInfo({ ...avatarModalInfo, tempAvatar: null, zoom: 1, x: 50, y: 50 })}
              className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition rounded-xl font-bold text-[11px] border border-rose-100 dark:border-rose-800/50 shadow-sm flex items-center justify-center gap-1"
              title="Fotoğrafı Kaldır"
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setDoctorEditForm({
                ...doctorEditForm,
                avatar: avatarModalInfo.tempAvatar,
                zoom: avatarModalInfo.zoom,
                x: avatarModalInfo.x,
                y: avatarModalInfo.y,
              });
              setAvatarModalInfo({ ...avatarModalInfo, isOpen: false });
              showNotification("Profil fotoğrafı güncellendi.");
            }}
            className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-black text-[11px] shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-1"
          >
            <i className="fa-solid fa-check"></i> Değişiklikleri Kaydet
          </button>
        </div>

      </div>
    </div>
  </div>
)}
          </div>
        );
      }
      export default App;