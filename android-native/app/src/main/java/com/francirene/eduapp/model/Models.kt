package com.francirene.eduapp.model

import com.google.gson.annotations.SerializedName

// ---- Generic ----
data class SimpleResponse(
    val success: Boolean,
    val message: String? = null
)

// ---- Auth ----
data class AdminLoginRequest(val username: String, val password: String)
data class AdminLoginResponse(val success: Boolean, val message: String? = null, val adminId: String? = null)

data class StudentLoginRequest(val studentId: String, val password: String)
data class ParentLoginRequest(val parentId: String, val password: String)

data class SessionAdmin(val username: String, val id: String)
data class SessionParent(val parentId: String, val childName: String, val studentId: String)
data class SessionStudent(val studentId: String, val childName: String)

data class SessionResponse(
    val success: Boolean,
    val role: String? = null,
    val admin: SessionAdmin? = null,
    val parent: SessionParent? = null,
    val student: SessionStudent? = null,
    val message: String? = null
)

// ---- Enrollment ----
data class EnrollRequest(
    val childName: String,
    val childClass: String,
    val childGender: String,
    val guardianName: String,
    val guardianEmail: String,
    val guardianPhone: String,
    val guardianGender: String,
    val serviceType: String,
    val subjects: List<String>,
    val concerns: String?
)

data class EnrollResponse(
    val success: Boolean,
    val message: String? = null,
    val parentId: String? = null,
    val parentPassword: String? = null,
    val studentId: String? = null,
    val studentPassword: String? = null
)

data class Enrollment(
    val id: String,
    val parentId: String,
    val studentId: String,
    val childName: String,
    val childClass: String,
    val childGender: String,
    val guardianName: String,
    val guardianEmail: String,
    val guardianPhone: String,
    val guardianGender: String,
    val serviceType: String,
    val subjects: List<String>?,
    val concerns: String?,
    val status: String,
    val enrollmentDate: String?
)

data class EnrollmentsResponse(val success: Boolean, val enrollments: List<Enrollment>?, val message: String? = null)

data class ApproveRejectRequest(val enrollmentId: String)

data class EnrollmentStatusResponse(
    val success: Boolean,
    val enrollmentClosed: Boolean = false,
    val enrollmentLimit: Int = 0,
    val enrollmentCount: Int = 0
)

data class ToggleEnrollmentResponse(val success: Boolean, val enrollmentClosed: Boolean = false, val message: String? = null)
data class UpdateLimitRequest(val enrollmentLimit: Int)
data class UpdateLimitResponse(val success: Boolean, val enrollmentLimit: Int = 0, val message: String? = null)

// ---- Resources ----
data class Resource(
    val id: String,
    val title: String,
    val subject: String,
    val description: String?,
    val filename: String,
    val originalName: String?,
    val uploadDate: String?
)

data class ResourcesResponse(val success: Boolean, val resources: List<Resource>?, val message: String? = null)
data class UploadResourceResponse(val success: Boolean, val message: String? = null, val resource: Resource? = null)

// ---- Welcome motion ----
data class WelcomeMotionResponse(val success: Boolean, val filename: String? = null, val url: String? = null, val message: String? = null)
data class UploadWelcomeMotionResponse(val success: Boolean, val message: String? = null, val filename: String? = null)

// ---- Timetables ----
data class Timetable(
    val id: String,
    val title: String,
    val startDate: String?,
    val endDate: String?,
    val classes: String?,
    val repeatWeeks: Int?,
    val createdDate: String?
)

data class TimetablesResponse(val success: Boolean, val timetables: List<Timetable>?, val message: String? = null)
data class CreateTimetableRequest(
    val title: String,
    val startDate: String?,
    val endDate: String?,
    val classes: String?,
    val repeatWeeks: Int?
)
data class CreateTimetableResponse(val success: Boolean, val message: String? = null, val timetable: Timetable? = null)

// ---- Reviews ----
data class Review(
    val id: String,
    val studentId: String,
    val academicPerformance: String?,
    val behavior: String?,
    val attendance: String?,
    val teacherRemarks: String?,
    val parentalAdvice: String?,
    val createdAt: String?
)

data class ReviewsResponse(val success: Boolean, val reviews: List<Review>?, val message: String? = null)
data class SaveReviewRequest(
    val studentId: String,
    val academicPerformance: String?,
    val behavior: String?,
    val attendance: String?,
    val teacherRemarks: String?,
    val parentalAdvice: String?
)
data class SaveReviewResponse(val success: Boolean, val message: String? = null, val review: Review? = null)

// ---- Settings ----
data class ChangePasswordRequest(val currentPassword: String, val newPassword: String)

// ---- Subjects / services ----
data class SubjectsResponse(val success: Boolean, val subjects: List<String>?)
data class ServicesResponse(val success: Boolean, val services: List<String>?)
