package com.francirene.eduapp.ui

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.francirene.eduapp.databinding.ActivityAdminLoginBinding
import com.francirene.eduapp.model.AdminLoginRequest
import com.francirene.eduapp.network.ApiClient
import com.francirene.eduapp.util.errorMessageOrDefault
import com.francirene.eduapp.util.toast
import kotlinx.coroutines.launch

class AdminLoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAdminLoginBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnLogin.setOnClickListener { login() }
    }

    private fun login() {
        val username = binding.etUsername.text?.toString()?.trim().orEmpty()
        val password = binding.etPassword.text?.toString().orEmpty()
        if (username.isEmpty() || password.isEmpty()) {
            toast("Enter username and password")
            return
        }

        setLoading(true)
        lifecycleScope.launch {
            try {
                val res = ApiClient.api.adminLogin(AdminLoginRequest(username, password))
                if (res.isSuccessful && res.body()?.success == true) {
                    startActivity(Intent(this@AdminLoginActivity, AdminDashboardActivity::class.java))
                    finish()
                } else {
                    toast(res.body()?.message ?: res.errorMessageOrDefault("Login failed"))
                }
            } catch (e: Exception) {
                toast("Network error: ${e.message}")
            } finally {
                setLoading(false)
            }
        }
    }

    private fun setLoading(loading: Boolean) {
        binding.progress.visibility = if (loading) android.view.View.VISIBLE else android.view.View.GONE
        binding.btnLogin.isEnabled = !loading
    }
}
