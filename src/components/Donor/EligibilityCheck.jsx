"use client"

import { useState, useEffect } from "react"
import { Calendar, Droplet, Phone, AlertTriangle, User, MapPin, Briefcase, Users, Heart, XCircle } from "lucide-react"
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
    donorType: "",
    parentalConsent: "",
    parentName: "",
    parentSignature: "",
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
      "donorType",
    ]

    if (age === 16 || age === 17) {
      return [...baseFields, "parentalConsent", "parentName", "parentSignature"]
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
        
        // Calculate age from dateOfBirth if available
        let calculatedAge = '';
        const birthDateField = userData.dateOfBirth || userData.birthDate; // Try both field names
        if (birthDateField) {
          const birthDate = new Date(birthDateField);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          calculatedAge = age.toString();
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
          phoneNumber: userData.contactInformation ? stripCountryCode(userData.contactInformation) : ''
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

  // Validate age based on birthday
  useEffect(() => {
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
  }, [formData.birthday])

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
      case "donorType":
        if (!value) fieldError = "Please select a donor type"
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
      case "parentSignature":
        const donorAge = Number.parseInt(formData.age)
        if ((donorAge === 16 || donorAge === 17) && formData.parentalConsent === "yes" && !value.trim()) {
          fieldError = "Parent/Guardian signature is required"
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
        donorType: formData.donorType,

        // Parental consent (if applicable)
        parentalConsent: formData.parentalConsent,
        parentName: formData.parentName,
        parentSignature: formData.parentSignature,

        // Appointment Details
        donationCenter: selectedHospital?.name || "",
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl shadow-xl border border-gray-300 p-6">
        <h1 className="text-3xl font-bold text-red-700 mb-6 flex justify-center items-center gap-2">
          <Heart className="h-8 w-8" />
          Blood Donor Interview Data Sheet
        </h1>

        {/* Loading indicator while fetching user data */}
        {isLoadingUserData && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="font-medium">Loading your personal information...</p>
            </div>
          </div>
        )}

        {showErrorSummary && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">Please fill in all required fields:</p>
            </div>
            <ul className="mt-2 list-disc list-inside text-sm text-red-600">
              {Object.entries(errors).map(([field, error]) =>
                error ? (
                  <li key={field} className="capitalize">
                    {field.replace(/([A-Z])/g, " $1").trim()}: {error}
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Blood Type and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Droplet className="h-4 w-4" />
                Blood Type <span className="text-red-500">*</span>
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
                className="w-full p-2 pl-3 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed"
                placeholder="Blood type from your profile"
              />
              {!formData.bloodType && !isLoadingUserData && (
                <p className="mt-1 text-xs text-orange-600">
                  Please update your blood type in your profile settings
                </p>
              )}
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Date Today
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50"
                readOnly
              />
            </div>
          </div>

          {/* Personal Data */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-red-600" />
              I. Personal Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Surname - Read-only, auto-filled */}
              <div className="relative">
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Surname <span className="text-red-500">*</span>
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
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed"
                  placeholder="Last name from profile"
                />
              </div>
              
              {/* First Name - Read-only, auto-filled */}
              <div className="relative">
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  First Name <span className="text-red-500">*</span>
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
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed"
                  placeholder="First name from profile"
                />
              </div>
              
              {/* M.I. - Still editable as it's not in profile */}
              <div className="relative">
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  M.I. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="middleInitial"
                  value={formData.middleInitial}
                  readOnly
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed"
                  placeholder="Middle Initial from profile"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Birthday - Read-only, auto-filled */}
              <div>
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Birthday <span className="text-red-500">*</span>
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
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed"
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
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Age
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
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed"
                  placeholder="Calculated from birthday"
                />
                {!isLoadingUserData && !formData.age && (
                  <p className="mt-1 text-xs text-orange-600">
                    Age will be calculated once birthday is available
                  </p>
                )}
              </div>
              
              {/* Sex - Read-only, auto-filled */}
              <div>
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Sex <span className="text-red-500">*</span>
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
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed"
                  placeholder="Sex from profile"
                />
                {!isLoadingUserData && !formData.sex && (
                  <p className="mt-1 text-xs text-orange-600">
                    Please update your sex in your profile settings
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Users className="h-4 w-4" />
                Civil Status <span className="text-red-500">*</span>
              </label>
              <select
                name="civilStatus"
                value={formData.civilStatus}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-2 border rounded-lg shadow-sm
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
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-red-600" />
              II. Contact Information
            </h2>

            <div className="space-y-4">
              {/* Home Address - Read-only, auto-filled */}
              <div>
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Home Address <span className="text-red-500">*</span>
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
                  className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed resize-none"
                  placeholder="Address from profile"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone Number - Read-only, auto-filled */}
                <div>
                  <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Phone Number <span className="text-red-500">*</span>
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
                    className="w-full p-2 border rounded-lg shadow-sm bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed"
                    placeholder="Phone from profile"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Office Tel No.
                  </label>
                  <input
                    type="tel"
                    name="officePhone"
                    value={formData.officePhone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter office number (optional)"
                    className={`w-full p-2 border rounded-lg shadow-sm
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
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-red-600" />
              III. Additional Info
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  Occupation <span className="text-red-500">*</span>
                </label>
                <input
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter occupation"
                  className={`w-full p-2 border rounded-lg shadow-sm
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
                <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Name of Patient <span className="text-red-500">*</span>
                </label>
                <input
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter patient name"
                  className={`w-full p-2 border rounded-lg shadow-sm
                    ${
                      errors.patientName && touched.patientName
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    }`}
                />
                {errors.patientName && touched.patientName && (
                  <p className="mt-1 text-xs text-red-500">{errors.patientName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Parental Consent Section - Only show for ages 16-17 */}
          {(Number.parseInt(formData.age) === 16 || Number.parseInt(formData.age) === 17) && (
            <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                V. Parental Consent Required <span className="text-red-500">*</span>
              </h2>

              <div className="mb-4 p-3 bg-yellow-100 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Notice:</strong> Donors aged 16-17 require written consent from a parent or legal guardian to
                  donate blood.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Do you have parental consent to donate blood? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-6">
                    {["yes", "no"].map((option) => (
                      <label key={option} className="relative flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="parentalConsent"
                          value={option}
                          checked={formData.parentalConsent === option}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="form-radio h-5 w-5 text-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <span className="text-gray-700 group-hover:text-red-600 transition-colors capitalize">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Parent/Guardian Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="parentName"
                        value={formData.parentName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter parent/guardian full name"
                        className={`w-full p-2 border rounded-lg shadow-sm
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

                    <div>
                      <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Parent/Guardian Signature <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="parentSignature"
                        value={formData.parentSignature}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Type full name as signature"
                        className={`w-full p-2 border rounded-lg shadow-sm
                          ${
                            errors.parentSignature && touched.parentSignature
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          }`}
                      />
                      {errors.parentSignature && touched.parentSignature && (
                        <p className="mt-1 text-xs text-red-500">{errors.parentSignature}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        By typing your name, you confirm consent for your child to donate blood
                      </p>
                    </div>
                  </div>
                )}

                {formData.parentalConsent === "no" && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      You cannot proceed with blood donation without parental consent.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Donor Type */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              IV. Type of Donor <span className="text-red-500">*</span>
            </h2>

            <div className="flex flex-wrap gap-6">
              {["Volunteer", "Replacement", "Pre-deposit"].map((type) => (
                <label key={type} className="relative flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="donorType"
                    value={type}
                    checked={formData.donorType === type}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="form-radio h-5 w-5 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-gray-700 group-hover:text-red-600 transition-colors">{type}</span>
                </label>
              ))}
            </div>
            {errors.donorType && touched.donorType && <p className="mt-2 text-xs text-red-500">{errors.donorType}</p>}
          </div>

          {/* Submit Button */}
          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={formData.parentalConsent === "no"}
              className={`${
                formData.parentalConsent === "no"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              } text-white px-8 py-3 rounded-lg flex items-center gap-2 font-semibold
                shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200`}
            >
              Proceed to Medical History
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
