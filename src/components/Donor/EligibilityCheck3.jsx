"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, CheckCircle, XCircle, AlertCircle, Heart, Printer, FileText, X, Eye } from "lucide-react"

const allQuestions = [
  {
    section: "SECTION I: CONDITION",
    icon: AlertCircle,
    bordered: true,
    items: [
      {
        id: 1,
        en: "Have you within the last eighteen (18) months had any of the following: high blood pressure, night sweats, unexplained fever, unexplained weight loss, persistent diarrhea?",
        tl: "Sa nakaraang labing-walong (18) buwan nagkaroon ka ba ng mga sumusunod: alta presyon, pagpapawis tuwing gabi, hindi maipaliwanag na lagnat, madalas na pagtatae, malaking kulani?",
        mustBeNo: true,
        reason:
          "Recent symptoms such as high blood pressure, unexplained fever, or diarrhea may indicate underlying conditions that are not safe for blood donation.",
      },
    ],
  },
  {
    section: "SECTION II: In the past twelve (12) months have you ever had/ever been:",
    subtitleTagalog: "Sa nakaraang labing dalawa (12) buwan ikaw ba ay:",
    bordered: true,
    items: [
      {
        id: 2,
        en: "Any of the following: malaria, hepatitis, jaundice, syphilis, chicken pox, shingles, cold sores, serious accident",
        tl: "",
        mustBeNo: true,
        reason: "These are infectious or serious conditions that pose a risk during blood donation.",
      },
      {
        id: 3,
        en: "Under the doctor's care or had a major illness or surgery?",
        tl: "Nasa pangangalaga ng doktor o nagkaroon ng malubhang karamdaman o operasyon?",
        mustBeNo: true,
        reason: "Medical supervision or major illness indicates potential health risks for donation.",
      },
      {
        id: 4,
        en: "Taken prohibited drugs or cocaine through your nose?",
        tl: 'Nakagamit ng ipinagbabawal na gamot o kaya ay nakasinghot ng "cocaine"?',
        mustBeNo: true,
        reason: "Illegal drug use increases risk of bloodborne diseases.",
      },
      {
        id: 5,
        en: "Received blood taken clotting factors concentrates for a bleeding problem such as hemophilia and had an organ or tissue transplant or graft?",
        tl: "Ikaw ba ay nasalinan ng dugo dahil sa hemophilia at naoperahan o nabigyan ng bahagi ng katawan na galing sa ibang tao?",
        mustBeNo: true,
        reason: "This history could suggest potential for bloodborne disease transmission.",
      },
      {
        id: 6,
        en: "A tattoo applied, ear piercing, acupuncture, accidental needle-stick or has come in contact with someone else's blood?",
        tl: "Nagpalagay ng tattoo, nagbutas ng tenga, nagpa-akupunkture, naturukan ng karayom ng hindi sinasadya o nadikitan ng dugo ng ibang tao?",
        mustBeNo: true,
        reason:
          "Recent exposure to needles or blood increases infection risk unless done by a licensed professional over 12 months ago.",
      },
      {
        id: 7,
        en: "Engaged in homosexual activity or received an injection other than proper medical supervision?",
        tl: "Nagkaroon ng karanasan na makipagtalik sa kapwa mong kauri at sa taong naturukan ng gamot na walang pahintulot ng doktor?",
        mustBeNo: true,
        reason: "Unsupervised injections or high-risk sexual activity may pose transmission risk of infections.",
      },
      {
        id: 8,
        en: "In personal contact with anyone who had hepatitis?",
        tl: "May nakasama sa bahay o taong lagi mong nakahalubilo na may sakit sa atay o paninilaw ng mata?",
        mustBeNo: true,
        reason: "Close contact with hepatitis patients is a risk factor for transmission.",
      },
      {
        id: 9,
        en: "Given money or drugs to anyone to have sex with you or had sex with anyone who has taken money drugs for sex?",
        tl: "Nagbayad kahit kanino para lang makipagtalik sa iyo o nakipagtalik kahit kanino na tumanggap ng pera o ng ipinagbabawal na gamot para lang makipagtalik sa isang tao?",
        mustBeNo: true,
        reason: "This poses a high risk for sexually transmitted infections.",
      },
      {
        id: 10,
        en: "Had a sexual partner who is bisexual or is a medically unsupervised user of intravenous drug or who has taken clotting factor concentrates for bleeding problem or who has AIDS or has had a positive test for the AIDS virus?",
        tl: "Nagkaroon ka ba ng partner na nakipagtalik sa kapwa niya kauri at gumamit ng gamot ng walang pahintulot ng duktor, o positibo sa AIDS test?",
        mustBeNo: true,
        reason: "Partner's high-risk history may increase risk of infections.",
      },
      {
        id: 11,
        en: "To malaria endemic areas like Palawan and Mindoro.",
        tl: "Nakapunta sa lugar na laganap ang malaria katulad ng Palawan at Mindoro?",
        mustBeNo: true,
        reason: "Travel to malaria-endemic areas may risk parasite transmission.",
      },
      {
        id: 12,
        en: "In jail or prison?",
        tl: "Nakulong o nabilanggo?",
        mustBeNo: true,
        reason: "Incarceration history is considered a risk for certain infections.",
      },
    ],
  },
  {
    section: "SECTION III:",
    bordered: true,
    items: [
      {
        id: 1,
        en: "In the past four (4) weeks have you taken any medications such as Isotretinoin (Accutane) or finasteride (Proscar), etretinate (Tegison) for psoriasis, Feldence, aspirin or other medicines?",
        tl: "Sa nakaraang apat (4) na linggo ikaw ba ay nakainum ng Isotretinoin (Accutane) o finasteride (Proscar), etretinate (Tegison) para sa psoriasis, Feldence, aspirin o kahit anong gamot?",
        mustBeNo: true,
        reason: "Certain medications may affect the safety of blood for recipients.",
      },
      {
        id: 2,
        en: "Have you ever had any of the following: cancer, a blood disease or a bleeding problem, heart disease recent or severe respiratory disease, kidney disease, syphilis, diabetes, asthma, epilepsy, TB? ",
        tl: "Nagkaroon ka ba ng alin man sa mga sumusunod: Kanser, sakit sa dugo o walang tigil na pagdurugo, sakit sa puso, syphilis, diabetes, hika, epilepsy, sakit sa bato? ",
        mustBeNo: true,
        reason: "These conditions affect blood quality and donor safety.",
      },
      {
        id: 3,
        en: "Have you ever received human pituitary-derived growth hormone, a brain covering graft, an organ or tissue transplant or graft? ",
        tl: 'Ikaw ba ay tumanggap ng "human pituitary growth hormone", naoperahan sa utak o tumanggap ng parte ng katawan galing sa ibang tao? ',
        mustBeNo: true,
        reason: "High risk of Creutzfeldt–Jakob disease transmission.",
      },
      {
        id: 4,
        en: "Have you ever had a tooth extraction last week?",
        tl: "Nagpabunot ka ba ng ngipin nitong nakaraang linggo?",
        mustBeNo: true,
        reason: "Recent tooth extraction may risk infection or healing issues.",
      },
      {
        id: 5,
        en: "Have you within the last twenty four hours (24) had an intake of alcohol?",
        tl: "Nakainum ka ba ng alak sa nakaraang beinte-kuatro oras?",
        mustBeNo: true,
        reason: "Recent alcohol consumption may impair judgment and blood quality.",
      },
      {
        id: 6,
        en: "Do you intend to ride /pilot an airplane within twenty four (24) hours?",
        tl: "Ikaw ba ay may balak na sumakay ng eroplano sa susunod na beinte-kuatro oras?",
        mustBeNo: false,
      },
      {
        id: 7,
        en: "Do you intend to drive a heavy transport vehicle within the next twelve (12) hours?",
        tl: "Ikaw ba ay may balak na magmaneho ng sasakyan sa susunod na labing dalawang (12) oras? ",
        mustBeNo: false,
      },
      {
        id: 8,
        en: "Are you currently suffering from any illness, allergy, infectious disease?",
        tl: "Sa kasalukuyan, ikaw ba ay may karamdaman, pangangati (allergy), nakakahawang sakit, sipon, trangkaso, pananakit ng lalamunan? ",
        mustBeNo: true,
        reason: "Current illness or infection is a health risk during donation.",
      },
      {
        id: 9,
        en: "Are you giving blood because you want to be tested for HIV or the AIDS virus?",
        tl: "Ikaw ba at magbibigay ng dugo dahil gusto mong masuri ng HIV o ng AIDS virus?",
        mustBeNo: true,
        reason: "Blood donation should not be used as a testing method.",
      },
      {
        id: 10,
        en: "Are you aware that if you have the AIDS virus, you can give it to someone?",
        tl: "Alam mo ba na kung may AIDS ka maaari kang makahawa ng ibang tao?",
        mustBeNo: false,
      },
      {
        id: 11,
        en: "Were you born in, have you lived in or have you traveled to any African country since 1977?",
        tl: "Ikaw ba ay ipinanganak o tumira o naglakbay sa Africa mula noong 1977?",
        mustBeNo: true,
        reason: "Travel to high-risk areas for variant Creutzfeldt–Jakob disease disqualifies donors.",
      },
    ],
  },
  {
    section: "SECTION IV: FEMALE DONORS",
    bordered: true,
    femaleOnly: true,
    items: [
      {
        id: 1,
        en: "Are you currently pregnant?",
        tl: "Buntis ka ba ngayon?",
        mustBeNo: true,
        reason: "Pregnant individuals cannot donate blood due to safety concerns for both mother and baby.",
      },
      {
        id: 2,
        en: "When was your last delivery? (Provide month/year)",
        tl: "Kailan ka huling nanganak? (Ibigay ang buwan/taon)",
        mustBeNo: false,
      },
      {
        id: 3,
        en: "Did you deliver at term baby/had an abortion for the past six (6) months?",
        tl: "Ikaw ba ay nanganak ng husto sa buwan o nakunan sa nakalipas na anim na buwan?",
        mustBeNo: true,
        reason: "Recent delivery or abortion may pose health risks for donation.",
      },
      {
        id: 4,
        en: "When was your last menstruation? (Provide date)",
        tl: "Kailan huling niregla? (Ibigay ang petsa)",
        mustBeNo: false,
      },
    ],
  },
]

