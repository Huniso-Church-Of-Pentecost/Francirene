package com.francirene.eduapp.ui

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.francirene.eduapp.R
import com.francirene.eduapp.databinding.ActivityAdminDashboardBinding
import com.francirene.eduapp.network.ApiClient
import com.francirene.eduapp.util.toast
import kotlinx.coroutines.launch

class AdminDashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAdminDashboardBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.menuEnrollments.tvLabel.text = "Enrollments"
        binding.menuEnrollments.ivIcon.setImageResource(R.drawable.ic_people)
        binding.menuEnrollments.root.setOnClickListener { startActivity(Intent(this, AdminEnrollmentsActivity::class.java)) }

        binding.menuResources.tvLabel.text = "Resources"
        binding.menuResources.ivIcon.setImageResource(R.drawable.ic_book)
        binding.menuResources.root.setOnClickListener { startActivity(Intent(this, AdminResourcesActivity::class.java)) }

        binding.menuTimetables.tvLabel.text = "Timetables"
        binding.menuTimetables.ivIcon.setImageResource(R.drawable.ic_calendar)
        binding.menuTimetables.root.setOnClickListener { startActivity(Intent(this, AdminTimetablesActivity::class.java)) }

        binding.menuReviews.tvLabel.text = "Student Reviews"
        binding.menuReviews.ivIcon.setImageResource(R.drawable.ic_star)
        binding.menuReviews.root.setOnClickListener { startActivity(Intent(this, AdminReviewsActivity::class.java)) }

        binding.menuSettings.tvLabel.text = "Settings"
        binding.menuSettings.ivIcon.setImageResource(R.drawable.ic_settings)
        binding.menuSettings.root.setOnClickListener { startActivity(Intent(this, AdminSettingsActivity::class.java)) }

        binding.btnLogout.setOnClickListener { logout() }
    }

    private fun logout() {
        lifecycleScope.launch {
            try {
                ApiClient.api.adminLogout()
            } catch (e: Exception) {
                // ignore network errors on logout, clear local state regardless
            }
            ApiClient.cookieJar.clear()
            toast("Logged out")
            startActivity(Intent(this@AdminDashboardActivity, RoleSelectActivity::class.java))
            finish()
        }
    }
}
