package com.francirene.eduapp.ui

import android.net.Uri
import android.os.Bundle
import android.widget.ArrayAdapter
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.francirene.eduapp.adapter.ResourceAdapter
import com.francirene.eduapp.databinding.ActivityAdminResourcesBinding
import com.francirene.eduapp.model.Resource
import com.francirene.eduapp.network.ApiClient
import com.francirene.eduapp.util.errorMessageOrDefault
import com.francirene.eduapp.util.toast
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream

class AdminResourcesActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAdminResourcesBinding
    private lateinit var adapter: ResourceAdapter
    private var selectedFileUri: Uri? = null

    private val pickFileLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            selectedFileUri = uri
            binding.tvSelectedFile.text = uri.lastPathSegment ?: "1 file selected"
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminResourcesBinding.inflate(layoutInflater)
        setContentView(binding.root)
        title = "Resources"

        adapter = ResourceAdapter(
            emptyList(),
            showDelete = true,
            onDelete = { confirmDelete(it) }
        )
        binding.recyclerView.layoutManager = LinearLayoutManager(this)
        binding.recyclerView.adapter = adapter

        binding.btnPickFile.setOnClickListener { pickFileLauncher.launch("*/*") }
        binding.btnUpload.setOnClickListener { upload() }
        binding.swipeRefresh.setOnRefreshListener { load() }

        loadSubjects()
        load()
    }

    private fun loadSubjects() {
        lifecycleScope.launch {
            try {
                val res = ApiClient.api.subjects()
                val subjects = res.body()?.subjects ?: emptyList()
                binding.spinnerSubject.adapter = ArrayAdapter(this@AdminResourcesActivity, android.R.layout.simple_spinner_dropdown_item, subjects)
            } catch (e: Exception) {
                toast("Couldn't load subjects: ${e.message}")
            }
        }
    }

    private fun load() {
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            try {
                val res = ApiClient.api.resources()
                adapter.update(res.body()?.resources ?: emptyList())
            } catch (e: Exception) {
                toast("Failed to load: ${e.message}")
            } finally {
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }

    private fun upload() {
        val title = binding.etTitle.text?.toString()?.trim().orEmpty()
        val subject = binding.spinnerSubject.selectedItem?.toString().orEmpty()
        val description = binding.etDescription.text?.toString()?.trim().orEmpty()
        val uri = selectedFileUri

        if (title.isEmpty() || uri == null) {
            toast("Add a title and choose a file")
            return
        }

        binding.progressUpload.visibility = android.view.View.VISIBLE
        binding.btnUpload.isEnabled = false

        lifecycleScope.launch {
            try {
                val tempFile = copyUriToTempFile(uri)
                val filePart = MultipartBody.Part.createFormData(
                    "file", tempFile.name, tempFile.asRequestBody("application/octet-stream".toMediaTypeOrNull())
                )
                val res = ApiClient.api.uploadResource(
                    filePart,
                    title.toRequestBody("text/plain".toMediaTypeOrNull()),
                    subject.toRequestBody("text/plain".toMediaTypeOrNull()),
                    description.toRequestBody("text/plain".toMediaTypeOrNull())
                )
                if (res.isSuccessful && res.body()?.success == true) {
                    toast("Resource uploaded")
                    binding.etTitle.text?.clear()
                    binding.etDescription.text?.clear()
                    binding.tvSelectedFile.text = "No file selected"
                    selectedFileUri = null
                    load()
                } else {
                    toast(res.body()?.message ?: res.errorMessageOrDefault("Upload failed"))
                }
                tempFile.delete()
            } catch (e: Exception) {
                toast("Upload error: ${e.message}")
            } finally {
                binding.progressUpload.visibility = android.view.View.GONE
                binding.btnUpload.isEnabled = true
            }
        }
    }

    private fun copyUriToTempFile(uri: Uri): File {
        val name = uri.lastPathSegment?.substringAfterLast('/') ?: "upload_${System.currentTimeMillis()}"
        val tempFile = File(cacheDir, name)
        contentResolver.openInputStream(uri)?.use { input ->
            FileOutputStream(tempFile).use { output -> input.copyTo(output) }
        }
        return tempFile
    }

    private fun confirmDelete(r: Resource) {
        AlertDialog.Builder(this)
            .setMessage("Delete \"${r.title}\"?")
            .setPositiveButton("Delete") { _, _ ->
                lifecycleScope.launch {
                    try {
                        val res = ApiClient.api.deleteResource(r.id)
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
