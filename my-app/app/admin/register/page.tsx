"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Shield, ArrowLeft, Building, User, Eye, EyeOff, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define role types and access levels
const roleTypes = [
  { 
    id: "super_admin", 
    name: "Super Admin", 
    description: "Full control over all aspects of the platform"
  },
  { 
    id: "admin", 
    name: "Admin", 
    description: "Manage users, properties, and bookings"
  },
  { 
    id: "editor", 
    name: "Content Editor", 
    description: "Edit and publish content on the website"
  },
  { 
    id: "support", 
    name: "Support Staff", 
    description: "Handle customer support inquiries"
  },
]

// Separate client component for the admin register form
function AdminRegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [formData, setFormData] = useState({
    // Personal details
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    
    // Organization details
    organization: "",
    position: "",
    department: "",
    
    // Access request details
    roleType: "",
    accessReason: "",
    referenceCode: ""
  })

  // Function to validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Calculate password strength
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength(0)
      setPasswordFeedback("")
      return
    }

    // Criteria for password strength
    const hasLength = formData.password.length >= 8
    const hasUppercase = /[A-Z]/.test(formData.password)
    const hasLowercase = /[a-z]/.test(formData.password)
    const hasNumbers = /\d/.test(formData.password)
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)

    const criteria = [hasLength, hasUppercase, hasLowercase, hasNumbers, hasSpecialChars]
    const passedCriteria = criteria.filter(Boolean).length

    // Calculate strength percentage
    const strengthPercentage = (passedCriteria / criteria.length) * 100
    setPasswordStrength(strengthPercentage)

    // Set feedback message
    if (strengthPercentage <= 20) {
      setPasswordFeedback("Very Weak")
    } else if (strengthPercentage <= 40) {
      setPasswordFeedback("Weak")
    } else if (strengthPercentage <= 60) {
      setPasswordFeedback("Fair")
    } else if (strengthPercentage <= 80) {
      setPasswordFeedback("Good")
    } else {
      setPasswordFeedback("Strong")
    }
  }, [formData.password])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (passwordStrength < 60) {
      newErrors.password = "Please use a stronger password"
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.organization.trim()) {
      newErrors.organization = "Organization name is required"
    }
    
    if (!formData.position.trim()) {
      newErrors.position = "Position is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.roleType) {
      newErrors.roleType = "Please select a role type"
    }
    
    if (!formData.accessReason.trim()) {
      newErrors.accessReason = "Please provide a reason for requesting access"
    } else if (formData.accessReason.length < 20) {
      newErrors.accessReason = "Please provide a more detailed explanation (minimum 20 characters)"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    let isValid = false
    
    if (step === 1) {
      isValid = validateStep1()
    } else if (step === 2) {
      isValid = validateStep2()
    }
    
    if (isValid) {
      setStep(step + 1)
      window.scrollTo(0, 0)
    } else {
      toast({
        title: "Please fix the errors",
        description: "There are some issues with your form submission",
        variant: "destructive",
      })
    }
  }

  const prevStep = () => {
    setStep(step - 1)
    window.scrollTo(0, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)
    
    // Validate the final step
    if (!validateStep3()) {
      toast({
        title: "Please fix the errors",
        description: "There are some issues with your form submission",
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)

    try {
      // Send registration request to API
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }
      
      // Show success message
      toast({
        title: "Registration Submitted",
        description: "Your request has been sent for approval. You will be notified via email.",
      })
      
      // Redirect to a confirmation page
      router.push('/admin/register/confirmation')
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 30) return "bg-red-500"
    if (passwordStrength <= 60) return "bg-yellow-500"
    if (passwordStrength <= 80) return "bg-blue-500"
    return "bg-green-500"
  }

  // Step 1: Personal Information
  const renderPersonalInfoStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="flex items-center">
          Full Name <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="John Doe"
          required
          className={errors.fullName ? "border-red-500" : ""}
        />
        {errors.fullName && (
          <p className="text-sm text-red-500 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" /> {errors.fullName}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center">
          Email Address <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="john.doe@example.com"
          required
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-sm text-red-500 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" /> {errors.email}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center">
            Password <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className={errors.password ? "border-red-500 pr-10" : "pr-10"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          {/* Password strength meter */}
          {formData.password && (
            <>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs">Strength: {passwordFeedback}</span>
                <span className={`text-xs ${passwordStrength >= 80 ? 'text-green-600' : ''}`}>
                  {passwordStrength >= 80 && <Check className="h-3 w-3 inline" />}
                </span>
              </div>
              <Progress value={passwordStrength} className="h-1" indicatorClassName={getPasswordStrengthColor()} />
              
              <div className="text-xs mt-1 text-gray-500">
                Password must contain at least 8 characters with uppercase, lowercase, numbers, and special characters.
              </div>
            </>
          )}
          
          {errors.password && (
            <p className="text-sm text-red-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" /> {errors.password}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="flex items-center">
            Confirm Password <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" /> {errors.confirmPassword}
            </p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+1 (555) 123-4567"
        />
        <p className="text-xs text-gray-500">Optional, but helpful for account verification if needed</p>
      </div>
      
      <Button 
        type="button" 
        className="w-full bg-darkGreen hover:bg-darkGreen/90 mt-4"
        onClick={nextStep}
      >
        Continue to Organization Details
      </Button>
    </div>
  )
  
  // Step 2: Organization Information
  const renderOrganizationStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="organization" className="flex items-center">
          Organization/Company Name <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="organization"
          name="organization"
          value={formData.organization}
          onChange={handleChange}
          placeholder="Baithaka Ghar"
          required
          className={errors.organization ? "border-red-500" : ""}
        />
        {errors.organization && (
          <p className="text-sm text-red-500 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" /> {errors.organization}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="position" className="flex items-center">
          Your Position <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="position"
          name="position"
          value={formData.position}
          onChange={handleChange}
          placeholder="Marketing Manager"
          required
          className={errors.position ? "border-red-500" : ""}
        />
        {errors.position && (
          <p className="text-sm text-red-500 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" /> {errors.position}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Select
          value={formData.department}
          onValueChange={(value) => handleSelectChange('department', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="executive">Executive</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="operations">Operations</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="it">IT</SelectItem>
            <SelectItem value="hr">Human Resources</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">Optional, helps us route your admin access request appropriately</p>
      </div>
      
      <div className="flex space-x-4 pt-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={prevStep}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button 
          type="button" 
          className="flex-1 bg-darkGreen hover:bg-darkGreen/90"
          onClick={nextStep}
        >
          Continue to Access Request
        </Button>
      </div>
    </div>
  )
  
  // Step 3: Role and Access Information
  const renderAccessRequestStep = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="flex items-center">
          Select Role Type <span className="text-red-500 ml-1">*</span>
        </Label>
        <RadioGroup
          value={formData.roleType}
          onValueChange={(value: string) => handleSelectChange('roleType', value)}
          className="grid grid-cols-1 gap-4"
        >
          {roleTypes.map(role => (
            <div 
              key={role.id} 
              className={`flex items-start space-x-3 border rounded-md p-3 hover:border-darkGreen cursor-pointer transition-colors ${
                errors.roleType && submitAttempted ? "border-red-500" : ""
              } ${formData.roleType === role.id ? "border-darkGreen bg-emerald-50" : ""}`}
            >
              <RadioGroupItem value={role.id} id={role.id} className="mt-1" />
              <Label htmlFor={role.id} className="cursor-pointer flex-1">
                <div className="font-medium">{role.name}</div>
                <div className="text-sm text-muted-foreground">{role.description}</div>
              </Label>
            </div>
          ))}
        </RadioGroup>
        {errors.roleType && submitAttempted && (
          <p className="text-sm text-red-500 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" /> {errors.roleType}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="accessReason" className="flex items-center">
          Reason for Access Request <span className="text-red-500 ml-1">*</span>
        </Label>
        <Textarea
          id="accessReason"
          name="accessReason"
          value={formData.accessReason}
          onChange={handleChange}
          placeholder="Please explain why you need access to the admin panel and how you will use it."
          rows={4}
          required
          className={errors.accessReason && submitAttempted ? "border-red-500" : ""}
        />
        {errors.accessReason && submitAttempted && (
          <p className="text-sm text-red-500 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" /> {errors.accessReason}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Please provide a detailed explanation of why you need admin access. This helps expedite the approval process.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="referenceCode">Reference Code (if any)</Label>
        <Input
          id="referenceCode"
          name="referenceCode"
          value={formData.referenceCode}
          onChange={handleChange}
          placeholder="If you have an invitation code, enter it here"
        />
        <p className="text-xs text-gray-500">
          If you were invited by an existing admin, enter their reference code for faster approval
        </p>
      </div>
      
      <Alert className="bg-amber-50 border-amber-200 text-amber-800 mt-4">
        <AlertDescription>
          <p className="text-sm">
            <strong>Note:</strong> All admin access requests are reviewed by a Super Admin. You will receive an email notification once your request has been processed.
          </p>
        </AlertDescription>
      </Alert>
      
      <div className="flex space-x-4 pt-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={prevStep}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button 
          type="submit" 
          className="flex-1 bg-darkGreen hover:bg-darkGreen/90"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Submitting...
            </>
          ) : "Submit Registration"}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-darkGreen" />
            <Building className="h-6 w-6 text-darkGreen" />
            <User className="h-7 w-7 text-darkGreen" />
          </div>
          <CardTitle className="text-2xl text-center">Admin Registration</CardTitle>
          <CardDescription className="text-center">
            Register for administrative access to Baithaka Ghar platform
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 pt-4">
            {[1, 2, 3].map((item) => (
              <TooltipProvider key={item}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`h-2 rounded-full cursor-pointer transition-all ${
                        item === step ? 'w-10 bg-darkGreen' : 
                        item < step ? 'w-8 bg-darkGreen/60' : 'w-8 bg-gray-200'
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item === 1 ? 'Personal Details' : item === 2 ? 'Organization Details' : 'Access Request'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {step === 1 && renderPersonalInfoStep()}
            {step === 2 && renderOrganizationStep()}
            {step === 3 && renderAccessRequestStep()}
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t pt-6">
          <Link 
            href="/admin/login" 
            className="text-sm text-darkGreen hover:underline flex items-center"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

// Main page component with Suspense boundary
export default function AdminRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="animate-pulse">Loading registration form...</div>
      </div>
    }>
      <AdminRegisterForm />
    </Suspense>
  )
} 