package com.francirene.eduapp.ui

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.francirene.eduapp.databinding.ActivitySplashBinding
import com.francirene.eduapp.network.ApiClient
import kotlinx.coroutines.launch

class SplashActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySplashBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        lifecycleScope.launch {
            val next = try {
                val res = ApiClient.api.session()
                val body = res.body()
                when {
                    body?.role == "admin" -> Intent(this@SplashActivity, AdminDashboardActivity::class.java)
                    body?.role == "parent" -> Intent(this@SplashActivity, ParentDashboardActivity::class.java)
                    body?.role == "student" -> Intent(this@SplashActivity, StudentDashboardActivity::class.java)
                    else -> Intent(this@SplashActivity, RoleSelectActivity::class.java)
                }
            } catch (e: Exception) {
                Intent(this@SplashActivity, RoleSelectActivity::class.java)
            }
            startActivity(next)
            finish()
        }
    }
}
