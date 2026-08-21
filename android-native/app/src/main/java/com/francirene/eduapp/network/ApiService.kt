package com.francirene.eduapp.network

import com.francirene.eduapp.model.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // ---- Auth ----
    @POST("api/admin-login")
    suspend fun adminLogin(@Body body: AdminLoginRequest): Response<AdminLoginResponse>

    @POST("api/student-login")
    suspend fun studentLogin(@Body body: StudentLoginRequest): Response<SimpleResponse>

    @POST("api/parent-login")
    suspend fun parentLogin(@Body body: ParentLoginRequest): Response<SimpleResponse>

    @POST("api/admin-logout")
    suspend fun adminLogout(): Response<SimpleResponse>

    @GET("api/session")
    suspend fun session(): Response<SessionResponse>

    // ---- Enrollment ----
    @POST("api/enroll")
    suspend fun enroll(@Body body: EnrollRequest): Response<EnrollResponse>

    @GET("api/enrollments")
    suspend fun enrollments(): Response<EnrollmentsResponse>

    @POST("api/approve-enrollment")
    suspend fun approveEnrollment(@Body body: ApproveRejectRequest): Response<SimpleResponse>

    @POST("api/reject-enrollment")
    suspend fun rejectEnrollment(@Body body: ApproveRejectRequest): Response<SimpleResponse>

    @DELETE("api/enrollments/{id}")
    suspend fun deleteEnrollment(@Path("id") id: String): Response<SimpleResponse>

    @GET("api/enrollment-status")
    suspend fun enrollmentStatus(): Response<EnrollmentStatusResponse>

    @POST("api/toggle-enrollment")
    suspend fun toggleEnrollment(): Response<ToggleEnrollmentResponse>

    @POST("api/update-enrollment-limit")
    suspend fun updateEnrollmentLimit(@Body body: UpdateLimitRequest): Response<UpdateLimitResponse>

    // ---- Resources ----
    @GET("api/resources")
    suspend fun resources(): Response<ResourcesResponse>

    @GET("api/resources/{subject}")
    suspend fun resourcesBySubject(@Path("subject") subject: String): Response<ResourcesResponse>

    @Multipart
    @POST("api/upload-resource")
    suspend fun uploadResource(
        @Part file: MultipartBody.Part,
        @Part("title") title: RequestBody,
        @Part("subject") subject: RequestBody,
        @Part("description") description: RequestBody
    ): Response<UploadResourceResponse>

    @DELETE("api/resources/{id}")
    suspend fun deleteResource(@Path("id") id: String): Response<SimpleResponse>

    // ---- Welcome motion ----
    @GET("api/welcome-motion")
    suspend fun welcomeMotion(): Response<WelcomeMotionResponse>

    @Multipart
    @POST("api/upload-welcome-motion")
    suspend fun uploadWelcomeMotion(@Part file: MultipartBody.Part): Response<UploadWelcomeMotionResponse>

    // ---- Timetables ----
    @GET("api/timetables")
    suspend fun timetables(): Response<TimetablesResponse>

    @POST("api/create-timetable")
    suspend fun createTimetable(@Body body: CreateTimetableRequest): Response<CreateTimetableResponse>

    @DELETE("api/timetables/{id}")
    suspend fun deleteTimetable(@Path("id") id: String): Response<SimpleResponse>

    // ---- Reviews ----
    @GET("api/reviews")
    suspend fun reviews(@Query("studentId") studentId: String? = null): Response<ReviewsResponse>

    @POST("api/save-review")
    suspend fun saveReview(@Body body: SaveReviewRequest): Response<SaveReviewResponse>

    @DELETE("api/reviews/{id}")
    suspend fun deleteReview(@Path("id") id: String): Response<SimpleResponse>

    // ---- Settings ----
    @POST("api/change-password")
    suspend fun changePassword(@Body body: ChangePasswordRequest): Response<SimpleResponse>

    // ---- Static data ----
    @GET("api/subjects")
    suspend fun subjects(): Response<SubjectsResponse>

    @GET("api/services")
    suspend fun services(): Response<ServicesResponse>

    @GET("api/health")
    suspend fun health(): Response<SimpleResponse>
}
