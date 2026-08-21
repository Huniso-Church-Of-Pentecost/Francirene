package com.francirene.eduapp.ui

import android.os.Bundle
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.francirene.eduapp.adapter.ReviewAdapter
import com.francirene.eduapp.databinding.ActivityAdminReviewsBinding
import com.francirene.eduapp.model.Review
import com.francirene.eduapp.model.SaveReviewRequest
import com.francirene.eduapp.network.ApiClient
import com.francirene.eduapp.util.errorMessageOrDefault
import com.francirene.eduapp.util.toast
import kotlinx.coroutines.launch

class AdminReviewsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAdminReviewsBinding
    private lateinit var adapter: ReviewAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminReviewsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        title = "Student Reviews"

        adapter = ReviewAdapter(emptyList(), showDelete = true, onDelete = { confirmDelete(it) })
        binding.recyclerView.layoutManager = LinearLayoutManager(this)
        binding.recyclerView.adapter = adapter

        binding.btnSave.setOnClickListener { save() }
        binding.swipeRefresh.setOnRefreshListener { load() }
        load()
    }

    private fun save() {
        val studentId = binding.etStudentId.text?.toString()?.trim().orEmpty()
        if (studentId.isEmpty()) {
            toast("Enter a Student ID")
            return
        }

        lifecycleScope.launch {
            try {
                val res = ApiClient.api.saveReview(
                    SaveReviewRequest(
                        studentId,
                        binding.etAcademic.text?.toString()?.trim(),
                        binding.etBehavior.text?.toString()?.trim(),
                        binding.etAttendance.text?.toString()?.trim(),
                        binding.etRemarks.text?.toString()?.trim(),
                        binding.etAdvice.text?.toString()?.trim()
                    )
                )
                if (res.isSuccessful && res.body()?.success == true) {
                    toast("Review saved")
                    listOf(binding.etStudentId, binding.etAcademic, binding.etBehavior, binding.etAttendance, binding.etRemarks, binding.etAdvice)
                        .forEach { it.text?.clear() }
                    load()
                } else {
                    toast(res.body()?.message ?: res.errorMessageOrDefault("Failed to save review"))
                }
            } catch (e: Exception) {
                toast("Error: ${e.message}")
            }
        }
    }

    private fun load() {
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            try {
                val res = ApiClient.api.reviews()
                adapter.update(res.body()?.reviews ?: emptyList())
            } catch (e: Exception) {
                toast("Failed to load: ${e.message}")
            } finally {
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }

    private fun confirmDelete(r: Review) {
        AlertDialog.Builder(this)
            .setMessage("Delete this review?")
            .setPositiveButton("Delete") { _, _ ->
                lifecycleScope.launch {
                    try {
                        val res = ApiClient.api.deleteReview(r.id)
                        toast(res.body()?.message ?: "Deleted")
                        load()
                    } catch (e: Exception) {
                        toast("Error: ${e.message}")
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
