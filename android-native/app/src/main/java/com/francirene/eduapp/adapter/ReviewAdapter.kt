package com.francirene.eduapp.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.francirene.eduapp.databinding.ItemReviewBinding
import com.francirene.eduapp.model.Review

class ReviewAdapter(
    private var items: List<Review>,
    private val showDelete: Boolean = false,
    private val onDelete: ((Review) -> Unit)? = null
) : RecyclerView.Adapter<ReviewAdapter.VH>() {

    inner class VH(val binding: ItemReviewBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemReviewBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun getItemCount() = items.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val r = items[position]
        holder.binding.tvTitle.text = "Student ${r.studentId} — ${r.createdAt ?: ""}"
        holder.binding.tvMeta1.text = "Academic: ${r.academicPerformance ?: "-"}   Behavior: ${r.behavior ?: "-"}   Attendance: ${r.attendance ?: "-"}"
        holder.binding.tvMeta2.text = "Remarks: ${r.teacherRemarks ?: "-"}\nAdvice: ${r.parentalAdvice ?: "-"}"

        if (showDelete) {
            holder.binding.btnDelete.visibility = android.view.View.VISIBLE
            holder.binding.btnDelete.setOnClickListener { onDelete?.invoke(r) }
        }
    }

    fun update(newItems: List<Review>) {
        items = newItems
        notifyDataSetChanged()
    }
}
