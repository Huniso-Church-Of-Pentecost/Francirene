package com.francirene.eduapp.ui

import android.os.Bundle
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.francirene.eduapp.adapter.TimetableAdapter
import com.francirene.eduapp.databinding.ActivityAdminTimetablesBinding
import com.francirene.eduapp.model.CreateTimetableRequest
import com.francirene.eduapp.model.Timetable
import com.francirene.eduapp.network.ApiClient
import com.francirene.eduapp.util.errorMessageOrDefault
import com.francirene.eduapp.util.toast
import kotlinx.coroutines.launch

class AdminTimetablesActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAdminTimetablesBinding
    private lateinit var adapter: TimetableAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminTimetablesBinding.inflate(layoutInflater)
        setContentView(binding.root)
        title = "Timetables"

        adapter = TimetableAdapter(emptyList(), showDelete = true, onDelete = { confirmDelete(it) })
        binding.recyclerView.layoutManager = LinearLayoutManager(this)
        binding.recyclerView.adapter = adapter

        binding.btnCreate.setOnClickListener { create() }
        binding.swipeRefresh.setOnRefreshListener { load() }
        load()
    }

    private fun create() {
        val title = binding.etTitle.text?.toString()?.trim().orEmpty()
        val startDate = binding.etStartDate.text?.toString()?.trim().orEmpty()
        val endDate = binding.etEndDate.text?.toString()?.trim().orEmpty()
        val classes = binding.etClasses.text?.toString()?.trim().orEmpty()
        val repeatWeeks = binding.etRepeatWeeks.text?.toString()?.trim()?.toIntOrNull()

        if (title.isEmpty()) {
            toast("Enter a title")
            return
        }

        lifecycleScope.launch {
            try {
                val res = ApiClient.api.createTimetable(
                    CreateTimetableRequest(title, startDate, endDate, classes, repeatWeeks)
                )
                if (res.isSuccessful && res.body()?.success == true) {
                    toast("Timetable created")
                    binding.etTitle.text?.clear()
                    binding.etStartDate.text?.clear()
                    binding.etEndDate.text?.clear()
                    binding.etClasses.text?.clear()
                    binding.etRepeatWeeks.text?.clear()
                    load()
                } else {
                    toast(res.body()?.message ?: res.errorMessageOrDefault("Failed to create timetable"))
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
                val res = ApiClient.api.timetables()
                adapter.update(res.body()?.timetables ?: emptyList())
            } catch (e: Exception) {
                toast("Failed to load: ${e.message}")
            } finally {
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }

    private fun confirmDelete(t: Timetable) {
        AlertDialog.Builder(this)
            .setMessage("Delete \"${t.title}\"?")
            .setPositiveButton("Delete") { _, _ ->
                lifecycleScope.launch {
                    try {
                        val res = ApiClient.api.deleteTimetable(t.id)
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
