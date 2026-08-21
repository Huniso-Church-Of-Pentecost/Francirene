package com.francirene.eduapp.ui

import android.os.Bundle
import android.widget.ArrayAdapter
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.francirene.eduapp.databinding.ActivityEnrollBinding
import com.francirene.eduapp.model.EnrollRequest
import com.francirene.eduapp.network.ApiClient
import com.francirene.eduapp.util.errorMessageOrDefault
import com.francirene.eduapp.util.toast
import com.google.android.material.chip.Chip
import kotlinx.coroutines.launch

class EnrollActivity : AppCompatActivity() {

    private lateinit var binding: ActivityEnrollBinding
    private val genderOptions = listOf("Male", "Female")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityEnrollBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val genderAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, genderOptions)
        binding.spinnerChildGender.adapter = genderAdapter
        binding.spinnerGuardianGender.adapter = genderAdapter

        loadSubjectsAndServices()

        binding.btnSubmit.setOnClickListener { submit() }
    }

    private fun loadSubjectsAndServices() {
        lifecycleScope.launch {
            try {
                val subjectsRes = ApiClient.api.subjects()
                subjectsRes.body()?.subjects?.forEach { subject ->
                    val chip = Chip(this@EnrollActivity).apply {
                        text = subject
                        isCheckable = true
                    }
                    binding.chipGroupSubjects.addView(chip)
                }
            } catch (e: Exception) {
                toast("Couldn't load subjects: ${e.message}")
            }

            try {
                val servicesRes = ApiClient.api.services()
                val services = servicesRes.body()?.services ?: emptyList()
                val adapter = ArrayAdapter(this@EnrollActivity, android.R.layout.simple_spinner_dropdown_item, services)
                binding.spinnerService.adapter = adapter
            } catch (e: Exception) {
                toast("Couldn't load services: ${e.message}")
            }
        }
    }

    private fun submit() {
        val childName = binding.etChildName.text?.toString()?.trim().orEmpty()
        val childClass = binding.etChildClass.text?.toString()?.trim().orEmpty()
        val guardianName = binding.etGuardianName.text?.toString()?.trim().orEmpty()
        val guardianEmail = binding.etGuardianEmail.text?.toString()?.trim().orEmpty()
        val guardianPhone = binding.etGuardianPhone.text?.toString()?.trim().orEmpty()
        val concerns = binding.etConcerns.text?.toString()?.trim().orEmpty()

        if (childName.isEmpty() || childClass.isEmpty() || guardianName.isEmpty() ||
            guardianEmail.isEmpty() || guardianPhone.isEmpty()
        ) {
            toast("Please fill in all required fields")
            return
        }

        val selectedSubjects = mutableListOf<String>()
        for (i in 0 until binding.chipGroupSubjects.childCount) {
            val chip = binding.chipGroupSubjects.getChildAt(i) as? Chip
            if (chip?.isChecked == true) selectedSubjects.add(chip.text.toString())
        }
        if (selectedSubjects.isEmpty()) {
            toast("Select at least one subject")
            return
        }

        val serviceType = binding.spinnerService.selectedItem?.toString().orEmpty()
        val childGender = binding.spinnerChildGender.selectedItem?.toString().orEmpty()
        val guardianGender = binding.spinnerGuardianGender.selectedItem?.toString().orEmpty()

        setLoading(true)
        lifecycleScope.launch {
            try {
                val res = ApiClient.api.enroll(
                    EnrollRequest(
                        childName, childClass, childGender,
                        guardianName, guardianEmail, guardianPhone, guardianGender,
                        serviceType, selectedSubjects, concerns
                    )
                )
                val body = res.body()
                if (res.isSuccessful && body?.success == true) {
                    showSuccessDialog(body.parentId, body.parentPassword, body.studentId, body.studentPassword)
                } else {
                    toast(body?.message ?: res.errorMessageOrDefault("Enrollment failed"))
                }
            } catch (e: Exception) {
                toast("Network error: ${e.message}")
            } finally {
                setLoading(false)
            }
        }
    }

    private fun showSuccessDialog(parentId: String?, parentPassword: String?, studentId: String?, studentPassword: String?) {
        val message = """
            Enrollment submitted! Check your email for full details.

            Parent ID: $parentId
            Parent Password: $parentPassword

            Student ID: $studentId
            Student Password: $studentPassword
        """.trimIndent()

        AlertDialog.Builder(this)
            .setTitle("Enrollment Received")
            .setMessage(message)
            .setCancelable(false)
            .setPositiveButton("Done") { _, _ -> finish() }
            .show()
    }

    private fun setLoading(loading: Boolean) {
        binding.progress.visibility = if (loading) android.view.View.VISIBLE else android.view.View.GONE
        binding.btnSubmit.isEnabled = !loading
    }
}
