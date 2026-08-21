package com.francirene.eduapp.ui

import android.net.Uri
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.francirene.eduapp.databinding.ActivityAdminSettingsBinding
import com.francirene.eduapp.model.ChangePasswordRequest
import com.francirene.eduapp.model.UpdateLimitRequest
import com.francirene.eduapp.network.ApiClient
import com.francirene.eduapp.util.errorMessageOrDefault
import com.francirene.eduapp.util.toast
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.FileOutputStream

class AdminSettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAdminSettingsBinding
    private var selectedVideoUri: Uri? = null

    private val pickVideoLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            selectedVideoUri = uri
            binding.tvSelectedVideo.text = uri.lastPathSegment ?: "1 video selected"
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminSettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        title = "Settings"

        binding.btnToggleEnrollment.setOnClickListener { toggleEnrollment() }
        binding.btnUpdateLimit.setOnClickListener { updateLimit() }
        binding.btnPickVideo.setOnClickListener { pickVideoLauncher.launch("video/*") }
        binding.btnUploadVideo.setOnClickListener { uploadVideo() }
        binding.btnChangePassword.setOnClickListener { changePassword() }

        loadStatus()
    }

    private fun loadStatus() {
        lifecycleScope.launch {
            try {
                val res = ApiClient.api.enrollmentStatus()
                val body = res.body()
                if (body != null) {
                    binding.tvEnrollmentStatus.text =
                        "Enrollment is ${if (body.enrollmentClosed) "CLOSED" else "OPEN"} — ${body.enrollmentCount}/${body.enrollmentLimit} slots used"
                    binding.etLimit.setText(body.enrollmentLimit.toString())
                }
            } catch (e: Exception) {
                toast("Couldn't load status: ${e.message}")
            }
        }
    }

    private fun toggleEnrollment() {
        lifecycleScope.launch {
            try {
                val res = ApiClient.api.toggleEnrollment()
                toast(res.body()?.message ?: "Toggled")
                loadStatus()
            } catch (e: Exception) {
                toast("Error: ${e.message}")
            }
        }
    }

    private fun updateLimit() {
        val limit = binding.etLimit.text?.toString()?.trim()?.toIntOrNull()
        if (limit == null) {
            toast("Enter a valid number")
            return
        }
        lifecycleScope.launch {
            try {
                val res = ApiClient.api.updateEnrollmentLimit(UpdateLimitRequest(limit))
                toast(res.body()?.message ?: "Updated")
                loadStatus()
            } catch (e: Exception) {
                toast("Error: ${e.message}")
            }
        }
    }

    private fun uploadVideo() {
        val uri = selectedVideoUri
        if (uri == null) {
            toast("Choose a video first")
            return
        }
        lifecycleScope.launch {
            try {
                val name = uri.lastPathSegment?.substringAfterLast('/') ?: "welcome_${System.currentTimeMillis()}.mp4"
                val tempFile = File(cacheDir, name)
                contentResolver.openInputStream(uri)?.use { input ->
                    FileOutputStream(tempFile).use { output -> input.copyTo(output) }
                }
                val part = MultipartBody.Part.createFormData(
                    "file", tempFile.name, tempFile.asRequestBody("video/*".toMediaTypeOrNull())
                )
                val res = ApiClient.api.uploadWelcomeMotion(part)
                if (res.isSuccessful && res.body()?.success == true) {
                    toast("Welcome video uploaded")
                    binding.tvSelectedVideo.text = "No file selected"
                    selectedVideoUri = null
                } else {
                    toast(res.body()?.message ?: res.errorMessageOrDefault("Upload failed"))
                }
                tempFile.delete()
            } catch (e: Exception) {
                toast("Upload error: ${e.message}")
            }
        }
    }

    private fun changePassword() {
        val current = binding.etCurrentPassword.text?.toString().orEmpty()
        val newPass = binding.etNewPassword.text?.toString().orEmpty()
        if (current.isEmpty() || newPass.isEmpty()) {
            toast("Fill in both password fields")
            return
        }
        lifecycleScope.launch {
            try {
                val res = ApiClient.api.changePassword(ChangePasswordRequest(current, newPass))
                if (res.isSuccessful && res.body()?.success == true) {
                    toast("Password changed")
                    binding.etCurrentPassword.text?.clear()
                    binding.etNewPassword.text?.clear()
                } else {
                    toast(res.body()?.message ?: res.errorMessageOrDefault("Failed to change password"))
                }
            } catch (e: Exception) {
                toast("Error: ${e.message}")
            }
        }
    }
}