const EligibilityCheck3 = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const previousFormData = location.state || {}

  // Get user's sex from previous form data
  const userSex = previousFormData.sex || ""

  // Filter questions based on user's sex
  const questions = allQuestions.filter((section) => {
    // If it's a female-only section and user is not female, exclude it
    if (section.femaleOnly && userSex !== "Female") {
      return false
    }
    return true
  })

  // User sex and questions sections are now being used for filtering

  // Prevent back navigation
  useEffect(() => {
    window.history.pushState(null, "", window.location.pathname)
    window.addEventListener("popstate", () => {
      window.history.pushState(null, "", window.location.pathname)
    })
  }, [])

  const [answers, setAnswers] = useState({})
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [showErrorSummary, setShowErrorSummary] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const printRef = useRef(null)

  const validateField = (id, value) => {
    if (!value || value.trim() === "") return "This field is required"
    return ""
  }

  const handleChange = (id, value, sectionIndex) => {
    // Create a unique identifier for each question combining section and question ID
    const questionKey = `section${sectionIndex}_q${id}`

    setAnswers((prev) => ({ ...prev, [questionKey]: value }))

    if (touched[questionKey]) {
      const fieldError = validateField(id, value)
      setErrors((prev) => ({ ...prev, [questionKey]: fieldError }))
    }

    setShowErrorSummary(false)
  }

  const handleBlur = (id, value, sectionIndex) => {
    const questionKey = `section${sectionIndex}_q${id}`
    setTouched((prev) => ({ ...prev, [questionKey]: true }))
    const fieldError = validateField(id, value)
    setErrors((prev) => ({ ...prev, [questionKey]: fieldError }))
  }

  const validateForm = () => {
    const newErrors = {}
    const newTouched = {}
    let isValid = true

    questions.forEach((section, sectionIndex) => {
      section.items.forEach((item) => {
        const questionKey = `section${sectionIndex}_q${item.id}`
        newTouched[questionKey] = true
        const error = validateField(item.id, answers[questionKey])
        if (error) {
          newErrors[questionKey] = error
          isValid = false
        }
      })
    })

    setErrors(newErrors)
    setTouched(newTouched)
    setShowErrorSummary(!isValid)

    return isValid
  }

  const allAnswered = questions.every((section, sectionIndex) =>
    section.items.every((item) => {
      const questionKey = `section${sectionIndex}_q${item.id}`
      return answers[questionKey]
    }),
  )

  const ineligibleItems = questions.flatMap((section, sectionIndex) =>
    section.items
      .filter((item) => {
        const questionKey = `section${sectionIndex}_q${item.id}`
        return item.mustBeNo && answers[questionKey] === "yes"
      })
      .map((item) => ({ ...item, sectionIndex })),
  )

  const eligible = allAnswered ? ineligibleItems.length === 0 : null
  const reasons = ineligibleItems.map((item) => item.reason).filter(Boolean)

  const handleContinueClick = () => {
    if (validateForm() && eligible) {
      localStorage.setItem("eligibilityStep", "5")
      setShowConfirm(true)
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleReadyClick = () => {
    // Prepare complete form data with correct field names for AppointmentDetails
    const completeFormData = {
      // Personal Information from step 1
      surname: previousFormData.surname || "",
      firstName: previousFormData.firstName || "",
      middleInitial: previousFormData.middleInitial || "",
      bloodType: previousFormData.bloodType || "",
      dateToday: previousFormData.dateToday || previousFormData.appointmentDate || "", // Fallback to appointmentDate if dateToday is missing
      birthday: previousFormData.birthday || "",
      age: previousFormData.age || "",
      sex: previousFormData.sex || "",
      civilStatus: previousFormData.civilStatus || "",

      // Contact Information
      homeAddress: previousFormData.homeAddress || "",
      phoneNumber: previousFormData.phoneNumber || "",
      officePhone: previousFormData.officePhone || "N/A",

      // Additional Information
      occupation: previousFormData.occupation || "",
      patientName: previousFormData.patientName || "",

      // Parental consent (if applicable)
      parentalConsent: previousFormData.parentalConsent || "",
      parentName: previousFormData.parentName || "",
      parentSignature: previousFormData.parentSignature || "",

      // Appointment Details
      donationCenter: previousFormData.donationCenter || "",
      bloodBankId: previousFormData.bloodBankId || "",
      selectedHospital: previousFormData.selectedHospital || null, // Preserve the selected hospital/blood bank object
      appointmentDate: previousFormData.appointmentDate || previousFormData.dateToday || "", // Use appointmentDate first, fallback to dateToday
      appointmentTime: previousFormData.appointmentTime || "",

      // Medical History
      medicalHistory: {
        step2: previousFormData.medicalHistory || {},
        step3: answers,
      },
    }

    // Save to localStorage for persistence
    localStorage.setItem("appointmentData", JSON.stringify(completeFormData))

    // Navigate to appointment details with replace to prevent going back
    navigate("/appointment-details", {
      replace: true,
      state: completeFormData,
    })
  }

  const renderQuestion = (item, sectionIndex, itemIndex) => {
    const questionKey = `section${sectionIndex}_q${item.id}`
    const isError = errors[questionKey] && touched[questionKey]
    const answer = answers[questionKey]

    return (
      <div key={item.id} className="mb-4 sm:mb-6 last:mb-0">
        <div className="flex gap-2 sm:gap-3">
          <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xs sm:text-sm font-medium">
            {itemIndex + 1}
          </span>
          <div className="flex-1 min-w-0">
            <label className="block text-gray-800 font-medium text-sm sm:text-base break-words">{item.en}</label>
            {item.tl && <p className="mt-1 text-xs sm:text-sm italic text-gray-500 break-words">{item.tl}</p>}
          </div>
        </div>

        <div className="mt-2 sm:mt-3 ml-7 sm:ml-9">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
            {["yes", "no"].map((option) => (
              <label
                key={option}
                className={`
                  flex items-center gap-2 cursor-pointer px-3 sm:px-4 py-2 rounded-lg
                  transition-all duration-200 text-sm sm:text-base
                  ${answer === option ? "bg-red-50 text-red-600 font-medium" : "hover:bg-gray-50"}
                `}
              >
                <input
                  type="radio"
                  name={questionKey}
                  value={option}
                  checked={answer === option}
                  onChange={() => handleChange(item.id, option, sectionIndex)}
                  onBlur={() => handleBlur(item.id, option, sectionIndex)}
                  className="form-radio text-red-600 focus:ring-red-500 w-3 h-3 sm:w-4 sm:h-4"
                />
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </label>
            ))}
          </div>

          {isError && (
            <p className="mt-2 text-xs sm:text-sm text-red-500 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
              <span className="break-words">{errors[questionKey]}</span>
            </p>
          )}
        </div>
      </div>
    )
  }

  const handlePrint = () => {
    const printContent = document.getElementById("printable-content")
    if (!printContent) return

    const printWindow = window.open("", "", "width=800,height=600")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Blood Donor Interview Summary</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #000;
            }
            .icon-success {
              color: green;
            }
            .icon-fail {
              color: red;
            }
            .icon-warning {
              color: orange;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-top: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 5px;
              color: #007BFF;
            }
            .field {
              margin: 8px 0;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const ReviewSummary = () => (
    <div id="printable-content" className="p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Medical History Review</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Blood Donation Eligibility Check</p>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
        <p className="text-xs sm:text-sm text-gray-500">Donor Sex: {userSex}</p>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* Step 2 Records */}
        <div className="border-b pb-4 sm:pb-6">
          <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Previous Donation History</h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-1 sm:gap-0">
              <span className="text-gray-600">Have you donated blood before?</span>
              <span className="font-medium break-words">{previousFormData?.medicalHistory?.q1 || "Not answered"}</span>
            </div>
            {previousFormData?.medicalHistory?.q1 === "Yes" && (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-1 sm:gap-0">
                  <span className="text-gray-600">Last Donation Date:</span>
                  <span className="font-medium break-words">
                    {previousFormData?.medicalHistory?.lastDonationDate || "Not provided"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-1 sm:gap-0">
                  <span className="text-gray-600">Last Donation Place:</span>
                  <span className="font-medium break-words">
                    {previousFormData?.medicalHistory?.lastDonationPlace || "Not provided"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border-b pb-4 sm:pb-6">
          <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Donation History Verification</h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-1 sm:gap-0">
              <span className="text-gray-600 break-words">Used different name for donation?</span>
              <span className={`font-medium ${previousFormData?.medicalHistory?.q2 === "Yes" ? "text-red-600" : ""}`}>
                {previousFormData?.medicalHistory?.q2 || "Not answered"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-1 sm:gap-0">
              <span className="text-gray-600 break-words">Previously deferred from donation?</span>
              <span className={`font-medium ${previousFormData?.medicalHistory?.q3 === "Yes" ? "text-red-600" : ""}`}>
                {previousFormData?.medicalHistory?.q3 || "Not answered"}
              </span>
            </div>
          </div>
        </div>

        {/* Step 3 Records */}
        {questions.map((section, sectionIndex) => (
          <div key={sectionIndex} className="border-b pb-4 sm:pb-6">
            <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base break-words">
              {section.icon && <section.icon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />}
              <span className="break-words">{section.section}</span>
            </h3>
            {section.subtitleTagalog && <p className="text-xs sm:text-sm text-gray-500 italic mb-3 sm:mb-4 break-words">{section.subtitleTagalog}</p>}
            <div className="space-y-3 sm:space-y-4">
              {section.items.map((item) => {
                const questionKey = `section${sectionIndex}_q${item.id}`
                return (
                  <div key={item.id} className="flex flex-col gap-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm gap-1 sm:gap-0">
                      <span className="text-gray-600 break-words pr-2">{item.en}</span>
                      <span
                        className={`font-medium flex-shrink-0 ${
                          item.mustBeNo && answers[questionKey] === "yes" ? "text-red-600" : ""
                        }`}
                      >
                        {answers[questionKey]?.charAt(0).toUpperCase() + answers[questionKey]?.slice(1) ||
                          "Not answered"}
                      </span>
                    </div>
                    {item.tl && <p className="text-xs text-gray-500 italic break-words">{item.tl}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="border-b pb-4 sm:pb-6">
          <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Overall Eligibility Status</h3>
          <div className="flex items-start sm:items-center gap-2">
            {eligible ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            )}
            <span className={`font-medium text-xs sm:text-sm break-words ${eligible ? "text-green-600" : "text-red-600"}`}>
              {eligible ? "Eligible to proceed" : "Not eligible to proceed"}
            </span>
          </div>
          {!eligible && reasons.length > 0 && (
            <div className="mt-2 sm:mt-3">
              <p className="text-xs sm:text-sm font-medium text-gray-700">Reasons for Ineligibility:</p>
              <ul className="mt-1 sm:mt-2 space-y-1">
                {reasons.map((reason, i) => (
                  <li key={i} className="text-xs sm:text-sm text-red-600 flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center pt-3 sm:pt-4">
          This document is part of your blood donation eligibility check.
          <br />
          Generated on {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-3 sm:p-4 lg:p-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-700 mb-6 sm:mb-8 text-center flex flex-col sm:flex-row items-center justify-center gap-2">
          <Heart className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
          <span className="text-center break-words">Blood Donor Interview Data Sheet</span>
        </h1>

        {/* Display user info */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-blue-700">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <p className="font-medium text-sm sm:text-base break-words">
              Donor Information: {previousFormData.firstName} {previousFormData.surname} ({userSex})
            </p>
          </div>
          {userSex === "Male" && (
            <p className="text-xs sm:text-sm text-blue-600 mt-1 break-words">
              Note: Female-specific questions have been excluded from this assessment.
            </p>
          )}
        </div>

        {showErrorSummary && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <p className="font-medium text-sm sm:text-base break-words">Please answer all questions to proceed</p>
            </div>
          </div>
        )}

        {questions.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className={`mb-6 sm:mb-8 ${
              section.bordered
                ? "border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                : ""
            }`}
          >
            <h2 className="text-lg sm:text-xl text-gray-800 font-semibold mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                {section.icon && <section.icon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />}
                <span className="break-words">{section.section}</span>
              </div>
              {section.femaleOnly && (
                <span className="text-xs sm:text-sm bg-pink-100 text-pink-700 px-2 py-1 rounded-full whitespace-nowrap self-start sm:self-center">Female Only</span>
              )}
            </h2>
            {section.subtitleTagalog && <p className="text-xs sm:text-sm text-gray-500 italic mb-3 sm:mb-4 break-words">{section.subtitleTagalog}</p>}
            {section.items.map((item, itemIndex) => renderQuestion(item, sectionIndex, itemIndex))}
          </div>
        ))}

        {ineligibleItems.length > 0 && (
          <div
            className="mt-6 sm:mt-8 rounded-lg p-4 sm:p-6 border-2 transition-all duration-300 bg-red-50 border-red-500"
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base break-words text-red-800">
                  You are not eligible to proceed
                </p>
                {reasons.length > 0 && (
                  <div className="mt-2 sm:mt-3">
                    <p className="font-medium text-xs sm:text-sm text-red-800">Reason(s):</p>
                    <ul className="mt-1 sm:mt-2 space-y-1 sm:space-y-2">
                      {reasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-red-700">
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                          <span className="break-words">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row justify-center sm:justify-end items-center gap-3 sm:gap-4">
          <button
            onClick={() => setShowReviewModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-semibold
              text-red-600 hover:bg-red-50 border-2 border-red-500
              transition-all duration-200 text-sm sm:text-base"
          >
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="break-words">Review Answers</span>
          </button>
          <button
            onClick={handleContinueClick}
            disabled={!eligible || !allAnswered}
            className={`
              w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-semibold
              transition-all duration-200 transform text-sm sm:text-base
              ${
                !eligible || !allAnswered
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
              }
            `}
          >
            <span className="break-words">Continue to Final Step</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[95vh] sm:max-h-[80vh] overflow-auto mx-2 sm:mx-0"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2 min-w-0 flex-1 pr-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
                  <span className="truncate">Answer Review</span>
                </h3>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={handlePrint}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Print Review"
                  >
                    <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div ref={printRef}>
                <ReviewSummary />
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 sm:p-4 flex justify-center sm:justify-end">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl max-w-md w-full border border-red-100">
            <div className="text-center">
              <Heart className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 break-words">Complete Medical History</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 break-words">
                You have completed the medical history questionnaire. This action cannot be undone. Are you ready to
                proceed?
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleReadyClick}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2.5 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base"
                >
                  Yes, I'm Ready
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 sm:px-6 py-2.5 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base"
                >
                  Review My Answers
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EligibilityCheck3
