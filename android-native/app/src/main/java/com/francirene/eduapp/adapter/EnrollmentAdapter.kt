package com.francirene.eduapp.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.francirene.eduapp.databinding.ItemEnrollmentBinding
import com.francirene.eduapp.model.Enrollment

class EnrollmentAdapter(
    private var items: List<Enrollment>,
    private val onApprove: (Enrollment) -> Unit,
    private val onReject: (Enrollment) -> Unit,
    private val onDelete: (Enrollment) -> Unit
) : RecyclerView.Adapter<EnrollmentAdapter.VH>() {

    inner class VH(val binding: ItemEnrollmentBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemEnrollmentBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun getItemCount() = items.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val e = items[position]
        holder.binding.tvChildName.text = e.childName
        holder.binding.tvDetails.text = "Guardian: ${e.guardianName} • ${e.guardianEmail}\nService: ${e.serviceType}\nSubjects: ${e.subjects?.joinToString(", ") ?: ""}"
        holder.binding.tvStatus.text = "Status: ${e.status.uppercase()}"

        val isPending = e.status.equals("pending", ignoreCase = true)
        holder.binding.btnApprove.isEnabled = isPending
        holder.binding.btnReject.isEnabled = isPending

        holder.binding.btnApprove.setOnClickListener { onApprove(e) }
        holder.binding.btnReject.setOnClickListener { onReject(e) }
        holder.binding.btnDelete.setOnClickListener { onDelete(e) }
    }

    fun update(newItems: List<Enrollment>) {
        items = newItems
        notifyDataSetChanged()
    }
}
