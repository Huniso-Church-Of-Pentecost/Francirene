package com.francirene.eduapp.ui

import android.os.Bundle
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.francirene.eduapp.adapter.EnrollmentAdapter
import com.francirene.eduapp.databinding.ActivityAdminEnrollmentsBinding
import com.francirene.eduapp.model.ApproveRejectRequest
import com.francirene.eduapp.model.Enrollment
import com.francirene.eduapp.network.ApiClient
import com.francirene.eduapp.util.errorMessageOrDefault
import com.francirene.eduapp.util.toast
import kotlinx.coroutines.launch

class AdminEnrollmentsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAdminEnrollmentsBinding
    private lateinit var adapter: EnrollmentAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminEnrollmentsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        title = "Enrollments"

        adapter = EnrollmentAdapter(
            emptyList(),
            onApprove = { confirmAction("Approve ${it.childName}'s enrollment?") { doApprove(it) } },
            onReject = { confirmAction("Reject ${it.childName}'s enrollment?") { doReject(it) } },
            onDelete = { confirmAction("Permanently delete ${it.childName}'s enrollment?") { doDelete(it) } }
        )
        binding.recyclerView.layoutManager = LinearLayoutManager(this)
        binding.recyclerView.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener { load() }
        load()
    }

    private fun confirmAction(message: String, onConfirm: () -> Unit) {
        AlertDialog.Builder(this)
            .setMessage(message)
            .setPositiveButton("Yes") { _, _ -> onConfirm() }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun load() {
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            try {
                val res = ApiClient.api.enrollments()
                val list = res.body()?.enrollments ?: emptyList()
                adapter.update(list)
                binding.tvEmpty.visibility = if (list.isEmpty()) android.view.View.VISIBLE else android.view.View.GONE
            } catch (e: Exception) {
                toast("Failed to load: ${e.message}")
            } finally {
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }

    private fun doApprove(e: Enrollment) {
        lifecycleScope.launch {
            try {
                val res = ApiClient.api.approveEnrollment(ApproveRejectRequest(e.id))
                toast(res.body()?.message ?: "Done")
                load()
            } catch (ex: Exception) {
                toast("Error: ${ex.message}")
            }
        }
    }

    private fun doReject(e: Enrollment) {
        lifecycleScope.launch {
            try {
                val res = ApiClient.api.rejectEnrollment(ApproveRejectRequest(e.id))
                toast(res.body()?.message ?: "Done")
                load()
            } catch (ex: Exception) {
                toast("Error: ${ex.message}")
            }
        }
    }

    private fun doDelete(e: Enrollment) {
        lifecycleScope.launch {
            try {
                val res = ApiClient.api.deleteEnrollment(e.id)
                toast(res.body()?.message ?: "Deleted")
                load()
            } catch (ex: Exception) {
                toast("Error: ${ex.message}")
            }
        }
    }
}
