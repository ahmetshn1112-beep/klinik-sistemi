import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, update, onValue, push, child, get } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, updateEmail, updatePassword, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'firebase/auth';
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
  const [auth, setAuth] = useState(null); // YENİ: Auth eklendi
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // DİKKAT: Buradaki bilgileri Firebase'den aldığın kendi bilgilerinle doldur!
        const firebaseConfig = {
  apiKey: "AIzaSyBpn_3CS_NMIh1VO-Ao0_NhTHesC6jndtQ",
  authDomain: "klinikrandevusistemi-adaee.firebaseapp.com",
  databaseURL: "https://klinikrandevusistemi-adaee-default-rtdb.firebaseio.com",
  projectId: "klinikrandevusistemi-adaee",
  storageBucket: "klinikrandevusistemi-adaee.firebasestorage.app",
  messagingSenderId: "277717252835",
  appId: "1:277717252835:web:f63c4624a63835ed4fe3d6",
  measurementId: "G-JGFSCVVZ9K"
};

        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const database = getDatabase(app);
        const firebaseAuth = getAuth(app); // YENİ: Auth motoru çalıştırıldı
        
        // YENİ GÜVENLİK: Tarayıcı veya sekme kapandığında oturumu anında Firebase sunucularından düşür
        setPersistence(firebaseAuth, browserSessionPersistence).catch((err) => console.error("Oturum kalıcılık ayarı hatası:", err));

        setDb(database);
        setAuth(firebaseAuth); // YENİ: Auth state'e kaydedildi
        setIsReady(true);
      } catch (err) {
        console.error("Firebase Kurulum Hatası", err);
        setIsReady(true);
      }
    };

    init();
  }, []);

  return { fbUser, auth, db, isReady }; // YENİ: auth dışarı aktarıldı
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
        saveGlobalData,
        dynamicPricingCategories // BEYAZ EKRAN ÇÖZÜMÜ
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
            showNotification("Lütfen önce alt kısımdan bir işlem türü seçin!", "error");
            return;
          }

          // ZIRHLI FİYAT OKUMA MOTORU (Klinik İzolasyonuna Uyumlu Patron Bulucu)
          let ownerId = currentUser;
          const myProfile = globalData.userProfiles?.[currentUser];
          if (myProfile?.clinicId) {
             const patron = Object.entries(globalData.userProfiles || {}).find(([k, v]) => v.clinicId === myProfile.clinicId && v.role === "clinic_owner");
             if (patron) ownerId = patron[0];
          } else if (myProfile?.role === "assistant" || myProfile?.role === "doctor") {
             ownerId = myProfile.createdBy || currentUser;
          }
          
          const basePricing = typeof globalData.pricingDb === "object" && globalData.pricingDb["Genel Muayene"] ? globalData.pricingDb : DEFAULT_PRICING;
          const userPricing = { ...basePricing, ...(globalData.pricingDb?.[ownerId] || {}) };

          if (activePlanTreatment === "Tam Protez (Tek Çene)") {
            const tInt = parseInt(toothNo);
            const isUpperClick = tInt < 30 || (tInt >= 50 && tInt < 70);
            const targetJaw = isUpperClick ? "Üst Çene" : "Alt Çene";

            const exists = patientForm.plannedTreatments?.some(
              (t) => t.tooth === targetJaw && t.treatment === activePlanTreatment
            );

            if (exists) {
              setPatientForm((prev) => ({
                ...prev,
                plannedTreatments: prev.plannedTreatments.filter(
                  (t) => !(t.tooth === targetJaw && t.treatment === activePlanTreatment)
                ),
              }));
              showNotification(`${targetJaw} bölgesinden Tam Protez çıkarıldı.`, "error");
              return;
            }

            const txPrice = userPricing[activePlanTreatment] !== undefined ? parseFloat(userPricing[activePlanTreatment]) : 0;

            const newTx = {
              id: Date.now() + Math.random().toString(),
              tooth: targetJaw,
              treatment: activePlanTreatment,
              date: Date.now(),
              price: txPrice,
            };

            setPatientForm((prev) => ({
              ...prev,
              plannedTreatments: [...(prev.plannedTreatments || []), newTx],
            }));

            showNotification(`${targetJaw} için Tam Protez planlandı. (${txPrice} ₺)`);
            return;
          }

          let actualPlanTreatment = activePlanTreatment;
          if (activePlanTreatment === "Diş Çekimi" && ["18", "28", "38", "48"].includes(toothNo.toString())) {
            actualPlanTreatment = "Gömülü ve 20lik Diş Çekimi";
            showNotification("8 Numaralı diş seçildiği için tarife 'Gömülü ve 20lik Diş Çekimi' olarak otomatik güncellendi.");
          }

          const exists = patientForm.plannedTreatments?.some(
            (t) => t.tooth === toothNo && t.treatment === actualPlanTreatment
          );

          if (exists) {
            setPatientForm((prev) => ({
              ...prev,
              plannedTreatments: prev.plannedTreatments.filter(
                (t) => !(t.tooth === toothNo && t.treatment === actualPlanTreatment)
              ),
            }));
            showNotification(`${toothNo} numaralı bölgeden ${actualPlanTreatment} çıkarıldı.`, "error");
            return;
          }

          const txPrice = userPricing[actualPlanTreatment] !== undefined ? parseFloat(userPricing[actualPlanTreatment]) : 0;

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

          showNotification(`${toothNo} numaralı dişe ${actualPlanTreatment} planlandı. (${txPrice} ₺)`);
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
          const hasGraftedImplant = treatments.some((t) =>
            t.treatment.includes("İmplant (Greftli)")
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
          // YENİ: Profesyonel Zirkonyum ve Vener Algılayıcıları
          const hasVeneer = treatments.some((t) => t.treatment.includes("Vener"));
          const hasZirconium = treatments.some((t) => t.treatment.includes("Zirkonyum"));

          const hasWholeJawDetertraj = patientForm.plannedTreatments?.some(
            (t) => t.tooth === "Tüm Çene" && t.treatment === "Detertraj"
          );

          // YENİ: Tam Protez Görünüm Kontrolü
          const allJawTreatments = allTreatmentsSorted.filter((x) => {
             const targetJaw = isUpper ? "Üst Çene" : "Alt Çene";
             if (x.tooth !== targetJaw) return false;
             if (timelineIndex === -1) return true;
             const txDateStr = new Date(x.date).toLocaleDateString("tr-TR");
             const txIndex = uniqueDates.indexOf(txDateStr);
             return txIndex <= timelineIndex;
          });
          const isFullDenture = allJawTreatments.some(t => t.treatment === "Tam Protez (Tek Çene)");

          // 1. ADIM: Dişin durum ve tanılarını (Diagnoses) çekiyoruz
          const toothRecord = patientForm.toothRecords?.[toothNo.toString()] || { status: "Sağlıklı", diagnoses: [] };
          const tStatus = toothRecord.status;
          const tDiags = toothRecord.diagnoses || [];

          // Klinik teşhis bayrakları (Sıradaki adımlarda görselleştireceğiz)
          const isImpacted = tStatus === "Gömülü" || treatments.some(t => t.treatment.includes("Gömülü"));
          const hasAbscess = tDiags.some(d => d.includes("Apse") || d.includes("Apikal Periodontitis") || d.includes("Lezyon"));
          const hasInitialCaries = tStatus === "Başlangıç Çürüğü" || tDiags.includes("Başlangıç Çürüğü");
          const hasDeepCaries = tStatus === "Kavitasyonlu Çürük" || tDiags.includes("Aşırı Madde Kaybı") || tDiags.includes("Sekonder Çürük");
          const hasPulpitis = tDiags.some(d => d.includes("Pulpitis") || d.includes("Nekroz"));

          let heatMapClass = "";
          if (hasExtraction || hasImplant) heatMapClass = "heatmap-danger";
          else if (hasCanal || hasRetreatment) heatMapClass = "heatmap-warning";
          else if (hasFilling || hasCrown) heatMapClass = "heatmap-info";

          const anatomy = getToothAnatomy(toothNo);

          // Gömülü dişler için rotasyon yerine küçültme ve diş etine gömme (oklüzalden uzaklaştırma) efekti
          let baseTransform = isUpper ? "" : "scale(1, -1) translate(0, -140)";
          if (isImpacted) {
             // scale(0.75) ile boyut küçülüyor.
             // translate(7.5, -25) ile hem X ekseninde ortalanıyor hem de Y ekseninde oklüzalden uzaklaşıyor (kök tarafına gömülüyor).
             const impactTransform = "translate(7.5, -25) scale(0.75)";
             baseTransform = `${baseTransform} ${impactTransform}`;
          }
          const transform = baseTransform;

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
                  {/* Normal Kök Gradyanı */}
                  <linearGradient id={`rootGrad-${toothNo}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#dcb892" />
                    <stop offset="50%" stopColor="#fef3c7" />
                    <stop offset="100%" stopColor="#dcb892" />
                  </linearGradient>

                  {/* Sağlıklı Diş Kuron Gradyanı */}
                  <linearGradient id={`crownGrad-${toothNo}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="80%" stopColor="#f8fafc" />
                    <stop offset="100%" stopColor="#e2e8f0" />
                  </linearGradient>

                  {/* Standart Porselen Kron Gradyanı (Metalik/Gri Yansıma) */}
                  <linearGradient id="porcelainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f1f5f9" />
                    <stop offset="50%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#94a3b8" />
                  </linearGradient>

                  {/* PROFESYONEL: Zirkonyum Kron Gradyanı (Belirgin Premium İndigo/Mavi) */}
                  <linearGradient id="zirconiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e0e7ff" />
                    <stop offset="40%" stopColor="#a5b4fc" />
                    <stop offset="70%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>

                  {/* PROFESYONEL: Estetik Dolgu / Kompozit Şeffaflığı */}
                  <linearGradient id="compositeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255, 255, 255, 0.95)" />
                    <stop offset="60%" stopColor="rgba(224, 242, 254, 0.8)" />
                    <stop offset="100%" stopColor="rgba(186, 230, 253, 0.5)" />
                  </linearGradient>

                  {/* Apse / Lezyon Filtresi (Radial Blur) */}
                  <radialGradient id="abscessGrad">
                    <stop offset="0%" stopColor="rgba(225, 29, 72, 0.9)" />
                    <stop offset="60%" stopColor="rgba(159, 18, 57, 0.6)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>

                  {/* 3D Derinlik ve Gölgelendirme Filtresi */}
                  <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.35" />
                  </filter>

                  {/* 3D Titanyum Yüzey Gradyanı */}
                  <linearGradient id={`titaniumGrad-${toothNo}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="30%" stopColor="#f8fafc" />
                    <stop offset="70%" stopColor="#64748b" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>
                  
                  {/* DAHA BELİRGİN Greft (Kemik Tozu) Bulutu Gradyanı */}
                  <radialGradient id={`graftGrad-${toothNo}`}>
                    <stop offset="0%" stopColor="rgba(250, 204, 21, 0.85)" />
                    <stop offset="60%" stopColor="rgba(253, 224, 71, 0.6)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>

                <g transform={transform}>
                  {isFullDenture ? (
                    <g filter="url(#drop-shadow)">
                      {/* Pembe Akrilik Protez Kaidesi (Kökleri kapatan estetik diş eti) */}
                      <path d="M -2,85 Q 30,110 62,85 L 55,60 Q 30,75 5,60 Z" fill="#ec4899" stroke="#be185d" strokeWidth="1" opacity="0.95" />
                      
                      {/* Yapay Porselen/Akrilik Diş (Oklüzale hizalanmış) */}
                      <path d={anatomy.crownPath} fill="url(#porcelainGrad)" stroke="#cbd5e1" strokeWidth="1.2" />
                      
                      {/* Diş ve Kaide Birleşim Hattı */}
                      <path d="M 10,83 Q 30,76 50,83" fill="none" stroke="#9d174d" strokeWidth="1.5" opacity="0.7" />
                    </g>
                  ) : (
                    <>
                      {/* NORMAL DİŞ VE İMPLANT ÇİZİMLERİ (Tam Protez Yoksa) */}
                      {hasImplant ? (
                        <g filter="url(#drop-shadow)">
                          {/* GREFT (Kemik Tozu) Simülasyonu */}
                          {hasGraftedImplant && (
                            <g>
                              <ellipse cx="30" cy="40" rx="22" ry="36" fill={`url(#graftGrad-${toothNo})`} />
                              {/* Partiküller */}
                              <circle cx="15" cy="25" r="2.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.5" opacity="0.9" />
                              <circle cx="44" cy="30" r="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" opacity="0.9" />
                              <circle cx="12" cy="45" r="3.5" fill="#eab308" stroke="#ca8a04" strokeWidth="0.5" opacity="0.8" />
                              <circle cx="47" cy="50" r="2.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" opacity="0.9" />
                              <circle cx="16" cy="60" r="2.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.5" opacity="0.9" />
                              <circle cx="42" cy="65" r="3" fill="#eab308" stroke="#ca8a04" strokeWidth="0.5" opacity="0.8" />
                              <circle cx="30" cy="12" r="2.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" opacity="0.9" />
                            </g>
                          )}

                          {/* İMPLANT GÖVDESİ (Titanyum Fikstür) */}
                          <rect x="25" y="70" width="10" height="12" fill={`url(#titaniumGrad-${toothNo})`} stroke="#1e293b" strokeWidth="0.5" />
                          <path d="M 21,25 L 21,70 L 39,70 L 39,25 L 34,10 L 26,10 Z" fill={`url(#titaniumGrad-${toothNo})`} stroke="#0f172a" strokeWidth="1" />
                          <path d="M 21,25 L 39,28 M 21,35 L 39,38 M 21,45 L 39,48 M 21,55 L 39,58 M 21,65 L 39,68" stroke="#0f172a" strokeWidth="1.5" opacity="0.8" />
                          <path d="M 21,28 L 39,31 M 21,38 L 39,41 M 21,48 L 39,51 M 21,58 L 39,61" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.6" />
                        </g>
                      ) : (
                        anatomy.rootPaths.map((path, i) => (
                          <path key={i} d={path} fill={`url(#rootGrad-${toothNo})`} stroke="#c19b76" strokeWidth="1" opacity="0.95" />
                        ))
                      )}

                      {hasCrown ? (
                        <g>
                          <path d={anatomy.crownPath} fill={hasZirconium ? "url(#zirconiumGrad)" : "url(#porcelainGrad)"} stroke={hasZirconium ? "#4f46e5" : "#475569"} strokeWidth="1.5" filter="url(#drop-shadow)" />
                          {hasZirconium && ( <path d="M 20,85 Q 30,110 40,85" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" /> )}
                          {!hasZirconium && ( <path d={anatomy.crownPath} fill="none" stroke="#334155" strokeWidth="2.5" opacity="0.8" /> )}
                        </g>
                      ) : (
                        <path d={anatomy.crownPath} fill={`url(#crownGrad-${toothNo})`} stroke="#94a3b8" strokeWidth="0.5" />
                      )}

                      {hasVeneer && !hasCrown && ( <path d={anatomy.crownPath} fill="url(#compositeGrad)" stroke="#7dd3fc" strokeWidth="1.2" opacity="0.9" filter="url(#drop-shadow)" /> )}

                      {hasFilling && !hasCrown && !hasVeneer && (
                        <g filter="url(#drop-shadow)">
                          <path d="M 23,105 Q 30,112 37,105 Q 39,112 35,116 Q 30,113 25,116 Q 21,112 23,105 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" opacity="0.9" />
                          <path d="M 26,108 Q 30,111 34,108" fill="none" stroke="#7f1d1d" strokeWidth="1" opacity="0.8" />
                        </g>
                      )}

                      {hasInitialCaries && !hasCrown && !hasVeneer && !hasFilling && (
                        <g opacity="0.8">
                          <circle cx="27" cy="100" r="1.5" fill="#a16207" />
                          <circle cx="33" cy="102" r="2" fill="#854d0e" />
                          <circle cx="29" cy="105" r="1" fill="#713f12" />
                        </g>
                      )}

                      {hasDeepCaries && !hasCrown && !hasVeneer && !hasFilling && (
                        <g filter="url(#drop-shadow)"><path d="M 22,98 Q 30,105 38,98 Q 35,110 30,112 Q 25,110 22,98 Z" fill="#422006" stroke="#1c1917" strokeWidth="0.5" opacity="0.9" /></g>
                      )}

                      {hasPulpitis && !hasCanal && ( <path d="M 28,105 Q 30,80 30,60" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="2,2" opacity="0.8" /> )}

                      {hasAbscess && anatomy.canalLines.map((line, i) => ( <circle key={`abscess-${i}`} cx={line.x1} cy={line.y1 - 2} r="6" fill="url(#abscessGrad)" className="animate-pulse opacity-80" /> ))}

                      {hasCanal && anatomy.canalLines.map((line, i) => (
                        <g key={`canal-${i}`} filter="url(#drop-shadow)">
                          <polygon points={`${line.x1 - 0.8},${line.y1} ${line.x1 + 0.8},${line.y1} ${line.x2 + 2.5},80 ${line.x2 - 2.5},80`} fill="#f43f5e" stroke="#be123c" strokeWidth="0.5" opacity="0.95" />
                          <circle cx={line.x1} cy={line.y1} r="1" fill="#fb7185" />
                        </g>
                      ))}

                      {/* PROFESYONEL: Kanal Yenileme (İçi mor dolgulu, belirgin) */}
                      {hasRetreatment && !hasCanal && anatomy.canalLines.map((line, i) => ( 
                        <g key={`retreat-${i}`} filter="url(#drop-shadow)">
                          <polygon points={`${line.x1 - 1},${line.y1} ${line.x1 + 1},${line.y1} ${line.x2 + 3},80 ${line.x2 - 3},80`} fill="#c084fc" stroke="#6d28d9" strokeWidth="1.5" strokeDasharray="3,1" opacity="0.95" /> 
                          <circle cx={line.x1} cy={line.y1} r="1.5" fill="#9333ea" />
                        </g>
                      ))}
                      
                      {/* Normal kanalın üzerine yenileme eklendiğinde (Saran kalın çerçeve) */}
                      {hasRetreatment && hasCanal && anatomy.canalLines.map((line, i) => ( 
                        <polygon key={`retreat-over-${i}`} points={`${line.x1 - 1.5},${line.y1 - 1} ${line.x1 + 1.5},${line.y1 - 1} ${line.x2 + 3.5},81 ${line.x2 - 3.5},81`} fill="none" stroke="#6d28d9" strokeWidth="2.5" strokeDasharray="4,2" opacity="0.9" filter="url(#drop-shadow)" /> 
                      ))}

                      {hasCleaning && (
                        <g>
                          <path d="M 15,85 Q 30,77 45,85" fill="none" stroke="#f472b6" strokeWidth="0.8" opacity="0.6" />
                          <path d="M 15,85 Q 30,77 45,85" fill="none" stroke="#06b6d4" strokeWidth="3.5" strokeLinecap="round" opacity="0.25" filter="url(#drop-shadow)" />
                          <circle cx="20" cy="82" r="1.2" fill="#67e8f9" className="animate-pulse" />
                          <circle cx="30" cy="78" r="1.5" fill="#cffafe" className="animate-pulse" style={{ animationDelay: "0.2s" }} />
                          <circle cx="40" cy="82" r="1.2" fill="#67e8f9" className="animate-pulse" style={{ animationDelay: "0.4s" }} />
                          <path d="M 29,76 L 31,76 M 30,75 L 30,77" stroke="#ffffff" strokeWidth="0.5" />
                        </g>
                      )}
                    </>
                  )}

                  {/* TÜM ÇENE DETERTRAJ (Genel Ferahlık Bandı - Tam protezliyken gizlenir) */}
                  {hasWholeJawDetertraj && !isFullDenture && (
                    <g>
                      <path d="M -5,85 Q 30,78 65,85" fill="none" stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" opacity="0.15" />
                      <path d="M -5,85 Q 30,78 65,85" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4,4" opacity="0.8" />
                    </g>
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
                    {["genel", "randevular", "sicil"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setDetailTab(tab)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider whitespace-nowrap transition-all ${
                          detailTab === tab ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {tab === "genel" ? <><i className="fa-solid fa-notes-medical mr-1"></i> Genel Durum & Tanı</> :
                         tab === "randevular" ? <><i className="fa-regular fa-calendar-check mr-1"></i> İlgili Randevular</> :
                         <><i className="fa-solid fa-clock-rotate-left mr-1"></i> Dişin Geçmişi (Sicil)</>}
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

                    {detailTab === "sicil" && (() => {
                      const toothHistory = (patientForm.clinicalHistory || []).filter(h => {
                        if (!h.selectedTeeth) return false;
                        const teethArr = Array.isArray(h.selectedTeeth) ? h.selectedTeeth : h.selectedTeeth.split(",").map(s => s.trim());
                        return teethArr.includes(detailToothModal.toString());
                      }).sort((a, b) => {
                         const parseDate = (dStr, tStr) => {
                           if (!dStr) return 0;
                           let day = 0, month = 0, year = 0;
                           if (dStr.includes(".")) [day, month, year] = dStr.split(".");
                           else if (dStr.includes("/")) [day, month, year] = dStr.split("/");
                           else if (dStr.includes("-")) [year, month, day] = dStr.split("-");
                           const [hr, min] = (tStr || "00:00").split(":");
                           return new Date(year, month - 1, day, hr, min).getTime();
                         };
                         return parseDate(b.date, b.time) - parseDate(a.date, a.time);
                      });

                      if (toothHistory.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center h-40 text-center opacity-50 py-10">
                            <i className="fa-solid fa-clock-rotate-left text-4xl text-slate-300 dark:text-slate-600 mb-3"></i>
                            <span className="text-slate-500 dark:text-slate-400 font-black text-[13px]">
                              Bu dişe ait geçmiş bir klinik kayıt bulunmuyor.
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div className="p-2 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px before:h-full before:w-[3px] before:bg-gradient-to-b before:from-indigo-500 before:via-emerald-400 before:to-transparent dark:before:via-emerald-700">
                          {toothHistory.map((h, idx) => (
                            <div key={idx} className="relative flex items-start justify-start group mb-6 pl-10 animate-pop" style={{animationDelay: `${idx * 0.1}s`}}>
                              <div className="absolute left-2.5 flex items-center justify-center w-8 h-8 rounded-full border-[3px] border-white dark:border-[#0f172a] bg-white dark:bg-slate-800 shadow-md shrink-0 z-10 text-slate-500 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 -translate-x-1/2 mt-1">
                                {h.visitType === "İlk Muayene" ? <i className="fa-solid fa-eye text-[12px]"></i> :
                                 h.treatment.toLowerCase().includes("kanal") ? <i className="fa-solid fa-tooth text-[12px] text-rose-500 group-hover:text-white"></i> :
                                 h.treatment.toLowerCase().includes("dolgu") ? <i className="fa-solid fa-fill-drip text-[12px] text-amber-500 group-hover:text-white"></i> :
                                 h.treatment.toLowerCase().includes("çekim") ? <i className="fa-solid fa-pliers text-[12px] text-red-600 group-hover:text-white"></i> :
                                 h.treatment.toLowerCase().includes("implant") ? <i className="fa-solid fa-screw text-[12px] text-purple-500 group-hover:text-white"></i> :
                                 <i className="fa-solid fa-stethoscope text-[12px]"></i>}
                              </div>
                              
                              <div className="w-full bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative">
                                <div className="absolute top-4 left-[-6px] w-3 h-3 bg-slate-50 dark:bg-slate-900/50 border-b border-l border-slate-200 dark:border-slate-700 transform rotate-45"></div>
                                <div className="flex justify-between items-center mb-2">
                                  <div className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider border border-indigo-200 dark:border-indigo-800">
                                    {h.date} • {h.time}
                                  </div>
                                  <div className="text-[9px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800">{h.visitType}</div>
                                </div>
                                
                                <h5 className="font-black text-slate-800 dark:text-white text-[13px] leading-snug mb-1.5">{h.treatment}</h5>
                                
                                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                  <i className="fa-solid fa-user-doctor"></i> Hekim: <span className="text-slate-700 dark:text-slate-300">{globalData.systemUsers?.[h.doctorId]?.displayName || h.doctorName}</span>
                                </div>
                                
                                {(h.diagnosis || h.complaint || h.procedureNotes || h.materials) && (
                                  <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50 text-[10px] space-y-1 shadow-inner mt-2">
                                    {h.diagnosis && <div className="flex gap-2"><span className="font-black text-rose-500 shrink-0 w-14">Tanı:</span> <span className="text-slate-700 dark:text-slate-300 font-semibold">{h.diagnosis}</span></div>}
                                    {h.complaint && <div className="flex gap-2"><span className="font-black text-amber-500 shrink-0 w-14">Şikayet:</span> <span className="text-slate-700 dark:text-slate-300 font-semibold">{h.complaint}</span></div>}
                                    {h.procedureNotes && <div className="flex gap-2"><span className="font-black text-indigo-500 shrink-0 w-14">Not:</span> <span className="text-slate-700 dark:text-slate-300 font-semibold">{h.procedureNotes}</span></div>}
                                    {h.materials && <div className="flex gap-2"><span className="font-black text-emerald-500 shrink-0 w-14">Materyal:</span> <span className="text-slate-700 dark:text-slate-300 font-semibold">{h.materials}</span></div>}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
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
  const { fbUser, auth, db, isReady } = useFirebase();

        const appId =
          typeof __app_id !== "undefined" ? __app_id : "default-klinik-app";

        const [isDarkMode, setIsDarkMode] = useState(() => {
          const savedMode = localStorage.getItem("klinikDarkMode");
          return savedMode === "true";
        });

        // YENİ: Gizlilik Modu ve Kopyalama Özellikleri
        const [isPrivacyMode, setIsPrivacyMode] = useState(true); // YENİ: Varsayılan olarak hep GİZLİ başlar
        const [pinModal, setPinModal] = useState({ isOpen: false, input: "", error: "" });
        const [pinChangeForm, setPinChangeForm] = useState({ oldPin: "", newPin: "", confirmPin: "" });
        const [isPinChangeModalOpen, setIsPinChangeModalOpen] = useState(false);
        const [copiedPhoneId, setCopiedPhoneId] = useState(null);

        // Paraları gizlemek için akıllı fonksiyon
        const renderMoney = (amount) => {
          // YENİ: Eğer giriş yapan kişi "asistan" ise gizlilik kalkanını delip geçer ve her zaman rakamları görür.
          // Patron ve Hekimler ise "Gizlilik Modu" açıksa (göz kapalıysa) *** olarak görmeye devam eder.
          if (isPrivacyMode && currentUserProfile?.role !== "assistant") return "***";
          
          return typeof amount === "number"
            ? amount.toLocaleString("tr-TR")
            : amount;
        };

        // Tek tıkla telefon kopyalama fonksiyonu (Güçlendirilmiş)
        const handleCopyPhone = (e, phone, id) => {
          e.stopPropagation();
          if (!phone || phone === "-") return;
          
          if (navigator.clipboard && window.isSecureContext) {
              navigator.clipboard.writeText(phone);
          } else {
              // HTTPS olmayan lokal ağlar için Fallback (Plan B)
              const textArea = document.createElement("textarea");
              textArea.value = phone;
              textArea.style.position = "fixed";
              textArea.style.left = "-999999px";
              textArea.style.top = "-999999px";
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              try { document.execCommand('copy'); } catch (err) { console.error('Kopyalama hatası', err); }
              document.body.removeChild(textArea);
          }

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
        // ---------------------------------------------------------

        const [deferredPrompt, setDeferredPrompt] = useState(null);

        const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

        const [currentUser, setCurrentUser] = useState(null);
        const [isAuthChecking, setIsAuthChecking] = useState(true); // YENİ: Anlık parlama sorunu için
        const [isLoggingOut, setIsLoggingOut] = useState(false); // YENİ: Çıkış yapılıyor animasyonu için

        // YENİ V2: GERÇEK FİREBASE AUTH OTURUM KONTROLÜ (Tam Sıfırlama ve Güvenlik Eklendi)
        useEffect(() => {
          if (!auth || !db) return;

          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
              try {
                 let foundUsername = null;

                 const checkUserInDB = async () => {
                     const snapNew = await get(child(ref(db), 'KlinikAnaVeritabani/users'));
                     if (snapNew.exists()) {
                        const allUsers = snapNew.val();
                        const uMatch = Object.values(allUsers).find(u => u.email === user.email);
                        if (uMatch) return uMatch.username;
                     }
                     if (user.email && user.email.includes("@klinik.com")) {
                        return user.email.split("@")[0];
                     }
                     return null;
                 };

                 foundUsername = await checkUserInDB();

                 if (!foundUsername) {
                     await new Promise(resolve => setTimeout(resolve, 2000));
                     foundUsername = await checkUserInDB();
                 }

                 if (foundUsername) {
                    const userCheck = await get(child(ref(db), `KlinikAnaVeritabani/users/${foundUsername}`));
                    if (userCheck.exists() && userCheck.val().active === false) {
                        setAuthError("Hesabınız yöneticiniz tarafından askıya alınmıştır.");
                        await signOut(auth);
                        setCurrentUser(null);
                        setAuthForm({ username: "", password: "" }); // Şifreyi sil
                        setIsAuthChecking(false);
                        return;
                    }
                    
                    setCurrentUser(foundUsername);
                    sessionStorage.setItem("klinikAktifKullanici", foundUsername);
                    sessionStorage.setItem("klinikOturumTokeni", "active");
                    
                    // İÇERİ GİRİLDİĞİNDE ŞİFRE KUTULARINI GÜVENLİK İÇİN BOŞALT!
                    setAuthForm({ username: "", password: "" });
                    setRegisterForm({ name: "", title: "", username: "", email: "", password: "" });
                    setAuthError(""); 
                 } else {
                    setAuthError("Kullanıcı veritabanında bulunamadı. Lütfen tekrar kayıt olun.");
                    await signOut(auth);
                    setCurrentUser(null);
                    setAuthForm({ username: "", password: "" }); // Şifreyi sil
                 }
              } catch(err) {
                 console.error("Oturum Kontrol Hatası:", err);
                 await signOut(auth);
                 setCurrentUser(null);
                 setAuthForm({ username: "", password: "" }); // Şifreyi sil
              }
            } else {
               setCurrentUser(null);
               // SİSTEMDEN ÇIKILDIĞINDA HER ŞEYİ KESİNLİKLE SIFIRLA
               setAuthForm({ username: "", password: "" });
               setRegisterForm({ name: "", title: "", username: "", email: "", password: "" });
               setAuthMode("login");
               setActiveTab("home");
            }
            setIsAuthChecking(false); 
          });

          return () => unsubscribe();
        }, [auth, db]);
// ==========================================
  // ADIM 1: YENİ ROL VE YETKİ SİSTEMİ (RBAC)
  // ==========================================

  const ROLE_PERMISSIONS = {
    clinic_owner: {
      "patients_view": true, "patients_create": true, "patients_edit": true, "patients_delete": true,
      "appointments_view": true, "appointments_create": true, "appointments_edit": true, "appointments_delete": true,
      "finance_view": true, "finance_payment": true, "finance_discount": true, "finance_edit": true,
      "doctors_view": true, "doctors_create": true, "doctors_edit": true, "doctors_delete": true,
      "users_view": true, "users_create": true, "users_edit": true, "users_delete": true,
      "settings_view": true, "settings_edit": true,
      "treatments_manage": true
    },
    doctor: {
      "patients_view": true, "patients_create": true, "patients_edit": true, "patients_delete": false,
      "appointments_view": true, "appointments_create": true, "appointments_edit": true, "appointments_delete": false,
      "finance_view": true, "finance_payment": true, "finance_discount": false, "finance_edit": false,
      "doctors_view": true, "doctors_create": false, "doctors_edit": false, "doctors_delete": false,
      "users_view": false, "users_create": false, "users_edit": false, "users_delete": false,
      "settings_view": false, "settings_edit": false,
      "treatments_manage": false
    },
    head_assistant: { 
      "patients_view": true, "patients_create": true, "patients_edit": true, "patients_delete": false,
      "appointments_view": true, "appointments_create": true, "appointments_edit": true, "appointments_delete": true,
      "finance_view": true, "finance_payment": true, "finance_discount": true, "finance_edit": false,
      "doctors_view": true, "doctors_create": false, "doctors_edit": false, "doctors_delete": false,
      "users_view": true, "users_create": false, "users_edit": false, "users_delete": false,
      "settings_view": false, "settings_edit": false,
      "treatments_manage": false
    },
    assistant: {
      "patients_view": true, "patients_create": true, "patients_edit": true, "patients_delete": false,
      "appointments_view": true, "appointments_create": true, "appointments_edit": true, "appointments_delete": false,
      "finance_view": false, "finance_payment": true, "finance_discount": false, "finance_edit": false,
      "doctors_view": true, "doctors_create": false, "doctors_edit": false, "doctors_delete": false,
      "users_view": false, "users_create": false, "users_edit": false, "users_delete": false,
      "settings_view": false, "settings_edit": false,
      "treatments_manage": false
    }
  };

// --- YENİ: KLİNİK İZOLASYONU VE HESAP DEĞİŞTİRME MOTORU ---
  const [switchAccountModal, setSwitchAccountModal] = useState({
    isOpen: false,
    targetUsername: null,
    targetName: "",
    targetRole: "",
    password: "",
    error: "",
    showPassword: false // YENİ: Şifre gösterme durumu
  });
  const [isUsersSubmenuOpen, setIsUsersSubmenuOpen] = useState(false); // YENİ: Tıklanabilir alt menü durumu

  // 🚀 V2 MİMARİSİ: TEK KAYNAK (SINGLE SOURCE OF TRUTH) BEYİN FONKSİYONLARI
      const resolveClinicId = (usernameToFind) => {
        if (!usernameToFind) return "clinic_default";
        const userObj = globalData.systemUsers?.[usernameToFind];
        if (userObj && userObj.clinicId) return userObj.clinicId;
        return `clinic_${usernameToFind}`; // Güvenlik Kalkanı
      };

      const currentClinicId = currentUser ? resolveClinicId(currentUser) : null;

      const getClinicUsers = () => {
        if (!currentClinicId) return [];
        return Object.values(globalData.systemUsers || {})
          .filter(u => u.clinicId === currentClinicId && u.active !== false && u.username !== currentUser)
          .map(u => ({
            username: u.username,
            name: u.displayName || u.username,
            role: u.role,
            email: u.email
          }));
      };

      const handleSwitchAccountSubmit = async (e) => {
        e.preventDefault();
        const targetUser = switchAccountModal.targetUsername;
        const targetName = switchAccountModal.targetName;
        const typedPassword = switchAccountModal.password;

        if (!targetUser || !typedPassword) return;

        try {
          const targetProfile = globalData.systemUsers?.[targetUser];
          if (!targetProfile) throw new Error("Kullanıcı profili bulunamadı!");
          
          const safeClinicDomain = (targetProfile.clinicId || currentClinicId || "klinik").replace(/[^a-zA-Z0-9]/g, "");
          const targetEmail = targetProfile.email || `${targetUser}@${safeClinicDomain}.internal`.toLowerCase();

          await signInWithEmailAndPassword(auth, targetEmail, typedPassword);

          // YENİ: GEÇİŞ YAPILDIĞINDA HER ŞEYİ SIFIRLA VE ANA SAYFAYA (HOME) ZORLA!
          setSwitchAccountModal({ isOpen: false, targetUsername: null, targetName: "", targetRole: "", password: "", error: "", showPassword: false });
          setIsUserMenuOpen(false);
          setIsUsersSubmenuOpen(false);
          setIsPatientModalOpen(false);
          setIsModalOpen(false);
          setIsDoctorDetailsModalOpen(false);
          setSearchDropdownOpen(false);
          setIsAptSearchOpen(false);
          
          setActiveTab("home"); // Ana sayfadan tertemiz başlat
          
          showNotification(`${targetName} hesabına başarıyla geçiş yapıldı.`, "success");
        } catch (error) {
          console.error("Hesap değiştirme hatası:", error);
          setSwitchAccountModal(prev => ({ ...prev, error: "Girdiğiniz şifre hatalı! Lütfen tekrar deneyin." }));
        }
      };
      
      const [currentUserProfile, setCurrentUserProfile] = useState(null);

      useEffect(() => {
          if (!currentUser || !globalData.systemUsers) return;

          const profile = globalData.systemUsers[currentUser];
          if (profile) {
            // V2 MİMARİSİ DÜZELTMESİ: Veriler currentUser objesi altında toplanır. Bu yüzden ayarları doğrudan currentUser üzerinden okumalıyız.
            const customMatrix = globalData.settingsDb?.[currentUser]?.yetkiler?.[profile.role] || ROLE_PERMISSIONS[profile.role];

            setCurrentUserProfile({
              ...profile,
              name: profile.displayName || profile.username, // Eski sistemlerle tam uyumluluk
              permissions: profile.role === "clinic_owner" ? ROLE_PERMISSIONS["clinic_owner"] : { ...customMatrix }
            });
          }
        }, [currentUser, globalData.systemUsers, globalData.settingsDb]);

      const hasPermission = (permissionString) => {
        if (!currentUserProfile) return false;
        if (currentUserProfile.active === false) return false;
        const safePerm = permissionString.replace(".", "_");
        return !!currentUserProfile.permissions?.[safePerm];
      };

      const normalizeUsername = (username) => {
        return (username || "").toString().trim().toLowerCase();
      };

      const checkUsernameAvailability = (uname, excludeName = null) => {
        if (!uname || uname.trim().length < 3) return null; 
        const normalized = normalizeUsername(uname);
        if (excludeName && normalizeUsername(excludeName) === normalized) return true; 
        
        const isTaken = Object.values(globalData.systemUsers || {}).some(u => normalizeUsername(u.username) === normalized);
        return !isTaken; 
      };

      const getClinicOwnerId = () => {
        if (!currentClinicId) return currentUser; 
        const ownerEntry = Object.values(globalData.systemUsers || {}).find(u => u.clinicId === currentClinicId && u.role === "clinic_owner");
        return ownerEntry ? ownerEntry.username : currentUser;
      };

      const getVisibleDoctors = () => {
        if (!currentClinicId) return [];

        const allSystemDoctors = Object.values(globalData.systemUsers || {})
            .filter(u => u.clinicId === currentClinicId && u.active !== false && u.role !== "assistant" && u.role !== "head_assistant")
            .map(u => u.username);

        if (currentUserProfile?.role === "assistant") {
          const assigned = currentUserProfile.assignedDoctors || [];
          return allSystemDoctors.filter(doc => assigned.includes(doc));
        }

        return allSystemDoctors;
      };
      // ==========================================

        const [savedUsernames, setSavedUsernames] = useState(() =>
          JSON.parse(localStorage.getItem("klinikSavedUsers") || "[]")
        );

        const [authMode, setAuthMode] = useState("login");

        const [authForm, setAuthForm] = useState({
          username: "",
          password: "",
        });
        
        const [showSavedUsers, setShowSavedUsers] = useState(false); // YENİ: Kayıtlı kullanıcılar menüsü durumu

        const [registerForm, setRegisterForm] = useState({
    name: "",
    title: "",
    username: "",
    email: "", // YENİ: Kayıt olurken e-posta da tutulacak
    password: "",
  });

        const [forgotForm, setForgotForm] = useState({
          email: "", // Artık sadece e-posta isteyeceğiz
        });

        const [authError, setAuthError] = useState("");
        // YENİ: Şifre Göster/Gizle durumu için
        const [showPassword, setShowPassword] = useState(false);

        const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

        const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

        const [passwordForm, setPasswordForm] = useState({
          oldPass: "",
          newPass: "",
          confirmPass: "",
          email: "",
        });
        // YENİ: Şifreleri gizle/göster durumu için
        const [showPassState, setShowPassState] = useState({
          old: false,
          new: false,
          confirm: false,
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
        const [globalSearchInput, setGlobalSearchInput] = useState(""); // YENİ: Anlık yazım için

        const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
        const searchRef = useRef(null);
        const [patientSuggestions, setPatientSuggestions] = useState([]);

        const [aptSearchQuery, setAptSearchQuery] = useState("");
        const [aptSearchInput, setAptSearchInput] = useState(""); // YENİ: Anlık yazım için

        const [isAptSearchOpen, setIsAptSearchOpen] = useState(false);
        const aptSearchRef = useRef(null);

        // YENİ: DEBOUNCE MOTORU (Klavye donmalarını engeller, yazma bitince arar)
        useEffect(() => {
          const globalTimer = setTimeout(() => setGlobalSearch(globalSearchInput), 300);
          return () => clearTimeout(globalTimer);
        }, [globalSearchInput]);

        useEffect(() => {
          const aptTimer = setTimeout(() => setAptSearchQuery(aptSearchInput), 300);
          return () => clearTimeout(aptTimer);
        }, [aptSearchInput]);

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
        
        // YENİ: Gelişmiş Randevu İptal ve Takip Modalı State'i
        const [cancelAptModal, setCancelAptModal] = useState({ 
          isOpen: false, aptKey: null, docId: null, aptData: null, reasonNote: "" 
        });
        // YENİ EKLENEN: Takvime aktarılacak hastayı tutan React State'i
        const [pendingAptPatient, setPendingAptPatient] = useState(null);

        const [paymentInput, setPaymentInput] = useState("");
        const [paymentMethod, setPaymentMethod] = useState("Nakit");
        const [discountPercent, setDiscountPercent] = useState(""); // YENİ: Toplu indirim yüzdesi
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
          
          let updatedAppointments = JSON.parse(JSON.stringify(globalData.appointments || {}));
          let updatedPlanned = [...(patientForm.plannedTreatments || [])];
          let addedRevenueCount = 0;
          let isAptUpdated = false;
          const docId = newHistoryForm.doctorId || currentUser;

          const completedIds = newHistoryForm.completedPlanIds || [];
          if (completedIds.length > 0) {
              updatedPlanned = updatedPlanned.map(tx => {
                  if (completedIds.includes(tx.id) && !tx.isCompleted) {
                      return { ...tx, isCompleted: true, completedAt: Date.now(), completedBy: currentUser };
                  }
                  return tx;
              });

              Object.keys(updatedAppointments).forEach(docId => {
                  Object.keys(updatedAppointments[docId]).forEach(aptKey => {
                      const apt = updatedAppointments[docId][aptKey];
                      if (apt.patientName === patientForm.name && apt.selectedTreatments) {
                          const hasCompletedPlan = apt.selectedTreatments.some(t => {
                              return completedIds.some(cId => {
                                  const p = updatedPlanned.find(up => up.id === cId);
                                  return p && p.treatment === t.treatment && p.tooth === t.tooth;
                              });
                          });
                          if (hasCompletedPlan && apt.status !== "Geldi") {
                              updatedAppointments[docId][aptKey].status = "Geldi";
                              isAptUpdated = true;
                          }
                      }
                  });
              });
          }

          const newHistory = {
            id: "hist_" + Date.now(),
            appointmentId: null,
            date: newHistoryForm.date,
            time: newHistoryForm.time,
            timestamp: Date.now(),
            doctorId: docId,
            doctorName: globalData.systemUsers?.[docId]?.displayName || docId,
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
            plannedTreatments: updatedPlanned,
            clinicalHistory: [newHistory, ...(patientForm.clinicalHistory || [])]
          };

          setPatientForm(updatedPatient);
          saveGlobalData({
            ...globalData,
            appointments: isAptUpdated ? updatedAppointments : globalData.appointments,
            patientsDb: { ...globalData.patientsDb, [patientForm.id]: updatedPatient }
          });
          setIsAddHistoryModalOpen(false);
          setNewHistoryForm({ treatment: "", selectedTeeth: "", complaint: "", clinicalFindings: "", diagnosis: "", procedureNotes: "", materials: "", anesthesia: "", prescription: "", recommendations: "", nextAppointmentDate: "", completedPlanIds: [] });
          showNotification("Klinik geçmiş başarıyla kaydedildi.");
        };

        const [patientModalTab, setPatientModalTab] = useState("info");

        const [activePlanTreatment, setActivePlanTreatment] = useState("");

        const [editingTxId, setEditingTxId] = useState(null);

        const [editingTxPrice, setEditingTxPrice] = useState("");

        const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
        const [newDoctorForm, setNewDoctorForm] = useState({ name: "", title: "Hekim" });
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
        // YENİ: Klinik Kullanıcıları Yönetimi State'leri
        const [isUserModalOpen, setIsUserModalOpen] = useState(false);
        const [editingUsername, setEditingUsername] = useState(null);
        const [newUserForm, setNewUserForm] = useState({
          username: "", password: "", name: "", role: "assistant", active: true, assignedDoctors: []
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
          
        const [patientSortOrder, setPatientSortOrder] = useState("default"); // YENİ: Kod sıralama durumu (default, asc, desc)

        const [isHeaderVisible, setIsHeaderVisible] = useState(true);
        const [showAttendanceDetails, setShowAttendanceDetails] =
          useState(false);
          // --- KLİNİK DOSYA MASASI STATE'LERİ ---
        const [activeFolderId, setActiveFolderId] = useState(null);
        const [folderSearch, setFolderSearch] = useState("");
        const [takipSubFilter, setTakipSubFilter] = useState("all"); // YENİ: Takip Havuzu İçin Alt Filtre
        // --------------------------------------
        const [dashboardPeriod, setDashboardPeriod] = useState("month");
        const [expandedTx, setExpandedTx] = useState(null); // Ana sayfa detayları için

        const [financePeriod, setFinancePeriod] = useState("all");

        const [financeCustomStart, setFinanceCustomStart] = useState("");

        const [financeCustomEnd, setFinanceCustomEnd] = useState("");

        const [financeDetailView, setFinanceDetailView] = useState("overview");
        // --- KLİNİK AYARLARI STATE YÖNETİMİ ---
        const DEFAULT_SETTINGS = {
          klinik: { ad: "Benim Kliniğim", kisaAd: "Klinik", telefon: "", eposta: "", adres: "", durum: "Aktif", logo: "" },
          calisma: { 
            baslama: "09:00", bitis: "19:00",
            gunler: { "Pzt": true, "Sal": true, "Çar": true, "Per": true, "Cum": true, "Cmt": true, "Paz": false },
            ozelGunler: []
          },
          randevu: { varsayilanSure: "30", slotAraligi: "15", cakismaKontrolu: true, gecmisTarihUyarisi: true },
          gorunum: { tema: "Sistem", renk: "indigo", yogunluk: "standart", animasyonlar: true },
          bildirim: { smsAktif: false, whatsappAktif: true, randevuHatirlatma: "24" },
          guvenlik: { oturumZamanAsimi: "120", hassasEkranUyarisi: true, finansSifresi: "0000" }, // Varsayılan PIN: 0000
          otomasyon: { aktifKural: 4 },
          dosya: { acil: true, kontrol: true, tedavi: true, lab: true, evrak: true, yeni: true },
          // YENİ EKLENEN KISIM: VARSAYILAN YETKİ MATRİSİ 
          yetkiler: {
             doctor: ROLE_PERMISSIONS.doctor,
             head_assistant: ROLE_PERMISSIONS.head_assistant,
             assistant: ROLE_PERMISSIONS.assistant
          }
        };

        const [settings, setSettings] = useState(DEFAULT_SETTINGS);

        // AYARLARI OKUMA: Hibrit Motor (Önce Local, Sonra Bulut)
        useEffect(() => {
          if (currentUser) {
            // YENİ: Asistan giriş yaparsa kendi boş ayarlarını değil, onu ekleyen Patronun ayarlarını çeker
            const ownerId = (globalData.userProfiles?.[currentUser]?.role === "assistant" || globalData.userProfiles?.[currentUser]?.role === "doctor")
                          ? globalData.userProfiles[currentUser].createdBy 
                          : currentUser;

            // 1. Aşama: Sisteme girer girmez cihaz hafızasından anında çek
            const localSaved = localStorage.getItem(`klinikSettings_${ownerId}`);
            if (localSaved) {
              setSettings(JSON.parse(localSaved));
            } else {
              setSettings(DEFAULT_SETTINGS);
            }

            // 2. Aşama: Firebase (Bulut) verisi internetten inince, en güncel haliyle kontrol et
            if (globalData && globalData.settingsDb && globalData.settingsDb[ownerId]) {
              const cloudSettings = globalData.settingsDb[ownerId];
              setSettings(cloudSettings);
              localStorage.setItem(`klinikSettings_${ownerId}`, JSON.stringify(cloudSettings));
            }
          }
        }, [currentUser, globalData.settingsDb, globalData.userProfiles]);

        const [settingsDraft, setSettingsDraft] = useState(null);
        const [settingsTab, setSettingsTab] = useState("ozet");
        const [settingsSearch, setSettingsSearch] = useState("");
        const [isCheckingData, setIsCheckingData] = useState(false);
        const [integrityReport, setIntegrityReport] = useState(null);

        // --- GERÇEK ZAMANLI EKLENTİLER (BELGE, TEDAVİ, TEMA) ---
        const [documentPreview, setDocumentPreview] = useState(null);
        const [isAddTreatmentModalOpen, setIsAddTreatmentModalOpen] = useState(false);
const [newTreatmentForm, setNewTreatmentForm] = useState({ name: "", category: "Teşhis ve Radyoloji", price: "" });

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
     const interval = parseInt(settings?.randevu?.slotAraligi || "15", 10);
     const startStr = settings?.calisma?.baslama || "09:00";
     const endStr = settings?.calisma?.bitis || "19:00";
           
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

        // --- YENİ TEDAVİYİ HER YERE AKTARAN MOTOR (KUSURSUZ) ---
        const DYNAMIC_PRICING_CATEGORIES = useMemo(() => {
           const cats = JSON.parse(JSON.stringify(INITIAL_PRICING_CATEGORIES));
           const ownerId = (currentUserProfile?.role === "assistant" || currentUserProfile?.role === "doctor") 
                         ? currentUserProfile.createdBy 
                         : currentUser;

           // Akıllı Fiyat Okuma: Varsa patronun özel listesini al, yoksa eski listeyi, o da yoksa varsayılanı.
           let legacyPricing = null;
           if (globalData.pricingDb && globalData.pricingDb["Genel Muayene"] !== undefined) {
               legacyPricing = globalData.pricingDb;
           }
           const activePricing = globalData.pricingDb?.[ownerId] || legacyPricing || DEFAULT_PRICING;
           const userCustomTreatments = globalData.customTreatments?.[ownerId] || [];

           // 1. ADIM: SİLİNENLERİ TAMAMEN GİZLE (Dirilme Hatası Çözümü)
           Object.keys(cats).forEach(cat => {
               cats[cat].items = cats[cat].items.filter(tx => activePricing[tx] !== undefined);
           });

           // 2. ADIM: YENİ EKLENENLERİ GÖSTER (Tomografi vb.)
           if (userCustomTreatments.length > 0) {
              userCustomTreatments.forEach(t => {
                 if (cats[t.category] && !cats[t.category].items.includes(t.name) && activePricing[t.name] !== undefined) {
                    cats[t.category].items.push(t.name);
                 }
              });
           }
           return cats;
        }, [globalData.customTreatments, globalData.pricingDb, currentUser, currentUserProfile]);

        const handleSaveNewCustomTreatment = (e) => {
          e.preventDefault();
          const ownerId = getClinicOwnerId();

          const userPricing = globalData.pricingDb?.[ownerId] || (typeof globalData.pricingDb === "object" && globalData.pricingDb["Genel Muayene"] ? globalData.pricingDb : DEFAULT_PRICING);
          const treatmentName = newTreatmentForm.name.trim();
          
          if(!treatmentName) return;

          const updatedPricing = {
            ...userPricing,
            [treatmentName]: parseFloat(newTreatmentForm.price) || 0
          };

          let existingCustomDb = globalData.customTreatments || {};
          if (Array.isArray(existingCustomDb)) existingCustomDb = {};

          const userCustomTreatments = [...(existingCustomDb[ownerId] || [])];
          if (!userCustomTreatments.some(t => t.name === treatmentName)) {
             userCustomTreatments.push({
                name: treatmentName,
                category: newTreatmentForm.category
             });
          }

          const updatedCustomTreatmentsDb = {
            ...existingCustomDb,
            [ownerId]: userCustomTreatments
          };

          saveGlobalData({ 
            ...globalData, 
            pricingDb: { ...(globalData.pricingDb || {}), [ownerId]: updatedPricing },
            customTreatments: updatedCustomTreatmentsDb 
          }).then(() => {
              setPricingEditValues(prev => ({ ...prev, [treatmentName]: parseFloat(newTreatmentForm.price) || 0 }));
              showNotification("Yeni işlem başarıyla kaydedildi ve tüm listelere eklendi.", "success");
              setIsAddTreatmentModalOpen(false);
              setNewTreatmentForm({ name: "", category: "Klinik İşlem", price: "" });
          });
        };

        // 1. OTOMATİK TEMA ALGILAYICI VE DEĞİŞTİRİCİ (Aydınlık/Karanlık)
        useEffect(() => {
          if (!settings?.gorunum) return;
          
          if (settings.gorunum.tema === "Koyu") {
             setIsDarkMode(true);
          } else if (settings.gorunum.tema === "Açık") {
             setIsDarkMode(false);
          } else if (settings.gorunum.tema === "Sistem") {
             setIsDarkMode(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
          }
        }, [settings?.gorunum?.tema]);

        // 2. KLİNİK RENGİ VE EKRAN YOĞUNLUĞU MOTORU (Sihirli Enjeksiyon)
        useEffect(() => {
           if (!settings?.gorunum) return;

           // A. Arayüz Yoğunluğu (Root Font Size ile tüm sistemi orantılı büyütüp küçültür)
           if (settings.gorunum.yogunluk === 'kompakt') {
              document.documentElement.style.fontSize = "14px";
           } else if (settings.gorunum.yogunluk === 'genis') {
              document.documentElement.style.fontSize = "17px";
           } else {
              document.documentElement.style.fontSize = "16px";
           }

           // B. Klinik Marka Rengi Sihirbazı (İndigo sınıflarını dinamik olarak ezer)
           const colorMap = {
             emerald: { 50: '#ecfdf5', 100: '#d1fae5', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 900: '#064e3b' },
             rose: { 50: '#fff1f2', 100: '#ffe4e6', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 900: '#881337' },
             sky: { 50: '#f0f9ff', 100: '#e0f2fe', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 900: '#0c4a6e' },
             slate: { 50: '#f8fafc', 100: '#f1f5f9', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 900: '#0f172a' }
           };
           
           const currentR = settings.gorunum.renk;
           const styleId = "dynamic-theme-override";
           let styleEl = document.getElementById(styleId);
           
           if (!currentR || currentR === 'indigo' || !colorMap[currentR]) {
              if (styleEl) styleEl.remove();
              return;
           }

           if (!styleEl) {
              styleEl = document.createElement("style");
              styleEl.id = styleId;
              document.head.appendChild(styleEl);
           }
           
           const c = colorMap[currentR];
           // Sistemin damarlarına yeni rengi enjekte et:
           styleEl.innerHTML = `
             .bg-indigo-50 { background-color: ${c[50]} !important; }
             .bg-indigo-100 { background-color: ${c[100]} !important; }
             .bg-indigo-500 { background-color: ${c[500]} !important; }
             .bg-indigo-600 { background-color: ${c[600]} !important; }
             .hover\\:bg-indigo-700:hover { background-color: ${c[700]} !important; }
             .text-indigo-400 { color: ${c[400]} !important; }
             .text-indigo-500 { color: ${c[500]} !important; }
             .text-indigo-600 { color: ${c[600]} !important; }
             .text-indigo-700 { color: ${c[700]} !important; }
             .border-indigo-200 { border-color: ${c[100]} !important; }
             .border-indigo-500 { border-color: ${c[500]} !important; }
             .border-indigo-600 { border-color: ${c[600]} !important; }
             .focus\\:border-indigo-500:focus { border-color: ${c[500]} !important; }
             .ring-indigo-500 { --tw-ring-color: ${c[500]} !important; }
             .dark\\:bg-indigo-900\\/20 { background-color: ${c[900]}33 !important; }
             .dark\\:bg-indigo-900\\/30 { background-color: ${c[900]}4D !important; }
             .dark\\:text-indigo-400 { color: ${c[400]} !important; }
           `;
        }, [settings?.gorunum?.renk, settings?.gorunum?.yogunluk]);

        const handleSettingChange = (kategori, key, value) => {
          setSettingsDraft(prev => {
            const currentDraft = prev || JSON.parse(JSON.stringify(settings));
            return { ...currentDraft, [kategori]: { ...currentDraft[kategori], [key]: value } };
          });
        };

        // AYARLARI KAYDETME: Hibrit Motor (Hem Local Hem Bulut)
        // AYARLARI KAYDETME: Hibrit Motor (Hem Local Hem Bulut)
        const saveSettings = () => {
          if (!settingsDraft) return;
          
          // ZIRH: Firebase'i çökerten boş/tanımsız (undefined) verileri temizler
          const finalSettings = JSON.parse(JSON.stringify(settingsDraft));
          
          if (!finalSettings.meta) finalSettings.meta = {};
          finalSettings.meta.lastSavedAt = Date.now();

          // YENİ DÜZELTME: Ayarları işlemi yapan kişiye değil, Kliniğin Ana Sahibine (Owner) kaydet
          const ownerId = typeof getClinicOwnerId === "function" ? getClinicOwnerId() : currentUser;

          const updatedSettingsDb = {
            ...(globalData.settingsDb || {}),
            [ownerId]: finalSettings
          };

          // 1. Aşama: Cihaza kaydet (Patronun ID'si ile)
          localStorage.setItem(`klinikSettings_${ownerId}`, JSON.stringify(finalSettings));
          setSettings(finalSettings); 

          // 2. Aşama: Ayarları Buluta (Firebase) Yolla
          saveGlobalData({ ...globalData, settingsDb: updatedSettingsDb })
            .then(() => {
              setSettingsDraft(null);
              showNotification("Ayarlar başarıyla Buluta kaydedildi.", "success");
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
          title: "Onay",
          message: "",
          onConfirm: null,
          requireInput: false,
          expectedText: "",
          inputText: "",
          isPassword: false, // YENİ: Şifre sorulup sorulmayacağını belirten bayrak
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
          setConfirmModal({ isOpen: true, title: "Onay", message, onConfirm, requireInput: false, expectedText: "", inputText: "", isPassword: false });
        };

        const showPromptConfirm = (title, message, expectedText, onConfirm) => {
          setConfirmModal({ isOpen: true, title, message, onConfirm, requireInput: true, expectedText, inputText: "", isPassword: false });
        };

        // YENİ: Parola Doğrulama İsteyen Onay Penceresi Motoru
        const showPasswordConfirm = (title, message, expectedPassword, onConfirm) => {
          setConfirmModal({ isOpen: true, title, message, onConfirm, requireInput: true, expectedText: expectedPassword, inputText: "", isPassword: true });
        };

        const handleConfirm = () => {
          if (confirmModal.requireInput) {
            if (confirmModal.isPassword) {
                // Şifre modu: Birebir eşleşme (büyük/küçük harf duyarlı)
                if (confirmModal.inputText !== confirmModal.expectedText) {
                    showNotification(`Şifrenizi yanlış girdiniz! Lütfen tekrar deneyin.`, "error");
                    return; 
                }
            } else {
                // Metin modu: Boşluk ve büyük/küçük harf toleranslı
                if (confirmModal.inputText.trim().toLowerCase() !== confirmModal.expectedText.trim().toLowerCase()) {
                  showNotification(`Girdiğiniz metin eşleşmedi! Lütfen "${confirmModal.expectedText}" yazın.`, "error");
                  return; 
                }
            }
          }
          if (confirmModal.onConfirm) confirmModal.onConfirm();
          setConfirmModal({ isOpen: false, title: "Onay", message: "", onConfirm: null, requireInput: false, expectedText: "", inputText: "", isPassword: false });
        };

        const handleCancelConfirm = () => {
          setConfirmModal({ isOpen: false, title: "Onay", message: "", onConfirm: null, requireInput: false, expectedText: "", inputText: "", isPassword: false });
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

        // ==============================================================
        // V2 SaaS MİMARİSİ: İZOLE KLİNİK VERİ OKUMA MOTORU
        // ==============================================================
        useEffect(() => {
          if (!isReady || !db) {
            setIsSyncing(false);
            return;
          }

          // 1. Önce ANA REHBERİ (Tüm Kullanıcıları) Dinle
          const usersRef = ref(db, 'KlinikAnaVeritabani/users');
          const unsubUsers = onValue(usersRef, (snapshot) => {
            const usersData = snapshot.exists() ? snapshot.val() : {};
            
            // Kullanıcıları globalData'ya kaydet (Eski userProfiles, usersDb, doctorProfiles çöpe atıldı)
            setGlobalData(prev => ({ ...prev, systemUsers: usersData }));
            
            // Eğer kişi giriş yapmışsa, kendi klinik odasını (clinicId) bulup sadece Orayı dinleyelim
            if (currentUser && usersData[currentUser]) {
                const myClinicId = usersData[currentUser].clinicId;
                
                // 2. KLİNİĞİN İZOLE ODASINI DİNLE
                const clinicRef = ref(db, `KlinikAnaVeritabani/clinics/${myClinicId}`);
                const unsubClinic = onValue(clinicRef, (clinicSnap) => {
                    const clinicData = clinicSnap.exists() ? clinicSnap.val() : {};
                    
                    setGlobalData(prev => ({
                        ...prev,
                        patientsDb: clinicData.patients || {},
                        appointments: clinicData.appointments || {},
                        pricingDb: clinicData.pricing ? { [currentUser]: clinicData.pricing } : {}, 
                        settingsDb: clinicData.settings ? { [currentUser]: clinicData.settings } : {},
                        customTreatments: clinicData.customTreatments ? { [currentUser]: clinicData.customTreatments } : {},
                        auditLogs: clinicData.auditLogs || {}
                    }));
                    setIsSyncing(false);
                });

                return () => unsubClinic(); // Eski kliniğin dinleyicisini temizle
            } else {
                setIsSyncing(false);
            }
          });

          return () => unsubUsers();
        }, [isReady, db, currentUser]);

        // ==============================================================
        // V2 SaaS MİMARİSİ: İZOLE KLİNİK VERİ YAZMA (KAYDETME) MOTORU
        // ==============================================================
        const saveGlobalData = async (newData) => {
          if (!db || !currentUser) return;

          try {
            // Kullanıcının hangi kliniğe ait olduğunu bul (Güvenlik zırhı)
            const myClinicId = globalData.systemUsers?.[currentUser]?.clinicId;
            if (!myClinicId) throw new Error("Klinik ID bulunamadı! İşlem reddedildi.");

            const dbRef = ref(db, "KlinikAnaVeritabani");
            const updates = {};

            // 1. EĞER HESAP (KULLANICI) EKLENİYOR VEYA SİLİNİYORSA
            if (newData.systemUsers) {
               Object.keys(newData.systemUsers).forEach(uid => {
                   if (JSON.stringify(globalData.systemUsers?.[uid]) !== JSON.stringify(newData.systemUsers[uid])) {
                       updates[`users/${uid}`] = newData.systemUsers[uid];
                   }
               });
               Object.keys(globalData.systemUsers || {}).forEach(uid => {
                   if (newData.systemUsers[uid] === undefined) updates[`users/${uid}`] = null;
               });
            }

            // 2. KLİNİK ODASI VERİLERİNİN KAYDEDİLMESİ (Hastalar, Randevular vs.)
            const checkClinicData = (localKey, dbKey) => {
              const oldData = globalData[localKey] || {};
              const newIncomingData = newData[localKey] || {};
              
              Object.keys(newIncomingData).forEach((key) => {
                if (JSON.stringify(oldData[key]) !== JSON.stringify(newIncomingData[key])) {
                  updates[`clinics/${myClinicId}/${dbKey}/${key}`] = newIncomingData[key];
                }
              });

              Object.keys(oldData).forEach((key) => {
                if (newIncomingData[key] === undefined) {
                  updates[`clinics/${myClinicId}/${dbKey}/${key}`] = null;
                }
              });
            };

            // Hangi local tablonun, kliniğin hangi klasörüne yazılacağını belirliyoruz
            checkClinicData("patientsDb", "patients");
            checkClinicData("appointments", "appointments");
            checkClinicData("auditLogs", "auditLogs");

            // Ayarlar ve Fiyatlar artık ownerId'ye (Ahmet, Mehmet) göre değil, direkt Kliniğe ait!
            if (newData.settingsDb && newData.settingsDb[currentUser]) {
                updates[`clinics/${myClinicId}/settings`] = newData.settingsDb[currentUser];
            }
            if (newData.pricingDb && newData.pricingDb[currentUser]) {
                updates[`clinics/${myClinicId}/pricing`] = newData.pricingDb[currentUser];
            }
            if (newData.customTreatments && newData.customTreatments[currentUser]) {
                updates[`clinics/${myClinicId}/customTreatments`] = newData.customTreatments[currentUser];
            }

            // Değişen her şeyi tek hamlede Firebase'e ateşle!
            if (Object.keys(updates).length > 0) {
              await update(dbRef, updates);
            }

          } catch (e) {
            showNotification("Veritabanı kayıt hatası! Lütfen sayfayı yenileyin.", "error");
            console.error("Firebase V2 Kayıt Hatası:", e);
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
              setIsUsersSubmenuOpen(false); // YENİ: Dışarı tıklayınca alt menüyü de kapat
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

          if (activeTab === "calendar" && !calendarDoctor) {
            // Asistan giriş yaptığında takvim boş yerine ona atanmış İLK HEKİMİ açsın
            if (currentUserProfile?.role === "assistant" && allDoctors.length > 0) {
              setCalendarDoctor(allDoctors[0]);
            } else {
              setCalendarDoctor(currentUser);
            }
          }

          if (activeTab === "pricing") {
            const ownerId = (globalData.userProfiles?.[currentUser]?.role === "assistant" || globalData.userProfiles?.[currentUser]?.role === "doctor")
                          ? globalData.userProfiles[currentUser].createdBy 
                          : currentUser;
                          
            let legacyPricing = null;
            if (globalData.pricingDb && globalData.pricingDb["Genel Muayene"] !== undefined) {
                legacyPricing = globalData.pricingDb;
            }

            // DÜZELTME: Eğer patron kendi fiyat listesini oluşturduysa SADECE ONU GÖSTER.
            // DEFAULT_PRICING ile birleştirme ki sildiğin Kompozit Vener geri gelmesin!
            const activePricing = globalData.pricingDb?.[ownerId] || legacyPricing || DEFAULT_PRICING;

            setPricingEditValues(activePricing);
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
        // OTURUM ZAMAN AŞIMI (IDLE TIMEOUT) MOTORU
        useEffect(() => {
          if (!currentUser) return;
          
          let timeoutId;
          const timeoutMinutes = parseInt(settings?.guvenlik?.oturumZamanAsimi || "120", 10);
          const timeoutMs = timeoutMinutes * 60 * 1000;

          const handleLogoutDueToInactivity = () => {
            sessionStorage.removeItem("klinikAktifKullanici");
            sessionStorage.removeItem("klinikOturumTokeni");
            setCurrentUser(null);
            if (typeof showNotification === "function") {
              showNotification("Uzun süre işlem yapılmadığı için güvenlik amacıyla oturumunuz kapatıldı.", "error");
            }
          };

          const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(handleLogoutDueToInactivity, timeoutMs);
          };

          const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
          events.forEach(event => window.addEventListener(event, resetTimer));

          resetTimer();

          return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => window.removeEventListener(event, resetTimer));
          };
        }, [currentUser, settings?.guvenlik?.oturumZamanAsimi]);

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
            return { bg: "#e0f2fe", text: "#1e40af", border: "#3b82f6" }; // Mavi (Varsayılan)

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

          // 1. KULLANICI TANIMLI ÖZEL BRANŞ RENKLERİ (Ayarlardan Çekilir)
          const customColors = settings?.randevu?.bransRenkleri || {};
          
          // Zeki Kelime Algılayıcı Motor
          const BRANS_KEYWORDS = {
            "cerrahi": ["cerrahi", "implant", "gömülü", "çekim", "greft", "sinüs"],
            "protez": ["protez", "kron", "zirkonyum", "porselen", "ölçü", "simantasyon", "vener", "lamina"],
            "endodonti": ["kanal", "endodonti", "kuafaj", "amputasyon"],
            "dolgu": ["dolgu", "kompozit", "inley", "onley"],
            "ortodonti": ["ortodonti", "tel", "plak", "braket", "pekiştirme"],
            "periodontoloji": ["detertraj", "küretaj", "diş taşı", "flap", "gingivektomi", "lazer"],
            "pedodonti": ["çocuk", "pedodonti", "flor", "fissür", "süt dişi", "yer tutucu"],
            "muayene": ["muayene", "teşhis", "röntgen", "kontrol", "acil"]
          };

          for (const [key, keywords] of Object.entries(BRANS_KEYWORDS)) {
             if (keywords.some(k => text.includes(k))) {
                const hexCode = customColors[key];
                if (hexCode) {
                   return {
                      bg: hexCode + "25", // Seçilen rengin %15 saydam (pastel) versiyonunu arka plan yapar
                      text: hexCode,      // Seçilen rengi yazı rengi yapar
                      border: hexCode     // Seçilen rengi kenarlık yapar
                   };
                }
             }
          }

          // 2. RENK SEÇİLMEMİŞSE VEYA YUKARIDAKİLERLE EŞLEŞMEZSE ESKİ KODLARI ÇALIŞTIR (Fallback)
          if (text.includes("acil")) return { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" };
          if (text.includes("implant")) return { bg: "#f3e8ff", text: "#6b21a8", border: "#a855f7" };
          if (text.includes("kontrol")) return { bg: "#dcfce7", text: "#166534", border: "#22c55e" };
          if (text.includes("uzun") || text.includes("kanal") || text.includes("ortodonti") || text.includes("çekim"))
            return { bg: "#ffedd5", text: "#9a3412", border: "#f97316" };

          return { bg: "#e0f2fe", text: "#1e40af", border: "#3b82f6" };
        };

        // YENİ: Tek Tıkla Durum Güncelleme (Döngüsel)
        const handleStatusCycle = (e, docId, aptKey, aptData) => {
          e.stopPropagation();

          if (!hasPermission("appointments.edit")) {
            showNotification("Randevu durumunu değiştirme yetkiniz bulunmuyor!", "error");
            return;
          }

          const cycleMap = { "Yeni Kayıt": "Geldi", Bekliyor: "Geldi", Geldi: "Gelmedi", Gelmedi: "İptal", İptal: "Bekliyor" };
          const currentStatus = aptData.status || "Bekliyor";
          const newStatus = cycleMap[currentStatus] || "Geldi";

          const updatedDocApts = { ...(globalData.appointments?.[docId] || {}) };
          updatedDocApts[aptKey] = { ...aptData, status: newStatus };

          // GÜVENLİK: Veritabanını bozmamak için DERİN KOPYA
          let updatedPatientsDb = JSON.parse(JSON.stringify(globalData.patientsDb || {})); 

          let pId = aptData.patientId; 
          if (!pId) {
            const foundPatient = Object.values(updatedPatientsDb).find(p => p.name === aptData.patientName);
            if (foundPatient) pId = foundPatient.id;
          }

          if (pId && updatedPatientsDb[pId]) {
            updatedPatientsDb[pId].lastStatus = newStatus;
            
            // YENİ: İŞLEMLERİ TAMAMLAMA VE CİROYA YANSITMA (UNDO MOTORU)
            if (updatedPatientsDb[pId].plannedTreatments) {
               let aptTreatments = aptData.selectedTreatments || [];
               if (aptData.linkedPlanId) {
                  const linkedPlan = updatedPatientsDb[pId].plannedTreatments.find(t => t.id === aptData.linkedPlanId);
                  if (linkedPlan) aptTreatments = [{ treatment: linkedPlan.treatment, tooth: linkedPlan.tooth, id: linkedPlan.id }];
               }

               if (newStatus === "Geldi") {
                  aptTreatments.forEach(aptTx => {
                     updatedPatientsDb[pId].plannedTreatments = updatedPatientsDb[pId].plannedTreatments.map(t => {
                        if ((t.id && aptTx.id === t.id) || (t.treatment === aptTx.treatment && t.tooth === aptTx.tooth)) {
                           return { ...t, isCompleted: true, completedAt: Date.now(), completedBy: docId, aptKey: aptKey };
                        }
                        return t;
                     });
                  });
               } else if (currentStatus === "Geldi") {
                  aptTreatments.forEach(aptTx => {
                     updatedPatientsDb[pId].plannedTreatments = updatedPatientsDb[pId].plannedTreatments.map(t => {
                        if ((t.id && aptTx.id === t.id) || (t.treatment === aptTx.treatment && t.tooth === aptTx.tooth)) {
                           return { ...t, isCompleted: false, completedAt: null, completedBy: null, aptKey: null };
                        }
                        return t;
                     });
                  });
               }
            }
            
            // OTOMATİK EPİKRİZ MOTORU
            const historyArray = updatedPatientsDb[pId].clinicalHistory || [];
            const historyIndex = historyArray.findIndex((h) => h.appointmentId === aptKey);

            if (newStatus === "Geldi" && settings?.otomasyon?.otoEpikriz !== false) {
              if (historyIndex === -1) {
                const [y, m, d, ...timeArr] = aptKey.split("-");
                const timeStr = timeArr.join(":");
                const newHistory = {
                  id: "hist_" + Date.now(),
                  appointmentId: aptKey,
                  date: `${d}.${m}.${y}`,
                  time: timeStr,
                  timestamp: Date.now(),
                  doctorId: docId,
                  doctorName: globalData.systemUsers?.[docId]?.displayName || docId,
                  appointmentStatus: "Geldi",
                  visitType: "Gerçekleşen Klinik İşlem",
                  treatment: aptData.treatment || "Belirtilmedi",
                  selectedTeeth: aptData.selectedTeeth || [],
                  complaint: aptData.notes || "",
                  createdAt: Date.now(),
                  createdBy: currentUser
                };
                updatedPatientsDb[pId].clinicalHistory = [newHistory, ...historyArray];
              } else {
                updatedPatientsDb[pId].clinicalHistory[historyIndex].appointmentStatus = "Geldi";
                updatedPatientsDb[pId].clinicalHistory[historyIndex].visitType = "Gerçekleşen Klinik İşlem";
              }
            } else if (newStatus !== "Geldi" && historyIndex > -1) {
              updatedPatientsDb[pId].clinicalHistory[historyIndex].appointmentStatus = newStatus;
              updatedPatientsDb[pId].clinicalHistory[historyIndex].visitType = newStatus === "İptal" ? "İptal Edilen Randevu" : "Gerçekleşmeyen Randevu";
            }
          }

          saveGlobalData({
            ...globalData,
            appointments: { ...globalData.appointments, [docId]: updatedDocApts },
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
            totalOriginalBilled = 0,
            totalPaid = 0,
            treatments = [];

          const pData = globalData.patientsDb?.[patientId];

          // BİLANÇO/BAKİYE SADECE HASTA PLANLAMA (PLANNED TREATMENTS) ÜZERİNDEN HESAPLANIR
          if (pData && pData.plannedTreatments) {
            pData.plannedTreatments.forEach((tx) => {
              const price = parseFloat(tx.price) || 0;
              const origPrice = tx.originalPrice !== undefined ? parseFloat(tx.originalPrice) : price;

              totalBilled += price; // İndirim uygulanmışsa burası otomatik olarak düşük yansır
              totalOriginalBilled += origPrice;

              treatments.push({
                id: tx.id,
                date: tx.date,
                dateStr: new Date(tx.date).toLocaleDateString("tr-TR"),
                treatment: tx.tooth === "Tüm Çene" ? tx.treatment : `Diş: ${tx.tooth} - ${tx.treatment}`,
                price: price,
                originalPrice: origPrice,
                isPlan: true,
              });
            });
          }

          // DİKKAT: Kullanıcı talebi doğrultusunda Randevu sayfasındaki "Geldi" işlemleri hastanın ana bakiyesini VE klinik toplam cirosunu ETKİLEMEZ.
          // Bakiye ve Genel Ciro SADECE "Hasta Planlama" üzerinden hesaplanır.

          if (pData && pData.payments) {
            totalPaid = pData.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
          }

          treatments.sort((a, b) => b.date - a.date);

          return {
            totalBilled,
            totalOriginalBilled,
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
              // DÜZELTME 1: Klinik izolasyonuna göre tarama (Hekim takvimde gizli olsa bile randevuları görünür)
              const isAuthorized = currentUserProfile?.role === "assistant" 
                  ? (currentUserProfile.assignedDoctors || []).includes(dId) && resolveClinicId(dId) === currentClinicId
                  : resolveClinicId(dId) === currentClinicId;
              if (!isAuthorized) return;
              
              Object.entries(dApts).forEach(([k, apt]) => {
                const pId = patientForm?.id;
                const isMatch = (apt.patientId && pId && apt.patientId === pId) || 
                                (!apt.patientId && apt.patientName.toLowerCase() === pName.toLowerCase());
                
                if (isMatch) {
                  const parts = k.split("-");
                  if (parts.length >= 4) {
                    const y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
                    const timeStr = parts.slice(3).join(":");
                    const [hrStr, minStr] = timeStr.split(":");
                    const hr = parseInt(hrStr || 0, 10);
                    const min = parseInt(minStr || 0, 10);
                    
                    // DÜZELTME 2: NaN Hatasını Engelleyen Kusursuz Matematiksel Tarih Motoru
                    const aptTime = new Date(y, m - 1, d, hr, min).getTime();

                    all.push({
                      ...apt,
                      docId: dId,
                      dateStr: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
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

          // YENİ: Sisteme İlk Kayıt Epikrizini "Geçmiş Randevular" listesine de dahil et.
          if (patientForm?.clinicalHistory) {
            patientForm.clinicalHistory.forEach(h => {
              if (!h.appointmentId && h.appointmentStatus === "İlk Kayıt") {
                all.push({
                  status: "Geldi",
                  patientName: pName,
                  patientId: patientForm.id,
                  treatment: h.treatment || "Sisteme İlk Kayıt",
                  notes: h.complaint || "Dosya Açılışı",
                  docId: h.doctorId,
                  dateStr: h.date,
                  timeStr: h.time,
                  timestamp: h.timestamp || 0,
                  originalKey: h.id, // sahte key (hata verdirtmez, modalı açmaz)
                  dateKey: "0000-00-00",
                  duration: "-"
                });
              }
            });
          }

          const future = all.filter((a) => (a.status === "Yeni Kayıt" || a.status === "Bekliyor") && a.timestamp >= now).sort((a, b) => a.timestamp - b.timestamp);
          const past = all.filter((a) => (a.status !== "Yeni Kayıt" && a.status !== "Bekliyor") || a.timestamp < now).sort((a, b) => b.timestamp - a.timestamp);
          
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

        // YENİ: Kliniğe Özel Karma (Hash) Kodu Üreten Fonksiyon
        const getClinicNumericCode = (str) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          return Math.abs(hash % 90) + 10; // 10 ile 99 arası eşsiz 2 haneli klinik kimliği
        };

        // YENİ: Gelişmiş Hasta Kodu Üretici (Yıl + Klinik Kodu + Sıra)
        const generatePatientCode = () => {
          const year = new Date().getFullYear().toString();
          const clinicNum = getClinicNumericCode(currentClinicId || "default").toString();
          const prefix = year + clinicNum; // Örn: 202645
          
          const existingCodes = Object.values(globalData.patientsDb || {})
            .filter(p => p.patientCode && p.patientCode.startsWith(prefix) && resolveClinicId(p.addedBy) === currentClinicId)
            .map(p => parseInt(p.patientCode.slice(prefix.length), 10))
            .filter(n => !isNaN(n));
          
          const max = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
          const next = (max + 1).toString().padStart(4, '0');
          return prefix + next; // Örn: 2026450001
        };

        const handleSavePatient = (e) => {
          if (e) e.preventDefault();

          // 🛡️ ZIRH 1: Eğer form henüz belleğe yüklenmediyse işlemi durdur
          if (!patientForm) return;

          // 🛡️ ZIRH 2: YETKİ KONTROLÜ
          const isNewPatient = !patientForm.id;
          if (isNewPatient && !hasPermission("patients_create")) {
            showNotification("Yeni hasta ekleme yetkiniz bulunmuyor!", "error");
            return;
          }
          if (!isNewPatient && !hasPermission("patients_edit")) {
            showNotification("Hasta bilgilerini düzenleme yetkiniz bulunmuyor!", "error");
            return;
          }

          const ownerId = typeof getClinicOwnerId === "function" ? getClinicOwnerId() : currentUser;
          const clinicOwner = patientForm.addedBy || ownerId;
          
          const normalizedTc = (patientForm.tc || "").replace(/\D/g, "");

          // YENİ: Hasta Kaydedilirken Kodun Atanması
          let finalPatientCode = patientForm.patientCode;
          if (!finalPatientCode) {
            finalPatientCode = generatePatientCode();
          }

          // KLİNİK İÇİ TC KOPYA KONTROLÜ
          if (normalizedTc && normalizedTc.length > 0) {
            const duplicateByTc = Object.values(globalData.patientsDb || {}).find((p) => {
              const isSameClinic = resolveClinicId(p.addedBy) === currentClinicId;
              const pTc = (p.tc || "").replace(/\D/g, "");
              return isSameClinic && pTc === normalizedTc && p.id !== patientForm.id;
            });

            if (duplicateByTc) {
              showNotification("Bu TC Kimlik No ile kayıtlı başka bir hasta zaten bulunuyor!", "error");
              return;
            }
          }

          const pId = patientForm.id || push(child(ref(db), 'KlinikAnaVeritabani/Veriler/patientsDb')).key;

          // YENİ DÜZELTME: SİSTEME İLK KAYIT EPİKRİZİ (Her durumda şartsız çalışır)
          let currentHistory = patientForm.clinicalHistory || [];
          if (isNewPatient && settings?.otomasyon?.otoEpikriz !== false) {
             const now = new Date();
             
             // YENİ: Asistan ise hekim adı yazmaz! Gerçek ismi systemUsers'dan alır.
             const isDoc = currentUserProfile?.role === "doctor" || currentUserProfile?.role === "clinic_owner";
             const docIdToSave = isDoc ? currentUser : "Belirtilmedi";
             const docNameToSave = isDoc ? (globalData.systemUsers?.[currentUser]?.displayName || currentUser) : "Kayıt Birimi (Asistan)";

             currentHistory = [{
                id: "hist_init_" + Date.now(),
                appointmentId: null,
                date: now.toLocaleDateString("tr-TR"),
                time: now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
                timestamp: Date.now(),
                doctorId: docIdToSave,
                doctorName: docNameToSave,
                appointmentStatus: "İlk Kayıt",
                visitType: "Sisteme İlk Kayıt",
                treatment: "İlk Muayene ve Dosya Açılışı",
                selectedTeeth: [],
                complaint: patientForm.anamnesis ? "Anamnez/Uyarı: " + patientForm.anamnesis : "Sisteme ilk kayıt oluşturuldu.",
                createdAt: Date.now(),
                createdBy: currentUser
             }];
          }

          const safePatientForm = JSON.parse(JSON.stringify(patientForm || {}));

          const updatedPatients = {
            ...globalData.patientsDb,
            [pId]: {
              ...safePatientForm,
              id: pId,
              patientCode: finalPatientCode,
              addedBy: clinicOwner, 
              clinicalHistory: isNewPatient ? currentHistory : (safePatientForm.clinicalHistory || [])
            },
          };

          setGlobalData(prev => ({ ...prev, patientsDb: updatedPatients }));
          setPatientForm({ ...safePatientForm, id: pId });
          
          saveGlobalData({ ...globalData, patientsDb: updatedPatients })
            .then(() => {
              showNotification("Hasta bilgileri başarıyla kaydedildi.", "success");
            })
            .catch((err) => {
              showNotification("Kayıt Firebase tarafından reddedildi! Lütfen bağlantınızı kontrol edin.", "error");
              console.error("Firebase Hasta Kayıt Hatası:", err);
            });
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

          const ownerId = getClinicOwnerId();
          const basePricing = typeof globalData.pricingDb === "object" && globalData.pricingDb["Genel Muayene"] ? globalData.pricingDb : DEFAULT_PRICING;
          const userPricing = { ...basePricing, ...(globalData.pricingDb?.[ownerId] || {}) };
          
          const txPrice = userPricing[activePlanTreatment] !== undefined ? parseFloat(userPricing[activePlanTreatment]) : 0;

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

          if (!hasPermission("finance.payment")) {
            showNotification("Tahsilat ve ödeme ekleme yetkiniz bulunmuyor!", "error");
            return;
          }

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
          
          // YENİ: KARA KUTUYA YAZ (LOG)
        };

        const handleDeletePatient = () => {
          if (!hasPermission("patients.delete")) {
            showNotification("Hasta kaydını silme yetkiniz bulunmuyor!", "error");
            return;
          }
          showConfirm(
            `${patientForm.name} adlı hastayı ve ona ait TÜM verileri kalıcı olarak silmek istediğinize emin misiniz?\n\nDikkat: Bu işlem sonucunda hastanın geçmiş/gelecek tüm randevuları, planlanan işlemleri, epikrizleri ve finansal kayıtları (bakiye/ciro) sistemden tamamen silinecektir!\n\nBu işlem geri alınamaz.`,
            () => {
              const pIdToDelete = patientForm.id;
              
              // 1. Hastayı, planlarını, finansını ve epikrizlerini içeren ana dosyayı veritabanından TAMAMEN SİL
              const updatedPatients = { ...globalData.patientsDb };
              delete updatedPatients[pIdToDelete];

              // 2. Hastaya ait takvimdeki TÜM randevuları (geçmiş, gelecek, geldi, iptal) tamamen sil
              const updatedAppointments = JSON.parse(JSON.stringify(globalData.appointments || {}));
              let isAppointmentsChanged = false;

              Object.keys(updatedAppointments).forEach((docId) => {
                Object.keys(updatedAppointments[docId]).forEach((aptKey) => {
                  const apt = updatedAppointments[docId][aptKey];
                  
                  // İsim benzerliğinden doğan diğer hastaları silme hatalarını önlemek için güvenli ID eşleştirmesi
                  const isMatchById = apt.patientId === pIdToDelete;
                  
                  // Eski sürümlerden kalan (ID'si olmayan) randevular için Ad+Soyad ve Telefon ile sağlamlaştırılmış eşleşme
                  const isMatchByLegacyData = !apt.patientId && apt.patientName === patientForm.name && apt.phone === patientForm.phone;

                  if (isMatchById || isMatchByLegacyData) {
                    delete updatedAppointments[docId][aptKey];
                    isAppointmentsChanged = true;
                  }
                });
              });

              // 3. Değişiklikleri kaydet ve arayüzü kapat
              setGlobalData(prev => ({ 
                ...prev, 
                patientsDb: updatedPatients,
                ...(isAppointmentsChanged ? { appointments: updatedAppointments } : {})
              }));
              setIsPatientModalOpen(false);
              setPatientForm(null);

              saveGlobalData({ 
                ...globalData, 
                patientsDb: updatedPatients,
                ...(isAppointmentsChanged ? { appointments: updatedAppointments } : {}) 
              }).then(() => {
                showNotification("Hasta ve ona bağlı tüm sistem kayıtları başarıyla silindi.", "success");
              });
            }
          );
        };

        const handleUpdateTxPrice = (txId, newPrice, isPlan, docId) => {
          const parsedPrice = parseFloat(newPrice) || 0;

          if (isPlan) {
            const updatedPlans = patientForm.plannedTreatments.map((t) =>
              t.id === txId ? { ...t, price: parsedPrice, originalPrice: parsedPrice } : t
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
              updatedAppointments[docId][txId].originalPrice = parsedPrice;

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
              plannedTreatments: patientPlans, 
            });
          } else {
            setAptModalMode("edit");

            const pData = pendingAptPatient; // YENİ: React State'inden oku
            // 1️⃣ GERÇEK SİSTEM BAĞLANTISI: Ayarlardan varsayılan süreyi çek (Yoksa 30 kullan)
            const defaultDuration = settings?.randevu?.varsayilanSure || "30";

            setFormData({
              patientName: pData ? pData.name : "",
              phone: pData ? pData.phone || "" : "",
              treatment: "",
              price: "",
              linkedPlanId: null,
              status: "Yeni Kayıt",
              duration: defaultDuration,
              notes: "",

              anamnesis: pData ? pData.anamnesis || "" : "",

              createdAt: Date.now(),

              selectedTeeth: [],

              selectedTreatments: [],

              plannedTreatments: pData ? pData.plannedTreatments || [] : [],
            });

            // Kullanıldıktan sonra hafızayı temizle (başka randevulara karışmaması için)
            setPendingAptPatient(null); // YENİ: State'i sıfırla
          }

          setIsModalOpen(true);

          setPatientSuggestions([]);
        };

        const handlePatientNameChange = (val) => {
          setFormData({
            ...formData,
            patientId: null,
            patientName: val,
            treatment: "",
            price: "",
            linkedPlanId: null,
            selectedTeeth: [],
            selectedTreatments: [],
          });

          // YENİ: Hekim ve Asistanın, patronun hastalarını bulabilmesi için patron ID'si
          const ownerId = getClinicOwnerId();

          if (val.trim().length > 0) {
            const matches = Object.values(globalData.patientsDb || {}).filter(
              (p) =>
                resolveClinicId(p.addedBy) === currentClinicId && !p.isDeleted &&
                (p.name.toLowerCase().includes(val.toLowerCase()) ||
                  (p.phone && p.phone.includes(val)) ||
                  (p.tc && p.tc.includes(val)))
            );
            setPatientSuggestions(matches);
          } else {
            setPatientSuggestions(
              Object.values(globalData.patientsDb || {}).filter(
                (p) => resolveClinicId(p.addedBy) === currentClinicId && !p.isDeleted
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

          if (!hasPermission("appointments.create") && !hasPermission("appointments.edit")) {
            showNotification("Randevu kaydetme veya düzenleme yetkiniz bulunmuyor!", "error");
            return;
          }

          if (!formData.patientName) return;

          const key = `${formatDateKey(activeSlotDate)}-${selectedSlot}`;

          // GEÇMİŞ TARİH UYARISI MOTORU
          if (settings?.randevu?.gecmisTarihUyarisi !== false) {
            const aptDateObj = new Date(activeSlotDate);
            const [hour, minute] = selectedSlot.split(":");
            aptDateObj.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);

            if (aptDateObj.getTime() < new Date().getTime()) {
              const isConfirmed = window.confirm("⚠️ Geçmiş bir tarihe veya saate randevu oluşturuyorsunuz.\n\nDevam etmek istediğinize emin misiniz?");
              if (!isConfirmed) return;
            }
          }

          // ÇAKIŞMA KONTROLÜ MOTORU
          if (settings?.randevu?.cakismaKontrolu !== false) {
            const aptDateKey = formatDateKey(activeSlotDate);
            const aptDoc = activeSlotDoctor;

            const [startH, startM] = selectedSlot.split(":").map(Number);
            const newStartMins = startH * 60 + startM;
            const newEndMins = newStartMins + parseInt(formData.duration || 30);

            let isConflict = false;
            let conflictDetails = "";

            const userAppointments = globalData.appointments?.[aptDoc] || {};

            Object.entries(userAppointments).forEach(([exKey, existingApt]) => {
              if (exKey.startsWith(aptDateKey)) {
                if (exKey === key) return; // Kendisiyle çakışma sayma

                const exTimeStr = exKey.split("-").slice(3).join(":"); 
                if (exTimeStr && existingApt.status !== "İptal") {
                  const [exStartH, exStartM] = exTimeStr.split(":").map(Number);
                  const exStartMins = exStartH * 60 + exStartM;
                  const exEndMins = exStartMins + parseInt(existingApt.duration || 30);

                  if (newStartMins < exEndMins && newEndMins > exStartMins) {
                    isConflict = true;
                    const exEndHourStr = String(Math.floor(exEndMins / 60)).padStart(2, '0');
                    const exEndMinStr = String(exEndMins % 60).padStart(2, '0');
                    conflictDetails = `${exTimeStr} - ${exEndHourStr}:${exEndMinStr} — ${existingApt.patientName}`;
                  }
                }
              }
            });

            if (isConflict) {
              alert(`❌ ÇAKIŞMA UYARISI\n\nBu hekim için seçilen saat aralığında başka bir randevu bulunuyor.\n\nÇakışan Randevu:\n${conflictDetails}`);
              return;
            }
          }

          const treatmentStr = formData.treatment || "";
          const finalData = { ...formData, treatment: treatmentStr };

          const updatedDocApts = {
            ...(globalData.appointments?.[activeSlotDoctor] || {}),
            [key]: finalData,
          };

          // YENİ HASTA EŞLEŞTİRME MANTIĞI:
          const ownerId = currentUserProfile?.role === "assistant" ? currentUserProfile.createdBy : currentUser;
          const clinicOwner = ownerId; 
          
          const existingPatient = formData.patientId 
            ? globalData.patientsDb?.[formData.patientId] 
            : Object.values(globalData.patientsDb || {}).find(
              (p) => {
              const isSameClinic = resolveClinicId(p.addedBy) === currentClinicId;
                return isSameClinic && 
                       p.name.toLowerCase() === formData.patientName.toLowerCase().trim() && 
                       p.phone === formData.phone && 
                       p.phone !== ""; 
              }
            );

          const patientId = existingPatient
            ? existingPatient.id
            : push(child(ref(db), 'KlinikAnaVeritabani/Veriler/patientsDb')).key;

          let updatedPatientsDb = { ...(globalData.patientsDb || {}) };

          if (!existingPatient) {
            // YENİ DÜZELTME: TAKVİMDEN YENİ HASTA EKLENİRSE, DURUMU NE OLURSA OLSUN İLK KAYIT EPİKRİZİ ATILIR!
            let initialHistory = [];
            if (settings?.otomasyon?.otoEpikriz !== false) {
                initialHistory = [{
                  id: "hist_init_" + Date.now(),
                  appointmentId: key,
                  date: formatDateKey(activeSlotDate),
                  time: selectedSlot,
                  timestamp: Date.now(),
                  doctorId: activeSlotDoctor,
                  // YENİ: Hekimin GERÇEK ADINI ana veritabanından çek (Kullanıcı adı değil)
                  doctorName: globalData.systemUsers?.[activeSlotDoctor]?.displayName || activeSlotDoctor,
                  appointmentStatus: formData.status, // "Yeni Kayıt", "Bekliyor" vb.
                  visitType: "Sisteme İlk Kayıt",
                  treatment: treatmentStr || "İlk Muayene ve Kayıt",
                  selectedTeeth: formData.selectedTeeth || [],
                  complaint: formData.notes ? "Not: " + formData.notes : "Takvim üzerinden sisteme ilk kayıt oluşturuldu.",
                  createdAt: Date.now(),
                  createdBy: currentUser
                }];
            }

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
              addedBy: clinicOwner,
              clinicalHistory: initialHistory
            };
          } else {
            if (formData.phone) updatedPatientsDb[patientId].phone = formData.phone;
            if (formData.anamnesis) updatedPatientsDb[patientId].anamnesis = formData.anamnesis;
            updatedPatientsDb[patientId].lastStatus = formData.status;
            updatedPatientsDb[patientId].lastTreatment = treatmentStr;
            
            // YENİ: HASTA TAKİP HAVUZUNDAYSA, YENİ RANDEVU ALDIĞI İÇİN HAVUZDAN OTOMATİK ÇIKAR (RESOLVE)
            if (updatedPatientsDb[patientId].followUpStatus && updatedPatientsDb[patientId].followUpStatus !== "none") {
                updatedPatientsDb[patientId].followUpStatus = "resolved"; // Çözüldü
            }
            
            // Eğer VAR OLAN bir hastaya randevu yazılıyorsa ve durumu "Geldi" olarak işaretlendiyse geçmişe ekle
            if (formData.status === "Geldi" && settings?.otomasyon?.otoEpikriz !== false) {
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
          if (!hasPermission("appointments.delete")) {
            showNotification("Randevu silme veya iptal etme yetkiniz bulunmuyor!", "error");
            return;
          }
          const key = `${formatDateKey(activeSlotDate)}-${selectedSlot}`;
          const aptToDelete = globalData.appointments?.[activeSlotDoctor]?.[key];
          
          if (!aptToDelete) return;
          
          // Modalı aç, düzenleme ekranını kapat
          setCancelAptModal({ isOpen: true, aptKey: key, docId: activeSlotDoctor, aptData: aptToDelete, reasonNote: "" });
          setIsModalOpen(false); 
        };

        // YENİ: Randevu Aksiyon ve Havuz Motoru
        const processCancelAppointment = (actionType) => {
          const { aptKey, docId, aptData, reasonNote } = cancelAptModal;
          let updatedDocApts = { ...(globalData.appointments?.[docId] || {}) };
          let updatedPatientsDb = JSON.parse(JSON.stringify(globalData.patientsDb || {}));
          
          let pId = aptData.patientId;
          if (!pId) {
            const foundP = Object.values(updatedPatientsDb).find(p => p.name === aptData.patientName);
            if (foundP) pId = foundP.id;
          }

          // Undo Motoru: Plandan geldiyse geri al
          if (aptData.linkedPlanId && pId && updatedPatientsDb[pId]?.plannedTreatments) {
             updatedPatientsDb[pId].plannedTreatments = updatedPatientsDb[pId].plannedTreatments.map(t => 
                 t.id === aptData.linkedPlanId ? { ...t, isCompleted: false, completedAt: null, completedBy: null } : t
             );
          }

          let notifMsg = "";

          if (actionType === "delete") {
            // KALICI SİLME
            delete updatedDocApts[aptKey];
            notifMsg = "Randevu sistemden kalıcı olarak silindi.";
          } else {
            // İPTAL VEYA GELMEDİ VEYA TAKİBE AL
            let newStatus = "İptal";
            let followUpStatus = "none";
            
            if (actionType === "cancel") { newStatus = "İptal"; followUpStatus = "cancelled"; notifMsg = "Randevu iptal edildi."; }
            if (actionType === "noshow") { newStatus = "Gelmedi"; followUpStatus = "no_show"; notifMsg = "Hasta gelmedi olarak işaretlendi."; }
            if (actionType === "recall") { newStatus = "İptal"; followUpStatus = "recall"; notifMsg = "Hasta 'Yeniden Aranacaklar' listesine alındı."; }

            // Randevuyu silme, durumunu güncelle
            updatedDocApts[aptKey] = {
              ...aptData,
              status: newStatus,
              cancelReason: reasonNote,
              cancelledAt: Date.now(),
              cancelledBy: currentUser
            };

            // Hastayı Havuza (File Desk) Gönder
            if (pId && updatedPatientsDb[pId]) {
              updatedPatientsDb[pId].followUpStatus = followUpStatus;
              updatedPatientsDb[pId].followUpNote = reasonNote;
              updatedPatientsDb[pId].followUpDate = Date.now();
              updatedPatientsDb[pId].lastStatus = newStatus;
            }
          }

          saveGlobalData({
            ...globalData,
            appointments: { ...globalData.appointments, [docId]: updatedDocApts },
            patientsDb: updatedPatientsDb,
          });

          setCancelAptModal({ isOpen: false, aptKey: null, docId: null, aptData: null, reasonNote: "" });
          showNotification(notifMsg, actionType === "delete" ? "error" : "success");
        };

        const getSearchedAppointments = (query) => {
          if (!query || query.trim().length < 2) return { past: [], future: [] };
          const q = query.toLowerCase().trim();
          const all = [];
          const now = new Date().getTime();

          if (globalData.appointments) {
            Object.entries(globalData.appointments).forEach(([dId, dApts]) => {
              // DÜZELTME 1: Kliniğindeki TÜM hekimlerin randevuları taranacak
              if (!allDoctors.includes(dId) && dId !== currentUser) return;
              
              Object.entries(dApts).forEach(([k, apt]) => {
                let pInfo = null;
                if (apt.patientId && globalData.patientsDb?.[apt.patientId]) {
                    pInfo = globalData.patientsDb[apt.patientId];
                } else {
                    pInfo = Object.values(globalData.patientsDb || {}).find(p => p.name.toLowerCase() === apt.patientName.toLowerCase());
                }

                const matches = apt.patientName.toLowerCase().includes(q) || (apt.phone && apt.phone.includes(q)) || (pInfo && pInfo.phone && pInfo.phone.includes(q)) || (pInfo && pInfo.tc && pInfo.tc.includes(q));

                if (matches) {
                  const parts = k.split("-");
                  if (parts.length >= 4) {
                    const y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
                    const timeStr = parts.slice(3).join(":");
                    const [hrStr, minStr] = timeStr.split(":");
                    const hr = parseInt(hrStr || 0, 10);
                    const min = parseInt(minStr || 0, 10);
                    
                    // DÜZELTME 2: NaN Hatasını Engelleyen Kusursuz Matematiksel Tarih Motoru
                    const aptTime = new Date(y, m - 1, d, hr, min).getTime();

                    all.push({
                      ...apt,
                      docId: dId,
                      dateStr: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
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

          const future = all.filter((a) => (a.status === "Yeni Kayıt" || a.status === "Bekliyor") && a.timestamp >= now).sort((a, b) => a.timestamp - b.timestamp);
          const past = all.filter((a) => (a.status !== "Yeni Kayıt" && a.status !== "Bekliyor") || a.timestamp < now).sort((a, b) => b.timestamp - a.timestamp);
          
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

                          "calendar",

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
                          {globalData.systemUsers?.[a.docId]?.displayName ||
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

                          "calendar",

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
                          {globalData.systemUsers?.[a.docId]?.displayName ||
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
                value={aptSearchInput}
                onChange={(e) => {
                  setAptSearchInput(e.target.value);
                  setIsAptSearchOpen(true);
                }}
                onFocus={() => {
                  if (aptSearchInput.length > 1) setIsAptSearchOpen(true);
                }}
                className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 dark:focus:ring-indigo-900/50 shadow-inner transition-all"
              />

              {aptSearchInput && (
                <button
                  onClick={() => {
                    setAptSearchInput("");
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

        // ★★★ YENİ: FIREBASE AUTHENTICATION SİSTEMİ ★★★

        const handleAuthSubmit = async (e) => {
          e.preventDefault();
          setAuthError(""); // Kırmızı kutuyu sadece gerçek hatalar için boşaltıyoruz

          const loginInput = authForm.username.trim().toLowerCase();
          const pwdInput = authForm.password;

          try {
            let loginEmail = loginInput;

            if (!loginInput.includes("@")) {
                loginEmail = `${loginInput}@klinik.com`;
            }

            try {
                await signInWithEmailAndPassword(auth, loginEmail, pwdInput);
            } catch (firstErr) {
                if (!loginInput.includes("@")) {
                    const userSnap = await get(child(ref(db), `KlinikAnaVeritabani/users/${loginInput}`));
                    if (userSnap.exists() && userSnap.val().email) {
                        await signInWithEmailAndPassword(auth, userSnap.val().email, pwdInput);
                    } else {
                        throw firstErr; 
                    }
                } else {
                    throw firstErr;
                }
            }
            
            // Başarılı girişte hiçbir şey yazdırmadan direkt içeri alıyoruz!
            
            if (!savedUsernames.includes(loginInput) && !loginInput.includes("@")) {
              const newSaved = [...savedUsernames, loginInput];
              setSavedUsernames(newSaved);
              localStorage.setItem("klinikSavedUsers", JSON.stringify(newSaved));
            }

          } catch (error) {
            console.error("Login Hatası:", error);
            // YALNIZCA GERÇEK HATALARDA KIRMIZI KUTUYU GÖSTER
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                setAuthError("Şifrenizi yanlış girdiniz!");
            } else if (error.code === 'auth/user-not-found') {
                setAuthError("Böyle bir hesap bulunamadı!");
            } else if (error.code === 'auth/too-many-requests') {
                setAuthError("Çok fazla başarısız deneme! Lütfen biraz bekleyin.");
            } else {
                setAuthError("Giriş yapılamadı: Kullanıcı adı veya şifre hatalı.");
            }
          }
        };

        const handleRegisterSubmit = async (e) => {
          e.preventDefault();
          const btn = e.nativeEvent.submitter;
          if (btn) btn.disabled = true;
          setAuthError("");

          if (registerForm.password.length < 6) {
            setAuthError("Şifreniz en az 6 karakterden oluşmalıdır.");
            if (btn) btn.disabled = false; return;
          }
          if (!registerForm.email || !registerForm.email.includes("@")) {
            setAuthError("Lütfen geçerli bir e-posta adresi girin.");
            if (btn) btn.disabled = false; return;
          }

          const usernameInput = registerForm.username.trim().toLowerCase();
          const realEmail = registerForm.email.trim();

          const isTaken = Object.values(globalData.systemUsers || {}).some(u => normalizeUsername(u.username) === usernameInput);
          
          if (isTaken) {
             setAuthError("Bu kullanıcı adı zaten alınmış! Lütfen başka bir kullanıcı adı belirleyin.");
             if (btn) btn.disabled = false; return;
          }

          try {
            // YENİ DÜZEN: Firebase kuralları gereği veritabanına yazabilmek için ÖNCE Auth (Kayıt) işlemini yapmalıyız.
            await createUserWithEmailAndPassword(auth, realEmail, registerForm.password);

            // GÜVENLİK KİLİDİ AŞILDI: Yeni kayıt esnasında currentUser henüz 'null' olduğu için 
            // saveGlobalData fonksiyonu çalışmaz. Bu yüzden yeni kullanıcıyı veritabanına DOĞRUDAN yazıyoruz!
            const newUserProfile = {
                  username: usernameInput,
                  displayName: registerForm.name,
                  role: "clinic_owner",
                  active: true,
                  clinicId: `clinic_${usernameInput}`,
                  createdBy: usernameInput,
                  email: realEmail,
                  createdAt: Date.now()
            };

            await update(ref(db, "KlinikAnaVeritabani/users"), {
                [usernameInput]: newUserProfile
            });

            if (!savedUsernames.includes(usernameInput)) {
              const newSaved = [...savedUsernames, usernameInput];
              setSavedUsernames(newSaved);
              localStorage.setItem("klinikSavedUsers", JSON.stringify(newSaved));
            }

            showNotification("Hesap başarıyla oluşturuldu, sisteme giriş yapılıyor...", "success");
            if (btn) btn.disabled = false;
          } catch (error) {
            if (error.code === 'auth/email-already-in-use') setAuthError("Bu e-posta adresi sistemde zaten kayıtlı!");
            else setAuthError("Kayıt olurken bir hata oluştu: " + error.message);
            if (btn) btn.disabled = false;
          }
        };

        const handleForgotSubmit = async (e) => {
          e.preventDefault();
          setAuthError("");
          const emailInput = forgotForm.email?.trim();

          if (!emailInput || !emailInput.includes("@")) {
              setAuthError("Lütfen geçerli bir e-posta adresi girin.");
              return;
          }

          try {
            await sendPasswordResetEmail(auth, emailInput);
            showNotification(`Şifre sıfırlama linki ${emailInput} adresine gönderildi. Lütfen mailinizi kontrol edin.`, "success");
            setAuthMode("login");
            setForgotForm({ email: "" });
          } catch (error) {
             setAuthError("Sistemde bu e-posta adresine ait bir hesap bulunamadı.");
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
            showNotification("Şifreniz başarıyla güncellendi.");
            // KARA KUTUYA BİLDİR
          } catch (error) {
            showNotification("Şifre güncelleme hatası!", "error");
          }
        };

        // UI Loading States

        // 🛡️ GÜVENLİ YÜKLEME VE AÇILIŞ KONTROLÜ (Beyaz ekranı engeller)
        if (!isReady || isAuthChecking || isLoggingOut) {
          return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute top-[-15%] left-[-10%] w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
              <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"></div>

              <div className="flex flex-col items-center gap-3 z-10 animate-pop text-center">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <i className="fa-solid fa-circle-notch fa-spin text-2xl text-indigo-600 dark:text-indigo-400"></i>
                </div>
                <div className="text-slate-700 dark:text-white font-bold text-[13px] bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-xl backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-700">
                  {isLoggingOut ? "Sistemden güvenli çıkış yapılıyor..." : "Klinik sistemi hazırlanıyor..."}
                </div>
              </div>
            </div>
          );
        }

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
                      <i className="fa-solid fa-user absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10"></i>
                      <input
                        type="text"
                        required
                        value={authForm.username}
                        onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                        onFocus={() => setShowSavedUsers(true)}
                        onBlur={() => setShowSavedUsers(false)} 
                        className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-[13px] font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm relative z-0"
                        placeholder="Kullanıcı Adınız"
                        autoComplete="off"
                      />
                      
                      {/* AKILLI VE ZARİF KAYITLI KULLANICILAR MENÜSÜ */}
                      {showSavedUsers && (() => {
                         // YENİ: Akıllı Filtre (Klavyeden harf girdikçe listeyi anında daraltır)
                         const filteredUsers = savedUsernames.filter(u => u.toLowerCase().includes(authForm.username.toLowerCase()));
                         if (filteredUsers.length === 0) return null;
                         
                         return (
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto custom-scrollbar p-1 animate-pop">
                            {filteredUsers.map((uname, idx) => (
                              <div key={idx} className="flex justify-between items-center px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors group/item">
                                <div 
                                  className="flex-1 flex items-center gap-2"
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // Input'tan focus'un çıkmasını engeller
                                    setAuthForm({ ...authForm, username: uname });
                                    setShowSavedUsers(false);
                                  }}
                                >
                                  <i className="fa-regular fa-circle-user text-slate-300 dark:text-slate-500 group-hover/item:text-indigo-400 transition-colors"></i>
                                  <span className="font-bold text-[11px] text-slate-600 dark:text-slate-300 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">
                                    {uname}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const newSaved = savedUsernames.filter(u => u !== uname);
                                    setSavedUsernames(newSaved);
                                    localStorage.setItem("klinikSavedUsers", JSON.stringify(newSaved));
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all opacity-50 group-hover/item:opacity-100"
                                  title="Bu hesabı listeden sil"
                                >
                                  <i className="fa-solid fa-xmark text-[11px]"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                         );
                      })()}
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

                    {/* 1. KULLANICI ADI ALANI VE UYARISI */}
                    <div>
                      <div className="relative group">
                        <i className="fa-solid fa-user absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                        <input
                          type="text"
                          required
                          value={registerForm.username}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              username: e.target.value.replace(/\s+/g, '').toLowerCase(),
                            })
                          }
                          className={`w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border-2 rounded-xl outline-none text-[13px] font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm ${
                            registerForm.username.length >= 3 
                              ? (checkUsernameAvailability(registerForm.username) 
                                  ? "border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20" 
                                  : "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 text-rose-600")
                              : "border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                          }`}
                          placeholder="Kullanıcı Adı Belirleyin"
                        />
                      </div>
                      
                      {/* Uyarı yazısı artık tam olarak kullanıcı adının altında! */}
                      {registerForm.username.length >= 3 && (
                        <div className={`text-[10px] font-bold mt-1.5 flex items-center gap-1 animate-fadeIn ${checkUsernameAvailability(registerForm.username) ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          <i className={`fa-solid ${checkUsernameAvailability(registerForm.username) ? "fa-check-circle" : "fa-circle-xmark"}`}></i>
                          {checkUsernameAvailability(registerForm.username) ? "Bu kullanıcı adı kullanılabilir." : "Bu kullanıcı adı maalesef alınmış!"}
                        </div>
                      )}
                    </div>

                    {/* 2. E-POSTA ALANI (Ayrı ve Boyutları Düzeltilmiş Blok) */}
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <i className="fa-solid fa-envelope text-[13px]"></i>
                      </span>
                      <input 
                        type="email" 
                        required 
                        placeholder="E-Posta Adresiniz" 
                        value={registerForm.email} 
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} 
                        className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:text-white transition-all shadow-sm" 
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
                  <form onSubmit={handleForgotSubmit} className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 text-center mb-1 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                      Hesabınıza kayıtlı e-posta adresini girin. Yeni şifre belirlemeniz için güvenli bir bağlantı göndereceğiz.
                    </div>

                    <div className="relative group">
                      <i className="fa-solid fa-envelope absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                      <input
                        type="email"
                        required
                        value={forgotForm.email || ""}
                        onChange={(e) =>
                          setForgotForm({
                            email: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-[13px] font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                        placeholder="Kayıtlı E-Posta Adresiniz"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-3 py-2 bg-slate-800 dark:bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:-translate-y-0.5 hover:bg-slate-900 transition-all flex justify-center items-center gap-1.5"
                    >
                      Sıfırlama Linki Gönder <i className="fa-regular fa-paper-plane"></i>
                    </button>

                    <div className="text-center mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => { setAuthMode("login"); setAuthError(""); }}
                        className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1.5 w-full"
                      >
                        <i className="fa-solid fa-arrow-left"></i> İptal Et ve Geri Dön
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          );

        // Tüm sistemde (Takvim, Hastalar, Finans) görünecek hekimlerin ana listesi
        // getVisibleDoctors() fonksiyonundan yetkilere göre dinamik çekilir.
        const allDoctors = getVisibleDoctors();

        const visibleListDoctors =
          listDoctorFilter === "all" ? allDoctors : [listDoctorFilter];

        const renderHome = () => {
          const todayStr = formatDateKey(new Date());
          let todaysApts = [],
            waitingCount = 0,
            totalApts = 0;

          // YENİ: Sadece currentUser değil, yetkili olunan TÜM hekimlerin bugünkü randevularını topla
          if (globalData.appointments) {
            allDoctors.forEach((docId) => {
              if (globalData.appointments[docId]) {
                Object.entries(globalData.appointments[docId]).forEach(
                  ([key, apt]) => {
                    if (key.startsWith(todayStr)) {
                      // docId artık dışarıdaki döngüden geliyor, o yüzden içeride tekrar tanımlamıyoruz!
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
            }); // Yeni açtığımız döngüyü burada düzgünce kapattık
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
                    {globalData.systemUsers?.[currentUser]?.displayName ||
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
                            patientCode: "",
                            name: "",
                            phone: "",
                            tc: "",
                            age: "",
                            gender: "Belirtilmemiş",
                            anamnesis: "",
                            isEmergency: false,
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
                      let pId = apt.patientId;
                      if (!pId) {
                        const match = Object.values(globalData.patientsDb || {}).find(p => p.name.toLowerCase() === apt.patientName.toLowerCase().trim());
                        if (match) pId = match.id;
                      }
                      const anamnesis = pId ? globalData.patientsDb?.[pId]?.anamnesis : null;

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
                            {globalData.systemUsers?.[apt.docId]?.displayName || apt.docId}
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
                  const allPats = Object.values(globalData.patientsDb || {}).filter(p => {
                      if (p.isDeleted) return false;
                      if (currentUserProfile?.role === "assistant") return (currentUserProfile.assignedDoctors || []).includes(p.addedBy) && resolveClinicId(p.addedBy) === currentClinicId;
                      return resolveClinicId(p.addedBy) === currentClinicId;
                  });

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

                  // 1. Ortak Havuzdaki (Kliniğe Ait) Hastaları Dosya Masası İçin Al
                  const myPatientsForHome = Object.values(globalData.patientsDb || {}).filter(p => {
                      if (p.isDeleted) return false;
                      // Asistan ise sadece yetkili olduğu hekimlerin hastalarını görür
                      if (currentUserProfile?.role === "assistant") {
                          return (currentUserProfile.assignedDoctors || []).includes(p.addedBy) && resolveClinicId(p.addedBy) === currentClinicId;
                      }
                      // Hekim veya Klinik Sahibi ise bu kliniğin tüm hastalarını görür (Klinik sahibi takvimde kapalı olsa bile)
                      return resolveClinicId(p.addedBy) === currentClinicId;
                  });

                  // 2. Tarih ve Randevu Kontrolleri İçin Hazırlık (Son 7 Gün Algılayıcı)
                  const now = new Date();
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(now.getDate() - 7);

                  // 3. Çok daha akıllı (İçinde geçen kelimeye göre arayan) Klasörleme Sistemi
                  const nowTime = new Date().getTime();
                  const sevenDaysAgoTime = nowTime - (7 * 24 * 60 * 60 * 1000);

                  // AKILLI FİLTRE MOTORU: Hem manuel etiketleri hem de otomatik koşulları denetler
                  const checkFolderLogic = (p, folderKey, keywords) => {
                      const manualStatus = p[folderKey] || "";
                      if (manualStatus === "Tamamlandı") return false; // Manuel tamamlandıysa gizle
                      if (manualStatus !== "") return true; // Manuel etiket atanmışsa göster
                      
                      const status = (p.lastStatus || "").toLowerCase();
                      return keywords.some(k => status.includes(k));
                  };

                  // YENİ: isEmergency (Acil Hasta) işareti varsa da bu klasöre düşer
                  const fAcil = myPatientsForHome.filter(p => p.isEmergency || checkFolderLogic(p, 'folder_acil', ['acil', 'ağrı', 'kanama']));
                  
                  const fKontrol = myPatientsForHome.filter(p => checkFolderLogic(p, 'folder_kontrol', ['kontrol', 'takip', 'sonraki']));
                  
                  const fTedavi = myPatientsForHome.filter(p => {
                      const manualStatus = p.folder_tedavi || "";
                      if (manualStatus === "Tamamlandı") return false;
                      if (manualStatus !== "") return true;

                      const status = (p.lastStatus || "").toLowerCase();
                      const hasPlan = p.plannedTreatments && p.plannedTreatments.length > 0;
                      return hasPlan || status.includes("tedavi") || status.includes("devam") || status.includes("kanal") || status.includes("dolgu") || status.includes("çekim");
                  });

                  const fLab = myPatientsForHome.filter(p => checkFolderLogic(p, 'folder_lab', ['lab', 'ölçü', 'prova', 'protez']));
                  
                  const fEvrak = myPatientsForHome.filter(p => checkFolderLogic(p, 'folder_evrak', ['evrak', 'onam', 'röntgen', 'kimlik']));

                  const fYeni = myPatientsForHome.filter(p => {
                      const manualStatus = p.folder_yeni || "";
                      if (manualStatus === "Tamamlandı") return false;
                      if (manualStatus !== "") return true;

                      if ((p.lastStatus || "").toLowerCase().includes("yeni")) return true;
// YENİ: TAKİP HAVUZU KLASÖRLERİ FİLTRELERİ
                  const fNoShow = myPatientsForHome.filter(p => p.followUpStatus === 'no_show');
                  const fRecall = myPatientsForHome.filter(p => p.followUpStatus === 'recall');
                  const fCancelled = myPatientsForHome.filter(p => p.followUpStatus === 'cancelled');

                      // Sisteme kayıt tarihini benzersiz ID'sinden (Timestamp) çıkarıyoruz
                      let creationTime = 0;
                      if (p.id) {
                          const parts = p.id.split('_');
                          if (parts.length >= 2) {
                              const ts = parseInt(parts[1]);
                              if (!isNaN(ts) && ts > 1000000000000) creationTime = ts;
                          }
                      }
                      
                      // Son 7 gün içinde eklenmişse otomatik olarak "Yeni Hastalar"a al
                      if (creationTime >= sevenDaysAgoTime && creationTime <= nowTime) return true;

                      // Hiç randevusu yoksa yeni hasta kabul et
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
                 // GÜVENLİK: Hata vermemesi için yeni değişkenleri burada güvenli bir şekilde tanımlıyoruz
                  const fNoShow = myPatientsForHome.filter(p => p.followUpStatus === 'no_show');
                  const fRecall = myPatientsForHome.filter(p => p.followUpStatus === 'recall');
                  const fCancelled = myPatientsForHome.filter(p => p.followUpStatus === 'cancelled');
                  const fTakip = [...fNoShow, ...fRecall, ...fCancelled]; // 3'ünü tek havuzda birleştirdik

                  const folders = [
                    { id: "acil", title: "ACİL TAKİP", icon: "fa-truck-medical", colorClass: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800", count: fAcil?.length || 0, data: fAcil || [], desc: "Aktif acil & ağrı", info: "Hasta dosyasında 'Acil', 'Ağrı', 'Kanama' kelimeleri geçenler." },
                    
                    // YENİ: BİRLEŞTİRİLMİŞ TAKİP HAVUZU
                    { id: "takip", title: "İPTAL & TAKİP HAVUZU", icon: "fa-layer-group", colorClass: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800", count: fTakip?.length || 0, data: fTakip || [], desc: "İptal, Gelmeyen & Aranacak", info: "Randevusu iptal olan, gelmeyen veya yeniden aranacak hastalar." },
                    
                    // MEVCUT KLASÖRLER DEVAM EDİYOR (Beyaz ekran kalkanı ile)
                    { id: "kontrol", title: "KONTROL BEKLEYENLER", icon: "fa-calendar-check", colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", count: fKontrol?.length || 0, data: fKontrol || [], desc: "Yaklaşan kontroller", info: "Son durumunda 'Kontrol' veya 'Takip' geçen hastalar." },
                    { id: "tedavi", title: "TEDAVİSİ DEVAM EDENLER", icon: "fa-tooth", colorClass: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800", count: fTedavi?.length || 0, data: fTedavi || [], desc: "İşlem bekleyenler", info: "Tedavisi süren, planlanmış işlemi olan hastalar." },
                    { id: "lab", title: "LABORATUVAR", icon: "fa-flask", colorClass: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800", count: fLab?.length || 0, data: fLab || [], desc: "Lab süreçleri", info: "Ölçü alınmış, provası olan veya laba iş gönderilen hastalar." },
                    { id: "evrak", title: "EVRAK BEKLEYENLER", icon: "fa-file-signature", colorClass: "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700", count: fEvrak?.length || 0, data: fEvrak || [], desc: "Eksik belgeler", info: "Onam formu, röntgen veya eksik evrakı olan hastalar." },
                    { id: "yeni", title: "YENİ HASTALAR", icon: "fa-user-plus", colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", count: fYeni?.length || 0, data: fYeni || [], desc: "Sisteme yeni girilenler", info: "Sisteme yeni eklenen hastalar." }
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
                          <div className="flex flex-col gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setActiveFolderId(null); setFolderSearch(""); setTakipSubFilter("all"); }} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-lg font-bold text-[11px] hover:bg-slate-200 dark:hover:bg-slate-600 transition shrink-0">
                                <i className="fa-solid fa-arrow-left mr-1"></i> Geri Dön
                              </button>
                              <span className={`px-2 py-0.5 rounded font-black text-[11px] border ${activeFolderData.colorClass} truncate`}>
                                <i className={`fa-solid ${activeFolderData.icon} mr-1`}></i> {activeFolderData.title}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400 shrink-0">({displayedData.length} Dosya)</span>
                            </div>

                            {activeFolderId === "takip" && (
                              <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                                <button onClick={() => setTakipSubFilter("all")} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors border shadow-sm ${takipSubFilter === "all" ? "bg-indigo-600 text-white border-indigo-700" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"}`}>
                                  Tümü
                                </button>
                                <button onClick={() => setTakipSubFilter("no_show")} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors border shadow-sm ${takipSubFilter === "no_show" ? "bg-rose-600 text-white border-rose-700" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"}`}>
                                  🚫 Gelmeyenler
                                </button>
                                <button onClick={() => setTakipSubFilter("recall")} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors border shadow-sm ${takipSubFilter === "recall" ? "bg-amber-500 text-white border-amber-600" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"}`}>
                                  🔄 Yeniden Aranacaklar
                                </button>
                                <button onClick={() => setTakipSubFilter("cancelled")} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors border shadow-sm ${takipSubFilter === "cancelled" ? "bg-slate-600 text-white border-slate-700" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"}`}>
                                  ❌ İptal Edilenler
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 overflow-y-auto max-h-[450px] custom-scrollbar pr-1.5">
                            {displayedData.length > 0 && activeFolderId === "takip" && takipSubFilter !== "all" && displayedData.filter(p => p.followUpStatus === takipSubFilter).length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-[11px] font-bold border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">Bu alt filtreye uygun kayıt bulunmuyor.</div>
                            ) : displayedData.length > 0 ? (
                              (activeFolderId === "takip" 
                                ? [...displayedData].filter(p => takipSubFilter === "all" || p.followUpStatus === takipSubFilter).sort((a, b) => (a.followUpStatus || "").localeCompare(b.followUpStatus || ""))
                                : displayedData
                              ).map((pt, i, arr) => {
                                // "Takip Havuzu" için grup başlıkları
                                let groupHeader = null;
                                if (activeFolderId === "takip") {
                                  const prevPt = arr[i - 1];
                                  if (!prevPt || prevPt.followUpStatus !== pt.followUpStatus) {
                                    const groupTitle = pt.followUpStatus === 'no_show' ? "Gelmeyenler (No-Show)" : pt.followUpStatus === 'recall' ? "Yeniden Aranacaklar" : "İptal Edilenler";
                                    const groupIcon = pt.followUpStatus === 'no_show' ? "fa-user-xmark text-rose-500" : pt.followUpStatus === 'recall' ? "fa-phone-volume text-amber-500" : "fa-ban text-slate-500";
                                    groupHeader = (
                                      <div className="col-span-full font-black text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 mt-3 border-b border-slate-200 dark:border-slate-700 pb-1.5 flex items-center gap-1.5">
                                        <i className={`fa-solid ${groupIcon}`}></i> {groupTitle}
                                      </div>
                                    );
                                  }
                                }

                                // 6 KLASÖR İÇİN ENTEGRE DURUM GÜNCELLEME (QUICK STATUS UPDATE)
                                let specificStatus = null;
                                let badgeColor = "";
                                let options = [];
                                let fieldToUpdate = "";
                                
                                if (activeFolderId === "acil") { 
                                  specificStatus = pt.folder_acil || ""; 
                                  fieldToUpdate = "folder_acil";
                                  badgeColor = specificStatus === "Tamamlandı" ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400" : specificStatus === "Gizle" ? "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400" : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400"; 
                                  options = [
                                    {val: "Tamamlandı", label: "✅ Tamamlandı"},
                                    {val: "Gizle", label: "👁️ Klasörden Gizle"},
                                    {val: "Aktif Acil", label: "🔴 Aktif Acil Durum"},
                                    {val: "Ağrı Takibi", label: "🟠 Ağrı Takibi"},
                                    {val: "İlaç Kullanıyor", label: "🟡 İlaç Kullanıyor"},
                                    {val: "", label: "🔄 Otomatik Moda Dön"}
                                  ];
                                } else if (activeFolderId === "takip") { 
                                  // YENİ: BİRLEŞİK TAKİP HAVUZU KONTROLLERİ
                                  specificStatus = pt.followUpStatus === 'no_show' ? 'Gelmeyen (No-Show)' : pt.followUpStatus === 'recall' ? 'Yeniden Aranacak' : pt.followUpStatus === 'cancelled' ? 'İptal Edilen' : 'Çözüldü'; 
                                  fieldToUpdate = "followUpStatus";
                                  badgeColor = pt.followUpStatus === 'no_show' ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400" : pt.followUpStatus === 'recall' ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400" : pt.followUpStatus === 'cancelled' ? "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300" : "bg-emerald-100 text-emerald-700 border-emerald-200"; 
                                  options = [
                                    {val: "resolved", label: "✅ Takibi Sonlandır (Çözüldü)"},
                                    {val: "no_show", label: "🚫 Gelmeyen (No-Show)"},
                                    {val: "recall", label: "🔄 Yeniden Aranacak"},
                                    {val: "cancelled", label: "❌ İptal Edilen"}
                                  ];
                                } else if (activeFolderId === "kontrol") { 
                                  specificStatus = pt.folder_kontrol || ""; 
                                  fieldToUpdate = "folder_kontrol";
                                  badgeColor = (specificStatus === "Tamamlandı" || specificStatus === "Gizle") ? "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400" : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400"; 
                                  options = [
                                    {val: "Tamamlandı", label: "✅ Tamamlandı"},
                                    {val: "Gizle", label: "👁️ Klasörden Gizle"},
                                    {val: "Kontrol Bekliyor", label: "⏳ Kontrol Bekliyor"},
                                    {val: "Randevu Verildi", label: "📅 Randevu Verildi"},
                                    {val: "", label: "🔄 Otomatik Moda Dön"}
                                  ];
                                } else if (activeFolderId === "tedavi") { 
                                  specificStatus = pt.folder_tedavi || ""; 
                                  fieldToUpdate = "folder_tedavi";
                                  badgeColor = specificStatus === "Tamamlandı" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : specificStatus === "Gizle" ? "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400" : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400"; 
                                  options = [
                                    {val: "Tamamlandı", label: "✅ Tamamlandı"},
                                    {val: "Gizle", label: "👁️ Klasörden Gizle"},
                                    {val: "Tedavisi Sürüyor", label: "🦷 Tedavisi Sürüyor"},
                                    {val: "Planlama Aşamasında", label: "📋 Planlama Aşamasında"},
                                    {val: "", label: "🔄 Otomatik Moda Dön"}
                                  ];
                                } else if (activeFolderId === "lab") { 
                                  specificStatus = pt.folder_lab || ""; 
                                  fieldToUpdate = "folder_lab";
                                  badgeColor = specificStatus === "Tamamlandı" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : specificStatus === "Gizle" ? "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400" : "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-400"; 
                                  options = [
                                    {val: "Tamamlandı", label: "✅ Tamamlandı"},
                                    {val: "Gizle", label: "👁️ Klasörden Gizle"},
                                    {val: "Ölçü Alınacak", label: "⏳ Ölçü Alınacak"},
                                    {val: "Laboratuvarda", label: "🧪 Laboratuvarda"},
                                    {val: "Klinikte (Provaya Hazır)", label: "🏢 Klinikte (Provaya Hazır)"},
                                    {val: "", label: "🔄 Otomatik Moda Dön"}
                                  ];
                                } else if (activeFolderId === "evrak") { 
                                  specificStatus = pt.folder_evrak || ""; 
                                  fieldToUpdate = "folder_evrak";
                                  badgeColor = (specificStatus === "Tamamlandı" || specificStatus === "Gizle") ? "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-700 dark:text-slate-400" : "bg-emerald-100 text-emerald-700 border-emerald-200"; 
                                  options = [
                                    {val: "Tamamlandı", label: "✅ Evraklar Tamamlandı"},
                                    {val: "Gizle", label: "👁️ Klasörden Gizle"},
                                    {val: "Onam Formu Eksik", label: "📄 Onam Formu Eksik"},
                                    {val: "Röntgen Bekliyor", label: "🦴 Röntgen Bekliyor"},
                                    {val: "Kimlik/Pasaport Eksik", label: "🪪 Kimlik/Pasaport Eksik"},
                                    {val: "", label: "🔄 Otomatik Moda Dön"}
                                  ];
                                } else if (activeFolderId === "yeni") { 
                                  specificStatus = pt.folder_yeni || ""; 
                                  fieldToUpdate = "folder_yeni";
                                  badgeColor = specificStatus === "Tamamlandı" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : specificStatus === "Gizle" ? "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400" : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400"; 
                                  options = [
                                    {val: "Tamamlandı", label: "✅ İşlem Gördü / Tam"},
                                    {val: "Gizle", label: "👁️ Klasörden Gizle"},
                                    {val: "Randevu Bekliyor", label: "⏳ Randevu Bekliyor"},
                                    {val: "Ulaşılamadı", label: "☎️ Ulaşılamadı"},
                                    {val: "", label: "🔄 Otomatik Moda Dön"}
                                  ];
                                }

                                return (
                                <React.Fragment key={i}>
                                  {groupHeader}
                                  <div className="bg-white dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-2 hover:border-indigo-300 transition-colors">
                                    <div className="flex items-start gap-2 w-full md:w-auto">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-600 shrink-0 mt-0.5">
                                      <i className="fa-regular fa-folder-open text-base"></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-black text-[13px] text-slate-800 dark:text-white flex items-center flex-wrap gap-1.5">
                                        <span className="truncate max-w-[140px] sm:max-w-[200px]">{pt.name}</span>
                                        {pt.anamnesis && <i className="fa-solid fa-triangle-exclamation text-rose-500 cursor-help" title={pt.anamnesis}></i>}
                                        {pt.isEmergency && <span className="animate-pulse bg-rose-500 text-white px-1.5 py-0.5 rounded text-[9px] font-black shadow-sm">ACİL</span>}
                                        
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
                                </React.Fragment>
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
                      const slotMin = parseInt(slot.split(":")[1]);
let isPastSlot = isPastDate || (isToday && (slotHour < now.getHours() || (slotHour === now.getHours() && slotMin < now.getMinutes())));
                      
                      // GÜÇLENDİRİLMİŞ ÇALIŞMA GÜNÜ MOTORU (Günlük)
                      const dayName = DAYS[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1];
                      const yyyy_mm_dd = formatDateKey(selectedDate);
                      const dd_mm_yyyy = `${String(selectedDate.getDate()).padStart(2, '0')}.${String(selectedDate.getMonth() + 1).padStart(2, '0')}.${selectedDate.getFullYear()}`;
                      
                      const isDayClosed = settings?.calisma?.gunler?.[dayName] === false || 
  (settings?.calisma?.ozelGunler || []).some(og => og.tarih === yyyy_mm_dd || og.tarih === dd_mm_yyyy);

// SİHİRLİ SATIR: Eğer gün kapalıysa, o günün tüm saatlerini "geçmiş/pasif" olarak işaretle!
if (isDayClosed) isPastSlot = true;

                      let pId = apt?.patientId;
                      if (apt && !pId) {
                        const match = Object.values(globalData.patientsDb || {}).find(p => p.name.toLowerCase() === apt.patientName.toLowerCase().trim());
                        if (match) pId = match.id;
                      }
                      let anamnesis = pId ? globalData.patientsDb?.[pId]?.anamnesis : null;

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
  <div className="flex flex-wrap items-center gap-1 truncate overflow-visible">
    <span className="font-black text-slate-800 dark:text-white text-[11px] sm:text-[13px] flex items-center gap-1.5 truncate">
      <span className="truncate">{apt.patientName}</span>
      {anamnesis && (
        <div className="relative group/tooltip flex items-center shrink-0">
          <i className="fa-solid fa-triangle-exclamation text-rose-500 cursor-help animate-pulse"></i>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-rose-600 text-white text-[11px] font-bold rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[99999] shadow-2xl whitespace-normal pointer-events-none">
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-rose-600"></div>
            <div className="flex items-start gap-1.5">
              <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
              <span className="leading-tight">{anamnesis}</span>
            </div>
          </div>
        </div>
      )}
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
                              <div className="text-emerald-500/50 dark:text-emerald-400/50 font-bold text-[11px] flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-all cursor-pointer">
                                <i className="fa-solid fa-plus bg-emerald-100/50 dark:bg-emerald-900/50 rounded p-1"></i> Yeni
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
                          const slotMin = parseInt(time.split(":")[1]);
let isPastSlot = isPastDate || (isToday && (slotHour < now.getHours() || (slotHour === now.getHours() && slotMin < now.getMinutes())));
                          
                          // GÜÇLENDİRİLMİŞ ÇALIŞMA GÜNÜ MOTORU (Haftalık)
                          const dayName = DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];
                          const yyyy_mm_dd = formatDateKey(d);
                          const dd_mm_yyyy = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
                          
                          const isDayClosed = settings?.calisma?.gunler?.[dayName] === false || 
  (settings?.calisma?.ozelGunler || []).some(og => og.tarih === yyyy_mm_dd || og.tarih === dd_mm_yyyy);

// SİHİRLİ SATIR: Eğer gün kapalıysa, o günün tüm saatlerini "geçmiş/pasif" olarak işaretle!
if (isDayClosed) isPastSlot = true;

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
  <div className="flex flex-wrap items-center gap-1 truncate overflow-visible">
    <span className="font-black text-slate-800 dark:text-white text-[11px] sm:text-[13px] flex items-center gap-1.5 truncate">
      <span className="truncate">{apt.patientName}</span>
      {anamnesis && (
        <div className="relative group/tooltip flex items-center shrink-0">
          <i className="fa-solid fa-triangle-exclamation text-rose-500 cursor-help animate-pulse"></i>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-rose-600 text-white text-[11px] font-bold rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[99999] shadow-2xl whitespace-normal pointer-events-none">
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-rose-600"></div>
            <div className="flex items-start gap-1.5">
              <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
              <span className="leading-tight">{anamnesis}</span>
            </div>
          </div>
        </div>
      )}
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
                          {globalData.systemUsers?.[doc]?.displayName || doc}
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
                          {globalData.systemUsers?.[doc]?.displayName || doc}
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
                            {globalData.systemUsers?.[docId]?.displayName || docId}
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
                        const slotMin = parseInt(time.split(":")[1]);
let isPastSlot = isPastDate || (isToday && (slotHour < now.getHours() || (slotHour === now.getHours() && slotMin < now.getMinutes())));
                        
                        // GÜÇLENDİRİLMİŞ ÇALIŞMA GÜNÜ MOTORU (Liste)
                        const dayName = DAYS[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1];
                        const yyyy_mm_dd = formatDateKey(selectedDate);
                        const dd_mm_yyyy = `${String(selectedDate.getDate()).padStart(2, '0')}.${String(selectedDate.getMonth() + 1).padStart(2, '0')}.${selectedDate.getFullYear()}`;
                        
                        const isDayClosed = settings?.calisma?.gunler?.[dayName] === false || 
  (settings?.calisma?.ozelGunler || []).some(og => og.tarih === yyyy_mm_dd || og.tarih === dd_mm_yyyy);

// SİHİRLİ SATIR: Eğer gün kapalıysa, o günün tüm saatlerini "geçmiş/pasif" olarak işaretle!
if (isDayClosed) isPastSlot = true;

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
                            className={`doc-col slot-cell grid-row-h flex items-center px-1 transition-all duration-300 group ${
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
                              {!apt && !isPastSlot && (
                                <div className="text-emerald-500/50 dark:text-emerald-400/50 font-bold text-[11px] flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all cursor-pointer w-full">
                                  <i className="fa-solid fa-plus bg-emerald-100/50 dark:bg-emerald-900/50 rounded p-0.5"></i> Yeni
                                </div>
                              )}
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
                                <div className="font-black truncate flex items-center gap-1.5 text-[10px] sm:text-[11px] overflow-visible">
                                  <span className="truncate">{apt.patientName}</span>
                                  {anamnesis && (
                                    <div className="relative group/tooltip flex items-center shrink-0">
                                      <i className="fa-solid fa-triangle-exclamation text-rose-500 cursor-help animate-pulse"></i>
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-rose-600 text-white text-[11px] font-bold rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[99999] shadow-2xl whitespace-normal pointer-events-none">
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-rose-600"></div>
                                        <div className="flex items-start gap-1.5">
                                          <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                                          <span className="leading-tight">{anamnesis}</span>
                                        </div>
                                      </div>
                                    </div>
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
          // KLİNİK İZOLASYONU: Hasta ekleyenin clinicId'si, benim clinicId'me eşit mi?
          let patientsList = Object.values(globalData.patientsDb || {}).filter(
            (p) => resolveClinicId(p.addedBy) === currentClinicId && !p.isDeleted
          );
          if (patientLocalSearch)
            patientsList = patientsList.filter(
              (p) =>
                p.name.toLowerCase().includes(patientLocalSearch.toLowerCase()) ||
                (p.phone && p.phone.includes(patientLocalSearch)) ||
                (p.tc && p.tc.includes(patientLocalSearch)) ||
                (p.patientCode && p.patientCode.includes(patientLocalSearch))
            );

          if (patientFilterStatus !== "all")
            patientsList = patientsList.filter(
              (p) => p.lastStatus === patientFilterStatus
            );

          if (patientFilterTreatment !== "all")
            patientsList = patientsList.filter(
              (p) => p.lastTreatment === patientFilterTreatment
            );

          // YENİ: HASTA KODUNA GÖRE SIRALAMA MOTORU
          if (patientSortOrder === "asc") {
            patientsList.sort((a, b) => (a.patientCode || "").localeCompare(b.patientCode || ""));
          } else if (patientSortOrder === "desc") {
            patientsList.sort((a, b) => (b.patientCode || "").localeCompare(a.patientCode || ""));
          } else {
            // Varsayılan: İsim Alfabetik
            patientsList.sort((a, b) => a.name.localeCompare(b.name));
          }

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
                        patientCode: "",
                        name: "",
                        phone: "",
                        tc: "",
                        age: "",
                        gender: "Belirtilmemiş",
                        anamnesis: "",
                        isEmergency: false,
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
                      <th 
                        className="px-2.5 py-1.5 font-semibold w-28 cursor-pointer hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors select-none group"
                        onClick={() => {
                          if (patientSortOrder === "default") setPatientSortOrder("asc");
                          else if (patientSortOrder === "asc") setPatientSortOrder("desc");
                          else setPatientSortOrder("default");
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          Hasta Kodu
                          <div className="flex flex-col text-[8px] opacity-40 group-hover:opacity-100 transition-opacity">
                            <i className={`fa-solid fa-chevron-up ${patientSortOrder === "asc" ? "text-indigo-600 dark:text-indigo-400 opacity-100 scale-125" : ""}`}></i>
                            <i className={`fa-solid fa-chevron-down ${patientSortOrder === "desc" ? "text-indigo-600 dark:text-indigo-400 opacity-100 scale-125" : ""}`}></i>
                          </div>
                        </div>
                      </th>
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
                          <td className="px-2.5 py-1.5 font-bold text-slate-500 dark:text-slate-400 text-[11px]">
                            #{p.patientCode || "Kayıtsız"}
                          </td>
                          <td className="px-2.5 py-1.5 font-black text-slate-800 dark:text-slate-100">
                            <div className="flex items-center gap-1.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                <i className="fa-regular fa-user"></i>
                              </div>

                              <div>
                                <div className="flex items-center">
                                  {p.name}
                                  {p.isEmergency && (
                                    <span className="animate-pulse bg-rose-500 text-white px-1.5 py-0.5 rounded text-[9px] font-black ml-1.5 shadow-sm">
                                      ACİL
                                    </span>
                                  )}
                                </div>

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
            const ownerId = (currentUserProfile?.role === "assistant" || currentUserProfile?.role === "doctor") 
                          ? currentUserProfile.createdBy 
                          : currentUser;

            let existingDb = { ...(globalData.pricingDb || {}) };
            if (existingDb["Genel Muayene"] !== undefined) {
              existingDb = {}; // Eski bozuk yapıyı tamamen temizle
            }

            // Sadece formdaki fiyatları kaydet, silinenleri geri getirme
            const cleanPricing = {};
            Object.keys(pricingEditValues).forEach((tx) => {
              cleanPricing[tx] = parseFloat(pricingEditValues[tx]) || 0;
            });

            existingDb[ownerId] = cleanPricing;

            saveGlobalData({ ...globalData, pricingDb: existingDb })
              .then(() => showNotification("Ücretlendirmeleriniz başarıyla kaydedildi."))
              .catch((err) => showNotification("Kayıt hatası oluştu.", "error"));
          };

          const handleSaveNewCustomTreatment = (e) => {
            e.preventDefault();
            const ownerId = (currentUserProfile?.role === "assistant" || currentUserProfile?.role === "doctor") 
                          ? currentUserProfile.createdBy 
                          : currentUser;

            let legacyPricing = null;
            if (globalData.pricingDb && globalData.pricingDb["Genel Muayene"] !== undefined) {
                legacyPricing = globalData.pricingDb;
            }
            const userPricing = globalData.pricingDb?.[ownerId] || legacyPricing || DEFAULT_PRICING;
            const treatmentName = newTreatmentForm.name.trim();
            
            if(!treatmentName) return;

            const updatedPricing = {
              ...userPricing,
              [treatmentName]: parseFloat(newTreatmentForm.price) || 0
            };

            let existingCustomDb = globalData.customTreatments || {};
            if (Array.isArray(existingCustomDb)) existingCustomDb = {};

            const userCustomTreatments = [...(existingCustomDb[ownerId] || [])];
            if (!userCustomTreatments.some(t => t.name === treatmentName)) {
               userCustomTreatments.push({ name: treatmentName, category: newTreatmentForm.category });
            }

            const updatedCustomTreatmentsDb = { ...existingCustomDb, [ownerId]: userCustomTreatments };

            let finalPricingDb = { ...(globalData.pricingDb || {}) };
            if (finalPricingDb["Genel Muayene"] !== undefined) finalPricingDb = {};
            finalPricingDb[ownerId] = updatedPricing;

            saveGlobalData({ 
              ...globalData, 
              pricingDb: finalPricingDb,
              customTreatments: updatedCustomTreatmentsDb 
            }).then(() => {
                setPricingEditValues(prev => ({ ...prev, [treatmentName]: parseFloat(newTreatmentForm.price) || 0 }));
                showNotification(`${treatmentName} sisteme başarıyla eklendi.`, "success");
                setIsAddTreatmentModalOpen(false);
                setNewTreatmentForm({ name: "", category: "Teşhis ve Radyoloji", price: "" });
            });
          };

          return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 pb-8 flex flex-col p-2 animate-pop w-full h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-2 pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
                <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1">
                  <i className="fa-solid fa-tags text-pink-500"></i> İşlem Ücretlendirmeleri
                </h2>
              </div>

              <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-2 font-medium">
                {hasPermission("treatments.manage") 
                  ? "Klinikte uyguladığınız işlemlere ait standart tutarları aşağıdan güncelleyebilirsiniz. Yeni eklenen işlemleri veya '0' olarak görünenleri doldurup kaydettiğinizde tüm sistemde anında geçerli olacaktır."
                  : "Kliniğinizde uygulanan işlemlerin standart ücret kataloğu aşağıdadır. (Sadece Görüntüleme Modu)"}
              </p>

              <form onSubmit={handleSavePricing} className="space-y-2">
                {Object.entries(DYNAMIC_PRICING_CATEGORIES).map(([catName, data]) => (
                  <div key={catName} className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <h3 className="font-black text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-2 text-base flex items-center gap-1">
                      <i className={`fa-solid ${data.icon} ${data.color}`}></i> {catName}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5">
                      {data.items.map((tx) => (
                        <div key={tx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                          <div className="flex-1">
                            <label className="font-bold text-slate-700 dark:text-slate-200 text-[13px] leading-tight block mb-1.5">
                              {tx}
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <span className="text-slate-400 text-[13px] font-black dark:text-slate-500">₺</span>
                              </div>
                              <input
                                type="number"
                                required
                                value={pricingEditValues[tx] ?? ""}
                                disabled={!hasPermission("treatments.manage")} // YENİ: Asistan değiştiremez
                                onChange={(e) =>
                                  setPricingEditValues({ ...pricingEditValues, [tx]: e.target.value })
                                }
                                className={`w-full text-right pr-3 pl-7 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 outline-none font-black text-base text-indigo-700 dark:text-indigo-400 bg-slate-50 dark:bg-slate-900 transition-all ${!hasPermission("treatments.manage") ? "opacity-80 cursor-not-allowed" : ""}`}
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* YENİ: Kaydet Butonunu Sadece Yetkili Görür */}
                {hasPermission("treatments.manage") && (
                  <div className="sticky bottom-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md pt-3 border-t border-slate-200 dark:border-slate-700 mt-2 flex justify-end">
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-3 py-2 rounded-xl font-black shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                    >
                      <i className="fa-solid fa-save mr-1.5"></i> Ücretleri Kaydet
                    </button>
                  </div>
                )}
              </form>
            </div>
          );
        };

        const renderDoctors = () => {

          const openDoctorDetails = (docUsername) => {
            setSelectedDoctorId(docUsername);
            const existingProfile = globalData.systemUsers?.[docUsername] || {};
            setDoctorEditForm({
              name: existingProfile.displayName || docUsername,
              title: existingProfile.title || "Hekim",
              commissionRate: existingProfile.commissionRate || "",
              avatar: existingProfile.avatar || null,
              zoom: existingProfile.zoom || 1,
              x: existingProfile.x || 50,
              y: existingProfile.y || 50
            });
            const defaultTab = currentUserProfile?.role === "assistant" ? "agenda" : "profile";
            setDocModalTab(defaultTab);
            setDocStatsStart(""); setDocStatsEnd(""); setDocStatsSelectedTreatment(null);
            setIsDoctorDetailsModalOpen(true);
          };

          const handleUpdateDoctor = (e) => {
            e.preventDefault();
            const normalizedEditName = doctorEditForm.name.trim().toLowerCase();
            const isDuplicateName = allDoctors.some((docId) => {
              if (docId === selectedDoctorId) return false;
              const docProfile = globalData.systemUsers?.[docId];
              return docProfile?.displayName?.trim().toLowerCase() === normalizedEditName;
            });

            if (isDuplicateName) {
              showNotification("Bu klinikte bu isimde başka bir hekim zaten bulunuyor.", "error"); return;
            }

            const updatedSystemUsers = JSON.parse(JSON.stringify(globalData.systemUsers || {}));
            if (updatedSystemUsers[selectedDoctorId]) {
                updatedSystemUsers[selectedDoctorId].displayName = doctorEditForm.name.trim(); // ANA KİMLİKTE (Her yerde) DEĞİŞTİRİYORUZ!
                updatedSystemUsers[selectedDoctorId].title = doctorEditForm.title;
                updatedSystemUsers[selectedDoctorId].commissionRate = parseFloat(doctorEditForm.commissionRate) || 0;
                updatedSystemUsers[selectedDoctorId].avatar = doctorEditForm.avatar || null;
                updatedSystemUsers[selectedDoctorId].zoom = doctorEditForm.zoom || 1;
                updatedSystemUsers[selectedDoctorId].x = doctorEditForm.x || 50;
                updatedSystemUsers[selectedDoctorId].y = doctorEditForm.y || 50;
            }

            saveGlobalData({ ...globalData, systemUsers: updatedSystemUsers });
            showNotification("Hekim profili tüm sistemlerde güncellendi.");
            setIsDoctorDetailsModalOpen(false);
          };

          const handleDeleteDoctor = () => {
            if (selectedDoctorId === currentUser) { showNotification("Şu an aktif olan hesabınızı silemezsiniz!", "error"); return; }
            showConfirm(`${selectedDoctorId} adlı hekimi pasife almak istediğinize emin misiniz? (Geçmiş randevuları korunacaktır)`, () => {
                const updatedSystemUsers = { ...globalData.systemUsers };
                if (updatedSystemUsers[selectedDoctorId]) {
                    updatedSystemUsers[selectedDoctorId].active = false;
                }
                saveGlobalData({ ...globalData, systemUsers: updatedSystemUsers });
                showNotification("Hekim pasife alındı.", "error");
                setIsDoctorDetailsModalOpen(false);
            });
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
            const ownerId = typeof getClinicOwnerId === "function" ? getClinicOwnerId() : currentUser;

            Object.entries(apts).forEach(([key, a]) => {
              const parts = key.split("-");
              const y = Number(parts[0]), m = Number(parts[1]), d = Number(parts[2]);
              const aptDateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

              let inRange = true;
              if (docStatsStart && aptDateStr < docStatsStart) inRange = false;
              if (docStatsEnd && aptDateStr > docStatsEnd) inRange = false;

              if (inRange) {
                stats.total++;
                if (a.status === "Yeni Kayıt" || a.status === "Bekliyor") stats.waiting++;
                if (a.status === "Geldi") stats.done++;

                let pId = a.patientId;
                if (!pId) {
                  const pObj = Object.values(globalData.patientsDb || {}).find(p => p.name === a.patientName);
                  if (pObj) pId = pObj.id;
                }
                const pData = pId ? globalData.patientsDb[pId] : null;

                let txList = [];
                if (a.selectedTreatments && a.selectedTreatments.length > 0) {
                    txList = a.selectedTreatments;
                } else if (a.treatment) {
                    const docPricing = globalData.pricingDb?.[ownerId] || (typeof globalData.pricingDb === "object" && globalData.pricingDb["Genel Muayene"] ? globalData.pricingDb : DEFAULT_PRICING);
                    const knownTreatments = Object.keys(docPricing);
                    if (knownTreatments.includes(a.treatment.trim())) {
                        txList = [{ treatment: a.treatment.trim(), tooth: "" }];
                    } else {
                        txList = a.treatment.split(",").map(t => ({ treatment: t.trim(), tooth: "" })).filter(t => t.treatment);
                    }
                } else if (a.price) {
                    txList = [{ treatment: "İşlem Kaydı", tooth: "" }];
                } else {
                    txList = [{ treatment: "Belirtilmedi", tooth: "" }]; // BEYAZ EKRAN KALKANI 1
                }

                let aptOverallPrice = parseFloat(a.price) || 0;
                let useOverallPrice = aptOverallPrice > 0 && txList.length <= 1;

                txList.forEach((tx) => {
                    const txName = tx.treatment || "Belirtilmedi"; // BEYAZ EKRAN KALKANI 2
                    stats.treatments[txName] = (stats.treatments[txName] || 0) + 1;
                    
                    let itemPrice = 0;
                    let matchedPlan = null;
                    if (pData && pData.plannedTreatments) {
                        matchedPlan = pData.plannedTreatments.find(pt => 
                            pt.treatment === txName && 
                            (pt.tooth === tx.tooth || !tx.tooth || tx.tooth === "")
                        );
                    }

                    if (matchedPlan) {
                        itemPrice = parseFloat(matchedPlan.price) || 0;
                    } 
                    else if (useOverallPrice) {
                        itemPrice = aptOverallPrice;
                    } 
                    else {
                        const docPricing = globalData.pricingDb?.[ownerId] || (typeof globalData.pricingDb === "object" && globalData.pricingDb["Genel Muayene"] ? globalData.pricingDb : DEFAULT_PRICING);
                        const matchedStandardTx = Object.keys(docPricing).find(t => txName.includes(t));
                        if (matchedStandardTx && docPricing[matchedStandardTx] !== undefined) {
                            itemPrice = parseFloat(docPricing[matchedStandardTx]) || 0;
                        }
                    }

                    if (a.status === "Geldi" && itemPrice > 0) {
                        stats.revenue += itemPrice;
                    }

                    stats.ptList.push({
                        date: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
                        time: key.split("-")[3] || "00:00",
                        patient: a.patientName,
                        treatment: tx.tooth ? `Diş: ${tx.tooth} - ${txName}` : txName,
                        rawTreatment: txName,
                        selectedTreatments: [tx],
                        status: a.status,
                        price: itemPrice,
                        timestamp: new Date(y, m - 1, d, ...(key.split("-")[3] || "00:00").split(":")).getTime() 
                    });
                });
              }
            });

            Object.values(globalData.patientsDb || {}).forEach((p) => {
                if (p.plannedTreatments) {
                    p.plannedTreatments.forEach((tx) => {
                        if (tx.isCompleted && tx.completedBy === docId) {
                            const completedDate = new Date(tx.completedAt || tx.date);
                            const txDateStr = formatDateKey(completedDate);
                            
                            let inRange = true;
                            if (docStatsStart && txDateStr < docStatsStart) inRange = false;
                            if (docStatsEnd && txDateStr > docStatsEnd) inRange = false;
                            
                            if (inRange) {
                                const txName = tx.treatment || "Belirtilmedi";
                                const alreadyAdded = stats.ptList.some(listItem => 
                                    listItem.patient === p.name && 
                                    listItem.rawTreatment === txName && 
                                    listItem.status === "Geldi" &&
                                    (listItem.selectedTreatments[0]?.tooth === tx.tooth || !tx.tooth)
                                );

                                if (!alreadyAdded) {
                                    stats.total++;
                                    stats.done++;
                                    
                                    let finalPrice = parseFloat(tx.price) || 0;
                                    stats.revenue += finalPrice;
                                    
                                    stats.treatments[txName] = (stats.treatments[txName] || 0) + 1;
                                    
                                    stats.ptList.push({
                                        date: `${String(completedDate.getDate()).padStart(2, "0")}/${String(completedDate.getMonth() + 1).padStart(2, "0")}/${completedDate.getFullYear()}`,
                                        time: completedDate.toLocaleTimeString("tr-TR", {hour: "2-digit", minute: "2-digit"}),
                                        patient: p.name,
                                        treatment: tx.tooth === "Tüm Çene" ? txName : `Diş: ${tx.tooth} - ${txName}`,
                                        rawTreatment: txName,
                                        selectedTreatments: [{treatment: txName, tooth: tx.tooth}],
                                        status: "Geldi",
                                        price: finalPrice,
                                        timestamp: completedDate.getTime()
                                    });
                                }
                            }
                        }
                    });
                }
            });

            stats.ptList.sort((a, b) => b.timestamp - a.timestamp);
            return stats;
          };

          return (
            <div className="w-full h-full flex flex-col relative animate-pop">
              {!isDoctorDetailsModalOpen && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 pb-8 flex flex-col p-2 w-full h-full overflow-y-auto">
                  <div className="flex justify-between items-center mb-2 pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
                    <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1">
                      <i className="fa-solid fa-user-doctor text-indigo-500"></i> Hekim Yönetimi
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5 content-start">
                    {allDoctors.map((doc) => {
                      const prof = globalData.systemUsers?.[doc] || {};

                      return (
                        <div
                          key={doc}
                          onClick={() => openDoctorDetails(doc)}
                          className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition cursor-pointer group relative"
                        >
                          <div className="w-14 h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400 text-base shadow-sm group-hover:text-indigo-500 transition-colors overflow-hidden relative shrink-0">
                            {prof.avatar ? (
                              <img
                                src={prof.avatar}
                                style={{
                                  transform: `scale(${prof.zoom || 1})`,
                                  objectPosition: `${prof.x || 50}% ${prof.y || 50}%`,
                                }}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <i className="fa-solid fa-user-doctor"></i>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="font-black text-slate-800 dark:text-white text-base">
                              {prof.displayName || doc}
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


              {isDoctorDetailsModalOpen &&
                selectedDoctorId &&
                (() => {
                  const stats = getDoctorFilteredStats(selectedDoctorId);
                  let displayedPtList = stats.ptList;

                  if (docStatsActiveFilter === "done")
                    displayedPtList = displayedPtList.filter((pt) => pt.status === "Geldi");
                  if (docStatsActiveFilter === "waiting")
                    displayedPtList = displayedPtList.filter(
                      (pt) => pt.status === "Yeni Kayıt" || pt.status === "Bekliyor"
                    );
                  if (docStatsActiveFilter === "revenue")
                    displayedPtList = displayedPtList.filter(
                      (pt) => pt.price > 0 && pt.status === "Geldi"
                    );

                  if (docStatsSelectedTreatment) {
                    displayedPtList = displayedPtList.filter((pt) => {
                      if (pt.selectedTreatments && pt.selectedTreatments.length > 0) {
                         return pt.selectedTreatments.some(t => t.treatment === docStatsSelectedTreatment);
                      }
                      const rawTx = pt.rawTreatment || "";
                      if (!rawTx) return false;
                      
                      const ownerId = typeof getClinicOwnerId === "function" ? getClinicOwnerId() : currentUser;
                      const knownTreatments = Object.keys(globalData.pricingDb?.[ownerId] || DEFAULT_PRICING);
                      
                      if (knownTreatments.includes(rawTx.trim())) {
                         return rawTx.trim() === docStatsSelectedTreatment;
                      }
                      
                      const txList = rawTx.split(",").map(t => t.trim());
                      return txList.includes(docStatsSelectedTreatment);
                    });
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
                              {globalData.doctorProfiles?.[selectedDoctorId]?.avatar ? (
                                <img
                                  src={globalData.doctorProfiles[selectedDoctorId].avatar}
                                  style={{
                                    transform: `scale(${globalData.doctorProfiles[selectedDoctorId].zoom || 1})`,
                                    objectPosition: `${globalData.doctorProfiles[selectedDoctorId].x || 50}% ${globalData.doctorProfiles[selectedDoctorId].y || 50}%`,
                                  }}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <i className="fa-solid fa-user-doctor"></i>
                              )}
                            </div>
                            <div>
                              <h3 className="font-black text-slate-800 dark:text-white text-base leading-tight">
                                {globalData.doctorProfiles?.[selectedDoctorId]?.name}
                              </h3>
                              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mt-0.5 bg-indigo-50 dark:bg-indigo-900/30 inline-block px-1.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800">
                                {globalData.doctorProfiles?.[selectedDoctorId]?.title || "Hekim Profili"}
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

                      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 px-2.5 pt-3 gap-2 shrink-0 overflow-x-auto custom-scrollbar">
                        {/* Patron ve Hekim "Profil Düzenle" Görür */}
                        {currentUserProfile?.role !== "assistant" && (
                          <button
                            onClick={() => setDocModalTab("profile")}
                            className={`pb-2 font-bold text-[13px] border-b-2 transition-all whitespace-nowrap ${
                              docModalTab === "profile"
                                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                                : "border-transparent text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            Profil Düzenle
                          </button>
                        )}

                        {/* Asistan Sadece "Çalışma Özeti" Görür */}
                        {currentUserProfile?.role === "assistant" && (
                          <button
                            onClick={() => setDocModalTab("agenda")}
                            className={`pb-2 font-bold text-[13px] border-b-2 transition-all whitespace-nowrap flex items-center gap-1 ${
                              docModalTab === "agenda"
                                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                                : "border-transparent text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            <i className="fa-solid fa-clipboard-list"></i> Günlük Çalışma Özeti
                          </button>
                        )}

                        {hasPermission("finance.view") && (
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
                        )}
                      </div>

                      <div className="p-2 overflow-y-auto flex-1">
                        {docModalTab === "agenda" && (() => {
                          const todayStr = formatDateKey(new Date());
                          const nowMs = new Date().getTime();
                          const docApts = globalData.appointments?.[selectedDoctorId] || {};

                          let todaysAptsList = [];
                          let upcomingAptsList = [];
                          let pastAptsList = [];
                          let upcoming7DaysLoad = { "1":0, "2":0, "3":0, "4":0, "5":0, "6":0, "7":0 };
                          let treatmentStats = {};

                          // 7 Günlük süreyi hesapla
                          const oneWeekLaterMs = nowMs + 7 * 24 * 60 * 60 * 1000;

                          Object.entries(docApts).forEach(([k, apt]) => {
                             if(!apt || apt.status === "İptal") return; 
                             
                             const parts = k.split("-");
                             const y = parts[0] || "";
                             const m = parts[1] || "";
                             const d = parts[2] || "";
                             const timeStr = parts[3] || "00:00";
                             
                             const aptTimeMs = new Date(`${y}-${m}-${d}T${timeStr}:00`).getTime();
                             const safeAptTimeMs = isNaN(aptTimeMs) ? 0 : aptTimeMs;
                             const isToday = k.startsWith(todayStr);

                             // ZIRH 1: Hasta adı veya veritabanı kaydı bozuksa çökmeyi engelle
                             const pData = Object.values(globalData.patientsDb || {}).find(p => 
                               p?.name && apt?.patientName && p.name.toLowerCase() === apt.patientName.toLowerCase()
                             );

                             const aptData = { 
                               ...apt,
                               key: k, 
                               time: timeStr, 
                               aptTimeMs: safeAptTimeMs, 
                               patientId: pData?.id || apt?.patientId || null,
                               phone: pData?.phone || apt?.phone || null,
                               anamnesis: pData?.anamnesis || apt?.anamnesis || null
                             };

                             if (isToday) {
                                todaysAptsList.push(aptData);
                                // Günlük işlem dağılımı
                                if (apt.treatment && apt.status === "Geldi") {
                                   const txBase = apt.treatment.split(' ')[0]; 
                                   treatmentStats[txBase] = (treatmentStats[txBase] || 0) + 1;
                                }
                             } else if (safeAptTimeMs > nowMs) {
                                upcomingAptsList.push(aptData);
                             } else {
                                pastAptsList.push(aptData);
                             }

                             // Gelecek 7 gün yoğunluk haritası
                             if (safeAptTimeMs > nowMs && safeAptTimeMs <= oneWeekLaterMs) {
                                const diffDays = Math.ceil((safeAptTimeMs - nowMs) / (1000 * 60 * 60 * 24));
                                if(diffDays >= 1 && diffDays <= 7) {
                                   upcoming7DaysLoad[diffDays.toString()]++;
                                }
                             }
                          });

                          // ZIRH 2: time parametresi boşsa sort fonksiyonunun çökmesini engelle
                          todaysAptsList.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
                          upcomingAptsList.sort((a, b) => a.aptTimeMs - b.aptTimeMs);
                          pastAptsList.sort((a, b) => b.aptTimeMs - a.aptTimeMs); 

                          const totalToday = todaysAptsList.length;
                          const waitingToday = todaysAptsList.filter(a => a.status === "Yeni Kayıt" || a.status === "Bekliyor").length;
                          const doneToday = todaysAptsList.filter(a => a.status === "Geldi").length;
                          const cancelledToday = todaysAptsList.filter(a => a.status === "İptal" || a.status === "Gelmedi").length;

                          const displayedApts = todaysAptsList.filter(a => {
                             if(docStatsActiveFilter === "all") return true;
                             if(docStatsActiveFilter === "waiting") return a.status === "Yeni Kayıt" || a.status === "Bekliyor";
                             if(docStatsActiveFilter === "done") return a.status === "Geldi";
                             if(docStatsActiveFilter === "cancelled") return a.status === "İptal" || a.status === "Gelmedi";
                             return true;
                          });

                          const getPrepDetails = (treatment) => {
                             const t = (treatment || "").toLowerCase();
                             
                             // 1. İMPLANT VE CERRAHİ İŞLEMLER
                             if(t.includes("implant (greftli)") || t.includes("kemik tozu") || t.includes("sinüs")) 
                                return { label: "Cerrahi Set, Fizyodispanser, Kemik Grefti, Membran, Sütür, Steril Örtü", icon: "fa-screwdriver-wrench", color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" };
                             if(t.includes("implant")) 
                                return { label: "Cerrahi Set, Fizyodispanser, İmplant Parçaları, Sütür, Steril Örtü", icon: "fa-screwdriver-wrench", color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" };
                             if(t.includes("gömülü") || t.includes("komplikasyonlu")) 
                                return { label: "Cerrahi Set, Cerrahi Mikromotor, Elevatör, Sütür, Tampon", icon: "fa-tooth", color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" };
                             if(t.includes("çekim")) 
                                return { label: "Davye, Elevatör, Anestezi, Tampon", icon: "fa-pliers", color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" };
                             
                             // 2. ENDODONTİ (KANAL TEDAVİSİ)
                             if(t.includes("kanal tedavisi yenileme") || t.includes("retreatment")) 
                                return { label: "Endomotor, Apeks Bulucu, Gutta Çözücü, İrrigasyon (NaOCl), Rubber Dam", icon: "fa-tooth", color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800" };
                             if(t.includes("kanal")) 
                                return { label: "Endomotor, Apeks Bulucu, İrrigasyon (NaOCl), Gutta Percha, Paper Point, Rubber Dam", icon: "fa-tooth", color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800" };
                             
                             // 3. RESTORATİF (DOLGU VE ESTETİK)
                             if(t.includes("vener") || t.includes("estetik dolgu")) 
                                return { label: "Asit, Bond, Estetik Kompozit Seti, Polisaj Diskleri, Işın Cihazı", icon: "fa-fill-drip", color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" };
                             if(t.includes("dolgu") || t.includes("fissür")) 
                                return { label: "Asit, Bond, Kompozit, Işın Cihazı, Matris Bant, Elmas Frez", icon: "fa-fill-drip", color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" };
                             
                             // 4. PROTETİK (ÖLÇÜ, KRON VE SİMANTASYON)
                             if(t.includes("simantasyon") || t.includes("yapıştırma") || t.includes("takma")) 
                                return { label: "İzolasyon (Pamuk Rulo), Siman (Yapıştırıcı), Artikülasyon Kağıdı, Işın Cihazı", icon: "fa-cubes", color: "text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800" };
                             if(t.includes("ölçü") || t.includes("protez") || t.includes("kron") || t.includes("zirkonyum")) 
                                return { label: "Silikon/Aljinat Ölçü Maddesi, Ölçü Kaşığı, Retraksiyon İpi (veya Ağız İçi Tarayıcı)", icon: "fa-cubes", color: "text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800" };
                             
                             // 5. PERİODONTOLOJİ (DİŞ ETİ TEDAVİSİ)
                             if(t.includes("küretaj") || t.includes("subgingival")) 
                                return { label: "Kavitron, El Küretleri (Gracey), Anestezi, İrrigasyon Solüsyonu", icon: "fa-sparkles", color: "text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800" };
                             if(t.includes("detertraj") || t.includes("temizliği")) 
                                return { label: "Kavitron (Ultrasonik Uçlar), Polisaj Patı, Fırça/Lastik", icon: "fa-sparkles", color: "text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800" };
                             
                             // 6. PEDODONTİ VE KORUYUCU (ÇOCUK)
                             if(t.includes("flor")) 
                                return { label: "Flor Jeli/Verniği, Tek Kullanımlık Flor Kaşığı, Pamuk Rulo", icon: "fa-child", color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" };
                             
                             // 7. ORTODONTİ
                             if(t.includes("ortodonti") || t.includes("tel")) 
                                return { label: "Braket, Ortodontik Tel, Penseler, Asit, Ortodontik Bond, Işın Cihazı", icon: "fa-teeth-open", color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" };
                             if(t.includes("plak")) 
                                return { label: "Ataşman Şablonu, Ataşman Kompoziti, Asit, Bond, Işın Cihazı", icon: "fa-face-smile", color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" };
                             
                             // 8. DEFAULT (GENEL MUAYENE VEYA BULUNAMAYANLAR)
                             return { label: "Standart Muayene Seti (Ayna, Sond, Presel), Bardak, Tükürük Emici", icon: "fa-kit-medical", color: "text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" };
                          };

                          return (
                            <div className="flex flex-col h-full animate-pop">
                               {/* 1. ÜST TIKLANABİLİR İSTATİSTİK KARTLARI (FİLTRELER) */}
                               <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0 mb-3">
                                  <div onClick={() => setDocStatsActiveFilter("all")} className={`cursor-pointer border p-2.5 rounded-xl text-center flex flex-col justify-center h-16 transition-all hover:scale-105 ${docStatsActiveFilter === "all" ? "bg-indigo-600 text-white shadow-lg border-indigo-700" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"}`}>
                                     <div className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${docStatsActiveFilter === "all" ? "text-indigo-200" : "text-slate-400"}`}>Tüm Randevular</div>
                                     <div className="text-xl font-black leading-none">{totalToday}</div>
                                  </div>
                                  <div onClick={() => setDocStatsActiveFilter("waiting")} className={`cursor-pointer border p-2.5 rounded-xl text-center flex flex-col justify-center h-16 transition-all hover:scale-105 ${docStatsActiveFilter === "waiting" ? "bg-amber-500 text-white shadow-lg border-amber-600" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"}`}>
                                     <div className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${docStatsActiveFilter === "waiting" ? "text-amber-200" : "text-amber-500"}`}>Bekleyen</div>
                                     <div className="text-xl font-black leading-none">{waitingToday}</div>
                                  </div>
                                  <div onClick={() => setDocStatsActiveFilter("done")} className={`cursor-pointer border p-2.5 rounded-xl text-center flex flex-col justify-center h-16 transition-all hover:scale-105 ${docStatsActiveFilter === "done" ? "bg-emerald-500 text-white shadow-lg border-emerald-600" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"}`}>
                                     <div className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${docStatsActiveFilter === "done" ? "text-emerald-200" : "text-emerald-500"}`}>Biten</div>
                                     <div className="text-xl font-black leading-none">{doneToday}</div>
                                  </div>
                                  <div onClick={() => setDocStatsActiveFilter("cancelled")} className={`cursor-pointer border p-2.5 rounded-xl text-center flex flex-col justify-center h-16 transition-all hover:scale-105 ${docStatsActiveFilter === "cancelled" ? "bg-rose-500 text-white shadow-lg border-rose-600" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"}`}>
                                     <div className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${docStatsActiveFilter === "cancelled" ? "text-rose-200" : "text-rose-500"}`}>İptal / Gelmedi</div>
                                     <div className="text-xl font-black leading-none">{cancelledToday}</div>
                                  </div>
                               </div>

                               <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0 overflow-hidden">
                                  {/* SOL BÜYÜK SÜTUN: Gelişmiş Randevu Akışı */}
                                  <div className="flex-[2] bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner flex flex-col overflow-hidden">
                                     <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
                                        <h4 className="font-black text-[12px] text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                          <i className="fa-solid fa-list-check text-indigo-500"></i> İşlem Sırası ve Oda Hazırlığı
                                        </h4>
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">{displayedApts.length} Kayıt Gösteriliyor</span>
                                     </div>
                                     
                                     <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                        {displayedApts.length > 0 ? displayedApts.map((apt, i) => {
                                           const prep = getPrepDetails(apt.treatment);
                                           const isDone = apt.status === "Geldi";
                                           
                                           // ZIRH 3: selectedTeeth dizisini güvenli yazdır
                                           const toothText = Array.isArray(apt.selectedTeeth) ? apt.selectedTeeth.join(", ") : apt.selectedTeeth;

                                           return (
                                           <div key={i} className={`bg-white dark:bg-slate-800 rounded-xl border p-2.5 shadow-sm transition-all relative overflow-visible group ${isDone ? "opacity-60 border-slate-200 dark:border-slate-700" : "border-indigo-100 dark:border-indigo-800 hover:shadow-md hover:border-indigo-300"}`}>
                                              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isDone ? "bg-slate-300 dark:bg-slate-600" : "bg-indigo-500"}`}></div>
                                              
                                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 pl-1">
                                                 <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    <div className="text-[14px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg shrink-0">
                                                       {apt.time}
                                                    </div>
                                                    <div className="flex flex-col">
                                                       <div className="font-black text-[14px] text-slate-800 dark:text-slate-200 leading-none mb-1 flex items-center gap-1.5">
                                                          {apt.patientName || "İsimsiz Kayıt"}
                                                          {apt.anamnesis && (
                                               <div className="relative inline-flex items-center">
                                                  <i className="fa-solid fa-triangle-exclamation text-rose-500 animate-pulse cursor-help text-base peer"></i>
                                                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all duration-200 w-56 p-2.5 bg-rose-600 text-white text-[11px] font-bold rounded-lg shadow-[0_15px_30px_rgba(225,29,72,0.4)] z-[9999] whitespace-pre-wrap pointer-events-none">
                                                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-rose-600"></div>
                                                     <i className="fa-solid fa-circle-exclamation mr-1"></i> <b>Önemli Uyarı:</b> {apt.anamnesis}
                                                  </div>
                                               </div>
                                            )}
                                                       </div>
                                                       <div className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                                                          <span><i className="fa-solid fa-stethoscope"></i> {apt.treatment || "Belirtilmedi"}</span>
                                                          {toothText && <span>| <i className="fa-solid fa-tooth"></i> Diş: {toothText}</span>}
                                                       </div>
                                                    </div>
                                                 </div>

                                                 <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end sm:justify-start pl-12 sm:pl-0">
                                                    {apt.phone && apt.phone.length > 8 && !isDone && (
                                                       <a href={`https://wa.me/${apt.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800" title="WhatsApp Mesajı">
                                                          <i className="fa-brands fa-whatsapp text-[13px]"></i>
                                                       </a>
                                                    )}
                                                    <div className="scale-95 origin-right">{getStatusBadge(apt.status, (e) => handleStatusCycle(e, selectedDoctorId, apt.key, apt))}</div>
                                                 </div>
                                              </div>

                                              {!isDone && (
                                                 <div className={`mt-2 ml-1 p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 ${prep.color}`}>
                                                    <div className="w-5 h-5 rounded-md bg-white/50 flex items-center justify-center shrink-0">
                                                       <i className={`fa-solid ${prep.icon}`}></i>
                                                    </div>
                                                    <span>Oda Hazırlığı: {prep.label}</span>
                                                 </div>
                                              )}
                                              
                                              {apt.notes && (
                                                 <div className="mt-1.5 ml-1 text-[10px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 p-1.5 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-1">
                                                    <i className="fa-solid fa-note-sticky mt-0.5"></i> {apt.notes}
                                                 </div>
                                              )}
                                           </div>
                                        )}) : (
                                           <div className="flex flex-col items-center justify-center h-40 text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                                              <i className="fa-regular fa-folder-open text-2xl mb-2 opacity-50"></i>
                                              <span className="text-[12px] font-bold">Bu filtreye uygun randevu bulunmuyor.</span>
                                           </div>
                                        )}
                                     </div>
                                  </div>

                                  {/* SAĞ DAR SÜTUN: Kapsamlı Operasyon Merkezi */}
                                  <div className="flex-1 flex flex-col gap-3 min-w-[250px] overflow-y-auto custom-scrollbar">
                                     
                                     {/* 1. ÜST KONTROL: ZAMAN DİLİMİ SEÇİCİ */}
                                     <div className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner flex gap-1 shrink-0">
                                        <button 
                                           onClick={(e) => { e.preventDefault(); setDashboardPeriod("today"); }} 
                                           className={`flex-1 text-[10px] font-black py-2 rounded-lg transition-all ${dashboardPeriod === "today" || dashboardPeriod === "month" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
                                        >
                                           GÜNLÜK
                                        </button>
                                        <button 
                                           onClick={(e) => { e.preventDefault(); setDashboardPeriod("week"); }} 
                                           className={`flex-1 text-[10px] font-black py-2 rounded-lg transition-all ${dashboardPeriod === "week" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
                                        >
                                           HAFTALIK
                                        </button>
                                        <button 
                                           onClick={(e) => { e.preventDefault(); setDashboardPeriod("all"); }} 
                                           className={`flex-1 text-[10px] font-black py-2 rounded-lg transition-all ${dashboardPeriod === "all" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
                                        >
                                           AYLIK
                                        </button>
                                     </div>

                                     {(() => {
                                        // AKTİF PERİYODA GÖRE VERİLERİ FİLTRELEME MOTORU
                                        const startOfToday = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
                                        const endOfToday = startOfToday + 86399999;
                                        
                                        let periodStart = startOfToday;
                                        let periodEnd = endOfToday;

                                        // Fallback olarak "month" seçiliyse de bugün gibi başlat, tıklanınca değişir
                                        if (dashboardPeriod === "week") {
                                           periodEnd = startOfToday + (7 * 86400000) - 1; 
                                        } else if (dashboardPeriod === "all") {
                                           periodEnd = startOfToday + (30 * 86400000) - 1;
                                        } else {
                                           periodEnd = endOfToday;
                                        }

                                        // periodApts: Seçili zaman dilimindeki TÜM randevular
                                        const periodApts = [];
                                        if (globalData.appointments) {
                                           allDoctors.forEach(docId => {
                                              if(globalData.appointments[docId]) {
                                                 Object.entries(globalData.appointments[docId]).forEach(([k, apt]) => {
                                                    const parts = k.split("-");
                                                    const aptTimeMs = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T${parts.slice(3).join(":")}:00`).getTime();
                                                    // Sadece İptal olmayan ve seçili aralığa girenleri al
                                                    if(aptTimeMs >= periodStart && aptTimeMs <= periodEnd && apt.status !== "İptal") {
                                                       periodApts.push({
                                                          ...apt,
                                                          originalKey: k,
                                                          docId: docId,
                                                          aptTimeMs
                                                       });
                                                    }
                                                 });
                                              }
                                           });
                                        }

                                        // Metrik Hesaplamaları
                                        const totalPeriod = periodApts.length;
                                        const donePeriod = periodApts.filter(a => a.status === "Geldi").length;
                                        const waitingPeriod = periodApts.filter(a => a.status === "Yeni Kayıt" || a.status === "Bekliyor").length;

                                        // 1. DİNAMİK EKSİK BİLGİ KONTROLÜ (Gerçek zamanlı hastalar tablosundan okur)
                                        const missingInfo = periodApts.filter(a => {
                                           const pData = globalData.patientsDb?.[a.patientId] || Object.values(globalData.patientsDb || {}).find(p => p.name === a.patientName);
                                           if(!pData) return true; // Hasta silinmişse veya bağ koptuysa uyar
                                           
                                           const phoneMissing = !pData.phone || pData.phone.replace(/\D/g, '').length < 10;
                                           const tcMissing = !pData.isForeign && (!pData.tc || pData.tc.length < 11);
                                           
                                           // Eğer canlı veritabanında eksik varsa true döner ve listeye girer.
                                           // Doldurulduğu saniye burası false döner ve menüden kendiliğinden silinir!
                                           return phoneMissing || tcMissing;
                                        });

                                        // 2. EKSİK EPİKRİZ KONTROLÜ (Geldi yapılmış ama geçmiş işlenmemiş)
                                        const missingRecords = periodApts.filter(a => {
                                           if (a.status !== "Geldi") return false;
                                           const pData = globalData.patientsDb?.[a.patientId] || Object.values(globalData.patientsDb || {}).find(p => p.name === a.patientName);
                                           if (!pData) return false;
                                           const hasHistory = (pData.clinicalHistory || []).some(h => h.appointmentId === a.originalKey);
                                           return !hasHistory;
                                        });

                                        return (
                                           <>
                                              {/* 2. CANLI METRİKLER (Seçilen Döneme Göre) */}
                                              <div className="grid grid-cols-2 gap-2 shrink-0">
                                                 <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center relative overflow-hidden group">
                                                    <div className="absolute -right-4 -top-4 w-12 h-12 bg-indigo-500/10 rounded-full group-hover:scale-150 transition-transform"></div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 relative z-10">Toplam Randevu</div>
                                                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 relative z-10">{totalPeriod}</div>
                                                 </div>
                                                 <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center relative overflow-hidden group">
                                                    <div className="absolute -left-4 -bottom-4 w-12 h-12 bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform"></div>
                                                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mb-1 relative z-10">Tamamlanan</div>
                                                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 relative z-10">{donePeriod}</div>
                                                 </div>
                                              </div>

                                              {/* 3. AKILLI UYARILAR VE HIZLI AKSİYONLAR */}
                                              {missingInfo.length === 0 && missingRecords.length === 0 ? (
                                                 <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50 p-3 shadow-sm flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center shrink-0 text-lg shadow-inner">
                                                       <i className="fa-solid fa-shield-check"></i>
                                                    </div>
                                                    <div>
                                                       <div className="font-black text-[12px] text-emerald-700 dark:text-emerald-400">Harika! Eksik Yok</div>
                                                       <div className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500">Seçili dönemdeki tüm hasta verileri ve epikrizler tam.</div>
                                                    </div>
                                                 </div>
                                              ) : (
                                                 <div className="bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800/50 p-3 shadow-sm flex flex-col gap-2 transition-all">
                                                    <h5 className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center justify-between border-b border-rose-100 dark:border-rose-800/50 pb-2">
                                                       <span className="flex items-center gap-1.5"><i className="fa-solid fa-triangle-exclamation animate-pulse"></i> Dikkat Gerektirenler</span>
                                                       <span className="bg-rose-200 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 px-2 py-0.5 rounded text-[10px] shadow-sm">{missingInfo.length + missingRecords.length} Uyarı</span>
                                                    </h5>
                                                    
                                                    {/* Eksik İletişim / Kimlik Bölümü */}
                                                    {missingInfo.length > 0 && (
                                                       <details className="group" open>
                                                          <summary className="text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer list-none flex justify-between items-center outline-none select-none hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1.5 -mx-1.5 rounded-lg">
                                                             <span className="flex items-center gap-1.5"><i className="fa-solid fa-id-card text-rose-400"></i> <span className="text-rose-600 font-black">{missingInfo.length} Hastanın</span> TC/Tel bilgisi eksik.</span>
                                                             <i className="fa-solid fa-chevron-down text-[10px] transition-transform group-open:rotate-180"></i>
                                                          </summary>
                                                          <div className="mt-1 space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1 animate-fadeIn">
                                                             {missingInfo.map((a, idx) => {
                                                                const pData = globalData.patientsDb?.[a.patientId] || Object.values(globalData.patientsDb || {}).find(p => p.name === a.patientName);
                                                                return (
                                                                <div key={`info-${idx}`} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-rose-100 dark:border-rose-800/60 shadow-sm hover:border-rose-300 transition-colors">
                                                                   <div className="flex flex-col min-w-0 pr-2">
                                                                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 truncate">{a.patientName}</span>
                                                                      <span className="text-[9px] text-rose-500 font-bold uppercase mt-0.5">
                                                                         {!pData ? "Dosya Yok" : (!pData.phone || pData.phone.replace(/\D/g,'').length < 10) ? "📞 Telefon Eksik" : "🪪 TC Eksik"}
                                                                      </span>
                                                                   </div>
                                                                   <button 
                                                                      type="button"
                                                                      onClick={(e) => {
                                                                         e.preventDefault();
                                                                         if(pData) {
                                                                            setPatientForm(pData);
                                                                            setPatientModalTab("info");
                                                                            setIsPatientModalOpen(true);
                                                                         } else {
                                                                            showNotification("Kayıt bulunamadı", "error");
                                                                         }
                                                                      }}
                                                                      className="bg-rose-100 text-rose-700 hover:bg-rose-500 hover:text-white dark:bg-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-800 px-2.5 py-1.5 rounded-md text-[10px] font-black transition-all shrink-0 shadow-sm"
                                                                   >
                                                                      Doldur <i className="fa-solid fa-arrow-right ml-0.5"></i>
                                                                   </button>
                                                                </div>
                                                             )})}
                                                          </div>
                                                       </details>
                                                    )}
                                                    
                                                    {missingInfo.length > 0 && missingRecords.length > 0 && (
                                                       <div className="h-px bg-rose-100 dark:bg-rose-800/50 my-1"></div>
                                                    )}

                                                    {/* Eksik Epikriz / İşlem Bölümü */}
                                                    {missingRecords.length > 0 && (
                                                       <details className="group" open>
                                                          <summary className="text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer list-none flex justify-between items-center outline-none select-none hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1.5 -mx-1.5 rounded-lg">
                                                             <span className="flex items-center gap-1.5"><i className="fa-solid fa-file-signature text-rose-400"></i> <span className="text-rose-600 font-black">{missingRecords.length} Hastanın</span> işlem kaydı eksik!</span>
                                                             <i className="fa-solid fa-chevron-down text-[10px] transition-transform group-open:rotate-180"></i>
                                                          </summary>
                                                          <div className="mt-1 space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1 animate-fadeIn">
                                                             {missingRecords.map((a, idx) => (
                                                                <div key={`rec-${idx}`} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800/60 shadow-sm hover:border-indigo-300 transition-colors">
                                                                   <div className="flex flex-col min-w-0 pr-2">
                                                                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 truncate">{a.patientName}</span>
                                                                      <span className="text-[9px] text-slate-500 font-bold truncate mt-0.5"><i className="fa-regular fa-clock"></i> {new Date(a.aptTimeMs).toLocaleDateString("tr-TR")} • {a.treatment || "Tedavi Belirtilmedi"}</span>
                                                                   </div>
                                                                   <button 
                                                                      type="button"
                                                                      onClick={(e) => {
                                                                         e.preventDefault();
                                                                         const pData = globalData.patientsDb?.[a.patientId] || Object.values(globalData.patientsDb || {}).find(p => p.name === a.patientName);
                                                                         if(pData) {
                                                                            setPatientForm(pData);
                                                                            setPatientModalTab("history");
                                                                            setIsPatientModalOpen(true);
                                                                            setTimeout(() => setIsAddHistoryModalOpen(true), 300);
                                                                         } else {
                                                                            showNotification("Hasta dosyası bulunamadı", "error");
                                                                         }
                                                                      }}
                                                                      className="bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white dark:bg-indigo-900/40 dark:text-indigo-400 dark:hover:bg-indigo-600 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1.5 rounded-md text-[10px] font-black transition-all shrink-0 shadow-sm"
                                                                   >
                                                                      Epikriz <i className="fa-solid fa-arrow-right ml-0.5"></i>
                                                                   </button>
                                                                </div>
                                                             ))}
                                                          </div>
                                                       </details>
                                                    )}
                                                 </div>
                                              )}

                                              {/* 4. WP TOPLU MESAJ / HATIRLATMA MODÜLÜ */}
                                              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm flex flex-col gap-2 shrink-0">
                                                 <h5 className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1 border-b border-slate-100 dark:border-slate-700 pb-1.5">
                                                    <i className="fa-solid fa-bullhorn text-emerald-500 mr-1"></i> WhatsApp Otomasyonu
                                                 </h5>
                                                 
                                                 <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                                                    <span className="text-[11px] font-bold text-slate-500">Seçili Dönem (Bekleyen):</span>
                                                    <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400">{waitingPeriod}</span>
                                                 </div>

                                                 {waitingPeriod > 0 ? (
                                                    <button 
                                                       type="button"
                                                       onClick={() => {
                                                          const patientsWithPhone = periodApts.filter(a => (a.status === "Yeni Kayıt" || a.status === "Bekliyor") && a.phone && String(a.phone).replace(/\D/g,'').length > 9);
                                                          if(patientsWithPhone.length === 0) {
                                                             showNotification("Bu dönemdeki bekleyen hastaların telefonu yok!", "error");
                                                             return;
                                                          }
                                                          
                                                          const firstPatient = patientsWithPhone[0];
                                                          let num = String(firstPatient.phone).replace(/\D/g, "");
                                                          if (!num.startsWith("90")) num = "90" + num;
                                                          
                                                          const aptDateStr = new Date(firstPatient.aptTimeMs).toLocaleDateString("tr-TR");
                                                          const timeDisplay = firstPatient.timeStr ? firstPatient.timeStr.split(" - ")[0] : "belirtilen saatteki";
                                                          const msg = `Sayın ${firstPatient.patientName},\n\n${aptDateStr} tarihi, saat ${timeDisplay} randevunuzu hatırlatırız. Sağlıklı günler dileriz.\n\n${settings?.klinik?.ad || "Klinik"}`;
                                                          window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
                                                          
                                                          showNotification(`Bekleyen ilk hasta (${firstPatient.patientName}) için WhatsApp açıldı.`);
                                                       }}
                                                       className="w-full mt-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 border border-emerald-200 py-2 rounded-lg text-[11px] font-black hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
                                                    >
                                                       <i className="fa-brands fa-whatsapp text-[14px]"></i> Sıradaki Hastaya Mesaj At
                                                    </button>
                                                 ) : (
                                                    <div className="text-center text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900/30 py-2 border border-dashed rounded-lg border-slate-200 dark:border-slate-700">
                                                       Bekleyen hasta yok.
                                                    </div>
                                                 )}
                                              </div>

                                           </>
                                        );
                                     })()}
                                  </div>
                               </div>
                            </div>
                          );
                        })()}
                        {docModalTab === "profile" && (
                          <form
                            onSubmit={handleUpdateDoctor}
                            className="space-y-2 max-w-2xl mx-auto bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg mt-2 relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                            <h4 className="font-black text-[13px] uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-1">
                              <i className="fa-solid fa-id-card text-indigo-500"></i> Temel Bilgiler & Yetkiler
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
                              {isPrivacyMode ? (
                                <div className="w-full p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-400 dark:text-slate-500 mb-2 cursor-not-allowed select-none">
                                  *** (Gizli)
                                </div>
                              ) : (
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
                              )}
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
                                          transform: `scale(${doctorEditForm.zoom || 1})`,
                                          objectPosition: `${doctorEditForm.x || 50}% ${doctorEditForm.y || 50}%`,
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
                                  Fotoğraf eklemek veya hizalamak için<br />yandaki yuvaya tıklayın.
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 pt-3 border-t border-slate-100 dark:border-slate-700 mt-1.5">
                              {hasPermission("doctors.delete") && selectedDoctorId !== currentUser && (
                                <button
                                  type="button"
                                  onClick={handleDeleteDoctor}
                                  className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 font-bold rounded-xl transition border border-rose-100 dark:border-rose-800/50 flex items-center gap-1"
                                >
                                  <i className="fa-solid fa-trash"></i> Hekimi Sil
                                </button>
                              )}

                              {hasPermission("doctors.edit") && (
                                <button
                                  type="submit"
                                  className="flex-1 py-1.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md"
                                >
                                  Değişiklikleri Kaydet
                                </button>
                              )}
                            </div>
                          </form>
                        )}

                        {docModalTab === "stats" && hasPermission("finance.view") && (
                          <div className="space-y-2 flex flex-col pb-3">
                            <div className="flex justify-end gap-1 items-center bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 shrink-0">
                              <span className="text-[11px] font-bold text-slate-500 mr-1.5">
                                <i className="fa-regular fa-calendar mr-1"></i> Tarih Aralığı:
                              </span>
                              <input
                                type="date"
                                value={docStatsStart}
                                onChange={(e) => setDocStatsStart(e.target.value)}
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
                                <div className="text-[10px] font-bold text-slate-500 uppercase">Toplam Randevu</div>
                                <div className="text-base font-black text-indigo-600 dark:text-indigo-400">{stats.total}</div>
                              </div>

                              <div
                                onClick={() => setDocStatsActiveFilter("done")}
                                className={`p-2 rounded-xl border shadow-sm text-center cursor-pointer transition-all hover:scale-105 ${
                                  docStatsActiveFilter === "done"
                                    ? "bg-emerald-100 border-emerald-500 dark:bg-emerald-900/50 ring-2 ring-emerald-500"
                                    : "bg-emerald-50/30 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50"
                                }`}
                              >
                                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">İşlemi Biten</div>
                                <div className="text-base font-black text-emerald-600 dark:text-emerald-400">{stats.done}</div>
                              </div>

                              <div
                                onClick={() => setDocStatsActiveFilter("waiting")}
                                className={`p-2 rounded-xl border shadow-sm text-center cursor-pointer transition-all hover:scale-105 ${
                                  docStatsActiveFilter === "waiting"
                                    ? "bg-amber-100 border-amber-500 dark:bg-amber-900/50 ring-2 ring-amber-500"
                                    : "bg-amber-50/30 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50"
                                }`}
                              >
                                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">Bekleyen Aktif</div>
                                <div className="text-base font-black text-amber-600 dark:text-amber-400">{stats.waiting}</div>
                              </div>

                              <div
                                onClick={() => setDocStatsActiveFilter("revenue")}
                                className={`p-2 rounded-xl border shadow-sm text-center cursor-pointer transition-all hover:scale-105 ${
                                  docStatsActiveFilter === "revenue"
                                    ? "bg-blue-100 border-blue-500 dark:bg-blue-900/50 ring-2 ring-blue-500"
                                    : "bg-blue-50/30 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50"
                                }`}
                              >
                                <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">Üretilen Ciro</div>
                                <div className="text-base font-black text-blue-600 dark:text-blue-400">
                                  {renderMoney(stats.revenue)} {isPrivacyMode ? "" : "₺"}
                                </div>
                                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 bg-white/50 dark:bg-black/20 rounded py-0.5">
                                  Hakediş: {renderMoney((stats.revenue * (globalData.systemUsers?.[selectedDoctorId]?.commissionRate || 0)) / 100)} {isPrivacyMode ? "" : "₺"}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-2 min-h-[400px]">
                              <div className="flex-1 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-0 h-full">
                                <h4 className="font-black text-[11px] text-slate-500 uppercase mb-2 tracking-wider shrink-0">
                                  İşlem Dağılımı <span className="text-[9px] font-normal text-slate-400 normal-case block mt-0.5">Detay için işleme tıklayın</span>
                                </h4>

                                <div className="space-y-1.5 overflow-y-auto flex-1">
                                  {Object.entries(stats.treatments).length > 0 ? (
                                    Object.entries(stats.treatments).map(([t, count]) => {
                                      const isSelected = docStatsSelectedTreatment === t;
                                      return (
                                        <div
                                          key={t}
                                          onClick={() => setDocStatsSelectedTreatment(isSelected ? null : t)}
                                          className={`flex justify-between items-center text-[11px] p-1.5 rounded-lg font-bold border cursor-pointer transition ${
                                            isSelected
                                              ? "bg-indigo-50 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-600 ring-1 ring-indigo-500"
                                              : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                          }`}
                                        >
                                          <span className={isSelected ? "text-indigo-800 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"}>{t}</span>
                                          <span className={`px-1.5 py-0.5 rounded shadow-sm ${isSelected ? "bg-indigo-600 text-white" : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"}`}>
                                            {count} Kez
                                          </span>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="text-[11px] text-slate-400 font-medium text-center py-2">Kayıtlı işlem yok.</div>
                                  )}
                                </div>
                              </div>

                              <div className="flex-[2] bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-0 h-full">
                                <div className="flex justify-between items-center mb-2 shrink-0">
                                  <h4 className="font-black text-[11px] text-slate-500 uppercase tracking-wider">
                                    Randevu Geçmişi Detayı{" "}
                                    <span className="text-indigo-600 dark:text-indigo-400 ml-1">
                                      [{docStatsActiveFilter === "all" ? "Tüm Randevular" : docStatsActiveFilter === "done" ? "İşlemi Bitenler" : docStatsActiveFilter === "waiting" ? "Bekleyen Aktifler" : "Ciroya Dahil Biten İşlemler"}]
                                    </span>
                                    {docStatsSelectedTreatment && <span className="text-purple-600 dark:text-purple-400 ml-1">({docStatsSelectedTreatment})</span>}{" "}
                                    <span className="ml-1 text-slate-400">({displayedPtList.length} Kayıt)</span>
                                  </h4>
                                  {docStatsSelectedTreatment && (
                                    <button onClick={() => setDocStatsSelectedTreatment(null)} className="text-[10px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold transition">Filtreyi Temizle</button>
                                  )}
                                </div>

                                <div className="flex-1 overflow-y-auto pr-1.5 space-y-1.5">
                                  {displayedPtList.map((pt, i) => (
                                    <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 transition">
                                      <div>
                                        <div className="font-black text-slate-800 dark:text-slate-200 text-[13px]">{pt.patient}</div>
                                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{pt.date} - {pt.time} • {pt.treatment || "Belirtilmedi"}</div>
                                      </div>
                                      <div>{getStatusBadge(pt.status)}</div>
                                    </div>
                                  ))}
                                  {displayedPtList.length === 0 && (
                                    <div className="text-[11px] text-slate-400 font-medium text-center py-2">Bu kriterlere uygun randevu yok.</div>
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
        // ==========================================
        // YENİ: KLİNİK KULLANICILARI (EKİP) YÖNETİMİ
        // ==========================================
        // ==========================================
        // YENİ: KLİNİK KULLANICILARI (EKİP) YÖNETİMİ
        // ==========================================
        const renderUsers = () => {
          const usersList = Object.values(globalData.systemUsers || {})
            .filter(u => u.clinicId === currentClinicId)
            .map(u => ({
              ...u,
              name: u.displayName || u.username,
              assignedDoctors: u.assignedDoctors || []
            }));

          const handleSaveUser = async (e) => {
            e.preventDefault();

            if (editingUsername && !hasPermission("users.edit")) {
              showNotification("Kullanıcı düzenleme yetkiniz bulunmuyor!", "error"); return;
            }
            if (!editingUsername && !hasPermission("users.create")) {
              showNotification("Yeni kullanıcı ekleme yetkiniz bulunmuyor!", "error"); return;
            }

            const uname = normalizeUsername(newUserForm.username);
            if (!uname) return;

            if (!editingUsername && !newUserForm.password) {
              showNotification("Yeni kullanıcı için şifre belirlemek zorunludur!", "error"); return;
            }
            if (!editingUsername && newUserForm.password.length < 6) {
              showNotification("Güvenlik gereği şifre EN AZ 6 KARAKTER olmalıdır!", "error"); return;
            }

            // PATRON KULLANICI EKLERKEN MAİL SORMASIN MANTIĞI:
            const safeClinicDomain = (currentClinicId || "klinik").replace(/[^a-zA-Z0-9]/g, "");
            // YENİ: Formda email girilmemişse, BENZERSİZ (Tarih damgalı) dahili email üret. 
            // Böylece hesap silinip aynı adla tekrar açıldığında Firebase Auth "Bu mail kullanılıyor" demez!
            const finalEmail = (newUserForm.email && newUserForm.email.includes("@")) 
                ? newUserForm.email 
                : `${uname}_${Date.now()}@${safeClinicDomain}.internal`.toLowerCase();

            const oldUname = normalizeUsername(editingUsername);
            const isEditing = !!editingUsername;
            
            if (!isEditing || uname !== oldUname) {
               const isTaken = Object.values(globalData.systemUsers || {}).some(u => normalizeUsername(u.username) === uname);
               if (isTaken) { showNotification("Bu kullanıcı adı sistemde kullanılıyor.", "error"); return; }
            }

            if (newUserForm.password && !isEditing) {
              try {
                const { initializeApp } = await import('firebase/app');
                const ghostApp = initializeApp(auth.app.options, "GhostApp_" + Date.now());
                const ghostAuth = getAuth(ghostApp);
                await createUserWithEmailAndPassword(ghostAuth, finalEmail, newUserForm.password);
                await signOut(ghostAuth);
              } catch (err) {
                console.error("Auth Kayıt Hatası:", err);
                if (err.code === 'auth/email-already-in-use') showNotification("Bu e-posta kullanımda!", "error"); 
                else showNotification("Kullanıcı oluşturulamadı: " + err.message, "error");
                return;
              }
            }

            const updatedSystemUsers = JSON.parse(JSON.stringify(globalData.systemUsers || {}));
            
            updatedSystemUsers[uname] = {
              ...(updatedSystemUsers[uname] || {}), // eski verileri koru
              username: uname,
              displayName: newUserForm.name,
              role: newUserForm.role,
              active: newUserForm.active,
              clinicId: currentClinicId,
              assignedDoctors: newUserForm.role === "assistant" ? newUserForm.assignedDoctors : [],
              email: isEditing ? (updatedSystemUsers[uname]?.email || finalEmail) : finalEmail,
              createdAt: updatedSystemUsers[uname]?.createdAt || Date.now()
            };

            saveGlobalData({ ...globalData, systemUsers: updatedSystemUsers }).then(() => {
              showNotification(isEditing ? "Kullanıcı güncellendi." : "Yeni kullanıcı eklendi.");
              setIsUserModalOpen(false);
            });
          };

          const handleToggleActive = (uname, currentStatus) => {
            if (!hasPermission("users.edit")) return showNotification("Yetkiniz yok!", "error");
            if (uname === currentUser) return showNotification("Kendinizi pasifleştiremezsiniz!", "error");
            
            showConfirm(`${uname} kullanıcısını ${currentStatus ? 'pasife almak' : 'aktifleştirmek'} istediğinize emin misiniz?`, () => {
              const updatedUsers = { ...globalData.systemUsers };
              if (updatedUsers[uname]) {
                 updatedUsers[uname].active = !currentStatus;
                 saveGlobalData({ ...globalData, systemUsers: updatedUsers }).then(() => {
                   showNotification("Kullanıcı durumu değiştirildi.");
                 });
              }
            });
          };

          return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col animate-pop w-full">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-t-xl shrink-0">
                <div>
                  <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-users-gear text-teal-500"></i> Klinik Ekibi ve Yetkiler
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Sisteme giriş yapabilen tüm personeli buradan yönetin.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingUsername(null);
                    setNewUserForm({ username: "", password: "", name: "", email: "", role: "assistant", active: true, assignedDoctors: [], isDoctor: true });
                    setIsUserModalOpen(true);
                  }}
                  className="bg-teal-600 text-white px-3 py-2 rounded-xl text-[12px] font-bold shadow-md hover:bg-teal-700 transition"
                >
                  <i className="fa-solid fa-plus mr-1"></i> Yeni Kullanıcı
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {usersList.map((usr) => (
                    <div key={usr.username} className={`border rounded-xl p-3 flex flex-col gap-2 transition-all ${usr.active ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md" : "bg-slate-50 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-600 opacity-70"}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${usr.role === 'clinic_owner' ? 'bg-amber-100 text-amber-600' : usr.role === 'doctor' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            <i className={`fa-solid ${usr.role === 'clinic_owner' ? 'fa-crown' : usr.role === 'doctor' ? 'fa-user-doctor' : 'fa-headset'}`}></i>
                          </div>
                          <div>
                            <div className="font-black text-[14px] text-slate-800 dark:text-white leading-tight">{usr.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">@{usr.username}</div>
                          </div>
                        </div>
                        <div className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${usr.active ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30" : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800"}`}>
                          {usr.active ? "Aktif" : "Pasif"}
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg text-[11px] mt-1 flex flex-col gap-1 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-500">Rol:</span>
                          <span className="text-slate-700 dark:text-slate-300">{usr.role === 'clinic_owner' ? 'Klinik Sahibi' : usr.role === 'doctor' ? 'Hekim' : 'Asistan'}</span>
                        </div>
                        {usr.role === 'assistant' && (
                          <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 pt-1 mt-1">
                            <span className="text-slate-500">Bağlı Hekim(ler):</span>
                            <span className="text-indigo-600 dark:text-indigo-400 text-right">
                              {usr.assignedDoctors.length > 0 ? usr.assignedDoctors.map(d => globalData.doctorProfiles?.[d]?.name || d).join(', ') : 'Atanmadı'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1.5 mt-auto pt-2">
                        {/* GÜVENLİK ZIRHI: Sadece Klinik Sahibi kendi hesabını veya diğer sahipleri düzenleyebilir */}
                        {usr.role === 'clinic_owner' && currentUserProfile?.role !== 'clinic_owner' ? (
                           <div className="w-full py-1.5 bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 rounded-lg text-[11px] font-bold text-center flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200 dark:border-slate-700">
                             <i className="fa-solid fa-lock"></i> Sadece Klinik Sahibi Yönetebilir
                           </div>
                        ) : (
                           <>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  setEditingUsername(usr.username);
                                  
                                  const profile = globalData.userProfiles?.[usr.username] || {};
                                  
                                  // YENİ: Saniyesinde yüklenen ana profilden doğrudan veriyi oku
                                  const isDocActive = profile.isDoctor !== undefined 
                                      ? profile.isDoctor 
                                      : (usr.role === 'clinic_owner' || usr.role === 'doctor');

                                  setNewUserForm({ 
                                    ...usr, 
                                    password: "", 
                                    email: profile.realEmail || "",
                                    isDoctor: isDocActive 
                                  }); 
                                  setIsUserModalOpen(true);
                                }} 
                                className="flex-1 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-200 transition dark:bg-slate-700 dark:text-slate-200"
                              >
                                <i className="fa-solid fa-pen mr-1"></i> Düzenle
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  const usernameToDelete = usr.username;

                                  if (usernameToDelete === currentUser) {
                                    showNotification("Şu an açık olan kendi hesabınızı silemezsiniz!", "error");
                                    return;
                                  }

                                  showConfirm(`${usernameToDelete} adlı kullanıcıyı sistemden KALICI OLARAK silmek istediğinize emin misiniz?\n\nBu işlem sonucunda bu kullanıcı adı boşa çıkacak ve yeni kayıtlarda kullanılabilecektir. Kullanıcının daha önce oluşturduğu randevular, hastalar ve klinik geçmiş verileri ise SİLİNMEYECEKTİR.`, () => {
                                    
                                    // YENİ V2 MİMARİSİ: Kullanıcıyı sadece Ana Rehberden (systemUsers) siliyoruz.
                                    // Böylece hesaba giriş yetkisi tamamen yok olur ve isim boşa çıkar.
                                    // Ancak appointments veya patients tablolarına DOKUNMUYORUZ ki geçmiş kayıtları bozulmasın!
                                    const updatedSystemUsers = JSON.parse(JSON.stringify(globalData.systemUsers || {}));
                                    delete updatedSystemUsers[usernameToDelete];

                                    saveGlobalData({
                                      ...globalData,
                                      systemUsers: updatedSystemUsers
                                    }).then(() => {
                                      showNotification(`${usernameToDelete} sistemden silindi, eski verileri korundu.`, "success");
                                    }).catch(() => {
                                      showNotification("Silme işlemi başarısız oldu.", "error");
                                    });
                                  }); 
                                }} 
                                className="px-2.5 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[11px] font-bold hover:bg-rose-100 transition shadow-sm border border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50 ml-1.5"
                                title="Kullanıcıyı Sil"
                              >
                                <i className="fa-solid fa-trash mr-1"></i> Sil
                              </button>
                              
                              <button onClick={() => handleToggleActive(usr.username, usr.active)} className={`w-8 flex items-center justify-center rounded-lg transition ${usr.active ? "bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-900/30" : "bg-emerald-50 text-emerald-500 hover:bg-emerald-100 dark:bg-emerald-900/30"}`} title={usr.active ? "Pasifleştir" : "Aktifleştir"}>
                                <i className={`fa-solid ${usr.active ? "fa-ban" : "fa-check"}`}></i>
                              </button>
                           </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isUserModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-2">
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-pop">
                    <div className="px-3 py-2 bg-[#0f172a] text-white flex justify-between items-center">
                      <h3 className="font-black text-[13px]"><i className="fa-solid fa-user-plus mr-1"></i> {editingUsername ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Oluştur"}</h3>
                      <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-base"></i></button>
                    </div>
                    <form onSubmit={handleSaveUser} className="p-3 space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ad Soyad</label>
                        <input required type="text" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold outline-none focus:border-teal-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sisteme Giriş Adı (Boşluksuz)</label>
                        <input 
                          required 
                          type="text" 
                          disabled={!!editingUsername} 
                          value={newUserForm.username} 
                          onChange={e => setNewUserForm({...newUserForm, username: e.target.value.replace(/\s+/g, '').toLowerCase()})} 
                          className={`w-full p-2 border-2 rounded-lg text-[13px] font-bold outline-none dark:text-white transition-all ${
                            editingUsername 
                              ? "bg-slate-200 dark:bg-slate-700 text-slate-500 border-slate-200 dark:border-slate-600 cursor-not-allowed" 
                              : newUserForm.username.length >= 3 
                                ? (checkUsernameAvailability(newUserForm.username, editingUsername) 
                                    ? "bg-white dark:bg-slate-900 border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" 
                                    : "bg-rose-50 dark:bg-rose-900/20 border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-600")
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-teal-500"
                          }`} 
                        />
                        {!editingUsername && newUserForm.username.length >= 3 && (
                          <div className={`text-[10px] font-bold mt-1 flex items-center gap-1 animate-fadeIn ${checkUsernameAvailability(newUserForm.username, editingUsername) ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            <i className={`fa-solid ${checkUsernameAvailability(newUserForm.username, editingUsername) ? "fa-check-circle" : "fa-circle-xmark"}`}></i>
                            {checkUsernameAvailability(newUserForm.username, editingUsername) ? "Kullanıcı adı uygun." : "Kullanıcı adı mevcut, lütfen değiştirin!"}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{editingUsername ? "Şifreyi Değiştir (İsteğe Bağlı)" : "Giriş Şifresi Belirle"}</label>
                        <input type="text" placeholder={editingUsername ? "Değiştirmek istemiyorsanız boş bırakın" : "En az 6 karakter"} minLength="6" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold outline-none focus:border-teal-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kullanıcı Rolü</label>
                          <select value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value, assignedDoctors: []})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold outline-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                            <option value="assistant">Asistan / Sekreter</option>
                            <option value="head_assistant">Başasistan (Yönetici)</option>
                            <option value="doctor">Hekim</option>
                            <option value="clinic_owner">Klinik Sahibi</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Durum</label>
                          <select value={newUserForm.active} onChange={e => setNewUserForm({...newUserForm, active: e.target.value === "true"})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold outline-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                            <option value="true">Aktif (Girebilir)</option>
                            <option value="false">Pasif (Giremez)</option>
                          </select>
                        </div>
                      </div>

                      {/* KLİNİK SAHİBİ İSE HEKİM OLUP OLMADIĞINI SORAN GEÇİŞ ANAHTARI */}
                      {newUserForm.role === "clinic_owner" && (
                         <label className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl flex items-center justify-between cursor-pointer group hover:border-indigo-300 transition-colors mt-2">
                            <div>
                               <div className="font-bold text-[12px] text-indigo-800 dark:text-indigo-400"><i className="fa-solid fa-user-doctor mr-1"></i> Bu kişi aktif hasta bakıyor mu?</div>
                               <div className="text-[10px] text-indigo-600/80 dark:text-indigo-500 mt-0.5">Klinik sahibi aynı zamanda klinikte hekimlik yapıyorsa açık bırakın.</div>
                            </div>
                            <div className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                               <input type="checkbox" className="sr-only peer" checked={newUserForm.isDoctor !== false} onChange={e => setNewUserForm({...newUserForm, isDoctor: e.target.checked})} />
                               <div className="w-9 h-5 bg-slate-300 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                            </div>
                         </label>
                      )}

                      {/* ASİSTAN İSE HEKİM SEÇİM ALANI AÇILIR */}
                      {newUserForm.role === "assistant" && (
                        <div className="p-2 border border-teal-200 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800 rounded-xl">
                          <label className="block text-[10px] font-black text-teal-700 dark:text-teal-400 uppercase mb-2"><i className="fa-solid fa-link mr-1"></i> Asistan Hangi Hekimlerin Verilerini Görebilsin?</label>
                          <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar">
                            {allDoctors.map(docId => (
                              <label key={docId} className="flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer p-1 hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded transition">
                                <input type="checkbox" checked={newUserForm.assignedDoctors.includes(docId)} onChange={e => {
                                  const isChecked = e.target.checked;
                                  setNewUserForm(prev => ({
                                    ...prev, 
                                    assignedDoctors: isChecked ? [...prev.assignedDoctors, docId] : prev.assignedDoctors.filter(id => id !== docId)
                                  }));
                                }} className="accent-teal-600 w-3.5 h-3.5" />
                                {globalData.doctorProfiles?.[docId]?.name || docId}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <button type="submit" className="w-full py-2.5 bg-[#0f172a] dark:bg-teal-600 text-white rounded-xl font-black text-[13px] shadow-lg hover:-translate-y-0.5 transition mt-2">
                        {editingUsername ? "Değişiklikleri Kaydet" : "Kullanıcıyı Oluştur"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          );
        };
const renderSettings = () => {
          const isOwner = currentUserProfile?.role === "clinic_owner";
          
          // Eğer Patron ise tüm sekmeleri görür, Asistan/Hekim ise SADECE Güvenlik sekmesini görür.
          const SETTINGS_TABS = isOwner ? [
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
            { id: "veri", icon: "fa-database", label: "Veri" },
            { id: "yetki", icon: "fa-user-shield", label: "Yetki Matrisi" }
          ] : [
            { id: "guvenlik", icon: "fa-shield-halved", label: "Güvenlik ve Hesap" }
          ];

          // Güvenlik Sekmesini Otomatik Açma Yönlendirmesi
          const currentSettingsTab = isOwner ? settingsTab : "guvenlik";

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
                {/* AKILLI VE SPESİFİK ARAMA ÇUBUĞU */}
                <div className="w-full md:w-auto flex flex-col items-end gap-2 relative">
                  <div className="relative w-full md:w-64 group z-50">
                    <i className="fa-solid fa-search absolute left-3 top-2.5 text-slate-400 text-[13px] group-focus-within:text-indigo-500 transition-colors z-10"></i>
                    
                    <input 
                      type="text" 
                      placeholder="Ayarlarda ara (Örn: TDB, Şifre, Logo...)" 
                      value={settingsSearch} 
                      onChange={(e) => setSettingsSearch(e.target.value)} 
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 shadow-inner dark:text-white transition-all relative z-10" 
                    />
                    
                    {settingsSearch && (
                      <button 
                         onClick={() => setSettingsSearch("")}
                         className="absolute right-2.5 top-2 text-slate-400 hover:text-rose-500 transition flex items-center justify-center w-5 h-5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30 z-10"
                         title="Aramayı Temizle"
                      >
                         <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    )}

                    {/* SPESİFİK SONUÇLAR (BİREBİR EŞLEŞEN MADDELER) */}
                    {settingsSearch.trim().length >= 2 && (
                      <div className="absolute top-full left-0 w-full md:w-[350px] right-auto md:-right-4 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-pop z-[100]">
                        {(() => {
                           const normalize = (str) => str.replace(/İ/g, 'i').replace(/I/g, 'i').toLowerCase().replace(/ç/g, 'c').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i');
                           const q = normalize(settingsSearch.trim());
                           
                           // YENİ: Sadece sayfa adını değil, ayarın TAM ADINI getiren spesifik sistem
                           const searchItems = [
                              { tab: "klinik", icon: "fa-hospital", title: "Klinik Tam Adı & İletişim", keywords: "ad isim klinik adi unvan telefon iletisim eposta mail numara" },
                              { tab: "klinik", icon: "fa-map-location-dot", title: "Klinik Açık Adresi", keywords: "adres mekan konum" },
                              { tab: "klinik", icon: "fa-image", title: "Klinik Logosu Değiştirme", keywords: "logo resim gorsel amblem" },
                              { tab: "calisma", icon: "fa-clock", title: "Mesai Başlangıç/Bitiş Saatleri", keywords: "mesai saat acilis kapanis calisma saati" },
                              { tab: "calisma", icon: "fa-calendar-days", title: "Çalışma (Tatil) Günleri", keywords: "gun hafta pazartesi pazar haftasonu" },
                              { tab: "calisma", icon: "fa-calendar-xmark", title: "Özel Kapalı Günler / Tatiller", keywords: "tatil ozel izin kapali bayram" },
                              { tab: "randevu", icon: "fa-stopwatch", title: "Varsayılan Randevu Süresi", keywords: "randevu suresi sure dakika zaman uzunluk" },
                              { tab: "randevu", icon: "fa-list-ol", title: "Takvim Slot Aralığı", keywords: "slot aralik takvim araligi satir" },
                              { tab: "randevu", icon: "fa-triangle-exclamation", title: "Çakışma ve Geçmiş Tarih Uyarıları", keywords: "cakisma gecmis uyari hata engel" },
                              { tab: "tedavi", icon: "fa-tags", title: "Tedavi ve Ücret Kataloğu", keywords: "tedavi fiyat ucret katalog para zirkonyum kanal dolgu implant muayene fiyat listesi" },
                              { tab: "tedavi", icon: "fa-plus", title: "Yeni Tedavi Ekle", keywords: "tedavi ekle yeni islem islem ekle" },
                              { tab: "bildirim", icon: "fa-whatsapp", title: "WhatsApp Hatırlatmaları", keywords: "whatsapp wp hatirlatma mesaj otomatik mesaj" },
                              { tab: "belge", icon: "fa-file-signature", title: "TDB Aydınlatılmış Onam Formu", keywords: "tdb onam aydinlatilmis riza form" },
                              { tab: "belge", icon: "fa-shield-halved", title: "KVKK Aydınlatma Metni", keywords: "kvkk kisisel veri gizlilik sozlesme" },
                              { tab: "belge", icon: "fa-tooth", title: "İmplant Cerrahi Onam Formu", keywords: "implant formu cerrahi onam implant onam" },
                              { tab: "belge", icon: "fa-teeth-open", title: "Ortodontik Tedavi Sözleşmesi", keywords: "ortodonti formu ortodonti sozlesmesi tel tedavisi" },
                              { tab: "dosya", icon: "fa-folder-tree", title: "Dosya Masası Klasör Yönetimi", keywords: "dosya masa klasor sekme etiket goster gizle" },
                              { tab: "otomasyon", icon: "fa-robot", title: "Otomatik Epikriz Oluşturma", keywords: "otomasyon epikriz oto otomatik epikriz kural" },
                              { tab: "otomasyon", icon: "fa-wand-magic-sparkles", title: "Yeni Hasta Otomasyonu (Dosya Taşıma)", keywords: "oto klasor tasima yeni hasta otomasyonu" },
                              { tab: "gorunum", icon: "fa-moon", title: "Karanlık / Aydınlık Tema", keywords: "karanlik aydinlik acik koyu dark light tema gece" },
                              { tab: "gorunum", icon: "fa-palette", title: "Klinik Marka Rengi Seçimi", keywords: "renk marka indigo zumrut yakut okyanus gece palette" },
                              { tab: "gorunum", icon: "fa-table-cells-large", title: "Arayüz Yoğunluğu (Kompakt Mod)", keywords: "yogunluk kompakt standart genis rahat dar" },
                              { tab: "guvenlik", icon: "fa-hourglass-end", title: "Oturum Zaman Aşımı", keywords: "oturum zaman asimi sure doldu otomatik cikis guvenlik" },
                              { tab: "guvenlik", icon: "fa-eye-slash", title: "Finansal Şifre (PIN) Değiştirme", keywords: "finans finans sifresi pin kilit goz para sifresi bakiye gizle" },
                              { tab: "guvenlik", icon: "fa-key", title: "Ana Hesap Şifresi Değiştirme", keywords: "ana sifre hesap sifresi sifre degistir parola" },
                              { tab: "veri", icon: "fa-file-excel", title: "Hastaları Excel (CSV) Olarak İndir", keywords: "excel csv indir disa aktar yedek disari hasta listesi indir" },
                              { tab: "veri", icon: "fa-stethoscope", title: "Sistem Veri Check-up (Bütünlük Taraması)", keywords: "check checkup butunluk hata bul tara tarama kontrol" },
                              { tab: "veri", icon: "fa-trash", title: "Tüm Sistemi Sıfırla (Tehlikeli)", keywords: "sifirla temizle sil fabrika ayarlari danger tehlikeli" },
                              { tab: "yetki", icon: "fa-user-shield", title: "Kullanıcı Yetki Matrisi (RBAC)", keywords: "yetki rol asistan hekim izin matris kim erisim gorunur gizli kullanim" }
                           ];

                           // Kelimeye göre spesifik maddeleri filtrele
                           const matches = searchItems.filter(item => {
                               return item.keywords.includes(q) || normalize(item.title).includes(q);
                           });

                           if(matches.length === 0) return <div className="p-4 text-center text-[11px] text-slate-500 font-bold bg-slate-50 dark:bg-slate-900/50">Bu terime uygun bir ayar bulunamadı.</div>;
                           
                           return (
                              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                 <div className="p-1.5 bg-indigo-50 dark:bg-slate-900 text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase text-center border-b border-indigo-100 dark:border-slate-700 tracking-wider">
                                    {matches.length} Spesifik Ayar Bulundu
                                 </div>
                                 {matches.map((m, i) => {
                                    const tabInfo = SETTINGS_TABS.find(t => t.id === m.tab);
                                    return (
                                    <div 
                                       key={i} 
                                       onClick={() => { 
                                          setSettingsTab(m.tab); 
                                          setSettingsSearch(""); // Seçim yapıldığında listeyi temizleyip kapatır
                                       }} 
                                       className="p-3 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors flex items-center gap-3 group"
                                    >
                                       <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[12px] shadow-sm group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                                         <i className={`fa-solid ${m.icon}`}></i>
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <div className="font-black text-[12px] text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors truncate">{m.title}</div>
                                          <div className="text-[9px] text-slate-500 font-bold mt-0.5"><span className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded mr-1 border border-slate-200 dark:border-slate-600 shadow-sm">{tabInfo?.label} Menüsü</span></div>
                                       </div>
                                       <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 group-hover:text-indigo-500 transition-colors"></i>
                                    </div>
                                 )})}
                              </div>
                           );
                        })()}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-[10px] text-slate-400 font-semibold text-right mt-1">
                    Son kaydedilme: <br/>{currentData.meta?.lastSavedAt ? new Date(currentData.meta.lastSavedAt).toLocaleString("tr-TR") : "Henüz kaydedilmedi"}
                  </div>
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
                
                {currentSettingsTab === "ozet" && (() => {
                  // Dinamik İstatistik Hesaplamaları
                  const ownerId = typeof getClinicOwnerId === "function" ? getClinicOwnerId() : currentUser;
                  const totalPats = Object.values(globalData.patientsDb || {}).filter(p => resolveClinicId(p.addedBy) === currentClinicId && !p.isDeleted).length;
                  const totalDocs = allDoctors.length;
                  const totalTxs = Object.keys(globalData.pricingDb?.[ownerId] || DEFAULT_PRICING).length;
                  
                  const activeModules = [
                    { name: "WhatsApp Otomasyonu", status: currentData.bildirim?.whatsappAktif, icon: "fa-whatsapp", color: "text-emerald-500" },
                    { name: "Akıllı Epikriz Üretimi", status: currentData.otomasyon?.otoEpikriz !== false, icon: "fa-robot", color: "text-indigo-500" },
                    { name: "Otomatik Dosyalama", status: currentData.otomasyon?.otoKlasor !== false, icon: "fa-folder-tree", color: "text-sky-500" },
                    { name: "Randevu Çakışma Önleyici", status: currentData.randevu?.cakismaKontrolu !== false, icon: "fa-shield-halved", color: "text-rose-500" }
                  ];

                  return (
                  <div className="animate-pop space-y-4">
                    {/* 1. ÜST BİLGİ VE LİSANS BARI */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-indigo-950 dark:to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-700">
                      <div className="absolute -right-10 -top-10 text-9xl text-white/5 pointer-events-none">
                        <i className="fa-solid fa-server"></i>
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-lg font-black flex items-center gap-2 mb-1">
                          <i className="fa-solid fa-circle-check text-emerald-400"></i> Sistem Stabil ve Güncel
                        </h3>
                        <p className="text-[12px] text-slate-300 font-medium">Tüm klinik verileriniz uçtan uca şifrelenerek bulut sunucularda yedeklenmektedir.</p>
                      </div>
                      <div className="relative z-10 flex gap-3 shrink-0">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2 rounded-xl text-center">
                          <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mb-0.5">Lisans Tipi</div>
                          <div className="text-[13px] font-black text-amber-400 flex items-center justify-center gap-1">
                            <i className="fa-solid fa-crown"></i> PRO AKTİF
                          </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2 rounded-xl text-center">
                          <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mb-0.5">Sunucu Durumu</div>
                          <div className="text-[13px] font-black text-emerald-400 flex items-center justify-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> ÇEVRİMİÇİ
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 2. KLİNİK CANLI VERİ METRİKLERİ */}
                      <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div onClick={() => setActiveTab("patients")} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-sm flex flex-col justify-center relative overflow-hidden group cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all">
                          <i className="fa-solid fa-hospital-user absolute -right-3 -bottom-3 text-5xl text-slate-100 dark:text-slate-700/50 group-hover:scale-110 group-hover:text-indigo-50 dark:group-hover:text-indigo-900/30 transition-transform duration-300"></i>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10 flex items-center gap-1">Toplam Hasta <i className="fa-solid fa-arrow-up-right-from-square text-[8px] opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500"></i></span>
                          <span className="text-2xl font-black text-slate-700 dark:text-slate-200 relative z-10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{totalPats}</span>
                        </div>
                        <div onClick={() => setActiveTab("doctors")} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-sm flex flex-col justify-center relative overflow-hidden group cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all">
                          <i className="fa-solid fa-user-doctor absolute -right-3 -bottom-3 text-5xl text-slate-100 dark:text-slate-700/50 group-hover:scale-110 group-hover:text-indigo-50 dark:group-hover:text-indigo-900/30 transition-transform duration-300"></i>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10 flex items-center gap-1">Kayıtlı Hekim <i className="fa-solid fa-arrow-up-right-from-square text-[8px] opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500"></i></span>
                          <span className="text-2xl font-black text-slate-700 dark:text-slate-200 relative z-10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{totalDocs}</span>
                        </div>
                        <div onClick={() => setSettingsTab("tedavi")} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-sm flex flex-col justify-center relative overflow-hidden group col-span-2 sm:col-span-1 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all">
                          <i className="fa-solid fa-list-check absolute -right-3 -bottom-3 text-5xl text-slate-100 dark:text-slate-700/50 group-hover:scale-110 group-hover:text-indigo-50 dark:group-hover:text-indigo-900/30 transition-transform duration-300"></i>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10 flex items-center gap-1">Klinik İşlem <i className="fa-solid fa-arrow-up-right-from-square text-[8px] opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500"></i></span>
                          <span className="text-2xl font-black text-slate-700 dark:text-slate-200 relative z-10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{totalTxs}</span>
                        </div>
                        
                        {/* Hızlı Erişim Paneli */}
                        <div className="col-span-2 sm:col-span-3 bg-indigo-50 dark:bg-slate-900 border border-indigo-100 dark:border-slate-700 p-3 rounded-xl mt-1">
                          <h4 className="text-[11px] font-black text-indigo-800 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><i className="fa-solid fa-bolt"></i> Hızlı Yönetim Kısayolları</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setSettingsTab("tedavi")} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-2 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center dark:bg-indigo-900/50 dark:text-indigo-400"><i className="fa-solid fa-tags"></i></div> Fiyatları Güncelle
                            </button>
                            <button onClick={() => setSettingsTab("yetki")} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-2 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center dark:bg-purple-900/50 dark:text-purple-400"><i className="fa-solid fa-user-shield"></i></div> Yetkileri Ayarla
                            </button>
                            <button onClick={() => setSettingsTab("calisma")} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-2 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-amber-100 text-amber-600 flex items-center justify-center dark:bg-amber-900/50 dark:text-amber-400"><i className="fa-solid fa-calendar-xmark"></i></div> Özel Gün Ekle
                            </button>
                            <button onClick={() => setSettingsTab("veri")} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-2 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center dark:bg-emerald-900/50 dark:text-emerald-400"><i className="fa-solid fa-file-excel"></i></div> Hastaları İndir
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 3. AKTİF MODÜLLER VE GÜVENLİK DURUMU */}
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm flex flex-col h-full">
                         <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-2 flex items-center justify-between">
                           <span>Aktif Modüller</span>
                           <i className="fa-solid fa-toggle-on text-emerald-500 text-sm"></i>
                         </h4>
                         <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar max-h-[160px]">
                           {activeModules.map((mod, i) => (
                              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50">
                                 <div className="flex items-center gap-2">
                                    <i className={`fa-brands ${mod.icon} ${mod.color}`}></i>
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{mod.name}</span>
                                 </div>
                                 {mod.status ? (
                                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded dark:bg-emerald-900/30 dark:text-emerald-400">AÇIK</span>
                                 ) : (
                                    <span className="text-[9px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded dark:bg-slate-700 dark:text-slate-400">KAPALI</span>
                                 )}
                              </div>
                           ))}
                         </div>
                         <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                           <button onClick={() => setSettingsTab("guvenlik")} className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600">
                             <i className="fa-solid fa-shield-halved text-rose-500"></i> Şifreleri ve Güvenliği Yönet
                           </button>
                         </div>
                      </div>
                    </div>
                  </div>
                  );
                })()}

                {currentSettingsTab === "klinik" && (
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

                {currentSettingsTab === "randevu" && (
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

                     {/* YENİ: BRANŞ VE TEDAVİ RENKLENDİRME MODÜLÜ */}
                     <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="font-black text-[13px] text-slate-800 dark:text-white flex items-center gap-1.5 mb-1">
                           <i className="fa-solid fa-palette text-pink-500"></i> Branş ve Tedavi Renkleri
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                           Randevu takviminde işlemlerin hangi renkte görüneceğini seçin. Renk kutusuna tıklayıp seçiminizi yaptıktan sonra <b>menüyü kapattığınız an</b> tüm sisteme otomatik olarak işlenecektir.
                        </p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                           {[
                              { key: "cerrahi", label: "Cerrahi & İmplant", default: "#a855f7" },
                              { key: "protez", label: "Protetik (Kron)", default: "#6366f1" },
                              { key: "endodonti", label: "Endodonti (Kanal)", default: "#f97316" },
                              { key: "dolgu", label: "Restoratif (Dolgu)", default: "#3b82f6" },
                              { key: "ortodonti", label: "Ortodonti (Tel)", default: "#ec4899" },
                              { key: "periodontoloji", label: "Perio (Diş Eti)", default: "#14b8a6" },
                              { key: "pedodonti", label: "Pedodonti (Çocuk)", default: "#f43f5e" },
                              { key: "muayene", label: "Muayene & Teşhis", default: "#8b5cf6" }
                           ].map((brans) => (
                              <div key={brans.key} className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1.5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                                 <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider truncate" title={brans.label}>{brans.label}</label>
                                 <div className="flex items-center gap-2.5">
                                    {/* MOUSE İLE SÜRÜKLERKEN VERİTABANINI ÇÖKERTMEMEK İÇİN ONBLUR KULLANILDI */}
                                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-600 shadow-inner flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
                                       <input 
                                          type="color" 
                                          defaultValue={settings?.randevu?.bransRenkleri?.[brans.key] || brans.default}
                                          onBlur={(e) => {
                                             const hexCode = e.target.value;
                                             const ownerId = typeof getClinicOwnerId === "function" ? getClinicOwnerId() : currentUser;
                                             const newSettings = JSON.parse(JSON.stringify(settings));
                                             
                                             if (!newSettings.randevu) newSettings.randevu = {};
                                             if (!newSettings.randevu.bransRenkleri) newSettings.randevu.bransRenkleri = {};
                                             
                                             // Renk değişmemişse veritabanını yorma
                                             if (newSettings.randevu.bransRenkleri[brans.key] === hexCode) return;

                                             newSettings.randevu.bransRenkleri[brans.key] = hexCode;
                                             
                                             // Anında UI güncellemesi
                                             setSettings(newSettings);
                                             localStorage.setItem(`klinikSettings_${ownerId}`, JSON.stringify(newSettings));
                                             
                                             // Buluta anında kaydet
                                             saveGlobalData({
                                               ...globalData,
                                               settingsDb: {
                                                 ...(globalData.settingsDb || {}),
                                                 [ownerId]: newSettings
                                               }
                                             }).then(() => showNotification(`${brans.label} rengi başarıyla güncellendi!`, "success"));
                                          }}
                                          className="absolute top-[-10px] left-[-10px] w-16 h-16 cursor-pointer"
                                          title="Renk Seçmek İçin Tıklayın"
                                       />
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                                       {settings?.randevu?.bransRenkleri?.[brans.key] || brans.default}
                                    </span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                )}

                {currentSettingsTab === "bildirim" && (
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

                {currentSettingsTab === "gorunum" && (
                  <div className="animate-pop max-w-4xl space-y-6">
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                       <h3 className="font-black text-slate-800 dark:text-white text-base">Görünüm ve Kişiselleştirme</h3>
                     </div>

                     {/* TEMA SEÇİMİ */}
                     <div className="space-y-3">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase"><i className="fa-solid fa-moon mr-1"></i> Aydınlık / Karanlık Tema</label>
                        <div className="flex flex-wrap gap-3">
                          {["Sistem", "Açık", "Koyu"].map(t => (
                            <button key={t} onClick={() => handleSettingChange('gorunum', 'tema', t)} className={`px-4 py-2 rounded-xl text-[12px] font-bold border-2 transition-all ${currentData.gorunum?.tema === t ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"}`}>
                              {t === "Sistem" ? <i className="fa-solid fa-desktop mr-1.5"></i> : t === "Açık" ? <i className="fa-regular fa-sun mr-1.5"></i> : <i className="fa-solid fa-moon mr-1.5"></i>}
                              {t}
                            </button>
                          ))}
                        </div>
                     </div>

                     {/* YENİ: KLİNİK MARKA RENGİ */}
                     <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase"><i className="fa-solid fa-palette mr-1"></i> Klinik Marka Rengi</label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Sistemin buton, takvim ve menü vurgu rengini kliniğinizin kurumsal rengine uyarlayın.</p>
                        <div className="flex flex-wrap gap-4">
                          {[
                            { id: "indigo", name: "İndigo", colorClass: "bg-indigo-500 shadow-indigo-500/30" },
                            { id: "emerald", name: "Zümrüt", colorClass: "bg-emerald-500 shadow-emerald-500/30" },
                            { id: "rose", name: "Yakut", colorClass: "bg-rose-500 shadow-rose-500/30" },
                            { id: "sky", name: "Okyanus", colorClass: "bg-sky-500 shadow-sky-500/30" },
                            { id: "slate", name: "Gece", colorClass: "bg-slate-700 shadow-slate-700/30" }
                          ].map(color => (
                            <button key={color.id} onClick={() => handleSettingChange('gorunum', 'renk', color.id)} className={`group relative flex flex-col items-center gap-1.5 transition-transform ${currentData.gorunum?.renk === color.id ? "scale-110" : "hover:scale-105 opacity-70 hover:opacity-100"}`}>
                               <div className={`w-8 h-8 rounded-full ${color.colorClass} shadow-lg ring-2 ring-offset-2 dark:ring-offset-slate-900 transition-all ${currentData.gorunum?.renk === color.id ? "ring-current" : "ring-transparent"}`}></div>
                               <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{color.name}</span>
                            </button>
                          ))}
                        </div>
                     </div>

                     {/* YENİ: ARAYÜZ YOĞUNLUĞU */}
                     <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase"><i className="fa-solid fa-table-cells-large mr-1"></i> Arayüz Yoğunluğu</label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Tabloların ve listelerin ekranda nasıl görüneceğini seçin.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { id: "kompakt", title: "Kompakt Mod", desc: "Dar ekranlar için sıkıştırılmış görünüm.", icon: "fa-compress" },
                            { id: "standart", title: "Standart Mod", desc: "Önerilen dengeli arayüz görünümü.", icon: "fa-equals" },
                            { id: "genis", title: "Rahat Mod", desc: "Geniş ekranlar için ferah görünüm.", icon: "fa-expand" }
                          ].map(mode => (
                            <div key={mode.id} onClick={() => handleSettingChange('gorunum', 'yogunluk', mode.id)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-1 ${currentData.gorunum?.yogunluk === mode.id ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-slate-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-slate-500"}`}>
                              <span className={`font-bold text-[12px] flex items-center gap-2 ${currentData.gorunum?.yogunluk === mode.id ? "text-indigo-700 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"}`}><i className={`fa-solid ${mode.icon}`}></i> {mode.title}</span>
                              <span className="text-[10px] text-slate-500">{mode.desc}</span>
                            </div>
                          ))}
                        </div>
                     </div>
                  </div>
                )}

                {currentSettingsTab === "guvenlik" && (
                  <div className="animate-pop max-w-4xl space-y-4">
                     <h3 className="font-black text-slate-800 dark:text-white text-base border-b border-slate-100 dark:border-slate-700 pb-2">Güvenlik ve Gizlilik</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                           <div>
                             <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Oturum Zaman Aşımı</label>
                             <select value={currentData.guvenlik.oturumZamanAsimi} onChange={e => handleSettingChange('guvenlik', 'oturumZamanAsimi', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold outline-none cursor-pointer dark:bg-slate-800 dark:text-white dark:border-slate-600">
                              <option value="1">⚡ 1 Dakika (Test İçin Hızlı)</option>
                              <option value="30">30 Dakika Hareketsizlikte Çıkış Yap</option>
                              <option value="120">2 Saat Hareketsizlikte Çıkış Yap</option>
                              <option value="480">8 Saat (Mesai Boyunca Açık Kal)</option>
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
                           <div className="text-[11px] font-bold text-slate-400 uppercase mb-2 flex items-center justify-between">
                             <span>Hesap E-Postası ve Şifre</span>
                             {globalData.userProfiles?.[currentUser]?.realEmail && !globalData.userProfiles?.[currentUser]?.realEmail.includes("@klinik.com") ? (
                                <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[9px]"><i className="fa-solid fa-check"></i> E-Posta Kayıtlı</span>
                             ) : (
                                <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[9px]"><i className="fa-solid fa-triangle-exclamation"></i> E-Posta Eksik</span>
                             )}
                           </div>
                           <div className="text-[11px] text-slate-500 mb-3">
                             <div className="mb-1 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <i className="fa-solid fa-envelope text-indigo-500"></i>
                                {globalData.userProfiles?.[currentUser]?.realEmail && !globalData.userProfiles?.[currentUser]?.realEmail.includes("@klinik.com") 
                                  ? globalData.userProfiles[currentUser].realEmail 
                                  : "Belirtilmemiş (Lütfen Ekleyin)"}
                             </div>
                             Uygulamaya giriş şifrenizi veya şifre sıfırlama (kurtarma) e-postanızı buradan ekleyebilir ve güncelleyebilirsiniz.
                           </div>
                           <button onClick={() => {
                              const profile = globalData.userProfiles?.[currentUser] || {};
                              const currentMail = profile.realEmail && !profile.realEmail.includes("@klinik.com") ? profile.realEmail : "";
                              setPasswordForm({ oldPass: "", newPass: "", confirmPass: "", email: currentMail });
                              setIsPasswordModalOpen(true);
                           }} className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-[12px] font-bold hover:bg-slate-800 transition shadow-sm dark:bg-indigo-600 dark:hover:bg-indigo-500">
                             <i className="fa-solid fa-user-shield mr-1.5"></i> E-Posta ve Şifreyi Yönet
                           </button>
                        </div>

                        {/* YENİ: Özel Finans Şifresi Paneli - SADECE PATRON GÖREBİLİR */}
                        {isOwner && (
                          <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col justify-center col-span-1 md:col-span-2 mt-2">
                             <div className="text-[11px] font-bold text-slate-400 uppercase mb-2 flex items-center justify-between">
                               <span>Finansal Bilgi Şifresi</span>
                               <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[9px]"><i className="fa-solid fa-lock"></i> 4 Haneli PIN</span>
                             </div>
                             <div className="text-[11px] text-slate-500 mb-3">
                               <div className="mb-1 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <i className="fa-solid fa-eye-slash text-rose-500"></i>
                                  Finansal Gizlilik Kilidi
                               </div>
                               Uygulama açıldığında finansal bilgiler gizli başlar. Göz ikonuna tıklandığında istenecek 4 haneli bağımsız PIN kodunu buradan değiştirebilirsiniz. (Varsayılan PIN: 0000)
                             </div>
                             <button onClick={() => {
                                setPinChangeForm({ oldPin: "", newPin: "", confirmPin: "" });
                                setIsPinChangeModalOpen(true);
                             }} className="w-full bg-rose-50 text-rose-600 border border-rose-200 py-2.5 rounded-xl text-[12px] font-bold hover:bg-rose-500 hover:text-white transition shadow-sm dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-600">
                               <i className="fa-solid fa-eye-slash mr-1.5"></i> Finans Şifresini Yönet
                             </button>
                          </div>
                        )}
                     </div>

                     {/* YENİ: HESABIMI SİL TEHLİKELİ ALANI (TÜM KULLANICILAR İÇİN) */}
                     <div className="mt-8 border-2 border-rose-200 dark:border-rose-900/50 rounded-xl overflow-hidden shadow-sm relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_10px,transparent_10px,transparent_20px)] opacity-50"></div>
                        <div className="bg-rose-50/50 dark:bg-rose-900/10 p-5 pt-6">
                           <h4 className="font-black text-rose-600 dark:text-rose-500 text-[14px] flex items-center gap-2 mb-2">
                             <i className="fa-solid fa-user-xmark"></i> HESABIMI KALICI OLARAK SİL
                           </h4>
                           <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-semibold mb-4">
                             Bu işlem hesabınızı sistemden tamamen kaldırır. Kullanıcı adınız boşa çıkar. Geçmiş randevu ve hasta kayıtlarınız klinikte korunmaya devam eder.
                           </p>
                           
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-rose-100 dark:border-rose-900/30">
                             <div>
                               <span className="block font-bold text-[12px] text-slate-800 dark:text-slate-200">Kendi Hesabımı Sil</span>
                               <span className="block text-[10px] text-slate-500">Bu işlem geri alınamaz ve anında çıkış yapılır.</span>
                             </div>
                             <button type="button" onClick={() => {
                                showPromptConfirm(
                                  "Hesabımı Kalıcı Olarak Sil",
                                  "DİKKAT! Bu işlem sonucunda hesabınız sistemden tamamen silinecektir.\n\nGeçmişte oluşturduğunuz randevular ve hasta kayıtları sistemde (klinikte) kalmaya devam edecektir.\n\nOnaylamak için aşağıdaki kutucuğa SİL yazın:",
                                  "SİL",
                                  () => {
                                     const updatedSystemUsers = JSON.parse(JSON.stringify(globalData.systemUsers || {}));
                                     delete updatedSystemUsers[currentUser];

                                     saveGlobalData({
                                        ...globalData,
                                        systemUsers: updatedSystemUsers
                                     }).then(() => {
                                        setIsLoggingOut(true);
                                        setTimeout(async () => {
                                           if(auth) await signOut(auth);
                                           window.location.reload();
                                        }, 1500);
                                     });
                                  }
                                );
                             }} className="shrink-0 px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-[11px] font-black transition-colors shadow-md flex items-center gap-1.5">
                               <i className="fa-solid fa-trash"></i> Hesabımı Sil
                             </button>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {currentSettingsTab === "calisma" && (
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
                                 const rawDate = el.value; // Her zaman YYYY-MM-DD olarak kalır
                                  const guncelAyarlar = settingsDraft || settings;
                                  const mevcutOzel = guncelAyarlar?.calisma?.ozelGunler || [];
                                  
                                  // Aynı tarih daha önce eklendiyse engelle
                                  if(mevcutOzel.some(og => og.tarih === rawDate)){
                                    showNotification("Bu tarih zaten ekli!", "error");
                                    return;
                                  }

                                  const yeniOzel = [...mevcutOzel, { tarih: rawDate, durum: "Kapalı" }];
                                  handleSettingChange('calisma', 'ozelGunler', yeniOzel);
                                  el.value = "";
                                  
                                  // Sadece ekrana bildirim basarken Türkçeye çevir
                                  const displayDate = rawDate.split('-').reverse().join('.');
                                  showNotification(`${displayDate} tarihi kapalı olarak eklendi`, "success");
                               }} className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-amber-600 shadow-sm transition-colors">Ekle</button>
                             </div>
                          </div>
                          
                          <div className="space-y-1.5">
                             {(currentData.calisma.ozelGunler || []).length > 0 ? (
                               (currentData.calisma.ozelGunler || []).map((og, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-amber-100 dark:border-amber-800/50 shadow-sm">
                                    <span className="text-[12px] font-bold dark:text-white">
                                      <i className="fa-regular fa-calendar mr-1 text-slate-400"></i> 
                                      {og.tarih.includes('-') ? og.tarih.split('-').reverse().join('.') : og.tarih}
                                    </span>
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

                {currentSettingsTab === "tedavi" && (() => {
                  const ownerId = (currentUserProfile?.role === "assistant" || currentUserProfile?.role === "doctor") ? currentUserProfile.createdBy : currentUser;
                  const basePricing = globalData.pricingDb?.[ownerId] || (typeof globalData.pricingDb === "object" && globalData.pricingDb["Genel Muayene"] ? globalData.pricingDb : DEFAULT_PRICING);
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
                               <tr key={tx} className="border-b last:border-0 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition group">
                                 <td className="p-2.5 font-bold text-slate-800 dark:text-white">{tx}</td>
                                 <td className="p-2.5 text-slate-500"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 shadow-sm text-[10px] font-bold">Klinik İşlem</span></td>
                                 <td className="p-2.5">
                                   <div className="flex items-center gap-1.5">
                                      <input 
                                        type="number" 
                                        value={userPricing[tx] === 0 ? 0 : (userPricing[tx] || "")} 
                                        onChange={(e) => {
                                          setPricingEditValues(prev => ({ ...prev, [tx]: parseFloat(e.target.value) || 0 }));
                                          if(!settingsDraft) setSettingsDraft(settings);
                                        }}
                                        className="w-20 p-1.5 bg-white border border-slate-200 rounded-lg text-[13px] font-black text-indigo-600 outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-indigo-400 dark:border-slate-600 transition-colors shadow-sm"
                                      />
                                      <span className="text-[11px] font-black text-slate-400">₺</span>
                                   </div>
                                 </td>
                                 <td className="p-2.5 flex items-center justify-center gap-2">
                                    <button onClick={() => {
                                        // 🔟 GERÇEK SİSTEM BAĞLANTISI: TEDAVİ SİLME MANTIĞI VE KULLANIM KONTROLÜ
                                        let usageCount = 0;
                                        
                                        // 1. Tüm randevularda kullanılmış mı tara
                                        if (globalData.appointments) {
                                           Object.values(globalData.appointments).forEach(docApts => {
                                              Object.values(docApts).forEach(apt => {
                                                 if(apt.treatment && apt.treatment.includes(tx)) usageCount++;
                                              });
                                           });
                                        }
                                        // 2. Hasta planlarında ve epikrizlerinde kullanılmış mı tara
                                        if (globalData.patientsDb) {
                                           Object.values(globalData.patientsDb).forEach(p => {
                                              if (p.plannedTreatments) {
                                                 p.plannedTreatments.forEach(ptx => { if(ptx.treatment === tx) usageCount++; });
                                              }
                                              if (p.clinicalHistory) {
                                                 p.clinicalHistory.forEach(h => { if(h.treatment && h.treatment.includes(tx)) usageCount++; });
                                              }
                                           });
                                        }

                                        const confirmMsg = usageCount > 0 
                                           ? `⚠️ DİKKAT: "${tx}" işlemi geçmişteki ${usageCount} farklı kayıtta (randevu/plan/epikriz) kullanılmış!\n\nBu işlemi listeden silerseniz (pasife alırsanız) geçmiş kayıtlar BOZULMAZ, sadece yeni listelerde çıkmaz.\n\nPasife almak istediğinize emin misiniz?`
                                           : `"${tx}" işlemini tamamen silmek istediğinize emin misiniz? (Listelerden kalkacaktır.)`;

                                        showConfirm(confirmMsg, () => {
                                           const ownerId = (currentUserProfile?.role === "assistant" || currentUserProfile?.role === "doctor") ? currentUserProfile.createdBy : currentUser;
                                           
                                           let legacyPricing = null;
                                           if (globalData.pricingDb && globalData.pricingDb["Genel Muayene"] !== undefined) legacyPricing = globalData.pricingDb;
                                           
                                           const currentPrices = globalData.pricingDb?.[ownerId] || legacyPricing || DEFAULT_PRICING;
                                           const newPrices = { ...currentPrices };
                                           delete newPrices[tx]; 
                                           
                                           let existingCustomDb = globalData.customTreatments || {};
                                           if (Array.isArray(existingCustomDb)) existingCustomDb = {};
                                           const userCustomTreatments = (existingCustomDb[ownerId] || []).filter(t => t.name !== tx);
                                           const updatedCustomTreatmentsDb = { ...existingCustomDb, [ownerId]: userCustomTreatments };

                                           const newEdits = { ...pricingEditValues };
                                           delete newEdits[tx];
                                           setPricingEditValues(newEdits);

                                           let finalPricingDb = { ...(globalData.pricingDb || {}) };
                                           if (finalPricingDb["Genel Muayene"] !== undefined) finalPricingDb = {};
                                           finalPricingDb[ownerId] = newPrices;

                                           saveGlobalData({
                                              ...globalData,
                                              pricingDb: finalPricingDb,
                                              customTreatments: updatedCustomTreatmentsDb
                                           }).then(() => showNotification(usageCount > 0 ? "İşlem pasife alındı. Eski kayıtlar güvenle korundu." : "İşlem kalıcı olarak silindi.", "success"));
                                        });
                                      }} className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center transition opacity-0 group-hover:opacity-100 focus:opacity-100">
                                        <i className="fa-solid fa-trash-can text-[11px]"></i>
                                      </button>
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
                  );
                })()}

                {currentSettingsTab === "belge" && (
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
                              </div>
                            </div>
                            <button className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition flex items-center justify-center"><i className="fa-solid fa-print text-[11px]"></i></button>
                         </div>
                       ))}
                     </div>
                  </div>
                )}

                {currentSettingsTab === "dosya" && (() => {
                  const DOSYA_KLASORLERI = [
                     { id: "acil", isim: "Acil Takip", icon: "fa-truck-medical", color: "bg-rose-600" },
                     { id: "takip", isim: "İptal & Takip Havuzu", icon: "fa-layer-group", color: "bg-amber-600" },
                     { id: "kontrol", isim: "Kontrol Bekleyenler", icon: "fa-calendar-check", color: "bg-emerald-500" },
                     { id: "tedavi", isim: "Tedavisi Devam Edenler", icon: "fa-tooth", color: "bg-blue-500" },
                     { id: "lab", isim: "Laboratuvar Bekleyenler", icon: "fa-flask", color: "bg-purple-500" },
                     { id: "evrak", isim: "Evrak Bekleyenler", icon: "fa-file-signature", color: "bg-slate-500" },
                     { id: "yeni", isim: "Yeni Hastalar", icon: "fa-user-plus", color: "bg-teal-500" }
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

                {currentSettingsTab === "otomasyon" && (
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

                {currentSettingsTab === "veri" && (
                  <div className="animate-pop max-w-4xl space-y-6">
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                       <h3 className="font-black text-slate-800 dark:text-white text-base">Veri Yönetimi ve Yedekleme</h3>
                     </div>

                     <p className="text-[11px] text-slate-500 dark:text-slate-400">Bulut depolama durumunuzu kontrol edebilir ve dışa aktarım yapabilirsiniz.</p>

                     {/* Bulut Kota Göstergesi */}
                     <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300"><i className="fa-solid fa-cloud mr-1 text-indigo-500"></i> Firebase Bulut Kotası</span>
                          <span className="text-[10px] font-black text-slate-500">Kullanılan: {Object.keys(globalData.patientsDb?.[currentUser] || {}).length + Object.keys(globalData.appointments?.[currentUser] || {}).length} Kayıt</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                           <div className="bg-indigo-500 h-full rounded-full" style={{ width: "2%" }}></div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 text-right">Maksimum sınırın %2'si kullanılıyor (Güvenli Seviye)</p>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 flex flex-col gap-3 items-start shadow-sm">
                         <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg dark:bg-emerald-900/30 dark:text-emerald-400"><i className="fa-solid fa-file-excel"></i></div>
                         <div>
                           <h4 className="font-bold text-[13px] text-slate-800 dark:text-white">Hastaları Dışa Aktar</h4>
                           <p className="text-[11px] text-slate-500 mt-0.5">Tüm hasta listenizi Excel (CSV) formatında cihazınıza indirin.</p>
                         </div>
                         <button onClick={() => {
    // 1. Hastaları bul
    const myPats = Object.values(globalData.patientsDb || {}).filter(p => {
          if (p.isDeleted) return false;
          if (currentUserProfile?.role === "assistant") {
              return (currentUserProfile.assignedDoctors || []).includes(p.addedBy) && resolveClinicId(p.addedBy) === currentClinicId;
          }
          return resolveClinicId(p.addedBy) === currentClinicId;
      });
    if(myPats.length === 0) return showNotification("Dışa aktarılacak hasta bulunamadı.", "error");
    
    // 2. Türkçe Excel Uyumlu CSV Oluştur
    let csv = "ID;Ad Soyad;Telefon;TC Kimlik;Durum\n";
    myPats.forEach(p => {
       csv += `${p.id};"${p.name}";"${p.phone || "-"}";"${p.tc || "-"}";"${p.lastStatus || "Yeni Kayıt"}"\n`;
    });
    
    // 3. Dosyayı indir
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' }); // \uFEFF Türkçe karakterleri korur
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Hastalar_${currentData.klinik?.ad || "Klinik"}.csv`;
    link.click();
    showNotification("Hasta listeniz Excel dosyası olarak indirildi.", "success");
}} className="mt-auto px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-600 transition shadow-sm">İndir (CSV)</button>
                       </div>
                     </div>

{/* 9️⃣ GERÇEK SİSTEM BAĞLANTISI: VERİ BÜTÜNLÜĞÜ VE OTOMATİK ONARIM */}
                     <div className="mt-6 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                        <div className="flex justify-between items-center mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">
                           <div>
                              <h4 className="font-bold text-[13px] text-slate-800 dark:text-white"><i className="fa-solid fa-stethoscope text-indigo-500 mr-1"></i> Veri Bütünlüğü ve Sistem Check-up</h4>
                              <p className="text-[10px] text-slate-500 mt-0.5">Kayıp bağlantıları (silinmiş hastalara ait askıda kalan randevular vb.) tarar ve tek tıkla onarır.</p>
                           </div>
                           <button onClick={() => {
                              setIsCheckingData(true);
                              setIntegrityReport(null);
                              
                              setTimeout(() => {
                                 const ownerId = typeof getClinicOwnerId === "function" ? getClinicOwnerId() : currentUser;
                                 let pCount = 0, aCount = 0, txCount = Object.keys(globalData.pricingDb?.[ownerId] || {}).length;
                                 let errors = [];
                                 let fixableItems = { orphanedApts: [], invalidPats: [] };
                                 
                                 // HASTALARI TARA (Sadece bu kliniğe ait olanları alıyoruz)
                                 const myPats = Object.values(globalData.patientsDb || {}).filter(p => resolveClinicId(p.addedBy) === currentClinicId && !p.isDeleted);
                                 pCount = myPats.length;
                                 
                                 myPats.forEach(p => {
                                    if(!p.name || p.name.trim() === "") {
                                        errors.push(`ID: ${p.id} - İsimsiz bozuk hasta kaydı tespit edildi.`);
                                        fixableItems.invalidPats.push(p.id);
                                    }
                                 });

                                 // RANDEVULARI TARA (Bu kliniğe ait doktorların randevuları)
                                 if(globalData.appointments) {
                                    Object.entries(globalData.appointments).forEach(([docId, docApts]) => {
                                       if(resolveClinicId(docId) === currentClinicId) {
                                          if (docApts && typeof docApts === 'object') {
                                              Object.entries(docApts).forEach(([aptKey, apt]) => {
                                                 if (!apt) return; // Boş/silinmiş kaydı atla
                                                 aCount++;
                                                 
                                                 if(!apt.patientName) {
                                                     errors.push(`Randevu (${aptKey}) - Hasta adı eksik (Askıda kalmış).`);
                                                     fixableItems.orphanedApts.push({ docId, aptKey });
                                                 } else {
                                                     // Hem ID ile hem isimle eşleşme kontrolü yap
                                                     const pMatch = myPats.find(p => p.id === apt.patientId || p.name === apt.patientName);
                                                     if(!pMatch) {
                                                         errors.push(`Randevu (${aptKey}) - "${apt.patientName}" hastasının dosyası silinmiş. Bu randevu askıda.`);
                                                         fixableItems.orphanedApts.push({ docId, aptKey });
                                                     }
                                                 }
                                              });
                                          }
                                       }
                                    });
                                 }

                                 setIntegrityReport({ pCount, aCount, txCount, errors, fixableItems });
                                 setIsCheckingData(false);
                              }, 800);

                           }} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-indigo-200 transition dark:bg-indigo-900/40 dark:text-indigo-400 shrink-0 shadow-sm">
                              {isCheckingData ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i> Taranıyor</> : <><i className="fa-solid fa-play mr-1"></i> Check-up Başlat</>}
                           </button>
                        </div>

                        {integrityReport && (
                           <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 animate-pop">
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                 <div className="text-center p-2 bg-emerald-50 text-emerald-700 rounded-lg dark:bg-emerald-900/20 dark:text-emerald-400 font-bold text-[11px] shadow-sm"><i className="fa-solid fa-check mr-1"></i> {integrityReport.pCount} Hasta</div>
                                 <div className="text-center p-2 bg-emerald-50 text-emerald-700 rounded-lg dark:bg-emerald-900/20 dark:text-emerald-400 font-bold text-[11px] shadow-sm"><i className="fa-solid fa-check mr-1"></i> {integrityReport.aCount} Randevu</div>
                                 <div className="text-center p-2 bg-emerald-50 text-emerald-700 rounded-lg dark:bg-emerald-900/20 dark:text-emerald-400 font-bold text-[11px] shadow-sm"><i className="fa-solid fa-check mr-1"></i> {integrityReport.txCount} Tedavi</div>
                              </div>
                              {integrityReport.errors.length > 0 ? (
                                 <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex flex-col gap-2">
                                    <div className="flex justify-between items-center border-b border-amber-200 dark:border-amber-800/50 pb-2">
                                        <h5 className="text-[11px] font-black text-amber-700 dark:text-amber-500 uppercase">⚠️ Bulunan Uyumsuzluklar ({integrityReport.errors.length})</h5>
                                        <button 
                                            onClick={() => {
                                                showConfirm("Bulunan hatalı/askıda kalmış randevular ve geçersiz kayıtlar kalıcı olarak temizlenecektir. Onaylıyor musunuz?", () => {
                                                    const { orphanedApts, invalidPats } = integrityReport.fixableItems;
                                                    let updatedAppointments = JSON.parse(JSON.stringify(globalData.appointments || {}));
                                                    let updatedPatients = { ...(globalData.patientsDb || {}) };
                                                    let isChanged = false;

                                                    orphanedApts.forEach(({ docId, aptKey }) => {
                                                        if (updatedAppointments[docId] && updatedAppointments[docId][aptKey]) {
                                                            delete updatedAppointments[docId][aptKey];
                                                            isChanged = true;
                                                        }
                                                    });

                                                    invalidPats.forEach(pId => {
                                                        if (updatedPatients[pId]) {
                                                            delete updatedPatients[pId];
                                                            isChanged = true;
                                                        }
                                                    });

                                                    if (isChanged) {
                                                        saveGlobalData({
                                                            ...globalData,
                                                            appointments: updatedAppointments,
                                                            patientsDb: updatedPatients
                                                        }).then(() => {
                                                            showNotification("Veritabanı başarıyla temizlendi ve onarıldı.", "success");
                                                            setIntegrityReport(null);
                                                        });
                                                    } else {
                                                        showNotification("Temizlenecek veri bulunamadı.", "error");
                                                    }
                                                });
                                            }}
                                            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition shadow-md"
                                        >
                                            <i className="fa-solid fa-wrench mr-1"></i> Sorunları Otomatik Onar
                                        </button>
                                    </div>
                                    <ul className="list-disc pl-4 space-y-1 max-h-32 overflow-y-auto custom-scrollbar pt-1">
                                       {integrityReport.errors.map((err, i) => (
                                          <li key={i} className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold">{err}</li>
                                       ))}
                                    </ul>
                                 </div>
                              ) : (
                                 <div className="text-center text-[12px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                                    Tebrikler! Veritabanınızda hiçbir mantık veya bağlantı hatası bulunmadı.
                                 </div>
                              )}
                           </div>
                        )}
                     </div>
                     {/* YENİ: DANGER ZONE (TEHLİKELİ ALAN) */}
                     <div className="mt-8 border-2 border-rose-200 dark:border-rose-900/50 rounded-xl overflow-hidden shadow-sm relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_10px,transparent_10px,transparent_20px)] opacity-50"></div>
                        <div className="bg-rose-50/50 dark:bg-rose-900/10 p-5 pt-6">
                           <h4 className="font-black text-rose-600 dark:text-rose-500 text-[14px] flex items-center gap-2 mb-2">
                             <i className="fa-solid fa-triangle-exclamation"></i> TEHLİKELİ ALAN (DANGER ZONE)
                           </h4>
                           <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-semibold mb-5">
                             Aşağıdaki işlemler geri alınamaz. Verileriniz Firebase bulut sunucusundan kalıcı olarak silinir.
                           </p>

                           <div className="space-y-3">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-rose-100 dark:border-rose-900/30">
                               <div>
                                 <span className="block font-bold text-[12px] text-slate-800 dark:text-slate-200">Randevuları Temizle</span>
                                 <span className="block text-[10px] text-slate-500">Hasta dosyaları kalır, sadece geçmiş ve gelecek tüm randevular silinir.</span>
                               </div>
                               <button type="button" onClick={() => {
                                 showPromptConfirm(
                                   "Randevuları Temizle",
                                   "DİKKAT! Sadece size ait olan tüm geçmiş ve gelecek randevular silinecektir. (Hasta dosyalarınız silinmez).\n\nBu işlem GERİ ALINAMAZ!",
                                   currentData.klinik?.ad || "Klinik",
                                   () => {
                                      saveGlobalData({
                                        ...globalData,
                                        appointments: { ...(globalData.appointments || {}), [currentUser]: {} }
                                      }).then(() => {
                                          showNotification("Tüm randevular kalıcı olarak silindi.", "success");
                                          setTimeout(() => window.location.reload(), 1200); 
                                      });
                                   }
                                 );
                               }} className="shrink-0 px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg text-[11px] font-bold transition-colors dark:bg-rose-900/40 dark:text-rose-400">Randevuları Sil</button>
                             </div>

                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-rose-100 dark:border-rose-900/30">
                               <div>
                                 <span className="block font-bold text-[12px] text-slate-800 dark:text-slate-200">Tüm Verilerimi Temizle</span>
                                 <span className="block text-[10px] text-slate-500">Sistemdeki tüm kayıtlarınız kalıcı olarak silinir ve varsayılan ayarlara dönülür.</span>
                               </div>
                               <button type="button" onClick={() => {
                                 const userPassword = globalData.usersDb?.[currentUser];
                                 
                                 showPasswordConfirm(
                                   "Tüm Verilerimi Temizle",
                                   "DİKKAT! BU İŞLEM GERİ ALINAMAZ!\n\nSize ait hastalar, randevular, epikrizler, özel tedaviler ve ayarlar dahil HER ŞEY kalıcı olarak silinecektir.\n\nDevam etmek için mevcut hesap şifrenizi girmelisiniz.",
                                   userPassword,
                                   () => {
                                      // 1. Orijinal veriyi bozmadan TAM (Deep) kopya oluştur
                                      const newPatientsDb = { ...(globalData.patientsDb || {}) };
                                      Object.keys(newPatientsDb).forEach(k => {
                                        if(newPatientsDb[k].addedBy === currentUser) {
                                           delete newPatientsDb[k];
                                        }
                                      });
                                      
                                      const newPricingDb = { ...(globalData.pricingDb || {}) };
                                      delete newPricingDb[currentUser];
                                      
                                      let newCustomTreatments = globalData.customTreatments || {};
                                      if (!Array.isArray(newCustomTreatments)) {
                                         newCustomTreatments = { ...newCustomTreatments };
                                         delete newCustomTreatments[currentUser];
                                      }
                                      
                                      const newSettingsDb = { ...(globalData.settingsDb || {}) };
                                      newSettingsDb[currentUser] = DEFAULT_SETTINGS;
                                      
                                      const newAppointments = { ...(globalData.appointments || {}) };
                                      newAppointments[currentUser] = {};

                                      // 2. Kopyalanmış ve temizlenmiş yepyeni veriyi Firebase'e gönder
                                      saveGlobalData({
                                        ...globalData,
                                        appointments: newAppointments,
                                        patientsDb: newPatientsDb,
                                        pricingDb: newPricingDb,
                                        customTreatments: newCustomTreatments,
                                        settingsDb: newSettingsDb
                                      }).then(() => {
                                        // 3. Yerel hafızadaki ayarları da sil ki sayfa yenilenince eski renkler/logo gelmesin
                                        localStorage.removeItem(`klinikSettings_${currentUser}`);
                                        
                                        showNotification("Kendi verileriniz başarıyla fabrika ayarlarına döndürüldü.", "success");
                                        setTimeout(() => window.location.reload(), 1500);
                                      });
                                   }
                                 );
                               }} className="shrink-0 px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-[11px] font-bold transition-colors shadow-sm">Sistemi Sıfırla</button>
                            </div>
                          </div>
                       </div>
                    </div>
                </div>
              )}

              {/* --- YENİ MODÜL 1: DİNAMİK YETKİ MATRİSİ --- */}
              {currentSettingsTab === "yetki" && (
                <div className="animate-pop max-w-5xl space-y-4">
                   <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                     <h3 className="font-black text-slate-800 dark:text-white text-base"><i className="fa-solid fa-user-shield text-indigo-500 mr-1.5"></i> Gelişmiş Yetki Matrisi (RBAC)</h3>
                   </div>
                   <p className="text-[11px] text-slate-500 dark:text-slate-400">Klinik Sahibi her şeye tam yetkilidir. Diğer rollerin ("Hekim", "Başasistan", "Asistan") sistem içinde neleri yapabileceğini buradan piksel piksel belirleyebilirsiniz.</p>
                   
                   <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm custom-scrollbar">
                     <table className="w-full text-left text-[12px] min-w-[700px]">
                       <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                         <tr>
                           <th className="p-3 font-black uppercase tracking-wider">Sistem İzinleri</th>
                           <th className="p-3 text-center border-l border-slate-200 dark:border-slate-700 font-black text-indigo-600 dark:text-indigo-400"><i className="fa-solid fa-user-doctor block mb-1 text-base"></i> Hekim</th>
                           <th className="p-3 text-center border-l border-slate-200 dark:border-slate-700 font-black text-purple-600 dark:text-purple-400"><i className="fa-solid fa-user-tie block mb-1 text-base"></i> Başasistan</th>
                           <th className="p-3 text-center border-l border-slate-200 dark:border-slate-700 font-black text-emerald-600 dark:text-emerald-400"><i className="fa-solid fa-headset block mb-1 text-base"></i> Asistan</th>
                         </tr>
                       </thead>
                       <tbody>
                         {[
                            { cat: "Hasta Yönetimi", perms: [{id: "patients_view", name: "Hastaları ve Verileri Görme"}, {id: "patients_create", name: "Yeni Hasta Ekleme"}, {id: "patients_edit", name: "Hasta Bilgilerini Düzenleme"}, {id: "patients_delete", name: "Hasta Kaydı Silme", danger: true}] },
                            { cat: "Randevu & Takvim", perms: [{id: "appointments_view", name: "Takvimi Görme"}, {id: "appointments_create", name: "Randevu Verme"}, {id: "appointments_delete", name: "Randevu Silme / İptal Etme"}, {id: "treatments_manage", name: "Fiyat Listesini Değiştirme"}] },
                            { cat: "Finans & Bilanço", perms: [{id: "finance_view", name: "Bilanço ve Ciroları Görme"}, {id: "finance_payment", name: "Tahsilat Ekleme"}, {id: "finance_discount", name: "Toplu İndirim Uygulama", danger: true}] },
                            { cat: "Klinik Ayarları", perms: [{id: "users_view", name: "Klinik Ekibini Görme/Yönetme"}, {id: "doctors_view", name: "Hekim Yönetimine Erişim"}] },
                            { cat: "Sistem", perms: [{id: "settings_view", name: "Klinik Ayarlarına Erişim"}] }
                          ].map((group, gIdx) => (
                           <React.Fragment key={gIdx}>
                             <tr className="bg-slate-100 dark:bg-slate-800/80"><td colSpan="4" className="p-2 font-black text-[10px] text-slate-400 uppercase tracking-widest pl-4">{group.cat}</td></tr>
                             {group.perms.map((p) => (
                               <tr key={p.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                                 <td className={`p-3 font-bold flex items-center gap-1.5 ${p.danger ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                   {p.danger && <i className="fa-solid fa-triangle-exclamation"></i>} {p.name}
                                 </td>
                                 {["doctor", "head_assistant", "assistant"].map(role => {
                                    const isChecked = currentData.yetkiler?.[role]?.[p.id] ?? ROLE_PERMISSIONS[role]?.[p.id] ?? false;
                                    return (
                                      <td key={role} className="p-3 text-center border-l border-slate-100 dark:border-slate-700/50">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                          <input type="checkbox" className="sr-only peer" checked={isChecked} onChange={(e) => {
                                             const isVal = e.target.checked;
                                             const ownerId = getClinicOwnerId();
                                             
                                             const updatedSettings = JSON.parse(JSON.stringify(settings));
                                             if (!updatedSettings.yetkiler) updatedSettings.yetkiler = {};
                                             if (!updatedSettings.yetkiler[role]) updatedSettings.yetkiler[role] = { ...(ROLE_PERMISSIONS[role] || {}) };
                                             
                                             updatedSettings.yetkiler[role][p.id] = isVal;
                                             if (!updatedSettings.meta) updatedSettings.meta = {};
                                             updatedSettings.meta.lastSavedAt = Date.now();

                                             // 1. Yerel State ve LocalStorage'ı anında güncelle
                                             setSettings(updatedSettings);
                                             if (settingsDraft) {
                                               setSettingsDraft(prev => ({
                                                 ...prev,
                                                 yetkiler: { ...(prev?.yetkiler || {}), [role]: { ...(prev?.yetkiler?.[role] || {}), [p.id]: isVal } }
                                               }));
                                             }
                                             localStorage.setItem(`klinikSettings_${ownerId}`, JSON.stringify(updatedSettings));

                                             // 2. Firebase'e doğrudan kaydet
                                             const updatedSettingsDb = {
                                               ...(globalData.settingsDb || {}),
                                               [ownerId]: updatedSettings
                                             };

                                             saveGlobalData({ ...globalData, settingsDb: updatedSettingsDb })
                                               .then(() => {
                                                 showNotification(`${role.toUpperCase()} için yetki güncellendi.`, "success");
                                               })
                                               .catch(() => {
                                                 showNotification("Yetki kaydedilirken hata oluştu!", "error");
                                               });
                                          }} />
                                          <div className="w-9 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                                        </label>
                                      </td>
                                    )
                                 })}
                               </tr>
                             ))}
                           </React.Fragment>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}


            </div> {/* Bu div "İçerik Alanı"nın (flex-1 bg-white...) ana kapanışıdır */}

            {/* SABİT KAYDETME ÇUBUĞU (DEĞİŞİKLİK VARSA ÇIKAR) */}
              {settingsDraft && JSON.stringify(settings) !== JSON.stringify(settingsDraft) && (
                <div className="fixed bottom-24 sm:bottom-8 left-0 right-0 mx-auto w-[92%] sm:w-max bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-3.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-row items-center justify-between gap-4 animate-[modalPop_0.3s_ease-out_forwards] z-[9999] border border-white/10">
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
                <div id="document-print-area" className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 print:absolute print:inset-0 print:bg-white print:p-0 print:block">
                  <style type="text/css" media="print">
                    {`
                      html, body, #root, .h-screen, .overflow-hidden { height: auto !important; min-height: auto !important; max-height: none !important; overflow: visible !important; display: block !important; position: static !important; }
                      body * { visibility: hidden; }
                      #document-print-area, #document-print-area * { visibility: visible; }
                      #document-print-area { position: absolute !important; left: 0 !important; top: 0 !important; right: auto !important; bottom: auto !important; width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; display: block !important; }
                      #document-print-area > div { position: static !important; width: 100% !important; max-width: 100% !important; max-height: none !important; height: auto !important; overflow: visible !important; display: block !important; box-shadow: none !important; }
                      .no-print { display: none !important; }
                    `}
                  </style>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col relative shadow-2xl print:max-h-none print:overflow-visible print:shadow-none print:w-full print:rounded-none">
                    
                    {/* Üst Menü (Sadece Ekranda Görünür, Yazdırmada Gizlenir) */}
                    <div className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3.5 flex justify-between items-center z-10 no-print rounded-t-2xl">
                      <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                        <i className={`fa-solid ${documentPreview.icon} text-indigo-500`}></i> 
                        {documentPreview.title}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const originalTitle = document.title;
                            document.title = documentPreview.title;
                            window.print();
                            setTimeout(() => {
                              document.title = originalTitle;
                            }, 2000);
                          }}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition shadow-md flex items-center gap-1.5"
                        >
                          <i className="fa-solid fa-print"></i> Yazdır (A4)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocumentPreview(null)}
                          className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition"
                        >
                          <i className="fa-solid fa-xmark text-sm"></i>
                        </button>
                      </div>
                    </div>

                    {/* A4 Resmi Evrak Alanı */}
                    <div className="p-8 sm:p-12 bg-white text-black print:p-0 print:m-0 w-full" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                      {/* Klinik Anteti */}
                      <div className="border-b-2 border-black pb-4 mb-6 text-center">
                        <h1 className="text-2xl font-black uppercase tracking-wider mb-1 flex items-center justify-center gap-2 text-black">
                          <i className="fa-solid fa-tooth text-gray-400 no-print"></i>
                          {settings?.klinik?.ad ? settings.klinik.ad.toUpperCase() : "KLİNİK YÖNETİM SİSTEMİ"}
                        </h1>
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">{documentPreview.title}</p>
                      </div>

                      {/* Hukuki Metin İçeriği */}
                      <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-justify text-black">
                        {documentPreview.content}
                      </div>

                      {/* Alt İmza Alanı */}
                      <div className="mt-12 pt-6 border-t border-gray-400 grid grid-cols-2 gap-8 text-[11px]">
                        <div>
                          <div className="font-bold uppercase text-gray-700">Klinik / Hekim Kaşe & İmza</div>
                          <div className="mt-1 font-semibold">{globalData.doctorProfiles?.[currentUser]?.name || currentUser}</div>
                          <div className="mt-10 border-b border-black w-40"></div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold uppercase text-gray-700">Hasta / Vasi Onay İmzası</div>
                          <div className="mt-1 font-semibold">Okudum, anladım, kabul ediyorum.</div>
                          <div className="mt-10 border-b border-black w-40 ml-auto"></div>
                        </div>
                      </div>
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
              // YENİ: Gerçek adı ve komisyon oranını doğru tablodan (systemUsers) çek
              name: globalData.systemUsers?.[docId]?.displayName || docId,
              commissionRate: parseFloat(globalData.systemUsers?.[docId]?.commissionRate || 0),
              revenue: 0,
            };
          });

          if (globalData.appointments) {
            Object.entries(globalData.appointments).forEach(([docId, docApts]) => {
              if (docId !== currentUser && globalData.doctorProfiles?.[docId]?.addedBy !== currentUser) return;
              
              Object.entries(docApts).forEach(([key, apt]) => {
                const dateStr = key.split("-").slice(0, 3).join("-");
                if (isDateInRange(dateStr, financePeriod, financeCustomStart, financeCustomEnd)) {
                  
                  // HEKİM ÜRETİLEN CİROSU (SADECE GELDİ OLANLAR)
                  if (apt.status === "Geldi") {
                    let aptPrice = parseFloat(apt.price) || 0;
                    
                    // Birden fazla işlem varsa (Örn: Dolgu, Çekim) her birinin ücretini bulup ayrı ayrı topla
                    if (!aptPrice && apt.treatment) {
                      const docPricing = globalData.pricingDb?.[docId] || (typeof globalData.pricingDb === "object" && globalData.pricingDb["Genel Muayene"] ? globalData.pricingDb : DEFAULT_PRICING);
                      const txList = apt.treatment.split(",").map(t => t.trim());
                      
                      txList.forEach(txName => {
                        const matchedTx = Object.keys(docPricing).find(t => txName.includes(t));
                        if (matchedTx && docPricing[matchedTx] !== undefined) {
                          aptPrice += parseFloat(docPricing[matchedTx]) || 0;
                        }
                      });
                    }

                    // Hekim üretilen cirosuna ekle (Bilanço/Toplam Ciroya EKLENMEZ, Toplam ciro sadece planlardan gelir)
                    if (aptPrice > 0 && doctorStats[docId]) {
                      doctorStats[docId].revenue += aptPrice;
                    }
                  }
                }
              });
            });
          }

          if (globalData.patientsDb) {
            Object.values(globalData.patientsDb || {})
              .filter(p => resolveClinicId(p.addedBy) === currentClinicId)
              .forEach((p) => {
                if (p.plannedTreatments) {
                  p.plannedTreatments.forEach((tx) => {
                    
                    // KLİNİK TOPLAM CİROSU: Hasta planlandığı an eklenir (Tamamlanma şartı ARANMAZ)
                    const txDateStr = formatDateKey(new Date(tx.date));

                    if (isDateInRange(txDateStr, financePeriod, financeCustomStart, financeCustomEnd)) {
                      const price = parseFloat(tx.price) || 0;
                      totalRevenue += price; // Toplam ciro sadece buradan etkilenir, indirim yapılmışsa düşmüş hali eklenir.

                      revenueHistory.push({
                        date: tx.date,
                        patientName: p.name,
                        treatment: tx.tooth === "Tüm Çene" ? tx.treatment : `Diş: ${tx.tooth} - ${tx.treatment}`,
                        amount: price,
                        type: "Planlı İşlem",
                      });
                    }

                    // HEKİM CİROSU (EPİKRİZ): Hekime eklenecek kısım için işlemin "Tamamlanmış" (isCompleted) olması ARANIR
                    if (tx.isCompleted && tx.completedBy) {
                       const compDateStr = formatDateKey(new Date(tx.completedAt || tx.date));
                       if (isDateInRange(compDateStr, financePeriod, financeCustomStart, financeCustomEnd)) {
                           if (doctorStats[tx.completedBy]) {
                               doctorStats[tx.completedBy].revenue += (parseFloat(tx.price) || 0);
                           }
                       }
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
                        {renderMoney(totalRevenue)} {isPrivacyMode ? "" : "₺"}
                      </div>
                    </div>

                    {/* YAZDIRMA İÇİN KART 1 (GİZLİ) */}
                    <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden hidden print-only h-28">
                      <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                        Fatura Edilen Toplam Ciro
                      </div>
                      <div className="text-lg font-black text-slate-800">
                        {renderMoney(totalRevenue)} {isPrivacyMode ? "" : "₺"}
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
                        {renderMoney(totalCollected)} {isPrivacyMode ? "" : "₺"}
                      </div>
                    </div>

                    {/* YAZDIRMA İÇİN KART 2 (GİZLİ) */}
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200 shadow-sm relative overflow-hidden hidden print-only h-28">
                      <div className="text-[11px] font-black text-emerald-700 uppercase tracking-wider mb-1.5">
                        Kasaya Giren (Tahsilat)
                      </div>
                      <div className="text-lg font-black text-emerald-600">
                        {renderMoney(totalCollected)} {isPrivacyMode ? "" : "₺"}
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
                        {renderMoney(totalReceivable)} {isPrivacyMode ? "" : "₺"}
                      </div>
                    </div>

                    {/* YAZDIRMA İÇİN KART 3 (GİZLİ) */}
                    <div className="bg-rose-50 p-2 rounded-xl border border-rose-200 shadow-sm relative overflow-hidden hidden print-only h-28">
                      <div className="text-[11px] font-black text-rose-700 uppercase tracking-wider mb-1.5">
                        Bekleyen Alacak (Bakiye)
                      </div>
                      <div className="text-lg font-black text-rose-600">
                        {renderMoney(totalReceivable)} {isPrivacyMode ? "" : "₺"}
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
                                    {renderMoney(doc.revenue)} {isPrivacyMode ? "" : "₺"}
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
                              {isPrivacyMode ? "***" : `+${pay.amount} ₺`}
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
                      {renderMoney(totalRevenue)} {isPrivacyMode ? "" : "₺"}
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
                              {renderMoney(rev.amount)} {isPrivacyMode ? "" : "₺"}
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
                      {renderMoney(totalCollected)} {isPrivacyMode ? "" : "₺"}
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
                              {isPrivacyMode ? "***" : `+${pay.amount.toLocaleString("tr-TR")} ₺`}
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
                      {renderMoney(totalReceivable)} {isPrivacyMode ? "" : "₺"}
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
                              {renderMoney(p.debt)} {isPrivacyMode ? "" : "₺"}
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
                            // ZIRH: React'in veriyi hafızaya alması için çok kısa bir süre bekleyip siliyoruz
                            setTimeout(() => { handleDeletePatient(); }, 100);
                          }}
                          className="w-full text-left px-2.5 py-2 text-[13px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-1.5 transition"
                        >
                      <i className="fa-solid fa-money-bill-wave w-4 text-center"></i>{" "}
                      Ödeme Al
                    </button>
                    {hasPermission("patients.delete") && (
                      <>
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
                      </>
                    )}
                  </div>
                )}

                {contextMenu.type === "appointment" && (
                  <div className="flex flex-col">
                    <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-700/50 font-black text-indigo-600 dark:text-indigo-400 text-[11px] uppercase tracking-wider truncate">
                      {contextMenu.data.apt.patientName}
                    </div>
                    {hasPermission("appointments.edit") && (
                      <>
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
                      </>
                    )}
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
              <div className="fixed top-0 left-0 w-full bg-rose-500 text-white text-[11px] font-black uppercase tracking-widest text-center py-1 z-[99999] shadow-md flex justify-center items-center gap-1 animate-pulse">
                <i className="fa-solid fa-wifi-slash"></i>
                İnternet Bağlantısı Koptu - Çevrimdışı (Offline) Modda Çalışıyorsunuz
              </div>
            )}

            {/* YENİ: Finans Şifre Giriş Modalı */}
            {pinModal.isOpen && (
              <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[500] p-4 animate-fadeIn" onClick={() => setPinModal({ isOpen: false, input: "", error: "" })}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-pop" onClick={e => e.stopPropagation()}>
                  <div className="p-5 text-center">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-full flex items-center justify-center text-xl mx-auto mb-3">
                      <i className="fa-solid fa-lock"></i>
                    </div>
                    <h3 className="font-black text-slate-800 dark:text-white text-lg mb-1">Finansal Şifre</h3>
                    <p className="text-[11px] text-slate-500 font-medium mb-4">
                      Lütfen 4 haneli finans şifrenizi girin. {(!settings?.guvenlik?.finansSifresi || settings?.guvenlik?.finansSifresi === "0000") && "(Varsayılan: 0000)"}
                    </p>
                    
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const currentPin = settings?.guvenlik?.finansSifresi || "0000";
                      if (pinModal.input === currentPin) {
                        setIsPrivacyMode(false);
                        setPinModal({ isOpen: false, input: "", error: "" });
                      } else {
                        setPinModal({ ...pinModal, error: "Hatalı şifre!" });
                      }
                    }}>
                      <input 
                        type="password" 
                        maxLength="4" 
                        pattern="[0-9]*" 
                        inputMode="numeric"
                        autoFocus
                        value={pinModal.input}
                        onChange={(e) => setPinModal({ ...pinModal, input: e.target.value.replace(/\D/g, ''), error: "" })}
                        className="w-full text-center text-2xl tracking-[0.5em] font-black p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 mb-2 dark:text-white"
                        placeholder="••••"
                      />
                      {pinModal.error && <div className="text-[11px] font-bold text-rose-500 mb-2">{pinModal.error}</div>}
                      <button type="submit" className="w-full bg-indigo-600 text-white font-black py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-lg">Kilidi Aç</button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {notification && (
              <div
                className={`fixed top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-[0_15px_50px_-10px_rgba(0,0,0,0.5)] font-black text-[13px] text-white z-[99999] animate-[modalPop_0.3s_ease-out_forwards] backdrop-blur-xl flex items-center gap-2 border ${
                  notification.type === "error"
                    ? "bg-rose-500/95 border-rose-400"
                    : "bg-slate-900/95 dark:bg-indigo-600/95 border-slate-700 dark:border-indigo-400"
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
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[99998] p-2">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-pop border border-slate-200 dark:border-slate-700">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-[#0f172a] text-white flex justify-between items-center">
                    <h3 className="font-black text-[13px] uppercase tracking-wider">
                      <i className="fa-solid fa-circle-exclamation mr-2 text-rose-400"></i>
                      {confirmModal.title}
                    </h3>

                    <button
                      onClick={handleCancelConfirm}
                      className="text-slate-400 hover:text-white"
                    >
                      <i className="fa-solid fa-xmark text-base"></i>
                    </button>
                  </div>

                  <div className="p-3 space-y-2">
                    <p className="text-slate-700 dark:text-slate-300 font-bold text-[13px] whitespace-pre-wrap">
                      {confirmModal.message}
                    </p>
                    
                    {confirmModal.requireInput && (
                      <div className="mt-3 bg-rose-50 dark:bg-rose-900/20 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                         <label className="block text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase mb-1.5">
                           Güvenlik Onayı: <br/>
                           {confirmModal.isPassword ? (
                               <span className="text-slate-700 dark:text-slate-300 font-bold capitalize">İşleme devam etmek için lütfen <b className="text-rose-600 dark:text-rose-400">hesap giriş şifrenizi</b> girin.</span>
                           ) : (
                               <span className="text-slate-700 dark:text-slate-300 font-bold capitalize">Lütfen kutuya <b className="text-rose-600 dark:text-rose-400">"{confirmModal.expectedText}"</b> yazın.</span>
                           )}
                         </label>
                         <input 
                           type={confirmModal.isPassword ? "password" : "text"} 
                           value={confirmModal.inputText}
                           onChange={(e) => setConfirmModal({...confirmModal, inputText: e.target.value})}
                           placeholder={confirmModal.isPassword ? "Şifrenizi girin..." : confirmModal.expectedText}
                           className="w-full p-2 rounded-lg border border-rose-300 dark:border-rose-700 text-[13px] font-bold outline-none focus:ring-2 focus:ring-rose-500 dark:bg-slate-900 dark:text-white shadow-inner"
                           autoFocus
                         />
                      </div>
                    )}

                    <div className="flex gap-1.5 pt-2">
                      <button
                        onClick={handleCancelConfirm}
                        className="flex-1 px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition dark:bg-slate-700 dark:text-slate-200"
                      >
                        Vazgeç
                      </button>

                      <button
                        onClick={handleConfirm}
                        className="flex-[2] px-2.5 py-1.5 bg-rose-500 text-white rounded-xl font-black hover:bg-rose-600 transition shadow-sm"
                      >
                        {confirmModal.requireInput ? "Onayla ve Sil" : "Evet, Devam Et"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* YENİ: GELİŞMİŞ RANDEVU İPTAL VE HAVUZ MODALI */}
            {cancelAptModal.isOpen && (
              <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[99999] p-3 animate-fadeIn">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-pop border border-slate-200 dark:border-slate-700 flex flex-col">
                  
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 flex justify-between items-center">
                    <h3 className="font-black text-[14px] text-slate-800 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-list-check text-indigo-500"></i> Randevu İşlem Seçimi
                    </h3>
                    <button onClick={() => setCancelAptModal({ isOpen: false, aptKey: null, docId: null, aptData: null, reasonNote: "" })} className="text-slate-400 hover:text-rose-500 transition">
                      <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-2.5 rounded-xl flex justify-between items-center">
                      <div className="font-bold text-[12px] text-indigo-900 dark:text-indigo-300">{cancelAptModal.aptData?.patientName}</div>
                      <div className="text-[10px] font-black bg-white dark:bg-slate-800 px-2 py-1 rounded text-indigo-500">{cancelAptModal.aptData?.time || cancelAptModal.aptKey?.split('-')[3]}</div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Takip / İptal Notu (İsteğe Bağlı)</label>
                      <input 
                        type="text" 
                        placeholder="Örn: Hasta şehir dışında, haftaya aranacak..." 
                        value={cancelAptModal.reasonNote}
                        onChange={e => setCancelAptModal({...cancelAptModal, reasonNote: e.target.value})}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-medium outline-none focus:border-indigo-500 dark:text-white"
                        autoFocus
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-2">
                      <button onClick={() => processCancelAppointment("cancel")} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition text-left group">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-slate-200"><i className="fa-solid fa-ban"></i></div>
                        <div>
                          <div className="font-bold text-[13px] text-slate-800 dark:text-white">Randevuyu İptal Et</div>
                          <div className="text-[10px] text-slate-500">Randevu 'İptal' olarak işaretlenir.</div>
                        </div>
                      </button>

                      <button onClick={() => processCancelAppointment("noshow")} className="flex items-center gap-3 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition text-left group">
                        <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-500 flex items-center justify-center shrink-0 group-hover:bg-rose-200"><i className="fa-solid fa-user-xmark"></i></div>
                        <div>
                          <div className="font-bold text-[13px] text-rose-700 dark:text-rose-400">Hasta Gelmedi (No-Show)</div>
                          <div className="text-[10px] text-rose-500/70 dark:text-rose-500">Randevu 'Gelmedi' olarak işaretlenir ve masaya düşer.</div>
                        </div>
                      </button>

                      <button onClick={() => processCancelAppointment("recall")} className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition text-left group">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-200"><i className="fa-solid fa-phone-volume"></i></div>
                        <div>
                          <div className="font-bold text-[13px] text-amber-700 dark:text-amber-400">Yeniden Aranacaklar Listesine Al</div>
                          <div className="text-[10px] text-amber-600/70 dark:text-amber-500">Hasta, dosya masasında 'Aranacaklar' klasörüne düşer.</div>
                        </div>
                      </button>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700 mt-2">
                       <button onClick={() => showConfirm("Randevuyu veritabanından kalıcı olarak silmek istediğinize emin misiniz?", () => processCancelAppointment("delete"))} className="w-full py-2 text-[11px] font-bold text-slate-400 hover:text-rose-600 transition underline decoration-dotted underline-offset-2">
                          İşlemi Kalıcı Olarak Sil (Önerilmez)
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
                <SidebarItem icon="fa-chart-pie text-sky-500" label="Anasayfa (Özet)" id="home" />

                {hasPermission("appointments.view") && (
                  <>
                    <SidebarItem icon="fa-calendar-days text-indigo-500" label="Randevu Takvimi" id="calendar" />
                    <SidebarItem icon="fa-table-columns text-purple-500" label="Randevu Listesi" id="list" />
                  </>
                )}

                {hasPermission("patients.view") && (
                  <SidebarItem icon="fa-hospital-user text-emerald-500" label="Hastalar & Veri" id="patients" />
                )}

                {/* YENİ: Fiyat listesini herkes görebilir, düzenleme yetkisi içeride kontrol edilecek */}
                <SidebarItem icon="fa-tags text-pink-500" label="Ücretlendirme" id="pricing" />

                {hasPermission("doctors.view") && (
                  <SidebarItem icon="fa-user-doctor text-amber-500" label="Hekim Yönetimi" id="doctors" />
                )}

                {hasPermission("finance.view") && (
                  <SidebarItem icon="fa-vault text-rose-500" label="Finans (Bilanço)" id="finance" />
                )}

                {/* YENİ: KLİNİK KULLANICILARI MENÜSÜ */}
                {hasPermission("users.view") && (
                  <SidebarItem icon="fa-users-gear text-teal-500" label="Klinik Kullanıcıları" id="users" />
                )}
              </div>
              
              {/* AYARLAR BUTONU ARTIK HERKESE AÇIK (Sekmeler içeride filtrelenir) */}
              <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent">
                <SidebarItem icon="fa-gear text-slate-500 dark:text-slate-400" label={currentUserProfile?.role === "clinic_owner" ? "Klinik Ayarları" : "Hesabım ve Güvenlik"} id="settings" />
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
                hasPermission("appointments.view") && "calendar",
                hasPermission("appointments.view") && "list",
                hasPermission("patients.view") && "patients",
                "pricing", // YENİ: Fiyat sekmesi mobilde herkes için açık
                hasPermission("doctors.view") && "doctors",
                hasPermission("finance.view") && "finance",
                hasPermission("users.view") && "users",
                hasPermission("settings.view") && "settings",
              ].filter(Boolean).map((tab) => (
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
                        : tab === "users"
                        ? "fa-users-gear"
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
                        value={globalSearchInput}
                        onChange={(e) => {
                          setGlobalSearchInput(e.target.value);
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
                            .filter((p) => {
                              // KLİNİK İZOLASYONU
                              return resolveClinicId(p.addedBy) === currentClinicId && !p.isDeleted &&
                                (p.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
                                (p.phone && p.phone.includes(globalSearch)) ||
                                (p.tc && p.tc.includes(globalSearch)) ||
                                (p.patientCode && p.patientCode.includes(globalSearch)));
                            })
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
                  {/* YENİ: Şifreli Hasta Mahremiyeti / Gizlilik Modu Butonu */}
                {hasPermission("finance.view") && (
                  <button
                    onClick={() => {
                      if (isPrivacyMode) {
                        setPinModal({ isOpen: true, input: "", error: "" }); // Açmak için şifre iste
                      } else {
                        setIsPrivacyMode(true); // Kapatmak için anında kilitle
                      }
                    }}
                    className={`w-9 h-8 rounded-xl flex items-center justify-center transition shadow-sm ${
                      isPrivacyMode
                        ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                    title="Finansal Verileri Göster / Gizle"
                  >
                    <i
                      className={`fa-solid ${
                        isPrivacyMode ? "fa-eye-slash" : "fa-eye"
                      }`}
                    ></i>
                  </button>
                )}

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
                              {globalData.systemUsers?.[currentUser]?.displayName ||
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
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200/50 dark:border-slate-700/50 z-50 animate-pop ring-1 ring-black/5 dark:ring-white/10">
                        {/* Menü İçi Kullanıcı Özeti */}
                        <div className="p-2.5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl">
                          <div className="font-black text-[13px] text-slate-800 dark:text-white truncate">
                            {currentUserProfile?.displayName || globalData.systemUsers?.[currentUser]?.displayName || currentUser}
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                            {currentUserProfile?.role === 'assistant' ? 'Klinik Asistanı' : (globalData.systemUsers?.[currentUser]?.title || "Klinik Hekimi")}
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
                          {/* YENİ: KULLANICILAR (HESAP DEĞİŞTİRME) ALT MENÜSÜ */}
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Tıklamanın dışarı taşıp menüyü kapatmasını engeller
                                setIsUsersSubmenuOpen(!isUsersSubmenuOpen);
                              }}
                              className={`w-full text-left px-2.5 py-2 text-[11px] font-bold transition-colors rounded-xl flex items-center justify-between group/btn ${isUsersSubmenuOpen ? "bg-slate-100 dark:bg-slate-700/50 text-indigo-600 dark:text-indigo-400" : "hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300"}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <i className={`fa-solid fa-right-left w-4 text-center transition-colors ${isUsersSubmenuOpen ? "text-indigo-500" : "text-slate-400 group-hover/btn:text-indigo-500"}`}></i> 
                                Kullanıcılar
                              </div>
                              <i className={`fa-solid fa-chevron-right text-[9px] transition-transform ${isUsersSubmenuOpen ? "rotate-90 opacity-100 text-indigo-500" : "opacity-50 group-hover/btn:translate-x-0.5"}`}></i>
                            </button>
                            
                            <div className={`absolute top-0 right-full mr-2 w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transition-all duration-200 origin-top-right z-50 ${isUsersSubmenuOpen ? "opacity-100 visible scale-100 pointer-events-auto" : "opacity-0 invisible scale-95 pointer-events-none"}`}>
                              <div className="p-2 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-900/80 font-black text-[10px] uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                                <i className="fa-solid fa-users text-indigo-400"></i> Hızlı Hesap Geçişi
                              </div>
                              <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                                {getClinicUsers().map(u => (
                                  <div 
                                    key={u.username} 
                                    onClick={() => {
                                      setSwitchAccountModal({
                                        isOpen: true, targetUsername: u.username, targetName: u.name, targetRole: u.role, password: "", error: ""
                                      });
                                      setIsUserMenuOpen(false);
                                    }} 
                                    className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg cursor-pointer flex items-center gap-2.5 group/user transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800/50"
                                  >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] shrink-0 border shadow-sm ${u.role === 'clinic_owner' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800' : u.role === 'doctor' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800'}`}>
                                      <i className={`fa-solid ${u.role === 'clinic_owner' ? 'fa-crown' : u.role === 'doctor' ? 'fa-user-doctor' : 'fa-headset'}`}></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-[12px] text-slate-800 dark:text-slate-200 truncate group-hover/user:text-indigo-600 dark:group-hover/user:text-indigo-400 transition-colors">{u.name}</div>
                                      <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{u.role === 'clinic_owner' ? 'Klinik Sahibi' : u.role === 'doctor' ? 'Hekim' : 'Klinik Asistanı'}</div>
                                    </div>
                                    <i className="fa-solid fa-arrow-right-to-bracket text-[11px] text-slate-300 opacity-0 group-hover/user:opacity-100 group-hover/user:text-indigo-500 transition-all -translate-x-2 group-hover/user:translate-x-0 pr-1"></i>
                                  </div>
                                ))}
                                {getClinicUsers().length === 0 && (
                                  <div className="p-4 text-center text-[10px] font-bold text-slate-400 italic">Bu klinikte başka aktif kullanıcı yok.</div>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* YENİ BİTİŞ */}

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
                              // 1. Tüm açık menüleri ve sekmeleri ANINDA kapat
                              setIsUserMenuOpen(false);
                              setIsUsersSubmenuOpen(false);
                              setSearchDropdownOpen(false);
                              setIsAptSearchOpen(false);
                              
                              // 2. Çıkış animasyonunu başlat
                              setIsLoggingOut(true); 
                              
                              setTimeout(async () => {
                                // 3. Tüm formları, şifreleri ve giriş ekranını tamamen SIFIRLA (Tertemiz Başlangıç)
                                setAuthForm({ username: "", password: "" });
                                setRegisterForm({ name: "", title: "", username: "", email: "", password: "" });
                                setForgotForm({ email: "" });
                                setAuthMode("login"); // Yeni girişte "Giriş Yap" sekmesi açık olsun
                                setAuthError(""); // Varsa hata mesajlarını temizle
                                setActiveTab("home"); // Yeni girişte her zaman anasayfadan başlasın
                                
                                // 4. Firebase'den güvenli çıkış yap
                                if(auth) await signOut(auth);
                                
                                // 5. Animasyonu bitir
                                setIsLoggingOut(false);
                              }, 1500);
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

                {activeTab === "users" && renderUsers()}
              </div>
            </main>

            {isPasswordModalOpen && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[350] p-3 animate-fadeIn" onClick={() => setIsPasswordModalOpen(false)}>
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-pop border border-slate-100 dark:border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
                  
                  <div className="px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                    <div className="flex items-center gap-2.5 relative z-10">
                      <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-sm shadow-inner">
                        <i className="fa-solid fa-shield-halved"></i>
                      </div>
                      <div>
                        <h3 className="font-black text-sm tracking-wide">Hesap Güvenliği</h3>
                        <p className="text-[10px] text-indigo-100 font-medium">E-posta ve şifrenizi yönetin</p>
                      </div>
                    </div>
                    <button onClick={() => setIsPasswordModalOpen(false)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition backdrop-blur-md relative z-10">
                      <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    
                    const profile = globalData.userProfiles?.[currentUser] || {};
                    const currentLoginEmail = profile.realEmail || `${currentUser}@klinik.com`;

                    if (!passwordForm.oldPass) {
                        showNotification("Güvenlik onayı için mevcut şifrenizi girmelisiniz!", "error"); return;
                    }
                    if (!passwordForm.email || !passwordForm.email.includes("@")) {
                        showNotification("Lütfen geçerli bir e-posta adresi girin!", "error"); return;
                    }
                    if (passwordForm.newPass && passwordForm.newPass.length < 6) {
                        showNotification("Yeni şifre en az 6 karakter olmalıdır!", "error"); return;
                    }
                    if (passwordForm.newPass && passwordForm.newPass !== passwordForm.confirmPass) {
                        showNotification("Yeni şifreler eşleşmiyor!", "error"); return;
                    }

                    try {
                      // 1. İşlem yapabilmek için Firebase'de eski şifreyle güvenliği doğruluyoruz
                      await signInWithEmailAndPassword(auth, currentLoginEmail, passwordForm.oldPass);

                      let isUpdated = false;

                      // 2. Yeni e-postayı Firebase'e işliyoruz (Eğer değişmişse veya ilk defa ekleniyorsa)
                      if (passwordForm.email !== currentLoginEmail) {
                          await updateEmail(auth.currentUser, passwordForm.email);
                          
                          const updatedProfiles = { ...globalData.userProfiles };
                          updatedProfiles[currentUser] = { ...profile, realEmail: passwordForm.email };
                          await saveGlobalData({ ...globalData, userProfiles: updatedProfiles });
                          isUpdated = true;
                      }

                      // 3. Kullanıcı şifre alanını doldurduysa şifreyi de güncelliyoruz
                      if (passwordForm.newPass) {
                          await updatePassword(auth.currentUser, passwordForm.newPass);
                          isUpdated = true;
                      }

                      if (isUpdated) {
                          setIsPasswordModalOpen(false);
                          showNotification("Hesap güvenlik bilgileriniz başarıyla güncellendi.", "success");
                          setPasswordForm({ oldPass: "", newPass: "", confirmPass: "", email: "" });
                      } else {
                          showNotification("Herhangi bir değişiklik yapmadınız.", "error");
                      }

                    } catch (error) {
                      console.error(error);
                      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                          showNotification("Mevcut şifrenizi yanlış girdiniz!", "error");
                      } else if (error.code === 'auth/email-already-in-use') {
                          showNotification("Bu e-posta adresi başka bir hesapta kullanılıyor!", "error");
                      } else {
                          showNotification("İşlem başarısız: Lütfen tekrar deneyin.", "error");
                      }
                    }
                  }} className="p-4 space-y-3.5">

                    <div className="space-y-1">
                      <label className="block text-[11px] font-black text-indigo-500 uppercase tracking-wider">Kayıtlı E-Posta Adresi</label>
                      <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <i className="fa-solid fa-envelope text-xs"></i>
                        </span>
                        <input
                          required
                          type="email"
                          value={passwordForm.email}
                          onChange={(e) => setPasswordForm({ ...passwordForm, email: e.target.value })}
                          className="w-full pl-9 pr-3 py-2.5 bg-indigo-50/50 dark:bg-slate-900 border border-indigo-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:text-white transition-all"
                          placeholder="Şifre sıfırlama linki buraya gönderilecek"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">Mevcut Şifreniz (Güvenlik İçin Zorunlu)</label>
                      <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <i className="fa-solid fa-lock text-xs"></i>
                        </span>
                        <input
                          required
                          type={showPassState.old ? "text" : "password"}
                          value={passwordForm.oldPass}
                          onChange={(e) => setPasswordForm({ ...passwordForm, oldPass: e.target.value })}
                          className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 dark:text-white"
                          placeholder="Mevcut şifrenizi girin"
                        />
                        <button type="button" onClick={() => setShowPassState({ ...showPassState, old: !showPassState.old })} className="absolute right-3.5 top-2.5 text-slate-400 hover:text-indigo-500 transition-colors">
                          <i className={`fa-solid ${showPassState.old ? "fa-eye-slash" : "fa-eye"}`}></i>
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3 mt-1">
                      <p className="text-[10px] text-slate-500 font-bold mb-2"><i className="fa-solid fa-circle-info text-indigo-400"></i> Şifrenizi değiştirmek istemiyorsanız aşağıdaki alanları boş bırakın.</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">Yeni Şifre</label>
                          <div className="relative">
                            <input
                              type={showPassState.new ? "text" : "password"}
                              value={passwordForm.newPass}
                              onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                              className="w-full px-3 pr-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 dark:text-white"
                              placeholder="En az 6 karakter"
                            />
                            <button type="button" onClick={() => setShowPassState({ ...showPassState, new: !showPassState.new })} className="absolute right-3 top-2 text-slate-400 hover:text-indigo-500 transition-colors">
                              <i className={`fa-solid ${showPassState.new ? "fa-eye-slash" : "fa-eye"}`}></i>
                            </button>
                          </div>
                          {passwordForm.newPass.length > 0 && (() => {
                             const p = passwordForm.newPass;
                             let score = 0;
                             if (p.length >= 6) score += 1;
                             if (p.length >= 8) score += 1;
                             if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1;
                             if (/[0-9]/.test(p)) score += 1;
                             if (/[^A-Za-z0-9]/.test(p)) score += 1;
                             
                             let text = "Zayıf", color = "bg-rose-500", textColor = "text-rose-500";
                             if (score === 3 || score === 4) { text = "Orta"; color = "bg-amber-500"; textColor = "text-amber-500"; }
                             if (score >= 5) { text = "Güçlü"; color = "bg-emerald-500"; textColor = "text-emerald-500"; }
                             
                             return (
                                <div className="pt-1.5 animate-fadeIn">
                                   <div className="flex gap-1 mb-1 h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                      <div className={`h-full ${score >= 1 ? color : 'bg-transparent'} transition-all w-1/3`}></div>
                                      <div className={`h-full ${score >= 3 ? color : 'bg-transparent'} transition-all w-1/3`}></div>
                                      <div className={`h-full ${score >= 5 ? color : 'bg-transparent'} transition-all w-1/3`}></div>
                                   </div>
                                   <div className={`text-[9px] font-black text-right uppercase tracking-wider ${textColor}`}>{text} ŞİFRE</div>
                                </div>
                             );
                          })()}
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">Yeni Şifre Tekrar</label>
                          <div className="relative">
                            <input
                              type={showPassState.confirm ? "text" : "password"}
                              value={passwordForm.confirmPass}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPass: e.target.value })}
                              className="w-full px-3 pr-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 dark:text-white"
                              placeholder="Şifreyi tekrarla"
                            />
                            <button type="button" onClick={() => setShowPassState({ ...showPassState, confirm: !showPassState.confirm })} className="absolute right-3 top-2 text-slate-400 hover:text-indigo-500 transition-colors">
                              <i className={`fa-solid ${showPassState.confirm ? "fa-eye-slash" : "fa-eye"}`}></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex gap-2">
                      <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Vazgeç</button>
                      <button type="submit" className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-lg transition-all">Bilgileri Güncelle <i className="fa-solid fa-check ml-1"></i></button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {isPinChangeModalOpen && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[350] p-3 animate-fadeIn" onClick={() => setIsPinChangeModalOpen(false)}>
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-pop border border-slate-100 dark:border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
                  
                  <div className="px-4 py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white flex justify-between items-center relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                    <div className="flex items-center gap-2.5 relative z-10">
                      <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-sm shadow-inner">
                        <i className="fa-solid fa-eye-slash"></i>
                      </div>
                      <div>
                        <h3 className="font-black text-sm tracking-wide">Finans Şifresini Değiştir</h3>
                        <p className="text-[10px] text-rose-100 font-medium">4 Haneli PIN Kodunu Güncelle</p>
                      </div>
                    </div>
                    <button onClick={() => setIsPinChangeModalOpen(false)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition backdrop-blur-md relative z-10">
                      <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                  </div>

                  <form onSubmit={(e) => {
                     e.preventDefault();
                     
                     // 1. Ayarları doğrudan global 'settings' üzerinden okuyoruz (Çünkü modal ana dizinde)
                     const currentPin = settings?.guvenlik?.finansSifresi || "0000";
                     
                     if (pinChangeForm.oldPin !== currentPin) {
                         showNotification("Mevcut finans şifresi (PIN) hatalı!", "error");
                         return;
                     }
                     if (pinChangeForm.newPin.length !== 4) {
                         showNotification("Yeni PIN tam 4 haneli rakam olmalıdır!", "error");
                         return;
                     }
                     if (pinChangeForm.newPin !== pinChangeForm.confirmPin) {
                         showNotification("Yeni PIN'ler eşleşmiyor!", "error");
                         return;
                     }
                     
                     // 2. Patronun (Kliniğin Asıl Sahibinin) ID'sini buluyoruz ki ayarlar doğru kliniğe kaydolsun
                     const ownerId = typeof getClinicOwnerId === "function" ? getClinicOwnerId() : currentUser;
                     
                     // 3. Mevcut ayarların güvenli bir kopyasını oluşturup şifreyi değiştiriyoruz
                     const newSettings = JSON.parse(JSON.stringify(settings)); 
                     if (!newSettings.guvenlik) newSettings.guvenlik = {};
                     newSettings.guvenlik.finansSifresi = pinChangeForm.newPin;
                     
                     // 4. LocalStorage'a kaydet (hızlı açılış için)
                     localStorage.setItem(`klinikSettings_${ownerId}`, JSON.stringify(newSettings));
                     
                     // 5. Firebase Bulut'a kaydet ve arayüzü güncelle
                     saveGlobalData({
                         ...globalData,
                         settingsDb: {
                             ...(globalData.settingsDb || {}),
                             [ownerId]: newSettings
                         }
                     }).then(() => {
                         setSettings(newSettings);
                         setPinChangeForm({ oldPin: "", newPin: "", confirmPin: "" });
                         setIsPinChangeModalOpen(false);
                         showNotification("Finans şifresi başarıyla güncellendi.", "success");
                     }).catch(err => {
                         showNotification("Şifre kaydedilirken bir hata oluştu.", "error");
                         console.error(err);
                     });

                  }} className="p-4 space-y-3.5">
                    
                    <div className="space-y-1">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">Mevcut PIN</label>
                      <input 
                        required
                        autoFocus
                        type="password" 
                        placeholder="••••" 
                        maxLength="4"
                        value={pinChangeForm.oldPin}
                        onChange={(e) => setPinChangeForm({...pinChangeForm, oldPin: e.target.value.replace(/\D/g, '')})}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-lg font-bold outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-center tracking-[0.5em] shadow-inner" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                       <div className="space-y-1">
                         <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">Yeni PIN</label>
                         <input 
                           required
                           type="password" 
                           placeholder="••••" 
                           maxLength="4"
                           value={pinChangeForm.newPin}
                           onChange={(e) => setPinChangeForm({...pinChangeForm, newPin: e.target.value.replace(/\D/g, '')})}
                           className="w-full p-2.5 border border-slate-200 rounded-xl text-lg font-bold outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-center tracking-[0.5em] shadow-inner" 
                         />
                       </div>
                       <div className="space-y-1">
                         <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">Tekrar</label>
                         <input 
                           required
                           type="password" 
                           placeholder="••••" 
                           maxLength="4"
                           value={pinChangeForm.confirmPin}
                           onChange={(e) => setPinChangeForm({...pinChangeForm, confirmPin: e.target.value.replace(/\D/g, '')})}
                           className="w-full p-2.5 border border-slate-200 rounded-xl text-lg font-bold outline-none focus:border-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-center tracking-[0.5em] shadow-inner" 
                         />
                       </div>
                    </div>

                    <div className="pt-3 flex gap-2">
                      <button type="button" onClick={() => setIsPinChangeModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Vazgeç</button>
                      <button type="submit" className="flex-[2] py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-xs shadow-lg transition-all">PIN'i Güncelle <i className="fa-solid fa-check ml-1"></i></button>
                    </div>

                  </form>
                </div>
              </div>
            )}
            {/* YENİ: HESAP DEĞİŞTİRME ŞİFRE DOĞRULAMA MODALI */}
            {switchAccountModal.isOpen && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[9999] p-3 animate-fadeIn" onClick={() => setSwitchAccountModal({...switchAccountModal, isOpen: false, password: "", error: ""})}>
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-pop border border-slate-100 dark:border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
                  
                  <div className="px-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-center relative">
                    <div className="absolute right-3 top-3">
                      <button onClick={() => setSwitchAccountModal({...switchAccountModal, isOpen: false, password: "", error: ""})} className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition">
                        <i className="fa-solid fa-xmark text-sm"></i>
                      </button>
                    </div>
                    
                    <div className="flex justify-center mb-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md border-2 border-white dark:border-slate-800 ring-4 ${switchAccountModal.targetRole === 'clinic_owner' ? 'bg-amber-100 text-amber-600 ring-amber-50 dark:bg-amber-900/40 dark:ring-amber-900/20' : switchAccountModal.targetRole === 'doctor' ? 'bg-indigo-100 text-indigo-600 ring-indigo-50 dark:bg-indigo-900/40 dark:ring-indigo-900/20' : 'bg-emerald-100 text-emerald-600 ring-emerald-50 dark:bg-emerald-900/40 dark:ring-emerald-900/20'}`}>
                        <i className={`fa-solid ${switchAccountModal.targetRole === 'clinic_owner' ? 'fa-crown' : switchAccountModal.targetRole === 'doctor' ? 'fa-user-doctor' : 'fa-headset'}`}></i>
                      </div>
                    </div>
                    <h3 className="font-black text-lg text-slate-800 dark:text-white leading-tight">{switchAccountModal.targetName}</h3>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">{switchAccountModal.targetRole === 'clinic_owner' ? 'Klinik Sahibi' : switchAccountModal.targetRole === 'doctor' ? 'Hekim' : 'Klinik Asistanı'}</div>
                  </div>

                  <form onSubmit={handleSwitchAccountSubmit} className="p-5 space-y-4">
                    <p className="text-[12px] text-slate-600 dark:text-slate-300 font-medium text-center leading-relaxed">
                      Bu hesaba geçiş yapmak için güvenlik gereği hedefin <b>hesap giriş şifresini</b> girmelisiniz.
                    </p>
                    
                    <div>
                      <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <i className="fa-solid fa-lock text-sm"></i>
                        </span>
                        <input
                          required
                          type={switchAccountModal.showPassword ? "text" : "password"}
                          autoFocus
                          value={switchAccountModal.password}
                          onChange={(e) => setSwitchAccountModal({ ...switchAccountModal, password: e.target.value, error: "" })}
                          className={`w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-900 border-2 rounded-xl text-sm font-black tracking-widest outline-none focus:ring-4 transition-all shadow-inner dark:text-white ${switchAccountModal.error ? "border-rose-500 focus:ring-rose-500/10 text-rose-600" : "border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/10"}`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setSwitchAccountModal({ ...switchAccountModal, showPassword: !switchAccountModal.showPassword })}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-indigo-500 transition-colors"
                        >
                          <i className={`fa-solid ${switchAccountModal.showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                        </button>
                      </div>
                      {switchAccountModal.error && (
                        <div className="text-[11px] font-black text-rose-500 mt-2 text-center animate-pop"><i className="fa-solid fa-triangle-exclamation mr-1"></i> {switchAccountModal.error}</div>
                      )}
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button type="button" onClick={() => setSwitchAccountModal({...switchAccountModal, isOpen: false, password: "", error: ""})} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-xl font-bold text-[13px] transition shadow-sm">Vazgeç</button>
                      <button type="submit" className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[13px] shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-1.5">
                        Hesaba Geç <i className="fa-solid fa-arrow-right-to-bracket"></i>
                      </button>
                    </div>
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
                            <div className="font-black text-[11px] mb-1 uppercase tracking-wider">Önemli Uyarı (Anamnez)</div>
                            <div className="text-[11px] font-semibold">{formData.anamnesis}</div>
                          </div>
                        </div>
                      )}

                      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                        
                        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-700">
                          <div className="w-9 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <i className="fa-solid fa-user"></i>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hasta Adı</div>
                            <div className="font-black text-base text-slate-800 dark:text-white">{formData.patientName}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-700">
                           <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atanan Hekim</div>
                              <div className="font-bold mt-1 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                 <i className="fa-solid fa-user-doctor text-indigo-500"></i>
                                 {globalData.doctorProfiles?.[activeSlotDoctor]?.name || activeSlotDoctor}
                              </div>
                           </div>
                           <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tarih / Saat</div>
                              <div className="font-bold mt-1 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                 <i className="fa-regular fa-calendar-check text-indigo-500"></i>
                                 {activeSlotDate ? `${String(activeSlotDate.getDate()).padStart(2,"0")}.${String(activeSlotDate.getMonth()+1).padStart(2,"0")}.${activeSlotDate.getFullYear()}` : ""} - {selectedSlot}
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefon & İletişim</div>
                            <div className="font-bold mt-1 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <div><i className="fa-solid fa-phone text-slate-400 mr-1"></i> {formData.phone || "-"}</div>
                              {formData.phone && String(formData.phone).replace(/\D/g, "").length >= 10 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    let num = String(formData.phone).replace(/\D/g, "");
                                    if (!num.startsWith("90")) num = "90" + num;
                                    
                                    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                                    const formattedDate = activeSlotDate ? new Date(activeSlotDate).toLocaleDateString('tr-TR', dateOptions) : "";
                                    const msg = `Sayın ${formData.patientName},\n\n${formattedDate} tarihi, saat ${selectedSlot}'daki randevunuzu hatırlatırız. Randevunuza gelemeyecek olmanız durumunda lütfen kliniğimize önceden bilgi veriniz.\n\nSağlıklı günler dileriz.`;
                                    
                                    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
                                  }}
                                  className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg hover:bg-emerald-200 transition shadow-sm flex items-center gap-1 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border dark:border-emerald-800"
                                >
                                  <i className="fa-brands fa-whatsapp text-[13px]"></i> Hatırlat
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Durum</div>
                            <div className="mt-1">{getStatusBadge(formData.status)}</div>
                          </div>

                          <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tedavi / Seçilen Diş / Süre</div>
                            <div className="font-bold mt-1 text-slate-700 dark:text-slate-300">
                              {renderTreatmentText(formData)} ({formData.duration} Dk)
                            </div>
                          </div>

                          {formData.price && (
                            <div className="col-span-2">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan Ücreti</div>
                              <div className="font-black text-indigo-600 dark:text-indigo-400 mt-1">{formData.price} ₺</div>
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
                              if (!formData.patientName) {
                                const ownerId = currentUserProfile?.role === "assistant" ? currentUserProfile.createdBy : currentUser;
                                setPatientSuggestions(
                                  Object.values(globalData.patientsDb || {}).filter(
                                    (p) => resolveClinicId(p.addedBy) === currentClinicId && !p.isDeleted
                                  )
                                );
                              }
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
                                <div className="text-[11px] text-slate-500 font-bold bg-white border border-slate-100 px-1.5 py-0.5 rounded-md shadow-sm dark:bg-slate-800 dark:border-slate-600 flex items-center gap-2">
  <span><i className="fa-solid fa-phone mr-1 opacity-70"></i>{p.phone || "-"}</span>
  {p.tc && (
    <span className="border-l border-slate-200 dark:border-slate-600 pl-2">
      <i className="fa-solid fa-id-card mr-1 opacity-70"></i>{p.tc}
    </span>
  )}
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

                          // Müsait planları listele (YENİ DÜZELTME: Tamamlanmış işlemleri listeden gizle)
                          const availablePlans = (
                            formData.plannedTreatments || []
                          ).filter(
                            (tx) =>
                              !tx.isCompleted && // YENİ: Eğer işlem daha önce bittiyse (isCompleted: true), listeye alma
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
                        ? `fixed top-16 bottom-0 z-[45] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-[10px_0_30px_rgba(0,0,0,0.15)] flex justify-center transition-all duration-300 w-full lg:w-[380px] xl:w-[450px] ${
                            isSidebarOpen
                              ? "left-0 lg:left-[224px]"
                              : "left-0 lg:left-[68px]"
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
                        <h3 className="font-black text-[13px] sm:text-base flex items-center gap-1.5 truncate pr-1.5">
                          <i className="fa-regular fa-folder-open text-indigo-400 shrink-0"></i>{" "}
                          <span className="text-slate-400 text-[11px] hidden sm:inline">#{patientForm.patientCode || "YENİ"}</span>
                          <span className="truncate">{patientForm.name}</span>
                          {patientForm.isEmergency && (
                            <span className="animate-pulse bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-[0_0_8px_rgba(244,63,94,0.6)] ml-1">
                              ACİL HASTA
                            </span>
                          )}
                        </h3>

                        <div className="flex gap-1 items-center shrink-0">

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
                          className={`flex-1 overflow-y-auto p-2 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar ${
                            isSplitMode ? "" : "lg:flex-row"
                          }`}
                        >
                          <div className="flex-[3] space-y-1.5">
                            {patientForm.anamnesis && (
                              <div className="bg-rose-100 text-rose-700 p-2 rounded-lg border shadow-sm animate-pop flex items-start gap-1.5 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50">
                                <i className="fa-solid fa-triangle-exclamation text-sm mt-0.5"></i>

                                <div>
                                  <div className="font-black text-[11px] mb-0.5 uppercase tracking-wider">
                                    Önemli Uyarı (Anamnez)
                                  </div>

                                  <div className="text-[11px] font-semibold whitespace-pre-wrap">
                                    {patientForm.anamnesis}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                              <h4 className="font-black text-slate-800 mb-1.5 border-b border-slate-100 pb-1.5 text-[11px] uppercase tracking-wider dark:text-white dark:border-slate-700">
                                Kimlik & İletişim
                              </h4>

                              <form className="space-y-1.5">
                                <div
                                  className={`grid gap-1.5 ${
                                    isSplitMode ? "grid-cols-1" : "grid-cols-2"
                                  }`}
                                >
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">
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
                                      className="w-full p-1 px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                                    />
                                  </div>

                                  <div>
                                    <div className="flex justify-between items-center mb-0.5">
                                      <label className="block text-[9px] font-bold text-slate-500 uppercase">
                                        TC Kimlik / Pasaport No
                                      </label>
                                      <label className="flex items-center gap-1 text-[9px] font-bold text-slate-500 cursor-pointer">
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
                                          className="accent-indigo-600 w-2.5 h-2.5 cursor-pointer"
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
                                            val = val.replace(/\D/g, ""); 
                                          }
                                          setPatientForm({
                                            ...patientForm,
                                            tc: val,
                                          });
                                        }}
                                        className="w-full p-1 px-1.5 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                                      />
                                      {patientForm.tc &&
                                        !patientForm.isForeign && (
                                          <div className="absolute right-2 top-1.5">
                                            {(() => {
                                              const tc = patientForm.tc;
                                              if (tc.length < 11) {
                                                return (
                                                  <i
                                                    className="fa-solid fa-triangle-exclamation text-amber-500 text-[11px]"
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
                                                    className="fa-solid fa-circle-xmark text-rose-500 text-[11px]"
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
                                                    className="fa-solid fa-circle-check text-emerald-500 text-[11px]"
                                                    title="Geçerli TC"
                                                  ></i>
                                                );
                                              }
                                              return (
                                                <i
                                                  className="fa-solid fa-circle-xmark text-rose-500 text-[11px]"
                                                  title="Geçersiz TC Algoritması"
                                                ></i>
                                              );
                                            })()}
                                          </div>
                                        )}
                                      {patientForm.tc &&
                                        patientForm.isForeign && (
                                          <div className="absolute right-2 top-1.5">
                                            <i
                                              className="fa-solid fa-earth-americas text-indigo-400 text-[11px]"
                                              title="Yurt Dışı Hasta Belgesi"
                                            ></i>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>

                                <div
                                  className={`grid gap-1.5 ${
                                    isSplitMode ? "grid-cols-1" : "grid-cols-3"
                                  }`}
                                >
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">
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
                                      className="w-full p-1 px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                                    />
                                  </div>

                                  <div
                                    className={
                                      isSplitMode ? "col-span-1" : "col-span-2"
                                    }
                                  >
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                                      Telefon
                                    </label>

                                    <input
                                      type="tel"
                                      value={patientForm.phone || ""}
                                      placeholder="05XX XXX XX XX"
                                      onChange={(e) => {
                                        let input = e.target.value.replace(
                                          /\D/g,
                                          ""
                                        );
                                        if (
                                          input.length > 0 &&
                                          input[0] !== "0"
                                        )
                                          input = "0" + input;
                                        if (input.length > 11)
                                          input = input.substring(0, 11);

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
                                      className="w-full p-1 px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:text-white dark:border-slate-700 transition-colors"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">
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
                                    className="w-full p-1 px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none dark:bg-slate-900 dark:text-white dark:border-slate-700"
                                  >
                                    <option>Belirtilmemiş</option>
                                    <option>Erkek</option>
                                    <option>Kadın</option>
                                  </select>
                                </div>

                                <div>
                                  <div className="flex justify-between items-center mb-0.5">
                                    <label className="block text-[9px] font-black text-rose-500 uppercase tracking-wider">
                                      Sistemik Hastalık / Anamnez / Alerji
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                                      <input 
                                        type="checkbox" 
                                        checked={patientForm.isEmergency || false} 
                                        onChange={(e) => setPatientForm({...patientForm, isEmergency: e.target.checked})}
                                        className="accent-rose-600 w-2.5 h-2.5 cursor-pointer"
                                      />
                                      <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400">Acil Hasta</span>
                                    </label>
                                  </div>

                                  <textarea
                                    rows="2"
                                    value={patientForm.anamnesis}
                                    onChange={(e) =>
                                      setPatientForm({
                                        ...patientForm,
                                        anamnesis: e.target.value,
                                      })
                                    }
                                    className="w-full p-1.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold text-slate-800 resize-none outline-none focus:border-rose-400 placeholder-slate-400 dark:bg-rose-900/20 dark:text-white dark:border-rose-800/50 transition-colors"
                                    placeholder="Özel bir not veya uyarı girebilirsiniz..."
                                  ></textarea>

                                  {/* Katlanabilir Modern Anamnez Menüsü */}
                                  <details className="group border border-rose-200 dark:border-rose-800/60 rounded-lg bg-white dark:bg-slate-800 mt-1 shadow-sm open:shadow-md transition-all">
                                    <summary className="px-2 py-1 font-bold text-[10px] text-rose-600 dark:text-rose-400 cursor-pointer list-none flex justify-between items-center outline-none select-none hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                                      <span className="flex items-center gap-1">
                                        <i className="fa-solid fa-notes-medical"></i>{" "}
                                        Literatürden Hızlı Ekle
                                      </span>
                                      <i className="fa-solid fa-chevron-down group-open:rotate-180 transition-transform duration-300"></i>
                                    </summary>

                                    <div className="p-1.5 border-t border-rose-100 dark:border-rose-800/50 max-h-[160px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-b-lg">
                                      {Object.entries(ANAMNESIS_CATEGORIES).map(
                                        ([catName, options]) => (
                                          <div key={catName}>
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-200 dark:border-slate-700 pb-0.5">
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
                                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all flex items-center gap-1 ${
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
                                {/* DOSYA MASAÜSTÜ DURUMLARI (KOMPAKT) */}
                                  <div className="col-span-1 sm:col-span-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 mt-1.5">
                                    <h4 className="font-black text-slate-800 mb-1.5 border-b border-slate-100 pb-1 text-[11px] uppercase tracking-wider dark:text-white dark:border-slate-700 flex items-center gap-1">
                                      <i className="fa-solid fa-folder-tree text-indigo-500"></i> Dosya Masası Etiketleri
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                      {/* Acil Durumu */}
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Acil Takip</label>
                                        <select
                                          value={patientForm.folder_acil || ""}
                                          onChange={(e) => setPatientForm({...patientForm, folder_acil: e.target.value})}
                                          className="w-full p-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold outline-none focus:border-rose-500 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800 cursor-pointer"
                                        >
                                          <option value="">Normal (Acil Değil)</option>
                                          <option value="Aktif Acil">🔴 Aktif Acil Durum</option>
                                          <option value="Ağrı Takibi">🟠 Ağrı Takibi</option>
                                          <option value="İlaç Kullanıyor">🟡 İlaç Kullanıyor</option>
                                        </select>
                                      </div>

                                      {/* Lab Durumu */}
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Laboratuvar</label>
                                        <select
                                          value={patientForm.folder_lab || ""}
                                          onChange={(e) => setPatientForm({...patientForm, folder_lab: e.target.value})}
                                          className="w-full p-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-bold outline-none focus:border-purple-500 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 cursor-pointer"
                                        >
                                          <option value="">Lab Süreci Yok</option>
                                          <option value="Ölçü Alınacak">⏳ Ölçü Alınacak</option>
                                          <option value="Laboratuvarda">🧪 Laboratuvarda</option>
                                          <option value="Klinikte (Provaya Hazır)">🏢 Klinikte (Provaya Hazır)</option>
                                        </select>
                                      </div>

                                      {/* Evrak Durumu */}
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Evrak / Belge</label>
                                        <select
                                          value={patientForm.folder_evrak || ""}
                                          onChange={(e) => setPatientForm({...patientForm, folder_evrak: e.target.value})}
                                          className="w-full p-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold outline-none focus:border-slate-500 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 cursor-pointer"
                                        >
                                          <option value="">Evraklar Tam</option>
                                          <option value="Onam Formu Eksik">📄 Onam Formu Eksik</option>
                                          <option value="Röntgen Bekliyor">🦴 Röntgen Bekliyor</option>
                                          <option value="Kimlik/Pasaport Eksik">🪪 Kimlik/Pasaport Eksik</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                              </form>
                            </div>
                          </div>

                          <div className="flex-[2] flex flex-col gap-2">
                            <div className="flex-1 bg-white p-2 rounded-xl border shadow-sm flex flex-col h-[200px] dark:bg-slate-800 dark:border-slate-700">
                              <div className="flex justify-between items-center mb-1 border-b border-slate-100 dark:border-slate-700 pb-1">
                                <h4 className="font-black text-indigo-700 text-[10px] uppercase tracking-wider flex items-center gap-1 dark:text-indigo-400">
                                  <i className="fa-solid fa-calendar-check"></i>{" "}
                                  Planlanan Randevular ({future.length})
                                </h4>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setPendingAptPatient(patientForm);
                                    setIsPatientModalOpen(false);
                                    setActiveTab("calendar");
                                    setTimeout(() => {
                                      showNotification(
                                        "Takvimden uygun bir saate tıklayarak randevuyu oluşturabilirsiniz."
                                      );
                                    }, 300);
                                  }}
                                  className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800 px-1.5 py-0.5 rounded font-bold transition flex items-center gap-1 shadow-sm"
                                >
                                  <i className="fa-solid fa-calendar-plus"></i>{" "}
                                  Takvimden Ekle
                                </button>
                              </div>

                              <div className="flex-1 overflow-y-auto pr-0.5 space-y-1.5 custom-scrollbar">
                                {future.length > 0 ? (
                                  future.map((a, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100 text-[10px] dark:bg-indigo-900/30 dark:border-indigo-800/50 flex flex-col"
                                    >
                                      <div className="flex justify-between items-center mb-0.5">
                                        <span className="font-black text-indigo-900 dark:text-indigo-300 text-[9px]">
                                          <i className="fa-regular fa-clock mr-1"></i>
                                          {a.dateStr} - {a.timeStr}
                                        </span>

                                        {getStatusBadge(a.status)}
                                      </div>

                                      <div className="font-bold text-slate-700 dark:text-slate-300 flex justify-between text-[11px]">
                                        <span className="truncate max-w-[130px]">
                                          {renderTreatmentText(a)}
                                        </span>

                                        <span className="text-indigo-600 dark:text-indigo-400 text-[9px]">
                                          Planlı İle Entegre
                                        </span>
                                      </div>
                                      <div className="text-[9px] font-bold text-indigo-500/80 dark:text-indigo-400/80 mt-1 flex items-center gap-1">
                                        <i className="fa-solid fa-user-doctor"></i> {globalData.systemUsers?.[a.docId]?.displayName || a.docId}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center text-slate-400 font-medium text-[10px] py-4">
                                    Gelecek randevusu yok.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex-1 bg-white p-2 rounded-xl border shadow-sm flex flex-col h-[200px] dark:bg-slate-800 dark:border-slate-700">
                              <h4 className="font-black text-slate-600 mb-1 border-b pb-1 text-[10px] uppercase tracking-wider flex items-center gap-1 dark:text-white dark:border-slate-700">
                                <i className="fa-solid fa-clock-rotate-left"></i>{" "}
                                Geçmiş Randevular ({past.length})
                              </h4>

                              {/* Geçmiş Randevular Zaman Tüneli (Timeline) */}
                              <div className="flex-1 overflow-y-auto pr-1 relative mt-1.5 custom-scrollbar px-1">
                                {past.length > 0 ? (
                                  <div className="relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent dark:before:via-slate-700">
                                    {past.map((a, idx) => (
                                      <div
                                        key={idx}
                                        className="relative flex items-center justify-start group mb-1.5 pl-8"
                                      >
                                        <div className="absolute left-0 flex items-center justify-center w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300 text-slate-500 shadow z-10">
                                          <i
                                            className={`fa-solid ${
                                              a.status === "Geldi"
                                                ? "fa-check text-emerald-500 group-hover:text-white"
                                                : a.status === "Gelmedi"
                                                ? "fa-xmark text-rose-500 group-hover:text-white"
                                                : "fa-calendar-check"
                                            } text-[8px]`}
                                          ></i>
                                        </div>
                                        <div className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 shadow-sm group-hover:shadow-md transition-shadow relative before:absolute before:top-2 before:right-full before:w-2 before:h-0.5 before:bg-slate-200 dark:before:bg-slate-700 group-hover:before:bg-indigo-300">
                                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 gap-1 border-b border-slate-100 dark:border-slate-800 pb-1">
                                            <time className="font-bold text-[9px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1 py-0.5 rounded">
                                              {a.dateStr} • {a.timeStr}
                                            </time>
                                            {getStatusBadge(a.status)}
                                          </div>
                                          <h4 className="font-black text-slate-800 dark:text-white text-[11px] mb-0.5 mt-0.5">
                                            {renderTreatmentText(a)}
                                          </h4>
                                          <div className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                                            <i className="fa-solid fa-user-doctor"></i>{" "}
                                            {globalData.systemUsers?.[a.docId]?.displayName || a.docId}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-4">
                                    <i className="fa-solid fa-clock-rotate-left text-base text-slate-300 dark:text-slate-600 mb-1"></i>
                                    <span className="text-slate-500 dark:text-slate-400 font-bold text-[9px]">
                                      Geçmiş randevu bulunmuyor.
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {patientModalTab === "finance" && (() => {
                        // PROFESYONEL HESAP HAREKETLERİ (LEDGER) MOTORU
                        let ledger = [];
                        let totalTreatment = 0;
                        let totalOriginalBilled = 0; // İndirimsiz orijinal toplam
                        let totalDiscount = 0;
                        let totalPaid = 0;

                        // 1. Tedavileri İşle (Borç ve İndirimler)
                        if (patientForm.plannedTreatments && Array.isArray(patientForm.plannedTreatments)) {
                            patientForm.plannedTreatments.forEach(tx => {
                                if (!tx) return;
                                const price = parseFloat(tx.price) || 0;
                                const origPrice = tx.originalPrice !== undefined ? parseFloat(tx.originalPrice) : price;
                                const discount = origPrice - price;
                                
                                totalTreatment += price;
                                totalOriginalBilled += origPrice;
                                totalDiscount += discount;

                                ledger.push({
                                    id: tx.id,
                                    timestamp: new Date(tx.date).getTime(),
                                    dateStr: new Date(tx.date).toLocaleDateString("tr-TR"),
                                    type: 'treatment',
                                    title: tx.treatment || "Klinik İşlem",
                                    desc: tx.tooth === "Tüm Çene" ? "Tüm Çene" : `Diş: ${tx.tooth || "-"}`,
                                    amount: price,
                                    originalAmount: origPrice,
                                    discountAmount: discount,
                                    isDebit: true,
                                    icon: "fa-stethoscope",
                                    color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400"
                                });
                            });
                        }

                        // 2. Tahsilatları İşle (Alacak/Ödeme)
                        if (patientForm.payments && Array.isArray(patientForm.payments)) {
                            patientForm.payments.forEach(pay => {
                                if (!pay) return;
                                const amt = parseFloat(pay.amount) || 0;
                                totalPaid += amt;
                                
                                ledger.push({
                                    id: pay.id,
                                    timestamp: new Date(pay.date).getTime(),
                                    dateStr: new Date(pay.date).toLocaleDateString("tr-TR"),
                                    type: 'payment',
                                    title: 'Tahsilat / Ödeme',
                                    desc: pay.method || "Nakit",
                                    amount: amt,
                                    originalAmount: amt,
                                    discountAmount: 0,
                                    isDebit: false,
                                    icon: "fa-money-bill-wave",
                                    color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                                });
                            });
                        }

                        // 3. Kronolojik Olarak Sırala ve Yürüyen Bakiye Hesapla (Running Balance)
                        ledger.sort((a, b) => a.timestamp - b.timestamp);
                        
                        let runningBalance = 0;
                        ledger = ledger.map(item => {
                            if (item.isDebit) runningBalance += item.amount;
                            else runningBalance -= item.amount;
                            return { ...item, balance: runningBalance };
                        });
                        
                        const currentBalance = totalTreatment - totalPaid;

                        return (
                        <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50 flex flex-col gap-2 dark:bg-slate-900/50 relative custom-scrollbar">
                          
                          {/* ÜST ÖZET KARTLARI (KÜÇÜLTÜLDÜ) */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 shrink-0">
                             <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                               <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Toplam Tedavi</div>
                               <div className="text-[13px] font-black text-slate-800 dark:text-white flex items-center gap-1">
                                 {totalOriginalBilled > totalTreatment && (
                                    <span className="text-[9px] text-slate-400 line-through decoration-rose-500 font-bold" title="İndirimsiz Orijinal Tutar">{totalOriginalBilled.toLocaleString("tr-TR")} ₺</span>
                                 )}
                                 {totalTreatment.toLocaleString("tr-TR")} ₺
                               </div>
                             </div>
                             <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                               <div className="text-[9px] font-black text-amber-500 uppercase tracking-wider mb-0.5">Uygulanan İndirim</div>
                               <div className="text-[13px] font-black text-amber-600 dark:text-amber-400">{totalDiscount.toLocaleString("tr-TR")} ₺</div>
                             </div>
                             <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                               <div className="text-[9px] font-black text-emerald-500 uppercase tracking-wider mb-0.5">Toplam Tahsilat</div>
                               <div className="text-[13px] font-black text-emerald-600 dark:text-emerald-400">{totalPaid.toLocaleString("tr-TR")} ₺</div>
                             </div>
                             <div className={`p-2 rounded-xl border shadow-sm flex flex-col justify-center ${currentBalance > 0 ? "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800" : "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"}`}>
                               <div className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${currentBalance > 0 ? "text-rose-500" : "text-emerald-500"}`}>{currentBalance > 0 ? "Ödenecek Kalan Bakiye" : "Borç Bulunmuyor"}</div>
                               <div className={`text-[14px] font-black ${currentBalance > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>{currentBalance.toLocaleString("tr-TR")} ₺</div>
                             </div>
                          </div>

                          {/* İLERLEME ÇUBUĞU (KÜÇÜLTÜLDÜ) */}
                          {totalTreatment > 0 && (
                            <div className="px-1 shrink-0 animate-fadeIn">
                              <div className="flex justify-between text-[9px] font-black text-slate-500 mb-1">
                                <span>Tahsilat Oranı</span>
                                <span className="text-emerald-600 dark:text-emerald-400">% {Math.round((totalPaid / totalTreatment) * 100)}</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden shadow-inner flex">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                                  style={{ width: `${Math.min(100, (totalPaid / totalTreatment) * 100)}%` }}
                                >
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ANA KAPSAYICI */}
                          <div className="flex flex-col lg:flex-row gap-2 flex-1 min-h-[300px] overflow-hidden">
                            
                            {/* HESAP HAREKETLERİ TABLOSU */}
                            <div className="flex-[3] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
                              <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
                                <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <i className="fa-solid fa-file-invoice-dollar text-indigo-500"></i> Hesap Hareketleri
                                </h4>
                                <button onClick={() => window.print()} className="text-[9px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-bold hover:bg-slate-50 transition shadow-sm">
                                  <i className="fa-solid fa-print mr-1"></i> Yazdır
                                </button>
                              </div>
                              <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left text-[11px]">
                                  <thead className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[9px] font-black text-slate-400 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                                    <tr>
                                      <th className="p-2 w-20 whitespace-nowrap">Tarih</th>
                                      <th className="p-2">İşlem / Açıklama</th>
                                      <th className="p-2 text-right whitespace-nowrap">Borç (+)</th>
                                      <th className="p-2 text-right whitespace-nowrap">Tahsilat (-)</th>
                                      <th className="p-2 text-right border-l border-slate-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 whitespace-nowrap">Bakiye</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ledger.length > 0 ? ledger.map((item, idx) => (
                                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors group">
                                        <td className="p-2 font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap align-top pt-2.5">{item.dateStr}</td>
                                        <td className="p-2">
                                          <div className="flex items-start gap-1.5">
                                            <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] mt-0.5 border shadow-sm shrink-0 ${item.color}`}>
                                              <i className={`fa-solid ${item.icon}`}></i>
                                            </div>
                                            <div>
                                              <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{item.title}</div>
                                              <div className="text-[9px] font-semibold text-slate-500">{item.desc}</div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="p-2 text-right font-black text-rose-600 dark:text-rose-400 align-middle">
                                          {item.isDebit ? (
                                            <div className="flex flex-col items-end justify-center">
                                              {item.originalAmount > item.amount && (
                                                <span className="text-[9px] text-slate-400 line-through decoration-rose-500 font-bold" title="İndirimsiz Fiyat">
                                                  {item.originalAmount.toLocaleString("tr-TR")} ₺
                                                </span>
                                              )}
                                              <span className="text-[11px]">+{item.amount.toLocaleString("tr-TR")} ₺</span>
                                            </div>
                                          ) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                        </td>
                                        <td className="p-2 text-right font-black text-emerald-600 dark:text-emerald-400 align-middle">
                                          {!item.isDebit ? `-${item.amount.toLocaleString("tr-TR")} ₺` : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                        </td>
                                        <td className="p-2 text-right font-black border-l border-slate-100 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 bg-indigo-50/30 dark:bg-indigo-900/10 align-middle text-[11px]">
                                          {item.balance.toLocaleString("tr-TR")} ₺
                                        </td>
                                      </tr>
                                    )) : (
                                      <tr><td colSpan="5" className="p-4 text-center text-slate-400 font-medium text-[11px] italic"><i className="fa-solid fa-receipt text-2xl block mb-1 opacity-30"></i>Hesap hareketi yok.</td></tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* SAĞ PANEL: HIZLI AKSİYONLAR */}
                            <div className="flex-[1] flex flex-col gap-2 min-w-[220px] overflow-y-auto custom-scrollbar">
                              
                              {/* TAHSİLAT FORMU */}
                              <form onSubmit={handleAddPayment} className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                                <h4 className="font-black text-[11px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1 border-b border-emerald-100 dark:border-emerald-800/50 pb-1.5">
                                  <i className="fa-solid fa-cash-register"></i> Yeni Tahsilat
                                </h4>
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Tutar (₺)</label>
                                    <input type="number" required placeholder="0.00" value={paymentInput} onChange={(e) => setPaymentInput(e.target.value)} className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[13px] font-black text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500 shadow-inner" />
                                    {currentBalance > 0 && (
                                      <div className="text-right mt-1">
                                        <button type="button" onClick={() => setPaymentInput(currentBalance)} className="text-[9px] bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-800 font-bold hover:bg-emerald-100 transition shadow-sm">
                                          Kalanı Kapat ({currentBalance.toLocaleString("tr-TR")} ₺)
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Ödeme Yöntemi</label>
                                    <div className="grid grid-cols-2 gap-1">
                                      {["Nakit", "Kredi Kartı", "Havale", "Diğer"].map((method) => (
                                        <button type="button" key={method} onClick={() => setPaymentMethod(method)} className={`py-1 text-[10px] font-bold rounded-md border transition-all ${paymentMethod === method ? "bg-emerald-600 text-white border-emerald-700 shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
                                          {method}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <button type="submit" className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-black text-[11px] shadow-sm transition-all flex items-center justify-center gap-1 mt-1">
                                    Kaydet <i className="fa-solid fa-check"></i>
                                  </button>
                                </div>
                              </form>

                              {/* İNDİRİM FORMU */}
                              {hasPermission("finance.discount") && (
                                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                                  <h4 className="font-black text-[11px] text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1 border-b border-amber-100 dark:border-amber-800/50 pb-1.5">
                                    <i className="fa-solid fa-percent"></i> İndirim Uygula
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="relative">
                                      <i className="fa-solid fa-percent absolute left-2.5 top-1.5 text-slate-400 text-[11px]"></i>
                                      <input type="number" min="0" max="100" placeholder="Oran (Örn: 15)" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="w-full pl-7 pr-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[12px] font-black text-amber-600 dark:text-amber-500 outline-none focus:border-amber-500 shadow-inner" />
                                    </div>
                                    
                                    {discountPercent > 0 && discountPercent <= 100 && (
                                       <div className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50 flex flex-col gap-1 shadow-sm">
                                          <div className="flex justify-between items-center">
                                            <span>İndirim Tutarı:</span> 
                                            <span className="text-rose-600 dark:text-rose-400 font-black">- {((totalOriginalBilled * discountPercent) / 100).toLocaleString("tr-TR")} ₺</span>
                                          </div>
                                          <div className="flex justify-between items-center border-t border-emerald-200/50 dark:border-emerald-800/50 pt-1 mt-0.5">
                                            <span>Yeni Toplam:</span> 
                                            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">{((totalOriginalBilled * (100 - discountPercent)) / 100).toLocaleString("tr-TR")} ₺</span>
                                          </div>
                                       </div>
                                    )}

                                    <button type="button" onClick={() => {
                                      const discount = parseFloat(discountPercent);
                                      if (isNaN(discount) || discount < 0 || discount > 100) { showNotification("Geçerli bir yüzde girin.", "error"); return; }
                                      showConfirm(discount === 0 ? "İndirimi sıfırlamak istediğinize emin misiniz?" : `Tüm aktif tedavi planlarına %${discount} indirim uygulanacaktır. Onaylıyor musunuz?`, () => {
                                          try {
                                              const multiplier = (100 - discount) / 100;
                                              let updatedPatient = { ...patientForm };
                                              let isPatientUpdated = false;

                                              if (updatedPatient.plannedTreatments && Array.isArray(updatedPatient.plannedTreatments)) {
                                                updatedPatient.plannedTreatments = updatedPatient.plannedTreatments.map(t => {
                                                  if (!t) return t;
                                                  const orig = t.originalPrice !== undefined ? parseFloat(t.originalPrice) : parseFloat(t.price || 0);
                                                  return { ...t, originalPrice: orig, price: orig * multiplier };
                                                });
                                                isPatientUpdated = true;
                                              }

                                              let updatedAppointments = JSON.parse(JSON.stringify(globalData.appointments || {}));
                                              let isAptUpdated = false;

                                              Object.keys(updatedAppointments).forEach(docId => {
                                                if (updatedAppointments[docId]) {
                                                    Object.keys(updatedAppointments[docId]).forEach(aptKey => {
                                                      const apt = updatedAppointments[docId][aptKey];
                                                      if (apt && apt.patientName === patientForm.name && apt.price > 0 && !apt.linkedPlanId) {
                                                        const orig = apt.originalPrice !== undefined ? parseFloat(apt.originalPrice) : parseFloat(apt.price || 0);
                                                        updatedAppointments[docId][aptKey].originalPrice = orig;
                                                        updatedAppointments[docId][aptKey].price = orig * multiplier;
                                                        isAptUpdated = true;
                                                      }
                                                    });
                                                }
                                              });

                                              const newData = { ...globalData };
                                              if (isPatientUpdated) {
                                                newData.patientsDb = { ...(newData.patientsDb || {}), [patientForm.id]: updatedPatient };
                                                setPatientForm(updatedPatient);
                                              }
                                              if (isAptUpdated) { newData.appointments = updatedAppointments; }

                                              if (isPatientUpdated || isAptUpdated) {
                                                saveGlobalData(newData).then(() => { showNotification(discount === 0 ? "İndirim sıfırlandı." : `%${discount} indirim uygulandı.`, "success"); }).catch(err => { console.error(err); showNotification("Kayıt sırasında hata oluştu.", "error"); });
                                              } else { showNotification("İndirim uygulanacak işlem bulunamadı.", "error"); }
                                              setDiscountPercent("");
                                          } catch (e) { showNotification("Hesaplama hatası.", "error"); }
                                      });
                                    }} className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-black text-[11px] shadow-sm transition-all flex items-center justify-center gap-1">
                                      İndirimi Uygula
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })()}

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
                              className="flex-1 overflow-y-auto p-2 bg-slate-50 flex flex-col gap-1.5 relative dark:bg-slate-900/50 print:block print:w-full print:bg-white print:p-0"
                            >
                              {/* YENİ DÜZELTME: SADECE iOS/iPad (Safari) İÇİN ÖZEL A4 YAZDIRMA KALIBI */}
                              <style type="text/css" media="print">
                                {`
                                  @supports (-webkit-touch-callout: none) {
                                    html, body, #root, .h-screen, .overflow-hidden {
                                      height: auto !important;
                                      min-height: auto !important;
                                      max-height: none !important;
                                      overflow: visible !important;
                                      display: block !important;
                                      position: static !important;
                                    }
                                    body * { visibility: hidden; }
                                    #print-plan-area, #print-plan-area * { visibility: visible; }
                                    #print-plan-area {
                                      position: absolute !important;
                                      left: 0 !important;
                                      top: 0 !important;
                                      right: 0 !important;
                                      width: 100% !important;
                                      max-width: 100% !important;
                                      height: auto !important;
                                      overflow: visible !important;
                                      display: block !important;
                                      padding: 0 !important;
                                      margin: 0 !important;
                                      box-sizing: border-box !important;
                                      z-index: 999999 !important;
                                      -webkit-text-size-adjust: 100% !important;
                                    }
                                    .no-print { display: none !important; }
                                  }
                                `}
                              </style>

                              {/* --- ARAÇ ÇUBUĞU (Yazdırılmaz) --- */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm no-print gap-1 shrink-0">
                                <div>
                                  <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-1 text-[13px]">
                                    <i className="fa-solid fa-file-signature text-indigo-500"></i>
                                    Tedavi Planı ve Çıktı Alma
                                  </h3>
                                  <p className="text-[10px] text-slate-500 font-medium">
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
                                  className="bg-indigo-600 text-white px-2 py-1.5 rounded-lg font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-1 text-[11px] w-full sm:w-auto justify-center"
                                >
                                  <i className="fa-solid fa-print"></i> Planı Yazdır
                                </button>
                              </div>

                              {/* --- YAZDIRMA KLİNİK ANTETİ (Gizli, Sadece Baskıda Görünür) --- */}
                              <div className="hidden print-only mb-2 border-b-2 border-black pb-2">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex flex-col gap-0.5">
                                    <h1 className="text-lg font-black uppercase tracking-wider flex items-center text-black leading-none">
                                      <i className="fa-solid fa-tooth text-gray-300 mr-1.5 text-lg"></i>
                                      {settings?.klinik?.ad ? settings.klinik.ad.toUpperCase() : "KLİNİK RANDEVU"}
                                    </h1>
                                    {/* Ayarlardan gelen Klinik Telefon Numarası (Güncellenmiş Görünüm) */}
                                    {settings?.klinik?.telefon && (
                                      <div className="text-[12px] font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                                        <i className="fa-solid fa-phone text-gray-500"></i> Tel: {settings.klinik.telefon}
                                      </div>
                                    )}
                                    <h2 className="text-[11px] font-bold text-gray-500 mt-1">Tedavi Planı ve Bilgilendirme Formu</h2>
                                  </div>
                                  <div className="text-right text-[10px] font-semibold text-gray-600 mt-1">
                                    <p>Tarih: {new Date().toLocaleDateString("tr-TR")}</p>
                                    <p>Hekim: {currentUserProfile?.name || globalData.doctorProfiles?.[currentUser]?.name || currentUser}</p>
                                  </div>
                                </div>
                                <div className="bg-gray-50 border border-gray-300 p-1.5 rounded-lg flex justify-between items-center text-[10px]">
                                  <div>
                                    <span className="font-black text-gray-500 uppercase text-[8px] block">Hasta Adı / Kodu</span>
                                    <span className="font-bold text-[11px] text-black">{patientForm.name} <span className="text-gray-500 ml-1">#{patientForm.patientCode || 'YENİ'}</span></span>
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
                                dynamicPricingCategories={DYNAMIC_PRICING_CATEGORIES}
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
                              <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col no-print shrink-0">
                                <div className="flex flex-wrap sm:flex-nowrap justify-between items-center mb-1.5 border-b border-slate-100 dark:border-slate-700 pb-1.5 gap-1">
                                  <h3 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1">
                                    <span className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 w-4 h-4 rounded-md flex items-center justify-center text-[10px]">1</span>
                                    İşlem Türü Seçin
                                  </h3>
                                  {activePlanTreatment && (
                                    <div className="hidden sm:flex bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm items-center gap-1">
                                      <i className="fa-solid fa-check-circle"></i> Seçili İşlem: {activePlanTreatment}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={handleWholeJawTreatment}
                                    className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition border border-indigo-100 dark:border-indigo-800 flex items-center gap-1 shadow-sm"
                                  >
                                    <i className="fa-solid fa-teeth-open"></i> Tüm Çeneye Uygula
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 max-h-[180px] overflow-y-auto custom-scrollbar p-0.5">
                                  {Object.entries(DYNAMIC_PRICING_CATEGORIES || {}).map(([catName, data]) => (
                                    <div key={catName} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-1.5 border border-slate-100 dark:border-slate-800 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
                                      <h4 className={`text-[10px] font-black uppercase tracking-wider mb-1.5 flex items-center gap-1 ${data.color}`}>
                                        <i className={`fa-solid ${data.icon}`}></i> {catName}
                                      </h4>
                                      <div className="flex flex-col gap-1 flex-1">
                                        {data.items.map((tx) => {
                                          // YENİ: ZIRHLI PATRON FİYAT OKUYUCU (Asistanın ekranına kliniğin güncel fiyatlarını basar)
                                          const ownerId = typeof getClinicOwnerId === "function" ? getClinicOwnerId() : currentUser;
                                          const basePricing = typeof globalData.pricingDb === "object" && globalData.pricingDb["Genel Muayene"] ? globalData.pricingDb : DEFAULT_PRICING;
                                          const safePricing = { ...basePricing, ...(globalData.pricingDb?.[ownerId] || {}) };
                                          
                                          const txPrice = safePricing[tx] !== undefined ? parseFloat(safePricing[tx]) : 0;
                                          const isSelected = activePlanTreatment === tx;
                                          
                                          return (
                                            <button
                                              key={tx}
                                              type="button"
                                              onClick={(e) => { e.preventDefault(); setActivePlanTreatment(tx); }}
                                              className={`text-left px-2 py-1.5 rounded-md text-[10px] font-bold transition-all flex justify-between items-center w-full ${
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
                                <div className="p-1.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                                  <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                    <span className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 w-4 h-4 rounded-md flex items-center justify-center text-[10px]">2</span>
                                    Planlanan Tedavi Tablosu
                                  </h4>
                                  <div className="text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 px-2 py-0.5 rounded-md shadow-sm">
                                    Toplam: {patientForm.plannedTreatments?.reduce((sum, tx) => sum + (parseFloat(tx.price) || 0), 0).toLocaleString("tr-TR")} ₺
                                  </div>
                                </div>

                                <div className="overflow-x-auto w-full max-h-[200px] overflow-y-auto custom-scrollbar">
                                  <table className="w-full text-left text-[11px]">
                                    <thead className="text-[9px] text-slate-400 uppercase font-black bg-white dark:bg-slate-800 border-b dark:border-slate-700 sticky top-0 z-10">
                                      <tr>
                                        <th className="px-2 py-1">Tarih</th>
                                        <th className="px-2 py-1">Diş/Bölge</th>
                                        <th className="px-2 py-1">İşlem Türü</th>
                                        <th className="px-2 py-1 text-right">Ücret</th>
                                        <th className="px-2 py-1 text-center">Sil</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(patientForm.plannedTreatments || []).length > 0 ? (
                                        patientForm.plannedTreatments.map((tx) => (
                                          <tr key={tx.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                            <td className="px-2 py-1 font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap text-[10px]">
                                              {new Date(tx.date).toLocaleDateString("tr-TR")}
                                            </td>
                                            <td className="px-2 py-1 whitespace-nowrap">
                                              <span className="font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px] border border-indigo-100 dark:border-indigo-800/50">
                                                {tx.tooth === "Tüm Çene" ? "Tüm Çene" : `Diş ${tx.tooth}`}
                                              </span>
                                            </td>
                                            <td className="px-2 py-1 font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                                              {tx.treatment}
                                            </td>
                                            <td className="px-2 py-1 text-right whitespace-nowrap">
                                              {editingTxId === tx.id ? (
                                                <div className="flex items-center justify-end gap-1">
                                                  <input
                                                    type="number"
                                                    value={editingTxPrice}
                                                    onChange={(e) => setEditingTxPrice(e.target.value)}
                                                    className="w-14 p-1 border border-slate-300 rounded text-right text-[10px] font-bold outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                                                    autoFocus
                                                  />
                                                  <button onClick={() => handleUpdateTxPrice(tx.id, editingTxPrice, true, tx.docId)} className="bg-emerald-500 text-white w-5 h-5 rounded flex items-center justify-center hover:bg-emerald-600 shadow-sm">
                                                    <i className="fa-solid fa-check text-[9px]"></i>
                                                  </button>
                                                </div>
                                              ) : (
                                              <div className="font-black text-slate-800 dark:text-white flex items-center justify-end gap-1">
                                                {tx.originalPrice !== undefined && tx.originalPrice > tx.price && (
                                                  <span className="text-[9px] text-slate-400 line-through decoration-rose-500" title="İndirimsiz Fiyat">
                                                    {parseFloat(tx.originalPrice).toLocaleString("tr-TR")} ₺
                                                  </span>
                                                )}
                                                <span className="text-[11px]">{parseFloat(tx.price).toLocaleString("tr-TR")} ₺</span>
                                                {hasPermission("finance.discount") && (
                                                  <button onClick={() => { setEditingTxId(tx.id); setEditingTxPrice(tx.price); }} className="text-slate-300 hover:text-indigo-500 dark:text-slate-600 dark:hover:text-indigo-400 transition-colors" title="Ücreti Düzenle">
                                                    <i className="fa-solid fa-pen text-[9px]"></i>
                                                  </button>
                                                )}
                                              </div>
                                              )}
                                            </td>
                                            <td className="px-2 py-1 text-center flex justify-center items-center gap-1">
                                              {tx.isCompleted ? (
                                                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-black flex items-center gap-0.5">
                                                  <i className="fa-solid fa-check"></i> Bitti
                                                </span>
                                              ) : (
                                                <button
                                                  onClick={() => {
                                                    showConfirm(`"${tx.treatment}" işlemini tamamlandı olarak işaretlemek istiyor musunuz? İşlem cirosu hekime yansıyacaktır.`, () => {
                                                      const updatedPlanned = patientForm.plannedTreatments.map(t => 
                                                         t.id === tx.id ? { ...t, isCompleted: true, completedAt: Date.now(), completedBy: currentUser } : t
                                                      );
                                                      
                                                      const updatedPatient = { ...patientForm, plannedTreatments: updatedPlanned };
                                                      setPatientForm(updatedPatient);
                                                      
                                                      saveGlobalData({
                                                         ...globalData,
                                                         patientsDb: { ...globalData.patientsDb, [patientForm.id]: updatedPatient }
                                                      }).then(() => showNotification("İşlem tamamlandı olarak işaretlendi.", "success"));
                                                    });
                                                  }}
                                                  className="w-5 h-5 rounded bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white dark:bg-slate-800 dark:border-emerald-900/30 transition-all flex items-center justify-center shadow-sm"
                                                  title="Tamamla ve Ciroya Ekle"
                                                >
                                                  <i className="fa-solid fa-check text-[9px]"></i>
                                                </button>
                                              )}
                                              
                                              {/* EKSİK OLAN PARANTEZ KAPATMASI BURAYA EKLENDİ */}
                                              {!tx.isCompleted && (
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
                                                  className="w-5 h-5 rounded bg-white border border-rose-100 text-rose-400 hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:border-rose-900/30 dark:hover:bg-rose-600 transition-all flex items-center justify-center shadow-sm"
                                                  title="Sil"
                                                >
                                                  <i className="fa-solid fa-trash-can text-[9px]"></i>
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan="5" className="text-center py-6 text-slate-400 text-[11px] font-medium">
                                            <i className="fa-solid fa-tooth text-[14px] mb-1 block opacity-50"></i>
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
                        <div className="flex-1 overflow-y-auto p-2 lg:p-2 bg-slate-50 flex flex-col gap-1.5 relative dark:bg-slate-900/50">
                          
                          {/* YENİ: A4 Tam Uyumlu Yazdırma Alanı (Sadece Yazdırmada Çıkar) */}
                          <div className="hidden print:block print-only-block w-full text-black bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
                            {/* Klinik & Hasta Başlığı */}
                            <div className="border-b-2 border-slate-900 pb-3 mb-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h1 className="text-xl font-black uppercase tracking-wide text-black">
                                    {settings?.klinik?.ad || "KLİNİK YÖNETİM"}
                                  </h1>
                                  <h2 className="text-[10px] font-bold text-slate-700 tracking-wider uppercase mt-0.5">
                                    HASTA EPİKRİZ VE KLİNİK GEÇMİŞ RAPORU
                                  </h2>
                                </div>
                                <div className="text-right text-[9px] font-semibold text-slate-600">
                                  <div><b>Rapor Tarihi:</b> {new Date().toLocaleDateString("tr-TR")}</div>
                                  <div><b>Hekim:</b> {globalData.doctorProfiles?.[currentUser]?.name || currentUser}</div>
                                </div>
                              </div>

                              {/* Hasta Bilgi Kartı */}
                              <div className="mt-3 p-2 bg-slate-100 border border-slate-300 rounded grid grid-cols-3 gap-2 text-[10px]">
                                <div>
                                  <span className="text-[8px] font-black uppercase text-slate-500 block">Hasta Adı Soyadı</span>
                                  <span className="font-bold text-black text-[11px]">{patientForm.name}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-black uppercase text-slate-500 block">T.C. / Pasaport / Tel</span>
                                  <span className="font-bold text-black">{patientForm.tc || "TC Yok"} • {patientForm.phone || "-"}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-black uppercase text-slate-500 block">Anamnez / Sistemik Durum</span>
                                  <span className="font-bold text-rose-700">{patientForm.anamnesis || "Kayıtlı risk yok"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Epikriz Tablosu */}
                            <table className="w-full text-left border-collapse border border-slate-400 text-[9px]">
                              <thead>
                                <tr className="bg-slate-200 text-black font-black uppercase">
                                  <th className="border border-slate-400 p-1 w-20">Tarih / Saat</th>
                                  <th className="border border-slate-400 p-1 w-24">Hekim</th>
                                  <th className="border border-slate-400 p-1 w-20">Ziyaret Türü</th>
                                  <th className="border border-slate-400 p-1">Uygulanan Tedavi, Tanı ve Klinik Notlar</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(patientForm.clinicalHistory || []).length > 0 ? (
                                  patientForm.clinicalHistory.map((h, idx) => (
                                    <tr key={h.id || idx} className="border-b border-slate-300">
                                      <td className="border border-slate-300 p-1 font-bold align-top whitespace-nowrap">
                                        {h.date}<br />
                                        <span className="text-slate-600 font-normal">{h.time}</span>
                                      </td>
                                      <td className="border border-slate-300 p-1 font-semibold align-top">
                                        {globalData.systemUsers?.[h.doctorId]?.displayName || h.doctorName}
                                      </td>
                                      <td className="border border-slate-300 p-1 font-semibold align-top">
                                        {h.visitType || "Tedavi"}
                                      </td>
                                      <td className="border border-slate-300 p-1 align-top">
                                        <div className="font-black text-black text-[10px]">
                                          {h.treatment} {h.selectedTeeth?.length > 0 && `(Diş: ${Array.isArray(h.selectedTeeth) ? h.selectedTeeth.join(", ") : h.selectedTeeth})`}
                                        </div>
                                        {h.complaint && (
                                          <div className="mt-0.5 text-slate-700"><b>Şikayet:</b> {h.complaint}</div>
                                        )}
                                        {h.diagnosis && (
                                          <div className="mt-0.5 text-slate-700"><b>Bulgu & Tanı:</b> {h.diagnosis}</div>
                                        )}
                                        {h.procedureNotes && (
                                          <div className="mt-0.5 text-slate-700"><b>Prosedür Notu:</b> {h.procedureNotes}</div>
                                        )}
                                        {h.anesthesia && (
                                          <div className="mt-0.5 text-slate-700"><b>Materyal/Anestezi:</b> {h.anesthesia}</div>
                                        )}
                                        {h.prescription && (
                                          <div className="mt-0.5 text-slate-700"><b>Reçete / Öneri:</b> {h.prescription}</div>
                                        )}
                                        {h.nextAppointmentDate && (
                                          <div className="mt-0.5 text-indigo-900 font-bold"><b>Sonraki Kontrol:</b> {h.nextAppointmentDate}</div>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="4" className="border border-slate-300 p-2 text-center italic text-slate-500">
                                      Kayıtlı klinik geçmiş bulunamadı.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>

                            {/* Alt Kaşe & İmza Alanı */}
                            <div className="mt-6 pt-3 border-t border-slate-300 flex justify-between items-end text-[9px]">
                              <div>
                                <span className="text-[8px] text-slate-500 uppercase block">Not:</span>
                                <span>Bu belge klinik randevu ve takip sistemi üzerinden otomatik üretilmiştir.</span>
                              </div>
                              <div className="text-center min-w-[140px]">
                                <div className="font-bold text-black">{globalData.doctorProfiles?.[currentUser]?.name || currentUser}</div>
                                <div className="text-[9px] text-slate-600">{globalData.doctorProfiles?.[currentUser]?.title || "Diş Hekimi"}</div>
                                <div className="mt-5 border-b border-black w-28 mx-auto"></div>
                                <div className="text-[8px] text-slate-500 mt-1">İmza / Kaşe</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm no-print gap-1 shrink-0">
                            <div>
                              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-1 text-[13px]">
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
                                className="flex-1 sm:flex-none bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 px-2 py-1.5 rounded-lg font-bold shadow-sm hover:bg-slate-200 transition-all flex items-center gap-1 justify-center text-[11px]"
                              >
                                <i className="fa-solid fa-print"></i> Yazdır
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsAddHistoryModalOpen(true)}
                                className="flex-1 sm:flex-none bg-indigo-600 text-white px-2 py-1.5 rounded-lg font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-1 justify-center text-[11px]"
                              >
                                <i className="fa-solid fa-plus"></i> Yeni Kayıt
                              </button>
                            </div>
                          </div>

                          {/* Filtre ve Arama Alanı */}
                          <div className="flex gap-1 flex-wrap no-print">
                            <div className="relative flex-1 min-w-[140px]">
                              <i className="fa-solid fa-search absolute left-2.5 top-1.5 text-slate-400 text-[10px]"></i>
                              <input
                                type="text"
                                placeholder="İşlem, Diş, Tanı ara..."
                                value={historySearchQuery}
                                onChange={(e) => setHistorySearchQuery(e.target.value)}
                                className="w-full pl-7 pr-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold outline-none focus:border-indigo-500 shadow-sm dark:text-white"
                              />
                            </div>
                            <select
                              value={historyFilterDoc}
                              onChange={(e) => setHistoryFilterDoc(e.target.value)}
                              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold outline-none shadow-sm dark:text-white"
                            >
                              <option value="all">Tüm Hekimler</option>
                              {allDoctors.map(doc => (
                                <option key={doc} value={doc}>{globalData.systemUsers?.[doc]?.displayName || doc}</option>
                              ))}
                            </select>
                          </div>

                          {/* Timeline Görünümü */}
                          <div className="flex-1 overflow-y-auto no-print pr-1 relative mt-1 custom-scrollbar">
                            {(() => {
                              let historyData = [...(patientForm.clinicalHistory || [])]; 
                              
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
                                return parseDate(b.date, b.time) - parseDate(a.date, a.time); 
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
                                <div className="text-center py-6 text-slate-400 text-[11px] font-medium bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                                  <i className="fa-solid fa-notes-medical text-base mb-1 text-slate-300 dark:text-slate-600 block"></i>
                                  Kayıtlı klinik geçmiş bulunmuyor.
                                </div>
                              );

                              return (
                                <div className="relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-transparent">
                                  {historyData.map((h, index) => (
                                    <div key={h.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-1.5">
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-50 dark:border-slate-900 bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 absolute left-0 md:left-1/2 -translate-x-0 cursor-pointer hover:scale-110 transition-transform"
                                           onClick={() => { setSelectedHistoryRecord(h); setIsHistoryDetailModalOpen(true); }}>
                                        <i className="fa-solid fa-stethoscope text-[9px]"></i>
                                      </div>
                                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-auto md:ml-0 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
                                           onClick={() => { setSelectedHistoryRecord(h); setIsHistoryDetailModalOpen(true); }}>
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="font-black text-indigo-600 dark:text-indigo-400 text-[9px] bg-indigo-50 dark:bg-indigo-900/30 px-1 py-0.5 rounded">
                                            {h.date} • {h.time}
                                          </span>
                                          <span className="text-[8px] font-bold text-slate-500 border border-slate-200 dark:border-slate-600 px-1 py-0.5 rounded">
                                            {h.visitType}
                                          </span>
                                        </div>
                                        <h4 className="font-black text-[11px] text-slate-800 dark:text-white mb-1">{h.treatment}</h4>
                                        <div className="text-[9px] text-slate-500 dark:text-slate-400 flex flex-col gap-0.5">
                                          <div className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
                                            <i className="fa-solid fa-user-doctor w-3 text-center"></i> {globalData.systemUsers?.[h.doctorId]?.displayName || h.doctorName}
                                          </div>
                                          {h.selectedTeeth?.length > 0 && (
                                            <div className="flex items-center gap-1">
                                              <i className="fa-solid fa-tooth w-3 text-center"></i> Dişler: {h.selectedTeeth.join(" • ")}
                                            </div>
                                          )}
                                          {h.diagnosis && (
                                            <div className="flex items-start gap-1 mt-0.5 bg-slate-50 dark:bg-slate-900 p-1 rounded border border-slate-100 dark:border-slate-700">
                                              <i className="fa-solid fa-notes-medical w-3 text-center text-rose-400 mt-0.5"></i> <span className="line-clamp-2 italic">{h.diagnosis}</span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* YENİ: DÜZENLE BUTONU İBARESİ */}
                                        <div className="mt-1.5 text-right">
                                            <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 transition">
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
                                    {allDoctors.map(doc => (<option key={doc} value={doc}>{globalData.systemUsers?.[doc]?.displayName || doc}</option>))}
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
                              {/* YENİ: Bekleyen Planlı İşlemleri Listele ve Tamamla */}
                              {(patientForm.plannedTreatments || []).filter(t => !t.isCompleted).length > 0 && (
                                <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-2 rounded-xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm mb-2">
                                  <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1.5 flex items-center gap-1">
                                    <i className="fa-solid fa-list-check"></i> Planlanan İşlemlerden Tamamla
                                  </label>
                                  <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                    {(patientForm.plannedTreatments || []).filter(t => !t.isCompleted).map((tx, idx) => (
                                      <label key={idx} className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors">
                                        <input type="checkbox" onChange={(e) => {
                                           let currentSelected = newHistoryForm.completedPlanIds || [];
                                           if (e.target.checked) currentSelected.push(tx.id);
                                           else currentSelected = currentSelected.filter(id => id !== tx.id);
                                           
                                           // Seçileni otomatik olarak alttaki metin kutusuna yazdır
                                           const txText = `${tx.treatment} (Diş: ${tx.tooth})`;
                                           let newTreatmentText = newHistoryForm.treatment || "";
                                           if (e.target.checked) {
                                              newTreatmentText = newTreatmentText ? newTreatmentText + ", " + txText : txText;
                                           } else {
                                              newTreatmentText = newTreatmentText.replace(", " + txText, "").replace(txText + ", ", "").replace(txText, "");
                                           }
                                           setNewHistoryForm({...newHistoryForm, completedPlanIds: currentSelected, treatment: newTreatmentText});
                                        }} className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer" />
                                        <span className="flex-1 truncate">{tx.treatment}</span>
                                        <span className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded">{tx.tooth}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
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
                                
                                let updatedAppointments = JSON.parse(JSON.stringify(globalData.appointments || {}));
                                let updatedPlanned = JSON.parse(JSON.stringify(patientForm.plannedTreatments || []));
                                let isAptUpdated = false;
                                const docId = selectedHistoryRecord.doctorId || currentUser;

                                const completedIds = selectedHistoryRecord.completedPlanIds || [];
                                
                                updatedPlanned = updatedPlanned.map((tx) => {
                                    // SADECE bu modalda seçilenleri tamamlandı yap, 
                                    // seçilmeyen ama daha önce bu geçmiş kaydında tamamlananları geri al! Diğer geçmiş kayıtlarını elleme!
                                    if (completedIds.includes(tx.id)) {
                                        if (!tx.isCompleted) {
                                            return { ...tx, isCompleted: true, completedAt: Date.now(), completedBy: docId, historyId: selectedHistoryRecord.id };
                                        }
                                    } else if (tx.historyId === selectedHistoryRecord.id) {
                                        return { ...tx, isCompleted: false, completedAt: null, completedBy: null, historyId: null };
                                    }
                                    return tx;
                                });

                                if (completedIds.length > 0) {
                                    Object.keys(updatedAppointments).forEach(docId => {
                                        Object.keys(updatedAppointments[docId]).forEach(aptKey => {
                                            const apt = updatedAppointments[docId][aptKey];
                                            if (apt.patientName === patientForm.name && apt.selectedTreatments) {
                                                const hasCompletedPlan = apt.selectedTreatments.some(t => {
                                                    return completedIds.some(cId => {
                                                        const p = updatedPlanned.find(up => up.id === cId);
                                                        return p && p.treatment === t.treatment && p.tooth === t.tooth;
                                                    });
                                                });
                                                if (hasCompletedPlan && apt.status !== "Geldi") {
                                                    updatedAppointments[docId][aptKey].status = "Geldi";
                                                    isAptUpdated = true;
                                                }
                                            }
                                        });
                                    });
                                }

                                const updatedHistory = patientForm.clinicalHistory.map(h => 
                                  h.id === selectedHistoryRecord.id ? selectedHistoryRecord : h
                                );
                                const updatedPatient = { ...patientForm, plannedTreatments: updatedPlanned, clinicalHistory: updatedHistory };
                                
                                setPatientForm(updatedPatient);
                                saveGlobalData({ 
                                    ...globalData, 
                                    appointments: isAptUpdated ? updatedAppointments : globalData.appointments,
                                    patientsDb: { ...globalData.patientsDb, [patientForm.id]: updatedPatient } 
                                });
                                setIsHistoryDetailModalOpen(false);
                                showNotification("Klinik detaylar başarıyla kaydedildi ve işlemler ciroya eklendi.");
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
                              
                              {/* AKILLI CHECKBOX LİSTESİ: Sadece Tamamlanmamışlar ve BU KAYITTA tamamlanmışlar görünür */}
                              {(() => {
                                  const availableTxs = (patientForm.plannedTreatments || []).filter(t => 
                                      !t.isCompleted || t.historyId === selectedHistoryRecord.id || (selectedHistoryRecord.completedPlanIds || []).includes(t.id)
                                  );
                                  if (availableTxs.length === 0) return null;
                                  return (
                                      <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-2 rounded-xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm mb-2">
                                          <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1.5 flex items-center gap-1">
                                              <i className="fa-solid fa-list-check"></i> Planlanan İşlemlerden Tamamla
                                          </label>
                                          <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                              {availableTxs.map((tx, idx) => {
                                                  const isChecked = (selectedHistoryRecord.completedPlanIds || []).includes(tx.id);
                                                  return (
                                                      <label key={idx} className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors">
                                                          <input type="checkbox" checked={isChecked} onChange={(e) => {
                                                              let currentSelected = [...(selectedHistoryRecord.completedPlanIds || [])];
                                                              if (e.target.checked) currentSelected.push(tx.id);
                                                              else currentSelected = currentSelected.filter(id => id !== tx.id);
                                                              
                                                              const txText = `${tx.treatment} (Diş: ${tx.tooth})`;
                                                              let newTreatmentText = selectedHistoryRecord.treatment || "";
                                                              if (e.target.checked) {
                                                                  newTreatmentText = newTreatmentText ? newTreatmentText + ", " + txText : txText;
                                                              } else {
                                                                  // Akıllı metin temizleyici (Fazla virgülleri engeller)
                                                                  newTreatmentText = newTreatmentText.replace(", " + txText, "").replace(txText + ", ", "").replace(txText, "").replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
                                                              }
                                                              setSelectedHistoryRecord({...selectedHistoryRecord, completedPlanIds: currentSelected, treatment: newTreatmentText});
                                                          }} className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer" />
                                                          <span className="flex-1 truncate">{tx.treatment}</span>
                                                          <span className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded">{tx.tooth}</span>
                                                      </label>
                                                  );
                                              })}
                                          </div>
                                      </div>
                                  );
                              })()}

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