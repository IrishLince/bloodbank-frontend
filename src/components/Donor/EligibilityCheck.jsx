"use client"

import { useState, useEffect } from "react"
import { Calendar, Droplet, Phone, AlertTriangle, User, MapPin, Briefcase, Users, Heart, XCircle, Download, FileText } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { fetchWithAuth } from "../../utils/api"

const EligibilityCheck = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedHospital, appointmentDate, appointmentTime } = location.state || {}

  const initialFormData = {
    bloodType: "",
    date: new Date().toISOString().split("T")[0],
    surname: "",
    firstName: "",
    middleInitial: "",
    age: "",
    sex: "",
    birthday: "",
    civilStatus: "",
    homeAddress: "",
    phoneNumber: "",
    officePhone: "",
    occupation: "",
    patientName: "",
    parentalConsent: "",
    parentName: "",
    consentFormDownloaded: false,
    ageFromBackend: false,
  }

  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showErrorSummary, setShowErrorSummary] = useState(false)
  const [isLoadingUserData, setIsLoadingUserData] = useState(true)

  // Required fields - will be dynamically updated based on age
  const getRequiredFields = (age) => {
    const baseFields = [
      "bloodType",
      "surname",
      "firstName",
      "sex",
      "birthday",
      "civilStatus",
      "homeAddress",
      "phoneNumber",
      "occupation",
      "patientName",
    ]

    if (age === 16 || age === 17) {
      return [...baseFields, "parentalConsent", "parentName"]
    }

    return baseFields
  }

  // Helper function to format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Helper function to strip country code from phone number
  const stripCountryCode = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 12 && cleaned.startsWith('63')) {
      return cleaned.substring(2); // Remove '63' prefix, return 10 digits
    } else if (cleaned.length === 10) {
      return cleaned; // Already 10 digits, return as is
    }
    
    return cleaned; // Return whatever we have
  };

  // Fetch and populate user data
  const fetchAndPopulateUserData = async () => {
    try {
      setIsLoadingUserData(true);
      
      const response = await fetchWithAuth('/auth/me');
      
      if (response.ok) {
        const userData = await response.json();
        console.log('🔍 Backend user data:', userData);
        console.log('🔍 Age from backend:', userData.age, 'Type:', typeof userData.age);
        console.log('🔍 Date of birth:', userData.dateOfBirth || userData.birthDate);
        
        // Extract name parts (assuming name is "FirstName [MiddleInitial] LastName")
        const fullName = userData.name || '';
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        let middleInitial = '';
        let lastName = '';
        
        // Handle name parts properly
        if (nameParts.length === 3) {
          // If there are exactly 3 parts, assume middle initial is in the middle
          middleInitial = nameParts[1] || '';
          lastName = nameParts[2] || '';
        } else if (nameParts.length > 1) {
          // Otherwise, assume no middle initial and everything after first name is last name
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        // Construct full name for patientName (auto-fetched)
        const patientFullName = `${firstName} ${middleInitial ? middleInitial + ' ' : ''}${lastName}`.trim();
        
        // Calculate age from dateOfBirth if available, or use age from backend if provided
        let calculatedAge = '';
        const birthDateField = userData.dateOfBirth || userData.birthDate; // Try both field names
        
        // First check if backend provides age directly
        if (userData.age) {
          calculatedAge = userData.age.toString();
          console.log('✅ Using age from backend:', calculatedAge);
        } else if (birthDateField) {
          // Otherwise calculate from birthday
          const birthDate = new Date(birthDateField);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          calculatedAge = age.toString();
          console.log('✅ Calculated age from birthday:', calculatedAge);
        }
        
        // Update form data with user information
        setFormData(prev => ({
          ...prev,
          // Auto-fetched and populated fields
          bloodType: userData.bloodType || '',
          surname: lastName,
          firstName: firstName,
          middleInitial: middleInitial,
          birthday: birthDateField ? formatDateForInput(birthDateField) : '',
          age: calculatedAge,
          sex: userData.sex || '',
          homeAddress: userData.address || '',
          phoneNumber: userData.contactInformation ? stripCountryCode(userData.contactInformation) : '',
          patientName: patientFullName,
          // Store a flag to indicate age came from backend
          ageFromBackend: !!userData.age
        }));
        
        // Form data is now auto-populated from user profile
        
      } else {
        // Error handled by UI state
      }
    } catch (error) {
      // Error handled by UI state
    } finally {
      setIsLoadingUserData(false);
    }
  };

  // Auto-populate user data on component mount
  useEffect(() => {
    fetchAndPopulateUserData();
  }, []);

  // Debug log for age changes
  useEffect(() => {
    if (formData.age) {
      console.log('Current age:', formData.age, 'Type:', typeof formData.age, 'Parsed:', Number.parseInt(formData.age));
    }
  }, [formData.age]);

  // Function to handle consent form download
  const handleDownloadConsentForm = () => {
    // The PDF is located in: bloodbank-frontend-main/public/forms/PARENT_CONSENT_FORM.pdf
    const consentFormUrl = '/forms/PARENT_CONSENT_FORM.pdf';
    
    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = consentFormUrl;
    link.download = 'Parental_Consent_Form.pdf';
    link.target = '_blank'; // Open in new tab if download fails
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Mark that the form was downloaded
    setFormData(prev => ({ ...prev, consentFormDownloaded: true }));
  };

  // Validate age based on birthday (only if age wasn't provided by backend)
  useEffect(() => {
    // Don't recalculate if age came from backend
    if (formData.ageFromBackend) {
      return;
    }
    
    if (formData.birthday) {
      const birthDate = new Date(formData.birthday)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      setFormData((prev) => ({ ...prev, age: age.toString() }))
    }
  }, [formData.birthday, formData.ageFromBackend])

  const validateField = (name, value) => {
    let fieldError = ""

    // First check if field is required and empty
    const currentAge = Number.parseInt(formData.age)
    const requiredFields = getRequiredFields(currentAge)

    if (requiredFields.includes(name) && !value.trim()) {
      return "This field is required"
    }

    switch (name) {
      case "bloodType":
        if (!value) fieldError = "Please select a blood type"
        break
      case "surname":
      case "firstName":
        if (value.trim().length < 2) fieldError = "Must be at least 2 characters"
        else if (!/^[a-zA-Z\s]*$/.test(value)) fieldError = "Only letters are allowed"
        break
      case "birthday":
        if (value) {
          const birthDate = new Date(value)
          const today = new Date()
          const age = today.getFullYear() - birthDate.getFullYear()
          if (age < 16) fieldError = "Must be at least 16 years old"
          else if (age > 65) fieldError = "Must be under 65 years old"
        }
        break
      case "phoneNumber":
        if (value && !/^[0-9+\-\s()]*$/.test(value)) fieldError = "Invalid phone number format"
        break
      case "officePhone":
        if (value && !/^[0-9+\-\s()]*$/.test(value)) fieldError = "Invalid phone number format"
        break
      case "parentalConsent":
        const currentAge = Number.parseInt(formData.age)
        if ((currentAge === 16 || currentAge === 17) && !value) {
          fieldError = "Parental consent is required for donors under 18"
        }
        break
      case "parentName":
        const age = Number.parseInt(formData.age)
        if ((age === 16 || age === 17) && formData.parentalConsent === "yes" && !value.trim()) {
          fieldError = "Parent/Guardian name is required"
        }
        break
      default:
        break
    }

    return fieldError
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (touched[name]) {
      const fieldError = validateField(name, value)
      setErrors((prev) => ({ ...prev, [name]: fieldError }))
    }

    // Clear error summary when user starts fixing fields
    setShowErrorSummary(false)
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const fieldError = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: fieldError }))
  }

  const validateForm = () => {
    const newErrors = {}
    const newTouched = {}
    let isValid = true

    const currentAge = Number.parseInt(formData.age)
    const requiredFields = getRequiredFields(currentAge)

    // Validate all required fields
    requiredFields.forEach((field) => {
      newTouched[field] = true
      const error = validateField(field, formData[field])
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched(newTouched)
    setShowErrorSummary(!isValid)

    return isValid
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      // Format the appointment data
      const appointmentData = {
        // Personal Information
        surname: formData.surname,
        firstName: formData.firstName,
        middleInitial: formData.middleInitial || "",
        bloodType: formData.bloodType,
        dateToday: formData.date,
        birthday: formData.birthday,
        age: formData.age,
        sex: formData.sex,
        civilStatus: formData.civilStatus,

        // Contact Information
        homeAddress: formData.homeAddress,
        phoneNumber: formData.phoneNumber,
        officePhone: formData.officePhone || "N/A",

        // Additional Information
        occupation: formData.occupation,
        patientName: formData.patientName,

        // Parental consent (if applicable)
        parentalConsent: formData.parentalConsent,
        parentName: formData.parentName,
        consentFormDownloaded: formData.consentFormDownloaded,

        // Appointment Details
        donationCenter: selectedHospital?.name || selectedHospital?.bloodBankName || "",
        bloodBankId: selectedHospital?.id || "",
        selectedHospital: selectedHospital, // Pass the full selected hospital/blood bank object
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
      }

      // Navigate to medical history step (EligibilityCheck2)
      localStorage.setItem("eligibilityStep", "3")
      navigate("/eligibility-step2", { state: appointmentData })
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const renderInput = (name, placeholder, icon, type = "text", required = true) => {
    const Icon = icon
    const isError = errors[name] && touched[name]

    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className={`h-5 w-5 ${isError ? "text-red-400" : "text-gray-400"}`} />
        </div>
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full pl-10 pr-3 py-2 border rounded-lg shadow-sm transition-colors
            ${
              isError
                ? "border-red-500 bg-red-50"
                : "border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
            }`}
          required={required}
        />
        {isError && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-300 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-700 mb-4 sm:mb-6 flex justify-center items-center gap-2 text-center">
          <Heart className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
          <span>Blood Donor Interview Data Sheet</span>
        </h1>

        {/* Loading indicator while fetching user data */}
        {isLoadingUserData && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-600"></div>
              <p className="font-medium text-sm sm:text-base">Loading your personal information...</p>
            </div>
          </div>
        )}

        {showErrorSummary && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <p className="font-medium text-sm sm:text-base">Please fill in all required fields:</p>
            </div>
            <ul className="mt-2 list-disc list-inside text-xs sm:text-sm text-red-600 space-y-1">
              {Object.entries(errors).map(([field, error]) =>
                error ? (
                  <li key={field} className="capitalize break-words">
                    {field.replace(/([A-Z])/g, " $1").trim()}: {error}
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Blood Type and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm sm:text-base">
                <Droplet className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Blood Type</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bloodType"
                value={
                  isLoadingUserData 
                    ? 'Loading...' 
                    : formData.bloodType 
                      ? formData.bloodType 
                      : 'No blood type in profile'
                }
                readOnly
                className="w-full p-2 pl-3 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed text-sm sm:text-base"
                placeholder="Blood type from your profile"
              />
              {!formData.bloodType && !isLoadingUserData && (
                <p className="mt-1 text-xs text-orange-600">
                  Please update your blood type in your profile settings
                </p>
              )}
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm sm:text-base">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Date Today</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-sm sm:text-base"
                readOnly
              />
            </div>
          </div>

          {/* Personal Data */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
              <span>I. Personal Data</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Surname - Read-only, auto-filled */}
              <div className="relative">
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Surname</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="surname"
                  value={
                    isLoadingUserData 
                      ? 'Loading...' 
                      : formData.surname 
                        ? formData.surname 
                        : 'No last name in profile'
                  }
                  readOnly
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed text-sm"
                  placeholder="Last name from profile"
                />
              </div>
              
              {/* First Name - Read-only, auto-filled */}
              <div className="relative">
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>First Name</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={
                    isLoadingUserData 
                      ? 'Loading...' 
                      : formData.firstName 
                        ? formData.firstName 
                        : 'No first name in profile'
                  }
                  readOnly
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed text-sm"
                  placeholder="First name from profile"
                />
              </div>
              
              {/* Middle Name - Read-only, auto-filled */}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Middle Name</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="middleInitial"
                  value={formData.middleInitial}
                  readOnly
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed text-sm"
                  placeholder="Middle Initial from profile"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
              {/* Birthday - Read-only, auto-filled */}
              <div>
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Birthday</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="birthday"
                  value={
                    isLoadingUserData 
                      ? 'Loading...' 
                      : formData.birthday 
                        ? new Date(formData.birthday).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) 
                        : 'No birthday in profile'
                  }
                  readOnly
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed text-sm"
                  placeholder="Birthday from profile"
                />
                {!isLoadingUserData && !formData.birthday && (
                  <p className="mt-1 text-xs text-orange-600">
                    Please update your birthday in your profile settings
                  </p>
                )}
              </div>
              
              {/* Age - Read-only, auto-calculated */}
              <div>
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Age</span>
                </label>
                <input
                  type="text"
                  name="age"
                  value={
                    isLoadingUserData 
                      ? 'Loading...' 
                      : formData.age 
                        ? `${formData.age} years old` 
                        : 'No birthday to calculate age'
                  }
                  readOnly
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed text-sm"
                  placeholder="Calculated from birthday"
                />
                {!isLoadingUserData && !formData.age && (
                  <p className="mt-1 text-xs text-orange-600">
                    Age will be calculated once birthday is available
                  </p>
                )}
              </div>
              
              {/* Sex - Read-only, auto-filled */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Sex</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sex"
                  value={
                    isLoadingUserData 
                      ? 'Loading...' 
                      : formData.sex 
                        ? formData.sex 
                        : 'No sex in profile'
                  }
                  readOnly
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed text-sm"
                  placeholder="Sex from profile"
                />
                {!isLoadingUserData && !formData.sex && (
                  <p className="mt-1 text-xs text-orange-600">
                    Please update your sex in your profile settings
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 sm:mt-4">
              <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Civil Status</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                name="civilStatus"
                value={formData.civilStatus}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-2 border rounded-lg shadow-sm text-sm
                  ${
                    errors.civilStatus && touched.civilStatus
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  }`}
              >
                <option value="">Select Civil Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
              </select>
              {errors.civilStatus && touched.civilStatus && (
                <p className="mt-1 text-xs text-red-500">{errors.civilStatus}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
              <span>II. Contact Information</span>
            </h2>

            <div className="space-y-3 sm:space-y-4">
              {/* Home Address - Read-only, auto-filled */}
              <div>
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Home Address</span>
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="homeAddress"
                  value={
                    isLoadingUserData 
                      ? 'Loading...' 
                      : formData.homeAddress 
                        ? formData.homeAddress 
                        : 'No address in profile'
                  }
                  readOnly
                  rows={2}
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed resize-none text-sm"
                  placeholder="Address from profile"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Phone Number - Read-only, auto-filled */}
                <div>
                  <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Phone Number</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={
                      isLoadingUserData 
                        ? 'Loading...' 
                        : formData.phoneNumber 
                          ? `+63${formData.phoneNumber}` 
                          : 'No phone number in profile'
                    }
                    readOnly
                    className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed text-sm"
                    placeholder="Phone from profile"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Office Tel No.</span>
                  </label>
                  <input
                    type="tel"
                    name="officePhone"
                    value={formData.officePhone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter office number (optional)"
                    className={`w-full p-2 border rounded-lg shadow-sm text-sm
                      ${
                        errors.officePhone && touched.officePhone
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      }`}
                  />
                  {errors.officePhone && touched.officePhone && (
                    <p className="mt-1 text-xs text-red-500">{errors.officePhone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
              <span>III. Additional Info</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm">
                  <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Occupation</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter occupation"
                  className={`w-full p-2 border rounded-lg shadow-sm text-sm
                    ${
                      errors.occupation && touched.occupation
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    }`}
                />
                {errors.occupation && touched.occupation && (
                  <p className="mt-1 text-xs text-red-500">{errors.occupation}</p>
                )}
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Name of Patient</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="patientName"
                  value={
                    isLoadingUserData 
                      ? 'Loading...' 
                      : formData.patientName 
                        ? formData.patientName 
                        : 'No name in profile'
                  }
                  readOnly
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed text-sm"
                  placeholder="Patient name from profile"
                />
                {!isLoadingUserData && !formData.patientName && (
                  <p className="mt-1 text-xs text-orange-600">
                    Please update your name in your profile settings
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Parental Consent Section - Only show for ages 16-17 */}
          {(() => {
            const age = Number.parseInt(formData.age);
            const showConsent = !isNaN(age) && (age === 16 || age === 17);
            console.log('Parental consent check - Age:', formData.age, 'Parsed:', age, 'Show:', showConsent);
            return showConsent;
          })() && (
            <div className="bg-yellow-50 border-2 border-yellow-200 p-3 sm:p-4 rounded-lg">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0" />
                  <span>IV: Parental Consent Required</span>
                </div>
                <span className="text-red-500 text-sm sm:text-base">*</span>
              </h2>

              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-yellow-100 rounded-lg">
                <p className="text-xs sm:text-sm text-yellow-800">
                  <strong>Notice:</strong> Donors aged 16-17 require written consent from a parent or legal guardian to
                  donate blood.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-2 text-sm sm:text-base">
                    Do you have parental consent to donate blood? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                    {["yes", "no"].map((option) => (
                      <label key={option} className="relative flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="parentalConsent"
                          value={option}
                          checked={formData.parentalConsent === option}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="form-radio h-4 w-4 sm:h-5 sm:w-5 text-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <span className="text-gray-700 group-hover:text-red-600 transition-colors capitalize text-sm sm:text-base">
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.parentalConsent && touched.parentalConsent && (
                    <p className="mt-1 text-xs text-red-500">{errors.parentalConsent}</p>
                  )}
                </div>

                {formData.parentalConsent === "yes" && (
                  <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1 text-sm">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span>Parent/Guardian Full Name</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="parentName"
                        value={formData.parentName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter parent/guardian full name"
                        className={`w-full p-2 border rounded-lg shadow-sm text-sm
                          ${
                            errors.parentName && touched.parentName
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          }`}
                      />
                      {errors.parentName && touched.parentName && (
                        <p className="mt-1 text-xs text-red-500">{errors.parentName}</p>
                      )}
                    </div>

                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4">
                      <label className="block font-medium text-gray-700 mb-2 flex items-center gap-1 text-sm">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                        <span>Parental Consent Form</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3">
                        Please download, print, and have your parent/guardian sign the consent form. Bring the signed form to the hospital on your appointment day.
                      </p>
                      <button
                        type="button"
                        onClick={handleDownloadConsentForm}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Download Parental Consent Form (PDF)</span>
                        <span className="sm:hidden">Download Consent Form</span>
                      </button>
                      {formData.consentFormDownloaded && (
                        <p className="mt-2 text-xs sm:text-sm text-green-600 flex items-center gap-1">
                          <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                          Consent form downloaded! Please print and have it signed.
                        </p>
                      )}
                      <p className="mt-2 sm:mt-3 text-xs text-gray-500 italic">
                        <strong>Important:</strong> Remember to bring the signed consent form with you on your appointment date. Without it, you will not be able to donate.
                      </p>
                    </div>
                  </div>
                )}

                {formData.parentalConsent === "no" && (
                  <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-red-600 flex items-center gap-2">
                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>You cannot proceed with blood donation without parental consent.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 sm:pt-6 flex justify-center sm:justify-end">
            <button
              type="submit"
              disabled={formData.parentalConsent === "no"}
              className={`${
                formData.parentalConsent === "no"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              } w-full sm:w-auto text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2 font-semibold
                shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-sm sm:text-base`}
            >
              <span>Proceed to Medical History</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EligibilityCheck
