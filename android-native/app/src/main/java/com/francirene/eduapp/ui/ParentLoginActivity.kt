package com.francirene.eduapp.ui

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.francirene.eduapp.databinding.ActivityParentLoginBinding
import com.francirene.eduapp.model.ParentLoginRequest
import com.francirene.eduapp.network.ApiClient
import com.francirene.eduapp.util.errorMessageOrDefault
import com.francirene.eduapp.util.toast
import kotlinx.coroutines.launch

class ParentLoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityParentLoginBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityParentLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnLogin.setOnClickListener { login() }
    }

    private fun login() {
        val parentId = binding.etParentId.text?.toString()?.trim().orEmpty()
        val password = binding.etPassword.text?.toString().orEmpty()
        if (parentId.isEmpty() || password.isEmpty()) {
            toast("Enter Parent ID and password")
            return
        }

        setLoading(true)
        lifecycleScope.launch {
            try {
                val res = ApiClient.api.parentLogin(ParentLoginRequest(parentId, password))
                if (res.isSuccessful && res.body()?.success == true) {
                    startActivity(Intent(this@ParentLoginActivity, ParentDashboardActivity::class.java))
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
