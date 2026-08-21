package com.francirene.eduapp.ui

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.francirene.eduapp.adapter.ResourceAdapter
import com.francirene.eduapp.adapter.ReviewAdapter
import com.francirene.eduapp.adapter.TimetableAdapter
import com.francirene.eduapp.databinding.ActivityParentDashboardBinding
import com.francirene.eduapp.network.ApiClient
import com.francirene.eduapp.util.toast
import kotlinx.coroutines.launch

class ParentDashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityParentDashboardBinding
    private lateinit var resourceAdapter: ResourceAdapter
    private lateinit var timetableAdapter: TimetableAdapter
    private lateinit var reviewAdapter: ReviewAdapter
    private var studentId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityParentDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        resourceAdapter = ResourceAdapter(emptyList())
        timetableAdapter = TimetableAdapter(emptyList())
        reviewAdapter = ReviewAdapter(emptyList())

        binding.recyclerResources.layoutManager = LinearLayoutManager(this)
        binding.recyclerResources.adapter = resourceAdapter
        binding.recyclerTimetables.layoutManager = LinearLayoutManager(this)
        binding.recyclerTimetables.adapter = timetableAdapter
        binding.recyclerReviews.layoutManager = LinearLayoutManager(this)
        binding.recyclerReviews.adapter = reviewAdapter

        binding.btnLogout.setOnClickListener { logout() }
        binding.swipeRefresh.setOnRefreshListener { loadAll() }

        loadSessionThenData()
    }

    private fun loadSessionThenData() {
        lifecycleScope.launch {
            try {
                val session = ApiClient.api.session().body()
                val parent = session?.parent
                if (parent != null) {
                    studentId = parent.studentId
                    binding.tvWelcome.text = "Welcome, ${parent.childName}'s guardian"
                }
            } catch (e: Exception) {
                toast("Couldn't load session: ${e.message}")
            }
            loadAll()
        }
    }

    private fun loadAll() {
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            try {
                val resources = ApiClient.api.resources().body()?.resources ?: emptyList()
                resourceAdapter.update(resources)
            } catch (e: Exception) { /* ignore, keep previous list */ }

            try {
                val timetables = ApiClient.api.timetables().body()?.timetables ?: emptyList()
                timetableAdapter.update(timetables)
            } catch (e: Exception) { }

            try {
                val reviews = ApiClient.api.reviews(studentId).body()?.reviews ?: emptyList()
                reviewAdapter.update(reviews)
            } catch (e: Exception) { }

            binding.swipeRefresh.isRefreshing = false
        }
    }

    private fun logout() {
        lifecycleScope.launch {
            try { ApiClient.api.adminLogout() } catch (e: Exception) { }
            ApiClient.cookieJar.clear()
            startActivity(Intent(this@ParentDashboardActivity, RoleSelectActivity::class.java))
            finish()
        }
    }
}
